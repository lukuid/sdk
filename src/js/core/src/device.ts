// SPDX-License-Identifier: Apache-2.0
import { encodeFrame, LukuDecoder, encodeBase64 } from './codec.js';
import { TinyEventEmitter } from './events.js';
import type { DeviceAttestationInputs } from './attestation.js';
import { verifyDeviceAttestation } from './attestation.js';
import { DeviceTrustError } from './errors.js';
import type {
  CommandFrame,
  Connection,
  Device,
  DeviceContext,
  DeviceController,
  DeviceDescriptor,
  DeviceEventMap,
  DeviceFactoryOptions,
  DeviceInfo,
  EventFrame,
  Logger,
  ResponseFrame,
  Unsubscribe
} from './types.js';
import type { DeviceFrame } from './types.js';

export class DeviceCommandError extends Error {
  constructor(
    public readonly code: string,
    message?: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message ?? code);
    this.name = 'DeviceCommandError';
  }
}

export const DEFAULT_RPC_TIMEOUT_MS = 5000;
export const DEFAULT_COMMAND_TIMEOUT_MS = 30000;

export function createDevice(context: DeviceContext): DeviceController {
  const device = new LukuidDevice(context);
  return {
    device,
    ensureValidated: () => device.ensureValidated()
  };
}

export interface ParseInfoPayloadOptions {
  requireAttestation?: boolean;
}

// Ensure Buffer doesn't cause TS errors in universal environments
declare const Buffer: any;

function bytesToBase64(value: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value).toString('base64');
  }

  let binary = '';
  for (const byte of value) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function chunkBase64(value: string): string {
  return value.replace(/.{1,64}/g, (chunk) => `${chunk}\n`);
}

function pemFromDerField(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const direct = decodePemChainText(value);
    if (direct) {
      return direct;
    }

    const normalized = value.replace(/\s+/g, '');
    if (normalized.length === 0) {
      return undefined;
    }

    return `-----BEGIN CERTIFICATE-----\n${chunkBase64(normalized)}-----END CERTIFICATE-----\n`;
  }
  if (!(value instanceof Uint8Array)) {
    return undefined;
  }

  const text = new TextDecoder().decode(value);
  const direct = decodePemChainText(text);
  if (direct) {
    return direct;
  }

  return `-----BEGIN CERTIFICATE-----\n${chunkBase64(bytesToBase64(value))}-----END CERTIFICATE-----\n`;
}

function decodePemChainText(value: string): string | undefined {
  return value.includes('-----BEGIN CERTIFICATE-----') ? value : undefined;
}

function assembleCertificateChain(record: Record<string, unknown>): string | undefined {
  const parts = [
    pemFromDerField(record.attestation_dac_der),
    pemFromDerField(record.attestation_manufacturer_der),
    pemFromDerField(record.attestation_intermediate_der)
  ].filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join('') : undefined;
}

class LukuidDevice implements Device {
  private readonly descriptor: DeviceDescriptor;
  private readonly openConnectionFn: () => Promise<Connection>;
  private readonly logger?: Logger;
  private readonly onValidated?: DeviceFactoryOptions['onValidated'];
  private readonly emitter = new TinyEventEmitter<DeviceEventMap>();
  private readonly decoder = new LukuDecoder();
  private connection: Connection | null = null;
  private connectionPromise: Promise<Connection> | null = null;
  private dataSubscription: Unsubscribe | null = null;
  private closed = false;
  private validationPromise: Promise<DeviceInfo> | null = null;
  private infoValue: DeviceInfo | null = null;
  private readonly pending = new Map<string, PendingCommand>();
  private commandQueue: Promise<unknown> = Promise.resolve();
  private readonly commandTimeoutMs: number;

  constructor(private readonly context: DeviceContext) {
    this.descriptor = context.descriptor;
    this.openConnectionFn = context.openConnection;
    this.logger = context.options?.logger;
    this.onValidated = context.options?.onValidated;
    this.commandTimeoutMs = context.options?.commandTimeoutMs ?? DEFAULT_COMMAND_TIMEOUT_MS;

    if (context.options?.cachedInfo) {
      this.infoValue = { ...this.descriptor, ...context.options.cachedInfo };
      this.validationPromise = Promise.resolve(this.infoValue);
      context.options.onValidated?.(this.infoValue);
    }
  }

  get info(): DeviceInfo {
    if (!this.infoValue) {
      throw new Error('Device is not yet validated');
    }

    return this.infoValue;
  }

  on<TEvent extends keyof DeviceEventMap>(event: TEvent, handler: (payload: DeviceEventMap[TEvent]) => void): Unsubscribe {
    return this.emitter.on(event, handler);
  }

  async action(key: string, opts: Record<string, unknown> = {}): Promise<void> {
    this.assertOpen();
    const connection = await this.ensureConnection();
    const id = generateRequestId();
    const payload: CommandFrame = {
      action: key,
      id,
      opts
    };
    const buffer = encodeFrame(payload);
    await connection.write(buffer);
  }

  async call(key: string, opts: Record<string, unknown> = {}): Promise<unknown> {
    return this.callWithTimeout(key, opts, this.commandTimeoutMs);
  }

  async callWithTimeout(key: string, opts: Record<string, unknown>, timeoutMs: number): Promise<unknown> {
    this.assertOpen();

    const task = async () => {
      const connection = await this.ensureConnection();
      return this.sendCommandWithTimeout(connection, key, opts, timeoutMs);
    };

    const next = this.commandQueue.then(task, task);
    this.commandQueue = next.catch(() => {});
    return next;
  }

  async send(data: Uint8Array): Promise<void> {
    this.assertOpen();
    const connection = await this.ensureConnection();
    await connection.write(data);
  }

  private async sendCommandWithTimeout(
    connection: Connection,
    key: string,
    opts: Record<string, unknown>,
    timeoutMs: number
  ): Promise<unknown> {
    const id = generateRequestId();
    const payload: CommandFrame = {
      action: key,
      id,
      opts
    };

    const buffer = encodeFrame(payload);
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`Command ${key} (${id}) timed out after ${timeoutMs}ms`));
        }
      }, timeoutMs);

      this.pending.set(id, {
        action: key,
        resolve: (val) => {
          clearTimeout(timeout);
          resolve(val);
        },
        reject: (err) => {
          clearTimeout(timeout);
          reject(err);
        }
      });

      connection.write(buffer).catch((error) => {
        this.pending.delete(id);
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  async close(reason?: string): Promise<void> {
    if (this.closed) {
      return;
    }

    this.closed = true;

    if (this.dataSubscription) {
      try {
        this.dataSubscription();
      } catch (error) {
        this.emitError('device.close', error);
      }
      this.dataSubscription = null;
    }

    const connection = await this.connectionPromise?.catch(() => this.connection) ?? this.connection;
    if (connection) {
      await connection.close(reason).catch((error) => this.emitError('device.close', error));
    }

    this.connection = null;
    this.connectionPromise = null;
    this.decoder.reset();

    for (const [id, pending] of this.pending) {
      pending.reject(new Error(`Command ${id} was cancelled`));
    }
    this.pending.clear();

    this.emitter.emit('close', { reason });
    this.emitter.removeAllListeners();
  }

  ensureValidated(): Promise<DeviceInfo> {
    if (this.validationPromise) {
      return this.validationPromise;
    }

    if (this.infoValue) {
      this.validationPromise = Promise.resolve(this.infoValue);
      return this.validationPromise;
    }

    this.validationPromise = this.fetchInfo();
    return this.validationPromise;
  }

  private async fetchInfo(): Promise<DeviceInfo> {
    const connection = await this.ensureConnection();
    const payload = await this.call('info', {});
    const normalized = parseInfoPayload(payload, this.descriptor, { requireAttestation: true });
    if (!normalized.attestation) {
      throw new Error('INFO response missing attestation');
    }

    const result = await verifyDeviceAttestation({
      id: normalized.attestation.id,
      key: normalized.attestation.key,
      attestationSig: normalized.attestation.attestationSig,
      attestationAlg: normalized.attestation.attestationAlg,
      attestationPayloadVersion: normalized.attestation.attestationPayloadVersion
    });

    if (!result.ok && !this.context.options?.allowUnverifiedDevices) {
        await this.close('Verification failed');
        throw new DeviceTrustError(
            normalized.attestation.id,
            result.reason ?? 'Signature rejected',
            []
        );
    }

    const info: DeviceInfo = {
        ...normalized.info,
        verified: result.ok
    };

    // Automatic Heartbeat if verified
    if (info.verified) {
        const now = Math.floor(Date.now() / 1000);
        const lastSync = info.lastSync ?? 0;
        if (now - lastSync > 24 * 3600 || info.sync_required) {
            try {
                // 1. Fetch Telemetry if needed (either for public API or custom heartbeat)
                let telemetry: unknown[] = [];
                let telemetrySignature: any;
                let telemetryCanonical: string | undefined;

                if (info.telemetry || info.custom_heartbeat_url) {
                    const telemetryResult = await this.call('fetch_telemetry', {}) as any;
                    telemetry = telemetryResult?.data || [];
                    telemetrySignature = telemetryResult?.signature;
                    telemetryCanonical = telemetryResult?.canonical_string;
                }

                const defaultApiUrl = (this.context as any).options?.apiUrl || 'https://api.lukuid.com';

                // 2. Push Telemetry to public API if enabled
                if (info.telemetry && telemetry.length > 0) {
                    try {
                        await fetch(`${defaultApiUrl.replace(/\/$/, '')}/telemetry`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                device_id: info.id,
                                data: telemetry,
                                signature: telemetrySignature instanceof Uint8Array 
                                    ? encodeBase64(telemetrySignature) 
                                    : telemetrySignature,
                                canonical: telemetryCanonical
                            })
                        });
                    } catch (e) {
                        // Ignore public telemetry failure
                    }
                }

                // 3. Generate Heartbeat CSR
                const hbInit = await this.call('generate_heartbeat', {}) as any;
                const signature = hbInit?.signature;
                const csr = hbInit?.csr;
                const attestation = assembleCertificateChain(info as unknown as Record<string, unknown>) ?? hbInit?.attestation;
                const counter = hbInit?.counter;

                if (signature) {
                    const apiUrl = info.custom_heartbeat_url || defaultApiUrl;
                    const hasCustomUrl = !!info.custom_heartbeat_url;
                    
                    const hbResponse = await fetch(`${apiUrl.replace(/\/$/, '')}/heartbeat`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            device_id: info.id,
                            public_key: info.key,
                            signature: signature,
                            csr: csr,
                            attestation: attestation,
                            attestation_root_fingerprint: info.attestation_root_fingerprint,
                            counter: counter,
                            source: {
                                platform: 'web',
                                version: '1.0.0', // SDK Version
                                bundle_id: typeof window !== 'undefined' ? window.location.origin : 'nodejs',
                                integration: 'js-sdk'
                            },
                            previous_state: {
                                last_sync_bucket: hbInit?.last_sync_bucket,
                                last_timestamp: hbInit?.latest_timestamp,
                                current_timestamp: hbInit?.current_timestamp,
                                last_intermediate_serial: hbInit?.last_intermediate_serial,
                                last_slac_serial: hbInit?.last_slac_serial
                            },
                            // Only include telemetry in heartbeat if it's a custom URL
                            telemetry: hasCustomUrl ? telemetry : undefined,
                            telemetry_signature: hasCustomUrl ? (telemetrySignature instanceof Uint8Array 
                                ? encodeBase64(telemetrySignature) 
                                : telemetrySignature) : undefined,
                            telemetry_canonical_string: hasCustomUrl ? telemetryCanonical : undefined
                        })
                    });
                    if (hbResponse.ok) {
                        const hbPayload = await hbResponse.json();
                        await this.call('set_heartbeat', {
                            slac_der: hbPayload.slac_der,
                            heartbeat_der: hbPayload.heartbeat_der,
                            intermediate_der: hbPayload.intermediate_der,
                            signature: hbPayload.signature,
                            timestamp: hbPayload.timestamp
                        });
                    }
                }
            } catch (error) {
                this.emitError('device.heartbeat', error);
            }
        }
    }

    this.infoValue = info;
    this.onValidated?.(info);
    return info;
  }

  private async ensureConnection(): Promise<Connection> {
    if (this.closed) {
      throw new Error('Device is closed');
    }

    if (this.connection) {
      return this.connection;
    }

    if (!this.connectionPromise) {
      this.connectionPromise = this.openConnectionFn()
        .then((connection) => {
          this.setupConnection(connection);
          this.connection = connection;
          return connection;
        })
        .catch((error) => {
          this.connectionPromise = null;
          throw error;
        });
    }

    return this.connectionPromise;
  }

  private setupConnection(connection: Connection): void {
    this.dataSubscription = connection.onData((chunk) => this.handleChunk(chunk));
  }

  private handleChunk(chunk: Uint8Array): void {
    const frames = this.decoder.push(chunk);
    for (const frame of frames) {
      if (!isDeviceFrame(frame)) {
        continue;
      }

      this.emitter.emit('message', frame);
      
      // A frame is a response if:
      // 1. It has 'ok', 'err', or 'error' fields
      // 2. Its action name matches a pending command
      let isResponse = 'ok' in (frame as any) || 'err' in (frame as any) || 'error' in (frame as any);

      if (!isResponse) {
        for (const pending of this.pending.values()) {
          if (pending.action === (frame as any).action) {
            isResponse = true;
            break;
          }
        }
      }

      if (isResponse) {
        this.handleResponse(frame as ResponseFrame);
      } else {
        this.handleEvent(frame as EventFrame);
      }
    }
  }

  private handleResponse(frame: ResponseFrame): void {
    let id: string | undefined;
    let entry: PendingCommand | undefined;

    // 1. Try to match by ID if provided
    if (frame.id) {
        id = frame.id;
        entry = this.pending.get(id);
    }

    // 2. If no ID or no match by ID, try to match by action name (command name)
    if (!entry) {
        for (const [pendingId, pendingEntry] of this.pending) {
            if (pendingEntry.action === frame.action) {
                entry = pendingEntry;
                id = pendingId;
                break;
            }
        }
    }

    if (!entry || !id) {
      return;
    }

    this.pending.delete(id);
    if (frame.ok) {
      entry.resolve('data' in frame && frame.data !== undefined ? frame.data : frame);
    } else {
      const error: Record<string, unknown> & { code: string; msg?: string } =
        frame.err && typeof frame.err === 'object'
          ? frame.err as Record<string, unknown> & { code: string; msg?: string }
          : {
              code: frame.error_code ?? 'DEVICE_ERROR',
              msg: frame.message ?? frame.error ?? 'Command failed'
            };
      entry.reject(new DeviceCommandError(error.code, error.msg, error));
    }
  }

  private handleEvent(frame: EventFrame): void {
    this.emitter.emit('event', { key: frame.action, data: frame.data });
  }

  private emitError(where: string, error: unknown): void {
    this.logger?.('error', where, { error: serializeError(error), deviceId: this.descriptor.transportId });
    this.emitter.emit('error', { where, error });
  }

  private assertOpen(): void {
    if (this.closed) {
      throw new Error('Device is closed');
    }
  }
}

interface PendingCommand {
  action: string;
  resolve(value: unknown): void;
  reject(error: unknown): void;
}

function isDeviceFrame(value: unknown): value is DeviceFrame {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const frame = value as Record<string, unknown>;
  return typeof frame.action === 'string';
}

export function parseInfoPayload(
  payload: unknown,
  descriptor: DeviceDescriptor,
  options: ParseInfoPayloadOptions = {}
): NormalizedInfo {
  const requireAttestation = options.requireAttestation ?? true;

  if (!payload || typeof payload !== 'object') {
    throw new Error('INFO payload is invalid');
  }

  const record = payload as Record<string, unknown>;
  const id = typeof record.id === 'string' ? record.id : undefined;
  if (!id || id.length === 0) {
    throw new Error('INFO response missing id');
  }

  const key = typeof record.key === 'string'
    ? record.key
    : (record.key instanceof Uint8Array ? bytesToBase64(record.key) : undefined);
  if (!key || key.length === 0) {
    throw new Error('INFO response missing key');
  }

  const attestationSig = typeof record.signature === 'string'
    ? record.signature
    : (record.signature instanceof Uint8Array
      ? bytesToBase64(record.signature)
      : undefined);
  if (requireAttestation && (!attestationSig || attestationSig.length === 0)) {
    throw new Error('INFO response missing attestation');
  }
  const certificateChain = assembleCertificateChain(record);

  // C code does not send capabilities or alg, assume defaults
  const capabilities: string[] = []; 
  
  const attestationAlg = 'ed25519'; // Implied by C code using Ed25519 keys
  const attestationPayloadVersion = 1;

  const slac = record.slac as Record<string, unknown> | undefined;
  const lastSync = typeof slac?.valid_from === 'number' ? slac.valid_from : undefined;
  const counter = typeof record.counter === 'number' ? record.counter : 0;

  const info: DeviceInfo = {
    ...descriptor,
    id,
    key,
    capabilities,
    firmware: typeof record.firmware === 'string' ? record.firmware : undefined,
    model: typeof record.model === 'string' ? record.model : undefined,
    signature: attestationSig ?? null,
    attestation_dac_der:
      typeof record.attestation_dac_der === 'string' ? record.attestation_dac_der : null,
    attestation_manufacturer_der:
      typeof record.attestation_manufacturer_der === 'string'
        ? record.attestation_manufacturer_der
        : null,
    attestation_intermediate_der:
      typeof record.attestation_intermediate_der === 'string'
        ? record.attestation_intermediate_der
        : null,
    attestation_root_fingerprint:
      typeof record.attestation_root_fingerprint === 'string'
        ? record.attestation_root_fingerprint
        : null,
    heartbeat_slac_der:
      typeof record.heartbeat_slac_der === 'string' ? record.heartbeat_slac_der : null,
    heartbeat_der:
      typeof record.heartbeat_der === 'string' ? record.heartbeat_der : null,
    heartbeat_intermediate_der:
      typeof record.heartbeat_intermediate_der === 'string'
        ? record.heartbeat_intermediate_der
        : null,
    heartbeat_root_fingerprint:
      typeof record.heartbeat_root_fingerprint === 'string'
        ? record.heartbeat_root_fingerprint
        : null,
    name: typeof record.name === 'string' ? record.name : descriptor.name,
    verified: false,
    lastSync,
    sync_required: typeof record.sync_required === 'boolean' ? record.sync_required : false,
    counter,
    custom_heartbeat_url:
      typeof record.custom_heartbeat_url === 'string'
        ? record.custom_heartbeat_url
        : (typeof record.custom_url === 'string' ? record.custom_url : null),
    bio_reporting: typeof record.bio_reporting === 'boolean'
      ? record.bio_reporting
      : (typeof record.telemetry === 'boolean' ? record.telemetry : true),
    wifi_ssid: typeof record.wifi_ssid === 'string' ? record.wifi_ssid : null,
    wifi_password_set: typeof record.wifi_password_set === 'boolean' ? record.wifi_password_set : false,
    mqtt_broker_url: typeof record.mqtt_broker_url === 'string' ? record.mqtt_broker_url : null,
    mqtt_port: typeof record.mqtt_port === 'number' ? record.mqtt_port : undefined,
    mqtt_topic: typeof record.mqtt_topic === 'string' ? record.mqtt_topic : null,
    mqtt_broadcast_frequency_seconds:
      typeof record.mqtt_broadcast_frequency_seconds === 'number'
        ? record.mqtt_broadcast_frequency_seconds
        : (typeof record.mqtt_broadcast_frequency === 'number' ? record.mqtt_broadcast_frequency : undefined),
    mqtt_username: typeof record.mqtt_username === 'string' ? record.mqtt_username : null,
    mqtt_certificate_der: typeof record.mqtt_certificate_der === 'string' ? record.mqtt_certificate_der : null,
    mqtt_ca_der: typeof record.mqtt_ca_der === 'string' ? record.mqtt_ca_der : null,
    mqtt_password_set: typeof record.mqtt_password_set === 'boolean' ? record.mqtt_password_set : false,
    mqtt_broadcast_enabled:
      typeof record.mqtt_broadcast_enabled === 'boolean' ? record.mqtt_broadcast_enabled : false
  };

  const attestation = attestationSig
    ? {
        id,
        key,
        attestationSig,
        certificateChain,
        attestationAlg,
        attestationPayloadVersion
      }
    : undefined;

  return { info, attestation };
}

function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof DeviceTrustError) {
    return {
      name: error.name,
      message: error.message,
      code: error.code,
      id: error.id,
      reason: error.reason,
      attemptedKeyIds: error.attemptedKeyIds
    };
  }

  if (error instanceof Error) {
    return { name: error.name, message: error.message }; // stack intentionally omitted
  }

  return { message: String(error) };
}

interface NormalizedInfo {
  info: DeviceInfo;
  attestation?: DeviceAttestationInputs;
}
