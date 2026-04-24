// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { LukuFile } from '../src/index.js';
import { webcrypto } from 'node:crypto';

// Setup WebCrypto for Node environment if needed
if (!globalThis.crypto) {
  (globalThis as any).crypto = webcrypto;
}

describe('SDK Self-Test', () => {
  it('runs cryptographic self-tests and returns results', async () => {
    const results = await LukuFile.selfTest();
    assert.strictEqual(results.length, 9);
    
    for (const result of results) {
      console.log(`${result.alg} ${result.operation}\t${result.passed ? 'PASS' : 'FAIL'}\t${result.id}`);
      assert.strictEqual(result.passed, true, `Self-test failed for ${result.alg} ${result.operation}`);
    }
  });
});
