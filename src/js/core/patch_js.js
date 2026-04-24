const fs = require('fs');
let code = fs.readFileSync('src/attestation.ts', 'utf8');

// 1. Fix Node.js crypto fallback
code = code.replace(
  /if \(typeof crypto !== 'undefined' && 'verify' in crypto\) \{\n\s*if \(crypto\.verify\('SHA256', tbs, spki, signature\)\) return true;\n\s*\}/,
  `if (typeof crypto !== 'undefined' && 'verify' in crypto) {
          const keyObj = { key: spki, format: 'der' as const, type: 'spki' as const };
          try { if ((crypto as any).verify(null, tbs, keyObj, signature)) return true; } catch {}
          try { if ((crypto as any).verify('SHA256', tbs, keyObj, signature)) return true; } catch {}
      }`
);

// We need to also clean up any intermediate messes I made earlier:
code = code.replace(/try \{ if \(\(crypto as any\)\.verify\(null, tbs, keyObj, signature\)\) return true; \} catch \{\}\n\s*try \{ if \(\(crypto as any\)\.verify\('SHA256', tbs, keyObj, signature\)\) return true; \} catch \{\}\n\s*try \{ if \(crypto\.verify\('SHA256', tbs, spki, signature\)\) return true; \} catch \{\}/g, 
  `const keyObj = { key: spki, format: 'der' as const, type: 'spki' as const };
          try { if ((crypto as any).verify(null, tbs, keyObj, signature)) return true; } catch {}
          try { if ((crypto as any).verify('SHA256', tbs, keyObj, signature)) return true; } catch {}`);

// Also fix the previous sed command I ran:
code = code.replace(/if \(await subtle\.verify\('Ed25519', key, toArrayBuffer\(signature\), toArrayBuffer\(tbs\)\)\) return true; else console\.log\('WEBCRYPTO VERIFY FALSE'\);/g, `if (await subtle.verify('Ed25519', key, toArrayBuffer(signature), toArrayBuffer(tbs))) return true;`);
code = code.replace(/\} catch\(e\) \{ console\.log\('WEBCRYPTO ERROR', e\); \}/g, `} catch {}`);

fs.writeFileSync('src/attestation.ts', code);
