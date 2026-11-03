// SPDX-License-Identifier: Apache-2.0
// Environment recording interval: ConfigRequest field 26 and NetworkConfigResponse
// field 21 (lukuid.proto).
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { encodeCommandRequest, LukuDecoder } from '../src/index.js';

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

function containsSequence(haystack: Uint8Array, needle: number[]): boolean {
  outer: for (let i = 0; i + needle.length <= haystack.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return true;
  }
  return false;
}

describe('codec: record interval', () => {
  it('encodes config record_interval as ConfigRequest field 26', () => {
    const bytes = encodeCommandRequest({ action: 'config', record_interval: 300 } as any);
    const configMessage = [...key(26, 0), ...varint(300)];
    assert.ok(containsSequence(bytes, bytesField(5, configMessage)), 'config payload carries field 26 = 300');
  });

  it('omits record_interval when it is not provided', () => {
    const bytes = encodeCommandRequest({ action: 'config', name: 'X' } as any);
    assert.ok(!containsSequence(bytes, key(26, 0)));
  });

  it('decodes NetworkConfigResponse field 21 as record_interval', () => {
    const config = [...stringField(1, 'ssid'), ...key(21, 0), ...varint(1800)];
    const response = [...stringField(1, 'network_info'), ...key(2, 0), 1, ...key(3, 0), 1, ...bytesField(7, config)];
    const frames = new LukuDecoder().push(frame(response)) as any[];
    assert.equal(frames.length, 1);
    assert.equal(frames[0].wifi_ssid, 'ssid');
    assert.equal(frames[0].record_interval, 1800);
  });
});
