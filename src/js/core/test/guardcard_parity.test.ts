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

describe('LukuID Environment Envelope Parity', () => {
  it('fails when DAC detached attestation signature fields are missing', async () => {
    const envelope = await getValidEnvelope();
    const identity = envelope.identity as JsonObject;
    delete envelope.attestation_dac_signature;
    delete envelope.attestation_signature;
    delete identity.dac_signature;
    delete identity.signature;

    const issues = await runWithBrowserCrypto(() => LukuFile.verifyEnvelope(envelope, {
      allowUntrustedRoots: false,
      skipCertificateTemporalChecks: true,
      trustProfile: 'dev'
    }));

    assert.ok(
      issues.some((issue) => issue.code === 'ATTESTATION_FAILED' && issue.message.includes('attestationSig missing')),
      `Expected attestationSig missing failure, got: ${JSON.stringify(issues)}`
    );
  });

  it('fails when a heartbeat signature is present without a trusted heartbeat timestamp', async () => {
    const envelope = await getValidEnvelope();
    const identity = envelope.identity as JsonObject;
    // envelope.heartbeat_signature is already present in the valid envelope
    delete identity.last_sync_utc;
    delete envelope.last_sync_utc;

    const issues = await runWithBrowserCrypto(() => LukuFile.verifyEnvelope(envelope, {
      allowUntrustedRoots: false,
      skipCertificateTemporalChecks: true,
      trustProfile: 'dev'
    }));

    assert.ok(
      issues.some((issue) => issue.code === 'ATTESTATION_FAILED' && issue.message.includes('Missing trusted heartbeat timestamp')),
      `Expected missing heartbeat timestamp failure, got: ${JSON.stringify(issues)}`
    );
  });

  it('fails when a heartbeat signature reuses the DAC payload signature even with a timestamp', async () => {
    const envelope = await getValidEnvelope();
    const identity = envelope.identity as JsonObject;
    envelope.heartbeat_signature = (identity.dac_signature ?? identity.signature) as string;
    identity.last_sync_utc = 1777286310;

    const issues = await runWithBrowserCrypto(() => LukuFile.verifyEnvelope(envelope, {
      allowUntrustedRoots: false,
      skipCertificateTemporalChecks: true,
      trustProfile: 'dev'
    }));

    assert.ok(
      issues.some((issue) => issue.code === 'ATTESTATION_FAILED' && issue.message.includes('SLAC (heartbeat)')),
      `Expected heartbeat signature verification failure, got: ${JSON.stringify(issues)}`
    );
  });

  it('fails when trusted heartbeat time is later than the record timestamp', async () => {
    const envelope = await getValidEnvelope();
    const identity = envelope.identity as JsonObject;
    // envelope.heartbeat_signature is already present in the valid envelope
    identity.last_sync_utc = 1781119207; // record timestamp is 1781119206 in valid_envelope.json

    const issues = await runWithBrowserCrypto(() => LukuFile.verifyEnvelope(envelope, {
      allowUntrustedRoots: false,
      skipCertificateTemporalChecks: true,
      trustProfile: 'dev'
    }));

    assert.ok(
      issues.some((issue) => issue.code === 'LAST_SYNC_AFTER_RECORD'),
      `Expected LAST_SYNC_AFTER_RECORD, got: ${JSON.stringify(issues)}`
    );
  });
});
