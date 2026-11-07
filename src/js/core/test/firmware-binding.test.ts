// SPDX-License-Identifier: Apache-2.0
// Every device-signed record binds the firmware that signed it (dotluku "Firmware Binding").
// The samples are real exports from the test-PKI Environment card and Animal Reader.
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

const samples = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', 'samples', 'dotluku', 'test', '1.1.0');
const SAMPLES = ['firmware-bound-environment.luku', 'firmware-bound-reader.luku'];
// Index of `firmware` in each type's canonical string, and whether it lives in `payload`.
const SLOT: Record<string, { index: number; inPayload: boolean }> = {
  scan: { index: 9, inPayload: true },
  environment: { index: 7, inPayload: true },
  attachment: { index: 7, inPayload: false },
  custody: { index: 7, inPayload: false },
  location: { index: 6, inPayload: false }
};

async function open (name: string): Promise<LukuFile> {
  return LukuFile.openBytes(new Uint8Array(readFileSync(path.join(samples, name))));
}
async function criticalCodes (luku: LukuFile): Promise<string[]> {
  return (await luku.verify({ trustProfile: 'test' })).filter((i) => i.criticality === 'critical').map((i) => i.code);
}
function recordAt (luku: LukuFile, index: number): JsonObject {
  return (luku.blocks[0].batch as JsonObject[])[index];
}
function holder (record: JsonObject): JsonObject {
  return SLOT[String(record.type)].inPayload ? (record.payload as JsonObject) : record;
}
function setSlot (record: JsonObject, value: string | null): void {
  const parts = String(record.canonical_string).split(':');
  const { index } = SLOT[String(record.type)];
  if (value === null) parts.splice(index, 1); else parts[index] = value;
  record.canonical_string = parts.join(':');
}
async function tampered (name: string, index: number, edit: (record: JsonObject) => void): Promise<string[]> {
  const luku = await open(name);
  edit(recordAt(luku, index));
  return criticalCodes(luku);
}

describe('firmware binding', () => {
  it('the firmware-bound samples verify', async () => {
    for (const name of SAMPLES) assert.deepEqual(await criticalCodes(await open(name)), [], name);
  });

  it('every record signs its firmware as the last structural-prefix field', async () => {
    const seen: string[] = [];
    for (const name of SAMPLES) {
      for (const record of (await open(name)).blocks[0].batch as JsonObject[]) {
        const type = String(record.type);
        assert.equal(holder(record).firmware, 'v1.0.0', `${name} ${type}`);
        assert.equal(String(record.canonical_string).split(':')[SLOT[type].index], 'v1.0.0', `${name} ${type}`);
        seen.push(type);
      }
    }
    assert.deepEqual(seen.sort(), ['attachment', 'attachment', 'custody', 'custody', 'environment', 'location', 'location', 'scan']);
  });

  it('a changed or removed firmware field is a canonical mismatch', async () => {
    for (const name of SAMPLES) {
      for (let index = 0; index < 4; index++) {
        let codes = await tampered(name, index, (r) => { holder(r).firmware = 'v9.9.9'; });
        assert.ok(codes.includes('RECORD_CANONICAL_MISMATCH'), `${name}[${index}] ${codes.join(',')}`);
        assert.ok(!codes.includes('RECORD_SIGNATURE_INVALID'), `${name}[${index}] ${codes.join(',')}`);
        codes = await tampered(name, index, (r) => { delete holder(r).firmware; });
        assert.ok(codes.includes('RECORD_CANONICAL_MISMATCH'), `${name}[${index}] removed ${codes.join(',')}`);
      }
    }
  });

  it('a firmware changed in the signed string fails the signature', async () => {
    for (const name of SAMPLES) {
      for (let index = 0; index < 4; index++) {
        const codes = await tampered(name, index, (r) => { holder(r).firmware = 'v9.9.9'; setSlot(r, 'v9.9.9'); });
        assert.ok(codes.includes('RECORD_SIGNATURE_INVALID'), `${name}[${index}] ${codes.join(',')}`);
        assert.ok(!codes.includes('RECORD_CANONICAL_MISMATCH'), `${name}[${index}] ${codes.join(',')}`);
      }
    }
  });

  it('a firmware-bound record cannot pass as one from before the rule', async () => {
    for (const name of SAMPLES) {
      for (let index = 0; index < 4; index++) {
        if (recordAt(await open(name), index).type === 'scan') continue; // scan has always had the slot
        const codes = await tampered(name, index, (r) => { delete holder(r).firmware; setSlot(r, null); });
        assert.ok(codes.includes('RECORD_SIGNATURE_INVALID'), `${name}[${index}] ${codes.join(',')}`);
        assert.ok(!codes.includes('RECORD_CANONICAL_MISMATCH'), `${name}[${index}] ${codes.join(',')}`);
      }
    }
  });
});
