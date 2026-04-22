// SPDX-License-Identifier: Apache-2.0
import { EventEmitter } from 'events';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import type {
  Connection,
  DeviceCandidate,
  DeviceDescriptor,
  Transport,
  TransportDeviceEvent,
  TransportWatchHandler,
  WatcherHandle
} from '@lukuid/core';

const TRANSPORT_NAME = 'ble-node';
const DEFAULT_SCAN_DURATION_MS = 800;
const CLEANUP_INTERVAL_MS = 5000;
const DEFAULT_STALE_DEVICE_MS = 15000;
const BLE_WRITE_CHUNK_SIZE = 180;

const BLE_UUIDS = {
  SERVICE: '7b7e4f7a-2f0d-4b5a-9d3d-3f0a7e0b9f7c',
  RX: '7b7e4f7a-2f0d-4b5a-9d3d-3f0a7e0b9f7d',
  TX: '7b7e4f7a-2f0d-4b5a-9d3d-3f0a7e0b9f7e'
} as const;
const nodeRequire = createRequire(resolveModuleSpecifier());
let nobleDependencyAvailable: boolean | null = null;

export interface BleTransportOptions {
  scanDurationMs?: number;
  staleDeviceMs?: number;
}

export function createBleTransport(options: BleTransportOptions = {}): Transport {
  const controller = new BleController(options);

  return {
    name: TRANSPORT_NAME,
    isSupported: () => controller.isSupported(),
    listConnected: () => controller.list(),
    startWatching: (handler: TransportWatchHandler) => controller.watch(handler),
    open: (candidate: DeviceCandidate<PeripheralLike>) => controller.open(candidate)
  };
}

class BleController {
  private readonly options: Required<BleTransportOptions>;
  private noble: NobleLike | null = null;
  private loading: Promise<NobleLike | null> | null = null;
  private readonly known = new Map<string, KnownPeripheral>();
  private readonly disconnectDisposers = new Map<string, () => void>();
  private readonly listeners = new Set<TransportWatchHandler>();
  private scanRefs = 0;
  private startPromise: Promise<void> | null = null;
  private stopPromise: Promise<void> | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private readonly onDiscover = (peripheral: PeripheralLike) => this.handleDiscover(peripheral);

  constructor(options: BleTransportOptions) {
    this.options = {
      scanDurationMs: Math.max(200, options.scanDurationMs ?? DEFAULT_SCAN_DURATION_MS),
      staleDeviceMs: Math.max(5000, options.staleDeviceMs ?? DEFAULT_STALE_DEVICE_MS)
    };
  }

  isSupported(): boolean {
    return hasNobleDependency();
  }

  async list(): Promise<DeviceCandidate<PeripheralLike>[]> {
    const noble = await this.getNoble();
    if (!noble) {
      return [];
    }

    await this.scanForDuration(noble, this.options.scanDurationMs);
    return Array.from(this.known.values()).map((entry) => entry.candidate);
  }

  async watch(handler: TransportWatchHandler): Promise<WatcherHandle> {
    const noble = await this.getNoble();
    if (!noble) {
      return { stop: () => undefined };
    }

    this.listeners.add(handler);
    await this.retain(noble);

    return {
      stop: async () => {
        this.listeners.delete(handler);
        await this.release(noble);
      }
    };
  }

  async open(candidate: DeviceCandidate<PeripheralLike>): Promise<Connection> {
    const peripheral = candidate.native;
    await connectPeripheral(peripheral);
    const { rx, tx } = await resolveCharacteristics(peripheral);

    const listeners = new Set<(chunk: Uint8Array) => void>();
    const dataListener = (data: Buffer) => {
      const copy = Uint8Array.from(data);
      for (const listener of listeners) {
        listener(copy);
      }
    };

    tx.on('data', dataListener);
    await subscribe(tx);

    return {
      async write(data: Uint8Array): Promise<void> {
        await write(rx, data);
      },
      onData(handler) {
        listeners.add(handler);
        return () => listeners.delete(handler);
      },
      async close(): Promise<void> {
        listeners.clear();
        tx.off('data', dataListener);
        await unsubscribe(tx);
        await disconnectPeripheral(peripheral);
      }
    };
  }

  private async getNoble(): Promise<NobleLike | null> {
    if (this.noble) {
      return this.noble;
    }

    if (this.loading) {
      return this.loading;
    }

    if (!this.isSupported()) {
      this.noble = null;
      return this.noble;
    }

    this.loading = import('@abandonware/noble')
      .then((mod) => {
        const resolved = (mod as unknown as { default?: NobleLike }).default ?? (mod as unknown as NobleLike);
        return resolved;
      })
      .catch(() => null);

    this.noble = await this.loading;
    this.loading = null;
    return this.noble;
  }

  private async scanForDuration(noble: NobleLike, durationMs: number): Promise<void> {
    await this.retain(noble);
    try {
      await delay(durationMs);
    } finally {
      await this.release(noble);
    }
  }

  private async retain(noble: NobleLike): Promise<void> {
    this.scanRefs += 1;
    if (this.scanRefs === 1) {
      this.startPromise = this.startScanning(noble);
      await this.startPromise;
      this.startPromise = null;
    } else if (this.startPromise) {
      await this.startPromise;
    }
  }

  private async release(noble: NobleLike): Promise<void> {
    if (this.scanRefs === 0) {
      return;
    }

    this.scanRefs -= 1;
    if (this.scanRefs === 0) {
      this.stopPromise = this.stopScanning(noble);
      await this.stopPromise;
      this.stopPromise = null;
    }
  }

  private async startScanning(noble: NobleLike): Promise<void> {
    await ensurePoweredOn(noble);
    noble.on('discover', this.onDiscover);
    this.startCleanupLoop();

    await new Promise<void>((resolve, reject) => {
      noble.startScanning([], true, (error?: Error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  private async stopScanning(noble: NobleLike): Promise<void> {
    await new Promise<void>((resolve) => {
      noble.stopScanning(() => resolve());
    }).catch(() => undefined);

    noble.off('discover', this.onDiscover);
    this.stopCleanupLoopIfIdle();
  }

  private handleDiscover(peripheral: PeripheralLike): void {
    const id = buildPeripheralId(peripheral);
    const candidate = toCandidate(peripheral);
    const now = Date.now();
    const existing = this.known.get(id);
    this.known.set(id, { candidate, lastSeen: now });
    this.attachDisconnect(peripheral, id);

    if (!existing) {
      this.emitToWatchers({ kind: 'added', candidate });
    }
  }

  private attachDisconnect(peripheral: PeripheralLike, id: string): void {
    if (this.disconnectDisposers.has(id)) {
      return;
    }

    const listener = () => {
      this.disconnectDisposers.delete(id);
      const entry = this.known.get(id);
      this.known.delete(id);
      if (entry) {
        this.emitToWatchers({ kind: 'removed', candidate: entry.candidate });
      }
    };

    peripheral.on('disconnect', listener);
    this.disconnectDisposers.set(id, () => {
      peripheral.off('disconnect', listener);
    });
  }

  private emitToWatchers(event: TransportDeviceEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('[lukuid:ble-node] watcher error', error);
      }
    }
  }

  private startCleanupLoop(): void {
    if (this.cleanupTimer) {
      return;
    }

    this.cleanupTimer = setInterval(() => this.pruneStale(), CLEANUP_INTERVAL_MS);
  }

  private stopCleanupLoopIfIdle(): void {
    if (this.cleanupTimer && this.scanRefs === 0 && this.listeners.size === 0) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  private pruneStale(): void {
    const now = Date.now();
    for (const [id, entry] of this.known) {
      if (now - entry.lastSeen > this.options.staleDeviceMs) {
        this.known.delete(id);
        const disposer = this.disconnectDisposers.get(id);
        disposer?.();
        this.disconnectDisposers.delete(id);
        this.emitToWatchers({ kind: 'removed', candidate: entry.candidate });
      }
    }
  }
}

interface KnownPeripheral {
  candidate: DeviceCandidate<PeripheralLike>;
  lastSeen: number;
}

async function connectPeripheral(peripheral: PeripheralLike): Promise<void> {
  if (peripheral.state === 'connected') {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    peripheral.connect((error?: Error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function disconnectPeripheral(peripheral: PeripheralLike): Promise<void> {
  if (peripheral.state === 'disconnected') {
    return;
  }

  await new Promise<void>((resolve) => {
    peripheral.disconnect(() => resolve());
  });
}

async function resolveCharacteristics(peripheral: PeripheralLike): Promise<{
  rx: CharacteristicLike;
  tx: CharacteristicLike;
}> {
  const serviceId = normalizeUuid(BLE_UUIDS.SERVICE);
  const rxId = normalizeUuid(BLE_UUIDS.RX);
  const txId = normalizeUuid(BLE_UUIDS.TX);

  const { characteristics } = await new Promise<{
    services: ServiceLike[];
    characteristics: CharacteristicLike[];
  }>((resolve, reject) => {
    peripheral.discoverSomeServicesAndCharacteristics([serviceId], [rxId, txId], (error, services, chars) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ services, characteristics: chars });
    });
  });

  const map = new Map(characteristics.map((char) => [normalizeUuid(char.uuid), char]));
  const rx = map.get(rxId);
  const tx = map.get(txId);

  if (!rx || !tx) {
    throw new Error('BLE characteristics missing');
  }

  return { rx, tx };
}

async function subscribe(characteristic: CharacteristicLike): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    characteristic.subscribe((error?: Error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function unsubscribe(characteristic: CharacteristicLike): Promise<void> {
  await new Promise<void>((resolve) => {
    characteristic.unsubscribe(() => resolve());
  });
}

async function write(characteristic: CharacteristicLike, data: Uint8Array): Promise<void> {
  for (let offset = 0; offset < data.length; offset += BLE_WRITE_CHUNK_SIZE) {
    const chunk = data.slice(offset, offset + BLE_WRITE_CHUNK_SIZE);
    await new Promise<void>((resolve, reject) => {
      characteristic.write(Buffer.from(chunk), true, (error?: Error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}

async function ensurePoweredOn(noble: NobleLike): Promise<void> {
  if (noble.state === 'poweredOn') {
    return;
  }

  await new Promise<void>((resolve) => {
    const handleStateChange = (state: string) => {
      if (state === 'poweredOn') {
        noble.off('stateChange', handleStateChange);
        resolve();
      }
    };

    noble.on('stateChange', handleStateChange);
  });
}

function toCandidate(peripheral: PeripheralLike): DeviceCandidate<PeripheralLike> {
  const descriptor: DeviceDescriptor = {
    transportId: buildPeripheralId(peripheral),
    name: peripheral.advertisement?.localName ?? 'BLE device',
    transport: TRANSPORT_NAME,
    meta: {
      address: peripheral.address
    }
  };

  return {
    ...descriptor,
    native: peripheral
  };
}

function buildPeripheralId(peripheral: PeripheralLike): string {
  const address = peripheral.address || 'unknown';
  return `${TRANSPORT_NAME}:${address}`;
}

function normalizeUuid(value: string): string {
  return value.replace(/-/g, '').toLowerCase();
}

async function delay(ms: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
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

function hasNobleDependency(): boolean {
  if (nobleDependencyAvailable !== null) {
    return nobleDependencyAvailable;
  }

  if (!isNodeLike()) {
    nobleDependencyAvailable = false;
    return nobleDependencyAvailable;
  }

  try {
    nodeRequire.resolve('@abandonware/noble');
    nobleDependencyAvailable = true;
  } catch {
    nobleDependencyAvailable = false;
  }

  return nobleDependencyAvailable;
}

interface NobleLike extends EventEmitter {
  state: string;
  startScanning(serviceUUIDs: string[], allowDuplicates: boolean, callback?: (error?: Error) => void): void;
  stopScanning(callback?: () => void): void;
  on(event: 'discover', listener: (peripheral: PeripheralLike) => void): this;
  on(event: 'stateChange', listener: (state: string) => void): this;
  off(event: 'discover', listener: (peripheral: PeripheralLike) => void): this;
  off(event: 'stateChange', listener: (state: string) => void): this;
}

interface PeripheralLike extends EventEmitter {
  id: string;
  address: string;
  advertisement?: {
    localName?: string;
  };
  state: string;
  connect(callback: (error?: Error) => void): void;
  disconnect(callback: () => void): void;
  discoverSomeServicesAndCharacteristics(
    serviceUUIDs: string[],
    characteristicUUIDs: string[],
    callback: (error: Error | null, services: ServiceLike[], characteristics: CharacteristicLike[]) => void
  ): void;
}

interface ServiceLike extends EventEmitter {
  uuid: string;
}

interface CharacteristicLike extends EventEmitter {
  uuid: string;
  subscribe(callback: (error?: Error) => void): void;
  unsubscribe(callback: () => void): void;
  write(data: Buffer, withoutResponse: boolean, callback: (error?: Error) => void): void;
}
