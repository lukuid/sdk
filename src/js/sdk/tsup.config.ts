// SPDX-License-Identifier: Apache-2.0
import { defineConfig } from 'tsup';

export default defineConfig({
  external: [
    '@lukuid/transport-serial-node',
    '@lukuid/transport-ble-node',
    '@abandonware/noble',
    '@abandonware/bluetooth-hci-socket',
    'serialport',
    'ws'
  ]
});
