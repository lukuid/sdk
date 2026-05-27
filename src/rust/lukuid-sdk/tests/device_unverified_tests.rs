// SPDX-License-Identifier: Apache-2.0
use async_trait::async_trait;
use lukuid_sdk::revocation::RevocationManager;
use lukuid_sdk::{
    Device, DiscoveredDevice, LukuidSdkOptions, Transport, TransportType,
};
use std::sync::{
    atomic::{AtomicUsize, Ordering},
    Arc, Mutex,
};
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

fn info_response_without_attestation() -> Vec<u8> {
    let mut info = Vec::new();
    write_string(&mut info, 10, "GC-UNVERIFIED");
    let key: Vec<u8> = (1..=32).collect();
    write_bytes(&mut info, 28, &key);
    write_bool(&mut info, 8, false);
    response("info", Some(6), &info)
}

#[derive(Clone, Default)]
struct FakeTransport {
    writes: Arc<Mutex<Vec<String>>>,
}

struct FakeConnection {
    incoming: mpsc::Sender<Vec<u8>>,
    writes: Arc<Mutex<Vec<String>>>,
    index: AtomicUsize,
}

#[async_trait]
impl lukuid_sdk::Connection for FakeConnection {
    async fn write(&self, _data: &[u8]) -> Result<(), String> {
        let index = self.index.fetch_add(1, Ordering::SeqCst);
        let (action, payload) = match index {
            0 => ("status", status_response()),
            1 => ("info", info_response_without_attestation()),
            _ => ("get_certificate", response("get_certificate", None, &[])),
        };
        self.writes.lock().unwrap().push(action.to_string());
        self.incoming.send(payload).await.map_err(|err| err.to_string())
    }

    async fn close(&self) -> Result<(), String> {
        Ok(())
    }
}

#[async_trait]
impl Transport for FakeTransport {
    fn name(&self) -> &'static str {
        "fake"
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
        Ok(Box::new(FakeConnection {
            incoming,
            writes: self.writes.clone(),
            index: AtomicUsize::new(0),
        }))
    }
}

#[tokio::test]
async fn verify_returns_unverified_info_without_running_heartbeat_when_attestation_is_missing() {
    let transport = FakeTransport::default();
    let mut options = LukuidSdkOptions::default();
    options.disable_external_calls = true;
    options.connect_lifecycle_sync = true;
    options.allow_unverified_devices = false;

    let revocation = Arc::new(RevocationManager::new(options.clone()));
    let device = Device::connect(&transport, "fake-1", options.clone(), Some(revocation.clone()))
        .await
        .expect("status connect should succeed");

    let verified = device
        .verify(options)
        .await
        .expect("unverified INFO should be returned");

    assert!(!verified.info.verified);
    assert_eq!(verified.info.id, "GC-UNVERIFIED");
    assert!(!transport
        .writes
        .lock()
        .unwrap()
        .iter()
        .any(|action| action == "generate_heartbeat"));
}
