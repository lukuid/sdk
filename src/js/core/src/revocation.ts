// SPDX-License-Identifier: Apache-2.0
import forge, { pki, asn1 } from 'node-forge';
import { validateCertificateChain, verifyPayloadSignatureWithSpki } from './attestation.js';

export interface RevocationManagerOptions {
  apiUrl: string;
  disableExternalCalls?: boolean;
  crlMemoryOnly?: boolean;
  crlCachePath?: string;
  crlRefreshIntervalHours?: number;
  debugLogging?: boolean;
  trustProfile?: string;
}

interface SignedSnapshot {
  payload: string;
  signature: string;
  certificate_chain: string;
}

const requests = new Map<string, Promise<SignedSnapshot>>();
const sharedSnapshots = new Map<string, { snapshot: SignedSnapshot; checkedAt: number }>();
const CACHE_KEY = 'lukuid_crl_v2';

function certificateSpki(cert: pki.Certificate): asn1.Asn1 {
  const certificate = forge.pki.certificateToAsn1(cert);
  const tbs = (certificate.value as asn1.Asn1[])[0];
  const fields = tbs.value as asn1.Asn1[];
  return fields[fields[0].tagClass === 128 ? 6 : 5];
}

export class RevocationManager {
  private revokedFingerprints = new Set<string>();
  private lastSync = 0;
  private generatedAt = 0;
  private refreshInterval: ReturnType<typeof setInterval> | null = null;
  private readonly ready: Promise<void>;

  constructor(private options: RevocationManagerOptions) {
    this.ready = this.loadFromCache();
    const hours = options.crlRefreshIntervalHours ?? 4;
    if (hours > 0 && !options.disableExternalCalls) {
      const intervalMs = hours * 3600 * 1000;
      this.refreshInterval = setInterval(() => { void this.sync().catch(e => this.debugLog('CRL sync failed', e)); }, intervalMs);
      void this.ready.then(() => this.sync()).catch(e => this.debugLog('Initial CRL sync failed', e));
    }
  }

  private cacheKey(): string {
    return `${CACHE_KEY}:${this.options.apiUrl.replace(/\/+$/, '')}:${this.options.trustProfile ?? 'prod'}`;
  }

  private async loadFromCache(): Promise<void> {
    if (this.options.crlMemoryOnly || typeof localStorage === 'undefined') return;
    try {
      const value = localStorage.getItem(this.cacheKey());
      if (!value) return;
      const cached = JSON.parse(value) as { snapshot: SignedSnapshot; checkedAt: number };
      await this.applySnapshot(cached.snapshot);
      this.lastSync = Number.isFinite(cached.checkedAt) && cached.checkedAt <= Date.now() + 300000 ? cached.checkedAt : 0;
    } catch (error) {
      this.debugLog('Rejected CRL cache', error);
    }
  }

  private async applySnapshot(snapshot: SignedSnapshot): Promise<void> {
    if (!snapshot || typeof snapshot.payload !== 'string' || typeof snapshot.signature !== 'string' || typeof snapshot.certificate_chain !== 'string') {
      throw new Error('Malformed signed CRL');
    }
    const payloadBytes = forge.util.decode64(snapshot.payload);
    if (forge.util.encode64(payloadBytes).replace(/=+$/, '') !== snapshot.payload.replace(/=+$/, '')) throw new Error('Invalid CRL payload encoding');
    const payload = new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(payloadBytes, ch => ch.charCodeAt(0)));
    const data = JSON.parse(payload) as { version?: number; generated_at?: string; revoked_fingerprints?: unknown };
    const generated = Date.parse(data.generated_at ?? '');
    if (data.version !== 1 || !Number.isFinite(generated) || generated > Date.now() + 300000 || generated < Date.now() - 86400000 || !Array.isArray(data.revoked_fingerprints) || !data.revoked_fingerprints.every(f => typeof f === 'string' && /^[a-f0-9]{64}$/.test(f))) {
      throw new Error('Invalid signed CRL payload');
    }
    const chain = await validateCertificateChain({ certificateChain: snapshot.certificate_chain, created: Math.floor(generated / 1000), trustProfile: this.options.trustProfile ?? 'prod' });
    if (!chain.ok) throw new Error(`CRL signing chain rejected: ${chain.reason}`);
    const leafPem = snapshot.certificate_chain.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/)?.[0];
    if (!leafPem) throw new Error('Missing CRL signing certificate');
    const leaf = forge.pki.certificateFromPem(leafPem);
    const spki = forge.asn1.toDer(certificateSpki(leaf)).getBytes();
    const spkiBytes = Uint8Array.from(spki, ch => ch.charCodeAt(0));
    const verified = await verifyPayloadSignatureWithSpki(spkiBytes, snapshot.signature, payload);
    if (!verified.ok) throw new Error(`CRL signature rejected: ${verified.reason}`);
    this.revokedFingerprints = new Set(data.revoked_fingerprints as string[]);
    this.generatedAt = generated;
  }

  public async sync(): Promise<void> {
    if (this.options.disableExternalCalls) return;
    await this.ready;
    const intervalMs = (this.options.crlRefreshIntervalHours ?? 4) * 3600 * 1000;
    const apiUrl = this.options.apiUrl.replace(/\/+$/, '');
    const sharedKey = `${apiUrl}:${this.options.trustProfile ?? 'prod'}`;
    const shared = sharedSnapshots.get(sharedKey);
    if (shared && Date.now() - shared.checkedAt < intervalMs) {
      await this.applySnapshot(shared.snapshot);
      this.lastSync = shared.checkedAt;
      return;
    }
    if (intervalMs > 0 && Date.now() - this.lastSync < intervalMs) return;
    let request = requests.get(apiUrl);
    if (!request) {
      request = fetch(`${apiUrl}/crl`).then(async response => {
        if (!response.ok) throw new Error(`CRL HTTP ${response.status}`);
        return response.json() as Promise<SignedSnapshot>;
      });
      requests.set(apiUrl, request);
      void request.finally(() => { requests.delete(apiUrl); }).catch(() => {});
    }
    const snapshot = await request;
    await this.applySnapshot(snapshot);
    const checkedAt = Date.now();
    this.lastSync = checkedAt;
    sharedSnapshots.set(sharedKey, { snapshot, checkedAt });
    if (!this.options.crlMemoryOnly && typeof localStorage !== 'undefined') {
      localStorage.setItem(this.cacheKey(), JSON.stringify({ snapshot, checkedAt }));
    }
  }

  public isRevoked(cert: pki.Certificate): boolean {
    const parsedAsn1 = certificateSpki(cert);
    const bitString = (parsedAsn1.value as asn1.Asn1[])[1].value as string;
    if (bitString.charCodeAt(0) !== 0) throw new Error('Invalid certificate public key');
    const digest = forge.md.sha256.create();
    digest.update(bitString.slice(1));
    return this.revokedFingerprints.has(digest.digest().toHex());
  }

  public hasVerifiedSnapshot(): boolean {
    return this.lastSync > 0 && this.generatedAt >= Date.now() - 86400000;
  }

  public close(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    this.refreshInterval = null;
  }

  private debugLog(message: string, error?: unknown): void {
    if (this.options.debugLogging) console.debug(`[RevocationManager] ${message}`, error ?? '');
  }
}
