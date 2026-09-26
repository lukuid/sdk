// SPDX-License-Identifier: Apache-2.0
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { encodeFrame, LukuDecoder } from '../src/index.js';

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

function writeBytes(out: number[], field: number, value: Uint8Array): void {
  writeKey(out, field, 2);
  writeVarint(out, value.length);
  out.push(...value);
}

function writeBool(out: number[], field: number, value: boolean): void {
  writeKey(out, field, 0);
  writeVarint(out, value ? 1 : 0);
}

function writeU32(out: number[], field: number, value: number): void {
  writeKey(out, field, 0);
  writeVarint(out, value);
}

describe('LukuDecoder', () => {
  it('ignores echoed info requests and reassembles split info responses', () => {
    const echoedRequest = encodeFrame({
      action: 'info',
      id: 'probe',
      opts: {}
    });

    const payload: number[] = [];
    writeString(payload, 1, 'info');
    writeU32(payload, 2, 1);
    const infoPayload: number[] = [];
    writeString(infoPayload, 10, 'B784AE14');
    writeString(infoPayload, 11, 'environment');
    writeString(infoPayload, 12, 'LUKUID-GUARDCARD-V1');
    writeString(infoPayload, 13, 'v1.0.0');
    writeBytes(infoPayload, 28, Uint8Array.from(Buffer.from('t4SuFBxXUx2rMw4uYlwcPuAoXJB/NuNSQF1lTLrbVRg=', 'base64')));
    writeKey(payload, 6, 2);
    writeVarint(payload, infoPayload.length);
    payload.push(...infoPayload);
    const responseFrame = new Uint8Array([
      ...encodeFrame({ action: 'noop', id: 'ignored' }).slice(0, 0),
      ...(() => {
        const magic = new Uint8Array([0x4c, 0x55, 0x4b, 0x55, 0x49, 0x44, 0x01, 0x7e]);
        const body = Uint8Array.from(payload);
        const framed = new Uint8Array(magic.length + 4 + body.length + magic.length);
        framed.set(magic, 0);
        new DataView(framed.buffer).setUint32(magic.length, body.length, true);
        framed.set(body, magic.length + 4);
        framed.set(magic, magic.length + 4 + body.length);
        return framed;
      })()
    ]);

    const decoder = new LukuDecoder();
    const frames: unknown[] = [];
    const stream = new Uint8Array(echoedRequest.length + responseFrame.length);
    stream.set(echoedRequest, 0);
    stream.set(responseFrame, echoedRequest.length);

    for (let offset = 0; offset < stream.length; offset += 64) {
      frames.push(...decoder.push(stream.slice(offset, offset + 64)));
    }

    assert.strictEqual(frames.length, 1);
    const response = frames[0] as Record<string, unknown>;
    assert.strictEqual(response.action, 'info');
    assert.strictEqual(response.id, 'B784AE14');
    assert.strictEqual(
      Buffer.from(response.key as Uint8Array).toString('base64'),
      't4SuFBxXUx2rMw4uYlwcPuAoXJB/NuNSQF1lTLrbVRg='
    );
  });
});

describe('encodeFrame', () => {
  it('correctly encodes F64 values (lat/lng)', () => {
    const frame = encodeFrame({
      action: 'attest',
      id: 'test',
      lat: 1.234567,
      lng: -98.765432
    } as any);

    const payload = frame.slice(8 + 4, frame.length - 8);
    let foundAttest = false;
    for (let i = 0; i < payload.length; i++) {
      if (payload[i] === 0x22) { // Field 4, Wire 2
        foundAttest = true;
        const len = payload[i+1];
        const nested = payload.slice(i + 2, i + 2 + len);
        
        let foundLat = false;
        let foundLng = false;
        for (let j = 0; j < nested.length; j++) {
          if (nested[j] === 0x41) { // Field 8, Wire 1
            foundLat = true;
            const val = new DataView(nested.buffer, nested.byteOffset + j + 1, 8).getFloat64(0, true);
            assert.strictEqual(val, 1.234567);
            j += 8;
          } else if (nested[j] === 0x49) { // Field 9, Wire 1
            foundLng = true;
            const val = new DataView(nested.buffer, nested.byteOffset + j + 1, 8).getFloat64(0, true);
            assert.strictEqual(val, -98.765432);
            j += 8;
          }
        }
        assert.ok(foundLat, 'Should have found lat');
        assert.ok(foundLng, 'Should have found lng');
      }
    }
    assert.ok(foundAttest, 'Should have found attest message');
  });

  it('decodes request_id without overwriting status device id and decodes historical_export and attachment_records', () => {
    const payload: number[] = [];
    writeString(payload, 1, 'status');
    writeU32(payload, 2, 0); // status 0 (OK)
    writeBool(payload, 3, true); // success

    // StatusResponse (field 16) with device id "GC-SERIAL-1"
    const statusPayload: number[] = [];
    writeString(statusPayload, 1, 'GC-SERIAL-1');
    writeString(statusPayload, 2, 'LukuGuard');
    writeKey(payload, 16, 2);
    writeVarint(payload, statusPayload.length);
    payload.push(...statusPayload);

    // request_id (field 22)
    writeString(payload, 22, 'req-uuid-1234');

    // RecordBatches (field 15) with an AttachmentRecord (field 13)
    const batchesPayload: number[] = [];
    const batchPayload: number[] = [];
    const attachPayload: number[] = [];
    writeString(attachPayload, 1, '1.0');
    writeString(attachPayload, 2, 'ATTACH-1');
    writeString(attachPayload, 3, 'PARENT-1');
    writeString(attachPayload, 9, 'custody');
    writeString(attachPayload, 19, 'handoff');
    writeString(attachPayload, 21, 'received');
    writeString(attachPayload, 22, 'shipment-999');

    writeKey(batchPayload, 13, 2);
    writeVarint(batchPayload, attachPayload.length);
    batchPayload.push(...attachPayload);
    writeString(batchPayload, 10, 'root-att-fp');
    writeString(batchPayload, 11, 'root-hb-fp');

    writeKey(batchesPayload, 1, 2);
    writeVarint(batchesPayload, batchPayload.length);
    batchesPayload.push(...batchPayload);

    writeKey(payload, 15, 2);
    writeVarint(payload, batchesPayload.length);
    payload.push(...batchesPayload);

    const magic = new Uint8Array([0x4c, 0x55, 0x4b, 0x55, 0x49, 0x44, 0x01, 0x7e]);
    const body = Uint8Array.from(payload);
    const framed = new Uint8Array(magic.length + 4 + body.length + magic.length);
    framed.set(magic, 0);
    new DataView(framed.buffer).setUint32(magic.length, body.length, true);
    framed.set(body, magic.length + 4);
    framed.set(magic, magic.length + 4 + body.length);

    const decoder = new LukuDecoder();
    const frames = decoder.push(framed);
    assert.strictEqual(frames.length, 1);
    const res = frames[0] as Record<string, unknown>;

    assert.strictEqual(res.id, 'GC-SERIAL-1');
    assert.strictEqual(res.request_id, 'req-uuid-1234');

    const batches = (res.record_batches as any)?.batches;
    assert.ok(Array.isArray(batches) && batches.length === 1);
    assert.strictEqual(batches[0].attestation_root_fingerprint, 'root-att-fp');
    assert.strictEqual(batches[0].heartbeat_root_fingerprint, 'root-hb-fp');

    const attachmentRecords = batches[0].attachment_records;
    assert.ok(Array.isArray(attachmentRecords) && attachmentRecords.length === 1);
    assert.strictEqual(attachmentRecords[0].type, 'custody');
    assert.strictEqual(attachmentRecords[0].parent_record_id, 'PARENT-1');
    assert.strictEqual((attachmentRecords[0].payload as any)?.event, 'handoff');
    assert.strictEqual((attachmentRecords[0].payload as any)?.status, 'received');
    assert.strictEqual((attachmentRecords[0].payload as any)?.context_ref, 'shipment-999');
  });
});
