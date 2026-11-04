// SPDX-License-Identifier: Apache-2.0
// Host challenge tokens: CommandRequest.challenge = 19 and CommandRequest.capture = 20,
// each a message whose field 1 is the token (lukuid.proto).
use lukuid_sdk::framing::LukuDecoder;
use serde_json::json;

fn varint(out: &mut Vec<u8>, mut value: u64) {
    while value >= 0x80 {
        out.push(((value as u8) & 0x7f) | 0x80);
        value >>= 7;
    }
    out.push(value as u8);
}

fn bytes_field(out: &mut Vec<u8>, field: u32, value: &[u8]) {
    varint(out, ((field << 3) | 2) as u64);
    varint(out, value.len() as u64);
    out.extend_from_slice(value);
}

fn contains(haystack: &[u8], needle: &[u8]) -> bool {
    haystack.windows(needle.len()).any(|w| w == needle)
}

fn wrapped_token(field: u32, token: &str) -> Vec<u8> {
    let mut inner = Vec::new();
    bytes_field(&mut inner, 1, token.as_bytes());
    let mut out = Vec::new();
    bytes_field(&mut out, field, &inner);
    out
}

#[test]
fn encodes_challenge_token_as_field_19() {
    let token = "app-nonce-0123456789";
    let bytes = LukuDecoder::encode(&json!({ "action": "challenge", "token": token }));
    assert!(contains(&bytes, &wrapped_token(19, token)));
}

#[test]
fn encodes_capture_token_as_field_20() {
    let token = "app-nonce-ABCDEFGHIJ";
    let bytes = LukuDecoder::encode(&json!({ "action": "capture", "token": token }));
    assert!(contains(&bytes, &wrapped_token(20, token)));
}

#[test]
fn capture_without_token_sends_an_empty_capture_message() {
    let bytes = LukuDecoder::encode(&json!({ "action": "capture" }));
    let mut empty = Vec::new();
    bytes_field(&mut empty, 20, &[]);
    assert!(contains(&bytes, &empty));
}
