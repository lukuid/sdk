// SPDX-License-Identifier: Apache-2.0
import type { DeviceFrame } from './types.js';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const MAGIC = new Uint8Array([0x4c, 0x55, 0x4b, 0x55, 0x49, 0x44, 0x01, 0x7e]);
const MAX_FRAME_LEN = 10 * 1024 * 1024;

const WIRE_VARINT = 0;
const WIRE_FIXED64 = 1;
const WIRE_LENGTH_DELIMITED = 2;
const WIRE_FIXED32 = 5;

type JsonRecord = Record<string, unknown>;

function normalizeBytesValue(value: unknown): Uint8Array | undefined {
  if (value instanceof Uint8Array) {
    return value;
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  if (value.startsWith('-----BEGIN')) {
    return encoder.encode(value);
  }
  const normalized = value.replace(/\s+/g, '');
  if (normalized.length > 0 && normalized.length % 4 === 0 && /^[A-Za-z0-9+/=]+$/.test(normalized)) {
    const decoded = decodeBase64(normalized);
    if (decoded) {
      return decoded;
    }
  }
  return encoder.encode(value);
}

// Ensure Buffer doesn't cause TS errors in universal environments
declare const Buffer: any;

function decodeBase64(value: string): Uint8Array | undefined {
  if (typeof Buffer !== 'undefined') {
    return Uint8Array.from(Buffer.from(value, 'base64'));
  }
  if (typeof atob === 'function') {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  return undefined;
}

export function encodeFrame(frame: DeviceFrame): Uint8Array {
  const payload = encodeCommandRequest(frame);
  const out = new Uint8Array(MAGIC.length + 4 + payload.length + MAGIC.length);
  out.set(MAGIC, 0);
  new DataView(out.buffer).setUint32(MAGIC.length, payload.length, true);
  out.set(payload, MAGIC.length + 4);
  out.set(MAGIC, MAGIC.length + 4 + payload.length);
  return out;
}

export class LukuDecoder {
  private buffer = new Uint8Array(0);

  push(chunk: Uint8Array): unknown[] {
    const next = new Uint8Array(this.buffer.length + chunk.length);
    next.set(this.buffer);
    next.set(chunk, this.buffer.length);
    this.buffer = next;
    return this.scan();
  }

  reset(): void {
    this.buffer = new Uint8Array(0);
  }

  private scan(): unknown[] {
    const frames: unknown[] = [];
    let consumed = 0;
    const len = this.buffer.length;
    const view = new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.byteLength);

    while (true) {
      if (len - consumed < MAGIC.length) break;

      const magicIdx = findMagic(this.buffer, consumed);
      if (magicIdx === -1) {
        consumed = Math.max(consumed, len - (MAGIC.length - 1));
        break;
      }

      consumed = magicIdx;

      if (len - consumed < MAGIC.length + 4) break;

      const payloadLen = view.getUint32(consumed + MAGIC.length, true);
      if (payloadLen > MAX_FRAME_LEN) {
        consumed += 1;
        continue;
      }

      const totalSize = MAGIC.length + 4 + payloadLen + MAGIC.length;
      if (len - consumed < totalSize) break;

      const trailerStart = consumed + MAGIC.length + 4 + payloadLen;
      if (!magicMatches(this.buffer, trailerStart)) {
        consumed += 1;
        continue;
      }

      const payloadBytes = this.buffer.subarray(
        consumed + MAGIC.length + 4,
        consumed + MAGIC.length + 4 + payloadLen
      );

      const frame = decodeCommandResponse(payloadBytes);
      if (frame) {
        frames.push(frame);
      }

      consumed += totalSize;
    }

    if (consumed > 0) {
      this.buffer = this.buffer.slice(consumed);
    }

    return frames;
  }
}

function findMagic(buf: Uint8Array, start: number): number {
  for (let i = start; i <= buf.length - MAGIC.length; i += 1) {
    if (magicMatches(buf, i)) {
      return i;
    }
  }
  return -1;
}

function magicMatches(buf: Uint8Array, offset: number): boolean {
  if (offset < 0 || offset + MAGIC.length > buf.length) {
    return false;
  }

  for (let i = 0; i < MAGIC.length; i += 1) {
    if (buf[offset + i] !== MAGIC[i]) {
      return false;
    }
  }

  return true;
}

function encodeCommandRequest(frame: DeviceFrame): Uint8Array {
  const record = frame as JsonRecord;
  const opts = isRecord(record.opts) ? record.opts : undefined;
  const source = opts ?? record;
  const action = typeof record.action === 'string' ? record.action : '';
  const chunks: number[] = [];

  writeString(chunks, 1, action);

  if (action === 'fetch' || action === 'history') {
    const nested: number[] = [];
    const query = firstString(source.query, source.id, source.device_id);
    if (query) writeString(nested, 1, query);
    if (typeof source.offset === 'number') writeUint32(nested, 2, source.offset);
    if (typeof source.limit === 'number') writeUint32(nested, 3, source.limit);
    if (typeof source.fetch_full === 'boolean') writeBool(nested, 4, source.fetch_full);
    if (typeof source.starts === 'number') writeInt64(nested, 5, source.starts);
    if (typeof source.ends === 'number') writeInt64(nested, 6, source.ends);
    const windowValue = normalizeFetchWindow(source.window);
    if (windowValue !== undefined) writeUint32(nested, 7, windowValue);
    writeMessage(chunks, 2, nested);
  } else if (action === 'get') {
    const nested: number[] = [];
    const recordId = firstString(source.record_id, source.id, source.device_id);
    if (recordId) writeString(nested, 1, recordId);
    writeMessage(chunks, 3, nested);
  } else if (action === 'attest') {
    const nested: number[] = [];
    const recordId = firstString(source.parent_record_id, source.record_id, source.id);
    if (recordId) writeString(nested, 1, recordId);
    const sig = normalizeBytesValue(source.signature);
    if (sig) writeBytesField(nested, 2, sig);
    if (typeof source.checksum === 'string') writeString(nested, 3, source.checksum);
    if (typeof source.mime === 'string') writeString(nested, 5, source.mime);
    if (typeof source.type === 'string') writeString(nested, 6, source.type);
    if (typeof source.title === 'string') writeString(nested, 7, source.title);
    if (typeof source.lat === 'number') writeF64(nested, 8, source.lat);
    if (typeof source.lng === 'number') writeF64(nested, 9, source.lng);
    if (typeof source.content === 'string') writeString(nested, 10, source.content);
    if (typeof source.merkle_root === 'string') writeString(nested, 11, source.merkle_root);
    writeMessage(chunks, 4, nested);
  } else if (action === 'config' || action === 'configure') {
    const nested: number[] = [];
    if (typeof source.name === 'string') writeString(nested, 1, source.name);
    if (typeof source.wifi_ssid === 'string') writeString(nested, 2, source.wifi_ssid);
    if (typeof source.wifi_password === 'string') writeString(nested, 3, source.wifi_password);
    if (typeof source.mqtt_broker_url === 'string') writeString(nested, 4, source.mqtt_broker_url);
    if (typeof source.mqtt_port === 'number') writeUint32(nested, 5, source.mqtt_port);
    if (typeof source.mqtt_topic === 'string') writeString(nested, 6, source.mqtt_topic);
    if (typeof source.mqtt_broadcast_frequency_seconds === 'number') writeUint32(nested, 7, source.mqtt_broadcast_frequency_seconds);
    if (typeof source.mqtt_username === 'string') writeString(nested, 8, source.mqtt_username);
    if (typeof source.mqtt_password === 'string') writeString(nested, 9, source.mqtt_password);
    
    const cert = normalizeBytesValue(source.mqtt_certificate_der);
    if (cert) writeBytesField(nested, 10, cert);

    const ca = normalizeBytesValue(source.mqtt_ca_der);
    if (ca) writeBytesField(nested, 11, ca);

    if (typeof source.mqtt_broadcast_enabled === 'boolean') writeBool(nested, 12, source.mqtt_broadcast_enabled);
    if (typeof source.custom_heartbeat_url === 'string') writeString(nested, 13, source.custom_heartbeat_url);
    if (typeof source.telemetry_enabled === 'boolean') writeBool(nested, 14, source.telemetry_enabled);
    writeMessage(chunks, 5, nested);
  } else if (action === 'ota_begin') {
    const nested: number[] = [];
    if (typeof source.size === 'number') writeUint32(nested, 1, source.size);
    const pubkey = source.public_key;
    if (pubkey instanceof Uint8Array) writeBytesField(nested, 2, pubkey);
    if (typeof source.binary_mode === 'boolean') writeBool(nested, 3, source.binary_mode);
    writeMessage(chunks, 6, nested);
  } else if (action === 'ota_data') {
    const nested: number[] = [];
    const data = source.data;
    if (data instanceof Uint8Array) writeBytesField(nested, 1, data);
    if (typeof source.offset === 'number') writeUint32(nested, 2, source.offset);
    writeMessage(chunks, 7, nested);
  } else if (action === 'ota_end') {
    const nested: number[] = [];
    const sig = source.signature;
    if (sig instanceof Uint8Array) writeBytesField(nested, 1, sig);
    writeMessage(chunks, 8, nested);
  } else if (action === 'set_attestation') {
    const nested: number[] = [];
    const cert = normalizeBytesValue(source.dac_der);
    if (cert) writeBytesField(nested, 1, cert);

    const auth = normalizeBytesValue(source.manufacturer_der ?? source.functional_der);
    if (auth) writeBytesField(nested, 2, auth);

    const sig = normalizeBytesValue(source.signature);
    if (sig) writeBytesField(nested, 3, sig);

    if (typeof source.counter === 'number') writeVarintField(nested, 4, source.counter);
    if (typeof source.nonce === 'string') writeString(nested, 5, source.nonce);
    const intermediate = normalizeBytesValue(source.intermediate_der);
    if (intermediate) writeBytesField(nested, 6, intermediate);
    writeMessage(chunks, 9, nested);
  } else if (action === 'set_heartbeat') {
    const nested: number[] = [];
    const slac = normalizeBytesValue(source.slac_der);
    if (slac) writeBytesField(nested, 1, slac);

    const heartbeat = normalizeBytesValue(source.heartbeat_der);
    if (heartbeat) writeBytesField(nested, 2, heartbeat);

    const sig = normalizeBytesValue(source.signature);
    if (sig) writeBytesField(nested, 3, sig);

    if (typeof source.timestamp === 'number') writeInt64(nested, 4, source.timestamp);
    const inter = normalizeBytesValue(source.intermediate_der);
    if (inter) writeBytesField(nested, 5, inter);
    writeMessage(chunks, 10, nested);
  } else if (action === 'scan_enable') {
    const nested: number[] = [];
    if (typeof source.enabled === 'boolean') writeBool(nested, 1, source.enabled);
    writeMessage(chunks, 12, nested);
  } else if (action === 'generate_heartbeat') {
    writeMessage(chunks, 13, []);
  } else if (action === 'fetch_telemetry') {
    writeMessage(chunks, 14, []);
  }

  return Uint8Array.from(chunks);
}

function writeBytesField(out: number[], field: number, value: Uint8Array): void {
  writeKey(out, field, WIRE_LENGTH_DELIMITED);
  writeVarint(out, value.length);
  for (let i = 0; i < value.length; i++) out.push(value[i]);
}

function decodeCommandResponse(payload: Uint8Array): JsonRecord | null {
  if (!looksLikeCommandResponse(payload)) {
    return null;
  }

  const out: JsonRecord = {};
  const cursor = { value: 0 };

  while (cursor.value < payload.length) {
    const key = readVarint(payload, cursor);
    if (key === null) {
      return null;
    }

    const field = key >>> 3;
    const wireType = key & 0x07;

    switch (field) {
      case 1:
        assignString(payload, cursor, wireType, out, 'action');
        break;
      case 2: {
        const status = readVarintField(payload, cursor, wireType);
        if (status === null) return null;
        out.status = statusName(status);
        break;
      }
      case 3:
        assignBool(payload, cursor, wireType, out, 'success');
        break;
      case 4:
        assignString(payload, cursor, wireType, out, 'error_code');
        break;
      case 5:
        assignString(payload, cursor, wireType, out, 'message');
        break;
      case 6: {
        const message = readLengthDelimited(payload, cursor, wireType);
        if (message === null) return null;
        const info = decodeDeviceInfoResponse(message);
        Object.assign(out, info);
        break;
      }
      case 7: {
        const message = readLengthDelimited(payload, cursor, wireType);
        if (message === null) return null;
        const config = decodeNetworkConfigResponse(message);
        Object.assign(out, config);
        break;
      }
      case 8: {
        const message = readLengthDelimited(payload, cursor, wireType);
        if (message === null) return null;
        out.scan_record = decodeScanRecord(message);
        break;
      }
      case 9: {
        const message = readLengthDelimited(payload, cursor, wireType);
        if (message === null) return null;
        out.env_record = decodeEnvironmentRecord(message);
        break;
      }
      case 10: {
        const message = readLengthDelimited(payload, cursor, wireType);
        if (message === null) return null;
        out.data = decodeFetchResponse(message);
        break;
      }
      case 11: {
        const message = readLengthDelimited(payload, cursor, wireType);
        if (message === null) return null;
        out.full_record_response = decodeFullRecordResponse(message);
        break;
      }
      case 15: {
        const message = readLengthDelimited(payload, cursor, wireType);
        if (message === null) return null;
        out.record_batches = decodeRecordBatches(message);
        break;
      }
      case 14: {
        const message = readLengthDelimited(payload, cursor, wireType);
        if (message === null) return null;
        Object.assign(out, decodeHeartbeatInitResponse(message));
        break;
      }
      default:
        if (!skipField(payload, cursor, wireType)) {
          return null;
        }
        break;
    }
  }

  const success = typeof out.success === 'boolean' ? out.success : true;
  out.ok = success;
  if (!success) {
    const code = typeof out.error_code === 'string' ? out.error_code : 'DEVICE_ERROR';
    const message = typeof out.message === 'string' ? out.message : code;
    out.err = { code, msg: message };
    out.error = message;
  }

  return out;
}

function looksLikeCommandResponse(payload: Uint8Array): boolean {
  const cursor = { value: 0 };
  let sawStatus = false;
  let sawSuccess = false;

  while (cursor.value < payload.length) {
    const key = readVarint(payload, cursor);
    if (key === null) {
      return false;
    }

    const field = key >>> 3;
    const wireType = key & 0x07;
    if (field === 2) {
      sawStatus = true;
    } else if (field === 3) {
      sawSuccess = true;
    }

    if (!skipField(payload, cursor, wireType)) {
      return false;
    }
  }

  return sawStatus || sawSuccess;
}

function decodeFetchResponse(payload: Uint8Array): unknown[] {
  const cursor = { value: 0 };
  const entries: unknown[] = [];

  while (cursor.value < payload.length) {
    const key = readVarint(payload, cursor);
    if (key === null) break;
    const field = key >>> 3;
    const wireType = key & 0x07;

    if (field === 1) {
      const message = readLengthDelimited(payload, cursor, wireType);
      if (message === null) break;
      const entry = decodeDataEntry(message);
      if (entry) {
        entries.push(entry);
      }
      continue;
    }

    if (!skipField(payload, cursor, wireType)) {
      break;
    }
  }

  return entries;
}

function decodeDataEntry(payload: Uint8Array): JsonRecord | null {
  const cursor = { value: 0 };

  while (cursor.value < payload.length) {
    const key = readVarint(payload, cursor);
    if (key === null) return null;
    const field = key >>> 3;
    const wireType = key & 0x07;
    const message = readLengthDelimited(payload, cursor, wireType);
    if (message === null) return null;

    if (field === 1) {
      return {
        view: 'animalreader_list',
        type: 'scan_min',
        record: decodeScanRecordMin(message)
      };
    }

    if (field === 2) {
      return {
        view: 'guardcard_list',
        type: 'environment_min',
        record: decodeEnvironmentRecordMin(message)
      };
    }
  }

  return null;
}

function decodeScanRecordMin(payload: Uint8Array): JsonRecord {
  const cursor = { value: 0 };
  const out: JsonRecord = {};

  while (cursor.value < payload.length) {
    const key = readVarint(payload, cursor);
    if (key === null) break;
    const field = key >>> 3;
    const wireType = key & 0x07;

    switch (field) {
      case 1:
        assignString(payload, cursor, wireType, out, 'version');
        break;
      case 2:
        assignString(payload, cursor, wireType, out, 'record_id');
        break;
      case 3:
        assignInt64(payload, cursor, wireType, out, 'timestamp_utc');
        break;
      case 4:
        assignString(payload, cursor, wireType, out, 'tag_id');
        break;
      case 5:
        assignUint32(payload, cursor, wireType, out, 'score_bio');
        break;
      case 6:
        assignUint32(payload, cursor, wireType, out, 'score_auth');
        break;
      case 7:
        assignUint32(payload, cursor, wireType, out, 'score_env');
        break;
      default:
        if (!skipField(payload, cursor, wireType)) {
          return out;
        }
        break;
    }
  }

  return out;
}

function decodeEnvironmentRecordMin(payload: Uint8Array): JsonRecord {
  const cursor = { value: 0 };
  const out: JsonRecord = {};

  while (cursor.value < payload.length) {
    const key = readVarint(payload, cursor);
    if (key === null) break;
    const field = key >>> 3;
    const wireType = key & 0x07;

    switch (field) {
      case 1:
        assignString(payload, cursor, wireType, out, 'version');
        break;
      case 2:
        assignString(payload, cursor, wireType, out, 'record_id');
        break;
      case 3:
        assignInt64(payload, cursor, wireType, out, 'timestamp_utc');
        break;
      case 4:
        assignMetricValue(payload, cursor, wireType, out, 'lux');
        break;
      case 5:
        assignMetricValue(payload, cursor, wireType, out, 'temp_c');
        break;
      case 6:
        assignMetricValue(payload, cursor, wireType, out, 'humidity_pct');
        break;
      case 7:
        assignMetricValue(payload, cursor, wireType, out, 'voc_index');
        break;
      case 8:
        assignBool(payload, cursor, wireType, out, 'tamper');
        break;
      case 9:
        assignBool(payload, cursor, wireType, out, 'wake_event');
        break;
      case 10:
        assignBool(payload, cursor, wireType, out, 'vbus_present');
        break;
      default:
        if (!skipField(payload, cursor, wireType)) {
          return out;
        }
        break;
    }
  }

  return out;
}

function assignMetricValue(
  payload: Uint8Array,
  cursor: { value: number },
  wireType: number,
  out: JsonRecord,
  key: string
): void {
  const message = readLengthDelimited(payload, cursor, wireType);
  if (message === null) return;
  out[key] = decodeMetricValue(message);
}

function decodeMetricValue(payload: Uint8Array): unknown {
  const cursor = { value: 0 };

  while (cursor.value < payload.length) {
    const key = readVarint(payload, cursor);
    if (key === null) return null;
    const field = key >>> 3;
    const wireType = key & 0x07;

    if (field === 1) {
      return readFloat32Field(payload, cursor, wireType);
    }

    if (field === 2) {
      const message = readLengthDelimited(payload, cursor, wireType);
      return message === null ? null : decodeMetricStats(message);
    }

    if (!skipField(payload, cursor, wireType)) {
      return null;
    }
  }

  return null;
}

function decodeMetricStats(payload: Uint8Array): JsonRecord {
  const cursor = { value: 0 };
  const out: JsonRecord = {};

  while (cursor.value < payload.length) {
    const key = readVarint(payload, cursor);
    if (key === null) break;
    const field = key >>> 3;
    const wireType = key & 0x07;

    switch (field) {
      case 1:
        assignFloat32(payload, cursor, wireType, out, 'avg');
        break;
      case 2:
        assignFloat32(payload, cursor, wireType, out, 'min');
        break;
      case 3:
        assignFloat32(payload, cursor, wireType, out, 'max');
        break;
      case 4:
        assignFloat32(payload, cursor, wireType, out, 'variance');
        break;
      case 5:
        assignUint32(payload, cursor, wireType, out, 'count');
        break;
      default:
        if (!skipField(payload, cursor, wireType)) {
          return out;
        }
        break;
    }
  }

  return out;
}

function assignString(
  payload: Uint8Array,
  cursor: { value: number },
  wireType: number,
  out: JsonRecord,
  key: string
): void {
  const value = readStringField(payload, cursor, wireType);
  if (value !== null) {
    out[key] = value;
  }
}

function assignBool(
  payload: Uint8Array,
  cursor: { value: number },
  wireType: number,
  out: JsonRecord,
  key: string
): void {
  const value = readVarintField(payload, cursor, wireType);
  if (value !== null) {
    out[key] = value !== 0;
  }
}

function assignUint32(
  payload: Uint8Array,
  cursor: { value: number },
  wireType: number,
  out: JsonRecord,
  key: string
): void {
  const value = readVarintField(payload, cursor, wireType);
  if (value !== null) {
    out[key] = value >>> 0;
  }
}

function assignUint64(
  payload: Uint8Array,
  cursor: { value: number },
  wireType: number,
  out: JsonRecord,
  key: string
): void {
  const value = readVarintField(payload, cursor, wireType);
  if (value !== null) {
    out[key] = value;
  }
}

function assignInt64(
  payload: Uint8Array,
  cursor: { value: number },
  wireType: number,
  out: JsonRecord,
  key: string
): void {
  const value = readVarintField(payload, cursor, wireType);
  if (value !== null) {
    out[key] = value;
  }
}

function assignFloat32(
  payload: Uint8Array,
  cursor: { value: number },
  wireType: number,
  out: JsonRecord,
  key: string
): void {
  const value = readFloat32Field(payload, cursor, wireType);
  if (value !== null) {
    out[key] = value;
  }
}

function assignFloat64(
  payload: Uint8Array,
  cursor: { value: number },
  wireType: number,
  out: JsonRecord,
  key: string
): void {
  const value = readFloat64Field(payload, cursor, wireType);
  if (value !== null) {
    out[key] = value;
  }
}

function readVarintField(payload: Uint8Array, cursor: { value: number }, wireType: number): number | null {
  if (wireType !== WIRE_VARINT) return null;
  return readVarint(payload, cursor);
}

function readFloat32Field(payload: Uint8Array, cursor: { value: number }, wireType: number): number | null {
  if (wireType !== WIRE_FIXED32 || payload.length - cursor.value < 4) return null;
  const value = new DataView(payload.buffer, payload.byteOffset + cursor.value, 4).getFloat32(0, true);
  cursor.value += 4;
  return value;
}

function readFloat64Field(payload: Uint8Array, cursor: { value: number }, wireType: number): number | null {
  if (wireType !== WIRE_FIXED64 || payload.length - cursor.value < 8) return null;
  const value = new DataView(payload.buffer, payload.byteOffset + cursor.value, 8).getFloat64(0, true);
  cursor.value += 8;
  return value;
}

function readStringField(payload: Uint8Array, cursor: { value: number }, wireType: number): string | null {
  const bytes = readLengthDelimited(payload, cursor, wireType);
  return bytes ? decoder.decode(bytes) : null;
}

function readLengthDelimited(
  payload: Uint8Array,
  cursor: { value: number },
  wireType: number
): Uint8Array | null {
  if (wireType !== WIRE_LENGTH_DELIMITED) return null;
  const len = readVarint(payload, cursor);
  if (len === null || payload.length - cursor.value < len) return null;
  const value = payload.subarray(cursor.value, cursor.value + len);
  cursor.value += len;
  return value;
}

function skipField(payload: Uint8Array, cursor: { value: number }, wireType: number): boolean {
  switch (wireType) {
    case WIRE_VARINT:
      return readVarint(payload, cursor) !== null;
    case WIRE_FIXED64:
      if (payload.length - cursor.value < 8) return false;
      cursor.value += 8;
      return true;
    case WIRE_LENGTH_DELIMITED: {
      const len = readVarint(payload, cursor);
      if (len === null || payload.length - cursor.value < len) return false;
      cursor.value += len;
      return true;
    }
    case WIRE_FIXED32:
      if (payload.length - cursor.value < 4) return false;
      cursor.value += 4;
      return true;
    default:
      return false;
  }
}

function readVarint(payload: Uint8Array, cursor: { value: number }): number | null {
  let shift = 0;
  let out = 0;

  for (let i = 0; i < 10; i += 1) {
    if (cursor.value >= payload.length) return null;
    const byte = payload[cursor.value];
    cursor.value += 1;

    out += (byte & 0x7f) * 2 ** shift;
    if ((byte & 0x80) === 0) {
      return out;
    }
    shift += 7;
  }

  return null;
}

function writeKey(out: number[], field: number, wireType: number): void {
  writeVarint(out, (field << 3) | wireType);
}

function writeVarint(out: number[], value: number): void {
  let next = Math.trunc(value);
  while (next >= 0x80) {
    out.push((next & 0x7f) | 0x80);
    next = Math.floor(next / 128);
  }
  out.push(next);
}

function writeBool(out: number[], field: number, value: boolean): void {
  writeKey(out, field, WIRE_VARINT);
  writeVarint(out, value ? 1 : 0);
}

function writeUint32(out: number[], field: number, value: number): void {
  writeKey(out, field, WIRE_VARINT);
  writeVarint(out, value >>> 0);
}

function writeVarintField(out: number[], field: number, value: number): void {
  writeKey(out, field, WIRE_VARINT);
  writeVarint(out, value);
}

function writeInt64(out: number[], field: number, value: number): void {
  writeKey(out, field, WIRE_VARINT);
  if (value < 0) {
    let bigint = BigInt.asUintN(64, BigInt(Math.trunc(value)));
    while (bigint >= 0x80n) {
      out.push(Number((bigint & 0x7fn) | 0x80n));
      bigint >>= 7n;
    }
    out.push(Number(bigint));
    return;
  }
  writeVarint(out, value);
}

function writeF32(out: number[], field: number, value: number): void {
  writeKey(out, field, WIRE_FIXED32);
  const buf = new ArrayBuffer(4);
  const view = new DataView(buf);
  view.setFloat32(0, value, true);
  out.push(...new Uint8Array(buf));
}

function writeF64(out: number[], field: number, value: number): void {
  writeKey(out, field, WIRE_FIXED64);
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setFloat64(0, value, true);
  out.push(...new Uint8Array(buf));
}

function writeString(out: number[], field: number, value: string): void {
  const bytes = encoder.encode(value);
  writeKey(out, field, WIRE_LENGTH_DELIMITED);
  writeVarint(out, bytes.length);
  out.push(...bytes);
}

function writeMessage(out: number[], field: number, value: number[]): void {
  writeKey(out, field, WIRE_LENGTH_DELIMITED);
  writeVarint(out, value.length);
  out.push(...value);
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  return undefined;
}

function stringOrEmptyIfPresent(source: JsonRecord, key: string): string | undefined {
  if (!Object.prototype.hasOwnProperty.call(source, key)) {
    return undefined;
  }

  const value = source[key];
  return typeof value === 'string' ? value : '';
}

function normalizeFetchWindow(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  switch (value.trim().toLowerCase()) {
    case 'none':
    case 'fetch_window_none':
      return 0;
    case 'hourly':
    case 'fetch_window_hourly':
      return 1;
    case 'daily':
    case 'fetch_window_daily':
      return 2;
    case 'weekly':
    case 'fetch_window_weekly':
      return 3;
    case 'monthly':
    case 'fetch_window_monthly':
      return 4;
    default:
      return undefined;
  }
}

function statusName(value: number): string {
  switch (value) {
    case 1:
      return 'STATUS_OK';
    case 2:
      return 'STATUS_ERROR';
    case 3:
      return 'STATUS_READY';
    default:
      return 'STATUS_UNKNOWN';
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function decodeDeviceInfoResponse(payload: Uint8Array): JsonRecord {
  const cursor = { value: 0 };
  const out: JsonRecord = {};
  while (cursor.value < payload.length) {
    const key = readVarint(payload, cursor);
    if (key === null) break;
    const field = key >>> 3;
    const wireType = key & 0x07;
    switch (field) {
      case 1: assignString(payload, cursor, wireType, out, 'handshake'); break;
      case 2: assignInt64(payload, cursor, wireType, out, 'uptime_ms'); break;
      case 3: assignBytes(payload, cursor, wireType, out, 'token'); break;
      case 4: assignFloat32(payload, cursor, wireType, out, 'battery'); break;
      case 5: assignFloat32(payload, cursor, wireType, out, 'voltage'); break;
      case 6: assignBool(payload, cursor, wireType, out, 'vbus'); break;
      case 7: assignFloat64(payload, cursor, wireType, out, 'counter'); break;
      case 8: assignBool(payload, cursor, wireType, out, 'sync_required'); break;
      case 9: assignString(payload, cursor, wireType, out, 'name'); break;
      case 10: assignString(payload, cursor, wireType, out, 'id'); break;
      case 11: assignString(payload, cursor, wireType, out, 'product'); break;
      case 12: assignString(payload, cursor, wireType, out, 'model'); break;
      case 13: assignString(payload, cursor, wireType, out, 'firmware'); break;
      case 14: assignString(payload, cursor, wireType, out, 'revision'); break;
      case 15: assignBool(payload, cursor, wireType, out, 'pairing'); break;
      case 16: assignString(payload, cursor, wireType, out, 'custom_heartbeat_url'); break;
      case 17: assignBool(payload, cursor, wireType, out, 'telemetry'); break;
      case 18: assignString(payload, cursor, wireType, out, 'managed_by'); break;
      case 19: assignBytes(payload, cursor, wireType, out, 'attestation_dac_der'); break;
      case 20: assignBytes(payload, cursor, wireType, out, 'attestation_manufacturer_der'); break;
      case 21: assignBytes(payload, cursor, wireType, out, 'attestation_intermediate_der'); break;
      case 22: assignString(payload, cursor, wireType, out, 'attestation_root_fingerprint'); break;
      case 23: assignBytes(payload, cursor, wireType, out, 'heartbeat_slac_der'); break;
      case 24: assignBytes(payload, cursor, wireType, out, 'heartbeat_der'); break;
      case 25: assignBytes(payload, cursor, wireType, out, 'heartbeat_intermediate_der'); break;
      case 26: assignString(payload, cursor, wireType, out, 'heartbeat_root_fingerprint'); break;
      case 27: assignBytes(payload, cursor, wireType, out, 'signature'); break;
      case 28: assignBytes(payload, cursor, wireType, out, 'key'); break;
      default: skipField(payload, cursor, wireType); break;
    }
  }
  return out;
}

function decodeNetworkConfigResponse(payload: Uint8Array): JsonRecord {
  const cursor = { value: 0 };
  const out: JsonRecord = {};
  while (cursor.value < payload.length) {
    const key = readVarint(payload, cursor);
    if (key === null) break;
    const field = key >>> 3;
    const wireType = key & 0x07;
    switch (field) {
      case 1: assignString(payload, cursor, wireType, out, 'wifi_ssid'); break;
      case 2: assignBool(payload, cursor, wireType, out, 'wifi_password_set'); break;
      case 3: assignString(payload, cursor, wireType, out, 'mqtt_broker_url'); break;
      case 4: assignUint32(payload, cursor, wireType, out, 'mqtt_port'); break;
      case 5: assignString(payload, cursor, wireType, out, 'mqtt_topic'); break;
      case 6: assignUint32(payload, cursor, wireType, out, 'mqtt_broadcast_frequency_seconds'); break;
      case 7: assignString(payload, cursor, wireType, out, 'mqtt_username'); break;
      case 8: assignBool(payload, cursor, wireType, out, 'mqtt_password_set'); break;
      case 9: assignBool(payload, cursor, wireType, out, 'mqtt_broadcast_enabled'); break;
      case 10: assignBytes(payload, cursor, wireType, out, 'csr'); break;
      case 11: assignBytes(payload, cursor, wireType, out, 'mqtt_certificate_der'); break;
      case 12: assignBytes(payload, cursor, wireType, out, 'mqtt_ca_der'); break;
      default: skipField(payload, cursor, wireType); break;
    }
  }
  return out;
}

function assignBytes(payload: Uint8Array, cursor: { value: number }, wireType: number, out: JsonRecord, key: string): void {
  const bytes = readLengthDelimited(payload, cursor, wireType);
  if (bytes !== null) {
    out[key] = bytes;
  }
}

function decodeEnvironmentRecord(payload: Uint8Array): JsonRecord {
  const cursor = { value: 0 };
  const out: JsonRecord = {};
  while (cursor.value < payload.length) {
    const key = readVarint(payload, cursor);
    if (key === null) break;
    const field = key >>> 3;
    const wireType = key & 0x07;
    switch (field) {
      case 1: assignString(payload, cursor, wireType, out, 'version'); break;
      case 2: assignString(payload, cursor, wireType, out, 'event_id'); break;
      case 3: assignBytes(payload, cursor, wireType, out, 'signature'); break;
      case 4: assignBytes(payload, cursor, wireType, out, 'previous_signature'); break;
      case 5: assignString(payload, cursor, wireType, out, 'canonical_string'); break;
      case 6: {
        const message = readLengthDelimited(payload, cursor, wireType);
        if (message) out.payload = decodeEnvironmentPayload(message);
        break;
      }
      case 7: {
        const message = readLengthDelimited(payload, cursor, wireType);
        if (message) out.device = decodeDeviceInfo(message);
        break;
      }
      case 8: {
        const message = readLengthDelimited(payload, cursor, wireType);
        if (message) {
          if (!out.attachments) out.attachments = [];
          (out.attachments as unknown[]).push(decodeAttachment(message));
        }
        break;
      }
      case 9: {
        const message = readLengthDelimited(payload, cursor, wireType);
        if (message) out.identity = decodeIdentity(message);
        break;
      }
      default: skipField(payload, cursor, wireType); break;
    }
  }
  return out;
}

function decodeEnvironmentPayload(payload: Uint8Array): JsonRecord {
  const cursor = { value: 0 };
  const out: JsonRecord = {};
  while (cursor.value < payload.length) {
    const key = readVarint(payload, cursor);
    if (key === null) break;
    const field = key >>> 3;
    const wireType = key & 0x07;
    switch (field) {
      case 1: assignUint64(payload, cursor, wireType, out, 'ctr'); break;
      case 2: assignInt64(payload, cursor, wireType, out, 'timestamp_utc'); break;
      case 3: assignInt64(payload, cursor, wireType, out, 'uptime_us'); break;
      case 4: assignString(payload, cursor, wireType, out, 'nonce'); break;
      case 5: assignString(payload, cursor, wireType, out, 'firmware'); break;
      case 6: assignFloat32(payload, cursor, wireType, out, 'lux'); break;
      case 7: assignFloat32(payload, cursor, wireType, out, 'temp_c'); break;
      case 8: assignFloat32(payload, cursor, wireType, out, 'humidity_pct'); break;
      case 9: assignFloat32(payload, cursor, wireType, out, 'pressure_hpa'); break;
      case 10: assignUint32(payload, cursor, wireType, out, 'voc_index'); break;
      case 11: {
        const message = readLengthDelimited(payload, cursor, wireType);
        if (message) {
          const acc: JsonRecord = {};
          const c = { value: 0 };
          while (c.value < message.length) {
            const k = readVarint(message, c);
            if (k === null) break;
            const f = k >>> 3;
            const w = k & 0x07;
            if (f === 1) assignFloat32(message, c, w, acc, 'x');
            else if (f === 2) assignFloat32(message, c, w, acc, 'y');
            else if (f === 3) assignFloat32(message, c, w, acc, 'z');
            else skipField(message, c, w);
          }
          out.accel_g = acc;
        }
        break;
      }
      case 12: assignBool(payload, cursor, wireType, out, 'tamper'); break;
      case 13: assignBool(payload, cursor, wireType, out, 'wake_event'); break;
      case 14: assignBool(payload, cursor, wireType, out, 'vbus_present'); break;
      default: skipField(payload, cursor, wireType); break;
    }
  }
  return out;
}

function decodeRecordBatches(payload: Uint8Array): JsonRecord {
  const cursor = { value: 0 };
  const out: JsonRecord = { batches: [] };
  while (cursor.value < payload.length) {
    const key = readVarint(payload, cursor);
    if (key === null) break;
    const field = key >>> 3;
    const wireType = key & 0x07;
    if (field === 1) {
      const message = readLengthDelimited(payload, cursor, wireType);
      if (message) (out.batches as unknown[]).push(decodeRecordBatch(message));
    } else skipField(payload, cursor, wireType);
  }
  return out;
}

function decodeRecordBatch(payload: Uint8Array): JsonRecord {
  const cursor = { value: 0 };
  const out: JsonRecord = { environment_records: [], scan_records: [] };
  while (cursor.value < payload.length) {
    const key = readVarint(payload, cursor);
    if (key === null) break;
    const field = key >>> 3;
    const wireType = key & 0x07;
    switch (field) {
      case 1: assignBytes(payload, cursor, wireType, out, 'attestation_dac_der'); break;
      case 2: assignBytes(payload, cursor, wireType, out, 'attestation_manufacturer_der'); break;
      case 3: assignBytes(payload, cursor, wireType, out, 'attestation_intermediate_der'); break;
      case 4: assignBytes(payload, cursor, wireType, out, 'heartbeat_slac_der'); break;
      case 5: assignBytes(payload, cursor, wireType, out, 'heartbeat_der'); break;
      case 6: assignBytes(payload, cursor, wireType, out, 'heartbeat_intermediate_der'); break;
      case 7: {
        const message = readLengthDelimited(payload, cursor, wireType);
        if (message) out.device = decodeDeviceInfo(message);
        break;
      }
      case 8: {
        const message = readLengthDelimited(payload, cursor, wireType);
        if (message) (out.environment_records as unknown[]).push(decodeEnvironmentRecord(message));
        break;
      }
      case 9: {
        const message = readLengthDelimited(payload, cursor, wireType);
        if (message) (out.scan_records as unknown[]).push(decodeScanRecord(message));
        break;
      }
      default: skipField(payload, cursor, wireType); break;
    }
  }
  return out;
}

function decodeDeviceInfo(payload: Uint8Array): JsonRecord {
  const cursor = { value: 0 };
  const out: JsonRecord = {};
  while (cursor.value < payload.length) {
    const key = readVarint(payload, cursor);
    if (key === null) break;
    const field = key >>> 3;
    const wireType = key & 0x07;
    switch (field) {
      case 1: assignString(payload, cursor, wireType, out, 'device_id'); break;
      case 2: assignBytes(payload, cursor, wireType, out, 'public_key'); break;
      default: skipField(payload, cursor, wireType); break;
    }
  }
  return out;
}

function decodeAttachment(payload: Uint8Array): JsonRecord {
  const cursor = { value: 0 };
  const out: JsonRecord = {};
  while (cursor.value < payload.length) {
    const key = readVarint(payload, cursor);
    if (key === null) break;
    const field = key >>> 3;
    const wireType = key & 0x07;
    switch (field) {
      case 1: assignBytes(payload, cursor, wireType, out, 'signature'); break;
      case 2: assignString(payload, cursor, wireType, out, 'checksum'); break;
      case 3: assignInt64(payload, cursor, wireType, out, 'timestamp_utc'); break;
      case 4: assignString(payload, cursor, wireType, out, 'mime'); break;
      case 5: {
        const message = readLengthDelimited(payload, cursor, wireType);
        if (message) out.identity = decodeIdentity(message);
        break;
      }
      default: skipField(payload, cursor, wireType); break;
    }
  }
  return out;
}

function decodeIdentity(payload: Uint8Array): JsonRecord {
  const cursor = { value: 0 };
  const out: JsonRecord = {};
  while (cursor.value < payload.length) {
    const key = readVarint(payload, cursor);
    if (key === null) break;
    const field = key >>> 3;
    const wireType = key & 0x07;
    switch (field) {
      case 1: assignUint64(payload, cursor, wireType, out, 'crt'); break;
      case 2: assignString(payload, cursor, wireType, out, 'dac_serial'); break;
      case 3: assignString(payload, cursor, wireType, out, 'slac_serial'); break;
      case 4: assignInt64(payload, cursor, wireType, out, 'last_sync_utc'); break;
      case 5: assignBytes(payload, cursor, wireType, out, 'signature'); break;
      case 6: assignBytes(payload, cursor, wireType, out, 'dac_der'); break;
      case 7: assignBytes(payload, cursor, wireType, out, 'slac_der'); break;
      default: skipField(payload, cursor, wireType); break;
    }
  }
  return out;
}

function decodeScanRecord(payload: Uint8Array): JsonRecord {
  const cursor = { value: 0 };
  const out: JsonRecord = {};
  while (cursor.value < payload.length) {
    const key = readVarint(payload, cursor);
    if (key === null) break;
    const field = key >>> 3;
    const wireType = key & 0x07;
    switch (field) {
      case 1: assignString(payload, cursor, wireType, out, 'version'); break;
      case 2: assignString(payload, cursor, wireType, out, 'scan_id'); break;
      case 3: assignBytes(payload, cursor, wireType, out, 'signature'); break;
      case 4: assignBytes(payload, cursor, wireType, out, 'previous_signature'); break;
      case 5: assignString(payload, cursor, wireType, out, 'canonical_string'); break;
      case 6: {
        const message = readLengthDelimited(payload, cursor, wireType);
        if (message) out.payload = decodeScanPayload(message);
        break;
      }
      case 7: {
        const message = readLengthDelimited(payload, cursor, wireType);
        if (message) out.device = decodeDeviceInfo(message);
        break;
      }
      case 8: {
        const message = readLengthDelimited(payload, cursor, wireType);
        if (message) out.manufacturer = decodeManufacturerInfo(message);
        break;
      }
      case 9: {
        const message = readLengthDelimited(payload, cursor, wireType);
        if (message) {
          if (!out.attachments) out.attachments = [];
          (out.attachments as unknown[]).push(decodeAttachment(message));
        }
        break;
      }
      case 10: {
        const message = readLengthDelimited(payload, cursor, wireType);
        if (message) out.identity = decodeIdentity(message);
        break;
      }
      default: skipField(payload, cursor, wireType); break;
    }
  }
  return out;
}

function decodeScanPayload(payload: Uint8Array): JsonRecord {
  const cursor = { value: 0 };
  const out: JsonRecord = {};
  while (cursor.value < payload.length) {
    const key = readVarint(payload, cursor);
    if (key === null) break;
    const field = key >>> 3;
    const wireType = key & 0x07;
    switch (field) {
      case 1: assignUint64(payload, cursor, wireType, out, 'ctr'); break;
      case 2: assignString(payload, cursor, wireType, out, 'id'); break;
      case 3: assignInt64(payload, cursor, wireType, out, 'timestamp_utc'); break;
      case 4: assignInt64(payload, cursor, wireType, out, 'uptime_us'); break;
      case 5: assignFloat32(payload, cursor, wireType, out, 'temperature_c'); break;
      case 6: assignString(payload, cursor, wireType, out, 'nonce'); break;
      case 7: assignString(payload, cursor, wireType, out, 'firmware'); break;
      case 8: assignFloat32(payload, cursor, wireType, out, 'tmp'); break;
      case 9: assignUint32(payload, cursor, wireType, out, 'hum'); break;
      case 10: assignInt32(payload, cursor, wireType, out, 'rssi'); break;
      case 11: assignUint32(payload, cursor, wireType, out, 'jit'); break;
      case 12: assignUint32(payload, cursor, wireType, out, 'lat'); break;
      case 13: assignUint32(payload, cursor, wireType, out, 'dur'); break;
      case 14: assignUint32(payload, cursor, wireType, out, 'v_sag'); break;
      case 15: assignUint32(payload, cursor, wireType, out, 'v_avg'); break;
      case 16: assignUint32(payload, cursor, wireType, out, 'p_cnt'); break;
      case 17: assignUint32(payload, cursor, wireType, out, 'avg_dur'); break;
      case 18: assignUint32(payload, cursor, wireType, out, 'sc_sync'); break;
      case 19: assignUint32(payload, cursor, wireType, out, 'up_time_m'); break;
      case 20: assignUint32(payload, cursor, wireType, out, 'v_drop'); break;
      case 21: assignFloat32(payload, cursor, wireType, out, 'rssi_std'); break;
      case 22: assignUint32(payload, cursor, wireType, out, 'vbus'); break;
      case 23: assignUint32(payload, cursor, wireType, out, 'clk_var'); break;
      case 24: assignInt32(payload, cursor, wireType, out, 'drift'); break;
      case 25: assignString(payload, cursor, wireType, out, 'hdx_histo_csv'); break;
      case 26: assignUint32(payload, cursor, wireType, out, 'score_bio'); break;
      case 27: assignUint32(payload, cursor, wireType, out, 'score_auth'); break;
      case 28: assignUint32(payload, cursor, wireType, out, 'score_env'); break;
      case 29: assignString(payload, cursor, wireType, out, 'metrics_keys'); break;
      case 30: assignString(payload, cursor, wireType, out, 'scan_version'); break;
      default: skipField(payload, cursor, wireType); break;
    }
  }
  return out;
}

function decodeManufacturerInfo(payload: Uint8Array): JsonRecord {
  const cursor = { value: 0 };
  const out: JsonRecord = {};
  while (cursor.value < payload.length) {
    const key = readVarint(payload, cursor);
    if (key === null) break;
    const field = key >>> 3;
    const wireType = key & 0x07;
    switch (field) {
      case 1: assignBytes(payload, cursor, wireType, out, 'signature'); break;
      case 2: assignBytes(payload, cursor, wireType, out, 'public_key'); break;
      default: skipField(payload, cursor, wireType); break;
    }
  }
  return out;
}

function decodeFullRecordResponse(payload: Uint8Array): JsonRecord {
  const cursor = { value: 0 };
  const out: JsonRecord = {};
  while (cursor.value < payload.length) {
    const key = readVarint(payload, cursor);
    if (key === null) break;
    const field = key >>> 3;
    const wireType = key & 0x07;
    switch (field) {
      case 1: assignString(payload, cursor, wireType, out, 'record_id'); break;
      case 2: {
        const message = readLengthDelimited(payload, cursor, wireType);
        if (message) out.scan_full = decodeScanRecord(message);
        break;
      }
      case 3: {
        const message = readLengthDelimited(payload, cursor, wireType);
        if (message) out.environment_full = decodeEnvironmentRecord(message);
        break;
      }
      default: skipField(payload, cursor, wireType); break;
    }
  }
  return out;
}

function assignInt32(
  payload: Uint8Array,
  cursor: { value: number },
  wireType: number,
  out: JsonRecord,
  key: string
): void {
  const value = readVarintField(payload, cursor, wireType);
  if (value !== null) {
    // Handle zigzag or negative varints if needed, but for now standard varint
    out[key] = value;
  }
}

function decodeHeartbeatInitResponse(payload: Uint8Array): JsonRecord {
  const cursor = { value: 0 };
  const out: JsonRecord = {};
  while (cursor.value < payload.length) {
    const key = readVarint(payload, cursor);
    if (key === null) break;
    const field = key >>> 3;
    const wireType = key & 0x07;
    switch (field) {
      case 1: assignString(payload, cursor, wireType, out, 'signature'); break;
      case 2: assignString(payload, cursor, wireType, out, 'csr'); break;
      case 3: assignString(payload, cursor, wireType, out, 'attestation'); break;
      case 4: assignUint64(payload, cursor, wireType, out, 'counter'); break;
      case 5: assignInt64(payload, cursor, wireType, out, 'last_sync_bucket'); break;
      case 6: assignInt64(payload, cursor, wireType, out, 'latest_timestamp'); break;
      case 7: assignInt64(payload, cursor, wireType, out, 'current_timestamp'); break;
      case 8: assignString(payload, cursor, wireType, out, 'last_intermediate_serial'); break;
      case 9: assignString(payload, cursor, wireType, out, 'last_slac_serial'); break;
      default: skipField(payload, cursor, wireType); break;
    }
  }
  return out;
}
