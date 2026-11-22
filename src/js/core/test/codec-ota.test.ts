// SPDX-License-Identifier: Apache-2.0
// OTA commands (lukuid.proto CommandRequest oneof 6/7/8): bytes fields given as base64
// strings (as the API and the other SDKs pass them) must be encoded, not dropped.
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { encodeCommandRequest } from '../src/index.js';

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

function containsSequence(haystack: Uint8Array, needle: number[]): boolean {
  outer: for (let i = 0; i + needle.length <= haystack.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return true;
  }
  return false;
}

const chunk = [0xe9, 0x03, 0x02, 0x20, 0x00, 0xff, 0x10, 0x7f];
const chunkB64 = Buffer.from(chunk).toString('base64');

describe('codec: OTA', () => {
  it('encodes ota_data.data from a base64 string the same as from bytes', () => {
    const fromB64 = encodeCommandRequest({ action: 'ota_data', offset: 1024, data: chunkB64 } as any);
    const fromBytes = encodeCommandRequest({ action: 'ota_data', offset: 1024, data: Uint8Array.from(chunk) } as any);
    const expected = bytesField(7, [...bytesField(1, chunk), ...key(2, 0), ...varint(1024)]);
    assert.ok(containsSequence(fromB64, expected), 'base64 chunk is carried in OtaDataRequest.data');
    assert.ok(containsSequence(fromBytes, expected), 'byte chunk is carried in OtaDataRequest.data');
  });

  it('encodes ota_end.signature from base64 and still sends an empty ota_end', () => {
    const sig = [1, 2, 3, 4, 5, 6];
    const withSig = encodeCommandRequest({ action: 'ota_end', signature: Buffer.from(sig).toString('base64') } as any);
    assert.ok(containsSequence(withSig, bytesField(8, bytesField(1, sig))));
    const empty = encodeCommandRequest({ action: 'ota_end' } as any);
    assert.ok(containsSequence(empty, [...key(8, 2), 0]), 'empty OtaEndRequest is still sent as oneof 8');
  });

  it('encodes ota_begin.public_key from a base64 string', () => {
    const pk = Array.from({ length: 32 }, (_, i) => i);
    const bytes = encodeCommandRequest({ action: 'ota_begin', size: 10, public_key: Buffer.from(pk).toString('base64') } as any);
    assert.ok(containsSequence(bytes, bytesField(2, pk)));
  });
});
