// SPDX-License-Identifier: Apache-2.0
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { LukuFile, LukuVerifyOptions } from '../src/index.js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveSamplesDir(): string {
  let current = __dirname;
  while (true) {
    for (const version of ['1.0.0', '1.0']) {
      const candidate = path.join(current, 'samples', 'dotluku', 'dev', version);
      if (existsSync(candidate)) return candidate;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
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

async function createValidExport(deviceId: string): Promise<{
  luku: LukuFile;
  signer: TestSigner;
}> {
  const signer = await createTestSigner();
  const identity = {
    device_id: deviceId,
    public_key: signer.publicKeyBase64
  };

  const records = [
    {
      type: 'scan',
      signature: await signCanonical(signer.signer.privateKey, 'can1'),
      previous_signature: 'genesis_fake',
      canonical_string: 'can1',
      payload: {
        ctr: 1,
        timestamp_utc: 1000,
        genesis_hash: 'genesis_fake'
      }
    }
  ];

  const exported = await LukuFile.exportWithIdentity(records, identity, {}, signer.signer);
  const reopened = await LukuFile.openBytes(await exported.saveToBytes());
  return { luku: reopened, signer };
}

function testOptions(): LukuVerifyOptions {
  return {
    allowUntrustedRoots: false,
    skipCertificateTemporalChecks: true,
    trustedExternalFingerprints: [],
    trustProfile: 'dev'
  };
}

describe('Negative Tests (Tampering)', () => {
  it('fails verification when device attestation leaf signature is tampered', async () => {
    const { luku: archive } = await createValidExport('LUK-TAMPER-1');
    
    // Tamper with attestation signature in the first block
    const originalSig = archive.blocks[0].batch[0].signature as string;
    archive.blocks[0].batch[0].signature = originalSig.replace(/A/g, 'B');
    if (archive.blocks[0].batch[0].signature === originalSig) {
        archive.blocks[0].batch[0].signature = originalSig.substring(0, originalSig.length - 1) + 'X';
    }
    
    const issues = await archive.verify(testOptions());
    assert.ok(issues.some(i => i.code === 'RECORD_SIGNATURE_INVALID' || i.code === 'ATTESTATION_FAILED'));
  });

  it('fails verification when attestation DAC certificate is tampered', async () => {
    const { luku: archive } = await createValidExport('LUK-TAMPER-2');
    archive.blocks[0].attestation_dac_der = Buffer.from('fake_der_data').toString('base64');
    
    const issues = await archive.verify(testOptions());
    assert.ok(issues.some(i => i.code === 'ATTESTATION_FAILED' || i.code === 'ATTESTATION_CHAIN_MISSING'));
  });

  it('fails verification when attestation Intermediate certificate is tampered', async () => {
    const { luku: archive } = await createValidExport('LUK-TAMPER-3');
    archive.blocks[0].attestation_intermediate_der = Buffer.from('fake_der_data').toString('base64');
    
    const issues = await archive.verify(testOptions());
    assert.ok(issues.some(i => i.code === 'ATTESTATION_FAILED' || i.code === 'ATTESTATION_CHAIN_MISSING'));
  });

  it('fails verification when root fingerprint is tampered', async () => {
    const { luku: archive } = await createValidExport('LUK-TAMPER-4');
    archive.blocks[0].attestation_root_fingerprint = '00'.repeat(32);
    
    const issues = await archive.verify(testOptions());
    assert.ok(issues.some(i => i.code === 'ATTESTATION_FAILED' || i.code === 'BLOCK_HASH_INVALID'));
  });

  it('fails verification when heartbeat root fingerprint is tampered', async () => {
    const { luku: archive } = await createValidExport('LUK-TAMPER-5');
    archive.blocks[0].heartbeat_root_fingerprint = '00'.repeat(32);
    
    const issues = await archive.verify(testOptions());
    assert.ok(issues.some(i => i.code === 'ATTESTATION_FAILED' || i.code === 'BLOCK_HASH_INVALID'));
  });

  it('fails verification when block hash is tampered', async () => {
    const samplePath = path.join(samplesDir, 'first-passable-verification-sample.luku');
    const archive = await LukuFile.openBytes(new Uint8Array(await readFile(samplePath)));
    
    // Tamper with the blocks_hash in the manifest
    archive.manifest.blocks_hash = '00'.repeat(32);
    
    const issues = await archive.verify(testOptions());
    assert.ok(issues.some(i => i.code === 'BLOCKS_HASH_MISMATCH'));
  });
});

  it('fails verification with tampered chain', async () => {
    const samplePath = path.join(samplesDir, 'chain-tampered.luku');
    if (!existsSync(samplePath)) return;
    const archive = await LukuFile.openBytes(new Uint8Array(await readFile(samplePath)));
    const issues = await archive.verify(testOptions());
    assert.ok(issues.some(i => i.code === 'ATTESTATION_FAILED'));
  });
