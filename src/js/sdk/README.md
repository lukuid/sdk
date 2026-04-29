# LukuID SDK for JavaScript

`@lukuid/sdk` is the high-level JavaScript and TypeScript entry point for LukuID.

Use it when you want one package that can:

- discover LukuID devices
- validate device identity
- send commands and receive events
- parse and verify `.luku` forensic evidence archives

The package runs in browsers and Node.js. It re-exports the core archive types and wires in the standard LukuID transports.

## Install

```bash
npm install @lukuid/sdk
```

Optional transport packages are also published separately for advanced integration:

- `@lukuid/core`
- `@lukuid/transport-webble`
- `@lukuid/transport-webusb`
- `@lukuid/transport-serial-node`
- `@lukuid/transport-ble-node`

## Quick start

```ts
import lukuid from "@lukuid/sdk";

const devices = await lukuid.getConnectedDevices();

for (const device of devices) {
  console.log(device.info.id, device.info.verified);
}
```

Parse a `.luku` archive:

```ts
import { readFile } from "node:fs/promises";
import lukuid from "@lukuid/sdk";

const bytes = await readFile("identity.luku");
const result = await lukuid.parse(bytes);

console.log(result.verified);
console.log(result.issues);
```

## Parse envelope

Verify a single JSON envelope without wrapping it in a `.luku` archive:

```ts
import lukuid from "@lukuid/sdk";

const issues = await lukuid.verifyEnvelope(envelopeJson, {
  trustProfile: "prod"
});

console.log(issues);
```

## Environment notes

- Browsers: supports WebUSB and WebBluetooth when the runtime exposes those APIs.
- Node.js: supports serial and BLE transports when the matching optional native dependency is installed.
- The API stays JSON-like, but device traffic is encoded into the LukuID transport frame and protobuf payloads expected by firmware.

## Documentation

- JS guide: https://github.com/lukuid/sdk/blob/main/docs/js.md
- Verification guide: https://github.com/lukuid/sdk/blob/main/docs/verification.md
- Examples: https://github.com/lukuid/sdk/tree/main/examples
