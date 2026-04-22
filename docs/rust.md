# Rust SDK

The Rust SDK (`lukuid-sdk`) provides a pure Rust implementation for discovering and communicating with LukuID devices. It is designed for desktop tools, backend services, and embedded Linux environments.

## Installation

Add the published crate to your project:

```toml
[dependencies]
lukuid-sdk = "0.1.0"
tokio = { version = "1", features = ["full"] }
serde_json = "1.0"
```

Or with Cargo:

```bash
cargo add lukuid-sdk
```

If you only need offline `.luku` parsing and verification, disable the default transport features so host builds do not pull in BLE or serial system libraries:

```toml
[dependencies]
lukuid-sdk = { version = "0.1.0", default-features = false }
```

## Core Concepts

### Transport Probing
Unlike mobile platforms, the Rust SDK often operates in environments where devices are connected via Serial/UART. The `SerialTransport` actively probes available ports by sending a LukuID `INFO` command to identify compatible hardware.

The host-facing Rust API remains JSON-shaped through `serde_json::Value`, but the SDK now maps those values onto the firmware protobuf command schema and wraps them in the same `LUKUID\x01~` framing used on-device.

---

## Basic Usage

### Discovery & Connection

```rust
use lukuid_sdk::transport::serial::SerialTransport;
use lukuid_sdk::Device;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let transport = SerialTransport::new();
    
    // List and probe for LukuID devices
    let devices = transport.list_connected().await;
    
    if let Some(target) = devices.first() {
        // Connect and perform cryptographic attestation
        let device = Device::connect(&transport, &target.id).await?;
        println!("Connected to verified device: {}", device.info.id);
    }

    Ok(())
}
```

To enable verbose discovery and validation diagnostics, turn on `debug_logging` in `LukuidSdkOptions`:

```rust
use lukuid_sdk::{transport::serial::SerialTransport, LukuidSdkOptions};

fn main() {
    let transport = SerialTransport::with_options(LukuidSdkOptions {
        debug_logging: true,
        ..Default::default()
    });
}
```

The Rust SDK writes these diagnostics directly to stderr when `debug_logging` is enabled, so logging stays disabled by default but does not require any extra host setup during factory-side debugging.

### Fast Discovery With Info

If you need to enumerate local serial devices and show identity details without doing a second full `Device::connect(...)`, use the dedicated probe-with-info path:

```rust
use lukuid_sdk::transport::serial::SerialTransport;

#[tokio::main]
async fn main() {
    let transport = SerialTransport::new();
    let devices = transport.list_connected_with_info().await;

    for device in devices {
        println!("Port: {}", device.device.id);
        println!("Info: {}", device.info);
    }
}
```

This is the preferred path for factory tooling and local inventory UIs. It avoids the extra round-trip and avoids coupling device enumeration to the heavier connect lifecycle.

### Commands and RPC

The Rust SDK supports both asynchronous `action` and the RPC-style `call`.

```rust
// Asynchronous command (fire-and-forget)
device.action("SET_LED", serde_json::json!({ "color": "red" })).await?;

// RPC call with 5s timeout and auto-tracking ID
let result = device.call("GET_CONFIG", serde_json::json!({})).await?;
```

### Host-Driven Heartbeat

The Rust SDK exposes a one-shot helper for the full heartbeat refresh flow:

```rust
use lukuid_sdk::{transport::serial::SerialTransport, Device, LukuidSdk, LukuidSdkOptions};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let options = LukuidSdkOptions::default();
    let transport = SerialTransport::with_options(options.clone());
    let sdk = LukuidSdk::with_options(options.clone());
    let device = Device::connect(&transport, "/dev/cu.usbmodem2101", options).await?;

    let heartbeat = device.sync_heartbeat(&sdk).await?;
    println!("Heartbeat applied via {}", heartbeat.api_url);

    device.close().await;
    Ok(())
}
```

`sync_heartbeat(...)` performs `fetch_telemetry`, `generate_heartbeat`, `POST /heartbeat`, and `set_heartbeat` in order. If the device reports `custom_heartbeat_url`, the Rust SDK uses that URL instead of the default `LukuidSdkOptions.api_url`. The outbound heartbeat request now includes the full attestation PEM chain through the intermediate plus `attestation_root_fingerprint` when the device `info` payload exposes them.

### Send Raw Binary

```rust
device.send(&firmware_bytes).await?;
```

### Event Subscription

Events are handled via a broadcast channel.

```rust
let mut rx = device.subscribe();
tokio::spawn(async move {
    while let Ok(event) = rx.recv().await {
        println!("Received event: {} data: {:?}", event.key, event.data);
    }
});
```

## Features

- **Serial/UART**: Support via `serialport` crate.
- **BLE**: Support via `btleplug` crate.
- **Attestation**: Built-in Ed25519 verification against LukuID root keys.
- **Async**: Fully compatible with the `tokio` runtime.

Cargo feature flags:

- `transport-serial` enables the built-in `SerialTransport` implementation.
- `transport-ble` enables the built-in `BleTransport` implementation.
- The default feature set enables both transports. Archive-only consumers can set `default-features = false`.

## Performance Note

Treat these as separate phases:

- **Discovery**: find compatible devices and optionally fetch cheap identity metadata
- **Validation**: verify the device attestation
- **Lifecycle Sync**: heartbeat, OTA checks, and cloud interactions

Using `Device::connect(...)` for simple device listing is more expensive because connect is a richer lifecycle primitive, not just a probe.
