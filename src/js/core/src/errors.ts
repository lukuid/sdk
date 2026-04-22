// SPDX-License-Identifier: Apache-2.0
export class DeviceTrustError extends Error {
  readonly code = 'DEVICE_UNTRUSTED' as const;

  constructor(
    public readonly id: string,
    public readonly reason: string,
    public readonly attemptedKeyIds: string[]
  ) {
    super(`Device ${id} failed attestation: ${reason}`);
    this.name = 'DeviceTrustError';
  }
}
