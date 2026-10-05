// SPDX-License-Identifier: Apache-2.0
import { strFromU8, strToU8, unzipSync, zipSync, type Zippable } from 'fflate';
import { PDFDocument, PDFName, PDFDict, PDFArray, PDFRawStream, decodePDFRawStream } from 'pdf-lib';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';
import {
  verifyDeviceAttestation,
  verifyHeartbeatAttestation,
  verifyExternalIdentity,
  validateCertificateChain,
  spkiMatchesEd25519PublicKey
} from './attestation.js';
import type { SelfTestResult } from './types.js';
import type { RevocationManager } from './revocation.js';

export const LUKU_MIMETYPE = 'application/vnd.lukuid.package+zip';

export interface JsonObject {
  [key: string]: JsonValue;
}

export type JsonValue = JsonObject | JsonValue[] | string | number | boolean | null;

export interface LukuManifest {
  type: string;
  version: string;
  created_at_utc: number;
  description: string;
  blocks_hash: string;
  native_continuity_gap_seconds?: number;
  [key: string]: JsonValue | undefined;
}

export interface LukuDeviceIdentity {
  device_id: string;
  public_key: string;
  vendor?: string;
}

export interface LukuBlock {
  block_id: number;
  timestamp_utc: number;
  previous_block_hash?: string | null;
  device: LukuDeviceIdentity;
  attestation_dac_der?: string | null;
  attestation_manufacturer_der?: string | null;
  attestation_intermediate_der?: string | null;
  attestation_root_fingerprint?: string | null;
  heartbeat_slac_der?: string | null;
  heartbeat_der?: string | null;
  heartbeat_intermediate_der?: string | null;
  heartbeat_root_fingerprint?: string | null;
  attestation_dac_signature?: string | null;
  heartbeat_signature?: string | null;
  batch: JsonObject[];
  batch_hash: string;
  block_canonical_string: string;
  block_hash: string;
}

export type Criticality = 'info' | 'warning' | 'critical';

export interface VerificationIssue {
  code: string;
  message: string;
  criticality: Criticality;
}

export interface LukuVerifyOptions {
  allowUntrustedRoots?: boolean;
  skipCertificateTemporalChecks?: boolean;
  trustedExternalFingerprints?: string[];
  trustProfile?: string;
  policy?: LukuPolicy;
  require_continuity?: boolean;
  attachments?: Map<string, Uint8Array>;
  revocationManager?: RevocationManager;
}

export interface LukuPolicy {
  name: string;
  native_continuity_gap_seconds?: number;
}

export interface LukuExportOptions {
  policy?: LukuPolicy;
}

export interface LukuExporterSigner {
  privateKey: CryptoKey;
  publicKey?: CryptoKey;
  publicKeyBase64?: string;
}

interface StoredArchive {
  mimetype: string;
  manifestRaw?: string;
  blocksRaw?: string;
  manifestSig: string;
  sealsRaw?: string;
  attachments: Record<string, Uint8Array>;
}

const SUPPORTED_ARCHIVE_VERSIONS = new Set(['1.0.0', '1.0']);

function ensureJsonObject(value: unknown, label: string): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be a JSON object`);
  }
  return value as JsonObject;
}

function asJsonObject(value: JsonValue | undefined): JsonObject | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  return value as JsonObject;
}

function asJsonArray(value: JsonValue | undefined): JsonValue[] | undefined {
  return Array.isArray(value) ? value : undefined;
}

function asString(value: JsonValue | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asNumber(value: JsonValue | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function asBoolean(value: JsonValue | undefined): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function isSafeZipEntryName(name: string): boolean {
  if (!name || name.startsWith('/') || name.startsWith('\\') || name.includes('\\')) {
    return false;
  }
  const parts = name.split('/');
  return parts.every((part) => part.length > 0 && part !== '.' && part !== '..');
}

function validateManifestShape(manifest: JsonObject): void {
  if (asString(manifest.type) !== 'LukuArchive') {
    throw new Error('manifest.json field type must be "LukuArchive"');
  }
  if (!asString(manifest.version)) {
    throw new Error('manifest.json field version must be a non-empty string');
  }
  if (asNumber(manifest.created_at_utc) === undefined) {
    throw new Error('manifest.json field created_at_utc must be a finite number');
  }
  if (asString(manifest.description) === undefined) {
    throw new Error('manifest.json field description must be a string');
  }
  if (!asString(manifest.blocks_hash)) {
    throw new Error('manifest.json field blocks_hash must be a non-empty string');
  }
}

function getSubtleCrypto(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('WebCrypto subtle API is not available');
  }
  return subtle;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function utf8(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function decodeBase64(value: string): Uint8Array | null {
  try {
    const normalized = value.replace(/\s+/g, '');
    const nodeBuffer = (globalThis as Record<string, unknown>).Buffer as
      | { from(input: string, encoding: string): Uint8Array }
      | undefined;
    if (nodeBuffer) {
      return Uint8Array.from(nodeBuffer.from(normalized, 'base64'));
    }
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

function encodeBase64(bytes: Uint8Array): string {
  const nodeBuffer = (globalThis as Record<string, unknown>).Buffer as
    | { from(input: Uint8Array): { toString(encoding: string): string } }
    | undefined;
  if (nodeBuffer) {
    return nodeBuffer.from(bytes).toString('base64');
  }
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(data: Uint8Array): Promise<string> {
  const digest = await getSubtleCrypto().digest('SHA-256', toArrayBuffer(data));
  return bytesToHex(new Uint8Array(digest));
}

function archiveSealPayload(manifestHash: string, createdAtUtc: number): Uint8Array {
  if (!Number.isSafeInteger(createdAtUtc) || createdAtUtc < 0) {
    throw new Error('Archive seal timestamp is invalid');
  }
  return utf8(`LUKUID-ARCHIVE-SEAL-V1\nmanifest_hash_alg=SHA-256\nmanifest_hash=${manifestHash}\ncreated_at_utc=${createdAtUtc}`);
}

async function createSelfSealFile(manifestRaw: string): Promise<string> {
  const manifestHash = await sha256Hex(utf8(manifestRaw));
  const createdAtUtc = Math.floor(Date.now() / 1000);
  const pair = ml_dsa65.keygen();
  const signature = ml_dsa65.sign(archiveSealPayload(manifestHash, createdAtUtc), pair.secretKey);
  return JSON.stringify({
    version: 1,
    manifest_hash: { alg: 'SHA-256', value: manifestHash },
    seals: [{
      type: 'self',
      alg: 'ML-DSA-65',
      created_at_utc: createdAtUtc,
      public_key: encodeBase64(pair.publicKey),
      signature: encodeBase64(signature)
    }]
  }, null, 2);
}

async function verifySelfSeals(sealsRaw: string | undefined, manifestRaw: string, issues: VerificationIssue[]): Promise<void> {
  if (!sealsRaw) {
    issues.push(issue('ARCHIVE_SEALS_MISSING', 'The required seals.json file is missing.', 'critical'));
    return;
  }
  try {
    const root = ensureJsonObject(JSON.parse(sealsRaw), 'seals.json');
    const manifestHashObject = asJsonObject(root.manifest_hash);
    const seals = asJsonArray(root.seals);
    if (root.version !== 1 || asString(manifestHashObject?.alg) !== 'SHA-256' || !seals || seals.length === 0) {
      throw new Error('seals.json has an invalid version, manifest hash, or seals array');
    }
    const actualHash = await sha256Hex(utf8(manifestRaw));
    if (asString(manifestHashObject?.value) !== actualHash) {
      issues.push(issue('ARCHIVE_SEALS_MANIFEST_HASH_MISMATCH', 'seals.json does not commit to the exact manifest.json bytes.', 'critical'));
      return;
    }
    let validSelfSeal = false;
    let sharedTimestamp: number | undefined;
    for (const value of seals) {
      const seal = ensureJsonObject(value, 'seal');
      const type = asString(seal.type);
      const createdAtUtc = asNumber(seal.created_at_utc);
      if (!type || createdAtUtc === undefined || !Number.isSafeInteger(createdAtUtc) || createdAtUtc < 0) {
        throw new Error('A seal has invalid required fields');
      }
      if (sharedTimestamp !== undefined && createdAtUtc !== sharedTimestamp) {
        throw new Error('Seals must sign the same canonical payload timestamp');
      }
      sharedTimestamp = createdAtUtc;
      if (type === 'authority') {
        if (asString(seal.alg) !== 'ML-DSA-65' || !asString(seal.key_id) || !asString(seal.root_fingerprint) || !asJsonArray(seal.certificate_chain) || !asString(seal.signature)) {
          throw new Error('An authority seal has invalid required fields');
        }
        issues.push(issue('ARCHIVE_AUTHORITY_SEAL_UNSUPPORTED', 'Authority seals are reserved and are not trusted by this implementation.', 'warning'));
        continue;
      }
      if (type === 'platform') {
        if (!asString(seal.platform) || !asString(seal.alg) || !asString(seal.public_key) || !asString(seal.signature)) {
          throw new Error('A platform seal has invalid required fields');
        }
        if (seal.platform === 'android' && seal.alg === 'ES256') {
          const chain = asJsonArray(seal.certificate_chain);
          const metadata = asJsonObject(seal.metadata);
          const key = decodeBase64(asString(seal.public_key) ?? '');
          const signature = decodeBase64(asString(seal.signature) ?? '');
          if (!/^[0-9a-f]{64}$/.test(asString(seal.key_id) ?? '') || !key || !signature || signature.length !== 64 ||
              !chain || chain.length < 2 || chain.length > 12 ||
              !chain.every((certificate) => typeof certificate === 'string' && !!decodeBase64(certificate)) ||
              !['strongbox', 'tee'].includes(asString(metadata?.security_level) ?? '')) {
            throw new Error('An Android platform seal has malformed verification material');
          }
        }
        issues.push(issue('ARCHIVE_PLATFORM_SEAL_UNSUPPORTED', 'This implementation cannot independently validate this platform seal.', 'warning'));
        continue;
      }
      if (type !== 'self' || asString(seal.alg) !== 'ML-DSA-65') {
        throw new Error('A seal has an unsupported type or algorithm');
      }
      const publicKey = decodeBase64(asString(seal.public_key) ?? '');
      const signature = decodeBase64(asString(seal.signature) ?? '');
      if (!publicKey || !signature || publicKey.length !== 1952 || signature.length !== 3309 ||
          encodeBase64(publicKey) !== seal.public_key || encodeBase64(signature) !== seal.signature ||
          !ml_dsa65.verify(signature, archiveSealPayload(actualHash, createdAtUtc), publicKey)) {
        issues.push(issue('ARCHIVE_SELF_SEAL_INVALID', 'A required ML-DSA-65 self seal failed cryptographic verification.', 'critical'));
      } else {
        validSelfSeal = true;
      }
    }
    if (!validSelfSeal) {
      issues.push(issue('ARCHIVE_SELF_SEAL_MISSING', 'The archive has no valid ML-DSA-65 self seal.', 'critical'));
    }
  } catch (error) {
    issues.push(issue('ARCHIVE_SEALS_MALFORMED', `seals.json is malformed: ${String(error)}`, 'critical'));
  }
}

async function exportPublicKeyBase64(publicKey: CryptoKey): Promise<string> {
  const raw = await getSubtleCrypto().exportKey('raw', publicKey);
  return encodeBase64(new Uint8Array(raw));
}

async function signDetachedBase64(privateKey: CryptoKey, payload: string): Promise<string> {
  const signature = await getSubtleCrypto().sign('Ed25519', privateKey, toArrayBuffer(utf8(payload)));
  return encodeBase64(new Uint8Array(signature));
}

async function verifyDetachedSignature(
  publicKeyBase64: string,
  payload: string,
  signatureBase64: string
): Promise<boolean> {
  const normalizedPublicKey = publicKeyBase64.replace(/\s+/g, '');
  const normalizedSignature = signatureBase64.replace(/\s+/g, '');
  const publicKeyBytes = decodeBase64(publicKeyBase64);
  const signatureBytes = decodeBase64(signatureBase64);
  if (!publicKeyBytes || !signatureBytes || publicKeyBytes.length < 32) {
    return false;
  }
  if (encodeBase64(publicKeyBytes) !== normalizedPublicKey || encodeBase64(signatureBytes) !== normalizedSignature) {
    return false;
  }
  try {
    const key = await getSubtleCrypto().importKey('raw', toArrayBuffer(publicKeyBytes.slice(0, 32)), 'Ed25519', false, ['verify']);
    return await getSubtleCrypto().verify('Ed25519', key, toArrayBuffer(signatureBytes), toArrayBuffer(utf8(payload)));
  } catch {
    return false;
  }
}

async function verifyRecordSignature(
  publicKeyBase64: string,
  signatureBase64: string,
  canonicalString: string
): Promise<boolean> {
  return verifyDetachedSignature(publicKeyBase64, canonicalString, signatureBase64);
}

function normalizeRecordBatch(records: JsonObject[]): JsonObject[] {
  return records.map((record) => ({ ...record }));
}

/**
 * Batch Digest Rule special case (LUKU.md, "Signature and Batch Digest Rule
 * interaction"): a `verification` record is not required to be device-signed.
 * When it has a top-level `signature` (because `collector_attestation` was
 * used), it contributes that value like any other record. When it has NO
 * top-level `signature`, its contribution MUST be `response.checksum`
 * instead — narrowly scoped to `verification` so it never leaks into other
 * record types' (including unrecognized ones') contribution, which stays ''.
 */
function batchDigestContribution(record: JsonObject): string {
  const signature = asString(record.signature) ?? '';
  if (signature.length > 0) {
    return signature;
  }
  if (asString(record.type) === 'verification') {
    return asString(asJsonObject(record.response)?.checksum) ?? '';
  }
  return '';
}

async function batchHashAsync(batch: JsonObject[]): Promise<string> {
  const joined = batch
    .map((record) => batchDigestContribution(record))
    .join(':');
  return sha256Hex(utf8(joined));
}

function blockCanonicalString(
  blockId: number,
  timestampUtc: number,
  previousBlockHash: string | null | undefined,
  device: LukuDeviceIdentity,
  attestationRootFingerprint: string | null | undefined,
  heartbeatRootFingerprint: string | null | undefined,
  computedBatchHash: string
): string {
  return [
    String(blockId),
    String(timestampUtc),
    previousBlockHash ?? '',
    device.device_id,
    device.public_key,
    attestationRootFingerprint ?? '',
    heartbeatRootFingerprint ?? '',
    computedBatchHash
  ].join(':');
}

async function recomputeBlockFields(block: LukuBlock): Promise<{
  batchHash: string;
  blockCanonicalString: string;
  blockHash: string;
}> {
  const computedBatchHash = await batchHashAsync(block.batch);
  const computedCanonical = blockCanonicalString(
    block.block_id,
    block.timestamp_utc,
    block.previous_block_hash,
    block.device,
    block.attestation_root_fingerprint,
    block.heartbeat_root_fingerprint,
    computedBatchHash
  );
  return {
    batchHash: computedBatchHash,
    blockCanonicalString: computedCanonical,
    blockHash: await sha256Hex(utf8(computedCanonical))
  };
}

function pemFromDerBase64(value: string | undefined | null): string | null {
  if (!value) {
    return null;
  }
  const der = decodeBase64(value);
  if (!der) {
    return null;
  }
  const b64 = encodeBase64(der);
  const lines: string[] = [];
  for (let index = 0; index < b64.length; index += 64) {
    lines.push(b64.slice(index, index + 64));
  }
  return `-----BEGIN CERTIFICATE-----\n${lines.join('\n')}\n-----END CERTIFICATE-----\n`;
}

function debugRecordId(record: JsonObject): string {
  for (const key of ['id', 'parent_id', 'parent_record_id']) {
    const topLevel = asString(record[key]);
    if (topLevel) {
      return topLevel;
    }
    const payloadValue = asJsonObject(record.payload)?.[key];
    const payloadString = asString(payloadValue);
    if (payloadString) {
      return payloadString;
    }
  }
  return '-';
}

function issue(code: string, message: string, criticality: Criticality): VerificationIssue {
  return { code, message, criticality };
}

function isAuxRecordType(recordType: string | undefined): boolean {
  return recordType === 'attachment' || recordType === 'location' || recordType === 'custody';
}

/**
 * `verification` records are a third record class (see LUKU.md "Record
 * Classification"): like `attachment`/`location`/`custody` they never
 * advance native device continuity state, but unlike those types they are
 * NOT required to carry a device-produced signature at all. Keep this
 * predicate separate from `isAuxRecordType()` — a `verification` record MAY
 * carry a top-level `signature`/`alg` ONLY when `collector_attestation` is
 * present, in which case it is verified against the block device's
 * `public_key` exactly like an aux record's signature (see call sites below
 * guarded by `verificationSkipsDeviceSignature`), never by lumping it into
 * `isAuxRecordType()`.
 */
function isVerificationRecordType(recordType: string | undefined): boolean {
  return recordType === 'verification';
}

/**
 * The continuity axis: "does this record advance device continuity/counter/
 * previous_signature?" Both aux records and `verification` records answer
 * "no", even though they differ on the device-signature axis (see
 * `isVerificationRecordType()`). Use this helper at continuity/counter/
 * chain-state call sites; keep `isAuxRecordType()` reserved for the
 * device-signature axis.
 */
function isNonChainAdvancingRecordType(recordType: string | undefined): boolean {
  return isAuxRecordType(recordType) || isVerificationRecordType(recordType);
}

/**
 * A `verification` record only claims the device-signature axis (and must
 * therefore verify like an aux record's signature) when it carries a
 * top-level `signature` or a `collector_attestation` — otherwise it is not
 * required to be device-signed at all and signature checks must be skipped
 * entirely (not treated as a failure).
 */
function verificationRecordHasDeviceSignature(record: JsonObject, signature: string): boolean {
  return signature.length > 0 || Boolean(asJsonObject(record.collector_attestation));
}

function recordTimestampUtc(record: JsonObject): number | undefined {
  return asNumber(asJsonObject(record.payload)?.timestamp_utc)
    ?? asNumber(record.timestamp_utc)
    ?? asNumber(record.timestamp);
}

function recordCounter(record: JsonObject): number | undefined {
  return asNumber(asJsonObject(record.payload)?.ctr)
    ?? asNumber(record.ctr);
}

function recordAttestationId(record: JsonObject): string | undefined {
  return asString(record.id)
    ;
}

function manifestPolicy(manifest: LukuManifest): LukuPolicy | undefined {
  const policy = asJsonObject(manifest.policy);
  if (policy) {
    return {
      name: asString(policy.name) ?? '',
      native_continuity_gap_seconds: asNumber(policy.native_continuity_gap_seconds)
    };
  }

  const legacyThreshold = asNumber(manifest.native_continuity_gap_seconds);
  if (legacyThreshold !== undefined) {
    return {
      name: '',
      native_continuity_gap_seconds: legacyThreshold
    };
  }

  return undefined;
}

function expectedExternalIdentityPayload(record: JsonObject, recordType: string): string | null {
  const externalIdentity = asJsonObject(record.external_identity);
  const endorserId = asString(externalIdentity?.endorser_id);
  if (!endorserId) {
    return null;
  }

  switch (recordType) {
    case 'attachment':
      return `${asString(record.checksum) ?? ''}:${asString(record.merkle_root) ?? ''}:${endorserId}`;
    case 'location': {
      // lat/lng MUST NOT default to 0 — (0, 0) is a real coordinate ("null island"),
      // so an absent reading must serialize as empty string, not a numeric default.
      const lat = asNumber(record.lat);
      const lng = asNumber(record.lng);
      return `${lat !== undefined ? lat.toFixed(6) : ''}:${lng !== undefined ? lng.toFixed(6) : ''}:${endorserId}`;
    }
    case 'custody': {
      const payload = asJsonObject(record.payload);
      // Field order is alphabetical per LUKU.md: context_ref, event, status.
      return `${asString(payload?.context_ref) ?? ''}:${asString(payload?.event) ?? ''}:${asString(payload?.status) ?? ''}:${endorserId}`;
    }
    case 'verification': {
      // This is ONLY the "plain structured response, out-of-band countersignature"
      // sub-case from LUKU.md's "External Verification (verification)" section.
      // Self-describing signed formats (JWS/COSE/CMS/XMLDSig/mdoc, ...) carry their
      // own signature inside the preserved response bytes; that case is verified
      // natively against the preserved bytes (see verifyCompactJws()) and never
      // through this detached-payload path, even though external_identity.* MAY
      // also be populated as a convenience projection in that case.
      return verificationSignaturePayload(record, endorserId);
    }
    default:
      return null;
  }
}

/**
 * Canonical-string recomputation for the six `.luku` record types.
 *
 * Per LUKU.md's Field Order rule, every type's canonical string is a fixed
 * structural prefix, then that type's "content" fields joined in STRICT
 * ALPHABETICAL order by field name, then a fixed structural suffix. The
 * content-field ordering below is always derived via `.sort()` at call time
 * (never a hand-typed literal sequence) so a verifier never has to trust
 * that an input payload's own key order — or a stored `canonical_string` —
 * already matches the spec.
 */
type CanonicalFieldKind = 'string' | 'int' | 'float' | 'geo' | 'bool' | 'stringArray' | 'floatArray';

const SCAN_PROFILE_CONTENT_FIELDS: Record<string, Record<string, CanonicalFieldKind>> = {
  animal: {
    protocol: 'string',
    scan_version: 'string',
    tag_id: 'string',
    temperature_c: 'float'
  },
  access: {
    asset_id: 'string',
    credential_id: 'string',
    credential_type: 'string',
    protocol: 'string',
    result: 'string'
  }
};

const ENVIRONMENT_CONTENT_FIELDS: Record<string, CanonicalFieldKind> = {
  accel_g_x: 'float',
  accel_g_y: 'float',
  accel_g_z: 'float',
  battery_percent: 'int',
  gps_accuracy_m: 'float',
  gps_altitude_m: 'float',
  gps_fix_quality: 'int',
  gps_heading_deg: 'float',
  gps_lat: 'geo',
  gps_lng: 'geo',
  gps_satellites: 'int',
  gps_speed_mps: 'float',
  humidity_pct: 'float',
  initial_temp_c: 'float',
  lux: 'float',
  mobile_cell_id: 'string',
  mobile_lac: 'string',
  mobile_mcc: 'string',
  mobile_mnc: 'string',
  mobile_network: 'string',
  mobile_operator: 'string',
  mobile_radio: 'string',
  mobile_roaming: 'bool',
  mobile_rsrp_dbm: 'int',
  mobile_rsrq_db: 'float',
  mobile_rssi_dbm: 'int',
  mobile_sinr_db: 'float',
  pressure_hpa: 'float',
  tamper: 'bool',
  temp_c: 'float',
  vbus_present: 'bool',
  voc_index: 'int',
  voc_raw: 'int'
};

const BIOMETRIC_CONTENT_FIELDS: Record<string, CanonicalFieldKind> = {
  checks: 'stringArray',
  confidence: 'float',
  match: 'bool',
  metrics: 'floatArray',
  modality: 'string',
  template_id_hash: 'string'
};

const ATTACHMENT_CONTENT_FIELDS: Record<string, CanonicalFieldKind> = {
  checksum: 'string',
  merkle_root: 'string',
  mime: 'string',
  title: 'string'
};

const LOCATION_CONTENT_FIELDS: Record<string, CanonicalFieldKind> = {
  lat: 'geo',
  lng: 'geo'
};

const CUSTODY_CONTENT_FIELDS: Record<string, CanonicalFieldKind> = {
  context_ref: 'string',
  event: 'string',
  status: 'string'
};

function formatCanonicalField(value: JsonValue | undefined, kind: CanonicalFieldKind): string {
  switch (kind) {
    case 'string':
      return typeof value === 'string' ? value : '';
    case 'int':
      return typeof value === 'number' ? String(Math.trunc(value)) : '';
    case 'float':
      return typeof value === 'number' ? value.toFixed(2) : '';
    case 'geo':
      return typeof value === 'number' ? value.toFixed(6) : '';
    case 'bool':
      return typeof value === 'boolean' ? (value ? 'true' : 'false') : '';
    case 'stringArray':
      return Array.isArray(value) ? value.map((entry) => (typeof entry === 'string' ? entry : String(entry))).join(',') : '';
    case 'floatArray':
      return Array.isArray(value)
        ? value.map((entry) => (typeof entry === 'number' ? entry.toFixed(2) : String(entry))).join(',')
        : '';
    default:
      return '';
  }
}

/**
 * Extracts and formats a type's content fields from `source`, always in
 * alphabetical order of field name — the ordering is computed by `.sort()`
 * every call, regardless of the declaration order of `fieldKinds` or the
 * key order of `source`.
 */
function buildSortedContentString(source: JsonObject, fieldKinds: Record<string, CanonicalFieldKind>): string {
  return Object.keys(fieldKinds)
    .sort()
    .map((name) => formatCanonicalField(source[name], fieldKinds[name]))
    .join(':');
}

function recomputeScanCanonicalString(record: JsonObject, deviceId: string, publicKey: string): string | null {
  const payload = asJsonObject(record.payload) ?? {};
  const profile = asString(payload.profile);
  const contentFields = profile ? SCAN_PROFILE_CONTENT_FIELDS[profile] : undefined;
  if (!profile || !contentFields) {
    return null;
  }
  const id = asString(record.id) ?? '';
  const ctr = formatCanonicalField(payload.ctr, 'int');
  const timestampUtc = formatCanonicalField(payload.timestamp_utc, 'int');
  const uptimeUs = formatCanonicalField(payload.uptime_us, 'int');
  const nonce = asString(payload.nonce) ?? '';
  const firmware = asString(payload.firmware) ?? '';
  const content = buildSortedContentString(payload, contentFields);
  const metrics = formatCanonicalField(payload.metrics, 'floatArray');
  const previousSignature = asString(record.previous_signature) ?? '';
  return [deviceId, publicKey, 'scan', id, ctr, timestampUtc, uptimeUs, profile, nonce, firmware, content, metrics, previousSignature].join(
    ':'
  );
}

function recomputeEnvironmentCanonicalString(record: JsonObject, deviceId: string, publicKey: string): string {
  const payload = asJsonObject(record.payload) ?? {};
  const accel = asJsonObject(payload.accel_g) ?? {};
  const contentSource: JsonObject = {
    ...payload,
    accel_g_x: payload.accel_g_x ?? accel.x,
    accel_g_y: payload.accel_g_y ?? accel.y,
    accel_g_z: payload.accel_g_z ?? accel.z
  };
  const id = asString(record.id) ?? '';
  const ctr = formatCanonicalField(payload.ctr, 'int');
  const timestampUtc = formatCanonicalField(payload.timestamp_utc, 'int');
  const uptimeUs = formatCanonicalField(payload.uptime_us, 'int');
  const content = buildSortedContentString(contentSource, ENVIRONMENT_CONTENT_FIELDS);
  const previousSignature = asString(record.previous_signature) ?? '';
  return [deviceId, publicKey, 'environment', id, ctr, timestampUtc, uptimeUs, content, previousSignature].join(':');
}

function recomputeBiometricCanonicalString(record: JsonObject, deviceId: string, publicKey: string): string {
  const payload = asJsonObject(record.payload) ?? {};
  // NOTE: LUKU.md's biometric canonical order names an "event_id" structural
  // field, but the worked JSON example has no top-level `id`/`payload.id` for
  // biometric records — a pre-existing doc gap. We fall back through the
  // likely locations rather than guessing a single one silently.
  const eventId = asString(record.id) ?? asString(payload.id) ?? asString(payload.event_id) ?? '';
  const ctr = formatCanonicalField(payload.ctr, 'int');
  const timestampUtc = formatCanonicalField(payload.timestamp_utc, 'int');
  const uptimeUs = formatCanonicalField(payload.uptime_us, 'int');
  const firmware = asString(payload.firmware) ?? '';
  const content = buildSortedContentString(payload, BIOMETRIC_CONTENT_FIELDS);
  const previousSignature = asString(record.previous_signature) ?? '';
  return [deviceId, publicKey, 'biometric', eventId, ctr, timestampUtc, uptimeUs, firmware, content, previousSignature].join(':');
}

function recomputeAttachmentCanonicalString(record: JsonObject, deviceId: string, publicKey: string): string {
  const parentSignature = asString(record.parent_signature) ?? '';
  const id = asString(record.id) ?? '';
  const parentId = asString(record.parent_id) ?? asString(record.parent_record_id) ?? '';
  const timestampUtc = formatCanonicalField(record.timestamp_utc, 'int');
  const content = buildSortedContentString(record, ATTACHMENT_CONTENT_FIELDS);
  const externalSignature = asString(asJsonObject(record.external_identity)?.signature) ?? '';
  return [parentSignature, deviceId, publicKey, 'attachment', id, parentId, timestampUtc, content, externalSignature].join(':');
}

function recomputeLocationCanonicalString(record: JsonObject, deviceId: string, publicKey: string): string {
  const parentSignature = asString(record.parent_signature) ?? '';
  const parentId = asString(record.parent_id) ?? asString(record.parent_record_id) ?? '';
  const timestampUtc = formatCanonicalField(record.timestamp_utc, 'int');
  const content = buildSortedContentString(record, LOCATION_CONTENT_FIELDS);
  const externalSignature = asString(asJsonObject(record.external_identity)?.signature) ?? '';
  return [parentSignature, deviceId, publicKey, 'location', parentId, timestampUtc, content, externalSignature].join(':');
}

function recomputeCustodyCanonicalString(record: JsonObject, deviceId: string, publicKey: string): string {
  const parentSignature = asString(record.parent_signature) ?? '';
  const id = asString(record.id) ?? '';
  const parentId = asString(record.parent_id) ?? asString(record.parent_record_id) ?? '';
  const timestampUtc = formatCanonicalField(record.timestamp_utc, 'int');
  const payload = asJsonObject(record.payload) ?? {};
  const content = buildSortedContentString(payload, CUSTODY_CONTENT_FIELDS);
  const externalSignature = asString(asJsonObject(record.external_identity)?.signature) ?? '';
  return [parentSignature, deviceId, publicKey, 'custody', id, parentId, timestampUtc, content, externalSignature].join(':');
}

/**
 * Fixed LUKU.md 1.1.0 detached payload for external identity and collector
 * attestation. The signer field is selected by the signature mechanism.
 */
function verificationSignaturePayload(record: JsonObject, signerId: string): string {
  const response = asJsonObject(record.response);
  const subject = asJsonObject(record.subject);
  const scheme = asString(record.scheme) ?? '';
  const provider = asString(record.provider) ?? '';
  const checkedAtUtc = formatCanonicalField(record.checked_at_utc, 'int');
  const status = asString(record.status) ?? '';
  const fields = [
    asString(response?.checksum) ?? '', scheme, provider, checkedAtUtc, status,
    asString(record.result_code) ?? '', asString(subject?.type) ?? '',
    asString(subject?.identifier) ?? '', asString(subject?.commitment) ?? '',
    formatCanonicalField(record.valid_from_utc, 'int'),
    formatCanonicalField(record.valid_until_utc, 'int'), signerId
  ];
  return fields.join(':');
}

function recomputeVerificationCanonicalString(record: JsonObject): string {
  const collector = asJsonObject(record.collector_attestation);
  const externalIdentity = asJsonObject(record.external_identity);
  return verificationSignaturePayload(
    record,
    asString(collector?.device_id) ?? asString(externalIdentity?.endorser_id) ?? ''
  );
}

/**
 * Independently recomputes a record's canonical string from its own
 * structural + content fields, per the new Field Order rule in LUKU.md.
 * Returns null only when the record type (or, for `scan`, the `profile`)
 * isn't one this SDK knows how to build — callers should fall back to the
 * record's stored `canonical_string` in that case, but must never treat an
 * unrecognized type/profile as if it were successfully verified.
 */
export function recomputeRecordCanonicalString(
  record: JsonObject,
  recordType: string,
  deviceId: string,
  publicKey: string
): string | null {
  switch (recordType) {
    case 'scan':
      return recomputeScanCanonicalString(record, deviceId, publicKey);
    case 'environment':
      return recomputeEnvironmentCanonicalString(record, deviceId, publicKey);
    case 'biometric':
      return recomputeBiometricCanonicalString(record, deviceId, publicKey);
    case 'attachment':
      return recomputeAttachmentCanonicalString(record, deviceId, publicKey);
    case 'location':
      return recomputeLocationCanonicalString(record, deviceId, publicKey);
    case 'custody':
      return recomputeCustodyCanonicalString(record, deviceId, publicKey);
    case 'verification':
      return recomputeVerificationCanonicalString(record);
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// `verification` record support
// ---------------------------------------------------------------------------
//
// A `verification` record captures the outcome of an external registry/
// marketplace/authority/customs/compliance check against existing evidence
// (see LUKU.md "External Verification (`verification`)"). It is a distinct
// third record class: it never advances native continuity (like aux
// records), but unlike aux records it is NOT required to carry a device
// signature at all (see `isVerificationRecordType()` / `isAuxRecordType()`
// above).

/** The three response-disclosure states a verifier MUST distinguish for a
 * `verification` record, independent of (never collapsed into) the
 * assurance level below. See LUKU.md's "Critical response-preservation
 * rule" / point 9. */
export type VerificationResponseDisclosureState = 'disclosed' | 'undisclosed' | 'disclosed_mismatch';

/**
 * Assurance levels for a `verification` record, reported separately from
 * (never collapsed into) general `.luku` archive validity. The first three
 * values are exactly LUKU.md's "Assurance levels" table. `unsupported` is an
 * explicit extension requested by this feature's implementation brief for
 * the case where the provider's response format is a recognized
 * signed/opaque format (JWT/JWS, COSE, CMS, XMLDSig, mdoc, ...) that this
 * SDK does not (yet) natively verify — callers must never treat that as a
 * silent pass nor as a hard failure of the whole record. `unverifiable`
 * covers the degenerate case where `response.checksum` itself is missing or
 * malformed, so even `recorded` cannot be reached.
 */
export type VerificationAssuranceLevel =
  | 'recorded'
  | 'authority_verified'
  | 'authority_verified_and_collector_attested'
  | 'unsupported'
  | 'unverifiable';

export interface VerificationRecordResponseResult {
  checksum: string;
  sizeBytes: number | null;
  mime: string | null;
  format: string | null;
  disclosureState: VerificationResponseDisclosureState;
  /** The exact original response bytes. Legitimately `null` (not an error)
   * whenever `disclosureState !== 'disclosed'` — never an empty array. */
  rawBytes: Uint8Array | null;
  /** Non-authoritative convenience projection of `rawBytes`, parsed fresh
   * from the disclosed bytes (never from the record's own stored
   * `response.data`, and never used for cryptographic verification). `null`
   * when undisclosed, non-JSON, or unparsable — never an error by itself. */
  data: JsonValue | null;
}

export interface VerificationRecordResult {
  id: string | null;
  parentId: string | null;
  scheme: string | null;
  provider: string | null;
  status: string | null;
  resultCode: string | null;
  checkedAtUtc: number | null;
  validFromUtc: number | null;
  validUntilUtc: number | null;
  response: VerificationRecordResponseResult;
  /** Distinct from, and reported alongside, `response.disclosureState` and
   * overall archive validity — never inferred from either. */
  assuranceLevel: VerificationAssuranceLevel;
  collectorAttestationPresent: boolean;
  collectorAttestationVerified: boolean | null;
  externalIdentityPresent: boolean;
  externalIdentityVerified: boolean | null;
  /** Set only when `response.format` is a self-describing signed format this
   * SDK natively verifies (currently JWS compact serialization). `null` when
   * not attempted (unsupported format, or bytes undisclosed). */
  nativeSignatureVerified: boolean | null;
}

const VERIFICATION_STATUS_VALUES = new Set([
  'verified',
  'not_verified',
  'not_found',
  'mismatch',
  'expired',
  'revoked',
  'unavailable',
  'unsupported',
  'indeterminate'
]);

// Signed/opaque provider response formats named in LUKU.md's "Signed or
// opaque provider formats" paragraph. This SDK currently only implements
// native verification for JWS/JWT compact serialization; every other member
// of this set is a recognized-but-unsupported format (assurance
// `unsupported`, never silently verified, never a hard failure).
const SELF_DESCRIBING_SIGNED_FORMATS = new Set([
  'jwt', 'jws', 'sd-jwt', 'cose', 'cose_sign1', 'cbor', 'mdoc',
  'xml', 'xmldsig', 'cms', 'pkcs7', 'protobuf', 'opaque', 'eudi_wallet'
]);
const NATIVELY_SUPPORTED_SIGNED_FORMATS = new Set(['jwt', 'jws']);

function base64UrlDecode(value: string): Uint8Array | null {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/').replace(/\s+/g, '');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return decodeBase64(normalized + padding);
}

interface JwsVerifyResult {
  ok: boolean;
  alg?: string;
  reason?: string;
}

/**
 * Native verification for JWS compact serialization (`header.payload.signature`,
 * base64url, 3 dot-separated parts), supporting `alg: "EdDSA"` (Ed25519) and
 * `alg: "ES256"` (ECDSA P-256 / SHA-256). Reuses exactly the WebCrypto
 * `Ed25519`/`ECDSA P-256` primitives already used throughout this file and
 * `attestation.ts` — no new crypto dependency.
 *
 * Operates on the preserved original bytes directly, per LUKU.md's "Signed or
 * opaque provider formats" rule — never on `response.data`. The verification
 * key is read from an embedded `jwk` header parameter (the JWS is
 * "self-describing": the key travels with the artifact itself). Any other
 * `alg`, or a JWS with no embedded `jwk`, is reported as unsupported/failed
 * here and surfaces as assurance `unsupported` to the caller rather than a
 * silent pass or a hard archive-level failure.
 */
async function verifyCompactJws(bytes: Uint8Array): Promise<JwsVerifyResult> {
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return { ok: false, reason: 'Response bytes are not valid UTF-8 text; cannot parse as JWS compact serialization' };
  }
  const parts = text.trim().split('.');
  if (parts.length !== 3) {
    return { ok: false, reason: 'Response is not a 3-part JWS compact serialization' };
  }
  const [headerPart, payloadPart, signaturePart] = parts;
  const headerBytes = base64UrlDecode(headerPart);
  const signatureBytes = base64UrlDecode(signaturePart);
  if (!headerBytes || !signatureBytes) {
    return { ok: false, reason: 'JWS header or signature is not valid base64url' };
  }
  let header: JsonObject;
  try {
    header = ensureJsonObject(JSON.parse(new TextDecoder().decode(headerBytes)), 'JWS header');
  } catch {
    return { ok: false, reason: 'JWS header is not valid JSON' };
  }
  const alg = asString(header.alg);
  if (alg !== 'EdDSA' && alg !== 'ES256') {
    return { ok: false, alg, reason: `Unsupported JWS alg: ${alg ?? 'missing'}` };
  }
  const jwk = asJsonObject(header.jwk);
  if (!jwk) {
    return { ok: false, alg, reason: 'JWS header does not embed a "jwk" verification key' };
  }
  const signingInput = utf8(`${headerPart}.${payloadPart}`);
  try {
    const subtle = getSubtleCrypto();
    if (alg === 'EdDSA') {
      if (asString(jwk.kty) !== 'OKP' || asString(jwk.crv) !== 'Ed25519' || !asString(jwk.x)) {
        return { ok: false, alg, reason: 'JWS "jwk" is not a valid Ed25519 OKP key' };
      }
      const key = await subtle.importKey('jwk', jwk as unknown as JsonWebKey, { name: 'Ed25519' }, false, ['verify']);
      const verified = await subtle.verify('Ed25519', key, toArrayBuffer(signatureBytes), toArrayBuffer(signingInput));
      return verified ? { ok: true, alg } : { ok: false, alg, reason: 'JWS Ed25519 signature verification failed' };
    }
    if (asString(jwk.kty) !== 'EC' || asString(jwk.crv) !== 'P-256' || !asString(jwk.x) || !asString(jwk.y)) {
      return { ok: false, alg, reason: 'JWS "jwk" is not a valid P-256 EC key' };
    }
    const key = await subtle.importKey('jwk', jwk as unknown as JsonWebKey, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    const verified = await subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, toArrayBuffer(signatureBytes), toArrayBuffer(signingInput));
    return verified ? { ok: true, alg } : { ok: false, alg, reason: 'JWS ES256 signature verification failed' };
  } catch (error) {
    return { ok: false, alg, reason: `JWS verification error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * The full per-record `verification` check (LUKU.md "7a. External
 * Verification (`verification`) Record Check"), shared by `verifyEnvelope()`
 * and the archive-level `verify()` loop. Resolves/hashes the `response`
 * attachment via the existing `attachments/` content-addressing map (the
 * same map `attachment` records resolve against — no second blob store),
 * reports the response-disclosure state, optionally verifies the provider's
 * native signature or the `external_identity` detached-signature sub-case,
 * optionally verifies `collector_attestation`, and computes the assurance
 * level. Never infers authority verification from overall archive validity
 * (LUKU.md 7a, point 10).
 */
async function evaluateVerificationRecord(
  record: JsonObject,
  attachments: Map<string, Uint8Array> | undefined,
  blockDeviceId: string | undefined,
  blockPublicKey: string | undefined,
  trustedExternalFingerprints: string[]
): Promise<{ issues: VerificationIssue[]; result: VerificationRecordResult }> {
  const issues: VerificationIssue[] = [];
  const id = asString(record.id) ?? null;
  const parentId = asString(record.parent_id) ?? asString(record.parent_record_id) ?? null;
  const scheme = asString(record.scheme) ?? null;
  const provider = asString(record.provider) ?? null;
  const status = asString(record.status) ?? null;
  const resultCode = asString(record.result_code) ?? null;
  const checkedAtUtc = asNumber(record.checked_at_utc) ?? null;
  const validFromUtc = asNumber(record.valid_from_utc) ?? null;
  const validUntilUtc = asNumber(record.valid_until_utc) ?? null;

  if (status !== null && !VERIFICATION_STATUS_VALUES.has(status)) {
    issues.push(issue('RECORD_VERIFICATION_STATUS_INVALID', `verification record ${id ?? 'unknown'} has an unrecognized status '${status}'.`, 'critical'));
  }

  const responseObject = asJsonObject(record.response);
  const checksum = (asString(responseObject?.checksum) ?? '').toLowerCase();
  const sizeBytes = asNumber(responseObject?.size_bytes) ?? null;
  const mime = asString(responseObject?.mime) ?? null;
  const format = asString(responseObject?.format) ?? null;
  const storedData = responseObject?.data;
  const checksumWellFormed = /^[0-9a-f]{64}$/.test(checksum);

  if (!checksumWellFormed) {
    issues.push(issue('RECORD_VERIFICATION_RESPONSE_CHECKSUM_MISSING', `verification record ${id ?? 'unknown'} is missing a well-formed response.checksum.`, 'critical'));
  }
  if (sizeBytes === null) {
    issues.push(issue('RECORD_VERIFICATION_RESPONSE_SIZE_MISSING', `verification record ${id ?? 'unknown'} is missing response.size_bytes.`, 'critical'));
  }
  if (!mime) {
    issues.push(issue('RECORD_VERIFICATION_RESPONSE_MIME_MISSING', `verification record ${id ?? 'unknown'} is missing response.mime.`, 'critical'));
  }

  let disclosureState: VerificationResponseDisclosureState = 'undisclosed';
  let rawBytes: Uint8Array | null = null;
  let data: JsonValue | null = null;

  const content = checksumWellFormed ? attachments?.get(checksum) : undefined;
  if (content) {
    const actualHash = await sha256Hex(content);
    if (actualHash !== checksum) {
      disclosureState = 'disclosed_mismatch';
      issues.push(issue(
        'RECORD_VERIFICATION_RESPONSE_DISCLOSED_MISMATCH',
        `verification record ${id ?? 'unknown'} has a disclosed response attachment whose bytes do not reproduce response.checksum.`,
        'critical'
      ));
    } else {
      disclosureState = 'disclosed';
      rawBytes = content;
      if (sizeBytes !== null && content.length !== sizeBytes) {
        issues.push(issue(
          'RECORD_VERIFICATION_RESPONSE_SIZE_MISMATCH',
          `verification record ${id ?? 'unknown'} response.size_bytes (${sizeBytes}) does not match the disclosed attachment length (${content.length}).`,
          'critical'
        ));
      }
      const isSelfDescribingSignedFormat = format !== null && SELF_DESCRIBING_SIGNED_FORMATS.has(format.toLowerCase());
      const looksLikeJson = (mime ?? '').toLowerCase().includes('json') || (format ?? '').toLowerCase() === 'json';
      if (!isSelfDescribingSignedFormat && (looksLikeJson || (!mime && !format))) {
        try {
          const text = new TextDecoder('utf-8', { fatal: true }).decode(content);
          data = JSON.parse(text) as JsonValue;
        } catch {
          data = null;
        }
      }
    }
  }

  if (disclosureState !== 'disclosed' && storedData !== undefined && storedData !== null) {
    issues.push(issue(
      'RECORD_VERIFICATION_RESPONSE_DATA_WITHOUT_DISCLOSURE',
      `verification record ${id ?? 'unknown'} has response.data present without a disclosed response attachment; response.data is never an independent disclosure channel.`,
      'critical'
    ));
  }

  let nativeSignatureVerified: boolean | null = null;
  let externalIdentityVerified: boolean | null = null;
  let providerFormatUnsupported = false;

  if (format !== null && SELF_DESCRIBING_SIGNED_FORMATS.has(format.toLowerCase())) {
    if (!NATIVELY_SUPPORTED_SIGNED_FORMATS.has(format.toLowerCase())) {
      providerFormatUnsupported = true;
      issues.push(issue(
        'RECORD_VERIFICATION_PROVIDER_FORMAT_UNSUPPORTED',
        `verification record ${id ?? 'unknown'} uses provider response format '${format}', which this SDK cannot natively verify; reporting assurance as unsupported rather than verified or failed.`,
        'info'
      ));
    } else if (disclosureState === 'disclosed' && rawBytes) {
      const jwsResult = await verifyCompactJws(rawBytes);
      nativeSignatureVerified = jwsResult.ok;
      if (!jwsResult.ok) {
        issues.push(issue(
          'RECORD_VERIFICATION_NATIVE_SIGNATURE_INVALID',
          `verification record ${id ?? 'unknown'} failed native ${format} signature verification: ${jwsResult.reason ?? 'unknown error'}`,
          'critical'
        ));
      }
    }
    // Self-describing format but bytes undisclosed: cannot be checked natively.
    // Not a failure — simply leaves nativeSignatureVerified as null (unattempted).
  } else {
    // Plain response: the only remaining way to reach authority_verified is the
    // external_identity detached-signature sub-case, which only needs
    // response.checksum and so works even in the `undisclosed` state.
    const externalIdentity = asJsonObject(record.external_identity);
    if (externalIdentity) {
      const expectedPayload = expectedExternalIdentityPayload(record, 'verification');
      const endorserId = asString(externalIdentity.endorser_id);
      const rootFingerprint = asString(externalIdentity.root_fingerprint);
      const extSignature = asString(externalIdentity.signature);
      const certChainDer = asJsonArray(externalIdentity.cert_chain_der)
        ?.map((value) => asString(value))
        .filter((value): value is string => Boolean(value));

      if (expectedPayload && endorserId && rootFingerprint && extSignature && certChainDer?.length) {
        const result = await verifyExternalIdentity({
          endorserId,
          rootFingerprint,
          certChainDer,
          signature: extSignature,
          expectedPayload,
          trustedFingerprints: trustedExternalFingerprints
        });
        externalIdentityVerified = result.ok;
        if (!result.ok) {
          issues.push(issue(
            'EXTERNAL_IDENTITY_VERIFICATION_FAILED',
            `External identity verification failed for verification record ${id ?? 'unknown'}: ${result.reason ?? 'unknown error'}`,
            'critical'
          ));
        }
      }
    }
  }

  const collectorAttestation = asJsonObject(record.collector_attestation);
  let collectorAttestationVerified: boolean | null = null;
  if (collectorAttestation) {
    const caDeviceId = asString(collectorAttestation.device_id);
    const caAlg = asString(collectorAttestation.alg);
    const caSignature = asString(collectorAttestation.signature);
    const topSignature = asString(record.signature);
    const topAlg = asString(record.alg);

    if (caSignature !== topSignature || caAlg !== topAlg) {
      issues.push(issue(
        'RECORD_VERIFICATION_COLLECTOR_ATTESTATION_SIGNATURE_MISMATCH',
        `verification record ${id ?? 'unknown'} top-level signature/alg does not equal collector_attestation.signature/alg.`,
        'critical'
      ));
    }
    if (blockDeviceId && caDeviceId && caDeviceId !== blockDeviceId) {
      issues.push(issue(
        'RECORD_VERIFICATION_COLLECTOR_ATTESTATION_DEVICE_MISMATCH',
        `verification record ${id ?? 'unknown'} collector_attestation.device_id (${caDeviceId}) does not match block device ${blockDeviceId}.`,
        'critical'
      ));
    }
    if (caAlg !== 'ED25519') {
      collectorAttestationVerified = false;
      issues.push(issue(
        'RECORD_VERIFICATION_COLLECTOR_ATTESTATION_ALG_UNSUPPORTED',
        `verification record ${id ?? 'unknown'} collector_attestation uses unsupported alg '${caAlg ?? 'missing'}'.`,
        'critical'
      ));
    } else if (caSignature && blockPublicKey && !!caDeviceId && !!blockDeviceId && caDeviceId === blockDeviceId) {
      const canonical = recomputeVerificationCanonicalString(record);
      const verified = await verifyRecordSignature(blockPublicKey, caSignature, canonical);
      collectorAttestationVerified = verified;
      if (!verified) {
        issues.push(issue(
          'RECORD_VERIFICATION_COLLECTOR_ATTESTATION_INVALID',
          `verification record ${id ?? 'unknown'} collector_attestation signature failed to verify against the block device public key.`,
          'critical'
        ));
      }
    } else {
      collectorAttestationVerified = false;
      issues.push(issue(
        'RECORD_VERIFICATION_COLLECTOR_ATTESTATION_INVALID',
        `verification record ${id ?? 'unknown'} collector_attestation is missing signature material or no block device public key is available.`,
        'critical'
      ));
    }
  }

  const authorityVerified = nativeSignatureVerified === true || externalIdentityVerified === true;
  let assuranceLevel: VerificationAssuranceLevel;
  if (!checksumWellFormed) {
    assuranceLevel = 'unverifiable';
  } else if (authorityVerified && collectorAttestationVerified === true) {
    assuranceLevel = 'authority_verified_and_collector_attested';
  } else if (authorityVerified) {
    assuranceLevel = 'authority_verified';
  } else if (providerFormatUnsupported) {
    assuranceLevel = 'unsupported';
  } else {
    assuranceLevel = 'recorded';
  }

  const result: VerificationRecordResult = {
    id,
    parentId,
    scheme,
    provider,
    status,
    resultCode,
    checkedAtUtc,
    validFromUtc,
    validUntilUtc,
    response: { checksum, sizeBytes, mime, format, disclosureState, rawBytes, data },
    assuranceLevel,
    collectorAttestationPresent: Boolean(collectorAttestation),
    collectorAttestationVerified,
    externalIdentityPresent: Boolean(asJsonObject(record.external_identity)),
    externalIdentityVerified,
    nativeSignatureVerified
  };

  return { issues, result };
}

function attachmentContentAddressPath(checksum: string): string {
  const dir1 = checksum.length >= 2 ? checksum.slice(0, 2) : '00';
  const dir2 = checksum.length >= 4 ? checksum.slice(2, 4) : '00';
  return `attachments/${dir1}/${dir2}/${checksum}`;
}

export interface VerificationResponseInput {
  /** The exact original response body bytes, captured BEFORE any JSON
   * parsing, normalization, re-encoding, or decompression. This is the only
   * accepted primary input — there is deliberately no overload that accepts
   * only a parsed object, so callers cannot accidentally fabricate "raw
   * bytes" by re-serializing one (see LUKU.md's response-preservation rule).
   */
  rawBytes: Uint8Array;
  mime: string;
  format?: string;
  statusCode?: number;
  contentEncoding?: string;
  providerRequestId?: string;
  reference?: string;
  /**
   * Whether to additionally store `rawBytes` as a content-addressed
   * attachment (and expose a parsed `response.data` projection of it) in
   * this archive. Defaults to `true`. Pass `false` to commit only to
   * `checksum`/`size_bytes`/`mime` for privacy (the `undisclosed` state) —
   * hashing is mandatory, disclosure is optional.
   */
  disclose?: boolean;
  /**
   * Explicit parsed JSON projection to store as `response.data`. Only used
   * when `disclose` is not `false`. If omitted and the bytes parse as JSON,
   * `buildVerificationRecord()` derives this itself from `rawBytes` (never
   * from a caller-supplied object with no bytes behind it).
   */
  data?: JsonValue;
}

export interface VerificationCollectorAttestationInput {
  deviceId: string;
  alg: string;
  signature: string;
  attestedAtUtc: number;
}

export interface BuildVerificationRecordInput {
  id: string;
  version?: string;
  parentId?: string;
  parentSignature?: string;
  scheme: string;
  provider: string;
  checkedAtUtc: number;
  validFromUtc?: number;
  validUntilUtc?: number;
  status: string;
  resultCode?: string;
  subject?: JsonObject;
  response: VerificationResponseInput;
  externalIdentity?: JsonObject;
  /** Pre-computed collector attestation (sign the payload returned by
   * `verificationCollectorAttestationPayload()` with the device's private
   * key to produce `signature`). When present, the built record's top-level
   * `alg`/`signature` are set to match, per LUKU.md. */
  collectorAttestation?: VerificationCollectorAttestationInput;
}

export interface BuiltVerificationRecord {
  record: JsonObject;
  /** Present only when the response was disclosed; add this to the
   * archive's attachment map (e.g. via `addAttachmentAsync()`) before
   * exporting. */
  attachment?: { checksum: string; bytes: Uint8Array };
}

/**
 * Computes the exact detached canonical payload `collector_attestation.signature`
 * must sign (LUKU.md 1.1.0 normalized verification payload), given the record
 * as it will be built (i.e. after `buildVerificationRecord()` has computed
 * `response.checksum`). Callers sign this payload with the collecting
 * device's private key to produce `collectorAttestation.signature` before
 * passing it back into `buildVerificationRecord()`.
 */
export function verificationCollectorAttestationPayload(record: JsonObject): string {
  return recomputeVerificationCanonicalString(record);
}

/**
 * Exporter/builder for `verification` records. Accepts raw response bytes as
 * the primary input (see `VerificationResponseInput.rawBytes`) — it never
 * reconstructs "raw bytes" by serializing a parsed object. Hashing
 * (`response.checksum`/`size_bytes`/`mime`) is always computed; disclosing
 * the bytes as a content-addressed attachment (and the `response.data`
 * projection) is the caller's explicit, optional choice via
 * `response.disclose`.
 */
export async function buildVerificationRecord(input: BuildVerificationRecordInput): Promise<BuiltVerificationRecord> {
  if (!(input.response?.rawBytes instanceof Uint8Array)) {
    throw new Error(
      'buildVerificationRecord() requires response.rawBytes (the exact original captured response bytes) as its primary input; ' +
      'it never derives raw bytes by serializing a parsed object.'
    );
  }
  const rawBytes = input.response.rawBytes;
  const checksum = await sha256Hex(rawBytes);
  const disclose = input.response.disclose ?? true;

  let data: JsonValue | undefined = disclose ? input.response.data : undefined;
  if (disclose && data === undefined) {
    try {
      const text = new TextDecoder('utf-8', { fatal: true }).decode(rawBytes);
      data = JSON.parse(text) as JsonValue;
    } catch {
      data = undefined;
    }
  }

  const response: JsonObject = {
    mime: input.response.mime,
    checksum,
    size_bytes: rawBytes.length,
    attachment_path: disclose ? attachmentContentAddressPath(checksum) : null,
    ...(input.response.format ? { format: input.response.format } : {}),
    ...(input.response.statusCode !== undefined ? { status_code: input.response.statusCode } : {}),
    ...(input.response.contentEncoding ? { content_encoding: input.response.contentEncoding } : {}),
    ...(input.response.providerRequestId ? { provider_request_id: input.response.providerRequestId } : {}),
    ...(input.response.reference ? { reference: input.response.reference } : {}),
    ...(data !== undefined ? { data } : {})
  };

  const record: JsonObject = {
    type: 'verification',
    id: input.id,
    version: input.version ?? '1.0.0',
    ...(input.parentId ? { parent_id: input.parentId } : {}),
    ...(input.parentSignature ? { parent_signature: input.parentSignature } : {}),
    scheme: input.scheme,
    provider: input.provider,
    checked_at_utc: input.checkedAtUtc,
    ...(input.validFromUtc !== undefined ? { valid_from_utc: input.validFromUtc } : {}),
    ...(input.validUntilUtc !== undefined ? { valid_until_utc: input.validUntilUtc } : {}),
    status: input.status,
    ...(input.resultCode ? { result_code: input.resultCode } : {}),
    ...(input.subject ? { subject: input.subject } : {}),
    response,
    ...(input.externalIdentity ? { external_identity: input.externalIdentity } : {})
  };

  if (input.collectorAttestation) {
    record.collector_attestation = {
      device_id: input.collectorAttestation.deviceId,
      alg: input.collectorAttestation.alg,
      signature: input.collectorAttestation.signature,
      attested_at_utc: input.collectorAttestation.attestedAtUtc
    };
    record.alg = input.collectorAttestation.alg;
    record.signature = input.collectorAttestation.signature;
  }

  record.canonical_string = recomputeVerificationCanonicalString(record);

  return {
    record,
    attachment: disclose ? { checksum, bytes: rawBytes } : undefined
  };
}

function applyExportOptionsToManifestExtra(
  manifestExtra: Record<string, JsonValue>,
  options?: LukuExportOptions
): Record<string, JsonValue> {
  const extra = { ...manifestExtra };
  const policy = options?.policy;
  if (policy) {
    extra.policy = {
      name: policy.name,
      ...(policy.native_continuity_gap_seconds !== undefined
        ? { native_continuity_gap_seconds: policy.native_continuity_gap_seconds }
        : {})
    };
    if (policy.native_continuity_gap_seconds !== undefined) {
      extra.native_continuity_gap_seconds = policy.native_continuity_gap_seconds;
    }
  }
  return extra;
}

function hasCriticalIssues(issues: VerificationIssue[]): boolean {
  return issues.some((entry) => entry.criticality === 'critical');
}

export class LukuFile {
  readonly manifest: LukuManifest;
  manifestSig: string;
  sealsRaw?: string;
  readonly blocks: LukuBlock[];
  readonly attachments: Map<string, Uint8Array>;
  private manifestRaw: string;
  private blocksRaw: string;
  private readonly sourceBytes?: Uint8Array;

  constructor(args: {
    manifest: LukuManifest;
    manifestSig: string;
    sealsRaw?: string;
    blocks: LukuBlock[];
    attachments?: Map<string, Uint8Array>;
    manifestRaw?: string;
    blocksRaw?: string;
    sourceBytes?: Uint8Array;
  }) {
    this.manifest = args.manifest;
    this.manifestSig = args.manifestSig;
    this.sealsRaw = args.sealsRaw;
    this.blocks = args.blocks.map((block) => ({
      ...block,
      batch: normalizeRecordBatch(block.batch ?? [])
    }));
    this.attachments = args.attachments ? new Map(args.attachments) : new Map();
    this.manifestRaw = args.manifestRaw ?? JSON.stringify(this.manifest, null, 2);
    this.blocksRaw = args.blocksRaw ?? `${this.blocks.map((block) => JSON.stringify(block)).join('\n')}\n`;
    this.sourceBytes = args.sourceBytes;
  }

  static async openBytes(data: Uint8Array): Promise<LukuFile> {
    if (data.length > 5 && new TextDecoder().decode(data.slice(0, 5)) === '%PDF-') {
      try {
        const doc = await PDFDocument.load(data);
        const catalog = doc.catalog;
        const names = catalog.get(PDFName.of('Names'));
        if (names instanceof PDFDict) {
          const embeddedFiles = names.get(PDFName.of('EmbeddedFiles'));
          if (embeddedFiles instanceof PDFDict) {
            const traverseTree = (node: PDFDict): Uint8Array | null => {
              const namesArray = node.get(PDFName.of('Names'));
              if (namesArray instanceof PDFArray) {
                for (let i = 0; i < namesArray.size(); i += 2) {
                  const spec = namesArray.lookup(i + 1);
                  if (spec instanceof PDFDict) {
                    const ef = spec.lookup(PDFName.of('EF'));
                    if (ef instanceof PDFDict) {
                      const f = ef.lookup(PDFName.of('F'));
                      if (f instanceof PDFRawStream) {
                        return decodePDFRawStream(f).decode();
                      }
                    }
                  }
                }
              }
              const kidsArray = node.get(PDFName.of('Kids'));
              if (kidsArray instanceof PDFArray) {
                for (let i = 0; i < kidsArray.size(); i++) {
                  const kid = kidsArray.lookup(i);
                  if (kid instanceof PDFDict) {
                    const result = traverseTree(kid);
                    if (result) return result;
                  }
                }
              }
              return null;
            };
            const extracted = traverseTree(embeddedFiles);
            if (extracted) {
              data = extracted;
            }
          }
        }
      } catch (e) {
        // Fallback to raw data parsing if PDF extraction fails
      }
    }

    let archiveEntries: Record<string, Uint8Array>;
    try {
      archiveEntries = unzipSync(data);
    } catch (error) {
      throw new Error(`Failed to open .luku archive: ${String(error)}`);
    }

    const stored = LukuFile.readStoredArchive(archiveEntries);
    if (stored.mimetype.trim() !== LUKU_MIMETYPE) {
      throw new Error(`Invalid mimetype: expected ${LUKU_MIMETYPE}`);
    }
    if (!stored.manifestRaw) {
      throw new Error('manifest.json missing');
    }
    if (!stored.blocksRaw) {
      throw new Error('blocks.jsonl missing');
    }

    let manifest: LukuManifest;
    try {
      const manifestJson = ensureJsonObject(JSON.parse(stored.manifestRaw), 'manifest.json');
      validateManifestShape(manifestJson);
      manifest = manifestJson as unknown as LukuManifest;
    } catch (error) {
      throw new Error(`Failed to parse manifest.json: ${String(error)}`);
    }

    const blocks = stored.blocksRaw
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line, index) => {
        try {
          return ensureJsonObject(JSON.parse(line), `blocks.jsonl line ${index + 1}`) as unknown as LukuBlock;
        } catch (error) {
          throw new Error(`Failed to parse blocks.jsonl line ${index + 1}: ${String(error)}`);
        }
      });

    return new LukuFile({
      manifest,
      manifestSig: stored.manifestSig,
      sealsRaw: stored.sealsRaw,
      blocks,
      attachments: new Map(Object.entries(stored.attachments)),
      manifestRaw: stored.manifestRaw,
      blocksRaw: stored.blocksRaw,
      sourceBytes: data
    });
  }

  /**
   * Verifies a .luku archive from bytes.
   */
  static async verifyFile(data: Uint8Array, options: LukuVerifyOptions = {}): Promise<VerificationIssue[]> {
    const luku = await LukuFile.openBytes(data);
    return luku.verify(options);
  }

  /**
   * Verifies a single JSON envelope (record) without archive-level continuity checks.
   */
  static async verifyEnvelope(envelope: JsonObject, options: LukuVerifyOptions = {}): Promise<VerificationIssue[]> {
    const issues: VerificationIssue[] = [];
    const allowUntrustedRoots = options.allowUntrustedRoots ?? false;
    const skipCertificateTemporalChecks = options.skipCertificateTemporalChecks ?? false;
    const trustProfile = options.trustProfile ?? 'prod';
    const revocationManager = options.revocationManager;

    const recordType = asString(envelope.type) ?? 'unknown';
    const isAuxRecord = isAuxRecordType(recordType);
    const isVerificationRecord = isVerificationRecordType(recordType);
    const isNonChainAdvancing = isAuxRecord || isVerificationRecord;
    const payload = asJsonObject(envelope.payload) ?? {};

    const device = asJsonObject(envelope.device);
    const deviceId = asString(envelope.device_id) ?? asString(device?.device_id);
    const publicKey = asString(envelope.public_key) ?? asString(device?.public_key);
    const vendor = asString(envelope.vendor) ?? asString(device?.vendor);
    const signature = asString(envelope.signature) ?? '';
    // `verification` is the one record class that is not required to carry a
    // device signature at all — only attempt the device-signature axis
    // (DAC/heartbeat requiredness, canonical+signature checks below) when it
    // actually claims one (collector_attestation present, or a top-level
    // signature already set).
    const verificationSkipsDeviceSignature = isVerificationRecord && !verificationRecordHasDeviceSignature(envelope, signature);

    if (!vendor) {
      issues.push(issue('DEVICE_VENDOR_MISSING', `Device vendor is missing for device ${deviceId ?? 'unknown'}.`, 'critical'));
    }
    const canonicalStringValue = asString(envelope.canonical_string) ?? '';
    const timestamp = recordTimestampUtc(envelope);
    const counter = recordCounter(envelope);
    const attestationRecordId = recordAttestationId(envelope);
    const genesisHash = asString(payload.genesis_hash) ?? '';
    const previousSignature = asString(envelope.previous_signature) ?? '';

    if (!deviceId || !publicKey) {
      issues.push(issue('DEVICE_IDENTITY_MISSING', 'Envelope is missing device_id or public_key.', 'critical'));
    }

    if (!isNonChainAdvancing && counter === 0 && genesisHash.length > 0 && previousSignature.length > 0 && previousSignature !== genesisHash) {
      issues.push(issue('GENESIS_HASH_MISMATCH', `Genesis record (ctr=0) for device ${deviceId ?? 'unknown'} has previous_signature that does not match genesis_hash.`, 'critical'));
    }

    if (!allowUntrustedRoots && !verificationSkipsDeviceSignature) {
      const identity = asJsonObject(envelope.identity);
      let attestationChain = '';
      
      const dac = asString(envelope.attestation_dac_der) ?? asString(identity?.dac_der) ?? asString(identity?.attestation_dac_der);
      const man = asString(envelope.attestation_manufacturer_der) ?? asString(identity?.attestation_manufacturer_der);
      const int = asString(envelope.attestation_intermediate_der) ?? asString(identity?.attestation_intermediate_der);

      if (dac) {
        attestationChain = [
          pemFromDerBase64(dac),
          pemFromDerBase64(man),
          pemFromDerBase64(int)
        ]
          .filter((value): value is string => Boolean(value))
          .join('');
      }

      const attestationSignature =
        asString(envelope.attestation_dac_signature) ??
        asString(identity?.dac_signature) ??
        '';

      if (attestationChain.length === 0) {
        issues.push(issue('ATTESTATION_CHAIN_MISSING', `Missing DAC attestation chain for device ${deviceId ?? 'unknown'}.`, 'warning'));
        if (attestationSignature.length === 0) {
          issues.push(issue('ATTESTATION_FAILED', `Device ${deviceId ?? 'unknown'} failed DAC attestation: attestationSig missing`, 'critical'));
        }
      } else if (attestationSignature.length === 0) {
        issues.push(issue('ATTESTATION_FAILED', `Device ${deviceId ?? 'unknown'} failed DAC attestation: attestationSig missing`, 'critical'));
      } else {
        const attestationResult = await verifyDeviceAttestation({
          id: deviceId ?? 'unknown',
          key: publicKey ?? '',
          attestationSig: attestationSignature,
          ctr: counter,
          vendor: vendor,
          recordId: attestationRecordId,
          certificateChain: attestationChain,
          trustProfile
        }, revocationManager);
        if (!attestationResult.ok) {
          issues.push(issue('ATTESTATION_FAILED', `Device ${deviceId ?? 'unknown'} failed DAC attestation: ${attestationResult.reason ?? 'unknown error'}`, 'critical'));
        }
      }

      // Check Heartbeat (SLAC)
      const slac = asString(envelope.heartbeat_slac_der) ?? asString(identity?.hb_slac_der) ?? asString(identity?.heartbeat_slac_der);
      const hbMan = asString(envelope.heartbeat_der) ?? asString(identity?.hb_der) ?? asString(identity?.heartbeat_der);
      const hbInt = asString(envelope.heartbeat_intermediate_der) ?? asString(identity?.hb_intermediate_der) ?? asString(identity?.heartbeat_intermediate_der);

      if (slac) {
        const slacChain = [
          pemFromDerBase64(slac),
          pemFromDerBase64(hbMan),
          pemFromDerBase64(hbInt)
        ]
          .filter((value): value is string => Boolean(value))
          .join('');

        if (slacChain.length > 0) {
          const chainResult = await validateCertificateChain({
            certificateChain: slacChain,
            created: skipCertificateTemporalChecks ? undefined : timestamp,
            trustProfile
          }, revocationManager);
          if (!chainResult.ok) {
            issues.push(issue('ATTESTATION_FAILED', `Device ${deviceId ?? 'unknown'} failed SLAC (heartbeat) attestation: ${chainResult.reason ?? 'unknown error'}`, 'critical'));
          } else if (publicKey && chainResult.certSpkis?.[0] && !spkiMatchesEd25519PublicKey(chainResult.certSpkis[0], publicKey)) {
            issues.push(issue('ATTESTATION_FAILED', `Device ${deviceId ?? 'unknown'} failed SLAC (heartbeat) attestation: SLAC leaf public key does not match envelope public_key`, 'critical'));
          } else {
            const slacSignature = asString(envelope.heartbeat_signature) ?? asString(identity?.heartbeat_signature) ?? '';
            if (slacSignature.length > 0) {
              const lastSyncUtc = asNumber(identity?.last_sync_utc) ?? asNumber(envelope.last_sync_utc);
              if (lastSyncUtc === undefined || lastSyncUtc <= 0) {
                issues.push(issue('ATTESTATION_FAILED', `Device ${deviceId ?? 'unknown'} failed SLAC (heartbeat) attestation: Missing trusted heartbeat timestamp`, 'critical'));
              } else if (timestamp !== undefined && lastSyncUtc > timestamp) {
                issues.push(issue('LAST_SYNC_AFTER_RECORD', `Device ${deviceId ?? 'unknown'} reports last_sync_utc ${lastSyncUtc} after record timestamp ${timestamp}.`, 'critical'));
              } else {
                const slacResult = await verifyHeartbeatAttestation({
                  id: deviceId ?? 'unknown',
                  heartbeatSig: slacSignature,
                  lastSyncUtc,
                  ctr: counter,
                  recordId: attestationRecordId,
                  certificateChain: slacChain,
                  trustProfile
                }, revocationManager);
                if (!slacResult.ok) {
                  issues.push(issue('ATTESTATION_FAILED', `Device ${deviceId ?? 'unknown'} failed SLAC (heartbeat) attestation: ${slacResult.reason ?? 'unknown error'}`, 'critical'));
                }
              }
            } else {
              issues.push(issue('ATTESTATION_FAILED', `Device ${deviceId ?? 'unknown'} failed SLAC (heartbeat) attestation: heartbeatSig missing`, 'critical'));
            }
          }
        }
      }
    }

    const recomputedCanonical = publicKey && deviceId ? recomputeRecordCanonicalString(envelope, recordType, deviceId, publicKey) : null;
    if (recomputedCanonical === null && canonicalStringValue.length > 0) {
      issues.push(issue('RECORD_SCHEMA_UNRECOGNIZED', `Record type ${recordType} has an unrecognized type or scan profile; its canonical string cannot be independently verified.`, 'critical'));
    } else if (recomputedCanonical !== null && canonicalStringValue.length > 0 && recomputedCanonical !== canonicalStringValue) {
      issues.push(
        issue(
          'RECORD_CANONICAL_MISMATCH',
          `Record type ${recordType} has a canonical_string that does not match the value independently recomputed from its own fields.`,
          'critical'
        )
      );
    }
    const canonicalForSignature = recomputedCanonical ?? canonicalStringValue;

    if (verificationSkipsDeviceSignature) {
      // A `verification` record with no collector_attestation and no
      // top-level signature is not required to be device-signed at all
      // (LUKU.md "External Verification (`verification`)"); skip entirely
      // rather than flagging a missing canonical string/signature.
    } else if (canonicalForSignature.length === 0) {
      issues.push(issue('RECORD_CANONICAL_MISSING', `Record type ${recordType} does not include a canonical_string.`, 'critical'));
    } else if (signature.length === 0) {
      issues.push(issue('RECORD_SIGNATURE_MISSING', `Record type ${recordType} is missing a signature.`, 'critical'));
    } else if (publicKey) {
      const verified = await verifyRecordSignature(publicKey, signature, canonicalForSignature);
      const storedVerified = canonicalStringValue.length > 0 && canonicalStringValue !== canonicalForSignature
        ? await verifyRecordSignature(publicKey, signature, canonicalStringValue)
        : verified;
      if (!verified || !storedVerified) {
        issues.push(issue('RECORD_SIGNATURE_INVALID', `Invalid signature for record type ${recordType}.`, 'critical'));
      }
    }

    if (recordType === 'attachment') {
      const checksum = asString(envelope.checksum) ?? '';
      if (checksum.length > 0 && options.attachments) {
        const content = options.attachments.get(checksum);
        if (!content) {
          issues.push(issue('ATTACHMENT_MISSING', `Attachment with hash ${checksum} is missing from provided attachments.`, 'critical'));
        } else {
          const actualHash = await sha256Hex(content);
          if (actualHash !== checksum) {
            issues.push(issue('ATTACHMENT_CORRUPT', `Attachment with hash ${checksum} is corrupt (actual hash ${actualHash}).`, 'critical'));
          }
        }
      }
    }

    const externalIdentity = asJsonObject(envelope.external_identity);
    if (externalIdentity && isAuxRecord) {
        const expectedPayload = expectedExternalIdentityPayload(envelope, recordType);
        const endorserId = asString(externalIdentity?.endorser_id);
        const rootFingerprint = asString(externalIdentity?.root_fingerprint);
        const extSignature = asString(externalIdentity?.signature);
        const certChainDer = asJsonArray(externalIdentity?.cert_chain_der)
          ?.map((value) => asString(value))
          .filter((value): value is string => Boolean(value));

        if (expectedPayload && endorserId && rootFingerprint && extSignature && certChainDer?.length) {
          const result = await verifyExternalIdentity({
            endorserId,
            rootFingerprint,
            certChainDer,
            signature: extSignature,
            expectedPayload,
            trustedFingerprints: options.trustedExternalFingerprints ?? []
          });
          if (!result.ok) {
            issues.push(issue(
              'EXTERNAL_IDENTITY_VERIFICATION_FAILED',
              `External identity verification failed: ${result.reason ?? 'unknown error'}`,
              'critical'
            ));
          }
        }
    }

    if (isVerificationRecord) {
      const { issues: verificationIssues } = await evaluateVerificationRecord(
        envelope,
        options.attachments,
        deviceId,
        publicKey,
        options.trustedExternalFingerprints ?? []
      );
      issues.push(...verificationIssues);
    }

    return issues;
  }

  private static readStoredArchive(entries: Record<string, Uint8Array>): StoredArchive {
    for (const name of Object.keys(entries)) {
      if (!isSafeZipEntryName(name)) {
        throw new Error(`Archive contains unsafe ZIP entry path: ${name}`);
      }
    }
    const mimetypeBytes = entries.mimetype;
    if (!mimetypeBytes) {
      throw new Error('mimetype file missing');
    }
    const manifestBytes = entries['manifest.json'];
    const blocksBytes = entries['blocks.jsonl'];

    const attachments: Record<string, Uint8Array> = {};
    for (const [name, bytes] of Object.entries(entries)) {
      if (!name.startsWith('attachments/')) {
        continue;
      }
      const hash = name.split('/').pop();
      if (hash) {
        attachments[hash] = bytes;
      }
    }

    return {
      mimetype: strFromU8(mimetypeBytes),
      manifestRaw: manifestBytes ? new TextDecoder('utf-8', { fatal: true }).decode(manifestBytes) : undefined,
      blocksRaw: blocksBytes ? new TextDecoder('utf-8', { fatal: true }).decode(blocksBytes) : undefined,
      manifestSig: entries['manifest.sig'] ? strFromU8(entries['manifest.sig']) : '',
      sealsRaw: entries['seals.json'] ? new TextDecoder('utf-8', { fatal: true }).decode(entries['seals.json']) : undefined,
      attachments
    };
  }

  static async export(
    records: JsonObject[],
    device: LukuDeviceIdentity,
    attachments: Map<string, Uint8Array> | Record<string, Uint8Array>,
    signer: LukuExporterSigner,
    options: LukuExportOptions = {}
  ): Promise<LukuFile> {
    return LukuFile.exportWithIdentity(records, device, attachments, signer, options);
  }

  static async exportWithIdentity(
    records: JsonObject[],
    device: LukuDeviceIdentity,
    attachments: Map<string, Uint8Array> | Record<string, Uint8Array>,
    signer: LukuExporterSigner,
    options: LukuExportOptions = {}
  ): Promise<LukuFile> {
    const nativeGapThresholdSeconds = options.policy?.native_continuity_gap_seconds;
    const blocks: LukuBlock[] = [];
    let previousBlockHash: string | null = null;
    let currentBatch: JsonObject[] = [];
    let lastSignature: string | undefined;
    let lastNativeTimestampUtc: number | undefined;

    const flushCurrentBatch = async (): Promise<void> => {
      if (currentBatch.length === 0) {
        return;
      }
      const timestamp = currentBatch
        .map((record) => recordTimestampUtc(record) ?? 0)
        .find((value) => value > 0) ?? 0;
      const block = await LukuFile.buildBlockFromRecords(
        blocks.length,
        timestamp,
        previousBlockHash,
        device,
        currentBatch,
        undefined
      );
      previousBlockHash = block.block_hash;
      blocks.push(block);
      currentBatch = [];
      lastSignature = undefined;
      lastNativeTimestampUtc = undefined;
    };

    for (const record of records) {
      const recordType = asString(record.type) ?? 'unknown';
      const isNonChainAdvancing = isNonChainAdvancingRecordType(recordType);
      const timestampUtc = recordTimestampUtc(record);
      const previousSignature = asString(record.previous_signature);
      const signature = asString(record.signature);

      let shouldSplit = false;
      if (!isNonChainAdvancing) {
        if (lastSignature && previousSignature && previousSignature.length > 0 && previousSignature !== lastSignature) {
          shouldSplit = true;
        }

        if (!shouldSplit
          && nativeGapThresholdSeconds !== undefined
          && lastNativeTimestampUtc !== undefined
          && timestampUtc !== undefined
          && timestampUtc > lastNativeTimestampUtc
          && (timestampUtc - lastNativeTimestampUtc) > nativeGapThresholdSeconds) {
          shouldSplit = true;
        }
      }

      if (shouldSplit) {
        await flushCurrentBatch();
      }

      currentBatch.push(record);

      if (!isNonChainAdvancing) {
        if (signature && signature.length > 0) {
          lastSignature = signature;
        }
        if (timestampUtc !== undefined) {
          lastNativeTimestampUtc = timestampUtc;
        }
      }
    }

    await flushCurrentBatch();

    return LukuFile.exportBlocksWithManifest(
      blocks,
      attachments,
      `Exported ${records.length} records`,
      {},
      signer,
      options
    );
  }

  static async exportBlocksWithManifest(
    blocks: LukuBlock[],
    attachments: Map<string, Uint8Array> | Record<string, Uint8Array>,
    description: string,
    manifestExtra: Record<string, JsonValue>,
    signer: LukuExporterSigner,
    options: LukuExportOptions = {}
  ): Promise<LukuFile> {
    const now = Math.floor(Date.now() / 1000);
    const normalizedBlocks: LukuBlock[] = [];
    let previousBlockHash: string | null = null;

    for (let index = 0; index < blocks.length; index += 1) {
      const block: LukuBlock = {
        ...blocks[index],
        block_id: index,
        previous_block_hash: previousBlockHash,
        timestamp_utc: blocks[index].timestamp_utc || now,
        batch: normalizeRecordBatch(blocks[index].batch ?? [])
      };
      const recomputed = await recomputeBlockFields(block);
      block.batch_hash = recomputed.batchHash;
      block.block_canonical_string = recomputed.blockCanonicalString;
      block.block_hash = recomputed.blockHash;
      previousBlockHash = block.block_hash;
      normalizedBlocks.push(block);
    }

    const blocksRaw = `${normalizedBlocks.map((block) => JSON.stringify(block)).join('\n')}\n`;
    const exporterPublicKey = signer.publicKeyBase64
      ?? (signer.publicKey ? await exportPublicKeyBase64(signer.publicKey) : undefined);

    const manifest: LukuManifest = {
      type: 'LukuArchive',
      version: '1.0.0',
      created_at_utc: now,
      description,
      blocks_hash: await sha256Hex(utf8(blocksRaw)),
      ...applyExportOptionsToManifestExtra(manifestExtra, options)
    };

    if (!manifest.exporter_public_key && exporterPublicKey) {
      manifest.exporter_public_key = exporterPublicKey;
    }
    if (!manifest.exporter_alg) {
      manifest.exporter_alg = 'ED25519';
    }

    const manifestRaw = JSON.stringify(manifest, null, 2);
    const manifestSig = await signDetachedBase64(signer.privateKey, manifestRaw);
    const sealsRaw = await createSelfSealFile(manifestRaw);
    return new LukuFile({
      manifest,
      manifestSig,
      sealsRaw,
      blocks: normalizedBlocks,
      attachments: attachments instanceof Map ? attachments : new Map(Object.entries(attachments)),
      manifestRaw,
      blocksRaw
    });
  }

  static async buildBlockFromRecords(
    blockId: number,
    timestampUtc: number,
    previousBlockHash: string | null,
    defaultDevice: LukuDeviceIdentity,
    batch: JsonObject[],
    commonCerts?: Record<string, string>
  ): Promise<LukuBlock> {
    const normalizedBatch = normalizeRecordBatch(batch);
    const recordLevelDevice = normalizedBatch
      .map((record) => asJsonObject(record.device))
      .find((value) => value && asString(value.device_id) && asString(value.public_key));

    const device: LukuDeviceIdentity = recordLevelDevice
      ? {
          device_id: asString(recordLevelDevice.device_id) ?? defaultDevice.device_id,
          public_key: asString(recordLevelDevice.public_key) ?? defaultDevice.public_key,
          vendor: asString(recordLevelDevice.vendor) ?? defaultDevice.vendor
        }
      : defaultDevice;

    const readCommonValue = (path: string[]): string | null => {
      let first: string | null = null;
      for (const record of normalizedBatch) {
        let current: JsonValue | undefined = record;
        for (const segment of path) {
          current = asJsonObject(current)?.[segment];
        }
        const stringValue = asString(current);
        if (!stringValue) {
          return null;
        }
        if (first === null) {
          first = stringValue;
        } else if (first !== stringValue) {
          return null;
        }
      }
      return first;
    };

    const attestationRootFingerprint = readCommonValue(['identity', 'attestation_root_fingerprint'])
      ?? commonCerts?.attestation_root_fingerprint
      ?? null;
    const heartbeatRootFingerprint = readCommonValue(['identity', 'heartbeat_root_fingerprint'])
      ?? commonCerts?.heartbeat_root_fingerprint
      ?? null;

    const provisional: LukuBlock = {
      block_id: blockId,
      timestamp_utc: timestampUtc,
      previous_block_hash: previousBlockHash,
      device,
      attestation_dac_der: readCommonValue(['identity', 'dac_der']) ?? commonCerts?.dac_der ?? null,
      attestation_manufacturer_der:
        readCommonValue(['identity', 'attestation_manufacturer_der']) ?? commonCerts?.attestation_manufacturer_der ?? null,
      attestation_intermediate_der:
        readCommonValue(['identity', 'attestation_intermediate_der']) ?? commonCerts?.attestation_intermediate_der ?? null,
      attestation_root_fingerprint: attestationRootFingerprint,
      heartbeat_slac_der: readCommonValue(['identity', 'slac_der']) ?? commonCerts?.slac_der ?? null,
      heartbeat_der: readCommonValue(['identity', 'heartbeat_der']) ?? commonCerts?.heartbeat_der ?? null,
      heartbeat_intermediate_der:
        readCommonValue(['identity', 'heartbeat_intermediate_der']) ?? commonCerts?.heartbeat_intermediate_der ?? null,
      heartbeat_root_fingerprint: heartbeatRootFingerprint,
      batch: normalizedBatch,
      batch_hash: '',
      block_canonical_string: '',
      block_hash: ''
    };

    const recomputed = await recomputeBlockFields(provisional);
    provisional.batch_hash = recomputed.batchHash;
    provisional.block_canonical_string = recomputed.blockCanonicalString;
    provisional.block_hash = recomputed.blockHash;
    return provisional;
  }

  addAttachment(content: Uint8Array): string {
    throw new Error(`addAttachment() must be computed asynchronously; use addAttachmentAsync()`);
  }

  async addAttachmentAsync(content: Uint8Array): Promise<string> {
    const hash = await sha256Hex(content);
    this.attachments.set(hash, content);
    return hash;
  }

  async append(
    records: JsonObject[],
    device: LukuDeviceIdentity,
    signer: LukuExporterSigner
  ): Promise<void> {
    const timestampUtc = Math.floor(Date.now() / 1000);
    const lastBlock = this.blocks[this.blocks.length - 1];
    const newBlock = await LukuFile.buildBlockFromRecords(
      this.blocks.length,
      timestampUtc,
      lastBlock?.block_hash ?? null,
      device,
      records,
      undefined
    );
    this.blocks.push(newBlock);

    const blocksRaw = `${this.blocks.map((block) => JSON.stringify(block)).join('\n')}\n`;
    this.manifest.blocks_hash = await sha256Hex(utf8(blocksRaw));
    this.manifest.created_at_utc = timestampUtc;
    this.manifestRaw = JSON.stringify(this.manifest, null, 2);
    this.blocksRaw = blocksRaw;
    this.manifestSig = await signDetachedBase64(signer.privateKey, this.manifestRaw);
    this.sealsRaw = await createSelfSealFile(this.manifestRaw);
  }

  async appendVerificationRecord(
    record: JsonObject,
    responseBytes: Uint8Array | undefined,
    device: LukuDeviceIdentity,
    signer: LukuExporterSigner
  ): Promise<void> {
    if (asString(record.type) !== 'verification') {
      throw new Error('appendVerificationRecord() requires a verification record');
    }
    const response = asJsonObject(record.response);
    const checksum = asString(response?.checksum);
    const sizeBytes = asNumber(response?.size_bytes);
    if (!checksum || !/^[0-9a-f]{64}$/.test(checksum) || sizeBytes === undefined || !Number.isSafeInteger(sizeBytes) || sizeBytes < 0) {
      throw new Error('verification response requires response.checksum and response.size_bytes');
    }
    const appended = structuredClone(record);
    const appendedResponse = asJsonObject(appended.response)!;
    if (responseBytes) {
      if (await sha256Hex(responseBytes) !== checksum || responseBytes.length !== sizeBytes) {
        throw new Error('exact response bytes do not match response.checksum/size_bytes');
      }
      this.attachments.set(checksum, responseBytes);
      appendedResponse.attachment_path = `attachments/${checksum.slice(0, 2)}/${checksum.slice(2, 4)}/${checksum}`;
    } else if (appendedResponse.data !== undefined) {
      throw new Error('response.data requires disclosed original response bytes');
    }
    appended.response = appendedResponse;
    await this.append([appended], device, signer);
  }

  async merge(other: LukuFile, signer: LukuExporterSigner): Promise<void> {
    for (const incoming of other.blocks) {
      const normalized = {
        ...incoming,
        block_id: this.blocks.length,
        previous_block_hash: this.blocks[this.blocks.length - 1]?.block_hash ?? null,
        batch: normalizeRecordBatch(incoming.batch)
      };
      const recomputed = await recomputeBlockFields(normalized);
      normalized.batch_hash = recomputed.batchHash;
      normalized.block_canonical_string = recomputed.blockCanonicalString;
      normalized.block_hash = recomputed.blockHash;
      this.blocks.push(normalized);
    }

    for (const [hash, bytes] of other.attachments) {
      this.attachments.set(hash, bytes);
    }

    const timestampUtc = Math.floor(Date.now() / 1000);
    const blocksRaw = `${this.blocks.map((block) => JSON.stringify(block)).join('\n')}\n`;
    this.manifest.blocks_hash = await sha256Hex(utf8(blocksRaw));
    this.manifest.created_at_utc = timestampUtc;
    this.manifestRaw = JSON.stringify(this.manifest, null, 2);
    this.blocksRaw = blocksRaw;
    this.manifestSig = await signDetachedBase64(signer.privateKey, this.manifestRaw);
    this.sealsRaw = await createSelfSealFile(this.manifestRaw);
  }

  async saveToBytes(): Promise<Uint8Array> {
    const blocksRaw = `${this.blocks.map((block) => JSON.stringify(block)).join('\n')}\n`;
    const files: Zippable = {
      mimetype: [strToU8(LUKU_MIMETYPE), { level: 0 as const }],
      'blocks.jsonl': [strToU8(blocksRaw), { level: 6 as const }],
      'manifest.json': [strToU8(this.manifestRaw), { level: 6 as const }],
      'manifest.sig': [strToU8(this.manifestSig), { level: 6 as const }]
    };
    if (!this.sealsRaw) {
      this.sealsRaw = await createSelfSealFile(this.manifestRaw);
    }
    const sealIssues: VerificationIssue[] = [];
    await verifySelfSeals(this.sealsRaw, this.manifestRaw, sealIssues);
    if (sealIssues.some((entry) => entry.criticality === 'critical')) {
      throw new Error('seals.json does not contain a valid archive self seal');
    }
    files['seals.json'] = [strToU8(this.sealsRaw), { level: 6 as const }];

    for (const [hash, bytes] of this.attachments) {
      const dir1 = hash.length >= 2 ? hash.slice(0, 2) : '00';
      const dir2 = hash.length >= 4 ? hash.slice(2, 4) : '00';
      files[`attachments/${dir1}/${dir2}/${hash}`] = [bytes, { level: 6 }];
    }

    return zipSync(files);
  }

  /**
   * Verifies the entire archive and returns any issues found.
   */
  async verifyFile(options: LukuVerifyOptions = {}): Promise<VerificationIssue[]> {
    return this.verify(options);
  }

  async verify(options: LukuVerifyOptions = {}): Promise<VerificationIssue[]> {
    const allowUntrustedRoots = options.allowUntrustedRoots ?? false;
    const skipCertificateTemporalChecks = options.skipCertificateTemporalChecks ?? false;
    const trustProfile = options.trustProfile ?? 'prod';
    const revocationManager = options.revocationManager;
    const expectedPolicy = options.policy;
    const issues: VerificationIssue[] = [];

    await verifySelfSeals(this.sealsRaw, this.manifestRaw, issues);

    if (this.manifestSig.trim().length === 0) {
      issues.push(issue('MANIFEST_SIGNATURE_MISSING', 'The manifest.sig file is empty or missing.', 'critical'));
    } else {
      const exporterPublicKey = asString(this.manifest.exporter_public_key);
      if (!exporterPublicKey) {
        issues.push(issue('EXPORTER_KEY_MISSING', 'Archive does not publish an exporter_public_key; manifest/block signatures cannot be checked offline.', 'warning'));
      } else {
        const valid = await verifyDetachedSignature(exporterPublicKey, this.manifestRaw, this.manifestSig);
        if (!valid) {
          issues.push(issue('MANIFEST_SIGNATURE_INVALID', 'The manifest signature does not verify against the exporter key.', 'critical'));
        }
      }
    }

    const blocksHash = await sha256Hex(utf8(this.blocksRaw));
    if (blocksHash !== this.manifest.blocks_hash) {
      issues.push(issue('BLOCKS_HASH_MISMATCH', 'The blocks.jsonl file hash does not match the manifest.', 'critical'));
    }
    if (!SUPPORTED_ARCHIVE_VERSIONS.has(this.manifest.version)) {
      issues.push(issue('MANIFEST_VERSION_UNSUPPORTED', `Archive manifest version ${this.manifest.version} is not supported.`, 'critical'));
    }

    let previousBlockHash: string | null = null;
    for (let index = 0; index < this.blocks.length; index += 1) {
      const block = this.blocks[index];
      if (block.block_id !== index) {
        issues.push(issue('BLOCK_ID_MISMATCH', `Block ${index} has incorrect block_id ${block.block_id}.`, 'critical'));
      }
      if ((block.previous_block_hash ?? null) !== previousBlockHash) {
        issues.push(issue('BLOCK_CHAIN_BROKEN', `Block ${index} previous hash link is broken.`, 'critical'));
      }
      const recomputed = await recomputeBlockFields(block);
      if (block.batch_hash !== recomputed.batchHash) {
        issues.push(issue('BLOCK_BATCH_HASH_INVALID', `Block ${index} batch_hash does not match ordered record signatures.`, 'critical'));
      }
      if (block.block_canonical_string !== recomputed.blockCanonicalString) {
        issues.push(issue('BLOCK_CANONICAL_MISMATCH', `Block ${index} canonical string does not match recomputed content.`, 'critical'));
      }
      if (!block.block_hash) {
        issues.push(issue('BLOCK_HASH_MISSING', `Block ${index} is missing block_hash.`, 'critical'));
      } else if (block.block_hash !== recomputed.blockHash) {
        issues.push(issue('BLOCK_HASH_INVALID', `Block ${index} block_hash does not match canonical content.`, 'critical'));
      }
      previousBlockHash = block.block_hash || null;
    }

    const recordIds = new Set<string>();
    for (const block of this.blocks) {
      for (const record of block.batch) {
        for (const key of ['id']) {
          const value = asString(record[key]);
          if (value) {
            recordIds.add(value);
          }
        }
      }
    }

    const lastCounters = new Map<string, number>();
    const lastTimes = new Map<string, number>();
    const lastContinuityTimes = new Map<string, Map<string, number>>();
    const seenDevices = new Set<string>();

    const policy = options.policy || manifestPolicy(this.manifest);
    const requireContinuity = options.require_continuity ?? false;
    const continuityTypes = ['environment'];

    for (const block of this.blocks) {
      const lastSignatures = new Map<string, string>();
      const blockDacChain = [
        pemFromDerBase64(block.attestation_dac_der),
        pemFromDerBase64(block.attestation_manufacturer_der),
        pemFromDerBase64(block.attestation_intermediate_der)
      ]
        .filter((value): value is string => Boolean(value))
        .join('');

      for (const record of block.batch) {
        const recordType = asString(record.type) ?? 'unknown';
        const isAuxRecord = isAuxRecordType(recordType);
        const isVerificationRecord = isVerificationRecordType(recordType);
        const isNonChainAdvancing = isAuxRecord || isVerificationRecord;
        const isCompatAttachment = asBoolean(record._compat_nested_attachment) ?? false;
        const payload = asJsonObject(record.payload);
        const deviceId = asString(record.device_id) ?? block.device.device_id;
        const publicKey = asString(record.public_key) ?? block.device.public_key;
        const vendor = asString(record.vendor) ?? block.device.vendor;
        const signature = asString(record.signature) ?? '';
        // `verification` is the one record class not required to be device-signed
        // at all; only run the device-signature axis checks below (DAC/heartbeat
        // requiredness, canonical+signature enforcement) when it actually claims
        // one via collector_attestation or an already-set top-level signature.
        const verificationSkipsDeviceSignature = isVerificationRecord && !verificationRecordHasDeviceSignature(record, signature);

        if (!vendor) {
          issues.push(issue('DEVICE_VENDOR_MISSING', `Device vendor is missing for device ${deviceId} at block ${block.block_id}.`, 'critical'));
        }
        const previousSignature = asString(record.previous_signature) ?? '';
        const canonicalStringValue = asString(record.canonical_string) ?? '';
        const timestamp = asNumber(payload?.timestamp_utc) ?? asNumber(record.timestamp_utc);
        const counter = asNumber(payload?.ctr);
        const attestationRecordId = recordAttestationId(record);
        const genesisHash = asString(payload?.genesis_hash) ?? '';

        if (!isNonChainAdvancing && !seenDevices.has(deviceId)) {
          seenDevices.add(deviceId);
          if (counter === 0 && genesisHash.length > 0 && previousSignature !== genesisHash) {
            issues.push(issue('GENESIS_HASH_MISMATCH', `Genesis record (ctr=0) for device ${deviceId} has previous_signature that does not match genesis_hash.`, 'critical'));
          }
        }

        if (!isNonChainAdvancing) {
          const lastSignature = lastSignatures.get(deviceId);
          if (lastSignature && previousSignature !== lastSignature) {
            issues.push(issue('RECORD_CHAIN_BROKEN', `Record chain broken for device ${deviceId} at record type ${recordType}.`, 'critical'));
          }
          const lastCounter = lastCounters.get(deviceId);
          if (lastCounter !== undefined && counter !== undefined && counter <= lastCounter) {
            issues.push(issue('COUNTER_REGRESSION', `Counter regression detected for device ${deviceId} (${lastCounter} -> ${counter}).`, 'critical'));
          }
          const lastTime = lastTimes.get(deviceId);
          if (lastTime !== undefined && timestamp !== undefined && timestamp < lastTime) {
            issues.push(issue('TIME_REGRESSION', `Time travel detected for device ${deviceId} (${lastTime} -> ${timestamp}).`, 'critical'));
          }
        }

        if (requireContinuity && continuityTypes.includes(recordType) && policy?.native_continuity_gap_seconds !== undefined) {
          let deviceContinuity = lastContinuityTimes.get(deviceId);
          if (!deviceContinuity) {
            deviceContinuity = new Map<string, number>();
            lastContinuityTimes.set(deviceId, deviceContinuity);
          }
          const lastEnvTime = deviceContinuity.get(recordType);
          if (lastEnvTime !== undefined && timestamp !== undefined) {
            const gap = timestamp - lastEnvTime;
            if (gap > policy.native_continuity_gap_seconds) {
              issues.push(issue('CONTINUITY_GAP_EXCEEDED', `Continuity gap of ${gap}s exceeded for device ${deviceId} type ${recordType} (threshold ${policy.native_continuity_gap_seconds}s).`, 'critical'));
            }
          }
          if (timestamp !== undefined) {
            deviceContinuity.set(recordType, timestamp);
          }
        }

        if (!allowUntrustedRoots) {
          const identity = asJsonObject(record.identity);
          let attestationChain = blockDacChain;
          if (identity) {
            const recordLevelDac = pemFromDerBase64(asString(identity.dac_der));
            if (recordLevelDac) {
              attestationChain = [
                recordLevelDac,
                pemFromDerBase64(asString(identity.attestation_manufacturer_der)),
                pemFromDerBase64(asString(identity.attestation_intermediate_der))
              ]
                .filter((value): value is string => Boolean(value))
                .join('');
            }
          }
          const attestationSignature =
            asString(identity?.dac_signature) ??
            '';

          if (attestationChain.length === 0) {
            issues.push(issue('ATTESTATION_CHAIN_MISSING', `Missing DAC attestation chain for device ${deviceId}.`, 'warning'));
            if (!isAuxRecord && !verificationSkipsDeviceSignature && attestationSignature.length === 0) {
              issues.push(issue('ATTESTATION_FAILED', `Device ${deviceId} failed DAC attestation: attestationSig missing`, 'critical'));
            }
          } else if ((!isAuxRecord && !verificationSkipsDeviceSignature) || attestationSignature.length > 0) {
            const result = await verifyDeviceAttestation({
              id: deviceId,
              key: publicKey,
              attestationSig: attestationSignature,
              ctr: counter,
              vendor: vendor,
              recordId: attestationRecordId,
              certificateChain: attestationChain,
              trustProfile
            }, revocationManager);
            if (!result.ok) {
              issues.push(issue('ATTESTATION_FAILED', `Device ${deviceId} failed DAC attestation: ${result.reason ?? 'unknown error'}`, 'critical'));
            }
          }

          // Heartbeat (SLAC) Verification
          let heartbeatChain = [
            pemFromDerBase64(block.heartbeat_slac_der),
            pemFromDerBase64(block.heartbeat_der),
            pemFromDerBase64(block.heartbeat_intermediate_der)
          ]
            .filter((value): value is string => Boolean(value))
            .join('');

          if (identity) {
            const recordLevelSlac = pemFromDerBase64(asString(identity.slac_der));
            if (recordLevelSlac) {
              heartbeatChain = [
                recordLevelSlac,
                pemFromDerBase64(asString(identity.heartbeat_der)),
                pemFromDerBase64(asString(identity.heartbeat_intermediate_der))
              ]
                .filter((value): value is string => Boolean(value))
                .join('');
            }
          }

          const heartbeatSignature = asString(identity?.heartbeat_signature) ?? '';
          const lastSyncUtc = asNumber(identity?.last_sync_utc) ?? 0;

          if (heartbeatChain.length === 0) {
            if (heartbeatSignature.length > 0) {
              issues.push(issue('HEARTBEAT_CHAIN_MISSING', `Missing SLAC heartbeat chain for device ${deviceId}.`, 'warning'));
            }
          } else if (heartbeatSignature.length > 0) {
            const result = await verifyHeartbeatAttestation({
              id: deviceId,
              heartbeatSig: heartbeatSignature,
              lastSyncUtc,
              ctr: counter,
              recordId: attestationRecordId,
              certificateChain: heartbeatChain,
              trustProfile
            }, revocationManager);
            if (!result.ok) {
              issues.push(issue('HEARTBEAT_VERIFICATION_FAILED', `Device ${deviceId} failed SLAC heartbeat verification: ${result.reason ?? 'unknown error'}`, 'critical'));
            }
          } else if (!isAuxRecord && !verificationSkipsDeviceSignature) {
            issues.push(issue('HEARTBEAT_VERIFICATION_FAILED', `Device ${deviceId} failed SLAC heartbeat verification: heartbeatSig missing`, 'critical'));
          }
        }

        const recomputedCanonical = recomputeRecordCanonicalString(record, recordType, deviceId, publicKey);
        if (recomputedCanonical === null && canonicalStringValue.length > 0) {
          issues.push(issue('RECORD_SCHEMA_UNRECOGNIZED', `Record type ${recordType} on device ${deviceId} has an unrecognized type or scan profile; its canonical string cannot be independently verified.`, 'critical'));
        } else if (recomputedCanonical !== null && canonicalStringValue.length > 0 && recomputedCanonical !== canonicalStringValue) {
          issues.push(
            issue(
              'RECORD_CANONICAL_MISMATCH',
              `Record type ${recordType} on device ${deviceId} has a canonical_string that does not match the value independently recomputed from its own fields.`,
              'critical'
            )
          );
        }
        const canonicalForSignature = recomputedCanonical ?? canonicalStringValue;

        if (verificationSkipsDeviceSignature) {
          // No collector_attestation and no top-level signature: this
          // `verification` record is not required to be device-signed at all.
        } else if (canonicalForSignature.length === 0) {
          issues.push(issue('RECORD_CANONICAL_MISSING', `Record type ${recordType} on device ${deviceId} does not include a canonical_string.`, isCompatAttachment ? 'warning' : 'critical'));
        } else if (signature.length === 0) {
          issues.push(issue('RECORD_SIGNATURE_MISSING', `Record type ${recordType} on device ${deviceId} is missing a signature.`, isCompatAttachment ? 'warning' : 'critical'));
        } else {
          const verified = await verifyRecordSignature(publicKey, signature, canonicalForSignature);
          if (!verified) {
            issues.push(issue('RECORD_SIGNATURE_INVALID', `Invalid signature for record type ${recordType} on device ${deviceId}.`, 'critical'));
          }
        }

        if (!isNonChainAdvancing && signature.length > 0) {
          lastSignatures.set(deviceId, signature);
        }
        if (!isNonChainAdvancing && counter !== undefined) {
          lastCounters.set(deviceId, counter);
        }
        if (!isNonChainAdvancing && timestamp !== undefined) {
          lastTimes.set(deviceId, timestamp);
        }

        if (isAuxRecord || isVerificationRecord) {
          const parentRecordId = asString(record.parent_id) ?? asString(record.parent_record_id);
          if (parentRecordId && !recordIds.has(parentRecordId)) {
            issues.push(issue('PARENT_RECORD_MISSING', `Record type ${recordType} references missing parent ${parentRecordId}.`, 'critical'));
          }
        }

        if (recordType === 'attachment') {
          const checksum = asString(record.checksum) ?? '';
          if (checksum.length > 0) {
            const content = this.attachments.get(checksum);
            if (!content) {
              issues.push(issue('ATTACHMENT_MISSING', `Attachment with hash ${checksum} is missing from archive.`, 'critical'));
            } else {
              const actualHash = await sha256Hex(content);
              if (actualHash !== checksum) {
                issues.push(issue('ATTACHMENT_CORRUPT', `Attachment with hash ${checksum} is corrupt (actual hash ${actualHash}).`, 'critical'));
              }
            }
          }
        }

        const externalIdentity = asJsonObject(record.external_identity);
        if (externalIdentity && !isAuxRecord && !isVerificationRecord) {
          issues.push(issue(
            'EXTERNAL_IDENTITY_UNSUPPORTED_RECORD_TYPE',
            `Record type ${recordType} must not carry external_identity.`,
            'critical'
          ));
        }

        if (isAuxRecord) {
          const expectedPayload = expectedExternalIdentityPayload(record, recordType);
          const endorserId = asString(externalIdentity?.endorser_id);
          const rootFingerprint = asString(externalIdentity?.root_fingerprint);
          const signature = asString(externalIdentity?.signature);
          const certChainDer = asJsonArray(externalIdentity?.cert_chain_der)
            ?.map((value) => asString(value))
            .filter((value): value is string => Boolean(value));

          if (externalIdentity && expectedPayload && endorserId && rootFingerprint && signature && certChainDer?.length) {
            const result = await verifyExternalIdentity({
              endorserId,
              rootFingerprint,
              certChainDer,
              signature,
              expectedPayload,
              trustedFingerprints: options.trustedExternalFingerprints ?? []
            });
            if (!result.ok) {
              issues.push(issue(
                'EXTERNAL_IDENTITY_VERIFICATION_FAILED',
                `External identity verification failed: ${result.reason ?? 'unknown error'}`,
                'critical'
              ));
            }
          }
        }

        if (isVerificationRecord) {
          const { issues: verificationIssues } = await evaluateVerificationRecord(
            record,
            this.attachments,
            deviceId,
            publicKey,
            options.trustedExternalFingerprints ?? []
          );
          issues.push(...verificationIssues);
        }
      }
    }

    if (expectedPolicy) {
      const actualPolicy = manifestPolicy(this.manifest);
      if (!actualPolicy) {
        issues.push(issue('POLICY_MISSING', `Archive does not declare the expected continuity policy '${expectedPolicy.name}'.`, 'warning'));
      } else {
        if (expectedPolicy.name.trim().length > 0
          && actualPolicy.name.trim().length > 0
          && actualPolicy.name !== expectedPolicy.name) {
          issues.push(issue('POLICY_NAME_MISMATCH', `Archive policy name '${actualPolicy.name}' does not match expected policy '${expectedPolicy.name}'.`, 'warning'));
        }
        if (actualPolicy.native_continuity_gap_seconds !== expectedPolicy.native_continuity_gap_seconds) {
          issues.push(issue(
            'POLICY_THRESHOLD_MISMATCH',
            `Archive continuity threshold ${String(actualPolicy.native_continuity_gap_seconds)} does not match expected threshold ${String(expectedPolicy.native_continuity_gap_seconds)}.`,
            'warning'
          ));
        }
      }

      if (expectedPolicy.native_continuity_gap_seconds !== undefined) {
        for (let blockIndex = 0; blockIndex < this.blocks.length; blockIndex += 1) {
          const block = this.blocks[blockIndex];
          let lastNativeTimestampUtc: number | undefined;
          for (let recordIndex = 0; recordIndex < block.batch.length; recordIndex += 1) {
            const record = block.batch[recordIndex];
            const recordType = asString(record.type) ?? 'unknown';
            if (isNonChainAdvancingRecordType(recordType)) {
              continue;
            }

            const timestampUtc = recordTimestampUtc(record);
            if (timestampUtc === undefined) {
              continue;
            }

            if (lastNativeTimestampUtc !== undefined
              && timestampUtc > lastNativeTimestampUtc
              && (timestampUtc - lastNativeTimestampUtc) > expectedPolicy.native_continuity_gap_seconds) {
              issues.push(issue(
                'POLICY_NATIVE_TIME_GAP_UNSPLIT',
                `Native time gap of ${timestampUtc - lastNativeTimestampUtc} seconds exceeds expected policy threshold ${expectedPolicy.native_continuity_gap_seconds} within block ${blockIndex}.`,
                'warning'
              ));
            }
            lastNativeTimestampUtc = timestampUtc;
          }
        }
      }
    }

    return issues;
    }

  static async selfTest(): Promise<SelfTestResult[]> {
    const results: SelfTestResult[] = [];

    // 1. Ed25519 (Sign and Verify)
    try {
      const pair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
      const msg = new TextEncoder().encode('abc');
      let signPassed = false;
      let sig: ArrayBuffer | undefined;
      try {
        sig = await crypto.subtle.sign('Ed25519', (pair as any).privateKey, msg);
        signPassed = true;
      } catch (e) {}
      results.push({ alg: 'Ed25519', operation: 'SIGN', passed: signPassed, id: 'LUKUID-KAT-ED25519-SIGN-01' });
      
      let verifyPassed = false;
      let rejectPassed = false;
      if (sig) {
        try {
            verifyPassed = await crypto.subtle.verify('Ed25519', (pair as any).publicKey, sig, msg);
            
            const badMsg = new TextEncoder().encode('abd');
            const rejected = await crypto.subtle.verify('Ed25519', (pair as any).publicKey, sig, badMsg);
            rejectPassed = !rejected;
        } catch (e) {}
      }
      results.push({ alg: 'Ed25519', operation: 'VERIFY', passed: verifyPassed, id: 'LUKUID-KAT-ED25519-VERIFY-01' });
      results.push({ alg: 'Ed25519', operation: 'REJECT', passed: rejectPassed, id: 'LUKUID-KAT-ED25519-REJECT-01' });
    } catch (e) {
      results.push({ alg: 'Ed25519', operation: 'SIGN', passed: false, id: 'LUKUID-KAT-ED25519-SIGN-01' });
      results.push({ alg: 'Ed25519', operation: 'VERIFY', passed: false, id: 'LUKUID-KAT-ED25519-VERIFY-01' });
      results.push({ alg: 'Ed25519', operation: 'REJECT', passed: false, id: 'LUKUID-KAT-ED25519-REJECT-01' });
    }

    // 2. P-256 (Sign, Verify, Reject)
    try {
      const pair = await crypto.subtle.generateKey(
        { name: 'ECDSA', namedCurve: 'P-256' },
        true,
        ['sign', 'verify']
      );
      const msg = new TextEncoder().encode('abc');
      const badMsg = new TextEncoder().encode('abd');
      
      let signPassed = false;
      let sig: ArrayBuffer | undefined;
      try {
        sig = await crypto.subtle.sign(
          { name: 'ECDSA', hash: { name: 'SHA-256' } },
          pair.privateKey,
          msg
        );
        signPassed = true;
      } catch (e) {}
      results.push({ alg: 'P256', operation: 'SIGN', passed: signPassed, id: 'NIST-KAT-P256-SIGN-01' });

      let verifyPassed = false;
      let rejectPassed = false;
      if (sig) {
        try {
          verifyPassed = await crypto.subtle.verify(
            { name: 'ECDSA', hash: { name: 'SHA-256' } },
            pair.publicKey,
            sig,
            msg
          );
          
          const rejected = await crypto.subtle.verify(
            { name: 'ECDSA', hash: { name: 'SHA-256' } },
            pair.publicKey,
            sig,
            badMsg
          );
          rejectPassed = !rejected;
        } catch (e) {}
      }
      results.push({ alg: 'P256', operation: 'VERIFY', passed: verifyPassed, id: 'NIST-KAT-P256-VERIFY-01' });
      results.push({ alg: 'P256', operation: 'REJECT', passed: rejectPassed, id: 'NIST-KAT-P256-REJECT-01' });
    } catch (e) {
      results.push({ alg: 'P256', operation: 'SIGN', passed: false, id: 'NIST-KAT-P256-SIGN-01' });
      results.push({ alg: 'P256', operation: 'VERIFY', passed: false, id: 'NIST-KAT-P256-VERIFY-01' });
      results.push({ alg: 'P256', operation: 'REJECT', passed: false, id: 'NIST-KAT-P256-REJECT-01' });
    }

    // 3. SHA-256 (FIPS 180-4 "abc")
    try {
      const msg = new TextEncoder().encode('abc');
      const hash = await crypto.subtle.digest('SHA-256', msg);
      const hex_str = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
      const passed = hex_str === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
      results.push({ alg: 'SHA-256', operation: 'HASH', passed, id: 'NIST-KAT-SHA256-01' });
    } catch {
      results.push({ alg: 'SHA-256', operation: 'HASH', passed: false, id: 'NIST-KAT-SHA256-01' });
    }

    // 4. ML-DSA-65 (Sign, Verify, Reject)
    try {
      const pair = ml_dsa65.keygen();
      const msg = new TextEncoder().encode('abc');
      const badMsg = new TextEncoder().encode('abd');
      
      let signPassed = false;
      let sig: Uint8Array | undefined;
      try {
        sig = ml_dsa65.sign(msg, pair.secretKey);
        signPassed = true;
      } catch (e) {}
      results.push({ alg: 'ML-DSA-65', operation: 'SIGN', passed: signPassed, id: 'NIST-KAT-MLDSA-SIGN-01' });

      let verifyPassed = false;
      let rejectPassed = false;
      if (sig) {
        try {
          verifyPassed = ml_dsa65.verify(sig, msg, pair.publicKey);
          rejectPassed = !ml_dsa65.verify(sig, badMsg, pair.publicKey);
        } catch (e) {}
      }
      results.push({ alg: 'ML-DSA-65', operation: 'VERIFY', passed: verifyPassed, id: 'NIST-KAT-MLDSA-VERIFY-01' });
      results.push({ alg: 'ML-DSA-65', operation: 'REJECT', passed: rejectPassed, id: 'NIST-KAT-MLDSA-REJECT-01' });
    } catch (e) {
      results.push({ alg: 'ML-DSA-65', operation: 'SIGN', passed: false, id: 'NIST-KAT-MLDSA-SIGN-01' });
      results.push({ alg: 'ML-DSA-65', operation: 'VERIFY', passed: false, id: 'NIST-KAT-MLDSA-VERIFY-01' });
      results.push({ alg: 'ML-DSA-65', operation: 'REJECT', passed: false, id: 'NIST-KAT-MLDSA-REJECT-01' });
    }

    return results;
  }
    }
export interface LukuItemResult {
  type: string;
  verified: boolean;
  payload: JsonObject;
  errors?: string[];
  /** Populated only for `type === 'verification'` records. Exposes
   * `response.rawBytes`/`response.data`, the response-disclosure state, and
   * the assurance level — all distinct from, and never collapsed into, the
   * overall archive `verified` result above. */
  verification?: VerificationRecordResult;
}

export interface LukuParseResult {
  verified: boolean;
  items: LukuItemResult[];
  issues: VerificationIssue[];
}

export const verifyLukuFile = parseLukuFile;

export async function parseLukuFile(data: Uint8Array, options: LukuVerifyOptions = {}): Promise<LukuParseResult> {
  const luku = await LukuFile.openBytes(data);
  const issues = await luku.verify(options);
  const itemErrors = new Map<string, string[]>();

  for (const entry of issues) {
    const targetId = /device .*? at record type/.test(entry.message) ? null : null;
    void targetId;
  }

  const items: LukuItemResult[] = [];
  for (const block of luku.blocks) {
    for (const record of block.batch) {
      const recordId = debugRecordId(record);
      const recordType = asString(record.type) ?? 'unknown';
      let verificationResult: VerificationRecordResult | undefined;
      if (recordType === 'verification') {
        const deviceId = asString(record.device_id) ?? block.device.device_id;
        const publicKey = asString(record.public_key) ?? block.device.public_key;
        const evaluated = await evaluateVerificationRecord(
          record,
          luku.attachments,
          deviceId,
          publicKey,
          options.trustedExternalFingerprints ?? []
        );
        verificationResult = evaluated.result;
      }
      items.push({
        type: recordType,
        verified: !hasCriticalIssues(issues),
        payload: record,
        errors: itemErrors.get(recordId),
        verification: verificationResult
      });
    }
  }
return {
  verified: !hasCriticalIssues(issues),
  items,
  issues
};
}
