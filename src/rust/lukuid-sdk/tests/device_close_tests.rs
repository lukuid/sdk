// SPDX-License-Identifier: Apache-2.0
// Device::close must return only after the transport connection is closed. A
// close that merely signals the connection task let an immediate reconnect find
// the old BLE link still up (BlueZ), skip connecting, and then fail with
// "Not Connected" when the late disconnect landed.
use async_trait::async_trait;
use lukuid_sdk::{Device, DiscoveredDevice, LukuidSdkOptions, Transport, TransportType};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::mpsc;

const MAGIC: [u8; 8] = [0x4c, 0x55, 0x4b, 0x55, 0x49, 0x44, 0x01, 0x7e];

fn status_reply() -> Vec<u8> {
    // CommandResponse { action: "status", success: true, status_response { id: "GC-CLOSE" } }
    let mut status = vec![0x0a, 8];
    status.extend_from_slice(b"GC-CLOSE");
    let mut payload = vec![0x0a, 6];
    payload.extend_from_slice(b"status");
    payload.extend_from_slice(&[0x18, 0x01, 0x82, 0x01, status.len() as u8]);
    payload.extend_from_slice(&status);
    let mut out = MAGIC.to_vec();
    out.extend_from_slice(&(payload.len() as u32).to_le_bytes());
    out.extend_from_slice(&payload);
    out.extend_from_slice(&MAGIC);
    out
}

struct SlowCloseTransport { closed: Arc<AtomicBool> }
struct SlowCloseConnection { incoming: mpsc::Sender<Vec<u8>>, closed: Arc<AtomicBool> }

#[async_trait]
impl lukuid_sdk::Connection for SlowCloseConnection {
    async fn write(&self, _data: &[u8]) -> Result<(), String> {
        self.incoming.send(status_reply()).await.map_err(|e| e.to_string())
    }
    async fn close(&self) -> Result<(), String> {
        tokio::time::sleep(Duration::from_millis(300)).await; // a BLE disconnect takes a while
        self.closed.store(true, Ordering::SeqCst);
        Ok(())
    }
}

#[async_trait]
impl Transport for SlowCloseTransport {
    fn name(&self) -> &'static str { "fake-slow-close" }
    fn transport_type(&self) -> TransportType { TransportType::Ble }
    async fn is_supported(&self) -> bool { true }
    async fn list_connected(&self) -> Vec<DiscoveredDevice> { Vec::new() }
    async fn open(&self, _id: &str, incoming: mpsc::Sender<Vec<u8>>) -> Result<Box<dyn lukuid_sdk::Connection>, String> {
        Ok(Box::new(SlowCloseConnection { incoming, closed: self.closed.clone() }))
    }
}

#[tokio::test]
async fn close_returns_after_the_connection_is_closed() {
    let closed = Arc::new(AtomicBool::new(false));
    let mut options = LukuidSdkOptions::default();
    options.disable_external_calls = true;
    options.connect_lifecycle_sync = false;
    let device = Device::connect(&SlowCloseTransport { closed: closed.clone() }, "fake", options, None).await.expect("connect");
    device.close().await;
    assert!(closed.load(Ordering::SeqCst), "Device::close returned before the transport closed");
    device.close().await; // a second close must not hang
}
