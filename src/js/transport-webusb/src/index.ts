// SPDX-License-Identifier: Apache-2.0
import type {
  Connection,
  DeviceCandidate,
  DeviceDescriptor,
  Transport,
  TransportWatchHandler,
  WatcherHandle
} from '@lukuid/core';

const TRANSPORT_NAME = 'webusb';
const WEBUSB_LOCK_WAIT_MS = 10000;
const WEBUSB_OPEN_RETRY_WINDOW_MS = 10000;
const WEBUSB_OPEN_RETRY_INTERVAL_MS = 75;

export interface WebUsbTransportOptions {
  interfaceClass?: number;
}

export interface WebUsbRequestOptions {
  filters: USBDeviceFilter[];
}

export function createWebUsbTransport(options: WebUsbTransportOptions = {}): Transport {
  const normalized: WebUsbTransportOptions = { ...options };

  return {
    name: TRANSPORT_NAME,
    isSupported: () => typeof navigator !== 'undefined' && Boolean(navigator.usb),
    listConnected: async () => {
      const usb = getUsb();
      if (!usb) {
        return [];
      }

      const devices = await usb.getDevices();
      return devices.map((device) => toCandidate(device));
    },
    requestDevice: async (request?: WebUsbRequestOptions) => {
      const usb = getUsb();
      if (!usb) {
        return null;
      }

      const filters = request?.filters;
      if (!filters || filters.length === 0) {
        throw new Error('WebUSB requestDevice requires filters');
      }

      try {
        const device = await usb.requestDevice({ filters });
        return toCandidate(device);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'NotFoundError') {
          return null;
        }
        throw error;
      }
    },
    startWatching: async (handler: TransportWatchHandler): Promise<WatcherHandle> => {
      const usb = getUsb();
      if (!usb) {
        return { stop: () => undefined };
      }

      const onConnect = (event: USBConnectionEvent) => {
        handler({ kind: 'added', candidate: toCandidate(event.device) });
      };

      const onDisconnect = (event: USBConnectionEvent) => {
        handler({ kind: 'removed', candidate: toCandidate(event.device) });
      };

      usb.addEventListener('connect', onConnect as EventListener);
      usb.addEventListener('disconnect', onDisconnect as EventListener);

      return {
        stop: () => {
          usb.removeEventListener('connect', onConnect as EventListener);
          usb.removeEventListener('disconnect', onDisconnect as EventListener);
        }
      };
    },
    open: (candidate: DeviceCandidate<USBDevice>) => createConnection(candidate.native, normalized)
  };
}

function getUsb(): USB | undefined {
  if (typeof navigator === 'undefined') {
    return undefined;
  }

  return navigator.usb;
}

function toCandidate(device: USBDevice): DeviceCandidate<USBDevice> {
  const descriptor: DeviceDescriptor = {
    transportId: `${TRANSPORT_NAME}:${device.vendorId}:${device.productId}:${device.serialNumber ?? 'unknown'}`,
    name: device.productName ?? 'WebUSB device',
    transport: TRANSPORT_NAME,
    meta: {
      vendorId: device.vendorId,
      productId: device.productId,
      manufacturerName: device.manufacturerName ?? undefined
    }
  };

  return {
    ...descriptor,
    native: device
  };
}

async function createConnection(device: USBDevice, options: WebUsbTransportOptions): Promise<Connection> {
  const releaseLock = await acquireWebUsbDeviceLock(buildWebUsbLockId(device));
  let claimed: {
    interfaceNumber: number;
    inEndpoint: USBEndpoint;
    outEndpoint: USBEndpoint;
  };

  try {
    claimed = await openWebUsbConnectionWithRetry(device, options);
  } catch (error) {
    releaseLock();
    throw error;
  }

  const listeners = new Set<(chunk: Uint8Array) => void>();
  let closed = false;

  const pump = (async () => {
    while (!closed) {
      try {
        const result = await device.transferIn(claimed.inEndpoint.endpointNumber, claimed.inEndpoint.packetSize ?? 64);
        if (result.status !== 'ok' || !result.data) {
          continue;
        }

        const chunk = new Uint8Array(result.data.buffer.slice(result.data.byteOffset, result.data.byteOffset + result.data.byteLength));
        for (const listener of listeners) {
          listener(chunk);
        }
      } catch (error) {
        if (!closed) {
          console.error('[lukuid:webusb] read loop failed', error);
        }
        break;
      }
    }
  })();

  return {
    async write(data: Uint8Array): Promise<void> {
      await device.transferOut(claimed.outEndpoint.endpointNumber, data as BufferSource);
    },
    onData(handler: (chunk: Uint8Array) => void) {
      listeners.add(handler);
      return () => listeners.delete(handler);
    },
    async close(): Promise<void> {
      if (closed) {
        return;
      }

      closed = true;
      listeners.clear();
      await pump.catch(() => undefined);

      try {
        await device.releaseInterface(claimed.interfaceNumber);
      } catch {
        // ignored
      }

      if (device.opened) {
        await device.close().catch(() => undefined);
      }
      releaseLock();
    }
  };
}

async function openWebUsbConnectionWithRetry(
  device: USBDevice,
  options: WebUsbTransportOptions
): Promise<{
  interfaceNumber: number;
  inEndpoint: USBEndpoint;
  outEndpoint: USBEndpoint;
}> {
  const deadline = Date.now() + WEBUSB_OPEN_RETRY_WINDOW_MS;
  let lastError: unknown;

  while (Date.now() <= deadline) {
    try {
      await ensureReady(device);
      return await claimEndpoints(device, options.interfaceClass);
    } catch (error) {
      lastError = error;

      if (!isRetryableWebUsbOpenError(error) || Date.now() >= deadline) {
        throw error;
      }

      await resetWebUsbDevice(device);
      await delay(WEBUSB_OPEN_RETRY_INTERVAL_MS);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Failed to open WebUSB device');
}

async function ensureReady(device: USBDevice): Promise<void> {
  if (!device.opened) {
    await device.open();
  }

  if (!device.configuration && device.configurations.length > 0) {
    await device.selectConfiguration(device.configurations[0].configurationValue);
  }
}

async function resetWebUsbDevice(device: USBDevice): Promise<void> {
  if (!device.opened) {
    return;
  }

  try {
    for (const intf of device.configuration?.interfaces ?? []) {
      try {
        await device.releaseInterface(intf.interfaceNumber);
      } catch {
        // ignored
      }
    }
  } finally {
    await device.close().catch(() => undefined);
  }
}

async function claimEndpoints(device: USBDevice, interfaceClass?: number): Promise<{
  interfaceNumber: number;
  inEndpoint: USBEndpoint;
  outEndpoint: USBEndpoint;
}> {
  const configuration = device.configuration;
  if (!configuration) {
    throw new Error('USB device missing active configuration');
  }

  const targetInterface = configuration.interfaces.find((intf) =>
    intf.alternates.some((alt) =>
      alt.endpoints.some((endpoint) => endpoint.type === 'bulk' && (interfaceClass === undefined || alt.interfaceClass === interfaceClass))
    )
  );

  if (!targetInterface) {
    throw new Error('Matching WebUSB interface not found');
  }

  const alternate = targetInterface.alternates.find((alt) => alt.endpoints.some((endpoint) => endpoint.type === 'bulk'));
  if (!alternate) {
    throw new Error('USB interface missing bulk endpoints');
  }

  await device.claimInterface(targetInterface.interfaceNumber);

  const inEndpoint = alternate.endpoints.find((endpoint) => endpoint.type === 'bulk' && endpoint.direction === 'in');
  const outEndpoint = alternate.endpoints.find((endpoint) => endpoint.type === 'bulk' && endpoint.direction === 'out');

  if (!inEndpoint || !outEndpoint) {
    throw new Error('Bulk IN/OUT endpoints are required');
  }

  return {
    interfaceNumber: targetInterface.interfaceNumber,
    inEndpoint,
    outEndpoint
  };
}

function isRetryableWebUsbOpenError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const name = 'name' in error ? String((error as Error & { name?: string }).name ?? '') : '';
  const message = error.message.toLowerCase();
  return name === 'NetworkError'
    || name === 'InvalidStateError'
    || name === 'AbortError'
    || message.includes('busy')
    || message.includes('claimed')
    || message.includes('open')
    || message.includes('access denied');
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface WebUsbLockState {
  locked: boolean;
  waiters: Array<{
    resolve: (release: () => void) => void;
    timer: ReturnType<typeof setTimeout>;
  }>;
}

const webUsbLocks = new Map<string, WebUsbLockState>();

async function acquireWebUsbDeviceLock(lockId: string): Promise<() => void> {
  return new Promise<() => void>((resolve, reject) => {
    const state = webUsbLocks.get(lockId) ?? { locked: false, waiters: [] };
    webUsbLocks.set(lockId, state);

    const grant = () => {
      state.locked = true;
      resolve(() => releaseWebUsbDeviceLock(lockId));
    };

    if (!state.locked) {
      grant();
      return;
    }

    const timer = setTimeout(() => {
      state.waiters = state.waiters.filter((waiter) => waiter.timer !== timer);
      reject(new Error(`Timed out waiting ${WEBUSB_LOCK_WAIT_MS}ms for WebUSB device lock ${lockId}`));
    }, WEBUSB_LOCK_WAIT_MS);

    state.waiters.push({ resolve, timer });
  });
}

function releaseWebUsbDeviceLock(lockId: string): void {
  const state = webUsbLocks.get(lockId);
  if (!state) {
    return;
  }

  const next = state.waiters.shift();
  if (!next) {
    state.locked = false;
    webUsbLocks.delete(lockId);
    return;
  }

  clearTimeout(next.timer);
  state.locked = true;
  next.resolve(() => releaseWebUsbDeviceLock(lockId));
}

function buildWebUsbLockId(device: USBDevice): string {
  return `${device.vendorId}:${device.productId}:${device.serialNumber ?? device.productName ?? 'unknown'}`;
}
