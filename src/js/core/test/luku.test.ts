// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { webcrypto } from 'node:crypto';
import { zipSync } from 'fflate';
import {
  LUKU_MIMETYPE,
  LukuDeviceIdentity,
  LukuFile,
  LukuVerifyOptions,
  type JsonObject
} from '../src/index.js';

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as Crypto;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveSamplesDir(): string {
  let current = __dirname;

  while (true) {
    for (const version of ['1.0.0', '1.0']) {
      const candidate = path.join(current, 'samples', 'dotluku', 'dev', version);
      if (existsSync(candidate)) {
        return candidate;
      }
    }

    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  return path.join(__dirname, 'samples', 'dotluku', 'dev', '1.0.0');
}

const samplesDir = resolveSamplesDir();

interface TestSigner {
  signer: { privateKey: CryptoKey; publicKey: CryptoKey };
  publicKeyBase64: string;
}

async function createTestSigner(): Promise<TestSigner> {
  const pair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']) as CryptoKeyPair;
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

function testOptions(): LukuVerifyOptions {
  return {
    allowUntrustedRoots: true,
    skipCertificateTemporalChecks: true,
    trustedExternalFingerprints: [],
    trustProfile: 'dev'
  };
}

async function createValidExport(deviceId: string): Promise<{
  luku: LukuFile;
  signer: TestSigner;
}> {
  const signer = await createTestSigner();
  const identity: LukuDeviceIdentity = {
    device_id: deviceId,
    public_key: signer.publicKeyBase64
  };

  const canonical1 = 'can1';
  const canonical2 = 'can2';
  const canonical3 = 'can3';

  const records: JsonObject[] = [
    {
      type: 'scan',
      signature: await signCanonical(signer.signer.privateKey, canonical1),
      previous_signature: 'genesis_fake',
      canonical_string: canonical1,
      payload: {
        ctr: 1,
        timestamp_utc: 1000,
        genesis_hash: 'genesis_fake'
      }
    },
    {
      type: 'scan',
      signature: await signCanonical(signer.signer.privateKey, canonical2),
      previous_signature: await signCanonical(signer.signer.privateKey, canonical1),
      canonical_string: canonical2,
      payload: {
        ctr: 2,
        timestamp_utc: 1005,
        genesis_hash: 'genesis_fake'
      }
    },
    {
      type: 'scan',
      signature: await signCanonical(signer.signer.privateKey, canonical3),
      previous_signature: await signCanonical(signer.signer.privateKey, canonical2),
      canonical_string: canonical3,
      payload: {
        ctr: 3,
        timestamp_utc: 1010,
        genesis_hash: 'genesis_fake'
      }
    }
  ];

  const exported = await LukuFile.exportWithIdentity(records, identity, {}, signer.signer);
  const reopened = await LukuFile.openBytes(await exported.saveToBytes());
  return { luku: reopened, signer };
}

function hasIssue(issues: Array<{ code: string }>, ...codes: string[]): boolean {
  return issues.some((issue) => codes.includes(issue.code));
}

describe('LukuFile', () => {
  it('exports and re-opens archives', async () => {
    const signer = await createTestSigner();
    const identity: LukuDeviceIdentity = {
      device_id: 'LUK-TEST',
      public_key: signer.publicKeyBase64
    };
    const canonical = 'can1';

    const exported = await LukuFile.export(
      [
        {
          type: 'scan',
          signature: await signCanonical(signer.signer.privateKey, canonical),
          previous_signature: 'genesis_fake',
          canonical_string: canonical,
          payload: { ctr: 1, timestamp_utc: 1000 }
        }
      ],
      identity,
      {},
      signer.signer
    );

    const reopened = await LukuFile.openBytes(await exported.saveToBytes());
    assert.equal(reopened.manifest.version, '1.0');
    assert.equal(reopened.blocks.length, 1);
    assert.equal(reopened.blocks[0].batch.length, 1);
  });

  it('builds block fallback cert fields', async () => {
    const identity: LukuDeviceIdentity = {
      device_id: 'LUK-TEST',
      public_key: Buffer.from(new Uint8Array(32)).toString('base64')
    };

    const block = await LukuFile.buildBlockFromRecords(
      0,
      1000,
      null,
      identity,
      [
        {
          type: 'scan',
          signature: 'sig1',
          canonical_string: 'can1',
          payload: { ctr: 1, timestamp_utc: 1000 }
        }
      ],
      {
        dac_der: 'mock_dac_der',
        attestation_root_fingerprint: 'mock_fingerprint'
      }
    );

    assert.equal(block.attestation_dac_der, 'mock_dac_der');
    assert.equal(block.attestation_root_fingerprint, 'mock_fingerprint');
  });

  it('verifies a valid archive', async () => {
    const { luku } = await createValidExport('LUK-VALID');
    const issues = await luku.verify(testOptions());
    assert.equal(
      issues.filter((entry) => entry.criticality === 'critical').length,
      0
    );
  });

  it('detects record deletion', async () => {
    const { luku } = await createValidExport('LUK-DEL');
    luku.blocks[0].batch.splice(1, 1);
    const issues = await luku.verify(testOptions());
    assert.ok(hasIssue(issues, 'RECORD_CHAIN_BROKEN'));
  });

  it('detects record injection', async () => {
    const { luku } = await createValidExport('LUK-INJ');
    luku.blocks[0].batch.splice(1, 0, {
      type: 'scan',
      signature: 'fake_sig',
      previous_signature: 'doesnt_matter',
      payload: { ctr: 2, timestamp_utc: 1002 }
    });
    const issues = await luku.verify(testOptions());
    assert.ok(hasIssue(issues, 'RECORD_CHAIN_BROKEN', 'RECORD_SIGNATURE_INVALID'));
  });

  it('detects time regression', async () => {
    const { luku } = await createValidExport('LUK-TIME');
    const payload = luku.blocks[0].batch[1].payload as JsonObject;
    payload.timestamp_utc = 999;
    const issues = await luku.verify(testOptions());
    assert.ok(hasIssue(issues, 'TIME_REGRESSION'));
  });

  it('detects counter regression', async () => {
    const { luku } = await createValidExport('LUK-CTR');
    const payload = luku.blocks[0].batch[1].payload as JsonObject;
    payload.ctr = 1;
    const issues = await luku.verify(testOptions());
    assert.ok(hasIssue(issues, 'COUNTER_REGRESSION'));
  });

  it('detects export tampering', async () => {
    const { luku } = await createValidExport('LUK-EXP');
    luku.blocks[0].block_id = 999;
    const tampered = await LukuFile.openBytes(await luku.saveToBytes());
    const issues = await tampered.verify(testOptions());
    assert.ok(hasIssue(issues, 'BLOCKS_HASH_MISMATCH'));
  });

  it('detects attachment corruption', async () => {
    const { luku } = await createValidExport('LUK-ATT');
    const checksum = await luku.addAttachmentAsync(new TextEncoder().encode('valid_data'));
    luku.blocks[0].batch.push({
      type: 'attachment',
      checksum,
      payload: { ctr: 3 }
    });
    luku.attachments.set(checksum, new TextEncoder().encode('tampered_data'));
    const issues = await luku.verify(testOptions());
    assert.ok(hasIssue(issues, 'ATTACHMENT_CORRUPT'));
  });

  it('keeps attested attachments out of the native chain', async () => {
    const signer = await createTestSigner();
    const deviceId = 'LUK-ATTEST';
    const attachmentBytes = new TextEncoder().encode('desktop-added-attachment');
    const attachmentHash = await crypto.subtle.digest('SHA-256', attachmentBytes);
    const checksum = Buffer.from(new Uint8Array(attachmentHash)).toString('hex');
    const scanCanonical = 'attested-scan';
    const envCanonical = 'attested-environment';
    const attCanonical = 'attested-attachment';
    const scanSig = await signCanonical(signer.signer.privateKey, scanCanonical);

    const block = await LukuFile.buildBlockFromRecords(
      0,
      1003,
      null,
      { device_id: deviceId, public_key: signer.publicKeyBase64 },
      [
        {
          type: 'scan',
          scan_id: 'SCAN-ATTEST-1',
          device_id: deviceId,
          public_key: signer.publicKeyBase64,
          signature: scanSig,
          previous_signature: 'genesis_fake',
          canonical_string: scanCanonical,
          payload: { ctr: 1, timestamp_utc: 1000, genesis_hash: 'genesis_fake' }
        },
        {
          type: 'attachment',
          attachment_id: 'ATT-ATTEST-1',
          parent_record_id: 'SCAN-ATTEST-1',
          device_id: deviceId,
          public_key: signer.publicKeyBase64,
          signature: await signCanonical(signer.signer.privateKey, attCanonical),
          parent_signature: scanSig,
          canonical_string: attCanonical,
          timestamp_utc: 1001,
          checksum,
          mime: 'text/plain',
          title: 'Desktop Note'
        },
        {
          type: 'environment',
          event_id: 'ENV-ATTEST-1',
          device_id: deviceId,
          public_key: signer.publicKeyBase64,
          signature: await signCanonical(signer.signer.privateKey, envCanonical),
          previous_signature: scanSig,
          canonical_string: envCanonical,
          payload: { ctr: 2, timestamp_utc: 1002 }
        }
      ],
      undefined
    );

    const exported = await LukuFile.exportBlocksWithManifest(
      [block],
      { [checksum]: attachmentBytes },
      'Attested attachment export',
      {},
      signer.signer
    );
    const reopened = await LukuFile.openBytes(await exported.saveToBytes());
    const issues = await reopened.verify(testOptions());
    assert.equal(
      issues.filter((entry) => entry.criticality === 'critical').length,
      0
    );
    assert.equal(hasIssue(issues, 'RECORD_CHAIN_BROKEN'), false);
  });

  it('keeps attested custody records out of the native chain', async () => {
    const signer = await createTestSigner();
    const deviceId = 'LUK-CUSTODY';
    const scanCanonical = 'custody-scan';
    const envCanonical = 'custody-environment';
    const custodyCanonical = 'custody-checkpoint';
    const scanSig = await signCanonical(signer.signer.privateKey, scanCanonical);

    const block = await LukuFile.buildBlockFromRecords(
      0,
      1003,
      null,
      { device_id: deviceId, public_key: signer.publicKeyBase64 },
      [
        {
          type: 'scan',
          scan_id: 'SCAN-CUSTODY-1',
          device_id: deviceId,
          public_key: signer.publicKeyBase64,
          signature: scanSig,
          previous_signature: 'genesis_fake',
          canonical_string: scanCanonical,
          payload: { ctr: 1, timestamp_utc: 1000, genesis_hash: 'genesis_fake' }
        },
        {
          type: 'custody',
          custody_id: 'CUSTODY-1',
          parent_record_id: 'SCAN-CUSTODY-1',
          device_id: deviceId,
          public_key: signer.publicKeyBase64,
          signature: await signCanonical(signer.signer.privateKey, custodyCanonical),
          parent_signature: scanSig,
          canonical_string: custodyCanonical,
          timestamp_utc: 1001,
          payload: { event: 'handoff', status: 'received', context_ref: 'shipment-123' }
        },
        {
          type: 'environment',
          event_id: 'ENV-CUSTODY-1',
          device_id: deviceId,
          public_key: signer.publicKeyBase64,
          signature: await signCanonical(signer.signer.privateKey, envCanonical),
          previous_signature: scanSig,
          canonical_string: envCanonical,
          payload: { ctr: 2, timestamp_utc: 1002 }
        }
      ],
      undefined
    );

    const exported = await LukuFile.exportBlocksWithManifest([block], {}, 'Attested custody export', {}, signer.signer);
    const reopened = await LukuFile.openBytes(await exported.saveToBytes());
    const issues = await reopened.verify(testOptions());
    assert.equal(
      issues.filter((entry) => entry.criticality === 'critical').length,
      0
    );
    assert.equal(hasIssue(issues, 'RECORD_CHAIN_BROKEN'), false);
  });

  it('fails strict attestation when the chain is fake', async () => {
    const { luku } = await createValidExport('LUK-STRICT');
    luku.blocks[0].attestation_dac_der = Buffer.from('fake_der_data').toString('base64');
    const issues = await luku.verify({
      ...testOptions(),
      allowUntrustedRoots: false
    });
    assert.ok(hasIssue(issues, 'ATTESTATION_FAILED', 'ATTESTATION_CHAIN_MISSING'));
  });

  it('rejects structurally invalid archives', async () => {
    await assert.rejects(() => LukuFile.openBytes(new TextEncoder().encode('just random garbage bytes')));

    const wrongMime = zipSync({
      mimetype: [new TextEncoder().encode('application/pdf'), { level: 0 as const }]
    });
    await assert.rejects(async () => {
      await LukuFile.openBytes(wrongMime);
    }, /Invalid mimetype/);

    const missingManifest = zipSync({
      mimetype: [new TextEncoder().encode(LUKU_MIMETYPE), { level: 0 as const }]
    });
    await assert.rejects(async () => {
      await LukuFile.openBytes(missingManifest);
    }, /manifest\.json missing/);
  });

  it('mutates real sample archives in memory', async () => {
    const samplePath = path.join(samplesDir, 'first-passable-verification-sample.luku');
    const sampleBytes = await readFile(samplePath);
    const original = await LukuFile.openBytes(new Uint8Array(sampleBytes));
    const originalIssues = await original.verify(testOptions());
    assert.equal(originalIssues.filter((entry) => entry.criticality === 'critical').length, 0);

    const invalidSignature = await LukuFile.openBytes(new Uint8Array(sampleBytes));
    invalidSignature.blocks[0].batch[0].signature = 'not_base64_data!!!';
    assert.ok(hasIssue(await invalidSignature.verify(testOptions()), 'RECORD_SIGNATURE_INVALID', 'ATTESTATION_FAILED'));

    const mutatedCanonical = await LukuFile.openBytes(new Uint8Array(sampleBytes));
    mutatedCanonical.blocks[0].batch[0].canonical_string = `${mutatedCanonical.blocks[0].batch[0].canonical_string as string}X`;
    assert.ok(hasIssue(await mutatedCanonical.verify(testOptions()), 'RECORD_SIGNATURE_INVALID'));

    if (original.blocks[0].batch.length > 1) {
      const brokenChain = await LukuFile.openBytes(new Uint8Array(sampleBytes));
      brokenChain.blocks[0].batch[1].previous_signature = 'broken_link';
      assert.ok(hasIssue(await brokenChain.verify(testOptions()), 'RECORD_CHAIN_BROKEN'));
    }

    if (original.blocks.length > 1) {
      const floatingAnchor = await LukuFile.openBytes(new Uint8Array(sampleBytes));
      floatingAnchor.blocks[1].batch[0].previous_signature = 'floating_anchor_test';
      assert.equal(hasIssue(await floatingAnchor.verify(testOptions()), 'RECORD_CHAIN_BROKEN'), false);
    }

    if (original.blocks[0].batch.length > 1) {
      const regressedCounter = await LukuFile.openBytes(new Uint8Array(sampleBytes));
      const payload = regressedCounter.blocks[0].batch[1].payload as JsonObject;
      payload.ctr = 0;
      assert.ok(hasIssue(await regressedCounter.verify(testOptions()), 'COUNTER_REGRESSION'));
    }
  });

  it('verifies the shipped sample directory', async () => {
    const passable = path.join(samplesDir, 'first-passable-verification-sample.luku');
    const signatureMismatch = path.join(samplesDir, 'signature-mismatch.luku');
    const invalidChain = path.join(samplesDir, 'invalid-chain.luku');

    const passableArchive = await LukuFile.openBytes(new Uint8Array(await readFile(passable)));
    const passableIssues = await passableArchive.verify(testOptions());
    assert.equal(passableIssues.filter((entry) => entry.criticality === 'critical').length, 0);

    const mismatchArchive = await LukuFile.openBytes(new Uint8Array(await readFile(signatureMismatch)));
    const mismatchIssues = await mismatchArchive.verify({
      ...testOptions(),
      allowUntrustedRoots: false
    });
    assert.ok(hasIssue(mismatchIssues, 'ATTESTATION_FAILED', 'RECORD_SIGNATURE_INVALID', 'ATTESTATION_CHAIN_MISSING'));

    const invalidChainArchive = await LukuFile.openBytes(new Uint8Array(await readFile(invalidChain)));
    const invalidChainIssues = await invalidChainArchive.verify(testOptions());
    assert.ok(hasIssue(invalidChainIssues, 'RECORD_CHAIN_BROKEN', 'BLOCKS_HASH_MISMATCH', 'ATTESTATION_FAILED'));

    const devIssues = await passableArchive.verify({
      ...testOptions(),
      allowUntrustedRoots: false,
      trustProfile: 'dev'
    });
    assert.equal(
      devIssues.some(
        (entry) =>
          entry.code === 'ATTESTATION_FAILED'
          && entry.message.includes('Certificate chain does not match the requested trust profile')
      ),
      false
    );

    const testIssues = await passableArchive.verify({
      ...testOptions(),
      allowUntrustedRoots: false,
      trustProfile: 'test'
    });
    assert.equal(
      testIssues.some(
        (entry) =>
          entry.code === 'ATTESTATION_FAILED'
          && entry.message.includes('Certificate chain does not match the requested trust profile')
      ),
      true
    );

    const prodIssues = await passableArchive.verify({
      ...testOptions(),
      allowUntrustedRoots: false,
      trustProfile: 'prod'
    });
    assert.equal(
      prodIssues.some(
        (entry) =>
          entry.code === 'ATTESTATION_FAILED'
          && entry.message.includes('Certificate chain does not match the requested trust profile')
      ),
      true
    );
  });

  it.skip('valid fixture files', async () => {});
});
