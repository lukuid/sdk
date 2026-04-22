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

const lukuid = new LukuidSdk();
export default lukuid;
