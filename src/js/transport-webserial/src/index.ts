// SPDX-License-Identifier: Apache-2.0
import type {
  Connection,
  DeviceCandidate,
  DeviceDescriptor,
  Transport,
  TransportWatchHandler,
  WatcherHandle,
  Unsubscribe
} from '@lukuid/core';

const TRANSPORT_NAME = 'webserial';

export interface WebSerialTransportOptions {
  baudRate?: number;
}

export interface WebSerialRequestOptions {
  filters?: SerialPortFilter[];
}

export function createWebSerialTransport(options: WebSerialTransportOptions = {}): Transport {
  const defaultBaudRate = options.baudRate ?? 115200;

  return {
    name: TRANSPORT_NAME,
    isSupported: () => typeof navigator !== 'undefined' && Boolean(navigator.serial),
    listConnected: async () => {
      const serial = getSerial();
      if (!serial) {
        return [];
      }

      const ports = await serial.getPorts();
      return ports.map((port) => toCandidate(port));
    },
    requestDevice: async (request?: WebSerialRequestOptions) => {
      const serial = getSerial();
      if (!serial) {
        return null;
      }

      try {
        const port = await serial.requestPort({ filters: request?.filters });
        return toCandidate(port);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'NotFoundError') {
          return null;
        }
        throw error;
      }
    },
    startWatching: async (handler: TransportWatchHandler): Promise<WatcherHandle> => {
      const serial = getSerial();
      if (!serial) {
        return { stop: () => undefined };
      }

      const onConnect = (event: Event) => {
        const port = (event as any).port as SerialPort;
        handler({ kind: 'added', candidate: toCandidate(port) });
      };

      const onDisconnect = (event: Event) => {
        const port = (event as any).port as SerialPort;
        handler({ kind: 'removed', candidate: toCandidate(port) });
      };

      serial.addEventListener('connect', onConnect);
      serial.addEventListener('disconnect', onDisconnect);

      return {
        stop: () => {
          serial.removeEventListener('connect', onConnect);
          serial.removeEventListener('disconnect', onDisconnect);
        }
      };
    },
    open: (candidate: DeviceCandidate<SerialPort>) => createConnection(candidate.native, defaultBaudRate)
  };
}

function getSerial(): Serial | undefined {
  if (typeof navigator === 'undefined') {
    return undefined;
  }

  return navigator.serial;
}

function toCandidate(port: SerialPort): DeviceCandidate<SerialPort> {
  const info = port.getInfo();
  const descriptor: DeviceDescriptor = {
    transportId: `${TRANSPORT_NAME}:${info.usbVendorId ?? '0'}:${info.usbProductId ?? '0'}:${(port as any).serialNumber ?? 'unknown'}`,
    name: 'WebSerial Device',
    transport: TRANSPORT_NAME,
    meta: {
      vendorId: info.usbVendorId,
      productId: info.usbProductId
    }
  };

  return {
    ...descriptor,
    native: port
  };
}

async function createConnection(port: SerialPort, baudRate: number): Promise<Connection> {
  if (!port.readable || !port.writable) {
    await port.open({ baudRate });
  }

  const listeners = new Set<(chunk: Uint8Array) => void>();
  let closed = false;
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

  const pump = (async () => {
    while (!closed && port.readable) {
      try {
        reader = port.readable.getReader();
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            break;
          }
          if (value) {
            for (const listener of listeners) {
              listener(value);
            }
          }
        }
      } catch (error) {
        if (!closed) {
          console.error('[lukuid:webserial] read loop failed', error);
        }
      } finally {
        if (reader) {
          reader.releaseLock();
          reader = null;
        }
      }
      
      if (!closed) {
          await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  })();

  const writer = port.writable!.getWriter();

  return {
    async write(data: Uint8Array): Promise<void> {
      await writer.write(data);
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
      
      if (reader) {
          await reader.cancel().catch(() => {});
      }
      
      await writer.close().catch(() => {});
      writer.releaseLock();

      await pump.catch(() => undefined);

      if (port.readable || port.writable) {
        await port.close().catch(() => undefined);
      }
    }
  };
}
