// SPDX-License-Identifier: Apache-2.0
// DeviceInfoResponse field 17 is network_participation_enabled (lukuid.proto); the
// device record and sync_heartbeat read it under that name.
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

function decodeInfo(participation: boolean | undefined): any {
  const info = [...stringField(10, 'A0403F98'), ...(participation === undefined ? [] : [...key(17, 0), participation ? 1 : 0])];
  const response = [...stringField(1, 'info'), ...key(2, 0), 1, ...key(3, 0), 1, ...bytesField(6, info)];
  const frames = new LukuDecoder().push(frame(response)) as any[];
  assert.equal(frames.length, 1);
  return frames[0];
}

describe('codec: device info', () => {
  it('decodes field 17 as network_participation_enabled', () => {
    const info = decodeInfo(true);
    assert.equal(info.id, 'A0403F98');
    assert.equal(info.network_participation_enabled, true);
    assert.equal(info.telemetry, undefined);
  });

  it('leaves network_participation_enabled unset when the device omits false', () => {
    assert.notEqual(decodeInfo(undefined).network_participation_enabled, true);
  });
});
