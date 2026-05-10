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

## Configuration & Privacy Options

The SDK and Device interactions can be customized using initialization options or environment variables.

| Option / Env Var | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `LUKUID_DISABLE_TELEMETRY` | Env Var | `undefined` | Set to `"1"` to strictly block all telemetry data extraction and transmission globally. |
| `disableExternalCalls` | Config | `false` | Air-gap mode. Blocks all outbound traffic to the LukuID cloud (allows custom local endpoints). |
| `apiUrl` | Config | `https://api.lukuid.com` | Base URL for the LukuID API. |
| `allowUnverifiedDevices` | Config | `false` | If true, permits connection to devices that fail cryptographic attestation (flags as `verified=false`). |
| `debugLogging` | Config | `false` | Emits verbose discovery and validation diagnostics. |
| `crlMemoryOnly` | Config | `false` | Keeps Certificate Revocation Lists (CRLs) strictly in memory without writing to disk. |
| `crlCachePath` | Config | *OS Default* | Custom local directory path for storing the CRL cache. |
| `crlRefreshIntervalHours`| Config | `4` | Frequency of background CRL refresh. Set to `0` to disable auto-refresh. |
| `trustProfile` | Verify Config | `'prod'` | Enforces specific trust roots during `.luku` parsing (`'prod'`, `'dev'`, `'test'`). |
| `allowUntrustedRoots` | Verify Config | `false` | Permits `.luku` verification even if the root certificate isn't in the trusted store. |
| `skipCertificateTemporalChecks`| Verify Config | `false` | Bypasses time-based expiration checks on certificates during `.luku` parsing. |
