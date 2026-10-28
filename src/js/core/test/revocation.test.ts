import assert from 'node:assert/strict';
import { test } from 'node:test';
import { RevocationManager } from '../src/revocation.js';

test('rejects an unsigned CRL and fails closed without a verified snapshot', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ revocations: [] }), { status: 200 });
  try {
    const manager = new RevocationManager({ apiUrl: 'https://crl-invalid.test', crlRefreshIntervalHours: 0, crlMemoryOnly: true });
    await assert.rejects(manager.sync(), /Malformed signed CRL/);
    assert.equal(manager.hasVerifiedSnapshot(), false);
    manager.close();
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('shares one request across concurrent SDK revocation managers', async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    await new Promise(resolve => setTimeout(resolve, 10));
    return new Response(JSON.stringify({ revocations: [] }), { status: 200 });
  };
  try {
    const first = new RevocationManager({ apiUrl: 'https://crl-shared.test', crlRefreshIntervalHours: 0, crlMemoryOnly: true });
    const second = new RevocationManager({ apiUrl: 'https://crl-shared.test', crlRefreshIntervalHours: 0, crlMemoryOnly: true });
    const results = await Promise.allSettled([first.sync(), second.sync()]);
    assert.equal(calls, 1);
    assert.ok(results.every(result => result.status === 'rejected'));
    first.close();
    second.close();
  } finally {
    globalThis.fetch = originalFetch;
  }
});
