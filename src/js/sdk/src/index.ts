// SPDX-License-Identifier: Apache-2.0
import { LukuidSdk } from './sdk.js';

export * from '@lukuid/core';
export { LukuidSdk, LukuidRequestError } from './sdk.js';
export type {
  DeviceDiscoveryOptions,
  DiscoveredDevice,
  DeviceRequestOptions,
  LukuidSdkOptions,
  TransportFactory,
  AttestationItem,
  CheckResult,
  HeartbeatRequest,
  HeartbeatResponse
} from './sdk.js';
export type { ScanDialogOptions, ScanResult } from './ui/ScanDialog.js';

export { generatePDFReport, generatePDFReportWeb } from './pdfReport.js';
export type { EvidencePackage, PdfReportResult } from './pdfReport.js';

let defaultInstance: LukuidSdk | undefined;
const lukuid = new Proxy({} as LukuidSdk, {
  get(_target, property) {
    defaultInstance ??= new LukuidSdk();
    const value = Reflect.get(defaultInstance, property);
    return typeof value === 'function' ? value.bind(defaultInstance) : value;
  }
});
export default lukuid;
