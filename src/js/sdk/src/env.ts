// SPDX-License-Identifier: Apache-2.0
import type { TransportRegistry } from './sdk.js';

export async function autoRegisterDefaultTransports(
  registry: TransportRegistry,
  logger: (level: 'debug' | 'warn' | 'error', message: string, context?: Record<string, unknown>) => void,
  debugLogging: boolean
): Promise<void> {
  registry.register(async () => {
    const mod = await import('@lukuid/transport-serial-node');
    const serialOptions = {
      debugLogging,
      logger: (
        level: 'debug' | 'warn' | 'error',
        message: string,
        context?: Record<string, unknown>
      ) => logger(level, message, { transport: 'serial', ...context })
    } as any;
    return mod.createSerialTransport(serialOptions);
  });

  registry.register(async () => {
    const mod = await import('@lukuid/transport-ble-node');
    return mod.createBleTransport();
  });
}

export async function readFileAsUint8Array(input: string): Promise<Uint8Array> {
  const fs = await import('node:fs/promises');
  return new Uint8Array(await fs.readFile(input));
}
