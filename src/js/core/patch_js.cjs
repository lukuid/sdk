const fs = require('fs');
let code = fs.readFileSync('src/attestation.ts', 'utf8');

const regex = /try\s*\{\s*if\s*\(typeof crypto !== 'undefined' && 'verify' in crypto\)\s*\{[\s\S]*?\}\s*\}\s*catch\s*\{\}/;
const replacement = `try {
      if (typeof crypto !== 'undefined' && 'verify' in crypto) {
          const keyObj = { key: spki, format: 'der', type: 'spki' };
          try { if ((crypto as any).verify(null, tbs, keyObj, signature)) return true; } catch {}
          try { if ((crypto as any).verify('SHA256', tbs, keyObj, signature)) return true; } catch {}
      }
  } catch {}`;
code = code.replace(regex, replacement);

code = code.replace(/if \(await subtle\.verify\('Ed25519', key, toArrayBuffer\(signature\), toArrayBuffer\(tbs\)\)\) return true; else console\.log\('WEBCRYPTO VERIFY FALSE'\);/g, `if (await subtle.verify('Ed25519', key, toArrayBuffer(signature), toArrayBuffer(tbs))) return true;`);
code = code.replace(/\} catch\(e\) \{ console\.log\('WEBCRYPTO ERROR', e\); \}/g, `} catch {}`);

fs.writeFileSync('src/attestation.ts', code);
