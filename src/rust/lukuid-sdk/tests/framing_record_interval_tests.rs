// SPDX-License-Identifier: Apache-2.0
// Environment recording interval: ConfigRequest field 26 and NetworkConfigResponse
// field 21 (lukuid.proto).
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

fn contains(haystack: &[u8], needle: &[u8]) -> bool {
    haystack.windows(needle.len()).any(|w| w == needle)
}

#[test]
fn encodes_config_record_interval_as_field_26() {
    let bytes = LukuDecoder::encode(&json!({ "action": "config", "record_interval": 300 }));
    let mut config = Vec::new();
    key(&mut config, 26, 0);
    varint(&mut config, 300);
    let mut wrapped = Vec::new();
    bytes_field(&mut wrapped, 5, &config);
    assert!(contains(&bytes, &wrapped), "config payload carries field 26 = 300");

    let without = LukuDecoder::encode(&json!({ "action": "config", "name": "X" }));
    let mut tag = Vec::new();
    key(&mut tag, 26, 0);
    assert!(!contains(&without, &tag));
}

#[test]
fn decodes_network_config_field_21_as_record_interval() {
    let mut config = Vec::new();
    bytes_field(&mut config, 1, b"ssid");
    key(&mut config, 21, 0);
    varint(&mut config, 1800);
    let mut response = Vec::new();
    bytes_field(&mut response, 1, b"network_info");
    key(&mut response, 2, 0);
    response.push(1);
    key(&mut response, 3, 0);
    response.push(1);
    bytes_field(&mut response, 7, &config);

    let mut framed = MAGIC.to_vec();
    framed.extend_from_slice(&(response.len() as u32).to_le_bytes());
    framed.extend_from_slice(&response);
    framed.extend_from_slice(&MAGIC);

    let frames = LukuDecoder::new().feed(&framed);
    assert_eq!(frames.len(), 1);
    assert_eq!(frames[0]["wifi_ssid"], "ssid");
    assert_eq!(frames[0]["record_interval"], 1800);
}
