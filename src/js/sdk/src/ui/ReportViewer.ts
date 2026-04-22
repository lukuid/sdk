// SPDX-License-Identifier: Apache-2.0
import type { LukuidSdk } from '../sdk.js';
import type { JsonObject, JsonValue, LukuParseResult } from '@lukuid/core';

const CSS = `
:host {
  --luku-primary: #0071e3;
  --luku-bg: #f5f5f7;
  --luku-card: #ffffff;
  --luku-text: #1d1d1f;
  --luku-secondary-text: #86868b;
  --luku-border: #d2d2d7;
  --luku-success: #34c759;
  --luku-error: #ff3b30;
  
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999999;
  backdrop-filter: blur(10px);
  animation: fadeIn 0.3s ease-out;
}

.dialog {
  background: var(--luku-bg);
  width: 90%;
  max-width: 600px;
  height: 80vh;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 30px 60px rgba(0,0,0,0.3);
  color: var(--luku-text);
  position: relative;
  overflow: hidden;
}

header {
  padding: 24px;
  background: var(--luku-card);
  border-bottom: 1px solid var(--luku-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-verified { background: var(--luku-success); color: white; }
.status-unverified { background: var(--luku-error); color: white; }

.content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.card {
  background: var(--luku-card);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid var(--luku-border);
}

h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: var(--luku-secondary-text);
  text-transform: uppercase;
}

.field {
  margin-bottom: 12px;
}

.label {
  font-size: 12px;
  color: var(--luku-secondary-text);
  margin-bottom: 4px;
}

.value {
  font-size: 16px;
  font-weight: 500;
  word-break: break-all;
}

footer {
  padding: 20px;
  background: var(--luku-card);
  border-top: 1px solid var(--luku-border);
  display: flex;
  justify-content: flex-end;
}

button {
  padding: 12px 24px;
  border-radius: 10px;
  border: none;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: var(--luku-primary);
  color: white;
}

.close-btn {
  background: none;
  border: none;
  color: var(--luku-secondary-text);
  font-size: 24px;
  cursor: pointer;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
`;

class ReportViewerElement extends HTMLElement {
  private _root: ShadowRoot;
  private _result: LukuParseResult | null = null;
  private _resolve: (() => void) | null = null;

  constructor() {
    super();
    this._root = this.attachShadow({ mode: 'open' });
  }

  setup(result: LukuParseResult, resolve: () => void) {
    this._result = result;
    this._resolve = resolve;
    this.render();
  }

  private render() {
    if (!this._result) return;
    
    const isVerified = this._result.verified;
    const scanItem = this._result.items.find(i => i.type === 'scan');
    const payload = scanItem?.payload;
    const recordPayload = getObject(payload, 'payload');
    const device = getObject(payload, 'device');
    const identity = getObject(payload, 'identity');
    const timestampUtc = getNumber(recordPayload, 'timestamp_utc');
    const uid = getString(payload, 'uid');
    const deviceId = getString(device, 'device_id');
    const slacSerial = getString(identity, 'slac_serial');

    this._root.innerHTML = `
      <style>${CSS}</style>
      <div class="overlay">
        <div class="dialog">
          <header>
            <div>
              <h2>Forensic Report</h2>
              <div style="font-size: 12px; color: #86868b">LukuID Chain of Trust</div>
            </div>
            <div class="status-badge ${isVerified ? 'status-verified' : 'status-unverified'}">
              ${isVerified ? 'VERIFIED' : 'UNVERIFIED'}
            </div>
          </header>
          
          <div class="content">
            <div class="card">
              <h3>Scan Information</h3>
              <div class="field">
                <div class="label">UID</div>
                <div class="value">${uid ?? 'N/A'}</div>
              </div>
              <div class="field">
                <div class="label">Timestamp</div>
                <div class="value">${timestampUtc ? new Date(timestampUtc * 1000).toLocaleString() : 'N/A'}</div>
              </div>
            </div>

            <div class="card">
              <h3>Device Authority</h3>
              <div class="field">
                <div class="label">Device ID</div>
                <div class="value">${deviceId ?? 'N/A'}</div>
              </div>
              <div class="field">
                <div class="label">SLAC Serial</div>
                <div class="value">${slacSerial ?? 'N/A'}</div>
              </div>
            </div>

            ${scanItem?.errors ? `
              <div class="card" style="border-color: #ff3b30">
                <h3 style="color: #ff3b30">Verification Errors</h3>
                ${scanItem.errors.map(err => `<div class="field" style="color: #ff3b30">• ${err}</div>`).join('')}
              </div>
            ` : ''}
          </div>

          <footer>
            <button class="btn-primary" id="done-btn">Done</button>
          </footer>
        </div>
      </div>
    `;

    this._root.querySelector('#done-btn')?.addEventListener('click', () => {
      this._resolve?.();
      this.remove();
    });
  }
}

function getObject(source: JsonObject | undefined, key: string): JsonObject | undefined {
  const value = source?.[key];
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonObject) : undefined;
}

function getString(source: JsonObject | undefined, key: string): string | undefined {
  const value = source?.[key];
  return typeof value === 'string' ? value : undefined;
}

function getNumber(source: JsonObject | undefined, key: string): number | undefined {
  const value: JsonValue | undefined = source?.[key];
  return typeof value === 'number' ? value : undefined;
}

if (!customElements.get('lukuid-report-viewer')) {
  customElements.define('lukuid-report-viewer', ReportViewerElement);
}

export function showReportViewer(result: LukuParseResult): Promise<void> {
  return new Promise((resolve) => {
    const el = document.createElement('lukuid-report-viewer') as ReportViewerElement;
    document.body.appendChild(el);
    el.setup(result, resolve);
  });
}
