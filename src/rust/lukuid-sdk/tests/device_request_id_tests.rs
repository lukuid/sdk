// SPDX-License-Identifier: Apache-2.0
// Replies are matched to calls by the echoed request_id. A reply whose request_id is
// not pending (for example a BUSY answer to a request another client sent) must not
// resolve a different pending call of the same action; replies without a request_id
// (older firmware) still match by action.
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


// CommandRequest.request_id (field 18) of a written frame.
fn request_id_of(data: &[u8]) -> String {
    let payload = &data[12..data.len() - 8];
    let mut i = 0usize;
    let varint = |buf: &[u8], i: &mut usize| -> u64 {
        let (mut v, mut shift) = (0u64, 0);
        loop { let b = buf[*i]; *i += 1; v |= u64::from(b & 0x7f) << shift; if b < 0x80 { return v; } shift += 7; }
    };
    while i < payload.len() {
        let key = varint(payload, &mut i);
        let (field, wire) = (key >> 3, key & 7);
        match wire {
            0 => { varint(payload, &mut i); }
            2 => {
                let len = varint(payload, &mut i) as usize;
                if field == 18 { return String::from_utf8_lossy(&payload[i..i + len]).to_string(); }
                i += len;
            }
            _ => panic!("unexpected wire type"),
        }
    }
    String::new()
}

fn capture_reply(request_id: Option<&str>, ok: bool) -> Vec<u8> {
    let mut payload = Vec::new();
    write_string(&mut payload, 1, "capture");
    write_bool(&mut payload, 3, ok);
    if !ok {
        write_string(&mut payload, 4, "BUSY");
        write_string(&mut payload, 5, "capture_in_progress");
    }
    if let Some(id) = request_id { write_string(&mut payload, 22, id); }
    frame(payload)
}

#[derive(Clone, Copy)]
enum Script { StrayThenOwn, NoRequestId, StrayOnly }

#[derive(Clone, Copy)]
struct ScriptTransport(Script);

struct ScriptConnection { incoming: mpsc::Sender<Vec<u8>>, index: AtomicUsize, script: Script }

#[async_trait]
impl lukuid_sdk::Connection for ScriptConnection {
    async fn write(&self, data: &[u8]) -> Result<(), String> {
        if self.index.fetch_add(1, Ordering::SeqCst) == 0 {
            return self.incoming.send(status_response()).await.map_err(|e| e.to_string());
        }
        let own = request_id_of(data);
        let tx = self.incoming.clone();
        let script = self.script;
        tokio::spawn(async move {
            match script {
                Script::StrayThenOwn => {
                    let _ = tx.send(capture_reply(Some("someone-elses-request"), false)).await;
                    tokio::time::sleep(Duration::from_millis(100)).await;
                    let _ = tx.send(capture_reply(Some(&own), true)).await;
                }
                Script::NoRequestId => { let _ = tx.send(capture_reply(None, true)).await; }
                Script::StrayOnly => { let _ = tx.send(capture_reply(Some("someone-elses-request"), false)).await; }
            }
        });
        Ok(())
    }
    async fn close(&self) -> Result<(), String> { Ok(()) }
}

#[async_trait]
impl Transport for ScriptTransport {
    fn name(&self) -> &'static str { "fake-script" }
    fn transport_type(&self) -> TransportType { TransportType::Serial }
    async fn is_supported(&self) -> bool { true }
    async fn list_connected(&self) -> Vec<DiscoveredDevice> { Vec::new() }
    async fn open(&self, _device_id: &str, incoming: mpsc::Sender<Vec<u8>>) -> Result<Box<dyn lukuid_sdk::Connection>, String> {
        Ok(Box::new(ScriptConnection { incoming, index: AtomicUsize::new(0), script: self.0 }))
    }
}

async fn capture_over(script: Script) -> Result<serde_json::Value, DeviceError> {
    let mut options = LukuidSdkOptions::default();
    options.disable_external_calls = true;
    options.connect_lifecycle_sync = false;
    options.command_timeout = 1;
    let device = Device::connect(&ScriptTransport(script), "fake-script", options, None).await.expect("connect");
    device.call("capture", serde_json::json!({})).await
}

#[tokio::test]
async fn reply_for_another_request_does_not_resolve_this_call() {
    let result = capture_over(Script::StrayThenOwn).await;
    assert!(result.is_ok(), "the stray BUSY must be dropped and the own reply used, got {result:?}");
}

#[tokio::test]
async fn reply_without_request_id_still_matches_by_action() {
    assert!(capture_over(Script::NoRequestId).await.is_ok());
}

#[tokio::test]
async fn only_a_stray_reply_times_out_instead_of_failing() {
    assert!(matches!(capture_over(Script::StrayOnly).await, Err(DeviceError::Timeout)));
}
