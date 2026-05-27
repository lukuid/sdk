// SPDX-License-Identifier: Apache-2.0
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createDevice } from '../src/index.js';
import type { Connection } from '../src/index.js';

const MAGIC = Uint8Array.from([0x4c, 0x55, 0x4b, 0x55, 0x49, 0x44, 0x01, 0x7e]);

function writeVarint(out: number[], value: number): void {
  let next = value >>> 0;
  while (next >= 0x80) {
    out.push((next & 0x7f) | 0x80);
    next >>>= 7;
  }
  out.push(next);
}

function writeKey(out: number[], field: number, wireType: number): void {
  writeVarint(out, (field << 3) | wireType);
}

function writeString(out: number[], field: number, value: string): void {
  const bytes = Buffer.from(value, 'utf8');
  writeKey(out, field, 2);
  writeVarint(out, bytes.length);
  out.push(...bytes);
}

function writeBool(out: number[], field: number, value: boolean): void {
  writeKey(out, field, 0);
  writeVarint(out, value ? 1 : 0);
}

function writeU32(out: number[], field: number, value: number): void {
  writeKey(out, field, 0);
  writeVarint(out, value);
}

function writeBytes(out: number[], field: number, value: Uint8Array): void {
  writeKey(out, field, 2);
  writeVarint(out, value.length);
  out.push(...value);
}

function writeMessage(out: number[], field: number, nested: number[]): void {
  writeKey(out, field, 2);
  writeVarint(out, nested.length);
  out.push(...nested);
}

function frame(payload: number[]): Uint8Array {
  const body = Uint8Array.from(payload);
  const framed = new Uint8Array(MAGIC.length + 4 + body.length + MAGIC.length);
  framed.set(MAGIC, 0);
  new DataView(framed.buffer).setUint32(MAGIC.length, body.length, true);
  framed.set(body, MAGIC.length + 4);
  framed.set(MAGIC, MAGIC.length + 4 + body.length);
  return framed;
}

function response(action: string, nestedField?: number, nested?: number[]): Uint8Array {
  const payload: number[] = [];
  writeString(payload, 1, action);
  writeU32(payload, 2, 1); // STATUS_OK
  if (nestedField && nested) {
    writeMessage(payload, nestedField, nested);
  }
  return frame(payload);
}

function infoResponseWithoutAttestation(): Uint8Array {
  const info: number[] = [];
  writeString(info, 10, 'GC-UNVERIFIED');
  writeBytes(info, 28, Uint8Array.from(Array.from({ length: 32 }, (_, index) => index + 1)));
  writeBool(info, 8, false);
  return response('info', 6, info);
}

class FakeConnection implements Connection {
  private handlers: Array<(chunk: Uint8Array) => void> = [];
  readonly writes: number[] = [];

  async write(_data: Uint8Array): Promise<void> {
    const index = this.writes.length;
    this.writes.push(index);
    const payload = index === 0
      ? infoResponseWithoutAttestation()
      : response('get_certificate');
    queueMicrotask(() => {
      for (const handler of this.handlers) {
        handler(payload);
      }
    });
  }

  onData(handler: (chunk: Uint8Array) => void): () => void {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter(item => item !== handler);
    };
  }

  async close(): Promise<void> {}
}

describe('device verification', () => {
  it('returns unverified device info without running heartbeat when INFO lacks attestation', async () => {
    const connection = new FakeConnection();
    const controller = createDevice({
      descriptor: { transportId: 'fake-1', transport: 'test' },
      openConnection: async () => connection
    });

    const info = await controller.device.verify();

    assert.equal(info.id, 'GC-UNVERIFIED');
    assert.equal(info.verified, false);
    assert.equal(connection.writes.length, 7);
  });
});
