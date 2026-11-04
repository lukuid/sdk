// SPDX-License-Identifier: Apache-2.0
// Device.getRecord: a stored record is checked like a capture (canonical string, Ed25519
// signature) and refused when it is older than the caller accepts.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import protobuf from 'protobufjs';
import { fileURLToPath } from 'node:url';
import {
  createDevice,
  recomputeRecordCanonicalString,
  recordAgeSeconds,
  checkRecordAge,
  isValidMaxAge,
  CaptureError,
  DeviceCommandError,
  type Connection,
  type JsonObject
} from '../src/index.js';

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as Crypto;
}

const root = new protobuf.Root().loadSync(fileURLToPath(new URL('../lukuid.proto', import.meta.url)), { keepCase: true });
const CommandRequest = root.lookupType('lukuid.CommandRequest');
const CommandResponse = root.lookupType('lukuid.CommandResponse');
const lukuid = {
  CommandRequest: { decode: (b: Uint8Array) => CommandRequest.decode(b) as unknown as { action: string; request_id: string; get?: { id?: string } } },
  CommandResponse: {
    create: (v: Record<string, unknown>) => CommandResponse.fromObject(v),
    encode: (m: protobuf.Message) => CommandResponse.encode(m)
  }
};

const MAGIC = Uint8Array.from([0x4c, 0x55, 0x4b, 0x55, 0x49, 0x44, 0x01, 0x7e]);
const DEVICE_ID = 'AR-TEST-1';
const TOKEN = 'app-capture-0123456789AB';

function frame(body: Uint8Array): Uint8Array {
  const out = new Uint8Array(MAGIC.length + 4 + body.length + MAGIC.length);
  out.set(MAGIC, 0);
  new DataView(out.buffer).setUint32(MAGIC.length, body.length, true);
  out.set(body, MAGIC.length + 4);
  out.set(MAGIC, MAGIC.length + 4 + body.length);
  return out;
}

const b64 = (bytes: Uint8Array): string => Buffer.from(bytes).toString('base64');

interface Signer {
  publicKey: string;
  sign(text: string): Promise<Uint8Array>;
}

async function signer(): Promise<Signer> {
  const pair = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])) as CryptoKeyPair;
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
  return {
    publicKey: b64(raw),
    sign: async (text) => new Uint8Array(await crypto.subtle.sign('Ed25519', pair.privateKey, new TextEncoder().encode(text)))
  };
}

const PREVIOUS = new Uint8Array(64).fill(3);

// A signed animal scan as the reader stores it; `mutate` changes the payload after signing.
async function scanRecord(key: Signer, nonce: string, mutate?: (payload: Record<string, unknown>) => void, timestamp = 1793769018): Promise<Record<string, unknown>> {
  const payload: Record<string, unknown> = {
    ctr: 2464, timestamp_utc: timestamp, uptime_us: 12000000, nonce, firmware: 'v1.0.0',
    profile: 'animal', protocol: 'FDX-B', scan_version: '1.0', id: '999000000000002'
  };
  const id = 'LUKUID-1793769018-2464-999000000000002';
  const json: JsonObject = { id, previous_signature: b64(PREVIOUS), payload: { ...payload, tag_id: payload.id } as JsonObject };
  const canonical = recomputeRecordCanonicalString(json, 'scan', DEVICE_ID, key.publicKey);
  assert.ok(canonical);
  const signature = await key.sign(canonical);
  mutate?.(payload);
  return { version: '1.0', id, signature, previous_signature: PREVIOUS, canonical_string: canonical, payload };
}

function reply(requestId: string, fields: Record<string, unknown>, action = 'get'): Uint8Array {
  return frame(lukuid.CommandResponse.encode(lukuid.CommandResponse.create({ action, request_id: requestId, ...fields })).finish());
}

type Script = (requestId: string, push: (chunk: Uint8Array) => void, requestedId?: string) => Promise<void>;

class FakeDevice implements Connection {
  private handlers: Array<(chunk: Uint8Array) => void> = [];
  readonly actions: string[] = [];

  constructor(private readonly key: Signer, private readonly script: Script) {}

  async write(data: Uint8Array): Promise<void> {
    const request = lukuid.CommandRequest.decode(data.subarray(12, data.length - 8));
    this.actions.push(request.action);
    const push = (chunk: Uint8Array) => queueMicrotask(() => this.handlers.forEach((h) => h(chunk)));
    if (request.action === 'status') {
      push(frame(lukuid.CommandResponse.encode(lukuid.CommandResponse.create({
        action: 'status', requestId: request.request_id, success: true, status: 1,
        status_response: { id: DEVICE_ID, public_key: Buffer.from(this.key.publicKey, 'base64'), product: 'animalreader' }
      })).finish()));
      return;
    }
    void this.script(request.request_id, push, request.get?.id);
  }

  onData(handler: (chunk: Uint8Array) => void): () => void {
    this.handlers.push(handler);
    return () => { this.handlers = this.handlers.filter((h) => h !== handler); };
  }

  async close(): Promise<void> {}
}

function deviceOver(connection: FakeDevice, commandTimeoutMs = 2000) {
  return createDevice({
    descriptor: { transportId: 'fake', transport: 'test' },
    openConnection: async () => connection,
    options: { allowUnverifiedDevices: true, commandTimeoutMs }
  }).device;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const recordReply = (requestId: string, scan: Record<string, unknown>) =>
  reply(requestId, { success: true, status: 1, full_record_response: { id: scan.id, scan_full: scan } });


const now = () => Math.floor(Date.now() / 1000);

describe('getRecord', () => {
  it('returns a stored record checked like a capture, with its age', async () => {
    const key = await signer();
    const scan = await scanRecord(key, '', undefined, now() - 300);
    let asked: string | undefined;
    const device = deviceOver(new FakeDevice(key, async (id, push, requested) => { asked = requested; push(recordReply(id, scan)); }));
    const result = await device.getRecord(scan.id as string, { maxAgeSeconds: 3600 });
    assert.equal(asked, scan.id);
    assert.equal(result.type, 'scan');
    assert.equal(result.nonce, '');
    const age = recordAgeSeconds(result.record);
    assert.ok(age >= 299 && age <= 310, String(age));
  });

  it('refuses a record older than the caller accepts', async () => {
    const key = await signer();
    const scan = await scanRecord(key, '', undefined, now() - 7200);
    const device = deviceOver(new FakeDevice(key, async (id, push) => push(recordReply(id, scan))));
    await assert.rejects(device.getRecord(scan.id as string, { maxAgeSeconds: 3600 }), (e: unknown) => e instanceof CaptureError && e.code === 'RECORD_TOO_OLD');
    assert.ok((await device.getRecord(scan.id as string)).id);
  });

  it('refuses a stored record changed after signing', async () => {
    const key = await signer();
    const scan = await scanRecord(key, '', (p) => { p.timestamp_utc = now(); }, now() - 7200);
    const device = deviceOver(new FakeDevice(key, async (id, push) => push(recordReply(id, scan))));
    await assert.rejects(device.getRecord(scan.id as string, { maxAgeSeconds: 3600 }), (e: unknown) => e instanceof CaptureError && e.code === 'RECORD_CANONICAL_MISMATCH');
  });

  it('refuses an unusable maximum age before reading', async () => {
    const key = await signer();
    const conn = new FakeDevice(key, async () => {});
    const device = deviceOver(conn);
    for (const bad of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      await assert.rejects(device.getRecord('x', { maxAgeSeconds: bad }), (e: unknown) => e instanceof DeviceCommandError && e.code === 'INVALID_ARG');
    }
    assert.ok(!conn.actions.includes('get'));
    assert.ok(isValidMaxAge(undefined) && isValidMaxAge(0) && !isValidMaxAge('60'));
  });

  it('measures age from the signed record time', () => {
    const record = { payload: { timestamp_utc: 1000 } } as unknown as JsonObject;
    assert.equal(recordAgeSeconds(record, 1_060_000), 60);
    assert.equal(recordAgeSeconds(record, 900_000), 0);
    assert.equal(checkRecordAge({ id: 'x', type: 'scan', record, nonce: '' }, 60, 1_060_000), 60);
    assert.throws(() => checkRecordAge({ id: 'x', type: 'scan', record, nonce: '' }, 59, 1_060_000), (e: unknown) => e instanceof CaptureError && e.code === 'RECORD_TOO_OLD');
  });
});
