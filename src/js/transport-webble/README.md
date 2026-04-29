# LukuID WebBluetooth Transport

`@lukuid/transport-webble` provides the browser WebBluetooth transport used by the LukuID JavaScript SDK.

Use it when you want to assemble a custom SDK instance instead of pulling in the full `@lukuid/sdk` facade.

## Install

```bash
npm install @lukuid/transport-webble @lukuid/core
```

## Quick start

```ts
import { createWebBleTransport } from "@lukuid/transport-webble";

const transport = createWebBleTransport();

if (!transport.isSupported()) {
  throw new Error("WebBluetooth is not available in this browser");
}

const candidate = await transport.requestDevice();
```

## Parse envelope

This transport package does not parse envelopes by itself. Pair it with `@lukuid/core` when you need single-record verification:

```ts
import { LukuFile } from "@lukuid/core";

const issues = await LukuFile.verifyEnvelope(envelopeJson, {
  trustProfile: "prod"
});
```

## Browser requirements

- Requires `navigator.bluetooth`.
- Device selection must be triggered by a user gesture.
- The transport manages the LukuID BLE service and characteristic wiring, including chunked writes for larger payloads.

## Documentation

- JS guide: https://github.com/lukuid/sdk/blob/main/docs/js.md
