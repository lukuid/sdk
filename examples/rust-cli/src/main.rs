// SPDX-License-Identifier: Apache-2.0
use lukuid_sdk::transport::serial::SerialTransport;
use lukuid_sdk::Device;
use serde_json::json;
use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    env_logger::init();
    println!("LukuID Rust CLI Example");

    let transport = SerialTransport::new();
    
    println!("Scanning for LukuID devices via Serial...");
    let devices = transport.list_connected().await;

    if devices.is_empty() {
        println!("No LukuID devices found.");
        return Ok(());
    }

    for (i, dev) in devices.iter().enumerate() {
        println!("{}: {} (label: {:?})", i, dev.id, dev.label);
    }

    // Connect to the first found device
    let target = &devices[0];
    println!("Connecting to {}...", target.id);
    
    let device = Device::connect(&transport, &target.id, lukuid_sdk::models::LukuidSdkOptions::default()).await?;
    println!("Connected! Device ID: {}, Verified: {}", device.info.id, device.info.verified);

    // Subscribe to events in background
    let mut rx = device.subscribe();
    tokio::spawn(async move {
        while let Ok(event) = rx.recv().await {
            println!("
[EVENT] {}: {:?}", event.key, event.data);
        }
    });

    // Perform an RPC call
    println!("Sending PING (RPC call)...");
    let pong = device.call("PING", json!({ "hello": "rust" })).await?;
    println!("PONG: {:?}", pong);

    // Wait for a bit to see events if they happen
    println!("Staying connected for 30 seconds. Try scanning a tag...");
    tokio::time::sleep(tokio::time::Duration::from_secs(30)).await;

    device.close().await;
    println!("Closed.");

    Ok(())
}
