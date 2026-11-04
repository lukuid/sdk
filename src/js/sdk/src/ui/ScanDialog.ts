// SPDX-License-Identifier: Apache-2.0
import type { Device } from '@lukuid/core';

// LukuidSdk.showScanDialog() runs LukuidSdk.capture() with the capture dialog.

export interface ScanDialogOptions {
  title?: string;
  instruction?: string;
}

export interface ScanResult {
  device: Device;
  data: any;
}
