// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { zipSync, strToU8 } from 'fflate';
import { webcrypto } from 'node:crypto';
import { LukuFile, type LukuVerifyOptions } from '../src/index.js';

if (!globalThis.crypto) {
  (globalThis as any).crypto = webcrypto;
}

const EMPTY_SHA256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

function buildArchiveBytes(manifest: Record<string, unknown>, extraEntries: Record<string, Uint8Array> = {}): Uint8Array {
  return zipSync({
    mimetype: [strToU8('application/vnd.lukuid.package+zip'), { level: 0 as const }],
    'manifest.json': strToU8(JSON.stringify(manifest)),
    'blocks.jsonl': strToU8('\n'),
    ...extraEntries
  });
}

async function createTestSigner(): Promise<{ privateKey: CryptoKey; publicKeyBase64: string }> {
  const pair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']) as CryptoKeyPair;
  const exported = await crypto.subtle.exportKey('raw', pair.publicKey);
  return {
    privateKey: pair.privateKey,
    publicKeyBase64: Buffer.from(new Uint8Array(exported)).toString('base64')
  };
}

function verifyOptions(): LukuVerifyOptions {
  return {
    allowUntrustedRoots: true,
    skipCertificateTemporalChecks: true,
    trustProfile: 'dev'
  };
}

describe('Archive Hardening', () => {
  it('rejects unsafe ZIP entry paths', async () => {
    const bytes = buildArchiveBytes(
      {
        type: 'LukuArchive',
        version: '1.0.0',
        created_at_utc: 1,
        description: 'test',
        blocks_hash: EMPTY_SHA256
      },
      {
        'attachments/../../evil': strToU8('boom')
      }
    );

    await assert.rejects(() => LukuFile.openBytes(bytes), /unsafe ZIP entry path/);
  });

  it('rejects manifest.json with missing required fields', async () => {
    const bytes = buildArchiveBytes({
      type: 'LukuArchive',
      version: '1.0.0',
      created_at_utc: 1,
      description: 'test'
    });

    await assert.rejects(() => LukuFile.openBytes(bytes), /blocks_hash/);
  });

  it('flags unsupported archive manifest versions', async () => {
    const archive = await LukuFile.openBytes(
      buildArchiveBytes({
        type: 'LukuArchive',
        version: '9.9.9',
        created_at_utc: 1,
        description: 'test',
        blocks_hash: EMPTY_SHA256
      })
    );

    const issues = await archive.verify(verifyOptions());
    assert.ok(issues.some((issue) => issue.code === 'MANIFEST_VERSION_UNSUPPORTED'));
  });

  it('rejects external_identity on unsupported native record types', async () => {
    const signer = await createTestSigner();
    const exported = await LukuFile.exportWithIdentity(
      [
        {
          type: 'scan',
          signature: '',
          previous_signature: 'genesis_fake',
          canonical_string: 'scan-can',
          payload: {
            ctr: 1,
            timestamp_utc: 1,
            genesis_hash: 'genesis_fake'
          }
        }
      ],
      {
        device_id: 'LUK-JS-HARDEN',
        public_key: signer.publicKeyBase64
      },
      {},
      { privateKey: signer.privateKey }
    );
    const archive = await LukuFile.openBytes(await exported.saveToBytes());
    archive.blocks[0].batch[0].external_identity = { endorser_id: 'ext-1' };

    const issues = await archive.verify(verifyOptions());
    assert.ok(issues.some((issue) => issue.code === 'EXTERNAL_IDENTITY_UNSUPPORTED_RECORD_TYPE'));
  });
});
