// SPDX-License-Identifier: Apache-2.0
// nanopb (firmware) never writes a proto3 bool that is false, so a real error
// reply carries status=STATUS_ERROR and error_code but no `success` field.
// It must decode as ok:false, not default to success.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { LukuDecoder } from '../src/index.js';

const MAGIC = Uint8Array.from([0x4c, 0x55, 0x4b, 0x55, 0x49, 0x44, 0x01, 0x7e]);

function frame(body: Uint8Array): Uint8Array {
  const out = new Uint8Array(MAGIC.length + 4 + body.length + MAGIC.length);
  out.set(MAGIC, 0);
  new DataView(out.buffer).setUint32(MAGIC.length, body.length, true);
  out.set(body, MAGIC.length + 4);
  out.set(MAGIC, MAGIC.length + 4 + body.length);
  return out;
}

function str(field: number, value: string): number[] {
  const bytes = Array.from(new TextEncoder().encode(value));
  return [(field << 3) | 2, bytes.length, ...bytes];
}

describe('codec: error replies as nanopb encodes them', () => {
  it('decodes STATUS_ERROR without a success field as ok:false', () => {
    // action=1 "capture", status=2 STATUS_ERROR (2), error_code=4, message=5; no field 3.
    const body = Uint8Array.from([...str(1, 'capture'), 0x10, 0x02, ...str(4, 'BUSY'), ...str(5, 'capture_in_progress')]);
    const [decoded] = new LukuDecoder().push(frame(body)) as Array<Record<string, unknown>>;
    assert.equal(decoded.ok, false);
    assert.deepEqual(decoded.err, { code: 'BUSY', msg: 'capture_in_progress' });
  });

  it('still decodes STATUS_OK with success=true as ok', () => {
    const body = Uint8Array.from([...str(1, 'ping'), 0x10, 0x01, 0x18, 0x01]);
    const [decoded] = new LukuDecoder().push(frame(body)) as Array<Record<string, unknown>>;
    assert.equal(decoded.ok, true);
  });
});
