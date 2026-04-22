// SPDX-License-Identifier: Apache-2.0
import {
  createDevice,
  Device,
  DeviceCandidate,
  DeviceController,
  DeviceDescriptor,
  DeviceInfo,
  DeviceTrustError,
  TinyEventEmitter,
  Transport,
  TransportDeviceEvent,
  Unsubscribe
} from '@lukuid/core';

export interface DeviceDiscoveryOptions {
  preferredTransports?: string[];
}

export interface DeviceRequestOptions extends DeviceDiscoveryOptions {
  transportOptions?: Record<string, unknown>;
}

export interface DiscoveredDevice {
  transportId: string;
  transport: string;
  name?: string;
  meta?: Record<string, unknown>;
  info?: DeviceInfo;
}

export interface LukuidSdkOptions {
  logger?: (level: 'debug' | 'warn' | 'error', message: string, context?: Record<string, unknown>) => void;
  /**
   * If true, emit verbose SDK and transport diagnostics. Default is `false`.
   */
  debugLogging?: boolean;
  /**
   * If true, devices that fail cryptographic attestation will still be exposed
   * but will have `verified: false`. Default is `false`.
   */
  allowUnverifiedDevices?: boolean;
  /**
   * Base URL for the LukuID API. Defaults to https://api.lukuid.com.
   */
  apiUrl?: string;
}

export interface AttestationItem {
  type: 'device' | 'time_authority' | string;
  data: Record<string, unknown>;
  signature: string;
}

export interface CheckResult {
  status: 'ok' | 'error';
  attestations: Array<{
    type: string;
    verified: boolean;
    status: string;
    [key: string]: unknown;
  }>;
}

export interface HeartbeatRequest {
  deviceId: string;
  publicKey: string;
  signature: string;
  csr: string;
  attestationCertificate: string;
  attestationRootFingerprint?: string;
  counter: number;
  previousState: Record<string, unknown>;
  source: Record<string, unknown>;
  telemetry: unknown[];
}

export interface HeartbeatResponse {
  action?: string;
  slac_der: string;
  heartbeat_der: string;
  intermediate_der: string;
  signature: string;
  timestamp: number;
  [key: string]: unknown;
}

export type TransportFactory = () => Promise<Transport> | Transport;

interface SdkEventMap extends Record<string, unknown> {
  device: { kind: 'added' | 'removed'; device: Device };
  error: { where: string; error: unknown; transport?: string; id?: string };
}

interface DeviceRecord {
  device: Device;
  transport: string;
  candidateId: string;
}

interface DeviceSummary {
  transportId: string;
  name?: string;
  transport: string;
  meta?: Record<string, unknown>;
}

export class LukuidRequestError extends Error {
  constructor(
    public readonly code: 'NO_CANDIDATES' | 'AMBIGUOUS' | 'FAILED',
    message: string,
    public readonly candidates?: DeviceSummary[]
  ) {
    super(message);
    this.name = 'LukuidRequestError';
  }
}

export class LukuidSdk {
  private readonly emitter = new TinyEventEmitter<SdkEventMap>();
  private readonly registry = new TransportRegistry((level, message, context) => this.log(level, message, context));
  private readonly devices = new Map<string, DeviceRecord>();
  private readonly deviceKeys = new WeakMap<Device, string>();
  private readonly deviceDisposers = new WeakMap<Device, () => void>();
  private readonly infoCache = new Map<string, DeviceInfo>();
  private readonly watchers = new Map<string, WatcherHandle>();
  private readonly defaultTransportsReady: Promise<void>;
  private watchRequested = false;

  constructor(private readonly options: LukuidSdkOptions = {}) {
    this.defaultTransportsReady = autoRegisterDefaultTransports(
      this.registry,
      (level, message, context) => this.log(level, message, context),
      this.options.debugLogging ?? false
    );
  }

  async getConnectedDevices(options?: DeviceDiscoveryOptions): Promise<Device[]> {
    const transports = await this.selectTransports(options?.preferredTransports);
    this.log('debug', 'Enumerating connected devices', {
      preferredTransports: options?.preferredTransports,
      selectedTransports: transports.map((transport) => transport.name)
    });
    const seen = new Set<string>();

    for (const transport of transports) {
      try {
        const candidates = await transport.listConnected();
        this.log('debug', 'Transport returned connected candidates', {
          transport: transport.name,
          count: candidates.length
        });
        for (const candidate of candidates) {
          const key = this.buildKey(transport.name, candidate.transportId);
          seen.add(key);
          await this.upsertDevice(transport, candidate, { propagateTrustError: true });
        }
      } catch (error) {
        if (error instanceof DeviceTrustError) {
          throw error;
        }
        this.emitError('listConnected', error, transport.name);
      }
    }

    const allowedTransports = new Set(transports.map((transport) => transport.name));
    for (const [key, record] of this.devices) {
      if (!allowedTransports.has(record.transport)) {
        continue;
      }

      if (!seen.has(key)) {
        await this.dropDevice(key, 'refresh');
      }
    }

    return Array.from(this.devices.values())
      .filter((record) => !options?.preferredTransports || options.preferredTransports.includes(record.transport))
      .map((record) => record.device);
  }

  async getDiscoveredDevices(options?: DeviceDiscoveryOptions): Promise<DiscoveredDevice[]> {
    const transports = await this.selectTransports(options?.preferredTransports);
    this.log('debug', 'Enumerating discovered devices', {
      preferredTransports: options?.preferredTransports,
      selectedTransports: transports.map((transport) => transport.name)
    });
    const discovered = new Map<string, DiscoveredDevice>();

    for (const transport of transports) {
      try {
        const inspectable = transport as Transport & {
          inspectConnected?: () => Promise<DiscoveredDevice[]>;
        };

        if (inspectable.inspectConnected) {
          const inspected = await inspectable.inspectConnected();
          this.log('debug', 'Transport inspection completed', {
            transport: transport.name,
            count: inspected.length,
            method: 'inspectConnected'
          });
          for (const item of inspected) {
            const key = this.buildKey(transport.name, item.transportId);
            discovered.set(key, {
              ...item,
              info: this.devices.get(key)?.device.info ?? item.info ?? this.infoCache.get(key)
            });
          }
          continue;
        }

        const candidates = await transport.listConnected();
        this.log('debug', 'Transport inspection fell back to listConnected', {
          transport: transport.name,
          count: candidates.length
        });
        for (const candidate of candidates) {
          const key = this.buildKey(transport.name, candidate.transportId);
          discovered.set(key, {
            transportId: candidate.transportId,
            transport: transport.name,
            name: candidate.name,
            meta: candidate.meta,
            info: this.devices.get(key)?.device.info ?? this.infoCache.get(key)
          });
        }
      } catch (error) {
        this.emitError('inspectConnected', error, transport.name);
      }
    }

    return Array.from(discovered.values());
  }

  async requestDevice(options?: DeviceRequestOptions): Promise<Device> {
    const transports = await this.selectTransports(options?.preferredTransports);
    this.log('debug', 'Requesting device', {
      preferredTransports: options?.preferredTransports,
      selectedTransports: transports.map((transport) => transport.name),
      isBrowser: isBrowser()
    });
    if (isBrowser()) {
      for (const transport of transports) {
        if (!transport.requestDevice) {
          this.log('debug', 'Skipping transport without requestDevice support', {
            transport: transport.name
          });
          continue;
        }

        try {
          const requestOptions = options?.transportOptions?.[transport.name];
          const candidate = await transport.requestDevice(requestOptions);
          if (!candidate) {
            continue;
          }

          const device = await this.upsertDevice(transport, candidate, { propagateTrustError: true });
          if (device) {
            return device;
          }
        } catch (error) {
          this.emitError('requestDevice', error, transport.name);
          throw error;
        }
      }

      throw new LukuidRequestError('NO_CANDIDATES', 'No device selected');
    }

    const candidates: Array<{ transport: Transport; candidate: DeviceCandidate }> = [];
    for (const transport of transports) {
      try {
        const listed = await transport.listConnected();
        this.log('debug', 'Request-device candidate snapshot', {
          transport: transport.name,
          count: listed.length
        });
        for (const candidate of listed) {
          candidates.push({ transport, candidate });
        }
      } catch (error) {
        if (error instanceof DeviceTrustError) {
          throw error;
        }
        this.emitError('requestDevice', error, transport.name);
      }
    }

    if (candidates.length === 0) {
      throw new LukuidRequestError('NO_CANDIDATES', 'No devices available');
    }

    if (candidates.length > 1) {
      throw new LukuidRequestError(
        'AMBIGUOUS',
        'Multiple devices available',
        candidates.map((entry) => summarize(entry.candidate, entry.transport.name))
      );
    }

    const { transport, candidate } = candidates[0];
    const device = await this.upsertDevice(transport, candidate, { propagateTrustError: true });
    if (!device) {
      throw new LukuidRequestError('FAILED', 'Unable to open device');
    }

    return device;
  }

  /**
   * Performs an optional Level 2 Cloud Attestation check.
   * This sends an array of cryptographic attestations (device keys, time authority, etc.)
   * to our backend for high-assurance verification against revocation lists.
   */
  async check(attestations: AttestationItem[], customUrl?: string): Promise<CheckResult> {
    const defaultApiUrl = this.options.apiUrl || 'https://api.lukuid.com';
    const apiUrl = customUrl || defaultApiUrl;
    
    const response = await fetch(`${apiUrl.replace(/\/$/, '')}/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ attestations })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Cloud check failed with status ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Fetches a signed heartbeat payload from the LukuID API.
   */
  async heartbeat(
    request: HeartbeatRequest,
    customUrl?: string
  ): Promise<HeartbeatResponse> {
    const defaultApiUrl = this.options.apiUrl || 'https://api.lukuid.com';
    const apiUrl = customUrl || defaultApiUrl;

    const response = await fetch(`${apiUrl.replace(/\/$/, '')}/heartbeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        device_id: request.deviceId,
        public_key: request.publicKey,
        signature: request.signature,
        csr: request.csr,
        attestation: request.attestationCertificate,
        attestation_root_fingerprint: request.attestationRootFingerprint,
        counter: request.counter,
        previous_state: request.previousState,
        source: request.source,
        telemetry: request.telemetry
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Heartbeat failed with status ${response.status}`);
    }

    return await response.json();
  }

  async startWatching(): Promise<void> {
    this.watchRequested = true;
    const transports = await this.selectTransports();
    this.log('debug', 'Starting transport watchers', {
      transports: transports.map((transport) => transport.name)
    });
    for (const transport of transports) {
      await this.ensureWatcher(transport);
    }

    await this.getConnectedDevices();
  }

  async stopWatching(): Promise<void> {
    this.watchRequested = false;
    this.log('debug', 'Stopping transport watchers', {
      transports: Array.from(this.watchers.keys())
    });
    for (const [name, handle] of this.watchers) {
      try {
        await handle.stop();
      } catch (error) {
        this.emitError('stopWatching', error, name);
      }
    }

    this.watchers.clear();
  }

  on<TEvent extends keyof SdkEventMap>(event: TEvent, handler: (payload: SdkEventMap[TEvent]) => void): Unsubscribe {
    return this.emitter.on(event, handler);
  }

  registerTransport(factoryOrInstance: Transport | TransportFactory): void {
    this.registry.register(factoryOrInstance);
    if (this.watchRequested) {
      void this.startWatching();
    }
  }

  async listTransports(): Promise<string[]> {
    const transports = await this.selectTransports();
    return transports.map((transport) => transport.name);
  }

  /**
   * Returns currently connected and validated devices immediately.
   */
  getConnectedDevicesSync(): Device[] {
    return Array.from(this.devices.values()).map((record) => record.device);
  }

  /**
   * Shows a self-contained scanning dialog.
   * Works in both React and vanilla JS.
   */
  async showScanDialog(options?: import('./ui/ScanDialog.js').ScanDialogOptions): Promise<import('./ui/ScanDialog.js').ScanResult | null> {
    const { showScanDialog } = await import('./ui/ScanDialog.js');
    return showScanDialog(this, options);
  }

  /**
   * Shows a forensic report viewer for a .luku file.
   * Verifies the file before displaying.
   */
  async showReport(input: Uint8Array | string): Promise<void> {
    const result = await this.parse(input);
    const { showReportViewer } = await import('./ui/ReportViewer.js');
    return showReportViewer(result);
  }

  /**
   * Parses a .luku file.
   * Accepts binary data (Uint8Array) or a filename (string, Node.js only).
   */
  async parse(input: Uint8Array | string): Promise<import('@lukuid/core').LukuParseResult> {
    let data: Uint8Array;
    if (typeof input === 'string') {
      if (!isNode()) {
        throw new Error('Parsing from filename is only supported in Node.js');
      }
      const fs = await import('node:fs/promises');
      data = new Uint8Array(await fs.readFile(input));
    } else {
      data = input;
    }

    const { parseLukuFile } = await import('@lukuid/core');
    return parseLukuFile(data);
  }

  private async ensureWatcher(transport: Transport): Promise<void> {
    if (!this.watchRequested || this.watchers.has(transport.name)) {
      return;
    }

    if (!transport.startWatching) {
      this.log('debug', 'Transport has no watcher support', { transport: transport.name });
      return;
    }

    try {
      const handle = await transport.startWatching((event) => {
        void this.handleTransportEvent(transport, event);
      });
      this.watchers.set(transport.name, handle);
      this.log('debug', 'Transport watcher started', { transport: transport.name });
    } catch (error) {
      this.emitError('startWatching', error, transport.name);
    }
  }

  private async handleTransportEvent(transport: Transport, event: TransportDeviceEvent): Promise<void> {
    this.log('debug', 'Transport event received', {
      transport: transport.name,
      kind: event.kind,
      transportId: event.candidate.transportId
    });
    if (event.kind === 'added') {
      await this.upsertDevice(transport, event.candidate);
      return;
    }

    const key = this.buildKey(transport.name, event.candidate.transportId);
    await this.dropDevice(key, 'transport');
  }

  private async upsertDevice(
    transport: Transport,
    candidate: DeviceCandidate,
    options?: { propagateTrustError?: boolean }
  ): Promise<Device | null> {
    const key = this.buildKey(transport.name, candidate.transportId);
    const existing = this.devices.get(key);
    if (existing) {
      this.log('debug', 'Device already tracked', {
        transport: transport.name,
        transportId: candidate.transportId
      });
      return existing.device;
    }

    const controller = this.createDeviceController(transport, candidate, key);
    this.log('debug', 'Validating device candidate', {
      transport: transport.name,
      transportId: candidate.transportId,
      name: candidate.name
    });

    try {
      await controller.ensureValidated();
      const device = controller.device;
      this.devices.set(key, { device, transport: transport.name, candidateId: candidate.transportId });
      this.deviceKeys.set(device, key);
      this.attachDeviceListeners(device, key, transport.name);
      this.emitter.emit('device', { kind: 'added', device });
      this.log('debug', 'Device validated and added', {
        transport: transport.name,
        transportId: candidate.transportId,
        deviceId: device.info.id,
        verified: device.info.verified
      });
      return device;
    } catch (error) {
      await controller.device.close('validation').catch(() => undefined);
      this.emitError('validate', error, transport.name, candidate.transportId);
      if (options?.propagateTrustError && error instanceof DeviceTrustError) {
        throw error;
      }
      return null;
    }
  }

  private createDeviceController(transport: Transport, candidate: DeviceCandidate, key: string): DeviceController {
    const descriptor: DeviceDescriptor = {
      transportId: candidate.transportId,
      transport: transport.name,
      name: candidate.name,
      meta: candidate.meta
    };

    return createDevice({
      descriptor,
      openConnection: () => transport.open(candidate),
      options: {
        cachedInfo: this.infoCache.get(key),
        onValidated: (info) => this.infoCache.set(key, info),
        logger: (level, message, context) => this.log(level, message, { transport: transport.name, ...context }),
        allowUnverifiedDevices: this.options.allowUnverifiedDevices
      }
    });
  }

  private attachDeviceListeners(device: Device, key: string, transport: string): void {
    const offError = device.on('error', (payload) => this.emitError(payload.where, payload.error, transport, device.info.transportId));
    const offClose = device.on('close', () => {
      const record = this.devices.get(key);
      if (!record || record.device !== device) {
        return;
      }

      this.devices.delete(key);
      this.deviceKeys.delete(device);
      this.deviceDisposers.delete(device);
      this.emitter.emit('device', { kind: 'removed', device });
    });

    this.deviceDisposers.set(device, () => {
      offError();
      offClose();
    });
  }

  private async dropDevice(key: string, reason: string): Promise<void> {
    const record = this.devices.get(key);
    if (!record) {
      return;
    }

    this.devices.delete(key);
    this.deviceKeys.delete(record.device);
    const disposer = this.deviceDisposers.get(record.device);
    disposer?.();
    this.deviceDisposers.delete(record.device);

    await record.device.close(reason).catch((error) => this.emitError('close', error, record.transport, record.candidateId));
    this.emitter.emit('device', { kind: 'removed', device: record.device });
  }

  private async selectTransports(preferred?: string[]): Promise<Transport[]> {
    await this.defaultTransportsReady;
    const transports = await this.registry.getTransports();
    this.log('debug', 'Transports available', {
      preferred,
      transports: transports.map((transport) => transport.name)
    });

    if (!preferred || preferred.length === 0) {
      return transports;
    }

    const allowed = new Set(preferred);
    const ordered: Transport[] = [];
    for (const name of preferred) {
      const transport = transports.find((entry) => entry.name === name);
      if (transport && !ordered.includes(transport)) {
        ordered.push(transport);
      }
    }

    return ordered;
  }

  private buildKey(transport: string, id: string): string {
    return `${transport}:${id}`;
  }

  private log(level: 'debug' | 'warn' | 'error', message: string, context?: Record<string, unknown>): void {
    this.options.logger?.(level, message, context);

    if (!this.options.logger) {
      if (level === 'debug' && !this.options.debugLogging) {
        return;
      }

      const payload = context ? `${message} ${JSON.stringify(context)}` : message;
      const target =
        level === 'error' ? console.error : level === 'warn' ? console.warn : console.debug;
      target(`[lukuid] ${payload}`);
    }
  }

  private emitError(where: string, error: unknown, transport?: string, id?: string): void {
    this.log('warn', where, { error: serializeError(error), transport, id });
    this.emitter.emit('error', { where, error, transport, id });
  }
}

interface WatcherHandle {
  stop(): Promise<void> | void;
}

class TransportRegistry {
  private readonly entries: TransportEntry[] = [];

  constructor(private readonly logger: (level: 'debug' | 'warn' | 'error', message: string, context?: Record<string, unknown>) => void) {}

  register(factoryOrInstance: Transport | TransportFactory): void {
    const entry: TransportEntry = {
      loader: typeof factoryOrInstance === 'function' ? factoryOrInstance : () => factoryOrInstance,
      instance: null
    };
    this.entries.push(entry);
  }

  async getTransports(): Promise<Transport[]> {
    const transports: Transport[] = [];

    for (const entry of this.entries) {
      if (!entry.instance) {
        try {
          entry.instance = await entry.loader();
        } catch (error) {
          this.logger('warn', 'Transport failed to initialize', { error: serializeError(error) });
          entry.instance = null;
        }
      }

      if (entry.instance && entry.instance.isSupported()) {
        transports.push(entry.instance);
      }
    }

    return transports;
  }
}

interface TransportEntry {
  loader: TransportFactory;
  instance: Transport | null;
}

async function autoRegisterDefaultTransports(
  registry: TransportRegistry,
  logger: (level: 'debug' | 'warn' | 'error', message: string, context?: Record<string, unknown>) => void,
  debugLogging: boolean
): Promise<void> {
  if (isBrowser()) {
    registry.register(async () => {
      const mod = await import('@lukuid/transport-webusb');
      return mod.createWebUsbTransport();
    });

    registry.register(async () => {
      const mod = await import('@lukuid/transport-webble');
      return mod.createWebBleTransport();
    });
  }

  if (isNode()) {
    registry.register(async () => {
      const mod = await import('@lukuid/transport-serial-node');
      const serialOptions = {
        debugLogging,
        logger: (
          level: 'debug' | 'warn' | 'error',
          message: string,
          context?: Record<string, unknown>
        ) => logger(level, message, { transport: 'serial', ...context })
      } as Parameters<typeof mod.createSerialTransport>[0];
      return mod.createSerialTransport(serialOptions);
    });

    registry.register(async () => {
      const mod = await import('@lukuid/transport-ble-node');
      return mod.createBleTransport();
    });
  }
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined';
}

function isNode(): boolean {
  return typeof process !== 'undefined' && Boolean(process.versions?.node);
}

function summarize(candidate: DeviceCandidate, transport: string): DeviceSummary {
  return {
    transportId: candidate.transportId,
    name: candidate.name,
    transport,
    meta: candidate.meta
  };
}

function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return { name: error.name, message: error.message };
  }

  return { message: String(error) };
}
