// SPDX-License-Identifier: Apache-2.0
// Device record decoding must keep everything the device signs: the detached identity
// signatures (Identity fields 15/16) and proto3 default values that never go on the wire.
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

function decodeEnvironmentFull(): any {
  const accel = [...key(1, 5), ...Buffer.from(Float32Array.of(0.5).buffer)];
  const payload = [...key(1, 0), 7, ...bytesField(11, accel), ...key(10, 0), 42];
  const identity = [
    ...stringField(2, 'DACSERIAL'),
    ...key(4, 0), ...varint(150),
    ...bytesField(15, new Array(64).fill(0x11)),
    ...bytesField(16, new Array(64).fill(0x22)),
  ];
  const record = [...stringField(2, '7-env'), ...bytesField(6, payload), ...bytesField(9, identity)];
  const fullRecordResponse = [...stringField(1, '7-env'), ...bytesField(3, record)];
  // status=STATUS_OK and success=true, as every device response carries
  const response = [...stringField(1, 'get'), ...key(2, 0), 1, ...key(3, 0), 1, ...bytesField(11, fullRecordResponse)];
  const frames = new LukuDecoder().push(frame(response)) as any[];
  assert.equal(frames.length, 1);
  return frames[0].full_record_response.environment_full;
}

describe('codec: device environment records', () => {
  it('keeps the detached dac_signature and heartbeat_signature', () => {
    const identity = decodeEnvironmentFull().identity;
    assert.equal(identity.identity_version, undefined);
    assert.equal(identity.dac_serial, 'DACSERIAL');
    assert.equal(Number(identity.last_sync_utc), 150);
    assert.deepEqual([...identity.dac_signature], new Array(64).fill(0x11));
    assert.deepEqual([...identity.heartbeat_signature], new Array(64).fill(0x22));
  });

  it('materializes proto3 defaults the device signs, keeping optional presence', () => {
    const payload = decodeEnvironmentFull().payload;
    assert.equal(Number(payload.ctr), 7);
    assert.equal(payload.tamper, false);
    assert.equal(payload.vbus_present, false);
    assert.equal(payload.battery_percent, 0);
    assert.equal(payload.lux, 0);
    assert.equal(payload.accel_g.y, 0);
    assert.equal(payload.voc_raw, 42);
    assert.equal(payload.voc_index, undefined);
    assert.equal(payload.gps_lat, undefined);
  });
});
