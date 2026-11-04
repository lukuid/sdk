// SPDX-License-Identifier: Apache-2.0
// `capture`: the device makes one signed record now, stores it, and returns it.
// A host challenge token becomes the record's signed nonce, which proves the record
// was made after the token was issued.
import type { DeviceInfo } from './types.js';
import { type JsonObject, recomputeRecordCanonicalString, verifyRecordEd25519Signature } from './luku.js';
import { encodeBase64 } from './codec.js';

/** How long the Animal Reader waits for a tag after `capture`. */
export const CAPTURE_WINDOW_MS = 60_000;

/** A token is 16–31 characters from `A–Z a–z 0–9 - _ . ~ + / =` (it must never hold `:`). */
const TOKEN_PATTERN = /^[A-Za-z0-9\-_.~+/=]{16,31}$/;

export interface CaptureOptions {
  /** Challenge token for the record's signed nonce (see {@link createChallengeToken}). */
  token?: string;
  /**
   * Inactivity timeout for the reply in ms. The reader sends a keepalive frame every
   * 4 s while it waits, so this only needs to cover a silent link.
   */
  timeoutMs?: number;
}

export interface CaptureResult {
  /** The stored record's ID (as `get` would return it). */
  id: string;
  type: 'scan' | 'environment';
  /** The signed record exactly as stored on the device. */
  record: JsonObject;
  /** The record's signed nonce ('' when none). */
  nonce: string;
}

export type CaptureEvent =
  | { state: 'waiting'; token?: string; windowMs: number; startedAt: number }
  | { state: 'captured'; result: CaptureResult }
  | { state: 'failed'; error: unknown };

export class CaptureError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'CaptureError';
  }
}

export function isValidChallengeToken(token: string): boolean {
  return TOKEN_PATTERN.test(token);
}

/** A fresh random 24-character URL-safe token (144 bits). */
export function createChallengeToken(): string {
  const bytes = new Uint8Array(18);
  globalThis.crypto.getRandomValues(bytes);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_');
}

/**
 * Checks a `capture` reply before it is handed to the app: the record's canonical
 * string must recompute from its own fields, its Ed25519 signature must verify with
 * the device key, and, when a token was sent, its signed nonce must equal the token.
 * Certificate chains are verified when the record is exported or checked as evidence.
 */
export async function verifyCaptureReply(reply: unknown, info: Pick<DeviceInfo, 'id' | 'key'>, token?: string): Promise<CaptureResult> {
  const full = (reply as JsonObject | null)?.full_record_response as JsonObject | undefined;
  const scan = full?.scan_full as JsonObject | undefined;
  const environment = full?.environment_full as JsonObject | undefined;
  const decoded = scan ?? environment;
  if (!decoded) {
    throw new CaptureError('CAPTURE_INVALID_REPLY', 'The device reply holds no record');
  }
  // The codec returns bytes fields as Uint8Array; evidence JSON carries them as base64.
  const record: JsonObject = { ...decoded };
  for (const field of ['signature', 'previous_signature']) {
    const value = record[field] as unknown;
    if (value instanceof Uint8Array) record[field] = encodeBase64(value);
  }
  const type: CaptureResult['type'] = scan ? 'scan' : 'environment';
  const payload = (record.payload as JsonObject | undefined) ?? {};
  const canonical = typeof record.canonical_string === 'string' ? record.canonical_string : '';
  const signature = typeof record.signature === 'string' ? record.signature : '';
  const recomputed = recomputeRecordCanonicalString(record, type, info.id, info.key);
  if (!canonical || recomputed !== canonical) {
    throw new CaptureError('RECORD_CANONICAL_MISMATCH', 'The captured record does not match its signed canonical string');
  }
  if (!(await verifyRecordEd25519Signature(info.key, signature, canonical))) {
    throw new CaptureError('RECORD_SIGNATURE_INVALID', 'The captured record signature does not verify with the device key');
  }
  const nonce = typeof payload.nonce === 'string' ? payload.nonce : '';
  if (token !== undefined && nonce !== token) {
    throw new CaptureError('NONCE_MISMATCH', 'The captured record does not carry the challenge token');
  }
  const id = typeof record.id === 'string' ? record.id : typeof full?.id === 'string' ? (full.id as string) : '';
  return { id, type, record, nonce };
}
