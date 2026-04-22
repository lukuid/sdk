// SPDX-License-Identifier: Apache-2.0
import type {
  Connection,
  DeviceCandidate,
  DeviceDescriptor,
  Transport,
  TransportWatchHandler,
  WatcherHandle
} from '@lukuid/core';

const TRANSPORT_NAME = 'webble';

const BLE_UUIDS = {
  SERVICE: '7b7e4f7a-2f0d-4b5a-9d3d-3f0a7e0b9f7c',
  RX: '7b7e4f7a-2f0d-4b5a-9d3d-3f0a7e0b9f7d',
  TX: '7b7e4f7a-2f0d-4b5a-9d3d-3f0a7e0b9f7e'
} as const;
const BLE_WRITE_CHUNK_SIZE = 180;

export interface WebBleTransportOptions {
  pollIntervalMs?: number;
}

export type WebBleRequestOptions = RequestDeviceOptions;

export function createWebBleTransport(options: WebBleTransportOptions = {}): Transport {
  const normalized: Required<WebBleTransportOptions> = {
    pollIntervalMs: Math.max(1000, options.pollIntervalMs ?? 5000)
  };

  return {
    name: TRANSPORT_NAME,
    isSupported: () => typeof navigator !== 'undefined' && Boolean(navigator.bluetooth),
    listConnected: async () => {
      const bluetooth = getBluetooth();
      if (!bluetooth || typeof bluetooth.getDevices !== 'function') {
        return [];
      }

      const devices = await bluetooth.getDevices();
      return devices.map((device) => toCandidate(device));
    },
    requestDevice: async (request?: WebBleRequestOptions) => {
      const bluetooth = getBluetooth();
      if (!bluetooth) {
        return null;
      }

      const normalizedRequest = normalizeRequestOptions(request);
      try {
        const device = await bluetooth.requestDevice(normalizedRequest);
        return toCandidate(device);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'NotFoundError') {
          return null;
        }
        throw error;
      }
    },
    startWatching: async (handler: TransportWatchHandler): Promise<WatcherHandle> => {
      const bluetooth = getBluetooth();
      if (!bluetooth || typeof bluetooth.getDevices !== 'function') {
        return { stop: () => undefined };
      }

      const tracked = new Map<string, BluetoothDevice>();
      let timer: number | null = null;
      let stopped = false;

      const refresh = async () => {
        if (stopped) {
          return;
        }

        try {
          const devices = await bluetooth.getDevices();
          const next = new Map<string, BluetoothDevice>();
          for (const device of devices) {
            next.set(device.id, device);
            if (!tracked.has(device.id)) {
              tracked.set(device.id, device);
              handler({ kind: 'added', candidate: toCandidate(device) });
            }
          }

          for (const [id, existing] of tracked) {
            if (!next.has(id)) {
              tracked.delete(id);
              handler({ kind: 'removed', candidate: toCandidate(existing) });
            }
          }
        } catch (error) {
          console.warn('[lukuid:webble] refresh failed', error);
        }
      };

      timer = window.setInterval(() => {
        void refresh();
      }, normalized.pollIntervalMs);

      void refresh();

      return {
        stop: () => {
          stopped = true;
          if (timer) {
            clearInterval(timer);
            timer = null;
          }
          tracked.clear();
        }
      };
    },
    open: (candidate: DeviceCandidate<BluetoothDevice>) => createConnection(candidate.native)
  };
}

function getBluetooth(): Bluetooth | undefined {
  if (typeof navigator === 'undefined') {
    return undefined;
  }

  return navigator.bluetooth;
}

function toCandidate(device: BluetoothDevice): DeviceCandidate<BluetoothDevice> {
  const descriptor: DeviceDescriptor = {
    transportId: `${TRANSPORT_NAME}:${device.id}`,
    transport: TRANSPORT_NAME,
    name: device.name ?? 'Bluetooth device',
    meta: {
      name: device.name ?? undefined
    }
  };

  return {
    ...descriptor,
    native: device
  };
}

async function createConnection(device: BluetoothDevice): Promise<Connection> {
  if (!device.gatt) {
    throw new Error('WebBluetooth device does not expose GATT');
  }

  const server = device.gatt.connected ? device.gatt : await device.gatt.connect();
  const service = await server.getPrimaryService(BLE_UUIDS.SERVICE);
  const rx = await service.getCharacteristic(BLE_UUIDS.RX);
  const tx = await service.getCharacteristic(BLE_UUIDS.TX);
  await tx.startNotifications();

  const listeners = new Set<(chunk: Uint8Array) => void>();
  const valueListener = (event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    if (!value) {
      return;
    }

    const chunk = new Uint8Array(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength));
    for (const listener of listeners) {
      listener(chunk);
    }
  };

  tx.addEventListener('characteristicvaluechanged', valueListener);
  let closed = false;

  return {
    async write(data: Uint8Array): Promise<void> {
      for (let offset = 0; offset < data.length; offset += BLE_WRITE_CHUNK_SIZE) {
        const chunk = data.slice(offset, offset + BLE_WRITE_CHUNK_SIZE);
        if (typeof (rx as WriteValueWithoutResponse).writeValueWithoutResponse === 'function') {
          await (rx as WriteValueWithoutResponse).writeValueWithoutResponse(chunk as BufferSource);
        } else {
          await rx.writeValue(chunk as BufferSource);
        }
      }
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
      tx.removeEventListener('characteristicvaluechanged', valueListener);
      try {
        await tx.stopNotifications();
      } catch {
        // ignored
      }

      if (server.connected) {
        server.disconnect();
      }
    }
  };
}

type WriteValueWithoutResponse = BluetoothRemoteGATTCharacteristic & {
  writeValueWithoutResponse?(data: BufferSource): Promise<void>;
};

function normalizeRequestOptions(options?: RequestDeviceOptions): RequestDeviceOptions {
  const normalized: RequestDeviceOptions = options ? { ...options } : { acceptAllDevices: true };
  const optionalServices = new Set(normalized.optionalServices ?? []);
  optionalServices.add(BLE_UUIDS.SERVICE);
  normalized.optionalServices = Array.from(optionalServices);
  return normalized;
}
