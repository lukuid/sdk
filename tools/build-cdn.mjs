#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
import { build } from 'esbuild';
import { mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(currentDir, '..');
const entryPoint = resolve(workspaceRoot, 'src/js/sdk/src/lukuid-sdk.global.ts');
const outDir = resolve(workspaceRoot, 'dist-cdn');
const outFile = resolve(outDir, 'lukuid-sdk.global.js');
const minifiedOutFile = resolve(outDir, 'lukuid.global.min.js');

async function prepareOutput() {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
}

async function buildCdnBundle() {
  const commonOptions = {
    entryPoints: [entryPoint],
    bundle: true,
    format: 'iife',
    globalName: 'LukuID',
    platform: 'browser',
    target: ['es2020'],
    tsconfig: resolve(workspaceRoot, 'src/js/sdk/tsconfig.json'),
    define: {
      'process.env.NODE_ENV': JSON.stringify('production')
    },
    external: ['@lukuid/transport-serial-node', '@lukuid/transport-ble-node', '@abandonware/noble', 'serialport', 'node:*']
  };

  await Promise.all([
    build({
      ...commonOptions,
      outfile: outFile,
      sourcemap: true,
      minify: false
    }),
    build({
      ...commonOptions,
      outfile: minifiedOutFile,
      sourcemap: true,
      minify: true
    })
  ]);
}

async function main() {
  await prepareOutput();
  await buildCdnBundle();
  console.log(`CDN bundles written to ${outDir}`);
}

main().catch((error) => {
  console.error('Failed to build CDN bundle');
  console.error(error);
  process.exit(1);
});
