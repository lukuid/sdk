use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use ed25519_dalek::{Signer, SigningKey};
use lukuid_sdk::{framing::LukuDecoder, LukuFile, LukuVerifyOptions};
use serde_json::json;

const MAGIC: [u8; 8] = [0x4C, 0x55, 0x4B, 0x55, 0x49, 0x44, 0x01, 0x7E];

fn write_varint(buf: &mut Vec<u8>, mut value: u64) {
    while value >= 0x80 {
        buf.push(((value as u8) & 0x7f) | 0x80);
        value >>= 7;
    }
    buf.push(value as u8);
}

fn write_key(buf: &mut Vec<u8>, field: u32, wire_type: u8) {
    write_varint(buf, ((field << 3) | wire_type as u32) as u64);
}

fn write_bool(buf: &mut Vec<u8>, field: u32, value: bool) {
    write_key(buf, field, 0);
    write_varint(buf, if value { 1 } else { 0 });
}

fn write_u32(buf: &mut Vec<u8>, field: u32, value: u32) {
    write_key(buf, field, 0);
    write_varint(buf, value as u64);
}

fn write_u64(buf: &mut Vec<u8>, field: u32, value: u64) {
    write_key(buf, field, 0);
    write_varint(buf, value);
}

fn write_i64(buf: &mut Vec<u8>, field: u32, value: i64) {
    write_key(buf, field, 0);
    write_varint(buf, value as u64);
}

fn write_string(buf: &mut Vec<u8>, field: u32, value: &str) {
    write_key(buf, field, 2);
    write_varint(buf, value.len() as u64);
    buf.extend_from_slice(value.as_bytes());
}

fn write_message(buf: &mut Vec<u8>, field: u32, message: &[u8]) {
    write_key(buf, field, 2);
    write_varint(buf, message.len() as u64);
    buf.extend_from_slice(message);
}

fn frame(payload: &[u8]) -> Vec<u8> {
    let mut out = Vec::with_capacity(MAGIC.len() + 4 + payload.len() + MAGIC.len());
    out.extend_from_slice(&MAGIC);
    out.extend_from_slice(&(payload.len() as u32).to_le_bytes());
    out.extend_from_slice(payload);
    out.extend_from_slice(&MAGIC);
    out
}

#[test]
fn test_decoder_maps_voc_raw_and_voc_index_from_environment_frames() {
    let mut payload = Vec::new();
    write_u64(&mut payload, 1, 4502);
    write_i64(&mut payload, 2, 1_770_823_456);
    write_u32(&mut payload, 10, 30_000);
    write_u32(&mut payload, 21, 137);

    let mut env_record = Vec::new();
    write_string(&mut env_record, 1, "1.0.0");
    write_string(&mut env_record, 2, "ENV-VOC-1");
    write_string(&mut env_record, 5, "env-voc-canonical");
    write_message(&mut env_record, 6, &payload);

    let mut response = Vec::new();
    write_u32(&mut response, 2, 1);
    write_bool(&mut response, 3, true);
    write_message(&mut response, 9, &env_record);

    let mut decoder = LukuDecoder::new();
    let frames = decoder.feed(&frame(&response));

    assert_eq!(frames.len(), 1);
    let env_record = frames[0].get("env_record").and_then(|v| v.as_object()).unwrap();
    let payload = env_record.get("payload").and_then(|v| v.as_object()).unwrap();
    assert_eq!(payload.get("voc_raw").and_then(|v| v.as_u64()), Some(30_000));
    assert_eq!(payload.get("voc_index").and_then(|v| v.as_u64()), Some(137));
    assert_eq!(
        env_record.get("canonical_string").and_then(|v| v.as_str()),
        Some("env-voc-canonical")
    );
}

#[test]
fn test_verify_envelope_accepts_new_voc_canonical_and_rejects_old_format() {
    let signing_key = SigningKey::from_bytes(&rand::random::<[u8; 32]>());
    let public_key = BASE64.encode(signing_key.verifying_key().as_bytes());
    let canonical = format!(
        "GC-TEST-1:{public_key}:environment:ENV-VOC-1:4502:1770823456:3600000000:85:false:350.50:22.40:45.20:1013.20:30000:110:false:0.01:0.02:1.00:genesis_fake"
    );
    let signature = BASE64.encode(signing_key.sign(canonical.as_bytes()).to_bytes());

    let envelope = json!({
        "type": "environment",
        "event_id": "ENV-VOC-1",
        "device_id": "GC-TEST-1",
        "public_key": public_key,
        "signature": signature,
        "previous_signature": "genesis_fake",
        "canonical_string": canonical,
        "payload": {
            "ctr": 4502,
            "timestamp_utc": 1770823456,
            "uptime_us": 3600000000_i64,
            "battery_percent": 85,
            "vbus_present": false,
            "lux": 350.5,
            "temp_c": 22.4,
            "humidity_pct": 45.2,
            "pressure_hpa": 1013.2,
            "voc_raw": 30000,
            "voc_index": 110,
            "tamper": false,
            "accel_g": { "x": 0.01, "y": 0.02, "z": 1.0 },
            "genesis_hash": "genesis_fake"
        }
    });

    let mut options = LukuVerifyOptions::default();
    options.allow_untrusted_roots = true;
    options.skip_certificate_temporal_checks = true;
    options.trust_profile = "dev".to_string();

    let valid_issues = LukuFile::verify_envelope(&envelope, options.clone());
    assert!(valid_issues.is_empty(), "Expected no issues, got {valid_issues:?}");

    let old_canonical = format!(
        "GC-TEST-1:{public_key}:environment:ENV-VOC-1:4502:1770823456:3600000000:85:false:350.50:22.40:45.20:1013.20:110:false:0.01:0.02:1.00:genesis_fake"
    );
    let mut invalid_envelope = envelope.clone();
    invalid_envelope["canonical_string"] = json!(old_canonical);
    let invalid_issues = LukuFile::verify_envelope(&invalid_envelope, options);
    assert!(invalid_issues
        .iter()
        .any(|issue| issue.code == "RECORD_SIGNATURE_INVALID"));
}
