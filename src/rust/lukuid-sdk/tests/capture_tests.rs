// SPDX-License-Identifier: Apache-2.0
// verify_capture_reply: a capture reply is the stored record, accepted only when its
// canonical string recomputes, its Ed25519 signature verifies with the device key and
// its signed nonce equals the challenge token.
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use ed25519_dalek::{Signer, SigningKey};
use lukuid_sdk::capture::{create_challenge_token, is_valid_challenge_token, verify_capture_reply};
use lukuid_sdk::LukuFile;
use serde_json::{json, Value};

const DEVICE: &str = "AR-TEST-1";
const TOKEN: &str = "app-capture-0123456789AB";

fn signed_scan(key: &SigningKey, nonce: &str) -> (Value, String) {
    let public_key = BASE64.encode(key.verifying_key().as_bytes());
    let mut record = json!({
        "type": "scan", "id": "LUKUID-1793769018-2464-999000000000002", "previous_signature": BASE64.encode([3u8; 64]),
        "payload": { "ctr": 2464, "timestamp_utc": 1793769018, "uptime_us": 12000000, "nonce": nonce, "firmware": "v1.0.0",
                     "profile": "animal", "protocol": "FDX-B", "scan_version": "1.0", "tag_id": "999000000000002" }
    });
    let canonical = LukuFile::recompute_canonical_string(&record, DEVICE, &public_key).expect("animal profile");
    record["canonical_string"] = json!(canonical);
    record["signature"] = json!(BASE64.encode(key.sign(canonical.as_bytes()).to_bytes()));
    (json!({ "records": [{ "id": record["id"], "scan_full": record }] }), public_key)
}

#[test]
fn accepts_the_signed_record_with_the_token() {
    let key = SigningKey::from_bytes(&[9u8; 32]);
    let (reply, pk) = signed_scan(&key, TOKEN);
    let result = verify_capture_reply(&reply, DEVICE, &pk, Some(TOKEN)).expect("valid");
    assert_eq!(result.record_type, "scan");
    assert_eq!(result.nonce, TOKEN);
    assert_eq!(result.id, "LUKUID-1793769018-2464-999000000000002");
}

#[test]
fn rejects_wrong_token_changed_value_and_foreign_key() {
    let key = SigningKey::from_bytes(&[9u8; 32]);
    let (reply, pk) = signed_scan(&key, TOKEN);
    let err = verify_capture_reply(&reply, DEVICE, &pk, Some("some-other-token-0123")).unwrap_err();
    assert!(err.starts_with("NONCE_MISMATCH"), "{err}");

    let mut changed = reply.clone();
    changed["records"][0]["scan_full"]["payload"]["tag_id"] = json!("999000000000777");
    let err = verify_capture_reply(&changed, DEVICE, &pk, Some(TOKEN)).unwrap_err();
    assert!(err.starts_with("RECORD_CANONICAL_MISMATCH"), "{err}");

    let other = SigningKey::from_bytes(&[8u8; 32]);
    let canonical = reply["records"][0]["scan_full"]["canonical_string"].as_str().unwrap().to_string();
    let mut forged = reply.clone();
    forged["records"][0]["scan_full"]["signature"] = json!(BASE64.encode(other.sign(canonical.as_bytes()).to_bytes()));
    let err = verify_capture_reply(&forged, DEVICE, &pk, Some(TOKEN)).unwrap_err();
    assert!(err.starts_with("RECORD_SIGNATURE_INVALID"), "{err}");

    let err = verify_capture_reply(&json!({ "records": [] }), DEVICE, &pk, None).unwrap_err();
    assert!(err.starts_with("CAPTURE_INVALID_REPLY"), "{err}");
}

#[test]
fn challenge_tokens() {
    for _ in 0..20 {
        assert!(is_valid_challenge_token(&create_challenge_token().unwrap()));
    }
    for bad in ["short-token", &"a".repeat(32), "abcdefgh:ijklmnop", "abcdefgh ijklmnop"] {
        assert!(!is_valid_challenge_token(bad), "{bad}");
    }
    assert!(is_valid_challenge_token("ABCDEFGHIJKLMNOPQRSTUVWXYZ-_.~+"));
}
