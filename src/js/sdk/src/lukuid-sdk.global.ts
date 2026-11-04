// SPDX-License-Identifier: Apache-2.0
import lukuid from './index.js';
import { createWebBleTransport } from '@lukuid/transport-webble';
import { createWebUsbTransport } from '@lukuid/transport-webusb';

lukuid.registerTransport(createWebUsbTransport);
lukuid.registerTransport(createWebBleTransport);

// Named exports (createChallengeToken, CaptureError, LukuidSdk, …) sit next to the
// default instance on the `LukuID` global.
export * from './index.js';
export default lukuid;
