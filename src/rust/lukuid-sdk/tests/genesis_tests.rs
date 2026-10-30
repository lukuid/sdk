// SPDX-License-Identifier: Apache-2.0
// Genesis record rule: a native record whose previous_signature is the base64 of
// exactly 32 bytes must carry SHA-256(DAC DER), and match genesis_hash if present.
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

fn genesis_issues(dac: &[u8], previous_signature: &str, genesis_hash: Option<&str>, attach_dac: bool) -> Vec<VerificationIssue> {
    let signing_key = SigningKey::generate(&mut OsRng);
    let device_id = format!("LUK-GENESIS-{}", OsRng.next_u32());
    let device = LukuDeviceIdentity {
        device_id: device_id.clone(),
        public_key: BASE64.encode(signing_key.verifying_key().to_bytes()),
        vendor: Some("LUKUID".to_string()),
    };
    let mut payload = json!({ "ctr": 7, "timestamp_utc": 1000 });
    if let Some(hash) = genesis_hash {
        payload["genesis_hash"] = json!(hash);
    }
    let records = vec![json!({
        "type": "scan",
        "vendor": "LUKUID",
        "signature": BASE64.encode(signing_key.sign(b"can1").to_bytes()),
        "previous_signature": previous_signature,
        "canonical_string": "can1",
        "payload": payload
    })];
    let path = std::env::temp_dir().join(format!("{}.luku", device_id));
    LukuFile::export_with_identity(records, &path, device, HashMap::new(), &signing_key, LukuExportOptions::default()).unwrap();
    let data = std::fs::read(&path).unwrap();
    let _ = std::fs::remove_file(&path);
    let mut archive = LukuFile::open_bytes(&data).unwrap();
    archive.blocks[0].attestation_dac_der = attach_dac.then(|| BASE64.encode(dac));
    archive
        .verify(LukuVerifyOptions { allow_untrusted_roots: false, trust_profile: "dev".to_string(), ..Default::default() })
        .into_iter()
        .filter(|i| i.code == "GENESIS_HASH_MISMATCH")
        .collect()
}

fn dac_and_hash() -> (Vec<u8>, String) {
    let mut dac = vec![0u8; 300];
    OsRng.fill_bytes(&mut dac);
    let hash = BASE64.encode(Sha256::digest(&dac));
    (dac, hash)
}

#[test]
fn accepts_genesis_anchored_to_dac_with_genesis_hash() {
    let (dac, hash) = dac_and_hash();
    assert!(genesis_issues(&dac, &hash, Some(&hash), true).is_empty());
}

#[test]
fn accepts_genesis_anchored_to_dac_without_genesis_hash() {
    let (dac, hash) = dac_and_hash();
    assert!(genesis_issues(&dac, &hash, None, true).is_empty());
}

#[test]
fn rejects_32_byte_previous_signature_not_matching_dac() {
    let (dac, _) = dac_and_hash();
    let issues = genesis_issues(&dac, &random_b64(32), None, true);
    assert!(issues.iter().any(|i| i.message.contains("SHA-256 of its DAC")));
}

#[test]
fn rejects_genesis_without_dac() {
    let (dac, hash) = dac_and_hash();
    let issues = genesis_issues(&dac, &hash, Some(&hash), false);
    assert!(issues.iter().any(|i| i.message.contains("DAC certificate missing")));
}

#[test]
fn rejects_genesis_hash_differing_from_previous_signature() {
    let (dac, hash) = dac_and_hash();
    let issues = genesis_issues(&dac, &hash, Some(&random_b64(32)), true);
    assert!(issues.iter().any(|i| i.message.contains("genesis_hash that does not match previous_signature")));
}

#[test]
fn sixty_four_byte_previous_signature_is_not_genesis() {
    let (dac, _) = dac_and_hash();
    assert!(genesis_issues(&dac, &random_b64(64), Some("genesis_fake"), true).is_empty());
}
