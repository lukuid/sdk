// SPDX-License-Identifier: Apache-2.0
// Apps identify themselves through extra headers the SDK sends with LukuID requests.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RevocationManager } from '../src/revocation.js';

describe('extra headers', () => {
  it('are sent with the CRL request', async () => {
    const seen: Array<Record<string, string>> = [];
    const original = globalThis.fetch;
    globalThis.fetch = (async (_url: unknown, init?: RequestInit) => {
      seen.push({ ...((init?.headers as Record<string, string>) ?? {}) });
      return new Response('{}', { status: 500 });
    }) as typeof fetch;
    try {
      const manager = new RevocationManager({
        apiUrl: 'https://api.example.test',
        crlMemoryOnly: true,
        crlRefreshIntervalHours: 0,
        extraHeaders: { 'X-LukuID-App': 'web', 'X-LukuID-App-Version': '1.0.400' }
      });
      await manager.sync().catch(() => {});
    } finally {
      globalThis.fetch = original;
    }
    assert.equal(seen.length, 1);
    assert.equal(seen[0]['X-LukuID-App'], 'web');
    assert.equal(seen[0]['X-LukuID-App-Version'], '1.0.400');
  });
});
