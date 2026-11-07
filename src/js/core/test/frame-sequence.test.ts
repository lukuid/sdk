// SPDX-License-Identifier: Apache-2.0
// Streamed replies number every frame (`frame_seq` 1, 2, 3...). A lost frame shows up
// as a gap and fails the command (FRAME_SEQUENCE_GAP) instead of returning an
// incomplete reply as success; firmware that does not number frames is still accepted.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createDevice, DeviceCommandError, type Connection } from '../src/index.js';
import protobuf from 'protobufjs';
import { fileURLToPath } from 'node:url';

const root = new protobuf.Root().loadSync(fileURLToPath(new URL('../lukuid.proto', import.meta.url)), { keepCase: true });
const CommandRequest = root.lookupType('lukuid.CommandRequest');
const CommandResponse = root.lookupType('lukuid.CommandResponse');

const MAGIC = Uint8Array.from([0x4c, 0x55, 0x4b, 0x55, 0x49, 0x44, 0x01, 0x7e]);

function frame(body: Uint8Array): Uint8Array {
  const out = new Uint8Array(MAGIC.length + 4 + body.length + MAGIC.length);
  out.set(MAGIC, 0);
  new DataView(out.buffer).setUint32(MAGIC.length, body.length, true);
  out.set(body, MAGIC.length + 4);
  out.set(MAGIC, MAGIC.length + 4 + body.length);
  return out;
}

const encode = (fields: Record<string, unknown>): Uint8Array =>
  frame(CommandResponse.encode(CommandResponse.fromObject(fields)).finish());

type Step = { more: boolean; seq?: number; data?: string[] };

// Replies to `fetch` with the given frames; each frame's data holds one minimal scan entry per id.
class FakeDevice implements Connection {
  private handlers: Array<(chunk: Uint8Array) => void> = [];

  constructor(private readonly steps: Step[]) {}

  async write(data: Uint8Array): Promise<void> {
    const request = CommandRequest.decode(data.subarray(12, data.length - 8)) as unknown as { action: string; request_id: string };
    const push = (chunk: Uint8Array) => queueMicrotask(() => this.handlers.forEach((h) => h(chunk)));
    if (request.action === 'status') {
      push(encode({ action: 'status', request_id: request.request_id, success: true, status: 1, status_response: { id: 'AR-SEQ-1', product: 'animalreader' } }));
      return;
    }
    for (const step of this.steps) {
      push(encode({
        action: request.action,
        request_id: request.request_id,
        success: true,
        status: 1,
        ...(step.more ? { has_more: true } : {}),
        ...(step.seq !== undefined ? { frame_seq: step.seq } : {}),
        fetch_response: { data: (step.data ?? []).map((id) => ({ scan_min: { id } })) }
      }));
    }
  }

  onData(handler: (chunk: Uint8Array) => void): () => void {
    this.handlers.push(handler);
    return () => { this.handlers = this.handlers.filter((h) => h !== handler); };
  }

  async close(): Promise<void> {}
}

function fetchWith(steps: Step[]): Promise<unknown> {
  const { device } = createDevice({
    descriptor: { transportId: 'fake', transport: 'test' },
    openConnection: async () => new FakeDevice(steps),
    options: { allowUnverifiedDevices: true, commandTimeoutMs: 1000 }
  });
  return device.call('fetch', { limit: 10 });
}

const isGap = (e: unknown): boolean => e instanceof DeviceCommandError && e.code === 'FRAME_SEQUENCE_GAP';

describe('streamed reply frame sequence', () => {
  it('accepts a contiguous sequence and merges every frame', async () => {
    const result = await fetchWith([
      { more: true, seq: 1, data: ['a'] },
      { more: true, seq: 2, data: ['b'] },
      { more: false, seq: 3 }
    ]) as { data: unknown[] };
    assert.equal(result.data.length, 2);
  });

  it('fails closed when a middle frame is lost', async () => {
    await assert.rejects(fetchWith([
      { more: true, seq: 1, data: ['a'] },
      { more: true, seq: 3, data: ['c'] },
      { more: false, seq: 4 }
    ]), isGap);
  });

  it('fails closed when the first frame is lost', async () => {
    await assert.rejects(fetchWith([{ more: true, seq: 2, data: ['b'] }, { more: false, seq: 3 }]), isGap);
  });

  it('fails closed when the last data frame before the close is lost', async () => {
    await assert.rejects(fetchWith([{ more: true, seq: 1, data: ['a'] }, { more: false, seq: 3 }]), isGap);
  });

  it('fails closed on an unnumbered frame after numbered ones', async () => {
    await assert.rejects(fetchWith([{ more: true, seq: 1, data: ['a'] }, { more: false }]), isGap);
  });

  it('accepts unnumbered frames from firmware that predates frame_seq', async () => {
    const result = await fetchWith([{ more: true, data: ['a'] }, { more: true, data: ['b'] }, { more: false }]) as { data: unknown[] };
    assert.equal(result.data.length, 2);
  });
});
