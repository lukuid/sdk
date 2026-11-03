// SPDX-License-Identifier: Apache-2.0
// Animal Reader scans: ScanPayload fields 36 (profile), 37 (protocol) and
// 38 (metrics_csv) carry the signed LUKU.md "animal" profile fields, field 31 is
// genesis_hash, and field 2 is exposed as `tag_id` (lukuid.proto).
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { LukuDecoder } from '../src/index.js';

const MAGIC = [0x4c, 0x55, 0x4b, 0x55, 0x49, 0x44, 0x01, 0x7e];

function varint(value: number): number[] {
  const out: number[] = [];
  let v = value >>> 0;
  while (v >= 0x80) {
    out.push((v & 0x7f) | 0x80);
    v >>>= 7;
  }
  out.push(v);
  return out;
}

const key = (field: number, wireType: number): number[] => varint((field << 3) | wireType);
const bytesField = (field: number, value: number[]): number[] => [...key(field, 2), ...varint(value.length), ...value];
const stringField = (field: number, value: string): number[] => bytesField(field, [...Buffer.from(value, 'utf8')]);

function frame(payload: number[]): Uint8Array {
  const len = payload.length;
  return Uint8Array.from([...MAGIC, len & 0xff, (len >> 8) & 0xff, (len >> 16) & 0xff, (len >> 24) & 0xff, ...payload, ...MAGIC]);
}

function decodePayload(payload: number[]): any {
  const recordId = 'LUKUID-1793735596-58-999000000000049';
  const record = [...stringField(1, '1.0'), ...stringField(2, recordId), ...bytesField(6, payload)];
  const full = [...stringField(1, recordId), ...bytesField(2, record)];
  const response = [...stringField(1, 'get'), ...key(2, 0), 1, ...bytesField(11, full)];
  const frames = new LukuDecoder().push(frame(response)) as any[];
  assert.equal(frames.length, 1);
  return frames[0].full_record_response.scan_full.payload;
}

const SIGNED_METRICS = '38.50,45.00,-65.00,12.00,5.00,120.00,2.00,3300.00,10.00,11.00,1.00,2000.00,50.00,1.20,1.00,5.00,-2.00,0.00';

describe('codec: animal scan profile fields', () => {
  it('decodes profile, protocol, metrics, genesis_hash and tag_id with LUKU.md names', () => {
    const p = decodePayload([
      ...key(1, 0), ...varint(58),
      ...stringField(2, '999000000000049'),
      ...stringField(30, '1.0'),
      ...stringField(31, 'Z2VuZXNpcw=='),
      ...stringField(36, 'animal'),
      ...stringField(37, 'FDX-B'),
      ...stringField(38, SIGNED_METRICS),
    ]);
    assert.equal(p.tag_id, '999000000000049');
    assert.equal(p.id, undefined, 'no unsigned copy of the signed tag_id');
    assert.equal(p.profile, 'animal');
    assert.equal(p.protocol, 'FDX-B');
    assert.equal(p.scan_version, '1.0');
    assert.equal(p.genesis_hash, 'Z2VuZXNpcw==');
    assert.deepEqual(p.metrics, [38.5, 45, -65, 12, 5, 120, 2, 3300, 10, 11, 1, 2000, 50, 1.2, 1, 5, -2, 0]);
    assert.equal(p.metrics_csv, undefined);
  });

  it('metrics format back to the signed text', () => {
    const p = decodePayload(stringField(38, SIGNED_METRICS));
    assert.equal(p.metrics.map((v: number) => v.toFixed(2)).join(','), SIGNED_METRICS);
  });

  it('drops unparsable metrics instead of guessing', () => {
    const p = decodePayload(stringField(38, '1.00,abc,3.00'));
    assert.equal(p.metrics, undefined);
  });
});
