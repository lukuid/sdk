// SPDX-License-Identifier: Apache-2.0
// Genesis record rule: a native record whose previous_signature is the base64 of
// exactly 32 bytes must carry SHA-256(DAC DER), and match genesis_hash if present.
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createHash, randomBytes } from 'node:crypto';
import { LukuFile, LukuVerifyOptions } from '../src/index.js';

const DAC = randomBytes(300);
const DAC_B64 = DAC.toString('base64');
const DAC_HASH_B64 = createHash('sha256').update(DAC).digest('base64');

async function archiveWithFirstRecord(previousSignature: string, genesisHash?: string, dacB64: string | null = DAC_B64) {
  const pair = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])) as CryptoKeyPair;
  const publicKey = Buffer.from(new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey))).toString('base64');
  const signature = Buffer.from(new Uint8Array(await crypto.subtle.sign('Ed25519', pair.privateKey, new TextEncoder().encode('can1')))).toString('base64');
  const payload: Record<string, unknown> = { ctr: 7, timestamp_utc: 1000 };
  if (genesisHash !== undefined) payload.genesis_hash = genesisHash;
  const exported = await LukuFile.exportWithIdentity(
    [{ type: 'scan', signature, previous_signature: previousSignature, canonical_string: 'can1', payload }],
    { device_id: 'LUK-GENESIS', public_key: publicKey },
    {},
    { privateKey: pair.privateKey, publicKey: pair.publicKey }
  );
  const archive = await LukuFile.openBytes(await exported.saveToBytes());
  archive.blocks[0].attestation_dac_der = dacB64;
  return archive;
}

const options: LukuVerifyOptions = {
  allowUntrustedRoots: false,
  skipCertificateTemporalChecks: true,
  trustedExternalFingerprints: [],
  trustProfile: 'dev'
};

async function genesisIssues(previousSignature: string, genesisHash?: string, dacB64: string | null = DAC_B64) {
  const archive = await archiveWithFirstRecord(previousSignature, genesisHash, dacB64);
  return (await archive.verify(options)).filter((i) => i.code === 'GENESIS_HASH_MISMATCH');
}

describe('Genesis record anchoring (32-byte previous_signature)', () => {
  it('accepts a genesis record anchored to its DAC with matching genesis_hash', async () => {
    assert.deepStrictEqual(await genesisIssues(DAC_HASH_B64, DAC_HASH_B64), []);
  });

  it('accepts a genesis record anchored to its DAC without genesis_hash', async () => {
    assert.deepStrictEqual(await genesisIssues(DAC_HASH_B64), []);
  });

  it('rejects a 32-byte previous_signature that is not the DAC hash', async () => {
    const issues = await genesisIssues(randomBytes(32).toString('base64'));
    assert.ok(issues.some((i) => i.criticality === 'critical' && /SHA-256 of its DAC/.test(i.message)));
  });

  it('rejects a genesis record whose DAC is missing', async () => {
    const issues = await genesisIssues(DAC_HASH_B64, DAC_HASH_B64, null);
    assert.ok(issues.some((i) => /DAC certificate missing/.test(i.message)));
  });

  it('rejects genesis_hash that differs from previous_signature', async () => {
    const issues = await genesisIssues(DAC_HASH_B64, randomBytes(32).toString('base64'));
    assert.ok(issues.some((i) => /genesis_hash that does not match previous_signature/.test(i.message)));
  });

  it('does not treat a 64-byte predecessor signature as a genesis record', async () => {
    assert.deepStrictEqual(await genesisIssues(randomBytes(64).toString('base64'), 'genesis_fake'), []);
  });
});
