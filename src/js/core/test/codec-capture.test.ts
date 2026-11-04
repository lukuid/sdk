// SPDX-License-Identifier: Apache-2.0
// Host challenge tokens: CommandRequest.challenge = 19 and CommandRequest.capture = 20,
// each a message whose field 1 is the token (lukuid.proto).
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
const tokenMessage = (field: number, token: string): number[] =>
  bytesField(field, bytesField(1, [...Buffer.from(token, 'utf8')]));

function containsSequence(haystack: Uint8Array, needle: number[]): boolean {
  outer: for (let i = 0; i + needle.length <= haystack.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return true;
  }
  return false;
}

describe('codec: challenge and capture tokens', () => {
  it('encodes a challenge token as field 19', () => {
    const token = 'app-nonce-0123456789';
    const bytes = encodeCommandRequest({ action: 'challenge', token } as never);
    assert.ok(containsSequence(bytes, tokenMessage(19, token)));
  });

  it('encodes a capture token as field 20', () => {
    const token = 'app-nonce-ABCDEFGHIJ';
    const bytes = encodeCommandRequest({ action: 'capture', token } as never);
    assert.ok(containsSequence(bytes, tokenMessage(20, token)));
  });

  it('sends an empty capture message without a token', () => {
    const bytes = encodeCommandRequest({ action: 'capture' } as never);
    assert.ok(containsSequence(bytes, bytesField(20, [])));
  });
});
