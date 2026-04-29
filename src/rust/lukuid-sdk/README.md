# LukuID SDK for Rust

`lukuid-sdk` is the Rust crate for discovering LukuID devices, validating device identity, and opening or verifying `.luku` forensic evidence archives.

It is suitable for desktop tools, backend services, factory utilities, and archive-only verification flows.

## Install

Add the crate with Cargo:

```bash
cargo add lukuid-sdk
```

For transport-enabled applications, you will usually also want `tokio` and `serde_json`:

```toml
[dependencies]
lukuid-sdk = "1"
tokio = { version = "1", features = ["full"] }
serde_json = "1"
```

For archive-only tools that do not need BLE or serial system dependencies:

```toml
[dependencies]
lukuid-sdk = { version = "1", default-features = false }
```

## Features

- `transport-serial` enables the built-in serial transport
- `transport-ble` enables the built-in BLE transport
- default features enable both transports

## Quick start

```rust
use lukuid_sdk::transport::serial::SerialTransport;
use lukuid_sdk::Device;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let transport = SerialTransport::new();
    let devices = transport.list_connected().await;

    if let Some(target) = devices.first() {
        let device = Device::connect(&transport, &target.id).await?;
        println!("connected to {}", device.info.id);
        device.close().await;
    }

    Ok(())
}
```

Archive-only verification:

```rust
use std::fs;
use lukuid_sdk::parse_bytes;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let bytes = fs::read("identity.luku")?;
    let result = parse_bytes(&bytes)?;
    println!("{}", result.verified);
    Ok(())
}
```

## Parse envelope

Verify a single envelope loaded as JSON:

```rust
use serde_json::Value;
use std::fs;
use lukuid_sdk::{LukuFile, LukuVerifyOptions};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let envelope: Value = serde_json::from_str(&fs::read_to_string("envelope.json")?)?;
    let issues = LukuFile::verify_envelope(&envelope, LukuVerifyOptions::default());
    println!("{issues:#?}");
    Ok(())
}
```

## Notes

- The crate keeps the host-facing API JSON-shaped through `serde_json::Value`, while device traffic is encoded into the LukuID framing and protobuf schema expected by firmware.
- Serial support uses `serialport`.
- BLE support uses `btleplug`.

## Documentation

- Rust guide: https://github.com/lukuid/sdk/blob/main/docs/rust.md
- Verification guide: https://github.com/lukuid/sdk/blob/main/docs/verification.md
