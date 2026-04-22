// SPDX-License-Identifier: Apache-2.0
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { verifyDeviceAttestation } from '../src/attestation.js';
import crypto from 'node:crypto';

// Polyfill webcrypto for Node test runner if needed (Node 19+ has it globally)
if (!globalThis.crypto) {
    globalThis.crypto = crypto as any;
}

// Generate a valid keypair and signature for testing
async function generateTestFixture() {
    const keyPair = await crypto.subtle.generateKey(
        { name: 'Ed25519' },
        true,
        ['sign', 'verify']
    );
    
    // BUT we need to sign with the ROOT PRIVATE KEY to pass verification.
    // The root public key is hardcoded in the source.
    // We cannot sign a valid payload unless we have the private key corresponding to the hardcoded public key.
    // Since I don't have the private key for the real root, I can only test:
    // 1. Failure cases (invalid sig, invalid payload)
    // 2. Mocking? No, I can't mock the internal implementation easily without DI.
    
    // However, for the purpose of this "Quest", maybe I should just verify the negative cases work.
    return {};
}

describe('Device Attestation', () => {
    it('fails with missing signature', async () => {
        const result = await verifyDeviceAttestation({
            id: 'u1',
            key: 'pk1',
            attestationSig: ''
        });
        assert.strictEqual(result.ok, false);
        assert.strictEqual(result.reason, 'Missing signature');
    });

    it('fails with invalid base64 signature', async () => {
        const result = await verifyDeviceAttestation({
            id: 'u1',
            key: 'pk1',
            attestationSig: 'not-base64!'
        });
        assert.strictEqual(result.ok, false);
    });

    it('fails with wrong length signature', async () => {
        // Base64 for 4 bytes
        const result = await verifyDeviceAttestation({
            id: 'u1',
            key: 'pk1',
            attestationSig: 'AAAAAA=='
        });
        assert.strictEqual(result.ok, false);
        assert.strictEqual(result.reason, 'Attestation verification failed');
    });

    it('fails verification with random signature', async () => {
        // 64 bytes of zeros
        const zeros = new Uint8Array(64);
        const sig = Buffer.from(zeros).toString('base64');
        const result = await verifyDeviceAttestation({
            id: 'u1',
            key: 'pk1',
            attestationSig: sig
        });
        assert.strictEqual(result.ok, false);
        assert.strictEqual(result.reason, 'Attestation verification failed');
    });
});
