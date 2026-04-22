# JavaScript SDK

The JavaScript SDK (`@lukuid/sdk`) provides a unified, transport-agnostic API for discovering, validating,
and communicating with LukuID-compatible devices in **both browsers and Node.js**.

You send commands.  
You receive responses and events.  
The SDK handles discovery, permissions, validation, and transport differences.

The API surface is identical across environments.

On the public API, commands and responses stay JSON-like. On the device wire, the SDK now encodes those commands as firmware-compatible protobuf payloads wrapped in the `LUKUID\x01~` transport frame.

---

## Installation

```bash
npm install @lukuid/sdk
# or
pnpm add @lukuid/sdk
# or
yarn add @lukuid/sdk
```

Note: The SDK is a facade that automatically includes standard transports.

For framework-specific installs:

- React web apps use the same published package: `npm install @lukuid/sdk`

Advanced consumers can also install the lower-level published packages directly:

- `@lukuid/core`
- `@lukuid/transport-webble`
- `@lukuid/transport-webusb`
- `@lukuid/transport-serial-node`
- `@lukuid/transport-ble-node`

The release pipeline also publishes a browser bundle asset to the GitHub release for each SDK tag.

---

## Supported Environments

The JS SDK automatically detects its environment and registers appropriate transports.

### Browser
- **WebUSB**: Supported in Chrome, Edge, Opera.
- **WebBluetooth**: Supported in modern browsers.

### Node.js
- **Serial**: Supports USB CDC and UART ports.
- **BLE**: Supports Bluetooth Low Energy.

---

## Desktop Bridge (Experimental)

The JS SDK supports communicating with the LukuID Desktop App via a local bridge on port `4001`. This allows web applications to access USB and Serial devices without complex browser permissions.

### Testing the Bridge Connection
If you are developing an app that uses the bridge, you can manually test the authorization flow using `curl`:

```bash
# Request access from the Desktop App
curl -X POST http://127.0.0.1:4001/attach \
     -H "Content-Type: application/json" \
     -H "Origin: https://my-dev-app.local" \
     -d '{"friendlyName": "My Local App"}'
```

The Desktop App will prompt you to "Trust & Allow". Once accepted, the `curl` command will return a session token.

---

## Basic Usage

The SDK is exported as a singleton for convenience, but you can also instantiate `LukuidSdk`.

```ts
import lukuid from "@lukuid/sdk";

// Optional: Register custom transports or configure logger
// lukuid.registerTransport(myTransport);
```

To enable verbose discovery diagnostics while debugging a missing device, instantiate `LukuidSdk` with `debugLogging: true`:

```ts
import { LukuidSdk } from "@lukuid/sdk";

const sdk = new LukuidSdk({
  debugLogging: true
});
```

If you want to capture the logs yourself, provide `logger(level, message, context)` instead. Debug logs stay disabled by default.

### List Connected Devices

Returns devices that are already authorized (Browser) or physically connected (Node.js).

```ts
const devices = await lukuid.getConnectedDevices();

for (const device of devices) {
  console.log("Device:", device.info.id, "Verified:", device.info.verified);
}
```

### Fast Discovery

If you only need a cheap snapshot for a picker or local inventory UI, use `getDiscoveredDevices()` instead of opening validated sessions:

```ts
const discovered = await lukuid.getDiscoveredDevices();

for (const device of discovered) {
  console.log(device.transportId, device.name, device.info?.id, device.info?.verified);
}
```

Notes:
- `getDiscoveredDevices()` does not guarantee a fully validated session.
- On Node serial transports, it performs a lightweight `info` probe and can return identity details immediately.
- On BLE/Web transports, `info` may be omitted unless it was already cached from a previous validated connection.

### Requesting Device Access (Browser)

Must be triggered by a user action (e.g. click).

```ts
const connectBtn = document.querySelector("#connect");
connectBtn.addEventListener("click", async () => {
  try {
    const device = await lukuid.requestDevice({
      preferredTransports: ["webusb", "webble"]
    });
    console.log("Connected to:", device.info.id);
  } catch (err) {
    if (err.code === "NO_CANDIDATES") console.log("User cancelled picker");
  }
});
```

### Parse a `.luku` archive

```ts
const result = await lukuid.parse(fileBytes);

console.log("Verified:", result.verified);
console.log("Items:", result.items.length);
console.log("Issues:", result.issues);
```

---

## Device API

Once you have a `Device` instance:

### Send Commands (Asynchronous)

`action()` sends a command and returns immediately without waiting for a response.

```ts
await device.action("SET_LED", { color: "red" });
```

### Perform RPC Calls (Synchronous)

`call()` sends a command, generates a tracking ID, and waits up to 5 seconds for the response.

```ts
const result = await device.call("MY_COMMAND", { param: 123 });
console.log("Result:", result);
```

### Send Raw Binary

Used for high-throughput data or OTA firmware updates.

```ts
await device.send(firmwareBinary);
```

**Note for Post-Quantum Certificates:**
Due to the larger size of ML-DSA-65 certificates (~3-4KB), the SDK automatically handles chunked transfers when sending or receiving certificate data over BLE, respecting the negotiated MTU. Ensure your application logic does not time out during these longer transfer windows.

### Listen for Events

Devices can push asynchronous events.

```ts
device.on("event", (ev) => {
  console.log(`Event [${ev.key}]:`, ev.data);
});
```

### Error Handling

```ts
device.on("error", ({ where, error }) => {
  console.error(`Error in ${where}:`, error);
});
```

### Heartbeat API

The public JS SDK also exposes the cloud heartbeat request directly:

```ts
const heartbeat = await lukuid.heartbeat(
  {
    deviceId: device.info.id,
    publicKey: device.info.key,
    signature,
    csr,
    attestationCertificate,
    attestationRootFingerprint: device.info.attestation_root_fingerprint ?? undefined,
    counter,
    previousState,
    source,
    telemetry
  },
  device.info.custom_heartbeat_url ?? undefined
);
```

`attestationCertificate` may be the full PEM chain from the DAC leaf through the attestation intermediate. If you have the device `info` payload, prefer sending that full chain plus `attestationRootFingerprint`.

If you pass the second argument, that URL is used as the heartbeat API base. Otherwise the SDK falls back to `apiUrl` from `LukuidSdk` options.

---

## Background Monitoring

You can watch for devices being plugged in or coming into range.

```ts
lukuid.on("device", ({ kind, device }) => {
  if (kind === "added") console.log("New device found:", device.info.id);
  if (kind === "removed") console.log("Device lost:", device.info.id);
});

await lukuid.startWatching();
```

Notes:
- Only valid devices are emitted.
- Unsupported or invalid devices are silently ignored.
- For fast, non-validating snapshots, prefer `getDiscoveredDevices()` over `getConnectedDevices()`.

---

## React Integration

The SDK works seamlessly with modern React. It is recommended to handle device lifecycle events within a `useEffect` hook to ensure proper cleanup.

```tsx
import { useState, useEffect } from 'react';
import lukuid from '@lukuid/sdk';

function App() {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    // Sync already connected/authorized devices
    lukuid.getConnectedDevices().then(setDevices);

    // Subscribe to new devices as they appear
    const off = lukuid.on('device', () => {
      lukuid.getConnectedDevices().then(setDevices);
    });

    return () => off();
  }, []);

  return (
    <div>
      <h1>LukuID Devices</h1>
      {devices.map(d => (
        <div key={d.info.id}>
          {d.info.id} - {d.info.verified ? 'Verified' : 'Unverified'}
        </div>
      ))}
      <button onClick={() => lukuid.requestDevice()}>
        Connect New Device
      </button>
      <button onClick={async () => {
        const result = await lukuid.showScanDialog();
        if (result) console.log('Scanned:', result.data);
      }}>
        Scan using Dialog
      </button>
    </div>
  );
}
```

See the [React Web Demo](../examples/react-web-demo) for a complete, production-ready example including RPC calls and logging.

---

## Scan Dialog (UI)

The SDK includes a pre-built, self-contained scanning dialog that handles device discovery and event listening for you. It uses Shadow DOM to ensure styles do not leak into your application.

### `lukuid.showScanDialog(options?)`

Shows a modal dialog that:
1.  Displays currently connected scanners.
2.  Provides a button to connect new scanners.
3.  Shows a "wave the scanner" animation.
4.  Waits for a `scan` event from any connected device.
5.  Automatically closes and resolves with the scan result.

```ts
const result = await lukuid.showScanDialog({
  title: "Identify Animal",
  instruction: "Wave the scanner over the animal's microchip area."
});

if (result) {
  const { device, data } = result;
  console.log(`Scanned ${data.uid} from ${device.info.id}`);
}
```

**Options:**
- `title`: String (Optional) - Title shown in the dialog.
- `instruction`: String (Optional) - Help text shown to the user.

---

## Device Info Structure

`device.info` is always present on valid devices.

```ts
{
  transportId: string,
  transport: string,
  name?: string,
  meta?: Record<string, any>,

  id: string,
  key: string,
  capabilities: string[],
  firmware?: string,
  model?: string,
  verified: boolean
}
```

**Note:** `verified` indicates if the device passed the cryptographic attestation check against the LukuID root key.

All data is stored in memory only for the lifetime of the process or page.

---

## Trust & Verification (PKI)

The SDK implements an automated, offline-first verification protocol using X.509 certificates and Object Identifiers (OIDs).

### `lukuid.syncCRL()`
Downloads the latest Certificate Revocation List (CRL) from the LukuID CDN. It is recommended to call this once per session or daily in background processes.

```ts
await lukuid.syncCRL();
console.log("CRL updated, local verification now reflects latest revocations.");
```

### Local Verification Logic
When a device connects or a `.luku` file is parsed, the SDK automatically:
1.  **Chain Validation:** Verifies the device's DAC (Birth Certificate) against the LukuID Root.
2.  **OID Filtering:** Checks for required OIDs:
    - `1.3.6.1.4.1.65432.1.2` (Manufacturer): Ensures genuine hardware.
    - `1.3.6.1.4.1.65432.1.3` (Heartbeat): Validates the 30-day Trust Runway.
3.  **Revocation Check:** Matches the certificate serial number against the local CRL cache.

The `device.info.verified` property reflects the outcome of this automated protocol.

---

## Error Handling

You can listen for SDK-level errors.

```ts
lukuid.on("error", (err) => {
  console.error(err.where, err.error);
});
```

Errors are emitted for:
- Transport failures
- Validation (`INFO`) failures
- Unexpected disconnects

Invalid devices are never exposed to user code.

---

## Platform Limitations

### Browser
- WebUSB can only list devices previously authorized for the same origin.
- WebBluetooth cannot enumerate devices without a user gesture.
- Background BLE discovery is not possible on the web.

### Node.js
- Serial and BLE enumeration depends on OS permissions.
- No browser-style permission prompts exist.

---

## Design Goals

- One API across browser and Node.js
- No transport-specific logic in user applications
- No partial device objects
- Explicit permission handling
- Minimal assumptions about device commands

---

## Non-Goals

- Persisting device identity across sessions
- Hiding browser security constraints
- Providing UI components
- Hardcoding command schemas
