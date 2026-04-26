// SPDX-License-Identifier: Apache-2.0
import forge from 'node-forge';

export interface DeviceAttestationInputs {
  id: string;
  key: string;
  attestationSig: string;
  certificateChain?: string;
  created?: number; // Unix timestamp
  attestationAlg?: string;
  attestationPayloadVersion?: number;
  trustProfile?: string;
}

export interface DeviceAttestationResult {
  ok: boolean;
  reason?: string;
}

export interface ExternalIdentityInputs {
  endorserId: string;
  rootFingerprint: string;
  certChainDer: string[];
  signature: string;
  expectedPayload: string;
  trustedFingerprints: string[];
}

// Trusted Root Certificates (PEM)
const TRUSTED_ROOT_CERTS_PEM = [
  `-----BEGIN CERTIFICATE-----
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
DxQWGRk=
-----END CERTIFICATE-----`
];

const textEncoder = new TextEncoder();

function binaryStringToBytes(value: string): Uint8Array {
  const bytes = new Uint8Array(value.length);
  for (let i = 0; i < value.length; i++) {
    bytes[i] = value.charCodeAt(i);
  }
  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function decodeBase64(value: string): Uint8Array | null {
  try {
    const normalized = value.replace(/\s+/g, '');
    if (typeof globalThis !== 'undefined' && 'Buffer' in globalThis) {
      return Uint8Array.from((globalThis as any).Buffer.from(normalized, 'base64'));
    }
    const binString = atob(normalized);
    const bytes = new Uint8Array(binString.length);
    for (let i = 0; i < binString.length; i++) {
      bytes[i] = binString.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

interface ParsedCertificate {
  subjectOrganizationalUnits: string[];
  validFrom: number;
  validTo: number;
  spkiDer: Uint8Array;
}

interface DerElement {
  tag: number;
  start: number;
  headerLength: number;
  contentStart: number;
  contentEnd: number;
  end: number;
}

function readDerElement(bytes: Uint8Array, start: number): DerElement {
  if (start >= bytes.length) {
    throw new Error('Unexpected end of DER input');
  }

  const tag = bytes[start];
  const lengthOctet = bytes[start + 1];
  if (lengthOctet === undefined) {
    throw new Error('Invalid DER length');
  }

  let length = 0;
  let lengthBytes = 1;
  if ((lengthOctet & 0x80) === 0) {
    length = lengthOctet;
  } else {
    const count = lengthOctet & 0x7f;
    if (count === 0 || count > 4) {
      throw new Error('Unsupported DER length encoding');
    }
    lengthBytes += count;
    if (start + 1 + count >= bytes.length) {
      throw new Error('Truncated DER length');
    }
    for (let index = 0; index < count; index += 1) {
      length = (length << 8) | bytes[start + 2 + index];
    }
  }

  const headerLength = 1 + lengthBytes;
  const contentStart = start + headerLength;
  const contentEnd = contentStart + length;
  if (contentEnd > bytes.length) {
    throw new Error('Truncated DER element');
  }

  return {
    tag,
    start,
    headerLength,
    contentStart,
    contentEnd,
    end: contentEnd
  };
}

function decodePemCertificate(pem: string): Uint8Array {
  const body = pem
    .replace(/-----BEGIN CERTIFICATE-----/g, '')
    .replace(/-----END CERTIFICATE-----/g, '')
    .replace(/\s+/g, '');
  const der = decodeBase64(body);
  if (!der) {
    throw new Error('Invalid certificate PEM');
  }
  return der;
}

function decodeDerOid(bytes: Uint8Array): string {
  if (bytes.length === 0) {
    throw new Error('Invalid DER OID');
  }

  const values: number[] = [];
  const first = bytes[0];
  values.push(Math.floor(first / 40));
  values.push(first % 40);

  let value = 0;
  for (let index = 1; index < bytes.length; index += 1) {
    value = (value << 7) | (bytes[index] & 0x7f);
    if ((bytes[index] & 0x80) === 0) {
      values.push(value);
      value = 0;
    }
  }

  return values.join('.');
}

function decodeDerString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

function parseDerTime(bytes: Uint8Array, tag: number): number {
  const value = decodeDerString(bytes);
  if (tag === 0x17) {
    const match = /^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z$/.exec(value);
    if (!match) {
      throw new Error(`Invalid UTCTime: ${value}`);
    }
    const year = Number(match[1]);
    return Date.UTC(year >= 50 ? 1900 + year : 2000 + year, Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]), Number(match[6])) / 1000;
  }
  if (tag === 0x18) {
    const match = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z$/.exec(value);
    if (!match) {
      throw new Error(`Invalid GeneralizedTime: ${value}`);
    }
    return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]), Number(match[6])) / 1000;
  }
  throw new Error(`Unsupported time tag 0x${tag.toString(16)}`);
}

function parseSubjectOrganizationalUnits(bytes: Uint8Array, nameElement: DerElement): string[] {
  const organizationalUnits: string[] = [];
  let cursor = nameElement.contentStart;

  while (cursor < nameElement.contentEnd) {
    const setElement = readDerElement(bytes, cursor);
    let setCursor = setElement.contentStart;
    while (setCursor < setElement.contentEnd) {
      const attribute = readDerElement(bytes, setCursor);
      let attrCursor = attribute.contentStart;
      const oid = readDerElement(bytes, attrCursor);
      attrCursor = oid.end;
      const value = readDerElement(bytes, attrCursor);
      if (decodeDerOid(bytes.slice(oid.contentStart, oid.contentEnd)) === '2.5.4.11') {
        organizationalUnits.push(decodeDerString(bytes.slice(value.contentStart, value.contentEnd)));
      }
      setCursor = attribute.end;
    }
    cursor = setElement.end;
  }

  return organizationalUnits;
}

function parseDerCertificate(certDer: Uint8Array): ParsedCertificate {
  const certificate = readDerElement(certDer, 0);
  if (certificate.tag !== 0x30) {
    throw new Error('Certificate is not a DER SEQUENCE');
  }

  const tbsCertificate = readDerElement(certDer, certificate.contentStart);
  if (tbsCertificate.tag !== 0x30) {
    throw new Error('TBSCertificate is not a DER SEQUENCE');
  }

  let cursor = tbsCertificate.contentStart;
  let elementIndex = 0;

  if (cursor < tbsCertificate.contentEnd) {
    const maybeVersion = readDerElement(certDer, cursor);
    if (maybeVersion.tag === 0xa0) {
      cursor = maybeVersion.end;
    }
  }

  while (cursor < tbsCertificate.contentEnd) {
    const element = readDerElement(certDer, cursor);
    if (elementIndex === 3) {
      const notBefore = readDerElement(certDer, element.contentStart);
      const notAfter = readDerElement(certDer, notBefore.end);
      const subject = readDerElement(certDer, element.end);
      const spki = readDerElement(certDer, subject.end);
      return {
        subjectOrganizationalUnits: parseSubjectOrganizationalUnits(certDer, subject),
        validFrom: parseDerTime(certDer.slice(notBefore.contentStart, notBefore.contentEnd), notBefore.tag),
        validTo: parseDerTime(certDer.slice(notAfter.contentStart, notAfter.contentEnd), notAfter.tag),
        spkiDer: certDer.slice(spki.start, spki.end)
      };
    }
    cursor = element.end;
    elementIndex += 1;
  }

  throw new Error('Certificate metadata missing');
}

function parsePemChain(chainPem: string): ParsedCertificate[] {
  const matches = chainPem.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g) ?? [];
  return matches.map((pem) => parseDerCertificate(decodePemCertificate(pem)));
}

interface NodeLikeX509Certificate {
  subject: string;
  validFrom: string;
  validTo: string;
  publicKey: {
    export(options: { format: 'der'; type: 'spki' }): Uint8Array | ArrayBuffer;
  };
}

async function getNodeX509CertificateConstructor(): Promise<
  ((new (input: string | Uint8Array) => NodeLikeX509Certificate) & { prototype: NodeLikeX509Certificate }) | null
> {
  const processObject = (globalThis as Record<string, unknown>).process as
    | { versions?: { node?: string } }
    | undefined;
  if (!processObject?.versions?.node) {
    return null;
  }

  try {
    const dynamicImport = Function('return import("node:crypto")') as () => Promise<unknown>;
    const cryptoModule = (await dynamicImport()) as {
      X509Certificate?: (new (input: string | Uint8Array) => NodeLikeX509Certificate) & {
        prototype: NodeLikeX509Certificate;
      };
    };
    return cryptoModule.X509Certificate ?? null;
  } catch {
    return null;
  }
}

function getSubtleCrypto(): SubtleCrypto {
  const subtle = typeof crypto !== 'undefined' ? crypto.subtle : undefined;
  if (!subtle) {
    throw new Error('WebCrypto subtle API is not available');
  }
  return subtle;
}

export async function verifyDeviceAttestation(inputs: DeviceAttestationInputs): Promise<DeviceAttestationResult> {
  if (inputs.attestationSig.trim().length === 0) {
    return { ok: false, reason: 'Missing signature' };
  }

  const payloadString = `${inputs.id}:${inputs.key}`;
  
  // 1. Walk and Verify the Chain (if provided)
  let leafSpki: Uint8Array | null = null;

  if (inputs.certificateChain) {
    try {
      const requiredOu = (() => {
        switch (inputs.trustProfile) {
          case 'dev':
            return 'lukuid-dev';
          case 'test':
            return 'lukuid-test';
          case 'prod':
          default:
            return 'lukuid-production';
        }
      })();

      const nodeX509Certificate = await getNodeX509CertificateConstructor();
      if (nodeX509Certificate) {
        const certPems = inputs.certificateChain.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g) ?? [];
        const certs = certPems.map((pem) => new nodeX509Certificate(pem));
        if (certs.length === 0) {
          return { ok: false, reason: 'Invalid certificate chain PEM' };
        }

        const exportedSpki = certs[0].publicKey.export({ format: 'der', type: 'spki' });
        leafSpki = exportedSpki instanceof Uint8Array ? exportedSpki : new Uint8Array(exportedSpki);

        const hasValidProfile = certs.slice(1).some((cert) => cert.subject.includes(requiredOu));
        if (!hasValidProfile) {
          return {
            ok: false,
            reason: `Certificate chain does not match the requested trust profile: ${inputs.trustProfile ?? 'prod'}`
          };
        }

        // Verify signatures along the chain
        const forgeCerts = certPems.map((pem) => forge.pki.certificateFromPem(pem));
        const forgeTrustedRoots = TRUSTED_ROOT_CERTS_PEM.map((pem) => forge.pki.certificateFromPem(pem));

        for (let i = 0; i < forgeCerts.length; i++) {
          const current = forgeCerts[i];
          let verified = false;

          if (i + 1 < forgeCerts.length) {
            const next = forgeCerts[i + 1];
            try {
              verified = current.verify(next);
            } catch {
              verified = false;
            }
          } else {
            for (const root of forgeTrustedRoots) {
              try {
                verified = current.verify(root) || (root as any).fingerprint === (current as any).fingerprint;
              } catch {
                continue;
              }
              if (verified) break;
            }
          }

          if (!verified) {
            return { ok: false, reason: `Certificate chain verification failed at level ${i}` };
          }
        }

        if (inputs.created) {
          for (const cert of certs) {
            const validFrom = Date.parse(cert.validFrom) / 1000;
            const validTo = Date.parse(cert.validTo) / 1000;
            if (inputs.created < validFrom || inputs.created > validTo) {
              return { ok: false, reason: `Temporal birth check failed: created (${inputs.created}) is outside cert window [${validFrom} - ${validTo}]` };
            }
          }
        }
      } else {
        const certs = parsePemChain(inputs.certificateChain);
        if (certs.length === 0) {
          return { ok: false, reason: 'Invalid certificate chain PEM' };
        }

        leafSpki = certs[0].spkiDer;

        const hasValidProfile = certs.slice(1).some((cert) => cert.subjectOrganizationalUnits.includes(requiredOu));

        if (!hasValidProfile) {
          return {
            ok: false,
            reason: `Certificate chain does not match the requested trust profile: ${inputs.trustProfile ?? 'prod'}`
          };
        }

        const certPems = inputs.certificateChain.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g) ?? [];
        const forgeCerts = certPems.map((pem) => forge.pki.certificateFromPem(pem));
        const forgeTrustedRoots = TRUSTED_ROOT_CERTS_PEM.map((pem) => forge.pki.certificateFromPem(pem));

        for (let i = 0; i < forgeCerts.length; i++) {
          const current = forgeCerts[i];
          let stepVerified = false;

          if (i + 1 < forgeCerts.length) {
            const next = forgeCerts[i + 1];
            try {
              stepVerified = current.verify(next);
            } catch {
              stepVerified = false;
            }
          } else {
            for (const root of forgeTrustedRoots) {
              try {
                stepVerified = current.verify(root) || (root as any).fingerprint === (current as any).fingerprint;
              } catch {
                continue;
              }
              if (stepVerified) break;
            }
          }

          if (!stepVerified) {
            return { ok: false, reason: `Certificate chain verification failed at level ${i}` };
          }
        }

        if (inputs.created) {
          for (const cert of certs) {
            const validFrom = cert.validFrom;
            const validTo = cert.validTo;

            if (inputs.created < validFrom || inputs.created > validTo) {
              return { ok: false, reason: `Temporal birth check failed: created (${inputs.created}) is outside cert window [${validFrom} - ${validTo}]` };
            }
          }
        }
      }
    } catch (error) {
      return { ok: false, reason: `Chain processing error: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  // 2. Verify Signature
  if (leafSpki) {
    try {
      const signature = decodeBase64(inputs.attestationSig);
      if (!signature) return { ok: false, reason: 'Invalid signature base64' };
      const subtle = getSubtleCrypto();
      const importedKey = await subtle.importKey('spki', toArrayBuffer(leafSpki), { name: 'Ed25519' }, false, ['verify']);
      const verified = await subtle.verify('Ed25519', importedKey, toArrayBuffer(signature), toArrayBuffer(textEncoder.encode(payloadString)));
      return verified
        ? { ok: true }
        : { ok: false, reason: 'Signature verification failed against leaf' };
    } catch (error) {
      return { ok: false, reason: `Leaf verification error: ${error instanceof Error ? error.message : String(error)}` };
    }
  } else {
    // Legacy fallback
    const subtle = getSubtleCrypto();
    const signature = decodeBase64(inputs.attestationSig);
    if (!signature) return { ok: false, reason: 'Invalid signature base64' };
    const payload = toArrayBuffer(textEncoder.encode(payloadString));

    for (const rootPem of TRUSTED_ROOT_CERTS_PEM) {
      try {
        const root = forge.pki.certificateFromPem(rootPem);
        const spki = toArrayBuffer(binaryStringToBytes(
          forge.asn1.toDer(forge.pki.publicKeyToAsn1(root.publicKey)).getBytes()
        ));
        
        const importedKey = await subtle.importKey(
          'spki',
          spki,
          { name: 'Ed25519' },
          false,
          ['verify']
        );

        if (await subtle.verify({ name: 'Ed25519' }, importedKey, toArrayBuffer(signature), payload)) {
          return { ok: true };
        }
      } catch { continue; }
    }
  }

  return { ok: false, reason: 'Attestation verification failed' };
}

export async function verifyExternalIdentity(inputs: ExternalIdentityInputs): Promise<DeviceAttestationResult> {
  const signatureBytes = decodeBase64(inputs.signature);
  if (!signatureBytes) {
    return { ok: false, reason: 'Invalid signature base64' };
  }

  if (inputs.certChainDer.length === 0) {
    return { ok: false, reason: 'Certificate chain is empty' };
  }

  let leafSpki: Uint8Array | null = null;
  let lastCertDer: Uint8Array | null = null;

  try {
    const nodeX509Certificate = await getNodeX509CertificateConstructor();
    if (nodeX509Certificate) {
      const certs = inputs.certChainDer.map((der) => {
        const bytes = decodeBase64(der);
        if (!bytes) throw new Error('Invalid base64 in cert_chain_der');
        return new nodeX509Certificate(bytes);
      });

      const exportedSpki = certs[0].publicKey.export({ format: 'der', type: 'spki' });
      leafSpki = exportedSpki instanceof Uint8Array ? exportedSpki : new Uint8Array(exportedSpki);
      
      const lastCertBytes = decodeBase64(inputs.certChainDer[inputs.certChainDer.length - 1]);
      if (lastCertBytes) {
        lastCertDer = lastCertBytes;
      }
    } else {
      const certs = inputs.certChainDer.map((der) => {
        const bytes = decodeBase64(der);
        if (!bytes) throw new Error('Invalid base64 in cert_chain_der');
        return parseDerCertificate(bytes);
      });

      leafSpki = certs[0].spkiDer;
      lastCertDer = decodeBase64(inputs.certChainDer[inputs.certChainDer.length - 1]);
    }
  } catch (error) {
    return { ok: false, reason: `Certificate processing error: ${error instanceof Error ? error.message : String(error)}` };
  }

  if (!lastCertDer) {
    return { ok: false, reason: 'Failed to process root certificate' };
  }

  const actualRootFingerprint = await sha256Hex(lastCertDer);
  if (actualRootFingerprint.toLowerCase() !== inputs.rootFingerprint.toLowerCase()) {
    return { ok: false, reason: `Root fingerprint mismatch: expected ${inputs.rootFingerprint}, got ${actualRootFingerprint}` };
  }

  let isTrusted = inputs.trustedFingerprints.map((f) => f.toLowerCase()).includes(actualRootFingerprint.toLowerCase());

  if (!isTrusted) {
    for (const rootPem of TRUSTED_ROOT_CERTS_PEM) {
      try {
        const rootDer = decodePemCertificate(rootPem);
        const rootFingerprint = await sha256Hex(rootDer);
        if (rootFingerprint === actualRootFingerprint.toLowerCase()) {
          // Check for OID 1.3.6.1.4.1.65432.1.4 in the leaf certificate
          const leafBytes = decodeBase64(inputs.certChainDer[0]);
          if (leafBytes) {
            const f = forge as any;
            const cert = f.pki.certificateFromAsn1(f.asn1.fromDer(f.util.createBuffer(leafBytes)));
            const ext = cert.getExtension('1.3.6.1.4.1.65432.1.4');
            if (ext) {
              isTrusted = true;
              break;
            }
          }
        }
      } catch {
        continue;
      }
    }
  }

  if (!isTrusted) {
    return { ok: false, reason: `Root fingerprint ${actualRootFingerprint} is not in the trusted list` };
  }

  try {
    const subtle = getSubtleCrypto();
    const importedKey = await subtle.importKey('spki', toArrayBuffer(leafSpki!), { name: 'Ed25519' }, false, ['verify']);
    const verified = await subtle.verify('Ed25519', importedKey, toArrayBuffer(signatureBytes), toArrayBuffer(textEncoder.encode(inputs.expectedPayload)));
    return verified
      ? { ok: true }
      : { ok: false, reason: 'External identity signature verification failed' };
  } catch (error) {
    return { ok: false, reason: `External identity verification error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

async function sha256Hex(data: Uint8Array): Promise<string> {
  const digest = await getSubtleCrypto().digest('SHA-256', toArrayBuffer(data));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function encodeBase64(bytes: Uint8Array): string {
  if (typeof globalThis !== 'undefined' && 'Buffer' in globalThis) {
    return (globalThis as any).Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
