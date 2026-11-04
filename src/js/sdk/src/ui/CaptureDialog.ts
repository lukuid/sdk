// SPDX-License-Identifier: Apache-2.0
// Self-contained capture dialog (shadow DOM, inline CSS, no external assets) shown by
// LukuidSdk.capture() while a device makes one signed record. Colors follow /brand.
import { CAPTURE_WINDOW_MS, CaptureError, recordAgeSeconds } from '@lukuid/core';
import type { CaptureEvent, CaptureResult, Device } from '@lukuid/core';

export interface CaptureDialogText {
  title?: string;
  instruction?: string;
}

export interface CaptureDialogController {
  /** Shows the "connect a device" step; resolves when the user picks one, rejects on cancel. */
  connect(onConnect: () => Promise<Device>): Promise<Device>;
  /** Tracks a capture on `device`: follows its `capture` events until `run` settles. */
  track(device: Device, run: () => Promise<CaptureResult>): Promise<CaptureResult>;
  /** History list (filter by device, connect more) or a fresh capture; resolves with the checked choice. */
  select(context: SelectContext): Promise<{ device: Device; result: CaptureResult; fresh: boolean; ageSeconds: number }>;
  close(): void;
}

/** A listed record (the sdk's RecordSummary). */
export interface HistoryEntry {
  device: Device;
  id: string;
  type: 'scan' | 'environment';
  timestampUtc: number;
  tagId?: string;
  tempC?: number;
}

export interface SelectContext {
  /** Show stored records (false: fresh capture only). */
  allowHistory: boolean;
  /** A challenge token is set: the record must be a fresh capture. */
  challenged: boolean;
  maxAgeSeconds?: number;
  devices(): Device[];
  addDevice(): Promise<Device>;
  listRecords(devices: Device[]): Promise<{ records: HistoryEntry[]; errors: Array<{ device: Device; error: unknown }> }>;
  getRecord(entry: HistoryEntry): Promise<CaptureResult>;
  capture(device: Device): Promise<CaptureResult>;
}

const ICON =
  '<svg viewBox="0 0 588 588" aria-hidden="true" focusable="false"><g fill="currentColor" fill-rule="evenodd"><path d="m40 82h120v424h-120zm17.76 333.92v-15.36h62.4q6.72 0 6.72-6.72v-29.76h15.36v30.72q0 21.12-21.12 21.12zm23.04-60.48v-15.36h40.32q7.68 0 7.68-7.68v-7.68q0-7.68-7.68-7.68h-40.32v-15.36h42.24q19.2 0 19.2 19.2v15.36q0 19.2-19.2 19.2zm-23.04-62.4v-11.52q0-3.84 3.84-3.84h40.32l-21.12-21.12v-20.16l24.96 24 36.48-25.92v18.24l-25.44 18.72 6.24 6.24h19.2v15.36zm23.04-67.2v-15.36h40.32q7.68 0 7.68-7.68v-7.68q0-7.68-7.68-7.68h-40.32v-15.36h42.24q19.2 0 19.2 19.2v15.36q0 19.2-19.2 19.2z"/><path d="m196 82h172c118 0 180 66 180 174v76c0 108-62 174-180 174h-172zm80 80v264h88c70 0 104-34 104-98v-68c0-64-34-98-104-98z"/></g></svg>';

const RING_RADIUS = 52;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

const CSS = `
:host {
  --luku-bg: #0F1115;
  --luku-panel: #1A1D22;
  --luku-border: #2A2D33;
  --luku-blue: #3A7BFF;
  --luku-mint: #48E3A3;
  --luku-text: #F5F7FA;
  --luku-subtext: #A5AAB3;
  --luku-error: #FF6B6B;
  all: initial;
}
* { box-sizing: border-box; }
.overlay {
  position: fixed; inset: 0; z-index: 2147483000;
  display: flex; align-items: center; justify-content: center; padding: 16px;
  background: rgba(15, 17, 21, 0.72); backdrop-filter: blur(6px);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  color: var(--luku-text);
}
.overlay.opening { animation: fade .18s ease-out; }
.dialog {
  position: relative; width: 100%; max-width: 420px; max-height: calc(100vh - 32px); overflow-y: auto;
  background: var(--luku-panel); border: 1px solid var(--luku-border); border-radius: 16px;
  padding: 28px 24px 24px; box-shadow: 0 24px 60px rgba(0, 0, 0, .45);
  text-align: center; outline: none;
}
.brand { display: flex; align-items: center; justify-content: center; gap: 8px; color: var(--luku-subtext); font-size: 12px; letter-spacing: .08em; text-transform: uppercase; margin-bottom: 20px; }
.brand svg { width: 18px; height: 18px; color: var(--luku-text); }
.close { position: absolute; top: 12px; right: 12px; width: 32px; height: 32px; border-radius: 8px; border: 0; background: transparent; color: var(--luku-subtext); font-size: 20px; line-height: 1; cursor: pointer; }
.close:hover, .close:focus-visible { background: var(--luku-border); color: var(--luku-text); outline: none; }
h2 { margin: 0 0 8px; font-family: Sora, Inter, ui-sans-serif, system-ui, sans-serif; font-size: 20px; font-weight: 600; letter-spacing: -.01em; }
.instruction { margin: 0 auto 24px; max-width: 300px; color: var(--luku-subtext); font-size: 14px; line-height: 1.5; }
.visual { position: relative; width: 128px; height: 128px; margin: 0 auto 20px; }
.visual svg.ring { width: 128px; height: 128px; transform: rotate(-90deg); }
.track { fill: none; stroke: var(--luku-border); stroke-width: 6; }
.progress { fill: none; stroke: url(#luku-gradient); stroke-width: 6; stroke-linecap: round; transition: stroke-dashoffset .25s linear; }
.indeterminate .progress { animation: spin 1.2s linear infinite; transform-origin: 64px 64px; }
.center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.seconds { font-family: Sora, Inter, ui-sans-serif, system-ui, sans-serif; font-size: 30px; font-weight: 600; font-variant-numeric: tabular-nums; }
.unit { color: var(--luku-subtext); font-size: 12px; }
.mark { width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700; }
.mark.ok { background: rgba(72, 227, 163, .14); color: var(--luku-mint); }
.mark.bad { background: rgba(255, 107, 107, .14); color: var(--luku-error); }
.device { display: inline-flex; align-items: center; gap: 8px; max-width: 100%; padding: 6px 12px; border-radius: 999px; background: var(--luku-bg); border: 1px solid var(--luku-border); color: var(--luku-subtext); font-size: 13px; margin-bottom: 16px; }
.device .dot { flex: none; width: 8px; height: 8px; border-radius: 50%; background: var(--luku-mint); }
.device .name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.details { margin: 0 0 20px; padding: 12px; border-radius: 12px; background: var(--luku-bg); border: 1px solid var(--luku-border); text-align: left; font-size: 12px; }
.details div { display: flex; justify-content: space-between; gap: 12px; padding: 3px 0; }
.details dt { color: var(--luku-subtext); flex: none; }
.details dd { margin: 0; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; overflow-wrap: anywhere; text-align: right; }
.actions { display: flex; gap: 10px; }
button.btn { flex: 1; min-height: 44px; padding: 0 16px; border-radius: 12px; border: 1px solid var(--luku-border); font: inherit; font-size: 15px; font-weight: 600; cursor: pointer; }
.btn.primary { background: var(--luku-blue); border-color: var(--luku-blue); color: #fff; }
.btn.primary:hover { filter: brightness(1.08); }
.btn.secondary { background: transparent; color: var(--luku-text); }
.btn.secondary:hover { background: var(--luku-border); }
.btn:focus-visible { outline: 2px solid var(--luku-mint); outline-offset: 2px; }
.btn[disabled] { opacity: .6; cursor: default; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin: -8px 0 14px; }
.chip { max-width: 100%; min-height: 32px; padding: 0 12px; border-radius: 999px; border: 1px solid var(--luku-border); background: transparent; color: var(--luku-subtext); font: inherit; font-size: 13px; cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chip.active { border-color: var(--luku-blue); background: rgba(58, 123, 255, .14); color: var(--luku-text); }
.chip.add { border-style: dashed; }
.chip:focus-visible, .record:focus-visible { outline: 2px solid var(--luku-mint); outline-offset: 2px; }
.records { display: flex; flex-direction: column; gap: 6px; max-height: min(320px, 45vh); overflow-y: auto; margin: 0 0 18px; text-align: left; }
.record { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 52px; padding: 8px 12px; border-radius: 12px; border: 1px solid var(--luku-border); background: var(--luku-bg); color: var(--luku-text); font: inherit; text-align: left; cursor: pointer; }
.record:hover { border-color: var(--luku-blue); }
.record.add { justify-content: center; color: var(--luku-subtext); border-style: dashed; background: transparent; }
.record-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
.record-main { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.record-main.plain { font-family: inherit; font-weight: 600; }
.record-sub { color: var(--luku-subtext); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chevron { color: var(--luku-subtext); font-size: 20px; }
.empty { margin: 12px 0; color: var(--luku-subtext); font-size: 14px; text-align: center; }
.warn { margin: 4px 0; color: var(--luku-error); font-size: 12px; text-align: center; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .overlay.opening { animation: none; } .indeterminate .progress { animation: none; } .progress { transition: none; } }
`;

type View =
  | { kind: 'connect' }
  | { kind: 'waiting'; device: Device; windowMs: number; startedAt: number; token?: string }
  | { kind: 'captured'; device: Device; result: CaptureResult; fresh?: boolean }
  | { kind: 'error'; device?: Device; error: unknown; connecting?: boolean }
  | { kind: 'history'; devices: Device[]; filter?: Device; entries?: HistoryEntry[]; unreadable: Device[]; maxAgeSeconds?: number }
  | { kind: 'choose'; devices: Device[]; challenged: boolean }
  | { kind: 'checking'; device: Device };

interface Handlers {
  cancel?: () => void;
  retry?: () => void;
  done?: () => void;
  primary?: () => void;
  select?: (entry: HistoryEntry) => void;
  filter?: (device?: Device) => void;
  addDevice?: () => void;
  pickDevice?: (device: Device) => void;
}

/** "5 min ago" style text for an age in seconds. */
export function formatAge(seconds: number): string {
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  return `${Math.floor(seconds / 86400)} d ago`;
}

/** "the last 2 hours" style text for a maximum age in seconds. */
export function formatWindow(seconds: number): string {
  const unit = (n: number, word: string) => (n === 1 ? word : `${n} ${word}s`);
  if (seconds < 3600) return `the last ${unit(Math.max(1, Math.round(seconds / 60)), 'minute')}`;
  if (seconds < 86400 * 2) return `the last ${unit(Math.round(seconds / 3600), 'hour')}`;
  return `the last ${unit(Math.round(seconds / 86400), 'day')}`;
}

/** 'environment', 'reader', or undefined while the device is not yet validated. */
function productOf(device: Device | undefined): 'environment' | 'reader' | undefined {
  try {
    const product = (device?.info.product ?? '').toLowerCase();
    if (!device || !product) return undefined;
    return product.includes('environment') ? 'environment' : 'reader';
  } catch {
    return undefined;
  }
}

function deviceLabel(device: Device): string {
  try {
    return device.info.name || device.info.id || 'LukuID device';
  } catch {
    return 'LukuID device';
  }
}

function errorCode(error: unknown): string {
  const e = error as { code?: unknown; message?: unknown } | null;
  return typeof e?.code === 'string' ? e.code : '';
}

/** Plain-language text for a failed capture. */
export function describeCaptureError(error: unknown): { title: string; detail: string; retry: boolean } {
  const code = errorCode(error);
  const message = String((error as { message?: unknown } | null)?.message ?? '');
  if (code === 'BUSY' || message.includes('capture_in_progress')) {
    return { title: 'Device busy', detail: 'The device is still finishing another capture. Try again in a moment.', retry: true };
  }
  if (code === 'TIMEOUT' || message.includes('no_tag_read')) {
    return { title: 'No tag read', detail: 'No tag was read within the time allowed. Hold the reader closer to the tag and try again.', retry: true };
  }
  if (code === 'TIME_UNTRUSTED' || message.includes('requires_trusted_time')) {
    return { title: 'Time sync needed', detail: 'The device needs a trusted time sync before it can sign records. Sync it, then try again.', retry: false };
  }
  if (code === 'NONCE_MISMATCH' || code === 'RECORD_SIGNATURE_INVALID' || code === 'RECORD_CANONICAL_MISMATCH' || code === 'CAPTURE_INVALID_REPLY') {
    return { title: 'Record rejected', detail: 'The returned record failed its signature check and was not accepted.', retry: true };
  }
  if (code === 'RECORD_TOO_OLD') {
    return { title: 'Record too old', detail: 'This record is older than this site accepts. Choose a newer one or make a new record.', retry: true };
  }
  if (code === 'INVALID_ARG') {
    return { title: 'Invalid challenge', detail: 'The challenge token is not valid for this device.', retry: false };
  }
  if (code === 'NOT_SUPPORTED' || code === 'NOT_IMPL') {
    return { title: 'Not supported', detail: 'This device firmware does not support capture. Update the firmware and try again.', retry: false };
  }
  return { title: 'Capture failed', detail: message || 'The device did not return a record.', retry: true };
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

class CaptureDialogElement extends HTMLElement {
  private readonly root: ShadowRoot;
  private text: CaptureDialogText = {};
  private view: View = { kind: 'connect' };
  private timer: ReturnType<typeof setInterval> | null = null;
  private onCancel: (() => void) | null = null;
  private onRetry: (() => void) | null = null;
  private onDone: (() => void) | null = null;
  private onPrimary: (() => void) | null = null;
  private handlers: Handlers = {};
  private opened = false;
  private previousFocus: Element | null = null;
  private readonly keyHandler = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.onCancel?.();
    }
  };

  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
  }

  init(text: CaptureDialogText): void {
    this.text = text;
    this.previousFocus = document.activeElement;
    document.addEventListener('keydown', this.keyHandler);
  }

  show(view: View, handlers: Handlers): void {
    this.view = view;
    this.handlers = handlers;
    this.onCancel = handlers.cancel ?? null;
    this.onRetry = handlers.retry ?? null;
    this.onDone = handlers.done ?? null;
    this.onPrimary = handlers.primary ?? null;
    this.render();
  }

  dispose(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    document.removeEventListener('keydown', this.keyHandler);
    this.remove();
    if (this.previousFocus instanceof HTMLElement) this.previousFocus.focus();
  }

  private render(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    const view = this.view;
    const product = productOf('device' in view ? view.device : undefined);
    const environment = product === 'environment';

    const style = el('style');
    style.textContent = CSS;
    // Fade in once when the dialog opens, not on every view change.
    const overlay = el('div', this.opened ? 'overlay' : 'overlay opening');
    this.opened = true;
    const dialog = el('div', 'dialog');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'luku-capture-title');
    dialog.tabIndex = -1;

    const brand = el('div', 'brand');
    brand.innerHTML = ICON; // static, trusted markup
    brand.append(el('span', undefined, 'LukuID'));
    dialog.append(brand);

    const cancellable = view.kind === 'waiting' || view.kind === 'connect' || view.kind === 'history' || view.kind === 'choose' || view.kind === 'checking';
    if (cancellable) {
      const close = el('button', 'close', '×');
      close.type = 'button';
      close.setAttribute('aria-label', 'Cancel');
      close.addEventListener('click', () => this.onCancel?.());
      dialog.append(close);
    }

    const title = el('h2');
    title.id = 'luku-capture-title';
    const instruction = el('p', 'instruction');
    const live = el('p', 'sr');
    live.setAttribute('aria-live', 'polite');
    const actions = el('div', 'actions');
    const addButton = (label: string, kind: 'primary' | 'secondary', handler: (() => void) | null) => {
      const button = el('button', `btn ${kind}`, label);
      button.type = 'button';
      button.addEventListener('click', () => handler?.());
      actions.append(button);
      return button;
    };
    let focusTarget: HTMLElement | null = null;

    if (view.kind === 'connect') {
      title.textContent = this.text.title ?? 'Connect a device';
      instruction.textContent = 'Choose the LukuID reader or Environment card to make the record with.';
      dialog.append(title, instruction);
      focusTarget = addButton('Connect device', 'primary', this.onPrimary);
      addButton('Cancel', 'secondary', this.onCancel);
    } else if (view.kind === 'waiting') {
      const timed = product === 'reader';
      title.textContent = this.text.title ?? (!product ? 'Connecting' : environment ? 'Recording' : 'Ready to scan');
      instruction.textContent =
        this.text.instruction ??
        (!product
          ? 'Preparing the device.'
          : environment
            ? 'The card is taking a signed measurement.'
            : 'Hold the reader to the animal’s tag. The scan is signed and stored on the reader.');
      const visual = el('div', timed ? 'visual' : 'visual indeterminate');
      visual.innerHTML =
        `<svg class="ring" viewBox="0 0 128 128" aria-hidden="true"><defs><linearGradient id="luku-gradient" x1="0" y1="0" x2="1" y2="1">` +
        `<stop offset="0%" stop-color="#3A7BFF"/><stop offset="100%" stop-color="#48E3A3"/></linearGradient></defs>` +
        `<circle class="track" cx="64" cy="64" r="${RING_RADIUS}"/><circle class="progress" cx="64" cy="64" r="${RING_RADIUS}" ` +
        `stroke-dasharray="${RING_LENGTH.toFixed(2)}" stroke-dashoffset="${timed ? '0' : (RING_LENGTH * 0.7).toFixed(2)}"/></svg>`;
      const center = el('div', 'center');
      visual.append(center);
      dialog.append(title, instruction, visual, this.deviceChip(view.device));
      if (timed) {
        const seconds = el('span', 'seconds');
        center.append(seconds, el('span', 'unit', 'seconds'));
        const progress = visual.querySelector('.progress') as SVGCircleElement | null;
        const tick = () => {
          const remaining = Math.max(0, view.windowMs - (Date.now() - view.startedAt));
          seconds.textContent = String(Math.ceil(remaining / 1000));
          progress?.setAttribute('stroke-dashoffset', (RING_LENGTH * (1 - remaining / view.windowMs)).toFixed(2));
        };
        tick();
        this.timer = setInterval(tick, 250);
        live.textContent = 'Waiting for a tag';
      } else {
        live.textContent = environment ? 'Recording' : 'Connecting';
      }
      focusTarget = addButton('Cancel', 'secondary', this.onCancel);
    } else if (view.kind === 'captured') {
      const record = view.result.record as Record<string, unknown>;
      const payload = (record.payload ?? {}) as Record<string, unknown>;
      const stored = view.fresh === false;
      title.textContent = stored ? 'Record selected' : view.result.type === 'scan' ? 'Scan recorded' : 'Record made';
      instruction.textContent = stored ? 'Signed by the device and checked.' : 'Signed, stored on the device and returned.';
      const visual = el('div', 'visual');
      const center = el('div', 'center');
      center.append(el('div', 'mark ok', '✓'));
      visual.append(center);
      const details = el('dl', 'details');
      const row = (label: string, value: string) => {
        if (!value) return;
        const item = el('div');
        item.append(el('dt', undefined, label), el('dd', undefined, value));
        details.append(item);
      };
      row('Record', view.result.id);
      if (view.result.type === 'scan') row('Tag', String(payload.tag_id ?? ''));
      else if (typeof payload.temp_c === 'number') row('Temperature', `${payload.temp_c.toFixed(1)} °C`);
      row('Challenge', view.result.nonce);
      if (stored) row('Made', formatAge(recordAgeSeconds(record as never)));
      dialog.append(title, instruction, visual, details);
      focusTarget = addButton('Done', 'primary', this.onDone);
      live.textContent = title.textContent;
    } else if (view.kind === 'history') {
      title.textContent = this.text.title ?? 'Choose a record';
      instruction.textContent =
        this.text.instruction ??
        (view.maxAgeSeconds === undefined ? 'Pick a stored record or make a new one.' : `Pick a record from ${formatWindow(view.maxAgeSeconds)} or make a new one.`);
      dialog.append(title, instruction, this.deviceFilter(view));
      const list = el('div', 'records');
      list.setAttribute('role', 'list');
      const shown = (view.entries ?? []).filter((entry) => !view.filter || entry.device === view.filter);
      if (!view.entries) {
        list.append(el('p', 'empty', 'Loading records…'));
        live.textContent = 'Loading records';
      } else if (shown.length === 0) {
        list.append(el('p', 'empty', view.devices.length === 0
          ? 'No device connected. Connect one to see its records.'
          : view.maxAgeSeconds === undefined ? 'No records on this device yet.' : `No records from ${formatWindow(view.maxAgeSeconds)}.`));
        live.textContent = 'No records';
      } else {
        const now = Date.now();
        for (const entry of shown) {
          const row = el('button', 'record');
          row.type = 'button';
          row.setAttribute('role', 'listitem');
          const main = el('span', 'record-main', entry.type === 'scan' ? entry.tagId ?? entry.id : entry.tempC !== undefined ? `${entry.tempC.toFixed(1)} °C` : entry.id);
          const sub = el('span', 'record-sub', `${deviceLabel(entry.device)} · ${formatAge(Math.max(0, Math.floor(now / 1000) - entry.timestampUtc))}`);
          const text = el('span', 'record-text');
          text.append(main, sub);
          row.append(text, el('span', 'chevron', '›'));
          row.addEventListener('click', () => this.handlers.select?.(entry));
          list.append(row);
        }
        live.textContent = `${shown.length} records`;
      }
      for (const device of view.unreadable) {
        if (!view.filter || view.filter === device) list.append(el('p', 'warn', `Could not read ${deviceLabel(device)}.`));
      }
      dialog.append(list);
      focusTarget = addButton('New record', 'primary', this.onPrimary);
      addButton('Cancel', 'secondary', this.onCancel);
    } else if (view.kind === 'choose') {
      title.textContent = this.text.title ?? 'Choose a device';
      instruction.textContent =
        this.text.instruction ??
        (view.challenged ? 'This site asks for a new record signed with its challenge. Pick the device to make it with.' : 'Pick the device to make the new record with.');
      dialog.append(title, instruction);
      const list = el('div', 'records');
      for (const device of view.devices) {
        const row = el('button', 'record');
        row.type = 'button';
        const text = el('span', 'record-text');
        text.append(
          el('span', 'record-main plain', deviceLabel(device)),
          el('span', 'record-sub', productOf(device) === 'environment' ? 'Environment card' : 'Animal Reader')
        );
        row.append(text, el('span', 'chevron', '›'));
        row.addEventListener('click', () => this.handlers.pickDevice?.(device));
        list.append(row);
        focusTarget ??= row;
      }
      const add = el('button', 'record add', '+ Connect another device');
      add.type = 'button';
      add.addEventListener('click', () => this.handlers.addDevice?.());
      list.append(add);
      focusTarget ??= add;
      dialog.append(list);
      addButton('Cancel', 'secondary', this.onCancel);
    } else if (view.kind === 'checking') {
      title.textContent = 'Checking record';
      instruction.textContent = 'Reading the signed record from the device.';
      const visual = el('div', 'visual indeterminate');
      visual.innerHTML =
        `<svg class="ring" viewBox="0 0 128 128" aria-hidden="true"><defs><linearGradient id="luku-gradient" x1="0" y1="0" x2="1" y2="1">` +
        `<stop offset="0%" stop-color="#3A7BFF"/><stop offset="100%" stop-color="#48E3A3"/></linearGradient></defs>` +
        `<circle class="track" cx="64" cy="64" r="${RING_RADIUS}"/><circle class="progress" cx="64" cy="64" r="${RING_RADIUS}" ` +
        `stroke-dasharray="${RING_LENGTH.toFixed(2)}" stroke-dashoffset="${(RING_LENGTH * 0.7).toFixed(2)}"/></svg>`;
      dialog.append(title, instruction, visual, this.deviceChip(view.device));
      focusTarget = addButton('Cancel', 'secondary', this.onCancel);
      live.textContent = 'Checking record';
    } else {
      const text = view.connecting
        ? { title: 'No device connected', detail: 'Make sure the device is on and Bluetooth is enabled, then try again.', retry: true }
        : describeCaptureError(view.error);
      title.textContent = text.title;
      instruction.textContent = text.detail;
      const visual = el('div', 'visual');
      const center = el('div', 'center');
      center.append(el('div', 'mark bad', '!'));
      visual.append(center);
      dialog.append(title, instruction, visual);
      if (text.retry && this.onRetry) focusTarget = addButton('Try again', 'primary', this.onRetry);
      const closeButton = addButton('Close', text.retry && this.onRetry ? 'secondary' : 'primary', this.onDone);
      focusTarget ??= closeButton;
      live.textContent = `${text.title}. ${text.detail}`;
    }

    dialog.append(actions, live);
    overlay.append(dialog);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay && cancellable) this.onCancel?.();
    });
    this.root.replaceChildren(style, overlay);
    (focusTarget ?? dialog).focus();
  }

  private deviceFilter(view: Extract<View, { kind: 'history' }>): HTMLElement {
    const bar = el('div', 'chips');
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Filter by device');
    const chip = (label: string, active: boolean, onClick: () => void, extra = '') => {
      const button = el('button', `chip${active ? ' active' : ''}${extra}`, label);
      button.type = 'button';
      button.setAttribute('aria-pressed', String(active));
      button.addEventListener('click', onClick);
      bar.append(button);
    };
    if (view.devices.length > 1) chip('All devices', !view.filter, () => this.handlers.filter?.(undefined));
    for (const device of view.devices) chip(deviceLabel(device), view.filter === device, () => this.handlers.filter?.(device));
    const add = el('button', 'chip add', '+ Add device');
    add.type = 'button';
    add.addEventListener('click', () => this.handlers.addDevice?.());
    bar.append(add);
    return bar;
  }

  private deviceChip(device: Device): HTMLElement {
    const chip = el('div', 'device');
    chip.append(el('span', 'dot'), el('span', 'name', deviceLabel(device)));
    return chip;
  }
}

const TAG = 'lukuid-capture-dialog';

function defineElement(): void {
  if (!customElements.get(TAG)) customElements.define(TAG, CaptureDialogElement);
}

function cancelledError(): CaptureError {
  return new CaptureError('CANCELLED', 'The capture was cancelled');
}

/**
 * Opens the dialog. `track` resolves with the record after the user has seen it (the
 * dialog closes on Done or after `autoCloseMs`), or rejects with the capture error when
 * the user closes it; Cancel rejects with code `CANCELLED`. The device may still finish
 * a cancelled capture: the record is then stored on the device, but not returned.
 */
export function openCaptureDialog(
  text: CaptureDialogText = {},
  container: HTMLElement = document.body,
  autoCloseMs = 1500
): CaptureDialogController {
  defineElement();
  const element = document.createElement(TAG) as CaptureDialogElement;
  container.append(element);
  element.init(text);
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    element.dispose();
  };

  const controller: CaptureDialogController = {
    close,
    connect(onConnect) {
      return new Promise<Device>((resolve, reject) => {
        const cancel = () => { close(); reject(cancelledError()); };
        const ask = () => element.show({ kind: 'connect' }, {
          cancel,
          primary: () => {
            onConnect().then(resolve, (error) => element.show({ kind: 'error', error }, {
              done: () => { close(); reject(error); },
              retry: ask
            }));
          }
        });
        ask();
      });
    },
    track(device, run) {
      return new Promise<CaptureResult>((resolve, reject) => {
        let settled = false;
        const attempt = () => {
          const cancel = () => { settled = true; off(); close(); reject(cancelledError()); };
          element.show({ kind: 'waiting', device, windowMs: CAPTURE_WINDOW_MS, startedAt: Date.now() }, { cancel });
          const off = device.on('capture', (event: CaptureEvent) => {
            if (event.state === 'waiting' && !settled) {
              element.show({ kind: 'waiting', device, windowMs: event.windowMs, startedAt: event.startedAt, token: event.token }, { cancel });
            }
          });
          run().then(
            (result) => {
              off();
              if (settled) return;
              settled = true;
              const finish = () => { close(); resolve(result); };
              const timer = autoCloseMs > 0 ? setTimeout(finish, autoCloseMs) : null;
              element.show({ kind: 'captured', device, result }, { done: () => { if (timer) clearTimeout(timer); finish(); } });
            },
            (error) => {
              off();
              if (settled) return;
              element.show({ kind: 'error', device, error }, {
                done: () => { settled = true; close(); reject(error); },
                retry: () => attempt()
              });
            }
          );
        };
        attempt();
      });
    },
    select(context) {
      type Picked = { device: Device; result: CaptureResult; fresh: boolean; ageSeconds: number };
      return new Promise<Picked>((resolve, reject) => {
        let filter: Device | undefined;
        let loaded: { records: HistoryEntry[]; errors: Array<{ device: Device; error: unknown }> } | undefined;
        let generation = 0;
        const cancel = () => { generation++; close(); reject(cancelledError()); };
        const finish = (device: Device, result: CaptureResult, fresh: boolean) => {
          const picked = { device, result, fresh, ageSeconds: recordAgeSeconds(result.record) };
          const done = () => { if (timer) clearTimeout(timer); close(); resolve(picked); };
          const timer = autoCloseMs > 0 ? setTimeout(done, autoCloseMs) : null;
          element.show({ kind: 'captured', device, result, fresh }, { done });
        };
        const addDevice = (then: () => void) => {
          context.addDevice().then(then, (error) => element.show({ kind: 'error', error, connecting: true }, { done: then, retry: () => addDevice(then) }));
        };
        const startCapture = (device: Device) => {
          controller.track(device, () => context.capture(device)).then(
            (result) => resolve({ device, result, fresh: true, ageSeconds: recordAgeSeconds(result.record) }),
            reject
          );
        };
        const choose = () => {
          const devices = context.devices();
          if (devices.length === 0) {
            element.show({ kind: 'connect' }, { cancel, primary: () => addDevice(choose) });
            return;
          }
          element.show({ kind: 'choose', devices, challenged: context.challenged }, { cancel, pickDevice: startCapture, addDevice: () => addDevice(choose) });
        };
        const showHistory = () => {
          const devices = context.devices();
          if (filter && !devices.includes(filter)) filter = undefined;
          element.show(
            { kind: 'history', devices, filter, entries: loaded?.records, unreadable: (loaded?.errors ?? []).map((e) => e.device), maxAgeSeconds: context.maxAgeSeconds },
            {
              cancel,
              primary: () => {
                // A single device (or the filtered one) captures at once; otherwise ask.
                const target = filter ?? (devices.length === 1 ? devices[0] : undefined);
                if (target) startCapture(target);
                else choose();
              },
              filter: (device) => { filter = device; showHistory(); },
              addDevice: () => addDevice(load),
              select: (entry) => {
                const run = ++generation;
                element.show({ kind: 'checking', device: entry.device }, { cancel });
                context.getRecord(entry).then(
                  (result) => { if (run === generation) finish(entry.device, result, false); },
                  (error) => {
                    if (run !== generation) return;
                    element.show({ kind: 'error', device: entry.device, error }, {
                      retry: showHistory,
                      done: () => { generation++; close(); reject(error); }
                    });
                  }
                );
              }
            }
          );
        };
        const load = () => {
          const run = ++generation;
          loaded = undefined;
          showHistory();
          context.listRecords(context.devices()).then(
            (result) => { if (run === generation) { loaded = result; showHistory(); } },
            (error) => { if (run === generation) { loaded = { records: [], errors: context.devices().map((device) => ({ device, error })) }; showHistory(); } }
          );
        };
        if (context.allowHistory) load();
        else choose();
      });
    }
  };
  return controller;
}
