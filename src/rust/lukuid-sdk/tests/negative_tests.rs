// SPDX-License-Identifier: Apache-2.0
use lukuid_sdk::luku::{LukuFile, LukuVerifyOptions, LukuDeviceIdentity, LukuExportOptions};
use std::path::PathBuf;
use serde_json::{Value, json};
use ed25519_dalek::{SigningKey, Signer};
use rand_core::OsRng;
use std::collections::HashMap;

fn samples_dir() -> PathBuf {
    let mut path = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    while !path.join("samples").exists() {
        if !path.pop() { break; }
    }
    path.join("samples/dotluku/dev/1.0.0")
}

async fn create_valid_export(device_id: &str) -> LukuFile {
    let mut csprng = OsRng;
    let signing_key: SigningKey = SigningKey::generate(&mut csprng);
    let public_key = base64::Engine::encode(&base64::engine::general_purpose::STANDARD, signing_key.verifying_key().to_bytes());
    
    let device = LukuDeviceIdentity {
        device_id: device_id.to_string(),
        public_key: public_key.clone(),
    };

    let records = vec![
        json!({
            "type": "scan",
            "signature": base64::Engine::encode(&base64::engine::general_purpose::STANDARD, signing_key.sign(b"can1").to_bytes()),
            "previous_signature": "genesis_fake",
            "canonical_string": "can1",
            "payload": {
                "ctr": 1,
                "timestamp_utc": 1000,
                "genesis_hash": "genesis_fake"
            }
        })
    ];

    let temp_dir = std::env::temp_dir();
    let path = temp_dir.join(format!("{}.luku", device_id));
    
    LukuFile::export_with_identity(
        records,
        &path,
        device,
        HashMap::new(),
        &signing_key,
        LukuExportOptions::default()
    ).unwrap();

    let data = std::fs::read(&path).unwrap();
    let _ = std::fs::remove_file(&path);
    LukuFile::open_bytes(&data).unwrap()
}

fn test_options() -> LukuVerifyOptions {
    LukuVerifyOptions {
        allow_untrusted_roots: false,
        trust_profile: "dev".to_string(),
        ..Default::default()
    }
}

#[tokio::test]
async fn test_fails_when_attestation_signature_is_tampered() {
    let mut archive = create_valid_export("LUK-TAMPER-1").await;
    
    // Tamper with signature in the first record
    if let Some(record) = archive.blocks[0].batch.get_mut(0) {
        if let Some(sig) = record.get_mut("signature") {
            if let Some(sig_str) = sig.as_str() {
                let mut new_sig = sig_str.replace('A', "B");
                if new_sig == sig_str {
                    new_sig = sig_str.replace('B', "A");
                }
                if new_sig == sig_str {
                    new_sig = format!("{}X", sig_str);
                }
                *sig = Value::String(new_sig);
            }
        }
    }
    
    let issues = archive.verify(test_options());
    if !issues.iter().any(|i| i.code == "RECORD_SIGNATURE_INVALID" || i.code == "ATTESTATION_FAILED") {
        println!("ISSUES (sig): {:?}", issues);
    }
    assert!(issues.iter().any(|i| i.code == "RECORD_SIGNATURE_INVALID" || i.code == "ATTESTATION_FAILED"));
}

#[tokio::test]
async fn test_fails_when_batch_hash_is_tampered() {
    let mut archive = create_valid_export("LUK-TAMPER-2").await;
    
    // Tamper with the batch_hash of the first block
    archive.blocks[0].batch_hash = "0".repeat(64);
    
    let options = LukuVerifyOptions::default();
    let issues = archive.verify(options);
    assert!(issues.iter().any(|i| i.code == "BLOCK_BATCH_HASH_INVALID"));
}

#[tokio::test]
async fn test_fails_when_root_fingerprint_is_tampered() {
    let mut archive = create_valid_export("LUK-TAMPER-3").await;
    
    archive.blocks[0].attestation_root_fingerprint = Some("0".repeat(64));
    
    let issues = archive.verify(test_options());
    assert!(issues.iter().any(|i| i.code == "ATTESTATION_FAILED" || i.code == "BLOCK_HASH_INVALID"));
}

#[tokio::test]
async fn test_fails_when_attestation_dac_cert_is_tampered() {
    let mut archive = create_valid_export("LUK-TAMPER-4").await;
    archive.blocks[0].attestation_dac_der = Some("fake_der_data".to_string());
    
    let issues = archive.verify(test_options());
    assert!(issues.iter().any(|i| i.code == "ATTESTATION_FAILED" || i.code == "ATTESTATION_CHAIN_MISSING"));
}

#[tokio::test]
async fn test_fails_when_attestation_intermediate_cert_is_tampered() {
    let mut archive = create_valid_export("LUK-TAMPER-5").await;
    archive.blocks[0].attestation_intermediate_der = Some("fake_der_data".to_string());
    
    let issues = archive.verify(test_options());
    assert!(issues.iter().any(|i| i.code == "ATTESTATION_FAILED" || i.code == "ATTESTATION_CHAIN_MISSING"));
}

#[tokio::test]
async fn test_fails_with_tampered_chain() {
    let sample_path = samples_dir().join("chain-tampered.luku");
    if !sample_path.exists() { return; }
    let data = std::fs::read(sample_path).unwrap();
    let archive = LukuFile::open_bytes(&data).unwrap();
    
    let issues = archive.verify(test_options());
    if !issues.iter().any(|i| i.code == "ATTESTATION_FAILED" || i.code == "BLOCKS_HASH_MISMATCH") {
        println!("ISSUES (chain): {:?}", issues);
    }
    assert!(issues.iter().any(|i| i.code == "ATTESTATION_FAILED" || i.code == "BLOCKS_HASH_MISMATCH"));
}
