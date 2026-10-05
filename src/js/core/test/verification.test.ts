// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { webcrypto } from 'node:crypto';
import {
  LukuFile,
  buildVerificationRecord,
  verificationCollectorAttestationPayload,
  parseLukuFile,
  type JsonObject,
  type LukuDeviceIdentity,
  type VerificationRecordResult
} from '../src/index.js';

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as Crypto;
}

interface TestSigner {
  signer: { privateKey: CryptoKey; publicKey: CryptoKey };
  publicKeyBase64: string;
}

async function createTestSigner(): Promise<TestSigner> {
  const pair = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])) as CryptoKeyPair;
  const exported = await crypto.subtle.exportKey('raw', pair.publicKey);
  return {
    signer: { privateKey: pair.privateKey, publicKey: pair.publicKey },
    publicKeyBase64: Buffer.from(new Uint8Array(exported)).toString('base64')
  };
}

async function signCanonical(privateKey: CryptoKey, canonical: string): Promise<string> {
  const signature = await crypto.subtle.sign('Ed25519', privateKey, new TextEncoder().encode(canonical));
  return Buffer.from(new Uint8Array(signature)).toString('base64');
}

function testOptions() {
  return {
    allowUntrustedRoots: true,
    skipCertificateTemporalChecks: true,
    trustedExternalFingerprints: [] as string[],
    trustProfile: 'dev'
  };
}

function hasIssue(issues: Array<{ code: string }>, ...codes: string[]): boolean {
  return issues.some((entry) => codes.includes(entry.code));
}

function criticalIssues(issues: Array<{ criticality: string }>): Array<{ criticality: string }> {
  return issues.filter((entry) => entry.criticality === 'critical');
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Buffer.from(new Uint8Array(digest)).toString('hex');
}

// --- shared parent `scan` (animal profile) record builder, mirroring the
// canonical-string convention already used by luku.test.ts ---
async function makeAnimalScanRecord(
  signer: TestSigner,
  deviceId: string,
  id: string,
  tagId: string
): Promise<{ record: JsonObject; signature: string }> {
  const canonical = `${deviceId}:${signer.publicKeyBase64}:scan:${id}:1:1000::animal:::FDX-B:v1.0:${tagId}:38.50::genesis_fake`;
  const signature = await signCanonical(signer.signer.privateKey, canonical);
  return {
    record: {
      type: 'scan',
      id,
      device_id: deviceId,
      public_key: signer.publicKeyBase64,
      signature,
      previous_signature: 'genesis_fake',
      canonical_string: canonical,
      payload: {
        ctr: 1,
        timestamp_utc: 1000,
        genesis_hash: 'genesis_fake',
        profile: 'animal',
        protocol: 'FDX-B',
        scan_version: 'v1.0',
        tag_id: tagId,
        temperature_c: 38.5
      }
    },
    signature
  };
}

async function exportSingleBlockArchive(
  signer: TestSigner,
  deviceId: string,
  batch: JsonObject[],
  attachments: Record<string, Uint8Array>
): Promise<LukuFile> {
  const block = await LukuFile.buildBlockFromRecords(
    0,
    1003,
    null,
    { device_id: deviceId, public_key: signer.publicKeyBase64, vendor: 'LUKUID' },
    batch,
    undefined
  );
  const exported = await LukuFile.exportBlocksWithManifest(
    [block],
    attachments,
    'verification record test export',
    {},
    signer.signer
  );
  return LukuFile.openBytes(await exported.saveToBytes());
}

// --- minimal self-signed Ed25519 X.509 DER certificate builder, test-only ---
// (used only to exercise the external_identity cert-chain/root-fingerprint
// trust path; the SDK itself never needs to MINT certificates, only parse
// and trust-validate them, so this helper lives in the test file, not src/).
function derLength(length: number): Uint8Array {
  if (length < 0x80) {
    return Uint8Array.from([length]);
  }
  const bytes: number[] = [];
  let n = length;
  while (n > 0) {
    bytes.unshift(n & 0xff);
    n = Math.floor(n / 256);
  }
  return Uint8Array.from([0x80 | bytes.length, ...bytes]);
}
function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((sum, a) => sum + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}
function derTlv(tag: number, content: Uint8Array): Uint8Array {
  return concatBytes(Uint8Array.from([tag]), derLength(content.length), content);
}
function derInteger(value: number): Uint8Array {
  if (value === 0) {
    return derTlv(0x02, Uint8Array.from([0]));
  }
  const bytes: number[] = [];
  let n = value;
  while (n > 0) {
    bytes.unshift(n & 0xff);
    n = Math.floor(n / 256);
  }
  if (bytes[0] & 0x80) {
    bytes.unshift(0x00);
  }
  return derTlv(0x02, Uint8Array.from(bytes));
}
function derOid(oid: string): Uint8Array {
  const parts = oid.split('.').map(Number);
  const bytes: number[] = [parts[0] * 40 + parts[1]];
  for (let i = 2; i < parts.length; i += 1) {
    let v = parts[i];
    const chunk = [v & 0x7f];
    v = Math.floor(v / 128);
    while (v > 0) {
      chunk.unshift((v & 0x7f) | 0x80);
      v = Math.floor(v / 128);
    }
    bytes.push(...chunk);
  }
  return derTlv(0x06, Uint8Array.from(bytes));
}
function derUtf8String(value: string): Uint8Array {
  return derTlv(0x0c, new TextEncoder().encode(value));
}
function derSequence(...elements: Uint8Array[]): Uint8Array {
  return derTlv(0x30, concatBytes(...elements));
}
function derSet(...elements: Uint8Array[]): Uint8Array {
  return derTlv(0x31, concatBytes(...elements));
}
function derBitString(bytes: Uint8Array): Uint8Array {
  return derTlv(0x03, concatBytes(Uint8Array.from([0]), bytes));
}
function derExplicit(tagNumber: number, content: Uint8Array): Uint8Array {
  return derTlv(0xa0 | tagNumber, content);
}
function derUtcTime(date: Date): Uint8Array {
  const pad = (n: number): string => String(n).padStart(2, '0');
  const text = `${pad(date.getUTCFullYear() % 100)}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
  return derTlv(0x17, new TextEncoder().encode(text));
}
function derName(commonName: string): Uint8Array {
  const attributeTypeAndValue = derSequence(derOid('2.5.4.3'), derUtf8String(commonName));
  return derSequence(derSet(attributeTypeAndValue));
}
const ED25519_ALGORITHM_IDENTIFIER = derSequence(derOid('1.3.101.112'));
const ED25519_SPKI_PREFIX = Uint8Array.from([0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00]);

async function buildSelfSignedEd25519Cert(commonName: string): Promise<{
  certDer: Uint8Array;
  privateKey: CryptoKey;
  publicKeyRaw: Uint8Array;
}> {
  const pair = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])) as CryptoKeyPair;
  const publicKeyRaw = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
  const spki = concatBytes(ED25519_SPKI_PREFIX, publicKeyRaw);

  const version = derExplicit(0, derInteger(2));
  const serial = derInteger(1);
  const issuer = derName(commonName);
  const validity = derSequence(derUtcTime(new Date(Date.UTC(2020, 0, 1))), derUtcTime(new Date(Date.UTC(2060, 0, 1))));
  const subject = issuer;
  const tbsCertificate = derSequence(version, serial, ED25519_ALGORITHM_IDENTIFIER, issuer, validity, subject, spki);
  const signature = new Uint8Array(await crypto.subtle.sign('Ed25519', pair.privateKey, tbsCertificate));
  const certDer = derSequence(tbsCertificate, ED25519_ALGORITHM_IDENTIFIER, derBitString(signature));

  return { certDer, privateKey: pair.privateKey, publicKeyRaw };
}

// --- minimal JWS compact serialization builder, test-only ---
function base64UrlEncode(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function buildSignedJws(alg: 'EdDSA' | 'ES256', payload: JsonObject): Promise<Uint8Array> {
  const pair =
    alg === 'EdDSA'
      ? ((await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])) as CryptoKeyPair)
      : ((await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])) as CryptoKeyPair);
  const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
  const header = { alg, typ: 'JWT', jwk };
  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signingInput = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature =
    alg === 'EdDSA'
      ? new Uint8Array(await crypto.subtle.sign('Ed25519', pair.privateKey, signingInput))
      : new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, pair.privateKey, signingInput));
  const sigB64 = base64UrlEncode(signature);
  return new TextEncoder().encode(`${headerB64}.${payloadB64}.${sigB64}`);
}

function findVerificationItemResult(items: Array<{ type: string; verification?: VerificationRecordResult }>): VerificationRecordResult {
  const item = items.find((entry) => entry.type === 'verification');
  assert.ok(item?.verification, 'expected a verification item result');
  return item.verification!;
}

describe('verification records', () => {
  it('builds and verifies a disclosed plain-JSON verification record (recorded assurance)', async () => {
    const signer = await createTestSigner();
    const deviceId = 'LUK-VER-1';
    const { record: scanRecord, signature: scanSig } = await makeAnimalScanRecord(signer, deviceId, 'SCAN-VER-1', '981098109810981');

    const responseBytes = new TextEncoder().encode(JSON.stringify({ registrationStatus: 'active', ownerConfirmed: true }));
    const { record: verRecord, attachment } = await buildVerificationRecord({
      id: 'VER-1',
      parentId: 'SCAN-VER-1',
      parentSignature: scanSig,
      scheme: 'eu.animal.traceability',
      provider: 'FI-NATIONAL-REGISTRY',
      checkedAtUtc: 1917400000,
      status: 'verified',
      resultCode: 'registered_owner_confirmed',
      response: { rawBytes: responseBytes, mime: 'application/json', format: 'json' }
    });

    assert.ok(attachment);
    const luku = await exportSingleBlockArchive(signer, deviceId, [scanRecord, verRecord], { [attachment!.checksum]: attachment!.bytes });

    const issues = await luku.verify(testOptions());
    assert.equal(criticalIssues(issues).length, 0, JSON.stringify(issues));

    const parsed = await parseLukuFile(await luku.saveToBytes());
    const result = findVerificationItemResult(parsed.items);
    assert.equal(result.response.disclosureState, 'disclosed');
    assert.equal(result.assuranceLevel, 'recorded');
    assert.ok(result.response.rawBytes);
    assert.deepEqual(result.response.data, { registrationStatus: 'active', ownerConfirmed: true });
  });

  it('preserves exact original response bytes (whitespace/key order) and round-trips unknown fields', async () => {
    const signer = await createTestSigner();
    const deviceId = 'LUK-VER-2';
    const { record: scanRecord } = await makeAnimalScanRecord(signer, deviceId, 'SCAN-VER-2', '981098109810982');

    const oddlyFormatted = '{\n  "futureField": { "x": 1 },\n  "ownerConfirmed":   true,\n  "z_unknown_field": [1,2,3]\n}';
    const responseBytes = new TextEncoder().encode(oddlyFormatted);
    const { record: verRecord, attachment } = await buildVerificationRecord({
      id: 'VER-2',
      scheme: 'eu.animal.traceability',
      provider: 'FI-NATIONAL-REGISTRY',
      checkedAtUtc: 1917400000,
      status: 'verified',
      response: { rawBytes: responseBytes, mime: 'application/json' }
    });

    const luku = await exportSingleBlockArchive(signer, deviceId, [scanRecord, verRecord], { [attachment!.checksum]: attachment!.bytes });
    const reopened = await LukuFile.openBytes(await luku.saveToBytes());

    const storedAttachment = reopened.attachments.get(attachment!.checksum);
    assert.ok(storedAttachment);
    assert.equal(Buffer.from(storedAttachment!).toString('utf8'), oddlyFormatted);

    const parsed = await parseLukuFile(await reopened.saveToBytes());
    const result = findVerificationItemResult(parsed.items);
    assert.equal(result.response.disclosureState, 'disclosed');
    assert.deepEqual(result.response.data, { futureField: { x: 1 }, ownerConfirmed: true, z_unknown_field: [1, 2, 3] });
  });

  it('preserves a binary (non-JSON) response; data stays null', async () => {
    const signer = await createTestSigner();
    const deviceId = 'LUK-VER-3';
    const { record: scanRecord } = await makeAnimalScanRecord(signer, deviceId, 'SCAN-VER-3', '981098109810983');

    const binaryBytes = Uint8Array.from([0x00, 0xff, 0x10, 0x20, 0xde, 0xad, 0xbe, 0xef]);
    const { record: verRecord, attachment } = await buildVerificationRecord({
      id: 'VER-3',
      scheme: 'customs.import',
      provider: 'CUSTOMS-AUTH',
      checkedAtUtc: 1917400000,
      status: 'verified',
      response: { rawBytes: binaryBytes, mime: 'application/octet-stream', format: 'opaque' }
    });

    const luku = await exportSingleBlockArchive(signer, deviceId, [scanRecord, verRecord], { [attachment!.checksum]: attachment!.bytes });
    const issues = await luku.verify(testOptions());
    assert.equal(criticalIssues(issues).length, 0, JSON.stringify(issues));

    const parsed = await parseLukuFile(await luku.saveToBytes());
    const result = findVerificationItemResult(parsed.items);
    assert.equal(result.response.disclosureState, 'disclosed');
    assert.deepEqual(result.response.rawBytes, binaryBytes);
    assert.equal(result.response.data, null);
  });

  it('detects response.checksum mismatch as disclosed_mismatch (hard failure, never "undisclosed")', async () => {
    const signer = await createTestSigner();
    const deviceId = 'LUK-VER-4';
    const { record: scanRecord } = await makeAnimalScanRecord(signer, deviceId, 'SCAN-VER-4', '981098109810984');

    const responseBytes = new TextEncoder().encode('{"status":"ok"}');
    const { record: verRecord, attachment } = await buildVerificationRecord({
      id: 'VER-4',
      scheme: 'eu.animal.traceability',
      provider: 'FI-NATIONAL-REGISTRY',
      checkedAtUtc: 1917400000,
      status: 'verified',
      response: { rawBytes: responseBytes, mime: 'application/json' }
    });

    const luku = await exportSingleBlockArchive(signer, deviceId, [scanRecord, verRecord], {
      [attachment!.checksum]: new TextEncoder().encode('{"status":"tampered"}')
    });

    const issues = await luku.verify(testOptions());
    assert.ok(hasIssue(issues, 'RECORD_VERIFICATION_RESPONSE_DISCLOSED_MISMATCH'));

    const parsed = await parseLukuFile(await luku.saveToBytes());
    const result = findVerificationItemResult(parsed.items);
    assert.equal(result.response.disclosureState, 'disclosed_mismatch');
  });

  it('detects truncated response bytes (checksum mismatch)', async () => {
    const signer = await createTestSigner();
    const deviceId = 'LUK-VER-5';
    const { record: scanRecord } = await makeAnimalScanRecord(signer, deviceId, 'SCAN-VER-5', '981098109810985');

    const responseBytes = new TextEncoder().encode('{"status":"ok","extra":"padding-data-here"}');
    const { record: verRecord, attachment } = await buildVerificationRecord({
      id: 'VER-5',
      scheme: 'eu.animal.traceability',
      provider: 'FI-NATIONAL-REGISTRY',
      checkedAtUtc: 1917400000,
      status: 'verified',
      response: { rawBytes: responseBytes, mime: 'application/json' }
    });

    const truncated = responseBytes.slice(0, 10);
    const luku = await exportSingleBlockArchive(signer, deviceId, [scanRecord, verRecord], { [attachment!.checksum]: truncated });

    const issues = await luku.verify(testOptions());
    assert.ok(hasIssue(issues, 'RECORD_VERIFICATION_RESPONSE_DISCLOSED_MISMATCH'));
  });

  it('detects wrong response.size_bytes even when checksum matches', async () => {
    const signer = await createTestSigner();
    const deviceId = 'LUK-VER-6';
    const { record: scanRecord } = await makeAnimalScanRecord(signer, deviceId, 'SCAN-VER-6', '981098109810986');

    const responseBytes = new TextEncoder().encode('{"status":"ok"}');
    const { record: verRecord, attachment } = await buildVerificationRecord({
      id: 'VER-6',
      scheme: 'eu.animal.traceability',
      provider: 'FI-NATIONAL-REGISTRY',
      checkedAtUtc: 1917400000,
      status: 'verified',
      response: { rawBytes: responseBytes, mime: 'application/json' }
    });
    (verRecord.response as JsonObject).size_bytes = 999;

    const luku = await exportSingleBlockArchive(signer, deviceId, [scanRecord, verRecord], { [attachment!.checksum]: attachment!.bytes });
    const issues = await luku.verify(testOptions());
    assert.ok(hasIssue(issues, 'RECORD_VERIFICATION_RESPONSE_SIZE_MISMATCH'));
  });

  it('malformed JSON with otherwise-valid raw bytes still verifies; response.data is simply absent', async () => {
    const signer = await createTestSigner();
    const deviceId = 'LUK-VER-7';
    const { record: scanRecord } = await makeAnimalScanRecord(signer, deviceId, 'SCAN-VER-7', '981098109810987');

    const notQuiteJson = new TextEncoder().encode('{"status": "ok", oops}');
    const { record: verRecord, attachment } = await buildVerificationRecord({
      id: 'VER-7',
      scheme: 'eu.animal.traceability',
      provider: 'FI-NATIONAL-REGISTRY',
      checkedAtUtc: 1917400000,
      status: 'indeterminate',
      response: { rawBytes: notQuiteJson, mime: 'application/json' }
    });

    const luku = await exportSingleBlockArchive(signer, deviceId, [scanRecord, verRecord], { [attachment!.checksum]: attachment!.bytes });
    const issues = await luku.verify(testOptions());
    assert.equal(criticalIssues(issues).length, 0, JSON.stringify(issues));

    const parsed = await parseLukuFile(await luku.saveToBytes());
    const result = findVerificationItemResult(parsed.items);
    assert.equal(result.response.disclosureState, 'disclosed');
    assert.equal(result.response.data, null);
    assert.ok(result.response.rawBytes);
  });

  it('hash-only / redacted (undisclosed) response reaches recorded assurance; rawBytes/data absent, not an error', async () => {
    const signer = await createTestSigner();
    const deviceId = 'LUK-VER-8';
    const { record: scanRecord } = await makeAnimalScanRecord(signer, deviceId, 'SCAN-VER-8', '981098109810988');

    const privateResponseBytes = new TextEncoder().encode('{"owner":{"name":"Jane Doe","address":"123 Main St"}}');
    const { record: verRecord, attachment } = await buildVerificationRecord({
      id: 'VER-8',
      scheme: 'eu.animal.traceability',
      provider: 'FI-NATIONAL-REGISTRY',
      checkedAtUtc: 1917400000,
      status: 'verified',
      response: { rawBytes: privateResponseBytes, mime: 'application/json', disclose: false }
    });

    assert.equal(attachment, undefined);
    const luku = await exportSingleBlockArchive(signer, deviceId, [scanRecord, verRecord], {});
    const issues = await luku.verify(testOptions());
    assert.equal(criticalIssues(issues).length, 0, JSON.stringify(issues));

    const parsed = await parseLukuFile(await luku.saveToBytes());
    const result = findVerificationItemResult(parsed.items);
    assert.equal(result.response.disclosureState, 'undisclosed');
    assert.equal(result.assuranceLevel, 'recorded');
    assert.equal(result.response.rawBytes, null);
    assert.equal(result.response.data, null);
    assert.equal(result.response.checksum, await sha256Hex(privateResponseBytes));
  });

  it('rejects response.data present without a disclosed attachment as malformed', async () => {
    const signer = await createTestSigner();
    const deviceId = 'LUK-VER-9';
    const { record: scanRecord } = await makeAnimalScanRecord(signer, deviceId, 'SCAN-VER-9', '981098109810989');

    const responseBytes = new TextEncoder().encode('{"status":"ok"}');
    const checksum = await sha256Hex(responseBytes);
    const verRecord: JsonObject = {
      type: 'verification',
      id: 'VER-9',
      version: '1.0.0',
      scheme: 'eu.animal.traceability',
      provider: 'FI-NATIONAL-REGISTRY',
      checked_at_utc: 1917400000,
      status: 'verified',
      response: {
        mime: 'application/json',
        checksum,
        size_bytes: responseBytes.length,
        data: { status: 'ok' } // present without a disclosed attachment -> malformed
      }
    };

    const luku = await exportSingleBlockArchive(signer, deviceId, [scanRecord, verRecord], {});
    const issues = await luku.verify(testOptions());
    assert.ok(hasIssue(issues, 'RECORD_VERIFICATION_RESPONSE_DATA_WITHOUT_DISCLOSURE'));
  });

  it('reaches authority_verified for a valid self-describing JWS (EdDSA) response', async () => {
    const signer = await createTestSigner();
    const deviceId = 'LUK-VER-10';
    const { record: scanRecord } = await makeAnimalScanRecord(signer, deviceId, 'SCAN-VER-10', '981098109810990');

    const jwsBytes = await buildSignedJws('EdDSA', { sub: '981098109810990', status: 'verified' });
    const { record: verRecord, attachment } = await buildVerificationRecord({
      id: 'VER-10',
      scheme: 'eu.animal.traceability',
      provider: 'EU-WALLET-PROVIDER',
      checkedAtUtc: 1917400000,
      status: 'verified',
      response: { rawBytes: jwsBytes, mime: 'application/jwt', format: 'jws' }
    });

    const luku = await exportSingleBlockArchive(signer, deviceId, [scanRecord, verRecord], { [attachment!.checksum]: attachment!.bytes });
    const issues = await luku.verify(testOptions());
    assert.equal(criticalIssues(issues).length, 0, JSON.stringify(issues));

    const parsed = await parseLukuFile(await luku.saveToBytes());
    const result = findVerificationItemResult(parsed.items);
    assert.equal(result.nativeSignatureVerified, true);
    assert.equal(result.assuranceLevel, 'authority_verified');
  });

  it('reaches authority_verified for a valid self-describing JWS (ES256) response', async () => {
    const signer = await createTestSigner();
    const deviceId = 'LUK-VER-11';
    const { record: scanRecord } = await makeAnimalScanRecord(signer, deviceId, 'SCAN-VER-11', '981098109810991');

    const jwsBytes = await buildSignedJws('ES256', { sub: '981098109810991', status: 'verified' });
    const { record: verRecord, attachment } = await buildVerificationRecord({
      id: 'VER-11',
      scheme: 'eu.animal.traceability',
      provider: 'EU-WALLET-PROVIDER',
      checkedAtUtc: 1917400000,
      status: 'verified',
      response: { rawBytes: jwsBytes, mime: 'application/jwt', format: 'jwt' }
    });

    const luku = await exportSingleBlockArchive(signer, deviceId, [scanRecord, verRecord], { [attachment!.checksum]: attachment!.bytes });
    const issues = await luku.verify(testOptions());
    assert.equal(criticalIssues(issues).length, 0, JSON.stringify(issues));

    const parsed = await parseLukuFile(await luku.saveToBytes());
    const result = findVerificationItemResult(parsed.items);
    assert.equal(result.nativeSignatureVerified, true);
    assert.equal(result.assuranceLevel, 'authority_verified');
  });

  it('reports an invalid/tampered JWS signature as a failure, never silently verified', async () => {
    const signer = await createTestSigner();
    const deviceId = 'LUK-VER-12';
    const { record: scanRecord } = await makeAnimalScanRecord(signer, deviceId, 'SCAN-VER-12', '981098109810992');

    const jwsBytes = await buildSignedJws('EdDSA', { sub: '981098109810992', status: 'verified' });
    const text = new TextDecoder().decode(jwsBytes);
    const parts = text.split('.');
    // Tamper with the payload without re-signing.
    const tamperedPayload = Buffer.from(JSON.stringify({ sub: 'attacker-controlled', status: 'verified' }))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const tamperedJws = new TextEncoder().encode(`${parts[0]}.${tamperedPayload}.${parts[2]}`);

    const { record: verRecord, attachment } = await buildVerificationRecord({
      id: 'VER-12',
      scheme: 'eu.animal.traceability',
      provider: 'EU-WALLET-PROVIDER',
      checkedAtUtc: 1917400000,
      status: 'verified',
      response: { rawBytes: tamperedJws, mime: 'application/jwt', format: 'jws' }
    });

    const luku = await exportSingleBlockArchive(signer, deviceId, [scanRecord, verRecord], { [attachment!.checksum]: attachment!.bytes });
    const issues = await luku.verify(testOptions());
    assert.ok(hasIssue(issues, 'RECORD_VERIFICATION_NATIVE_SIGNATURE_INVALID'));

    const parsed = await parseLukuFile(await luku.saveToBytes());
    const result = findVerificationItemResult(parsed.items);
    assert.equal(result.nativeSignatureVerified, false);
    assert.notEqual(result.assuranceLevel, 'authority_verified');
    assert.notEqual(result.assuranceLevel, 'authority_verified_and_collector_attested');
  });

  it('reports an unsupported provider-native format as "unsupported" assurance, not a hard failure', async () => {
    const signer = await createTestSigner();
    const deviceId = 'LUK-VER-13';
    const { record: scanRecord } = await makeAnimalScanRecord(signer, deviceId, 'SCAN-VER-13', '981098109810993');

    const opaqueBytes = Uint8Array.from([0x30, 0x80, 0x02, 0x01, 0x00]); // pretend CMS/PKCS7 blob
    const { record: verRecord, attachment } = await buildVerificationRecord({
      id: 'VER-13',
      scheme: 'customs.import',
      provider: 'CUSTOMS-AUTH',
      checkedAtUtc: 1917400000,
      status: 'verified',
      response: { rawBytes: opaqueBytes, mime: 'application/pkcs7-signature', format: 'cms' }
    });

    const luku = await exportSingleBlockArchive(signer, deviceId, [scanRecord, verRecord], { [attachment!.checksum]: attachment!.bytes });
    const issues = await luku.verify(testOptions());
    assert.equal(criticalIssues(issues).length, 0, JSON.stringify(issues));
    assert.ok(hasIssue(issues, 'RECORD_VERIFICATION_PROVIDER_FORMAT_UNSUPPORTED'));

    const parsed = await parseLukuFile(await luku.saveToBytes());
    const result = findVerificationItemResult(parsed.items);
    assert.equal(result.assuranceLevel, 'unsupported');
  });

  it('external_identity detached-signature sub-case reaches authority_verified even in the undisclosed state', async () => {
    const signer = await createTestSigner();
    const deviceId = 'LUK-VER-14';
    const { record: scanRecord } = await makeAnimalScanRecord(signer, deviceId, 'SCAN-VER-14', '981098109810994');
    const providerCert = await buildSelfSignedEd25519Cert('registry.example');
    const certDerBase64 = Buffer.from(providerCert.certDer).toString('base64');
    const rootFingerprint = await sha256Hex(providerCert.certDer);

    const privateResponseBytes = new TextEncoder().encode('{"owner":{"name":"Jane Doe"}}');
    const { record: verRecord } = await buildVerificationRecord({
      id: 'VER-14',
      scheme: 'eu.animal.traceability',
      provider: 'FI-NATIONAL-REGISTRY',
      checkedAtUtc: 1917400000,
      status: 'verified',
      response: { rawBytes: privateResponseBytes, mime: 'application/json', disclose: false }
    });

    const checksum = (verRecord.response as JsonObject).checksum as string;
    const endorserId = 'FI-NATIONAL-REGISTRY-TRUST';
    const payload = `${checksum}:eu.animal.traceability:FI-NATIONAL-REGISTRY:1917400000:verified:${endorserId}`;
    const extSignature = await signCanonical(providerCert.privateKey, payload);
    verRecord.external_identity = {
      endorser_id: endorserId,
      root_fingerprint: rootFingerprint,
      cert_chain_der: [certDerBase64],
      signature: extSignature
    };

    const luku = await exportSingleBlockArchive(signer, deviceId, [scanRecord, verRecord], {});
    const issues = await luku.verify({ ...testOptions(), trustedExternalFingerprints: [rootFingerprint] });
    assert.equal(criticalIssues(issues).length, 0, JSON.stringify(issues));

    const parsed = await parseLukuFile(await luku.saveToBytes(), { trustedExternalFingerprints: [rootFingerprint] });
    const result = findVerificationItemResult(parsed.items);
    assert.equal(result.response.disclosureState, 'undisclosed');
    assert.equal(result.externalIdentityVerified, true);
    assert.equal(result.assuranceLevel, 'authority_verified');
  });

  it('rejects an external_identity whose root fingerprint is not trusted', async () => {
    const signer = await createTestSigner();
    const deviceId = 'LUK-VER-15';
    const { record: scanRecord } = await makeAnimalScanRecord(signer, deviceId, 'SCAN-VER-15', '981098109810995');
    const providerCert = await buildSelfSignedEd25519Cert('registry.example');
    const certDerBase64 = Buffer.from(providerCert.certDer).toString('base64');
    const rootFingerprint = await sha256Hex(providerCert.certDer);

    const responseBytes = new TextEncoder().encode('{"status":"ok"}');
    const { record: verRecord, attachment } = await buildVerificationRecord({
      id: 'VER-15',
      scheme: 'eu.animal.traceability',
      provider: 'FI-NATIONAL-REGISTRY',
      checkedAtUtc: 1917400000,
      status: 'verified',
      response: { rawBytes: responseBytes, mime: 'application/json' }
    });
    const checksum = (verRecord.response as JsonObject).checksum as string;
    const endorserId = 'FI-NATIONAL-REGISTRY-TRUST';
    const payload = `${checksum}:eu.animal.traceability:FI-NATIONAL-REGISTRY:1917400000:verified:${endorserId}`;
    const extSignature = await signCanonical(providerCert.privateKey, payload);
    verRecord.external_identity = {
      endorser_id: endorserId,
      root_fingerprint: rootFingerprint,
      cert_chain_der: [certDerBase64],
      signature: extSignature
    };

    const luku = await exportSingleBlockArchive(signer, deviceId, [scanRecord, verRecord], { [attachment!.checksum]: attachment!.bytes });
    const issues = await luku.verify({ ...testOptions(), trustedExternalFingerprints: [] });
    assert.ok(hasIssue(issues, 'EXTERNAL_IDENTITY_VERIFICATION_FAILED'));
  });

  it('valid collector_attestation reaches authority_verified_and_collector_attested alongside a verified JWS', async () => {
    const signer = await createTestSigner();
    const deviceId = 'LUK-VER-16';
    const { record: scanRecord } = await makeAnimalScanRecord(signer, deviceId, 'SCAN-VER-16', '981098109810996');

    const jwsBytes = await buildSignedJws('EdDSA', { sub: '981098109810996', status: 'verified' });
    const built = await buildVerificationRecord({
      id: 'VER-16',
      scheme: 'eu.animal.traceability',
      provider: 'EU-WALLET-PROVIDER',
      checkedAtUtc: 1917400000,
      status: 'verified',
      response: { rawBytes: jwsBytes, mime: 'application/jwt', format: 'jws' }
    });

    const payload = verificationCollectorAttestationPayload(built.record);
    const collectorSignature = await signCanonical(signer.signer.privateKey, payload);
    built.record.collector_attestation = {
      device_id: deviceId,
      alg: 'ED25519',
      signature: collectorSignature,
      attested_at_utc: 1917400001
    };
    built.record.alg = 'ED25519';
    built.record.signature = collectorSignature;

    const luku = await exportSingleBlockArchive(signer, deviceId, [scanRecord, built.record], {
      [built.attachment!.checksum]: built.attachment!.bytes
    });
    const issues = await luku.verify(testOptions());
    assert.equal(criticalIssues(issues).length, 0, JSON.stringify(issues));

    const parsed = await parseLukuFile(await luku.saveToBytes());
    const result = findVerificationItemResult(parsed.items);
    assert.equal(result.collectorAttestationVerified, true);
    assert.equal(result.assuranceLevel, 'authority_verified_and_collector_attested');
  });

  it('detects an invalid collector_attestation signature', async () => {
    const signer = await createTestSigner();
    const deviceId = 'LUK-VER-17';
    const { record: scanRecord } = await makeAnimalScanRecord(signer, deviceId, 'SCAN-VER-17', '981098109810997');

    const responseBytes = new TextEncoder().encode('{"status":"ok"}');
    const built = await buildVerificationRecord({
      id: 'VER-17',
      scheme: 'eu.animal.traceability',
      provider: 'FI-NATIONAL-REGISTRY',
      checkedAtUtc: 1917400000,
      status: 'verified',
      response: { rawBytes: responseBytes, mime: 'application/json' }
    });

    built.record.collector_attestation = {
      device_id: deviceId,
      alg: 'ED25519',
      signature: Buffer.from('not-a-real-signature').toString('base64'),
      attested_at_utc: 1917400001
    };
    built.record.alg = 'ED25519';
    built.record.signature = Buffer.from('not-a-real-signature').toString('base64');

    const luku = await exportSingleBlockArchive(signer, deviceId, [scanRecord, built.record], {
      [built.attachment!.checksum]: built.attachment!.bytes
    });
    const issues = await luku.verify(testOptions());
    assert.ok(hasIssue(issues, 'RECORD_SIGNATURE_INVALID', 'RECORD_VERIFICATION_COLLECTOR_ATTESTATION_INVALID'));
  });

  it('detects a collector_attestation device_id that does not match the block device', async () => {
    const signer = await createTestSigner();
    const deviceId = 'LUK-VER-18';
    const { record: scanRecord } = await makeAnimalScanRecord(signer, deviceId, 'SCAN-VER-18', '981098109810998');

    const responseBytes = new TextEncoder().encode('{"status":"ok"}');
    const built = await buildVerificationRecord({
      id: 'VER-18',
      scheme: 'eu.animal.traceability',
      provider: 'FI-NATIONAL-REGISTRY',
      checkedAtUtc: 1917400000,
      status: 'verified',
      response: { rawBytes: responseBytes, mime: 'application/json' }
    });

    const payload = verificationCollectorAttestationPayload(built.record);
    const collectorSignature = await signCanonical(signer.signer.privateKey, payload);
    built.record.collector_attestation = {
      device_id: 'SOME-OTHER-DEVICE',
      alg: 'ED25519',
      signature: collectorSignature,
      attested_at_utc: 1917400001
    };
    built.record.alg = 'ED25519';
    built.record.signature = collectorSignature;

    const luku = await exportSingleBlockArchive(signer, deviceId, [scanRecord, built.record], {
      [built.attachment!.checksum]: built.attachment!.bytes
    });
    const issues = await luku.verify(testOptions());
    assert.ok(hasIssue(issues, 'RECORD_VERIFICATION_COLLECTOR_ATTESTATION_DEVICE_MISMATCH'));
  });

  it('round-trips all 9 defined status values and flags an unrecognized one', async () => {
    const statuses = [
      'verified',
      'not_verified',
      'not_found',
      'mismatch',
      'expired',
      'revoked',
      'unavailable',
      'unsupported',
      'indeterminate'
    ];

    for (const status of statuses) {
      const signer = await createTestSigner();
      const deviceId = `LUK-VER-STATUS-${status}`;
      const { record: scanRecord } = await makeAnimalScanRecord(signer, deviceId, `SCAN-${status}`, '981098100000001');
      const responseBytes = new TextEncoder().encode(JSON.stringify({ status }));
      const { record: verRecord, attachment } = await buildVerificationRecord({
        id: `VER-${status}`,
        scheme: 'eu.animal.traceability',
        provider: 'FI-NATIONAL-REGISTRY',
        checkedAtUtc: 1917400000,
        status,
        response: { rawBytes: responseBytes, mime: 'application/json' }
      });
      const luku = await exportSingleBlockArchive(signer, deviceId, [scanRecord, verRecord], { [attachment!.checksum]: attachment!.bytes });
      const issues = await luku.verify(testOptions());
      assert.equal(hasIssue(issues, 'RECORD_VERIFICATION_STATUS_INVALID'), false, `status ${status} should round-trip cleanly`);
    }

    // An unrecognized status value IS flagged.
    const signer = await createTestSigner();
    const deviceId = 'LUK-VER-BAD-STATUS';
    const { record: scanRecord } = await makeAnimalScanRecord(signer, deviceId, 'SCAN-BAD-STATUS', '981098100000002');
    const responseBytes = new TextEncoder().encode('{"status":"nope"}');
    const { record: verRecord, attachment } = await buildVerificationRecord({
      id: 'VER-BAD-STATUS',
      scheme: 'eu.animal.traceability',
      provider: 'FI-NATIONAL-REGISTRY',
      checkedAtUtc: 1917400000,
      status: 'not_a_real_status',
      response: { rawBytes: responseBytes, mime: 'application/json' }
    });
    const luku = await exportSingleBlockArchive(signer, deviceId, [scanRecord, verRecord], { [attachment!.checksum]: attachment!.bytes });
    const issues = await luku.verify(testOptions());
    assert.ok(hasIssue(issues, 'RECORD_VERIFICATION_STATUS_INVALID'));
  });

  it('a verification record never advances native device counters or previous_signature chains', async () => {
    const signer = await createTestSigner();
    const deviceId = 'LUK-VER-CHAIN';

    const scan1Canonical = `${deviceId}:${signer.publicKeyBase64}:scan:SCAN-CHAIN-1:1:1000::animal:::FDX-B:v1.0:981000000000001:38.50::genesis_fake`;
    const scan1Sig = await signCanonical(signer.signer.privateKey, scan1Canonical);

    const scan2Canonical = `${deviceId}:${signer.publicKeyBase64}:scan:SCAN-CHAIN-2:2:1010::animal:::FDX-B:v1.0:981000000000002:38.60::${scan1Sig}`;
    const scan2Sig = await signCanonical(signer.signer.privateKey, scan2Canonical);

    const responseBytes = new TextEncoder().encode('{"status":"ok"}');
    const built = await buildVerificationRecord({
      id: 'VER-CHAIN-1',
      parentId: 'SCAN-CHAIN-1',
      parentSignature: scan1Sig,
      scheme: 'eu.animal.traceability',
      provider: 'FI-NATIONAL-REGISTRY',
      checkedAtUtc: 1005,
      status: 'verified',
      response: { rawBytes: responseBytes, mime: 'application/json' }
    });
    // Attach a collector_attestation so this verification record DOES carry
    // its own top-level device signature too, to prove that signature is
    // also excluded from native chain tracking (lastSignatures).
    const payload = verificationCollectorAttestationPayload(built.record);
    const collectorSignature = await signCanonical(signer.signer.privateKey, payload);
    built.record.collector_attestation = {
      device_id: deviceId,
      alg: 'ED25519',
      signature: collectorSignature,
      attested_at_utc: 1006
    };
    built.record.alg = 'ED25519';
    built.record.signature = collectorSignature;

    const batch: JsonObject[] = [
      {
        type: 'scan',
        id: 'SCAN-CHAIN-1',
        device_id: deviceId,
        public_key: signer.publicKeyBase64,
        signature: scan1Sig,
        previous_signature: 'genesis_fake',
        canonical_string: scan1Canonical,
        payload: {
          ctr: 1,
          timestamp_utc: 1000,
          genesis_hash: 'genesis_fake',
          profile: 'animal',
          protocol: 'FDX-B',
          scan_version: 'v1.0',
          tag_id: '981000000000001',
          temperature_c: 38.5
        }
      },
      built.record,
      {
        type: 'scan',
        id: 'SCAN-CHAIN-2',
        device_id: deviceId,
        public_key: signer.publicKeyBase64,
        signature: scan2Sig,
        previous_signature: scan1Sig,
        canonical_string: scan2Canonical,
        payload: {
          ctr: 2,
          timestamp_utc: 1010,
          profile: 'animal',
          protocol: 'FDX-B',
          scan_version: 'v1.0',
          tag_id: '981000000000002',
          temperature_c: 38.6
        }
      }
    ];

    const luku = await exportSingleBlockArchive(signer, deviceId, batch, { [built.attachment!.checksum]: built.attachment!.bytes });
    const issues = await luku.verify(testOptions());
    assert.equal(criticalIssues(issues).length, 0, JSON.stringify(issues));
    assert.equal(hasIssue(issues, 'RECORD_CHAIN_BROKEN', 'COUNTER_REGRESSION', 'TIME_REGRESSION'), false);

    // The native chain's own canonical/signature checks (above) already prove
    // `previous_signature`/`ctr` weren't disturbed by the verification record
    // sitting between SCAN-CHAIN-1 and SCAN-CHAIN-2 in the batch.
  });

  it('a historically-authentic response remains valid evidence even after the provider later marks it expired/revoked', async () => {
    const signer = await createTestSigner();
    const deviceId = 'LUK-VER-HIST';
    const { record: scanRecord } = await makeAnimalScanRecord(signer, deviceId, 'SCAN-HIST', '981098100000003');

    const jwsBytes = await buildSignedJws('EdDSA', { sub: '981098100000003', status: 'revoked' });
    const { record: verRecord, attachment } = await buildVerificationRecord({
      id: 'VER-HIST',
      scheme: 'eu.animal.traceability',
      provider: 'EU-WALLET-PROVIDER',
      checkedAtUtc: 1917400000,
      status: 'revoked',
      response: { rawBytes: jwsBytes, mime: 'application/jwt', format: 'jws' }
    });

    const luku = await exportSingleBlockArchive(signer, deviceId, [scanRecord, verRecord], { [attachment!.checksum]: attachment!.bytes });
    const issues = await luku.verify(testOptions());
    assert.equal(criticalIssues(issues).length, 0, JSON.stringify(issues));

    const parsed = await parseLukuFile(await luku.saveToBytes());
    const result = findVerificationItemResult(parsed.items);
    // The artifact's own signature still verifies (it WAS authentic when
    // captured) even though `status` now reports "revoked" — these are
    // reported as two separate, un-collapsed facts.
    assert.equal(result.nativeSignatureVerified, true);
    assert.equal(result.assuranceLevel, 'authority_verified');
    assert.equal(result.status, 'revoked');
  });

  it('merge/re-export retains the original verification response bytes unchanged', async () => {
    const signer = await createTestSigner();
    const deviceId = 'LUK-VER-MERGE';
    const { record: scanRecord } = await makeAnimalScanRecord(signer, deviceId, 'SCAN-MERGE', '981098100000004');

    const responseBytes = new TextEncoder().encode('{"status":"ok","note":"exact bytes must survive merge"}');
    const { record: verRecord, attachment } = await buildVerificationRecord({
      id: 'VER-MERGE',
      scheme: 'eu.animal.traceability',
      provider: 'FI-NATIONAL-REGISTRY',
      checkedAtUtc: 1917400000,
      status: 'verified',
      response: { rawBytes: responseBytes, mime: 'application/json' }
    });

    const luku = await exportSingleBlockArchive(signer, deviceId, [scanRecord, verRecord], { [attachment!.checksum]: attachment!.bytes });

    const otherSigner = await createTestSigner();
    const otherDeviceId = 'LUK-VER-MERGE-OTHER';
    const { record: otherScan } = await makeAnimalScanRecord(otherSigner, otherDeviceId, 'SCAN-MERGE-OTHER', '981098100000005');
    const other = await exportSingleBlockArchive(otherSigner, otherDeviceId, [otherScan], {});

    await luku.merge(other, signer.signer);
    const mergedBytes = await luku.saveToBytes();
    const reopened = await LukuFile.openBytes(mergedBytes);

    const storedAttachment = reopened.attachments.get(attachment!.checksum);
    assert.ok(storedAttachment);
    assert.deepEqual(storedAttachment, responseBytes);

    const issues = await reopened.verify(testOptions());
    assert.equal(criticalIssues(issues).length, 0, JSON.stringify(issues));
  });

  it('Batch Digest Rule: an unsigned verification record contributes response.checksum to batch_hash', async () => {
    const signer = await createTestSigner();
    const deviceId = 'LUK-VER-BATCH';
    const { record: scanRecord } = await makeAnimalScanRecord(signer, deviceId, 'SCAN-BATCH', '981098100000006');

    const responseBytes = new TextEncoder().encode('{"status":"ok"}');
    const { record: verRecord, attachment } = await buildVerificationRecord({
      id: 'VER-BATCH',
      scheme: 'eu.animal.traceability',
      provider: 'FI-NATIONAL-REGISTRY',
      checkedAtUtc: 1917400000,
      status: 'verified',
      response: { rawBytes: responseBytes, mime: 'application/json' }
    });

    assert.equal(verRecord.signature, undefined);
    const luku = await exportSingleBlockArchive(signer, deviceId, [scanRecord, verRecord], { [attachment!.checksum]: attachment!.bytes });

    const expectedJoined = [scanRecord.signature as string, (verRecord.response as JsonObject).checksum as string].join(':');
    const expectedBatchHash = await sha256Hex(new TextEncoder().encode(expectedJoined));
    assert.equal(luku.blocks[0].batch_hash, expectedBatchHash);

    const issues = await luku.verify(testOptions());
    assert.equal(hasIssue(issues, 'BLOCK_BATCH_HASH_INVALID'), false);
  });
});
