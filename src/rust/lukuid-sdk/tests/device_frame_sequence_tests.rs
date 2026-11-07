// SPDX-License-Identifier: Apache-2.0
// Streamed replies number every frame (`frame_seq` 1, 2, 3...). A lost frame shows up
// as a gap and fails the command instead of returning an incomplete reply as success.
use async_trait::async_trait;
use lukuid_sdk::{Device, DeviceError, DiscoveredDevice, LukuidSdkOptions, Transport, TransportType};
use std::sync::atomic::{AtomicUsize, Ordering};
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

fn write_uint(out: &mut Vec<u8>, field: u32, value: u64) {
    write_key(out, field, 0);
    write_varint(out, value);
}

fn frame(payload: Vec<u8>) -> Vec<u8> {
    let mut out = Vec::new();
    out.extend_from_slice(&MAGIC);
    out.extend_from_slice(&(payload.len() as u32).to_le_bytes());
    out.extend_from_slice(&payload);
    out.extend_from_slice(&MAGIC);
    out
}

fn status_response() -> Vec<u8> {
    let mut status = Vec::new();
    write_string(&mut status, 1, "GC-UNVERIFIED");
    write_uint(&mut status, 8, 0);
    let mut payload = Vec::new();
    write_string(&mut payload, 1, "status");
    write_uint(&mut payload, 3, 1);
    write_key(&mut payload, 16, 2);
    write_varint(&mut payload, status.len() as u64);
    payload.extend_from_slice(&status);
    frame(payload)
}

/// One `ping` reply frame; `has_more` marks a frame that more frames follow.
fn ping_frame(has_more: bool, frame_seq: Option<u64>) -> Vec<u8> {
    let mut payload = Vec::new();
    write_string(&mut payload, 1, "ping");
    write_uint(&mut payload, 3, 1);
    if has_more {
        write_uint(&mut payload, 18, 1);
    }
    if let Some(seq) = frame_seq {
        write_uint(&mut payload, 23, seq);
    }
    frame(payload)
}

/// Sends the given (has_more, frame_seq) frames as the reply to the first command.
#[derive(Clone)]
struct SeqTransport {
    frames: Vec<(bool, Option<u64>)>,
}

struct SeqConnection {
    incoming: mpsc::Sender<Vec<u8>>,
    index: AtomicUsize,
    frames: Vec<(bool, Option<u64>)>,
}

#[async_trait]
impl lukuid_sdk::Connection for SeqConnection {
    async fn write(&self, _data: &[u8]) -> Result<(), String> {
        if self.index.fetch_add(1, Ordering::SeqCst) == 0 {
            return self.incoming.send(status_response()).await.map_err(|e| e.to_string());
        }
        for (more, seq) in &self.frames {
            self.incoming.send(ping_frame(*more, *seq)).await.map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    async fn close(&self) -> Result<(), String> {
        Ok(())
    }
}

#[async_trait]
impl Transport for SeqTransport {
    fn name(&self) -> &'static str {
        "fake-seq"
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
        Ok(Box::new(SeqConnection { incoming, index: AtomicUsize::new(0), frames: self.frames.clone() }))
    }
}

async fn ping_with(frames: Vec<(bool, Option<u64>)>) -> Result<serde_json::Value, DeviceError> {
    let transport = SeqTransport { frames };
    let mut options = LukuidSdkOptions::default();
    options.disable_external_calls = true;
    options.connect_lifecycle_sync = false;
    options.command_timeout = 2;
    let device = Device::connect(&transport, "fake-seq", options, None).await.expect("connect");
    device.call("ping", serde_json::json!({})).await
}

fn is_gap(result: &Result<serde_json::Value, DeviceError>) -> bool {
    matches!(result, Err(DeviceError::CommandFailed(msg)) if msg.starts_with("FRAME_SEQUENCE_GAP"))
}

#[tokio::test]
async fn contiguous_frame_sequence_succeeds() {
    let result = ping_with(vec![(true, Some(1)), (true, Some(2)), (true, Some(3)), (false, Some(4))]).await;
    assert!(result.is_ok(), "expected success, got {result:?}");
}

#[tokio::test]
async fn lost_middle_frame_fails_closed() {
    let result = ping_with(vec![(true, Some(1)), (true, Some(3)), (false, Some(4))]).await;
    assert!(is_gap(&result), "expected FRAME_SEQUENCE_GAP, got {result:?}");
}

#[tokio::test]
async fn lost_first_frame_fails_closed() {
    let result = ping_with(vec![(true, Some(2)), (false, Some(3))]).await;
    assert!(is_gap(&result), "expected FRAME_SEQUENCE_GAP, got {result:?}");
}

#[tokio::test]
async fn lost_last_data_frame_before_close_fails_closed() {
    let result = ping_with(vec![(true, Some(1)), (true, Some(2)), (false, Some(4))]).await;
    assert!(is_gap(&result), "expected FRAME_SEQUENCE_GAP, got {result:?}");
}

#[tokio::test]
async fn unnumbered_frame_after_numbered_fails_closed() {
    let result = ping_with(vec![(true, Some(1)), (false, None)]).await;
    assert!(is_gap(&result), "expected FRAME_SEQUENCE_GAP, got {result:?}");
}

#[tokio::test]
async fn unnumbered_legacy_stream_is_accepted() {
    let result = ping_with(vec![(true, None), (true, None), (false, None)]).await;
    assert!(result.is_ok(), "expected success, got {result:?}");
}

#[tokio::test]
async fn single_frame_reply_needs_no_sequence() {
    let result = ping_with(vec![(false, None)]).await;
    assert!(result.is_ok(), "expected success, got {result:?}");
}
