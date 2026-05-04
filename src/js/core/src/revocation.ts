// SPDX-License-Identifier: Apache-2.0
import forge from 'node-forge';

export interface RevocationManagerOptions {
  apiUrl: string;
  disableExternalCalls?: boolean;
  crlMemoryOnly?: boolean;
  crlCachePath?: string;
  crlRefreshIntervalHours?: number;
  debugLogging?: boolean;
}

export class RevocationManager {
  private revokedFingerprints: Set<string> = new Set();
  private lastSyncDate: string | null = null;
  private refreshInterval: any = null;

  constructor(private options: RevocationManagerOptions) {
    this.loadFromCache();
    this.startAutoRefresh();
  }

  private async loadFromCache() {
    if (this.options.crlMemoryOnly) return;
    
    // In Web/JS environment, we might use localStorage if no crlCachePath is provided
    if (typeof localStorage !== 'undefined') {
      try {
        const data = localStorage.getItem('lukuid_crl');
        if (data) {
          const json = JSON.parse(data);
          this.lastSyncDate = json.last_sync;
          if (Array.isArray(json.fingerprints)) {
            this.revokedFingerprints = new Set(json.fingerprints.map((f: string) => f.toLowerCase()));
          }
        }
      } catch (e) {
        this.debugLog('Failed to load CRL cache from localStorage', e);
      }
    }
  }

  private saveToCache() {
    if (this.options.crlMemoryOnly) return;

    if (typeof localStorage !== 'undefined') {
      try {
        const json = {
          last_sync: this.lastSyncDate,
          fingerprints: Array.from(this.revokedFingerprints)
        };
        localStorage.setItem('lukuid_crl', JSON.stringify(json));
      } catch (e) {
        this.debugLog('Failed to save CRL cache to localStorage', e);
      }
    }
  }

  private startAutoRefresh() {
    if (!this.options.crlRefreshIntervalHours || this.options.crlRefreshIntervalHours <= 0) return;

    const intervalMs = this.options.crlRefreshIntervalHours * 3600 * 1000;
    this.refreshInterval = setInterval(() => this.sync(), intervalMs);
    
    // Initial sync
    this.sync().catch(e => this.debugLog('Initial CRL sync failed', e));
  }

  public async sync() {
    if (this.options.disableExternalCalls) return;

    const apiUrl = this.options.apiUrl.replace(/\/+$/, '');
    let url = `${apiUrl}/revocations`;
    if (this.lastSyncDate) {
      url += `?from=${encodeURIComponent(this.lastSyncDate)}`;
    }

    try {
      const response = await fetch(url);
      if (response.status === 200) {
        const json = await response.json();
        if (Array.isArray(json.revocations)) {
          for (const item of json.revocations) {
            if (item.identifier) {
              this.revokedFingerprints.add(item.identifier.toLowerCase());
            }
          }
        }
        this.lastSyncDate = new Date().toISOString();
        this.saveToCache();
        this.debugLog(`CRL synced successfully: ${this.revokedFingerprints.size} items`);
      } else if (response.status !== 304) {
        this.debugLog(`CRL sync failed with status: ${response.status}`);
      }
    } catch (e) {
      this.debugLog('CRL sync error', e);
    }
  }

  public isRevoked(cert: any): boolean {
    const fingerprint = this.getFingerprint(cert);
    return this.revokedFingerprints.has(fingerprint.toLowerCase());
  }

  private getFingerprint(cert: any): String {
    // For Ed25519, we need to extract the raw bytes.
    // forge might not support Ed25519 natively in a way that is easy to extract.
    // In LukuID JS SDK, we often use noble-forge or similar.
    
    // Fallback: extract public key bytes from SPKI
    const f = forge as any;
    try {
        const spkiDer = f.asn1.toDer(f.pki.publicKeyToAsn1(cert.publicKey)).getBytes();
        const asn1 = f.asn1.fromDer(spkiDer);
        // SPKI: SEQUENCE { algorithm SEQUENCE { oid OID, params ANY }, publicKey BIT STRING }
        const publicKeyBitString = asn1.value[1].value;
        const rawBytes = publicKeyBitString.slice(1); // Drop unused bits byte
        
        const md = f.md.sha256.create();
        md.update(rawBytes);
        return md.digest().toHex();
    } catch (e) {
        // Fallback to full cert hash
        const der = f.asn1.toDer(f.pki.certificateToAsn1(cert)).getBytes();
        const md = f.md.sha256.create();
        md.update(der);
        return md.digest().toHex();
    }
  }

  private debugLog(message: string, error?: any) {
    if (this.options.debugLogging) {
      console.debug(`[RevocationManager] ${message}`, error || '');
    }
  }

  public close() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
}
