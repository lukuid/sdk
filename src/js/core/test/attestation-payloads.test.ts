// SPDX-License-Identifier: Apache-2.0
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildRecordAttestationPayload, buildRecordHeartbeatPayload } from '../src/attestation.js';

describe('Detached attestation payloads', () => {
  it('builds the per-record DAC payload', () => {
    assert.strictEqual(
      buildRecordAttestationPayload('GC-2005-EU', 'base64_device_public_key', 42, 'LUKUID', 'env-123'),
      'attestation:GC-2005-EU:base64_device_public_key:42:LUKUID:env-123'
    );
  });

  it('builds the per-record heartbeat payload', () => {
    assert.strictEqual(
      buildRecordHeartbeatPayload('GC-2005-EU', 1770800000, 42, 'env-123'),
      'heartbeat:GC-2005-EU:1770800000:42:env-123'
    );
  });
});
