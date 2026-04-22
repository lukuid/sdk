// SPDX-License-Identifier: Apache-2.0
import lukuid from './index.js';
import { createWebBleTransport } from '@lukuid/transport-webble';
import { createWebUsbTransport } from '@lukuid/transport-webusb';

lukuid.registerTransport(createWebUsbTransport);
lukuid.registerTransport(createWebBleTransport);

export default lukuid;
