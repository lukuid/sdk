// SPDX-License-Identifier: Apache-2.0
import type { LukuidSdk, LukuidSdkOptions } from './sdk.js';
import type { TransportRegistry } from './sdk.js';

export async function autoRegisterDefaultTransports(
  registry: TransportRegistry,
  logger: (level: 'debug' | 'warn' | 'error', message: string, context?: Record<string, unknown>) => void,
  _debugLogging: boolean
): Promise<void> {
  registry.register(async () => {
    const mod = await import('@lukuid/transport-webusb');
    return mod.createWebUsbTransport();
  });

  registry.register(async () => {
    const mod = await import('@lukuid/transport-webserial');
    return mod.createWebSerialTransport();
  });

  registry.register(async () => {
    const mod = await import('@lukuid/transport-webble');
    return mod.createWebBleTransport();
  });
}

export async function readFileAsUint8Array(input: string): Promise<Uint8Array> {
  throw new Error('Reading from filename is only supported in Node.js');
}
