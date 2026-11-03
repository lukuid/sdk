// SPDX-License-Identifier: Apache-2.0
// The command timeout measures inactivity: a streamed reply (`has_more` frames, for
// example a full-history export) may take longer than the timeout in total as long
// as frames keep arriving, while a silent device still times out.
use async_trait::async_trait;
use lukuid_sdk::{Device, DeviceError, DiscoveredDevice, LukuidSdkOptions, Transport, TransportType};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::time::Duration;
use tokio::sync::mpsc;

const MAGIC: [u8; 8] = [0x4c, 0x55, 0x4b, 0x55, 0x49, 0x44, 0x01, 0x7e];

fn write_varint(out: &mut Vec<u8>, mut value: u64) {
    while value >= 0x80 {
        out.push(((value as u8) & 0x7f) | 0x80);
        value >>= 7;
    }
    out.push(value as u8);
}

fn write_key(out: &mut Vec<u8>, field: u32, wire_type: u8) {
    write_varint(out, ((field << 3) | u32::from(wire_type)) as u64);
}

fn write_string(out: &mut Vec<u8>, field: u32, value: &str) {
    write_key(out, field, 2);
    write_varint(out, value.len() as u64);
    out.extend_from_slice(value.as_bytes());
}

fn write_bool(out: &mut Vec<u8>, field: u32, value: bool) {
    write_key(out, field, 0);
    write_varint(out, if value { 1 } else { 0 });
}

fn write_bytes(out: &mut Vec<u8>, field: u32, value: &[u8]) {
    write_key(out, field, 2);
    write_varint(out, value.len() as u64);
    out.extend_from_slice(value);
}

fn write_message(out: &mut Vec<u8>, field: u32, nested: &[u8]) {
    write_key(out, field, 2);
    write_varint(out, nested.len() as u64);
    out.extend_from_slice(nested);
}

fn frame(payload: Vec<u8>) -> Vec<u8> {
    let mut out = Vec::with_capacity(MAGIC.len() + 4 + payload.len() + MAGIC.len());
    out.extend_from_slice(&MAGIC);
    out.extend_from_slice(&(payload.len() as u32).to_le_bytes());
    out.extend_from_slice(&payload);
    out.extend_from_slice(&MAGIC);
    out
}

fn response(action: &str, nested_field: Option<u32>, nested: &[u8]) -> Vec<u8> {
    let mut payload = Vec::new();
    write_string(&mut payload, 1, action);
    write_bool(&mut payload, 3, true);
    if let Some(field) = nested_field {
        write_message(&mut payload, field, nested);
    }
    frame(payload)
}

fn status_response() -> Vec<u8> {
    let mut status = Vec::new();
    write_string(&mut status, 1, "GC-UNVERIFIED");
    write_bool(&mut status, 8, false);
    response("status", Some(16), &status)
}

fn ping_frame(has_more: bool) -> Vec<u8> {
    let mut payload = Vec::new();
    write_string(&mut payload, 1, "ping");
    write_bool(&mut payload, 3, true);
    if has_more {
        write_bool(&mut payload, 18, true);
    }
    frame(payload)
}

#[derive(Clone)]
struct StreamingTransport {
    first_delay: Duration,
    gap: Duration,
    frames: usize,
}

struct StreamingConnection {
    incoming: mpsc::Sender<Vec<u8>>,
    index: AtomicUsize,
    cfg: StreamingTransport,
}

#[async_trait]
impl lukuid_sdk::Connection for StreamingConnection {
    async fn write(&self, _data: &[u8]) -> Result<(), String> {
        if self.index.fetch_add(1, Ordering::SeqCst) == 0 {
            return self.incoming.send(status_response()).await.map_err(|e| e.to_string());
        }
        let tx = self.incoming.clone();
        let cfg = self.cfg.clone();
        tokio::spawn(async move {
            tokio::time::sleep(cfg.first_delay).await;
            for i in 0..cfg.frames {
                if i > 0 {
                    tokio::time::sleep(cfg.gap).await;
                }
                let _ = tx.send(ping_frame(i + 1 < cfg.frames)).await;
            }
        });
        Ok(())
    }

    async fn close(&self) -> Result<(), String> {
        Ok(())
    }
}

#[async_trait]
impl Transport for StreamingTransport {
    fn name(&self) -> &'static str {
        "fake-stream"
    }

    fn transport_type(&self) -> TransportType {
        TransportType::Serial
    }

    async fn is_supported(&self) -> bool {
        true
    }

    async fn list_connected(&self) -> Vec<DiscoveredDevice> {
        Vec::new()
    }

    async fn open(
        &self,
        _device_id: &str,
        incoming: mpsc::Sender<Vec<u8>>,
    ) -> Result<Box<dyn lukuid_sdk::Connection>, String> {
        Ok(Box::new(StreamingConnection { incoming, index: AtomicUsize::new(0), cfg: self.clone() }))
    }
}

async fn ping_over(cfg: StreamingTransport) -> Result<serde_json::Value, DeviceError> {
    let mut options = LukuidSdkOptions::default();
    options.disable_external_calls = true;
    options.connect_lifecycle_sync = false;
    options.command_timeout = 1;
    let device = Device::connect(&cfg, "fake-stream", options, None).await.expect("connect");
    device.call("ping", serde_json::json!({})).await
}

#[tokio::test]
async fn streamed_reply_longer_than_timeout_succeeds_while_frames_arrive() {
    // 5 frames 600 ms apart: 2.4 s in total against a 1 s timeout.
    let cfg = StreamingTransport { first_delay: Duration::from_millis(100), gap: Duration::from_millis(600), frames: 5 };
    let result = ping_over(cfg).await;
    assert!(result.is_ok(), "expected success, got {result:?}");
}

#[tokio::test]
async fn silent_device_still_times_out() {
    let cfg = StreamingTransport { first_delay: Duration::from_millis(2500), gap: Duration::from_millis(10), frames: 1 };
    assert!(matches!(ping_over(cfg).await, Err(DeviceError::Timeout)));
}

#[tokio::test]
async fn stalled_stream_times_out() {
    // The stream starts but then goes silent for longer than the timeout.
    let cfg = StreamingTransport { first_delay: Duration::from_millis(100), gap: Duration::from_millis(2500), frames: 2 };
    assert!(matches!(ping_over(cfg).await, Err(DeviceError::Timeout)));
}
