// SPDX-License-Identifier: Apache-2.0
// Animal Reader scans: ScanPayload fields 36 (profile), 37 (protocol) and
// 38 (metrics_csv) carry the signed LUKU.md "animal" profile fields, and field 2
// is exposed as `tag_id` (lukuid.proto).
use lukuid_sdk::framing::LukuDecoder;
use serde_json::json;

const MAGIC: [u8; 8] = [0x4c, 0x55, 0x4b, 0x55, 0x49, 0x44, 0x01, 0x7e];

fn varint(out: &mut Vec<u8>, mut value: u64) {
    while value >= 0x80 {
        out.push(((value as u8) & 0x7f) | 0x80);
        value >>= 7;
    }
    out.push(value as u8);
}

fn key(out: &mut Vec<u8>, field: u32, wire_type: u8) {
    varint(out, ((field << 3) | u32::from(wire_type)) as u64);
}

fn bytes_field(out: &mut Vec<u8>, field: u32, value: &[u8]) {
    key(out, field, 2);
    varint(out, value.len() as u64);
    out.extend_from_slice(value);
}

fn get_response_with_payload(payload: &[u8]) -> serde_json::Value {
    let mut record = Vec::new();
    bytes_field(&mut record, 1, b"1.0");
    bytes_field(&mut record, 2, b"LUKUID-1793735596-58-999000000000049");
    bytes_field(&mut record, 6, payload);
    let mut full = Vec::new();
    bytes_field(&mut full, 1, b"LUKUID-1793735596-58-999000000000049");
    bytes_field(&mut full, 2, &record);
    let mut response = Vec::new();
    bytes_field(&mut response, 1, b"get");
    key(&mut response, 2, 0);
    response.push(1);
    bytes_field(&mut response, 11, &full);

    let mut framed = MAGIC.to_vec();
    framed.extend_from_slice(&(response.len() as u32).to_le_bytes());
    framed.extend_from_slice(&response);
    framed.extend_from_slice(&MAGIC);
    let frames = LukuDecoder::new().feed(&framed);
    assert_eq!(frames.len(), 1);
    frames[0]["full_record_response"]["scan_full"]["payload"].clone()
}

const SIGNED_METRICS: &str = "38.50,45.00,-65.00,12.00,5.00,120.00,2.00,3300.00,10.00,11.00,1.00,2000.00,50.00,1.20,1.00,5.00,-2.00,0.00";

#[test]
fn decodes_animal_profile_fields_with_luku_names() {
    let mut payload = Vec::new();
    key(&mut payload, 1, 0);
    varint(&mut payload, 58);
    bytes_field(&mut payload, 2, b"999000000000049");
    bytes_field(&mut payload, 30, b"1.0");
    bytes_field(&mut payload, 36, b"animal");
    bytes_field(&mut payload, 37, b"FDX-B");
    bytes_field(&mut payload, 38, SIGNED_METRICS.as_bytes());

    let p = get_response_with_payload(&payload);
    assert_eq!(p["ctr"], 58);
    assert_eq!(p["tag_id"], "999000000000049");
    assert!(p.get("id").is_none(), "no unsigned copy of the signed tag_id");
    assert_eq!(p["profile"], "animal");
    assert_eq!(p["protocol"], "FDX-B");
    assert_eq!(p["scan_version"], "1.0");
    assert_eq!(p["metrics"], json!([38.5, 45.0, -65.0, 12.0, 5.0, 120.0, 2.0, 3300.0, 10.0, 11.0, 1.0, 2000.0, 50.0, 1.2, 1.0, 5.0, -2.0, 0.0]));
    assert!(p.get("metrics_csv").is_none());
}

#[test]
fn metrics_reformat_to_the_signed_text() {
    let mut payload = Vec::new();
    bytes_field(&mut payload, 38, SIGNED_METRICS.as_bytes());
    let p = get_response_with_payload(&payload);
    let text = p["metrics"].as_array().unwrap().iter()
        .map(|v| format!("{:.2}", v.as_f64().unwrap())).collect::<Vec<_>>().join(",");
    assert_eq!(text, SIGNED_METRICS);
}

#[test]
fn rejects_non_numeric_metrics_instead_of_guessing() {
    let mut payload = Vec::new();
    bytes_field(&mut payload, 38, b"1.00,abc,3.00");
    let p = get_response_with_payload(&payload);
    assert!(p.get("metrics").is_none(), "an unparsable signed metrics field must not become a partial array");
}
