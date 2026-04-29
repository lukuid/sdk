# LukuID BLE Transport for Node.js

`@lukuid/transport-ble-node` provides the Node.js Bluetooth Low Energy transport used by the LukuID JavaScript SDK.

Use it when you need BLE device discovery in Node.js and want to compose your own transport stack around the shared LukuID core package.

## Install

```bash
npm install @lukuid/transport-ble-node @lukuid/core @abandonware/noble
```

`@abandonware/noble` is kept as an optional dependency so archive-only or serial-only hosts do not pull in BLE-specific native requirements.

## Quick start

```ts
import { createBleTransport } from "@lukuid/transport-ble-node";

const transport = createBleTransport();

if (!transport.isSupported()) {
  throw new Error("BLE support is not available in this Node.js environment");
}

const devices = await transport.listConnected();
console.log(devices.map((device) => device.name));
```

## Parse envelope

This transport package is only for BLE device access. Use `@lukuid/core` when you need to verify a single JSON envelope:

```ts
import { LukuFile } from "@lukuid/core";

const issues = await LukuFile.verifyEnvelope(envelopeJson, {
  trustProfile: "prod"
});
```

## Runtime notes

- Requires Node.js.
- BLE availability depends on the host OS and native Bluetooth stack.
- The transport scans for the LukuID BLE service and manages GATT read and write chunking for device traffic.

## Documentation

- JS guide: https://github.com/lukuid/sdk/blob/main/docs/js.md
