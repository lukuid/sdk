# LukuID Serial Transport for Node.js

`@lukuid/transport-serial-node` provides the Node.js serial transport used by the LukuID JavaScript SDK.

Use it when you want USB CDC or UART access in Node.js without taking the full `@lukuid/sdk` facade.

## Install

```bash
npm install @lukuid/transport-serial-node @lukuid/core serialport
```

`serialport` is an optional dependency of the package so host environments that do not need serial access are not forced to compile native bindings.

## Quick start

```ts
import { createSerialTransport } from "@lukuid/transport-serial-node";

const transport = createSerialTransport({
  baudRate: 115200
});

const devices = await transport.listConnected();
console.log(devices.map((device) => device.transportId));
```

## Parse envelope

This transport package is only for device I/O. Use `@lukuid/core` when you need to verify a single JSON envelope:

```ts
import { LukuFile } from "@lukuid/core";

const issues = await LukuFile.verifyEnvelope(envelopeJson, {
  trustProfile: "prod"
});
```

## Runtime notes

- Requires Node.js.
- Serial probing can be restricted with an allowlist for known vendor and product IDs.
- The transport exposes `inspectConnected()` internally to support lightweight identity probes before a full validated session is opened.

## Documentation

- JS guide: https://github.com/lukuid/sdk/blob/main/docs/js.md
