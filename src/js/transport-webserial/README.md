# LukuID WebUSB Transport

`@lukuid/transport-webusb` provides the browser WebUSB transport used by the LukuID JavaScript SDK.

Use it when you need direct browser USB access but want to compose your own SDK surface from the lower-level packages.

## Install

```bash
npm install @lukuid/transport-webusb @lukuid/core
```

## Quick start

```ts
import { createWebUsbTransport } from "@lukuid/transport-webusb";

const transport = createWebUsbTransport();

const candidate = await transport.requestDevice({
  filters: [{ vendorId: 0x303a }]
});
```

## Parse envelope

This transport package does not parse envelopes by itself. Use `@lukuid/core` alongside it for single-record verification:

```ts
import { LukuFile } from "@lukuid/core";

const issues = await LukuFile.verifyEnvelope(envelopeJson, {
  trustProfile: "prod"
});
```

## Browser requirements

- Requires `navigator.usb`.
- WebUSB device selection must be triggered by a user gesture.
- `requestDevice()` requires explicit USB filters.
- The transport handles interface claiming, endpoint discovery, and reconnect retries around transient device-open failures.

## Documentation

- JS guide: https://github.com/lukuid/sdk/blob/main/docs/js.md
