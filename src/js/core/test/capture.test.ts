// SPDX-License-Identifier: Apache-2.0
// Device.capture: the reply is the stored record, checked before it reaches the app
// (canonical string, Ed25519 signature, challenge nonce), with keepalive frames while
// the reader waits, BUSY when another capture runs, and replies routed by request_id.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import {
  createDevice,
  createChallengeToken,
  isValidChallengeToken,
  recomputeRecordCanonicalString,
  verifyCaptureReply,
  CaptureError,
  DeviceCommandError,
  type CaptureEvent,
  type Connection,
  type JsonObject
} from '../src/index.js';
import protobuf from 'protobufjs';
import { fileURLToPath } from 'node:url';

const root = new protobuf.Root().loadSync(fileURLToPath(new URL('../lukuid.proto', import.meta.url)), { keepCase: true });
const CommandRequest = root.lookupType('lukuid.CommandRequest');
const CommandResponse = root.lookupType('lukuid.CommandResponse');
const lukuid = {
  CommandRequest: { decode: (b: Uint8Array) => CommandRequest.decode(b) as unknown as { action: string; request_id: string } },
  CommandResponse: {
    create: (v: Record<string, unknown>) => CommandResponse.fromObject(v),
    encode: (m: protobuf.Message) => CommandResponse.encode(m)
  }
};

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as Crypto;
}

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
async function scanRecord(key: Signer, nonce: string, mutate?: (payload: Record<string, unknown>) => void): Promise<Record<string, unknown>> {
  const payload: Record<string, unknown> = {
    ctr: 2464, timestamp_utc: 1793769018, uptime_us: 12000000, nonce, firmware: 'v1.0.0',
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

function reply(requestId: string, fields: Record<string, unknown>): Uint8Array {
  return frame(lukuid.CommandResponse.encode(lukuid.CommandResponse.create({ action: 'capture', request_id: requestId, ...fields })).finish());
}

type Script = (requestId: string, push: (chunk: Uint8Array) => void) => Promise<void>;

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
    void this.script(request.request_id, push);
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
const keepalive = (requestId: string) => reply(requestId, { success: true, status: 1, has_more: true });
const recordReply = (requestId: string, scan: Record<string, unknown>) =>
  reply(requestId, { success: true, status: 1, full_record_response: { id: scan.id, scan_full: scan } });

describe('capture', () => {
  it('creates valid challenge tokens and rejects unusable ones', () => {
    for (let i = 0; i < 20; i++) assert.ok(isValidChallengeToken(createChallengeToken()));
    for (const bad of ['short-token', 'a'.repeat(32), 'abcdefgh:ijklmnop', 'abcdefgh ijklmnop']) assert.equal(isValidChallengeToken(bad), false);
    assert.ok(isValidChallengeToken('ABCDEFGHIJKLMNOPQRSTUVWXYZ-_.~+'));
  });

  it('returns the stored record after keepalives longer than the command timeout', async () => {
    const key = await signer();
    const scan = await scanRecord(key, TOKEN);
    const conn = new FakeDevice(key, async (id, push) => {
      for (let i = 0; i < 4; i++) { await sleep(300); push(keepalive(id)); }
      push(recordReply(id, scan));
    });
    const device = deviceOver(conn, 500);
    const events: CaptureEvent['state'][] = [];
    device.on('capture', (e) => events.push(e.state));
    const result = await device.capture({ token: TOKEN });
    assert.equal(result.type, 'scan');
    assert.equal(result.nonce, TOKEN);
    assert.equal(result.id, scan.id);
    assert.deepEqual(events, ['waiting', 'captured']);
  });

  it('rejects a record without the challenge token', async () => {
    const key = await signer();
    const scan = await scanRecord(key, 'some-other-token-012345');
    const device = deviceOver(new FakeDevice(key, async (id, push) => push(recordReply(id, scan))));
    await assert.rejects(device.capture({ token: TOKEN }), (e: unknown) => e instanceof CaptureError && e.code === 'NONCE_MISMATCH');
  });

  it('rejects a record changed after signing', async () => {
    const key = await signer();
    const scan = await scanRecord(key, TOKEN, (p) => { p.id = '999000000000999'; });
    const device = deviceOver(new FakeDevice(key, async (id, push) => push(recordReply(id, scan))));
    await assert.rejects(device.capture({ token: TOKEN }), (e: unknown) => e instanceof CaptureError && e.code === 'RECORD_CANONICAL_MISMATCH');
  });

  it('rejects a record signed by another key', async () => {
    const key = await signer();
    const other = await signer();
    const scan = await scanRecord(other, TOKEN);
    // Same canonical text, but signed by a key that is not this device's.
    const json: JsonObject = { id: scan.id as string, previous_signature: b64(PREVIOUS), payload: { ...(scan.payload as JsonObject), tag_id: (scan.payload as JsonObject).id } };
    scan.canonical_string = recomputeRecordCanonicalString(json, 'scan', DEVICE_ID, key.publicKey);
    scan.signature = await other.sign(scan.canonical_string as string);
    const device = deviceOver(new FakeDevice(key, async (id, push) => push(recordReply(id, scan))));
    await assert.rejects(device.capture({ token: TOKEN }), (e: unknown) => e instanceof CaptureError && e.code === 'RECORD_SIGNATURE_INVALID');
  });

  it('reports BUSY when another capture is running', async () => {
    const key = await signer();
    const device = deviceOver(new FakeDevice(key, async (id, push) => push(reply(id, { success: false, status: 2, error_code: 'BUSY', message: 'capture_in_progress' }))));
    await assert.rejects(device.capture(), (e: unknown) => e instanceof DeviceCommandError && e.code === 'BUSY' && /capture_in_progress/.test(e.message));
  });

  it('refuses an unusable token before sending anything', async () => {
    const key = await signer();
    const conn = new FakeDevice(key, async () => {});
    const device = deviceOver(conn);
    await assert.rejects(device.capture({ token: 'has:colon-0123456789' }), (e: unknown) => e instanceof DeviceCommandError && e.code === 'INVALID_ARG');
    assert.ok(!conn.actions.includes('capture'));
  });

  it('ignores a reply that belongs to another request', async () => {
    const key = await signer();
    const scan = await scanRecord(key, TOKEN);
    const device = deviceOver(new FakeDevice(key, async (id, push) => {
      push(reply('someone-elses-request', { success: false, status: 2, error_code: 'BUSY', message: 'capture_in_progress' }));
      await sleep(50);
      push(recordReply(id, scan));
    }));
    const result = await device.capture({ token: TOKEN });
    assert.equal(result.nonce, TOKEN);
  });

  it('verifies an environment record with a nonce', async () => {
    const key = await signer();
    const payload: JsonObject = {
      ctr: 4090, timestamp_utc: 1793772500, uptime_us: 30000000, nonce: 'env-capture-0123456789',
      battery_percent: 85, vbus_present: true, lux: 12.5, temp_c: 23.8, humidity_pct: 36.5, initial_temp_c: 19,
      pressure_hpa: 1026.98, tamper: false, accel_g: { x: 0, y: 0, z: 1 }
    };
    const record: JsonObject = { id: '4090-env', previous_signature: b64(PREVIOUS), payload };
    const canonical = recomputeRecordCanonicalString(record, 'environment', 'A0403F98', key.publicKey) as string;
    assert.ok(canonical.includes(':env-capture-0123456789:1026.98:'), canonical);
    const signed = { ...record, canonical_string: canonical, signature: b64(await key.sign(canonical)) };
    const result = await verifyCaptureReply({ full_record_response: { id: '4090-env', environment_full: signed } }, { id: 'A0403F98', key: key.publicKey }, 'env-capture-0123456789');
    assert.equal(result.type, 'environment');
    assert.equal(result.nonce, 'env-capture-0123456789');
  });
});
