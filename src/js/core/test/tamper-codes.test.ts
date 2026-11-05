// SPDX-License-Identifier: Apache-2.0
// Tamper issue codes match the other SDKs (Rust, Python, Kotlin, Swift): the signature is checked
// against the stored canonical_string the device signed (sdk/ERRORS.md).
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { webcrypto } from 'node:crypto';
import { LukuFile, type JsonObject } from '../src/index.js';

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as Crypto;
}

const samples = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', 'samples');
const envelope = JSON.parse(readFileSync(path.join(samples, 'envelopes', 'test', '1.1.0', 'valid_envelope.json'), 'utf8')) as JsonObject;
const archive = readFileSync(path.join(samples, 'dotluku', 'test', '1.1.0', 'first-passable-verification-sample.luku'));

function clone (): JsonObject { return structuredClone(envelope); }
function payload (e: JsonObject): JsonObject { return e.payload as JsonObject; }
async function codes (e: JsonObject): Promise<string[]> {
  const issues = await LukuFile.verifyEnvelope(e, { trustProfile: 'test' });
  return issues.filter((i) => i.criticality === 'critical').map((i) => i.code);
}

describe('tamper issue codes', () => {
  it('the untouched test envelope verifies', async () => {
    assert.deepEqual(await codes(clone()), []);
  });

  it('a payload change is a canonical mismatch, not a signature failure', async () => {
    const e = clone();
    payload(e).battery_percent = Number(payload(e).battery_percent) + 1;
    assert.deepEqual(await codes(e), ['RECORD_CANONICAL_MISMATCH']);
  });

  it('a canonical string changed to match the payload fails the signature', async () => {
    const e = clone();
    const original = String(e.canonical_string);
    e.canonical_string = original.replace(':4099:', ':4100:');
    assert.notEqual(e.canonical_string, original);
    payload(e).ctr = 4100;
    const found = await codes(e);
    assert.ok(found.includes('RECORD_SIGNATURE_INVALID'), found.join(','));
  });

  it('a missing canonical string is reported, not rebuilt from the payload', async () => {
    const e = clone();
    delete e.canonical_string;
    assert.ok((await codes(e)).includes('RECORD_CANONICAL_MISSING'));
  });

  it('a payload change inside an archive reports the same codes as Rust and Python', async () => {
    const luku = await LukuFile.openBytes(new Uint8Array(archive));
    const record = (luku.blocks[0].batch as JsonObject[]).find((r) => r.type === 'environment') as JsonObject;
    payload(record).battery_percent = Number(payload(record).battery_percent) + 1;
    const found = (await luku.verify({ trustProfile: 'test' })).filter((i) => i.criticality === 'critical').map((i) => i.code);
    assert.ok(found.includes('RECORD_CANONICAL_MISMATCH'), found.join(','));
    assert.ok(!found.includes('RECORD_SIGNATURE_INVALID'), found.join(','));
  });
});
