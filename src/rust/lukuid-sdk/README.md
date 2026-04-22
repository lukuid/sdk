# LukuID SDK for Rust

A pure Rust implementation of the LukuID SDK, offering transport-agnostic device discovery, verification, and communication.

## Capabilities

- **Transports**: 
  - **Serial**: Active probing of serial ports (requires `serialport`).
  - **BLE**: Bluetooth Low Energy support via `btleplug`.
- **Protocol**: Full implementation of the LUKU framing protocol.
- **Security**: Ed25519 device attestation with root key rotation.

## Installation

Add the published crate to `Cargo.toml`:

```toml
[dependencies]
lukuid-sdk = "0.1.0"
tokio = { version = "1", features = ["full"] }
serde_json = "1.0"
```

For archive-only tools that only open or verify `.luku` packages, disable the default transport features:

```toml
[dependencies]
lukuid-sdk = { version = "0.1.0", default-features = false }
```

## Cargo Features

- `transport-serial` enables `transport::serial::SerialTransport`.
- `transport-ble` enables `transport::ble::BleTransport`.
- Default features enable both transports. Set `default-features = false` for offline archive workflows that do not need device I/O.

## Usage

### 1. Initialize a Transport

You can use `SerialTransport` (for USB/UART) or `BleTransport`.

```rust
use lukuid_sdk::transport::serial::SerialTransport;
use lukuid_sdk::transport::ble::BleTransport;
use lukuid_sdk::Device;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let serial = SerialTransport::new();
    let ble = BleTransport::new().await?;
    
    // ...
}
```

### 2. Discover Devices

`list_connected()` returns devices that are already known or currently visible. Note that `SerialTransport` actively probes ports for LukuID compatibility.

```rust
let devices = serial.list_connected().await;
for dev in devices {
    println!("Found Serial device: {} (label: {:?})", dev.id, dev.label);
}
```

### 3. Connect and Verify

The `Device::connect` call performs the handshake, `INFO` command, and cryptographic attestation.

```rust
if let Some(target) = devices.first() {
    let device = Device::connect(&serial, &target.id).await?;
    println!("Connected to verified device: {}", device.info.id);
}
```

### 4. Communicate

**Send Commands:**

Commands return the JSON payload from the device response.

```rust
let result = device.call("info", serde_json::json!({})).await?;
println!("Response data: {:?}", result);
```

**Listen for Events:**

```rust
let mut rx = device.subscribe();
tokio::spawn(async move {
    while let Ok(event) = rx.recv().await {
        println!("Event [{}]: {:?}", event.key, event.data);
    }
});
```

### 5. Cleanup

```rust
device.close().await;
```
