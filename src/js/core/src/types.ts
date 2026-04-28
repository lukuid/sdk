// SPDX-License-Identifier: Apache-2.0
export type Unsubscribe = () => void;
export type MaybePromise<T> = T | Promise<T>;

export type Logger = (level: 'debug' | 'warn' | 'error', message: string, context?: Record<string, unknown>) => void;

export interface Connection {
  write(data: Uint8Array): Promise<void>;
  onData(handler: (chunk: Uint8Array) => void): Unsubscribe;
  close(reason?: string): Promise<void>;
}

export interface WatcherHandle {
  stop(): MaybePromise<void>;
}

export interface DeviceDescriptor {
  transportId: string;
  transport: string;
  name?: string;
  meta?: Record<string, unknown>;
}

export interface DeviceInfo extends DeviceDescriptor {
  id: string;
  key: string;
  capabilities: string[];
  firmware?: string;
  model?: string;
  signature?: string | null;
  attestation_dac_der?: string | null;
  attestation_manufacturer_der?: string | null;
  attestation_intermediate_der?: string | null;
  attestation_root_fingerprint?: string | null;
  heartbeat_slac_der?: string | null;
  heartbeat_der?: string | null;
  heartbeat_intermediate_der?: string | null;
  heartbeat_root_fingerprint?: string | null;
  verified: boolean;
  telemetry?: boolean;
  lastSync?: number;
  counter: number;
  custom_heartbeat_url?: string | null;
  bio_reporting?: boolean;
  wifi_ssid?: string | null;
  wifi_password_set?: boolean;
  mqtt_broker_url?: string | null;
  mqtt_port?: number;
  mqtt_topic?: string | null;
  mqtt_broadcast_frequency_seconds?: number;
  mqtt_username?: string | null;
  mqtt_certificate_der?: string | null;
  mqtt_ca_der?: string | null;
  mqtt_password_set?: boolean;
  mqtt_broadcast_enabled?: boolean;
}

export interface DeviceCandidate<TNative = unknown> extends DeviceDescriptor {
  native: TNative;
}

export interface DiscoveredDevice extends DeviceDescriptor {
  info?: DeviceInfo;
}

export interface TransportDeviceEvent {
  kind: 'added' | 'removed';
  candidate: DeviceCandidate;
}

export type TransportWatchHandler = (event: TransportDeviceEvent) => void;

export interface Transport {
  name: string;
  isSupported(): boolean;
  listConnected(): Promise<DeviceCandidate[]>;
  inspectConnected?(): Promise<DiscoveredDevice[]>;
  requestDevice?(options?: unknown): Promise<DeviceCandidate | null>;
  startWatching?(handler: TransportWatchHandler): Promise<WatcherHandle>;
  open(candidate: DeviceCandidate): Promise<Connection>;
}

export interface DeviceEventMap extends Record<string, unknown> {
  event: { key: string; data: unknown };
  message: unknown;
  error: { where: string; error: unknown };
  close: { reason?: string };
}

export interface Device {
  readonly info: DeviceInfo;
  action(key: string, opts?: Record<string, unknown>): Promise<void>;
  call(key: string, opts?: Record<string, unknown>): Promise<unknown>;
  callWithTimeout(key: string, opts: Record<string, unknown>, timeoutMs: number): Promise<unknown>;
  send(data: Uint8Array): Promise<void>;
  close(reason?: string): Promise<void>;
  on<TEvent extends keyof DeviceEventMap>(event: TEvent, handler: (payload: DeviceEventMap[TEvent]) => void): Unsubscribe;
}

export interface DeviceFactoryOptions {
  logger?: Logger;
  cachedInfo?: DeviceInfo;
  onValidated?: (info: DeviceInfo) => void;
  allowUnverifiedDevices?: boolean;
  commandTimeoutMs?: number;
}

export interface DeviceContext {
  descriptor: DeviceDescriptor;
  openConnection: () => Promise<Connection>;
  options?: DeviceFactoryOptions;
}

export interface DeviceController {
  device: Device;
  ensureValidated(): Promise<DeviceInfo>;
}

export interface CommandFrame {
  action: string;
  id: string;
  opts?: Record<string, unknown>;
}

export interface ResponseFrameOk {
  action: string;
  id?: string;
  ok: true;
  success?: boolean;
  status?: string;
  message?: string;
  data?: unknown;
  [key: string]: unknown;
}

export interface ResponseFrameErr {
  action: string;
  id?: string;
  ok: false;
  success?: boolean;
  status?: string;
  message?: string;
  error?: string;
  error_code?: string;
  err: {
    code: string;
    msg?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface SelfTestResult {
  alg: string;
  operation: string;
  passed: boolean;
  id: string;
}

export type ResponseFrame = ResponseFrameOk | ResponseFrameErr;

export interface EventFrame {
  action: string;
  data?: unknown;
  [key: string]: unknown;
}

export type DeviceFrame = CommandFrame | ResponseFrame | EventFrame;
