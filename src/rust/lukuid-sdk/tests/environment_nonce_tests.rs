// SPDX-License-Identifier: Apache-2.0
// Environment records may carry a host challenge token: `nonce` is a content field
// at its alphabetical slot (between mobile_sinr_db and pressure_hpa) only when the
// record carries one (dotluku LUKU.md "environment").
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use ed25519_dalek::{Signer, SigningKey};
use lukuid_sdk::{LukuFile, LukuVerifyOptions};
use serde_json::{json, Value};

const NONCE: &str = "app-nonce-0123456789";

fn canonical(public_key: &str, nonce: Option<&str>) -> String {
    let slot = nonce.map(|n| format!("{n}:")).unwrap_or_default();
    format!(
        "GC-TEST-1:{public_key}:environment:ENV-NONCE-1:4502:1770823456:3600000000:0.01:0.02:1.00:85:::::::::45.20:21.50:350.50:::::::::::::{slot}1013.20:false:22.40:false:110:30000:genesis_fake"
    )
}

fn envelope(nonce_in_signature: Option<&str>, nonce_in_payload: Option<&str>) -> Value {
    let key = SigningKey::from_bytes(&[7u8; 32]);
    let public_key = BASE64.encode(key.verifying_key().as_bytes());
    let canon = canonical(&public_key, nonce_in_signature);
    let signature = BASE64.encode(key.sign(canon.as_bytes()).to_bytes());
    let mut payload = json!({
        "ctr": 4502, "timestamp_utc": 1770823456, "uptime_us": 3600000000_i64,
        "battery_percent": 85, "vbus_present": false, "lux": 350.5, "temp_c": 22.4,
        "humidity_pct": 45.2, "initial_temp_c": 21.5, "pressure_hpa": 1013.2,
        "voc_raw": 30000, "voc_index": 110, "tamper": false,
        "accel_g": { "x": 0.01, "y": 0.02, "z": 1.0 }, "genesis_hash": "genesis_fake"
    });
    if let Some(n) = nonce_in_payload { payload["nonce"] = json!(n); }
    json!({
        "type": "environment", "id": "ENV-NONCE-1", "device_id": "GC-TEST-1", "public_key": public_key,
        "vendor": "LUKUID", "device": { "vendor": "LUKUID", "device_id": "GC-TEST-1", "public_key": public_key },
        "signature": signature, "previous_signature": "genesis_fake", "canonical_string": canon, "payload": payload
    })
}

fn issues(env: &Value) -> Vec<String> {
    let mut options = LukuVerifyOptions::default();
    options.allow_untrusted_roots = true;
    options.skip_certificate_temporal_checks = true;
    options.trust_profile = "dev".to_string();
    LukuFile::verify_envelope(env, options).into_iter().map(|i| i.code).collect()
}

#[test]
fn record_with_nonce_verifies() {
    assert!(issues(&envelope(Some(NONCE), Some(NONCE))).is_empty());
}

#[test]
fn record_without_nonce_keeps_its_layout() {
    assert!(issues(&envelope(None, None)).is_empty());
    // An empty nonce is no nonce: no extra slot.
    assert!(issues(&envelope(None, Some(""))).is_empty());
}

#[test]
fn stripped_changed_or_added_nonce_fails() {
    for env in [envelope(Some(NONCE), None), envelope(Some(NONCE), Some("app-nonce-XXXXXXXXXX")), envelope(None, Some(NONCE))] {
        let codes = issues(&env);
        assert!(codes.iter().any(|c| c == "RECORD_CANONICAL_MISMATCH"), "{codes:?}");
    }
}

#[test]
fn forged_nonce_with_matching_canonical_fails_signature() {
    let mut env = envelope(None, Some(NONCE));
    let pk = env["public_key"].as_str().unwrap().to_string();
    env["canonical_string"] = json!(canonical(&pk, Some(NONCE)));
    let codes = issues(&env);
    assert!(codes.iter().any(|c| c == "RECORD_SIGNATURE_INVALID"), "{codes:?}");
}
