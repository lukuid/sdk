// SPDX-License-Identifier: Apache-2.0
import type { SerialPort } from 'serialport';
import {
  encodeFrame,
  LukuDecoder
} from '@lukuid/core';
import type {
  Connection,
  DeviceCandidate,
  DeviceDescriptor,
  DeviceInfo,
  Transport,
  TransportWatchHandler,
  WatcherHandle
} from '@lukuid/core';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const TRANSPORT_NAME = 'serial';
const SERIAL_LOCK_WAIT_MS = 10000;
const SERIAL_OPEN_RETRY_WINDOW_MS = 10000;
const SERIAL_OPEN_RETRY_INTERVAL_MS = 75;
type SerialPortInfo = Awaited<ReturnType<typeof import('serialport')['SerialPort']['list']>>[number] & {
  friendlyName?: string | null;
};
const nodeRequire = createRequire(resolveModuleSpecifier());

export interface SerialTransportOptions {
  allowlist?: Array<{ vendorId: number | string; productId: number | string }>;
  baudRate?: number;
  pollIntervalMs?: number;
  debugLogging?: boolean;
  logger?: (level: 'debug' | 'warn' | 'error', message: string, context?: Record<string, unknown>) => void;
}

interface SerialDiscoveredDevice extends DeviceDescriptor {
  info?: DeviceInfo;
}

export function createSerialTransport(options: SerialTransportOptions = {}): Transport {
  const normalized = normalizeOptions(options);
  const transport: Transport & {
    inspectConnected: () => Promise<SerialDiscoveredDevice[]>;
  } = {
    name: TRANSPORT_NAME,
    isSupported: () => hasSerialDependency(),
    listConnected: () => listPorts(normalized),
    inspectConnected: () => inspectPorts(normalized),
    startWatching: async (handler: TransportWatchHandler): Promise<WatcherHandle> => {
      if (!hasSerialDependency()) {
        return { stop: () => undefined };
      }

      const seen = new Map<string, DeviceCandidate<SerialPortInfo>>();
      let stopped = false;

      const refresh = async () => {
        if (stopped) {
          return;
        }

        const ports = await listPorts(normalized);
        const next = new Map<string, DeviceCandidate<SerialPortInfo>>();
        for (const candidate of ports) {
          next.set(candidate.transportId, candidate);
          if (!seen.has(candidate.transportId)) {
            seen.set(candidate.transportId, candidate);
            handler({ kind: 'added', candidate });
          }
        }

        for (const [id, candidate] of seen) {
          if (!next.has(id)) {
            seen.delete(id);
            handler({ kind: 'removed', candidate });
          }
        }
      };

      const interval = setInterval(() => {
        void refresh();
      }, normalized.pollIntervalMs);

      void refresh();

      return {
        stop: () => {
          stopped = true;
          clearInterval(interval);
          seen.clear();
        }
      };
    },
    open: (candidate: DeviceCandidate<SerialPortInfo>) => openSerialConnection(candidate.native, normalized)
  };

  return transport;
}

async function listPorts(options: NormalizedOptions): Promise<DeviceCandidate<SerialPortInfo>[]> {
  const mod = await loadSerialPort();
  if (!mod) {
    log(options, 'debug', 'serialport module unavailable for listPorts');
    return [];
  }

  const ports = await mod.SerialPort.list();
  const allowed = ports
    .filter((port) => isAllowed(port, options.allowlist))
    .map((port) => toCandidate(port));

  log(options, 'debug', 'Serial port snapshot', {
    totalPorts: ports.length,
    allowedPorts: allowed.length,
    paths: allowed.map((candidate) => candidate.native.path)
  });

  return allowed;
}

async function inspectPorts(options: NormalizedOptions): Promise<SerialDiscoveredDevice[]> {
  const mod = await loadSerialPort();
  if (!mod) {
    log(options, 'debug', 'serialport module unavailable for inspectPorts');
    return [];
  }

  const ports = await mod.SerialPort.list();
  const candidates = ports
    .filter((port) => isAllowed(port, options.allowlist))
    .map((port) => toCandidate(port));

  const inspections = await Promise.all(
    candidates.map((candidate) => inspectPort(candidate, options).catch((error) => {
      log(options, 'warn', 'Serial port inspection failed', {
        path: candidate.native.path,
        transportId: candidate.transportId,
        error: serializeError(error)
      });
      return null;
    }))
  );

  const discovered = inspections.filter((item: SerialDiscoveredDevice | null): item is SerialDiscoveredDevice => item !== null);
  log(options, 'debug', 'Serial port inspection complete', {
    candidates: candidates.length,
    discovered: discovered.length
  });
  return discovered;
}

function toCandidate(port: SerialPortInfo): DeviceCandidate<SerialPortInfo> {
  const descriptor: DeviceDescriptor = {
    transportId: buildPortId(port),
    transport: TRANSPORT_NAME,
    name: port.friendlyName ?? port.path,
    meta: {
      path: port.path,
      vendorId: port.vendorId ?? undefined,
      productId: port.productId ?? undefined
    }
  };

  return {
    ...descriptor,
    native: port
  };
}

async function openSerialConnection(portInfo: SerialPortInfo, options: NormalizedOptions): Promise<Connection> {
  const mod = await loadSerialPort();
  if (!mod) {
    throw new Error('serialport module is unavailable');
  }

  log(options, 'debug', 'Opening serial connection', {
    path: portInfo.path,
    baudRate: options.baudRate
  });

  const releaseLock = await acquireSerialPathLock(portInfo.path, options);
  let port: SerialPort | undefined;

  try {
    port = await openSerialPortWithRetry(mod, portInfo.path, options);
  } catch (error) {
    releaseLock();
    throw error;
  }

  const listeners = new Set<(chunk: Uint8Array) => void>();
  const dataListener = (chunk: Buffer) => {
    const copy = Uint8Array.from(chunk);
    for (const listener of listeners) {
      listener(copy);
    }
  };

  port.on('data', dataListener);
  let closed = false;

  return {
    write(data: Uint8Array): Promise<void> {
      return new Promise((resolve, reject) => {
        port.write(Buffer.from(data), (error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    },
    onData(handler) {
      listeners.add(handler);
      return () => listeners.delete(handler);
    },
    async close(): Promise<void> {
      if (closed) {
        return;
      }

      closed = true;
      listeners.clear();
      port.off('data', dataListener);

      await new Promise<void>((resolve) => {
        port.close(() => resolve());
      });
      releaseLock();
    }
  };
}

async function inspectPort(
  candidate: DeviceCandidate<SerialPortInfo>,
  options: NormalizedOptions
): Promise<SerialDiscoveredDevice | null> {
  const mod = await loadSerialPort();
  if (!mod) {
    return null;
  }

  log(options, 'debug', 'Probing serial port for info', {
    path: candidate.native.path,
    transportId: candidate.transportId
  });

  const releaseLock = await acquireSerialPathLock(candidate.native.path, options);
  const port = await openSerialPortWithRetry(mod, candidate.native.path, options).catch((error) => {
    releaseLock();
    throw error;
  });

  try {
    const payload = encodeFrame({
      action: 'info',
      id: 'probe',
      opts: {}
    });

    const info = await new Promise<unknown>((resolve, reject) => {
      const decoder = new LukuDecoder();
      const timeout = setTimeout(() => {
        cleanup();
        resolve(null);
      }, 1500);

      const onData = (chunk: Buffer) => {
        const frames = decoder.push(Uint8Array.from(chunk));
        for (const frame of frames) {
          if (
            frame &&
            typeof frame === 'object' &&
            (frame as Record<string, unknown>).action === 'info'
          ) {
            cleanup();
            resolve(frame);
            return;
          }
        }
      };

      const onError = (error: Error) => {
        cleanup();
        reject(error);
      };

      const cleanup = () => {
        clearTimeout(timeout);
        port.off('data', onData);
        port.off('error', onError);
      };

      port.on('data', onData);
      port.on('error', onError);
      port.write(Buffer.from(payload), (error) => {
        if (error) {
          cleanup();
          reject(error);
          return;
        }
        port.drain((drainError) => {
          if (drainError) {
            cleanup();
            reject(drainError);
          }
        });
      });
    });

    if (!info) {
      log(options, 'debug', 'Serial probe returned no info response', {
        path: candidate.native.path,
        transportId: candidate.transportId
      });
      return null;
    }

    const parsed = parseDiscoveredInfo(info, candidate);
    log(options, 'debug', 'Serial probe succeeded', {
      path: candidate.native.path,
      transportId: candidate.transportId,
      deviceId: parsed.id,
      firmware: parsed.firmware,
      model: parsed.model
    });

    return {
      transportId: candidate.transportId,
      transport: candidate.transport,
      name: candidate.name,
      meta: candidate.meta,
      info: parsed
    };
  } finally {
    await new Promise<void>((resolve) => {
      port.close(() => resolve());
    });
    releaseLock();
  }
}

function parseDiscoveredInfo(payload: unknown, descriptor: DeviceDescriptor): DeviceInfo {
  if (!payload || typeof payload !== 'object') {
    throw new Error('INFO payload is invalid');
  }

  const record = payload as Record<string, unknown>;
  const id = typeof record.id === 'string' ? record.id : undefined;
  if (!id) {
    throw new Error('INFO response missing id');
  }

  const key = typeof record.key === 'string' ? record.key : undefined;
  if (!key) {
    throw new Error('INFO response missing key');
  }

  const slac = record.slac as Record<string, unknown> | undefined;
  const lastSync = typeof slac?.valid_from === 'number' ? slac.valid_from : undefined;
  const counter = typeof record.counter === 'number' ? record.counter : 0;

  return {
    ...descriptor,
    id,
    key,
    capabilities: [],
    firmware: typeof record.firmware === 'string' ? record.firmware : undefined,
    model: typeof record.model === 'string' ? record.model : undefined,
    name: typeof record.name === 'string' ? record.name : descriptor.name,
    verified: false,
    lastSync,
    counter
  };
}

async function waitForOpen(port: SerialPort): Promise<void> {
  if ((port as SerialPort & { isOpen?: boolean }).isOpen) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const handleError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const handleOpen = () => {
      cleanup();
      resolve();
    };

    const cleanup = () => {
      port.off('error', handleError);
      port.off('open', handleOpen);
    };

    port.on('error', handleError);
    port.on('open', handleOpen);
  });
}

async function openSerialPort(port: SerialPort): Promise<void> {
  if ((port as SerialPort & { isOpen?: boolean }).isOpen) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    port.open((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function openSerialPortWithRetry(
  mod: typeof import('serialport'),
  path: string,
  options: NormalizedOptions
): Promise<SerialPort> {
  const deadline = Date.now() + SERIAL_OPEN_RETRY_WINDOW_MS;
  let attempt = 0;
  let lastError: unknown;

  while (Date.now() <= deadline) {
    attempt += 1;
    const port = new mod.SerialPort({
      path,
      baudRate: options.baudRate,
      autoOpen: false
    });

    try {
      await openSerialPort(port);
      await waitForOpen(port);
      return port;
    } catch (error) {
      lastError = error;
      await closePortSilently(port);

      if (!isRetryableSerialOpenError(error) || Date.now() >= deadline) {
        throw error;
      }

      log(options, 'debug', 'Serial open failed but will retry', {
        path,
        attempt,
        error: serializeError(error)
      });
      await delay(SERIAL_OPEN_RETRY_INTERVAL_MS);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Failed to open serial port ${path}`);
}

async function closePortSilently(port: SerialPort): Promise<void> {
  if (!(port as SerialPort & { isOpen?: boolean }).isOpen) {
    return;
  }

  await new Promise<void>((resolve) => {
    port.close(() => resolve());
  });
}

function isRetryableSerialOpenError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes('exclusive lock')
    || message.includes('resource busy')
    || message.includes('busy')
    || message.includes('in use')
    || message.includes('temporarily unavailable')
    || message.includes('permission denied')
    || message.includes('no such file');
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface SerialPathLockState {
  locked: boolean;
  waiters: Array<{
    resolve: (release: () => void) => void;
    reject: (error: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  }>;
}

const serialPathLocks = new Map<string, SerialPathLockState>();

async function acquireSerialPathLock(path: string, options: NormalizedOptions): Promise<() => void> {
  log(options, 'debug', 'Waiting for serial path lock', { path, timeoutMs: SERIAL_LOCK_WAIT_MS });

  return new Promise<() => void>((resolve, reject) => {
    const state = serialPathLocks.get(path) ?? { locked: false, waiters: [] };
    serialPathLocks.set(path, state);

    const grant = () => {
      state.locked = true;
      resolve(() => releaseSerialPathLock(path));
    };

    if (!state.locked) {
      grant();
      return;
    }

    const timer = setTimeout(() => {
      state.waiters = state.waiters.filter((waiter) => waiter.timer !== timer);
      reject(new Error(`Timed out waiting ${SERIAL_LOCK_WAIT_MS}ms for serial path ${path}`));
    }, SERIAL_LOCK_WAIT_MS);

    state.waiters.push({ resolve, reject, timer });
  });
}

function releaseSerialPathLock(path: string): void {
  const state = serialPathLocks.get(path);
  if (!state) {
    return;
  }

  const next = state.waiters.shift();
  if (!next) {
    state.locked = false;
    serialPathLocks.delete(path);
    return;
  }

  clearTimeout(next.timer);
  state.locked = true;
  next.resolve(() => releaseSerialPathLock(path));
}

function isAllowed(port: SerialPortInfo, allowlist: Array<{ vendorId: string; productId: string }>): boolean {
  if (allowlist.length === 0) {
    return true;
  }

  const vid = normalizeId(port.vendorId);
  const pid = normalizeId(port.productId);
  return allowlist.some((entry) => entry.vendorId === vid && entry.productId === pid);
}

function normalizeId(value?: string | number | null): string {
  if (value === undefined || value === null) {
    return '0000';
  }

  const num = typeof value === 'string' ? parseInt(value, 16) : value;
  return Number.isNaN(num) ? '0000' : Number(num).toString(16).padStart(4, '0').toLowerCase();
}

function buildPortId(port: SerialPortInfo): string {
  const vid = normalizeId(port.vendorId);
  const pid = normalizeId(port.productId);
  const serial = port.serialNumber ?? port.path;
  return `${TRANSPORT_NAME}:${vid}:${pid}:${serial}`;
}

interface NormalizedOptions {
  allowlist: Array<{ vendorId: string; productId: string }>;
  baudRate: number;
  pollIntervalMs: number;
  debugLogging: boolean;
  logger?: (level: 'debug' | 'warn' | 'error', message: string, context?: Record<string, unknown>) => void;
}

function normalizeOptions(options: SerialTransportOptions): NormalizedOptions {
  const allowlist = (options.allowlist ?? []).map((entry) => ({
    vendorId: normalizeId(entry.vendorId),
    productId: normalizeId(entry.productId)
  }));

  return {
    allowlist,
    baudRate: options.baudRate ?? 115200,
    pollIntervalMs: Math.max(1000, options.pollIntervalMs ?? 3000),
    debugLogging: options.debugLogging ?? false,
    logger: options.logger
  };
}

function log(
  options: NormalizedOptions,
  level: 'debug' | 'warn' | 'error',
  message: string,
  context?: Record<string, unknown>
): void {
  options.logger?.(level, message, context);

  if (!options.logger) {
    if (level === 'debug' && !options.debugLogging) {
      return;
    }

    const payload = context ? `${message} ${JSON.stringify(context)}` : message;
    const target =
      level === 'error' ? console.error : level === 'warn' ? console.warn : console.debug;
    target(`[lukuid:serial] ${payload}`);
  }
}

function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return { name: error.name, message: error.message };
  }

  return { message: String(error) };
}

function resolveModuleSpecifier(): string {
  if (typeof __filename !== 'undefined') {
    return __filename;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    return (Function('return import.meta.url') as () => string)();
  } catch {
    return join(process.cwd(), 'package.json');
  }
}

function isNodeLike(): boolean {
  return typeof process !== 'undefined' && Boolean(process.versions?.node);
}

let serialModule: typeof import('serialport') | null | undefined;
let serialDependencyAvailable: boolean | null = null;

async function loadSerialPort(): Promise<typeof import('serialport') | null> {
  if (serialModule !== undefined) {
    return serialModule;
  }

  if (!hasSerialDependency()) {
    serialModule = null;
    return serialModule;
  }

  try {
    serialModule = await import('serialport');
  } catch {
    serialModule = null;
  }

  return serialModule;
}

function hasSerialDependency(): boolean {
  if (serialDependencyAvailable !== null) {
    return serialDependencyAvailable;
  }

  if (!isNodeLike()) {
    serialDependencyAvailable = false;
    return serialDependencyAvailable;
  }

  try {
    nodeRequire.resolve('serialport');
    serialDependencyAvailable = true;
  } catch {
    serialDependencyAvailable = false;
  }

  return serialDependencyAvailable;
}
