// SPDX-License-Identifier: Apache-2.0
// Self-contained capture dialog (shadow DOM, inline CSS, no external assets) shown by
// LukuidSdk.capture() while a device makes one signed record. Colors follow /brand.
import { CAPTURE_WINDOW_MS, CaptureError } from '@lukuid/core';
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
  close(): void;
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
  color: var(--luku-text); animation: fade .18s ease-out;
}
.dialog {
  position: relative; width: 100%; max-width: 400px;
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
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .overlay { animation: none; } .indeterminate .progress { animation: none; } .progress { transition: none; } }
`;

type View =
  | { kind: 'connect' }
  | { kind: 'waiting'; device: Device; windowMs: number; startedAt: number; token?: string }
  | { kind: 'captured'; device: Device; result: CaptureResult }
  | { kind: 'error'; device?: Device; error: unknown };

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

  show(view: View, handlers: { cancel?: () => void; retry?: () => void; done?: () => void; primary?: () => void }): void {
    this.view = view;
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
    const overlay = el('div', 'overlay');
    const dialog = el('div', 'dialog');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'luku-capture-title');
    dialog.tabIndex = -1;

    const brand = el('div', 'brand');
    brand.innerHTML = ICON; // static, trusted markup
    brand.append(el('span', undefined, 'LukuID'));
    dialog.append(brand);

    if (view.kind === 'waiting' || view.kind === 'connect') {
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
      title.textContent = view.result.type === 'scan' ? 'Scan recorded' : 'Record made';
      instruction.textContent = 'Signed, stored on the device and returned.';
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
      dialog.append(title, instruction, visual, details);
      focusTarget = addButton('Done', 'primary', this.onDone);
      live.textContent = title.textContent;
    } else {
      const text = describeCaptureError(view.error);
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
      if (event.target === overlay && (view.kind === 'waiting' || view.kind === 'connect')) this.onCancel?.();
    });
    this.root.replaceChildren(style, overlay);
    (focusTarget ?? dialog).focus();
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

  return {
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
    }
  };
}
