// SPDX-License-Identifier: Apache-2.0
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { verifyDeviceAttestation } from '../src/attestation.js';
import crypto from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LukuFile, type JsonObject } from '../src/index.js';

// Polyfill webcrypto for Node test runner if needed (Node 19+ has it globally)
if (!globalThis.crypto) {
    globalThis.crypto = crypto as any;
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

function chunkBase64(value: string): string {
    return value.replace(/.{1,64}/g, (chunk) => `${chunk}\n`);
}

function pemFromDerBase64(value: unknown): string | undefined {
    if (typeof value !== 'string' || value.trim().length === 0) {
        return undefined;
    }
    return `-----BEGIN CERTIFICATE-----\n${chunkBase64(value.replace(/\s+/g, ''))}-----END CERTIFICATE-----\n`;
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

    it('verifies the shipped sample in browser mode with an Ed25519 DAC chain', async () => {
        const samplePath = path.join(samplesDir, 'first-passable-verification-sample.luku');
        const archive = await LukuFile.openBytes(new Uint8Array(await readFile(samplePath)));
        const block = archive.blocks[0];
        const record = block.batch[0];
        const identity = record.identity as JsonObject | undefined;
        const certificateChain = [
            pemFromDerBase64(block.attestation_dac_der),
            pemFromDerBase64(block.attestation_manufacturer_der),
            pemFromDerBase64(block.attestation_intermediate_der)
        ].filter((value): value is string => Boolean(value)).join('');

        const originalProcess = (globalThis as { process?: unknown }).process;
        try {
            Object.defineProperty(globalThis, 'process', {
                value: undefined,
                configurable: true,
                writable: true
            });

            const result = await verifyDeviceAttestation({
                id: typeof record.device_id === 'string' ? record.device_id : block.device.device_id,
                key: typeof record.public_key === 'string' ? record.public_key : block.device.public_key,
                attestationSig: typeof identity?.signature === 'string' ? identity.signature : '',
                certificateChain,
                trustProfile: 'dev'
            });
            assert.strictEqual(result.ok, true, result.reason);
        } finally {
            Object.defineProperty(globalThis, 'process', {
                value: originalProcess,
                configurable: true,
                writable: true
            });
        }
    });
});
