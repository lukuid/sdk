// SPDX-License-Identifier: Apache-2.0
import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as crypto from 'crypto';
import { LukuFile, LukuVerifyOptions } from '../src/index.js';

describe('Animal Scan Metrics Integrity & Tamper Protection (JS)', () => {
  function generateKeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
    const pubRaw = publicKey.export({ type: 'spki', format: 'der' }).subarray(-32);
    const pubB64 = Buffer.from(pubRaw).toString('base64');
    return { privateKey, pubB64 };
  }

  function buildValidScanEnvelope(
    metrics: number[] = [38.5, 45.0, -65.0, 12.0, 5.0, 120.0, 2.0, 3300.0, 10.0, 11.0, 1.0, 2000.0, 50.0, 1.2, 1.0, 5.0, -2.0, 0.0],
    scanVersion = '1.0.0',
    profile = 'animal'
  ) {
    const { privateKey, pubB64 } = generateKeyPair();
    const deviceId = 'LUKUID-ANIMAL-READER-001';

    const payload: Record<string, unknown> = {
      ctr: 1001,
      timestamp_utc: 1770823456,
      uptime_us: 120000000,
      nonce: 'test_challenge_nonce',
      firmware: 'AR-v1.0.0',
      profile,
      protocol: 'FDX-B',
      scan_version: scanVersion,
      tag_id: '981098109810981',
      temperature_c: 38.5,
      metrics
    };

    const formattedMetrics = metrics.map((x) => x.toFixed(2)).join(',');
    const contentStr = `FDX-B:${scanVersion}:981098109810981:38.50`;
    const canonicalStr = `${deviceId}:${pubB64}:scan:SCAN-REC-001:1001:1770823456:120000000:${profile}:test_challenge_nonce:AR-v1.0.0:${contentStr}:${formattedMetrics}:`;

    const sig = crypto.sign(null, Buffer.from(canonicalStr, 'utf8'), privateKey);
    const sigB64 = sig.toString('base64');

    return {
      type: 'scan',
      id: 'SCAN-REC-001',
      version: '1.0.0',
      alg: 'ED25519',
      signature: sigB64,
      previous_signature: '',
      canonical_string: canonicalStr,
      device: {
        vendor: 'LUKUID',
        device_id: deviceId,
        public_key: pubB64
      },
      payload
    };
  }

  const opts: LukuVerifyOptions = { allowUntrustedRoots: true, trustProfile: 'dev' };

  it('proves metrics survive verification unchanged', async () => {
    const envelope = buildValidScanEnvelope();
    const issues = await LukuFile.verifyEnvelope(envelope, opts);
    const criticals = issues.filter((i) => i.criticality === 'critical');
    assert.strictEqual(criticals.length, 0, `Expected 0 critical issues, got ${JSON.stringify(criticals)}`);
  });

  it('fails closed when any single metric value is modified', async () => {
    const envelope = buildValidScanEnvelope();
    (envelope.payload as any).metrics[2] = -80.0; // Tamper RSSI
    const issues = await LukuFile.verifyEnvelope(envelope, opts);
    assert.ok(
      issues.some((i) => i.code === 'RECORD_CANONICAL_MISMATCH' && i.criticality === 'critical'),
      'Tampered metric value must trigger RECORD_CANONICAL_MISMATCH'
    );
  });

  it('fails closed when metrics are removed, inserted, reordered, or truncated', async () => {
    // Truncation / Removal
    const env1 = buildValidScanEnvelope();
    (env1.payload as any).metrics.pop();
    const issues1 = await LukuFile.verifyEnvelope(env1, opts);
    assert.ok(
      issues1.some((i) => i.code === 'RECORD_CANONICAL_MISMATCH'),
      'Metric removal must fail verification'
    );

    // Append / Insertion
    const env2 = buildValidScanEnvelope();
    (env2.payload as any).metrics.push(99.0);
    const issues2 = await LukuFile.verifyEnvelope(env2, opts);
    assert.ok(
      issues2.some((i) => i.code === 'RECORD_CANONICAL_MISMATCH'),
      'Metric insertion must fail verification'
    );

    // Reordering
    const env3 = buildValidScanEnvelope();
    const arr = (env3.payload as any).metrics;
    const temp = arr[0];
    arr[0] = arr[1];
    arr[1] = temp;
    const issues3 = await LukuFile.verifyEnvelope(env3, opts);
    assert.ok(
      issues3.some((i) => i.code === 'RECORD_CANONICAL_MISMATCH'),
      'Metric reordering must fail verification'
    );
  });

  it('fails closed on unknown scan profiles or schema versions', async () => {
    const envelope = buildValidScanEnvelope(undefined, '1.0.0', 'unknown_profile_v99');
    const issues = await LukuFile.verifyEnvelope(envelope, opts);
    assert.ok(
      issues.some((i) => i.code === 'RECORD_SCHEMA_UNRECOGNIZED' && i.criticality === 'critical'),
      'Unrecognized scan profile must trigger RECORD_SCHEMA_UNRECOGNIZED'
    );
  });
});
