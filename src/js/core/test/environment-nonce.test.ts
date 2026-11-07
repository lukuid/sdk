// SPDX-License-Identifier: Apache-2.0
// Environment records may carry a host challenge token: `nonce` is a content field
// at its alphabetical slot (between mobile_sinr_db and pressure_hpa) only when the
// record carries one (dotluku LUKU.md "environment").
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { webcrypto } from 'node:crypto';
import { LukuFile, type JsonObject } from '../src/index.js';

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as Crypto;
}

const NONCE = 'app-nonce-0123456789';

function canonical(publicKey: string, nonce?: string): string {
  const slot = nonce ? `${nonce}:` : '';
  return `GC-TEST-1:${publicKey}:environment:ENV-NONCE-1:4502:1770823456:3600000000:v1.0.0:0.01:0.02:1.00:85:::::::::45.20:21.50:350.50:::::::::::::${slot}1013.20:false:22.40:false:110:30000:genesis_fake`;
}

async function envelope(nonceInSignature?: string, nonceInPayload?: string, canonicalNonce?: string): Promise<JsonObject> {
  const pair = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])) as CryptoKeyPair;
  const publicKey = Buffer.from(new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey))).toString('base64');
  const signed = canonical(publicKey, nonceInSignature);
  const signature = Buffer.from(new Uint8Array(await crypto.subtle.sign('Ed25519', pair.privateKey, new TextEncoder().encode(signed)))).toString('base64');
  const payload: JsonObject = {
    ctr: 4502, timestamp_utc: 1770823456, uptime_us: 3600000000, firmware: 'v1.0.0',
    battery_percent: 85, vbus_present: false, lux: 350.5, temp_c: 22.4,
    humidity_pct: 45.2, initial_temp_c: 21.5, pressure_hpa: 1013.2,
    voc_raw: 30000, voc_index: 110, tamper: false,
    accel_g: { x: 0.01, y: 0.02, z: 1.0 }, genesis_hash: 'genesis_fake'
  };
  if (nonceInPayload !== undefined) payload.nonce = nonceInPayload;
  return {
    type: 'environment', id: 'ENV-NONCE-1', device_id: 'GC-TEST-1', public_key: publicKey, vendor: 'LUKUID',
    device: { vendor: 'LUKUID', device_id: 'GC-TEST-1', public_key: publicKey },
    signature, previous_signature: 'genesis_fake',
    canonical_string: canonicalNonce !== undefined ? canonical(publicKey, canonicalNonce) : signed,
    payload
  };
}

async function codes(env: JsonObject): Promise<string[]> {
  const issues = await LukuFile.verifyEnvelope(env, { allowUntrustedRoots: true, skipCertificateTemporalChecks: true, trustProfile: 'dev' });
  return issues.map((issue) => issue.code);
}

describe('environment nonce', () => {
  it('verifies a record with a nonce', async () => {
    assert.deepEqual(await codes(await envelope(NONCE, NONCE)), []);
  });

  it('keeps the layout of records without a nonce (absent or empty)', async () => {
    assert.deepEqual(await codes(await envelope(undefined, undefined)), []);
    assert.deepEqual(await codes(await envelope(undefined, '')), []);
  });

  it('rejects a stripped, changed or added nonce', async () => {
    for (const env of [await envelope(NONCE, undefined), await envelope(NONCE, 'app-nonce-XXXXXXXXXX'), await envelope(undefined, NONCE)]) {
      assert.ok((await codes(env)).includes('RECORD_CANONICAL_MISMATCH'));
    }
  });

  it('rejects a forged nonce with a matching canonical string by signature', async () => {
    assert.ok((await codes(await envelope(undefined, NONCE, NONCE))).includes('RECORD_SIGNATURE_INVALID'));
  });
});
