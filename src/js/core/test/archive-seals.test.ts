// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import { it } from 'node:test';
import { webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { strFromU8, unzipSync, zipSync } from 'fflate';
import { LukuFile } from '../src/index.js';

if (!globalThis.crypto) globalThis.crypto = webcrypto as Crypto;

it('exports and verifies a mandatory ML-DSA-65 self seal without a browser platform seal', async () => {
  const pair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']) as CryptoKeyPair;
  const publicKey = Buffer.from(new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey))).toString('base64');
  const archive = await LukuFile.exportWithIdentity([], { device_id: 'SEAL-TEST', public_key: publicKey }, {}, pair);
  const bytes = await archive.saveToBytes();
  const entries = unzipSync(bytes);
  assert.ok(entries['seals.json']);
  const sealsFile = JSON.parse(strFromU8(entries['seals.json']));
  assert.equal(sealsFile.seals[0].type, 'self');
  assert.equal(sealsFile.seals[0].alg, 'ML-DSA-65');
  assert.equal(sealsFile.seals.some((seal: { type: string }) => seal.type === 'platform'), false);
  const reopened = await LukuFile.openBytes(bytes);
  const issues = await reopened.verify();
  assert.equal(issues.some((entry) => entry.code === 'ARCHIVE_SELF_SEAL_INVALID' || entry.code === 'ARCHIVE_SELF_SEAL_MISSING'), false);

  const corrupted = { ...sealsFile, seals: [{ ...sealsFile.seals[0], signature: Buffer.alloc(10).toString('base64') }] };
  const corruptedArchive = zipSync({
    ...entries,
    'seals.json': [new TextEncoder().encode(JSON.stringify(corrupted)), { level: 6 }]
  });
  const corruptedFile = await LukuFile.openBytes(corruptedArchive);
  const corruptedIssues = await corruptedFile.verify();
  assert.ok(corruptedIssues.some((entry) => entry.code === 'ARCHIVE_SELF_SEAL_INVALID'));
  await assert.rejects(() => corruptedFile.saveToBytes(), /valid archive self seal/);
});

it('verifies the shared self-only archive fixture and reports missing seals', async () => {
  const bytes = readFileSync(new URL('../../../../samples/dotluku/sealed-self-only.luku', import.meta.url));
  const archive = await LukuFile.openBytes(bytes);
  assert.equal((await archive.verify()).some((entry) => entry.code.startsWith('ARCHIVE_')), false);
  const entries = unzipSync(bytes);
  delete entries['seals.json'];
  const unsealed = await LukuFile.openBytes(zipSync(entries));
  assert.ok((await unsealed.verify()).some((entry) => entry.code === 'ARCHIVE_SEALS_MISSING'));
});

it('reports unsupported platform seals and rejects malformed ones', async () => {
  const bytes = readFileSync(new URL('../../../../samples/dotluku/sealed-self-only.luku', import.meta.url));
  const entries = unzipSync(bytes);
  const root = JSON.parse(strFromU8(entries['seals.json']));
  root.seals.push({
    type: 'platform', platform: 'future-platform', alg: 'ES256',
    created_at_utc: root.seals[0].created_at_utc, public_key: 'AA==', signature: 'AA=='
  });
  const unsupported = await LukuFile.openBytes(zipSync({ ...entries, 'seals.json': new TextEncoder().encode(JSON.stringify(root)) }));
  assert.ok((await unsupported.verify()).some((entry) => entry.code === 'ARCHIVE_PLATFORM_SEAL_UNSUPPORTED'));
  root.seals[1].created_at_utc += 1;
  const mismatchedTimestamp = await LukuFile.openBytes(zipSync({ ...entries, 'seals.json': new TextEncoder().encode(JSON.stringify(root)) }));
  assert.ok((await mismatchedTimestamp.verify()).some((entry) => entry.code === 'ARCHIVE_SEALS_MALFORMED'));
  root.seals[1].created_at_utc -= 1;
  const noSelf = await LukuFile.openBytes(zipSync({ ...entries, 'seals.json': new TextEncoder().encode(JSON.stringify({ ...root, seals: [root.seals[1]] })) }));
  assert.ok((await noSelf.verify()).some((entry) => entry.code === 'ARCHIVE_SELF_SEAL_MISSING'));
  root.seals[1].platform = 'android';
  const malformed = await LukuFile.openBytes(zipSync({ ...entries, 'seals.json': new TextEncoder().encode(JSON.stringify(root)) }));
  assert.ok((await malformed.verify()).some((entry) => entry.code === 'ARCHIVE_SEALS_MALFORMED'));
});

it('rejects invalid UTF-8 before computing the manifest commitment', async () => {
  const bytes = readFileSync(new URL('../../../../samples/dotluku/sealed-self-only.luku', import.meta.url));
  const entries = unzipSync(bytes);
  await assert.rejects(() => LukuFile.openBytes(zipSync({ ...entries, 'manifest.json': Uint8Array.of(0xff) })));
  await assert.rejects(() => LukuFile.openBytes(zipSync({ ...entries, 'seals.json': Uint8Array.of(0xff) })));
});
