// SPDX-License-Identifier: Apache-2.0
// Genesis record rule: a native record whose previous_signature is the base64 of
// exactly 32 bytes must carry SHA-256 of the device's raw Ed25519 public key,
// and match genesis_hash if present. Independent of the (reissuable) DAC.
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use ed25519_dalek::{Signer, SigningKey};
use lukuid_sdk::luku::{LukuDeviceIdentity, LukuExportOptions, LukuFile, LukuVerifyOptions, VerificationIssue};
use rand_core::{OsRng, RngCore};
use serde_json::json;
use sha2::{Digest, Sha256};
use std::collections::HashMap;

fn random_b64(len: usize) -> String {
    let mut bytes = vec![0u8; len];
    OsRng.fill_bytes(&mut bytes);
    BASE64.encode(bytes)
}

fn own(key_hash: &str) -> String {
    key_hash.to_string()
}

fn genesis_issues(
    previous: fn(&str) -> String,
    genesis_hash: Option<fn(&str) -> String>,
    dac_b64: Option<String>,
) -> Vec<VerificationIssue> {
    let signing_key = SigningKey::generate(&mut OsRng);
    let raw_key = signing_key.verifying_key().to_bytes();
    let key_hash = BASE64.encode(Sha256::digest(raw_key));
    let device_id = format!("LUK-GENESIS-{}", OsRng.next_u32());
    let device = LukuDeviceIdentity {
        device_id: device_id.clone(),
        public_key: BASE64.encode(raw_key),
        vendor: Some("LUKUID".to_string()),
    };
    let mut payload = json!({ "ctr": 7, "timestamp_utc": 1000 });
    if let Some(hash) = genesis_hash {
        payload["genesis_hash"] = json!(hash(&key_hash));
    }
    let records = vec![json!({
        "type": "scan",
        "vendor": "LUKUID",
        "signature": BASE64.encode(signing_key.sign(b"can1").to_bytes()),
        "previous_signature": previous(&key_hash),
        "canonical_string": "can1",
        "payload": payload
    })];
    let path = std::env::temp_dir().join(format!("{}.luku", device_id));
    LukuFile::export_with_identity(records, &path, device, HashMap::new(), &signing_key, LukuExportOptions::default()).unwrap();
    let data = std::fs::read(&path).unwrap();
    let _ = std::fs::remove_file(&path);
    let mut archive = LukuFile::open_bytes(&data).unwrap();
    if dac_b64.is_some() {
        archive.blocks[0].attestation_dac_der = dac_b64;
    }
    archive
        .verify(LukuVerifyOptions { allow_untrusted_roots: false, trust_profile: "dev".to_string(), ..Default::default() })
        .into_iter()
        .filter(|i| i.code == "GENESIS_HASH_MISMATCH")
        .collect()
}

#[test]
fn accepts_genesis_anchored_to_public_key_with_genesis_hash() {
    assert!(genesis_issues(own, Some(own), None).is_empty());
}

#[test]
fn accepts_genesis_anchored_to_public_key_without_genesis_hash() {
    assert!(genesis_issues(own, None, None).is_empty());
}

#[test]
fn does_not_depend_on_the_dac() {
    assert!(genesis_issues(own, Some(own), Some(random_b64(300))).is_empty());
}

#[test]
fn rejects_32_byte_previous_signature_not_matching_public_key() {
    let issues = genesis_issues(|_: &str| random_b64(32), None, None);
    assert!(issues.iter().any(|i| i.message.contains("SHA-256 of its public key")));
}

#[test]
fn rejects_genesis_hash_differing_from_previous_signature() {
    let issues = genesis_issues(own, Some(|_: &str| random_b64(32)), None);
    assert!(issues.iter().any(|i| i.message.contains("genesis_hash that does not match previous_signature")));
}

#[test]
fn sixty_four_byte_previous_signature_is_not_genesis() {
    assert!(genesis_issues(|_: &str| random_b64(64), Some(|_: &str| "genesis_fake".to_string()), None).is_empty());
}
