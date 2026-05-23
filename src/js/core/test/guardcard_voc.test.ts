// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { webcrypto } from 'node:crypto';
import {
  LukuDecoder,
  LukuFile,
  type JsonObject
} from '../src/index.js';

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as Crypto;
}

const MAGIC = Uint8Array.from([0x4c, 0x55, 0x4b, 0x55, 0x49, 0x44, 0x01, 0x7e]);

function encodeVarint(value: number): number[] {
  const bytes: number[] = [];
  let current = value >>> 0;
  while (current >= 0x80) {
    bytes.push((current & 0x7f) | 0x80);
    current >>>= 7;
  }
  bytes.push(current);
  return bytes;
}

function encodeKey(field: number, wireType: number): number[] {
  return encodeVarint((field << 3) | wireType);
}

function encodeBoolField(field: number, value: boolean): number[] {
  return [...encodeKey(field, 0), ...encodeVarint(value ? 1 : 0)];
}

function encodeUint32Field(field: number, value: number): number[] {
  return [...encodeKey(field, 0), ...encodeVarint(value)];
}

function encodeUint64Field(field: number, value: number): number[] {
  return [...encodeKey(field, 0), ...encodeVarint(value)];
}

function encodeInt64Field(field: number, value: number): number[] {
  return [...encodeKey(field, 0), ...encodeVarint(value)];
}

function encodeStringField(field: number, value: string): number[] {
  const bytes = new TextEncoder().encode(value);
  return [...encodeKey(field, 2), ...encodeVarint(bytes.length), ...bytes];
}

function encodeMessageField(field: number, message: number[]): number[] {
  return [...encodeKey(field, 2), ...encodeVarint(message.length), ...message];
}

function encodeFrame(payload: Uint8Array): Uint8Array {
  const frame = new Uint8Array(MAGIC.length + 4 + payload.length + MAGIC.length);
  let offset = 0;
  frame.set(MAGIC, offset);
  offset += MAGIC.length;
  new DataView(frame.buffer).setUint32(offset, payload.length, true);
  offset += 4;
  frame.set(payload, offset);
  offset += payload.length;
  frame.set(MAGIC, offset);
  return frame;
}

async function createSignedEnvironmentEnvelope(canonicalString: string): Promise<JsonObject> {
  const pair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']) as CryptoKeyPair;
  const publicKeyRaw = await crypto.subtle.exportKey('raw', pair.publicKey);
  const publicKeyBase64 = Buffer.from(new Uint8Array(publicKeyRaw)).toString('base64');
  const signature = await crypto.subtle.sign('Ed25519', pair.privateKey, new TextEncoder().encode(canonicalString));

  return {
    type: 'environment',
    id: 'ENV-VOC-1',
    device_id: 'GC-TEST-1',
    public_key: publicKeyBase64,
    signature: Buffer.from(new Uint8Array(signature)).toString('base64'),
    previous_signature: 'genesis_fake',
    canonical_string: canonicalString,
    payload: {
      ctr: 4502,
      timestamp_utc: 1770823456,
      uptime_us: 3600000000,
      battery_percent: 85,
      vbus_present: false,
      lux: 350.5,
      temp_c: 22.4,
      humidity_pct: 45.2,
      pressure_hpa: 1013.2,
      voc_raw: 30000,
      voc_index: 110,
      tamper: false,
      accel_g: { x: 0.01, y: 0.02, z: 1.0 },
      genesis_hash: 'genesis_fake'
    }
  };
}

describe('GuardCard VOC transport', () => {
  it('decodes voc_raw and voc_index from GuardCard environment frames', () => {
    const payload = [
      ...encodeUint64Field(1, 4502),
      ...encodeInt64Field(2, 1770823456),
      ...encodeUint32Field(10, 30000),
      ...encodeUint32Field(21, 137)
    ];
    const envRecord = [
      ...encodeStringField(1, '1.0.0'),
      ...encodeStringField(2, 'ENV-VOC-1'),
      ...encodeStringField(5, 'env-voc-canonical'),
      ...encodeMessageField(6, payload)
    ];
    const response = Uint8Array.from([
      ...encodeVarint((2 << 3) | 0),
      1,
      ...encodeBoolField(3, true),
      ...encodeMessageField(9, envRecord)
    ]);

    const decoder = new LukuDecoder();
    const frames = decoder.push(encodeFrame(response));

    assert.equal(frames.length, 1);
    const envRecordMap = frames[0]?.env_record as JsonObject;
    const envPayload = envRecordMap.payload as JsonObject;
    assert.equal(envPayload.voc_raw, 30000);
    assert.equal(envPayload.voc_index, 137);
    assert.equal(envRecordMap.canonical_string, 'env-voc-canonical');
  });

  it('verifies the new environment canonical string layout and rejects the old one', async () => {
    const unsignedCanonical =
      'GC-TEST-1:PUBLIC_KEY_PLACEHOLDER:environment:ENV-VOC-1:4502:1770823456:3600000000:85:false:350.50:22.40:45.20:1013.20:30000:110:false:0.01:0.02:1.00:genesis_fake';
    const placeholderEnvelope = await createSignedEnvironmentEnvelope(unsignedCanonical);
    const canonical = unsignedCanonical.replace('PUBLIC_KEY_PLACEHOLDER', placeholderEnvelope.public_key as string);
    const envelope = await createSignedEnvironmentEnvelope(canonical);

    const validIssues = await LukuFile.verifyEnvelope(envelope, {
      allowUntrustedRoots: true,
      skipCertificateTemporalChecks: true,
      trustProfile: 'dev'
    });
    assert.equal(validIssues.length, 0, JSON.stringify(validIssues));

    const oldFormatEnvelope: JsonObject = {
      ...envelope,
      canonical_string: `GC-TEST-1:${envelope.public_key as string}:environment:ENV-VOC-1:4502:1770823456:3600000000:85:false:350.50:22.40:45.20:1013.20:110:false:0.01:0.02:1.00:genesis_fake`
    };
    const invalidIssues = await LukuFile.verifyEnvelope(oldFormatEnvelope, {
      allowUntrustedRoots: true,
      skipCertificateTemporalChecks: true,
      trustProfile: 'dev'
    });
    assert.ok(invalidIssues.some((issue) => issue.code === 'RECORD_SIGNATURE_INVALID'));
  });
});
