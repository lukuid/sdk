const fs = require('fs');
let code = fs.readFileSync('src/attestation.ts', 'utf8');

const regex = /try\s*\{\s*if\s*\(typeof crypto !== 'undefined' && 'verify' in crypto\)\s*\{[\s\S]*?\}\s*\}\s*catch\s*\{\}/;
const replacement = `try {
      if (typeof crypto !== 'undefined' && 'verify' in crypto) {
          const keyObj = { key: spki, format: 'der', type: 'spki' };
          try { if ((crypto as any).verify(null, tbs, keyObj, signature)) return true; } catch (e) { console.error('fallback err null:', e.message); }
          try { if ((crypto as any).verify('SHA256', tbs, keyObj, signature)) return true; } catch (e) { console.error('fallback err sha256:', e.message); }
      }
  } catch (e) { console.error('outer', e.message); }`;
code = code.replace(regex, replacement);
fs.writeFileSync('src/attestation.ts', code);
