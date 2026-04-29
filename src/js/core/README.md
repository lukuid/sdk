# LukuID Core for JavaScript

`@lukuid/core` exposes the low-level primitives behind the JavaScript SDK.

Use it if you are building your own transport, embedding LukuID archive verification into another runtime, or composing a custom SDK surface. If you want the batteries-included package, use `@lukuid/sdk` instead.

## Install

```bash
npm install @lukuid/core
```

## What it provides

- `.luku` parsing and verification primitives
- frame encoder and decoder helpers
- device factory and validation helpers
- shared transport and device types

## Quick start

```ts
import { parseLukuFile } from "@lukuid/core";

const result = await parseLukuFile(fileBytes);

console.log(result.verified);
console.log(result.items.length);
```

Build a validated device controller from your own transport connection:

```ts
import { createDevice } from "@lukuid/core";

const controller = createDevice({
  descriptor,
  openConnection
});

await controller.ensureValidated();
console.log(controller.device.info.id);
```

## Parse envelope

Use the core archive primitives to verify a single JSON envelope:

```ts
import { LukuFile } from "@lukuid/core";

const issues = await LukuFile.verifyEnvelope(envelopeJson, {
  trustProfile: "prod"
});

console.log(issues);
```

## Documentation

- JS guide: https://github.com/lukuid/sdk/blob/main/docs/js.md
- Verification guide: https://github.com/lukuid/sdk/blob/main/docs/verification.md
