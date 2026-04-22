// SPDX-License-Identifier: Apache-2.0
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SPDX_HEADER = '// SPDX-License-Identifier: Apache-2.0\n';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const coreDir = path.join(repoRoot, 'src/js/core');
const protoCandidates = [
  path.join(repoRoot, 'lukuid.proto'),
  path.resolve(repoRoot, '../lukuid.proto'),
  path.join(repoRoot, 'src/android/lukuid-sdk/src/main/proto/lukuid.proto')
];
const protoPath = protoCandidates.find((candidate) => existsSync(candidate));
if (!protoPath) {
  throw new Error(`Unable to locate lukuid.proto from ${repoRoot}`);
}
const jsOut = path.join(coreDir, 'src/lukuid.pb.js');
const dtsOut = path.join(coreDir, 'src/lukuid.pb.d.ts');

execFileSync('pbjs', ['-t', 'static-module', '-w', 'es6', '-o', jsOut, protoPath], {
  cwd: coreDir,
  stdio: 'inherit'
});

execFileSync('pbts', ['-o', dtsOut, jsOut], {
  cwd: coreDir,
  stdio: 'inherit'
});

for (const output of [jsOut, dtsOut]) {
  const content = readFileSync(output, 'utf8');
  if (!content.startsWith(SPDX_HEADER)) {
    writeFileSync(output, `${SPDX_HEADER}${content}`);
  }
}
