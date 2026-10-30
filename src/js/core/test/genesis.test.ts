// SPDX-License-Identifier: Apache-2.0
// Genesis record rule: a native record whose previous_signature is the base64 of
// exactly 32 bytes must carry SHA-256 of the device's raw Ed25519 public key,
// and match genesis_hash if present. Independent of the (reissuable) DAC.
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createHash, randomBytes } from 'node:crypto';
import { LukuFile, LukuVerifyOptions } from '../src/index.js';

const options: LukuVerifyOptions = {
  allowUntrustedRoots: false,
  skipCertificateTemporalChecks: true,
  trustedExternalFingerprints: [],
  trustProfile: 'dev'
};

type PreviousSignature = (keyHashB64: string) => string;

async function genesisIssues(previous: PreviousSignature, genesisHash?: PreviousSignature, dacB64?: string) {
  const pair = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])) as CryptoKeyPair;
  const rawKey = Buffer.from(new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey)));
  const keyHash = createHash('sha256').update(rawKey).digest('base64');
  const signature = Buffer.from(new Uint8Array(await crypto.subtle.sign('Ed25519', pair.privateKey, new TextEncoder().encode('can1')))).toString('base64');
  const payload: Record<string, unknown> = { ctr: 7, timestamp_utc: 1000 };
  if (genesisHash) payload.genesis_hash = genesisHash(keyHash);
  const exported = await LukuFile.exportWithIdentity(
    [{ type: 'scan', signature, previous_signature: previous(keyHash), canonical_string: 'can1', payload }],
    { device_id: 'LUK-GENESIS', public_key: rawKey.toString('base64') },
    {},
    { privateKey: pair.privateKey, publicKey: pair.publicKey }
  );
  const archive = await LukuFile.openBytes(await exported.saveToBytes());
  if (dacB64 !== undefined) archive.blocks[0].attestation_dac_der = dacB64;
  return (await archive.verify(options)).filter((i) => i.code === 'GENESIS_HASH_MISMATCH');
}

const own = (keyHash: string) => keyHash;
const random32 = () => randomBytes(32).toString('base64');

describe('Genesis record anchoring (device public key)', () => {
  it('accepts a genesis record anchored to its public key with matching genesis_hash', async () => {
    assert.deepStrictEqual(await genesisIssues(own, own), []);
  });

  it('accepts a genesis record anchored to its public key without genesis_hash', async () => {
    assert.deepStrictEqual(await genesisIssues(own), []);
  });

  it('does not depend on the DAC (reissued or arbitrary DAC still verifies)', async () => {
    assert.deepStrictEqual(await genesisIssues(own, own, randomBytes(300).toString('base64')), []);
  });

  it('rejects a 32-byte previous_signature that is not the public key hash', async () => {
    const issues = await genesisIssues(random32);
    assert.ok(issues.some((i) => i.criticality === 'critical' && /SHA-256 of its public key/.test(i.message)));
  });

  it('rejects genesis_hash that differs from previous_signature', async () => {
    const issues = await genesisIssues(own, random32);
    assert.ok(issues.some((i) => /genesis_hash that does not match previous_signature/.test(i.message)));
  });

  it('does not treat a 64-byte predecessor signature as a genesis record', async () => {
    assert.deepStrictEqual(await genesisIssues(() => randomBytes(64).toString('base64'), () => 'genesis_fake'), []);
  });
});
