// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { webcrypto } from 'node:crypto';
import {
  LukuFile,
  type JsonObject
} from '../src/index.js';

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as Crypto;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveSample(): string {
  let current = __dirname;
  while (true) {
    const candidate = path.join(current, 'samples', 'envelopes', 'dev', '1.0.0', 'valid_envelope.json');
    if (existsSync(candidate)) return candidate;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return path.join(__dirname, '..', '..', '..', '..', 'samples', 'envelopes', 'dev', '1.0.0', 'valid_envelope.json');
}

async function getValidEnvelope(): Promise<JsonObject> {
  const content = await readFile(resolveSample(), 'utf-8');
  return JSON.parse(content);
}

async function runWithBrowserCrypto<T>(fn: () => Promise<T>): Promise<T> {
  const originalProcess = (globalThis as { process?: unknown }).process;
  try {
    Object.defineProperty(globalThis, 'process', {
      value: undefined,
      configurable: true,
      writable: true
    });
    return await fn();
  } finally {
    Object.defineProperty(globalThis, 'process', {
      value: originalProcess,
      configurable: true,
      writable: true
    });
  }
}

describe('LukuFile.verifyEnvelope', () => {
  it('should verify a valid environment envelope with cert chains', async () => {
    const envelope = await getValidEnvelope();

    // allowUntrustedRoots: false means it WILL verify the cert chain against the trustProfile.
    // The sample uses 'dev' trust profile roots.
    const issues = await runWithBrowserCrypto(() => LukuFile.verifyEnvelope(envelope, { 
      allowUntrustedRoots: false,
      skipCertificateTemporalChecks: true,
      trustProfile: 'dev'
    }));
    assert.equal(issues.length, 0, `Should have no issues, but found: ${JSON.stringify(issues)}`);
  });

  it('should fail if public key does not match attestation certificate', async () => {
    const envelope = await getValidEnvelope();
    
    // Generate new keypair
    const pair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']) as CryptoKeyPair;
    const exported = await crypto.subtle.exportKey('raw', pair.publicKey);
    const newPubKeyBase64 = Buffer.from(new Uint8Array(exported)).toString('base64');
    
    // Replace public key in envelope
    (envelope.device as JsonObject).public_key = newPubKeyBase64;
    
    // Re-sign canonical string with new key so signature is valid for this key,
    // ensuring the failure explicitly comes from the certificate chain mismatch
    const signature = await crypto.subtle.sign('Ed25519', pair.privateKey, new TextEncoder().encode(envelope.canonical_string as string));
    envelope.signature = Buffer.from(new Uint8Array(signature)).toString('base64');

    const issues = await runWithBrowserCrypto(() => LukuFile.verifyEnvelope(envelope, { 
      allowUntrustedRoots: false,
      skipCertificateTemporalChecks: true,
      trustProfile: 'dev'
    }));
    assert.ok(issues.some(i => i.code === 'ATTESTATION_FAILED'), 'Expected ATTESTATION_FAILED');
  });

  it('should fail if signature is tampered', async () => {
    const envelope = await getValidEnvelope();
    envelope.signature = Buffer.from(new Uint8Array(64)).toString('base64'); // invalid sig

    const issues = await runWithBrowserCrypto(() => LukuFile.verifyEnvelope(envelope, { 
      allowUntrustedRoots: false,
      skipCertificateTemporalChecks: true,
      trustProfile: 'dev'
    }));
    assert.ok(issues.some(i => i.code === 'RECORD_SIGNATURE_INVALID'), 'Expected RECORD_SIGNATURE_INVALID');
  });

  it('should fail if device identity is missing', async () => {
    const envelope = await getValidEnvelope();
    delete envelope.device;

    const issues = await runWithBrowserCrypto(() => LukuFile.verifyEnvelope(envelope, { 
      allowUntrustedRoots: false,
      skipCertificateTemporalChecks: true,
      trustProfile: 'dev'
    }));
    assert.ok(issues.some(i => i.code === 'DEVICE_IDENTITY_MISSING'), 'Expected DEVICE_IDENTITY_MISSING');
  });

  it('should fail if DAC attestation is tampered', async () => {
    const envelope = await getValidEnvelope();
    envelope.attestation_intermediate_der = Buffer.from('bad_cert').toString('base64');

    const issues = await runWithBrowserCrypto(() => LukuFile.verifyEnvelope(envelope, { 
      allowUntrustedRoots: false,
      skipCertificateTemporalChecks: true,
      trustProfile: 'dev'
    }));
    assert.ok(issues.some(i => i.code === 'ATTESTATION_FAILED'), 'Expected ATTESTATION_FAILED');
  });

  it('should fail if canonical string is tampered', async () => {
    const envelope = await getValidEnvelope();
    envelope.canonical_string = 'tampered:canonical:string';

    const issues = await runWithBrowserCrypto(() => LukuFile.verifyEnvelope(envelope, { 
      allowUntrustedRoots: false,
      skipCertificateTemporalChecks: true,
      trustProfile: 'dev'
    }));
    assert.ok(issues.some(i => i.code === 'RECORD_SIGNATURE_INVALID'), 'Expected RECORD_SIGNATURE_INVALID');
  });
});
