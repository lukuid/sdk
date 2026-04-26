// SPDX-License-Identifier: Apache-2.0
import { strFromU8, strToU8, unzipSync, zipSync, type Zippable } from 'fflate';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';
import { verifyDeviceAttestation, verifyExternalIdentity } from './attestation.js';
import type { SelfTestResult } from './types.js';

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

async function batchHashAsync(batch: JsonObject[]): Promise<string> {
  const joined = batch
    .map((record) => asString(record.signature) ?? '')
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
  for (const key of ['scan_id', 'event_id', 'custody_id', 'attachment_id', 'location_id', 'parent_record_id', 'id']) {
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

function recordTimestampUtc(record: JsonObject): number | undefined {
  return asNumber(asJsonObject(record.payload)?.timestamp_utc)
    ?? asNumber(record.timestamp_utc)
    ?? asNumber(record.timestamp);
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
    case 'location':
      return `${asNumber(record.lat) ?? 0}:${asNumber(record.lng) ?? 0}:${endorserId}`;
    case 'custody': {
      const payload = asJsonObject(record.payload);
      return `${asString(payload?.event) ?? ''}:${asString(payload?.status) ?? ''}:${asString(payload?.context_ref) ?? ''}:${endorserId}`;
    }
    default:
      return null;
  }
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
  readonly blocks: LukuBlock[];
  readonly attachments: Map<string, Uint8Array>;
  private manifestRaw: string;
  private blocksRaw: string;
  private readonly sourceBytes?: Uint8Array;

  constructor(args: {
    manifest: LukuManifest;
    manifestSig: string;
    blocks: LukuBlock[];
    attachments?: Map<string, Uint8Array>;
    manifestRaw?: string;
    blocksRaw?: string;
    sourceBytes?: Uint8Array;
  }) {
    this.manifest = args.manifest;
    this.manifestSig = args.manifestSig;
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

    const recordType = asString(envelope.type) ?? 'unknown';
    const isAuxRecord = isAuxRecordType(recordType);
    const payload = asJsonObject(envelope.payload) ?? {};
    
    const device = asJsonObject(envelope.device);
    const deviceId = asString(envelope.device_id) ?? asString(device?.device_id);
    const publicKey = asString(envelope.public_key) ?? asString(device?.public_key);
    const signature = asString(envelope.signature) ?? '';
    const canonicalStringValue = asString(envelope.canonical_string) ?? '';
    const timestamp = recordTimestampUtc(envelope);
    const counter = asNumber(payload.ctr);
    const genesisHash = asString(payload.genesis_hash) ?? '';
    const previousSignature = asString(envelope.previous_signature) ?? '';

    if (!deviceId || !publicKey) {
      issues.push(issue('DEVICE_IDENTITY_MISSING', 'Envelope is missing device_id or public_key.', 'critical'));
    }

    if (!isAuxRecord && counter === 0 && genesisHash.length > 0 && previousSignature.length > 0 && previousSignature !== genesisHash) {
      issues.push(issue('GENESIS_HASH_MISMATCH', `Genesis record (ctr=0) for device ${deviceId ?? 'unknown'} has previous_signature that does not match genesis_hash.`, 'critical'));
    }

    if (!allowUntrustedRoots) {
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

      const attestationSignature = asString(envelope.attestation_signature) ?? asString(identity?.signature) ?? '';

      if (attestationChain.length === 0) {
        issues.push(issue('ATTESTATION_CHAIN_MISSING', `Missing DAC attestation chain for device ${deviceId ?? 'unknown'}.`, 'warning'));
      } else if (!isAuxRecord || attestationSignature.length > 0) {
        const result = await verifyDeviceAttestation({
          id: deviceId ?? 'unknown',
          key: publicKey ?? '',
          attestationSig: attestationSignature,
          certificateChain: attestationChain,
          created: skipCertificateTemporalChecks ? undefined : timestamp,
          trustProfile
        });
        if (!result.ok) {
          issues.push(issue('ATTESTATION_FAILED', `Device ${deviceId ?? 'unknown'} failed DAC attestation: ${result.reason ?? 'unknown error'}`, 'critical'));
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
          const slacSignature = asString(envelope.heartbeat_signature) ?? asString(identity?.heartbeat_signature) ?? attestationSignature;
          const slacResult = await verifyDeviceAttestation({
            id: deviceId ?? 'unknown',
            key: publicKey ?? '',
            attestationSig: slacSignature,
            certificateChain: slacChain,
            created: skipCertificateTemporalChecks ? undefined : timestamp,
            trustProfile
          });
          if (!slacResult.ok) {
            issues.push(issue('ATTESTATION_FAILED', `Device ${deviceId ?? 'unknown'} failed SLAC (heartbeat) attestation: ${slacResult.reason ?? 'unknown error'}`, 'critical'));
          }
        }
      }
    }

    if (canonicalStringValue.length === 0) {
      issues.push(issue('RECORD_CANONICAL_MISSING', `Record type ${recordType} does not include a canonical_string.`, 'critical'));
    } else if (signature.length === 0) {
      issues.push(issue('RECORD_SIGNATURE_MISSING', `Record type ${recordType} is missing a signature.`, 'critical'));
    } else if (publicKey) {
      const verified = await verifyRecordSignature(publicKey, signature, canonicalStringValue);
      if (!verified) {
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
      manifestRaw: manifestBytes ? strFromU8(manifestBytes) : undefined,
      blocksRaw: blocksBytes ? strFromU8(blocksBytes) : undefined,
      manifestSig: entries['manifest.sig'] ? strFromU8(entries['manifest.sig']) : '',
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
      const isAuxRecord = isAuxRecordType(recordType);
      const timestampUtc = recordTimestampUtc(record);
      const previousSignature = asString(record.previous_signature);
      const signature = asString(record.signature);

      let shouldSplit = false;
      if (!isAuxRecord) {
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

      if (!isAuxRecord) {
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
    return new LukuFile({
      manifest,
      manifestSig,
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
          public_key: asString(recordLevelDevice.public_key) ?? defaultDevice.public_key
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
  }

  async saveToBytes(): Promise<Uint8Array> {
    const blocksRaw = `${this.blocks.map((block) => JSON.stringify(block)).join('\n')}\n`;
    const files: Zippable = {
      mimetype: [strToU8(LUKU_MIMETYPE), { level: 0 as const }],
      'blocks.jsonl': [strToU8(blocksRaw), { level: 6 as const }],
      'manifest.json': [strToU8(this.manifestRaw), { level: 6 as const }],
      'manifest.sig': [strToU8(this.manifestSig), { level: 6 as const }]
    };

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
    const expectedPolicy = options.policy;
    const issues: VerificationIssue[] = [];

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
        for (const key of ['scan_id', 'event_id', 'attachment_id', 'custody_id', 'location_id']) {
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
        const isAuxRecord = recordType === 'attachment' || recordType === 'location' || recordType === 'custody';
        const isCompatAttachment = asBoolean(record._compat_nested_attachment) ?? false;
        const payload = asJsonObject(record.payload);
        const deviceId = asString(record.device_id) ?? block.device.device_id;
        const publicKey = asString(record.public_key) ?? block.device.public_key;
        const signature = asString(record.signature) ?? '';
        const previousSignature = asString(record.previous_signature) ?? '';
        const canonicalStringValue = asString(record.canonical_string) ?? '';
        const timestamp = asNumber(payload?.timestamp_utc) ?? asNumber(record.timestamp_utc);
        const counter = asNumber(payload?.ctr);
        const genesisHash = asString(payload?.genesis_hash) ?? '';

        if (!isAuxRecord && !seenDevices.has(deviceId)) {
          seenDevices.add(deviceId);
          if (counter === 0 && genesisHash.length > 0 && previousSignature !== genesisHash) {
            issues.push(issue('GENESIS_HASH_MISMATCH', `Genesis record (ctr=0) for device ${deviceId} has previous_signature that does not match genesis_hash.`, 'critical'));
          }
        }

        if (!isAuxRecord) {
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
          const attestationSignature = asString(identity?.signature) ?? '';

          if (attestationChain.length === 0) {
            issues.push(issue('ATTESTATION_CHAIN_MISSING', `Missing DAC attestation chain for device ${deviceId}.`, 'warning'));
          } else if (!isAuxRecord || attestationSignature.length > 0) {
            const result = await verifyDeviceAttestation({
              id: deviceId,
              key: publicKey,
              attestationSig: attestationSignature,
              certificateChain: attestationChain,
              created: skipCertificateTemporalChecks ? undefined : timestamp,
              trustProfile
            });
            if (!result.ok) {
              issues.push(issue('ATTESTATION_FAILED', `Device ${deviceId} failed DAC attestation: ${result.reason ?? 'unknown error'}`, 'critical'));
            }
          }
        }

        if (canonicalStringValue.length === 0) {
          issues.push(issue('RECORD_CANONICAL_MISSING', `Record type ${recordType} on device ${deviceId} does not include a canonical_string.`, isCompatAttachment ? 'warning' : 'critical'));
        } else if (signature.length === 0) {
          issues.push(issue('RECORD_SIGNATURE_MISSING', `Record type ${recordType} on device ${deviceId} is missing a signature.`, isCompatAttachment ? 'warning' : 'critical'));
        } else {
          const verified = await verifyRecordSignature(publicKey, signature, canonicalStringValue);
          if (!verified) {
            issues.push(issue('RECORD_SIGNATURE_INVALID', `Invalid signature for record type ${recordType} on device ${deviceId}.`, 'critical'));
          }
        }

        if (!isAuxRecord && signature.length > 0) {
          lastSignatures.set(deviceId, signature);
        }
        if (!isAuxRecord && counter !== undefined) {
          lastCounters.set(deviceId, counter);
        }
        if (!isAuxRecord && timestamp !== undefined) {
          lastTimes.set(deviceId, timestamp);
        }

        if (isAuxRecord) {
          const parentRecordId = asString(record.parent_record_id);
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
        if (externalIdentity && !isAuxRecord) {
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
            if (isAuxRecordType(recordType)) {
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
}

export interface LukuParseResult {
  verified: boolean;
  items: LukuItemResult[];
  issues: VerificationIssue[];
}

export const verifyLukuFile = parseLukuFile;

export async function parseLukuFile(data: Uint8Array): Promise<LukuParseResult> {
  const luku = await LukuFile.openBytes(data);
  const issues = await luku.verify();
  const itemErrors = new Map<string, string[]>();

  for (const entry of issues) {
    const targetId = /device .*? at record type/.test(entry.message) ? null : null;
    void targetId;
  }

  const items: LukuItemResult[] = [];
  for (const block of luku.blocks) {
    for (const record of block.batch) {
      const recordId = debugRecordId(record);
      items.push({
        type: asString(record.type) ?? 'unknown',
        verified: !hasCriticalIssues(issues),
        payload: record,
        errors: itemErrors.get(recordId)
      });
    }
  }
return {
  verified: !hasCriticalIssues(issues),
  items,
  issues
};
}
