// SPDX-License-Identifier: Apache-2.0
import type { Device } from '@lukuid/core';
import type { LukuidSdk } from '../sdk.js';

export interface ScanDialogOptions {
  title?: string;
  instruction?: string;
}

export interface ScanResult {
  device: Device;
  data: any;
}

const CSS = `
:host {
  --luku-primary: #0071e3;
  --luku-bg: #ffffff;
  --luku-text: #1d1d1f;
  --luku-secondary-text: #86868b;
  --luku-overlay: rgba(0, 0, 0, 0.4);
  --luku-border: #d2d2d7;
  
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--luku-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999999;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease-out;
}

.dialog {
  background: var(--luku-bg);
  width: 90%;
  max-width: 440px;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.2);
  color: var(--luku-text);
  position: relative;
  overflow: hidden;
}

h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  text-align: center;
}

.instruction {
  color: var(--luku-secondary-text);
  text-align: center;
  margin-bottom: 32px;
  font-size: 16px;
  line-height: 1.4;
}

.scanners-list {
  margin-bottom: 24px;
  max-height: 150px;
  overflow-y: auto;
}

.scanner-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f5f5f7;
  border-radius: 12px;
  margin-bottom: 8px;
  font-size: 14px;
}

.scanner-item .status-dot {
  width: 8px;
  height: 8px;
  background: #34c759;
  border-radius: 50%;
  margin-right: 12px;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

button {
  padding: 14px;
  border-radius: 12px;
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

.btn-primary:hover {
  background: #0077ed;
}

.btn-secondary {
  background: #f5f5f7;
  color: var(--luku-text);
}

.btn-secondary:hover {
  background: #e8e8ed;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  color: var(--luku-secondary-text);
  cursor: pointer;
  padding: 8px;
  font-size: 20px;
}

/* Animation */
.wave-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  margin-bottom: 24px;
}

.wave {
  width: 60px;
  height: 60px;
  border: 3px solid var(--luku-primary);
  border-radius: 50%;
  position: absolute;
  opacity: 0;
  animation: wavePulse 2s infinite;
}

.wave:nth-child(2) { animation-delay: 0.5s; }
.wave:nth-child(3) { animation-delay: 1s; }

.scanner-icon {
  font-size: 40px;
  z-index: 2;
}

@keyframes wavePulse {
  0% { transform: scale(0.5); opacity: 0; }
  50% { opacity: 0.5; }
  100% { transform: scale(2); opacity: 0; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
`;

class ScanDialogElement extends HTMLElement {
  private _root: ShadowRoot;
  private _sdk: LukuidSdk | null = null;
  private _resolve: ((res: ScanResult | null) => void) | null = null;
  private _options: ScanDialogOptions = {};
  private _unsubs: Array<() => void> = [];

  constructor() {
    super();
    this._root = this.attachShadow({ mode: 'open' });
  }

  setup(sdk: LukuidSdk, options: ScanDialogOptions, resolve: (res: ScanResult | null) => void) {
    this._sdk = sdk;
    this._options = options;
    this._resolve = resolve;
    this.render();
    this.attachListeners();
  }

  private render() {
    const devices = this._sdk?.getConnectedDevicesSync?.() || [];
    
    this._root.innerHTML = `
      <style>${CSS}</style>
      <div class="overlay">
        <div class="dialog">
          <button class="close-btn">&times;</button>
          <h2>${this._options.title || 'Scanning...'}</h2>
          <p class="instruction">${this._options.instruction || 'Please wave the scanner over the target to perform a scan.'}</p>
          
          <div class="wave-container">
            <div class="wave"></div>
            <div class="wave"></div>
            <div class="wave"></div>
            <div class="scanner-icon">📡</div>
          </div>

          <div class="scanners-list">
            ${devices.map(d => `
              <div class="scanner-item">
                <div class="status-dot"></div>
                ${d.info.name || d.info.id}
              </div>
            `).join('')}
            ${devices.length === 0 ? '<p style="text-align:center; font-size: 14px; color: #86868b">No scanners connected</p>' : ''}
          </div>

          <div class="actions">
            <button class="btn-primary" id="connect-btn">Connect New Scanner</button>
            <button class="btn-secondary" id="cancel-btn">Cancel</button>
          </div>
        </div>
      </div>
    `;
  }

  private attachListeners() {
    this._root.querySelector('.close-btn')?.addEventListener('click', () => this.finish(null));
    this._root.querySelector('#cancel-btn')?.addEventListener('click', () => this.finish(null));
    this._root.querySelector('#connect-btn')?.addEventListener('click', () => this.handleConnect());

    // Listen for devices from SDK
    const offDevice = this._sdk?.on('device', () => {
      this.render();
      this.attachListeners();
      this.resubscribeToScans();
    });
    if (offDevice) this._unsubs.push(offDevice);

    this.resubscribeToScans();
  }

  private resubscribeToScans() {
    // Clear old scan listeners
    // In a real impl we'd keep track, but here we just re-run on every render
    const devices = this._sdk?.getConnectedDevicesSync?.() || [];
    devices.forEach(device => {
      const off = device.on('event', (ev) => {
        if (ev.key === 'scan') {
          this.finish({ device, data: ev.data });
        }
      });
      this._unsubs.push(off);
    });
  }

  private async handleConnect() {
    try {
      await this._sdk?.requestDevice();
      // Render will be triggered by the 'device' event from SDK
    } catch (err) {
      console.error('Failed to connect:', err);
    }
  }

  private finish(result: ScanResult | null) {
    this._unsubs.forEach(u => u());
    this._resolve?.(result);
    this.remove();
  }
}

if (!customElements.get('lukuid-scan-dialog')) {
  customElements.define('lukuid-scan-dialog', ScanDialogElement);
}

export function showScanDialog(sdk: LukuidSdk, options: ScanDialogOptions = {}): Promise<ScanResult | null> {
  return new Promise((resolve) => {
    const el = document.createElement('lukuid-scan-dialog') as ScanDialogElement;
    document.body.appendChild(el);
    el.setup(sdk, options, resolve);
  });
}
