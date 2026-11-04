// SPDX-License-Identifier: Apache-2.0
// StatusResponse field numbers follow lukuid.proto (4 battery_health … 9 product, 10 model);
// the decoder once read them shifted, so product/model/needs_sync were wrong.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import protobuf from 'protobufjs';
import { fileURLToPath } from 'node:url';
import { LukuDecoder } from '../src/index.js';

const root = new protobuf.Root().loadSync(fileURLToPath(new URL('../lukuid.proto', import.meta.url)), { keepCase: true });
const Response = root.lookupType('lukuid.CommandResponse');
const MAGIC = Uint8Array.from([0x4c, 0x55, 0x4b, 0x55, 0x49, 0x44, 0x01, 0x7e]);

function frame(body: Uint8Array): Uint8Array {
  const out = new Uint8Array(MAGIC.length + 4 + body.length + MAGIC.length);
  out.set(MAGIC, 0);
  new DataView(out.buffer).setUint32(MAGIC.length, body.length, true);
  out.set(body, MAGIC.length + 4);
  out.set(MAGIC, MAGIC.length + 4 + body.length);
  return out;
}

describe('codec: status', () => {
  it('decodes every StatusResponse field at its proto number', () => {
    const body = Response.encode(Response.fromObject({
      action: 'status', success: true, status: 1,
      status_response: {
        id: 'A0403F98', name: 'LukuID Environment', public_key: new Uint8Array(32).fill(7), battery_health: 0.5,
        timestamp: 1793772500, has_attestation: true, has_heartbeat: true, needs_sync: true, product: 'environment', model: 'v1.0'
      }
    })).finish();
    const [decoded] = new LukuDecoder().push(frame(body)) as Array<Record<string, unknown>>;
    assert.equal(decoded.id, 'A0403F98');
    assert.equal(decoded.name, 'LukuID Environment');
    assert.equal(decoded.battery_health, 0.5);
    assert.equal(Number(decoded.timestamp), 1793772500);
    assert.equal(decoded.has_attestation, true);
    assert.equal(decoded.has_heartbeat, true);
    assert.equal(decoded.needs_sync, true);
    assert.equal(decoded.product, 'environment');
    assert.equal(decoded.model, 'v1.0');
  });
});
