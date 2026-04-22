# LukuID SDK Snippets

Concise examples for the most common LukuID operations across all supported platforms.

## JavaScript / TypeScript (Browser & Node.js)

**Install:**
```bash
npm install @lukuid/sdk
```

**Code:**
```ts
import lukuid from '@lukuid/sdk';

// 1. Connect to a device
const device = await lukuid.requestDevice();

// 2. Listen for card/tag scans
device.on('event', ({ key, data }) => {
  if (key === 'scan') console.log('UID:', data.uid);
});

// 3. Get device identity and capabilities
const info = await device.call('info', {});
console.log('Model:', info.model);

// 4. Or use the built-in UI for a complete scanning flow
const result = await lukuid.showScanDialog();

// 5. Parse a .luku file
const { verified, items } = await lukuid.parse(fileBytes);
```

## Android (Kotlin)

**Install (build.gradle.kts):**
```kotlin
implementation("com.lukuid:lukuid-sdk-android:0.1.0")
```

**Code:**
```kotlin
val sdk = LukuSdk(context)

// 1. Request the nearest LukuID device
val device = sdk.requestDevice()

// 2. Listen for incoming scan events
device.onEvent { ev ->
    if (ev.key == "scan") println("Scanned UID: ${ev.data["uid"]}")
}

// 3. Fetch device metadata
val info = device.call("info", emptyMap())
println("Firmware: ${info["firmware"]}")

// 4. Parse a .luku file
val result = sdk.parse(fileBytes)
println("File Verified: ${result.verified}")
```

## Apple (Swift / iOS / macOS)

**Install (Package.swift):**
```swift
.package(url: "https://github.com/lukuid/sdk.git", from: "0.1.0")
```

**Code:**
```swift
let client = LukuIDClient()

// 1. Connect to a LukuID reader
let device = try await client.requestDevice()

// 2. Handle real-time scan events
device.onEvent { event in
    if event.key == "scan" {
        print("Scanned Tag: \(event.data["uid"] ?? "unknown")")
    }
}

// 3. Retrieve device details
let info = try await device.call(key: "info", opts: [:])
print("Device Model: \(info["model"] ?? "Unknown")")

// 4. Parse a .luku file
let fileResult = try client.parse(data: fileData)
print("Is Verified: \(fileResult.verified)")
```

## Rust

**Install (Cargo.toml):**
```toml
lukuid-sdk = "0.1.0"
```

**Code:**
```rust
let transport = SerialTransport::new();

// 1. Connect to a verified device
let device = Device::connect(&transport, "/dev/ttyUSB0", options).await?;

// 2. Subscribe to asynchronous events
let mut rx = device.subscribe();
tokio::spawn(async move {
    while let Ok(ev) = rx.recv().await {
        if ev.key == "scan" { println!("UID: {:?}", ev.data.get("uid")); }
    }
});

// 3. Fetch device info
let info = device.call("info", json!({})).await?;
println!("Device ID: {:?}", info.get("id"));

// 4. Parse a .luku file
let result = lukuid_sdk::parse_bytes(&file_bytes)?;
println!("Verified: {}", result.verified);
```

## Python

**Install:**
```bash
python -m pip install lukuid-sdk
```

**Code:**
```python
from lukuid_sdk import LukuFile

result = LukuFile.parse("identity.luku")

print("Verified:", result.verified)
print("Items:", len(result.items))

for item in result.items:
    print(item.type, item.verified)
```

## PDF Generation & Signing

Generate a sovereign forensic report with hardware-backed signing (Tauri/Native) or browser-based fallback.

### TypeScript / JavaScript

```ts
import { generatePDFReport } from '@lukuid/sdk';

const evidence = {
  version: "1.0",
  uid: "LUKUID-1708600000-1-TAG-ABCDE",
  signature: "sig_...",
  payload: {
    ctr: 1,
    id: "LUKUID-...",
    timestamp_utc: 1708600000,
    uptime_us: 1234567,
    temperature_c: 24.5,
    nonce: "...",
    firmware: "1.2.0"
  },
  device: { device_id: "READER-001", public_key: "..." },
  manufacturer: { signature: "...", public_key: "..." },
  identity: {
    crt: 12345,
    dac_serial: "DAC-...",
    slac_serial: "SLAC-...",
    last_sync_utc: 1708500000,
    signature: "...",
    slac_pem: "..."
  },
  attachments: [],
  scores: { Biomass: 0.98, Authenticity: 1.0, Environment: 0.85 }
};

// Auto-detects environment (Tauri vs Web)
const result = await generatePDFReport(evidence);

if (result.success) {
  if (result.path) {
    console.log("Saved to:", result.path); // Tauri
  } else if (result.data) {
    // Web: Download or display
    const blob = new Blob([result.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    window.open(url);
  }
}
```

### Viewing Forensic Reports (.luku files)

```ts
import lukuid from '@lukuid/sdk';

// Open a .luku file and show the forensic viewer
// Accepts a Uint8Array or a path (Desktop only)
await lukuid.showReport(lukuFileBytes);
```

### Android (Kotlin)

Native module integration via `LukuIDPDFSigner`.

```kotlin
// In your React Native Module or Native Android code
val signer = LukuIDPDFSigner(context)
signer.signHash("hash_hex_string", promise)
```

### iOS (Swift)

Native module integration via `LukuIDPDFSigner`.

```swift
// In your React Native Module or Native iOS code
let signer = LukuIDPDFSigner()
signer.signHash("hash_hex_string", resolve: resolveBlock, reject: rejectBlock)
```
