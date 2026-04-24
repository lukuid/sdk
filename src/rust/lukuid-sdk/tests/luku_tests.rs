// SPDX-License-Identifier: Apache-2.0
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use ed25519_dalek::{Signer, SigningKey};
use lukuid_sdk::luku::{Criticality, LukuDeviceIdentity, LukuFile, LukuVerifyOptions, LukuExportOptions};
use serde_json::json;
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::fs::{self, File};
use std::io::Write;
use std::path::PathBuf;
use zip::write::FileOptions;

/// Helper to generate a valid ED25519 keypair for testing
fn generate_test_keypair() -> (SigningKey, String) {
    let secret_bytes: [u8; 32] = [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
        26, 27, 28, 29, 30, 31, 32,
    ];
    let signing_key = SigningKey::from_bytes(&secret_bytes);
    let pub_b64 = BASE64.encode(signing_key.verifying_key().as_bytes());
    (signing_key, pub_b64)
}

/// Base options for tests without real certificates
fn test_options() -> LukuVerifyOptions {
    LukuVerifyOptions {
        allow_untrusted_roots: true,
        skip_certificate_temporal_checks: true,
        trusted_external_fingerprints: Vec::new(),
        trust_profile: "dev".to_string(), // tests probably use dev/test certs
        policy: None,
        require_continuity: false,
    }
}

fn samples_dir() -> PathBuf {
    let repo_root = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../..")
        .canonicalize()
        .expect("SDK repo root should exist");
    for version in ["1.0.0", "1.0"] {
        let candidate = repo_root.join("samples").join("dotluku").join("dev").join(version);
        if candidate.exists() {
            return candidate;
        }
    }
    repo_root.join("samples").join("dotluku").join("dev").join("1.0.0")
}

fn external_identity_fixture() -> serde_json::Value {
    let repo_root = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../..")
        .canonicalize()
        .expect("SDK repo root should exist");
    let fixture_path = repo_root
        .join("samples")
        .join("external_identity")
        .join("dev")
        .join("self_signed_ed25519.json");
    let bytes = fs::read(fixture_path).expect("external identity fixture should exist");
    serde_json::from_slice(&bytes).expect("fixture JSON should parse")
}

/// Helper to create a base valid export for testing mutations
fn create_valid_export(temp_dir: &std::path::Path, device_id: &str) -> (LukuFile, SigningKey) {
    let (signing_key, pub_b64) = generate_test_keypair();

    let identity = LukuDeviceIdentity {
        device_id: device_id.to_string(),
        public_key: pub_b64,
    };

    let canonical1 = "can1";
    let sig1 = BASE64.encode(signing_key.sign(canonical1.as_bytes()).to_bytes());

    let canonical2 = "can2";
    let sig2 = BASE64.encode(signing_key.sign(canonical2.as_bytes()).to_bytes());

    let canonical3 = "can3";
    let sig3 = BASE64.encode(signing_key.sign(canonical3.as_bytes()).to_bytes());

    let records = vec![
        json!({
            "type": "scan",
            "signature": sig1,
            "previous_signature": "genesis_fake",
            "canonical_string": canonical1,
            "payload": {
                "ctr": 1,
                "timestamp_utc": 1000,
                "genesis_hash": "genesis_fake"
            }
        }),
        json!({
            "type": "scan",
            "signature": sig2,
            "previous_signature": sig1,
            "canonical_string": canonical2,
            "payload": {
                "ctr": 2,
                "timestamp_utc": 1005,
                "genesis_hash": "genesis_fake"
            }
        }),
        json!({
            "type": "scan",
            "signature": sig3,
            "previous_signature": sig2,
            "canonical_string": canonical3,
            "payload": {
                "ctr": 3,
                "timestamp_utc": 1010,
                "genesis_hash": "genesis_fake"
            }
        }),
    ];

    let luku_path = temp_dir.join(format!("{}.luku", device_id));
    LukuFile::export_with_identity(records, &luku_path, identity, HashMap::new(), &signing_key, LukuExportOptions::default())
        .unwrap();

    let luku = LukuFile::open(&luku_path).unwrap();
    (luku, signing_key)
}

// ------------------------------------------------------------------
// Core Logic Validation
// ------------------------------------------------------------------

#[test]
fn test_luku_verify_valid_file() {
    let temp_dir = std::env::temp_dir().join("lukuid_tests_valid");
    fs::create_dir_all(&temp_dir).unwrap();
    let (luku, _) = create_valid_export(&temp_dir, "LUK-VALID");

    let issues = luku.verify(test_options());

    let critical_record_issues: Vec<_> = issues
        .into_iter()
        .filter(|i| i.criticality == Criticality::Critical)
        .collect();

    assert!(
        critical_record_issues.is_empty(),
        "Expected no critical issues, found: {:?}",
        critical_record_issues
    );
}

#[test]
fn test_luku_manifest_preserves_temporal_continuity_metadata() {
    let temp_dir = std::env::temp_dir().join("lukuid_tests_manifest_extra");
    fs::create_dir_all(&temp_dir).unwrap();
    let (signing_key, pub_b64) = generate_test_keypair();
    let device = LukuDeviceIdentity {
        device_id: "LUK-META".to_string(),
        public_key: pub_b64,
    };
    let canonical = "manifest-extra-scan";
    let signature = BASE64.encode(signing_key.sign(canonical.as_bytes()).to_bytes());

    let block = LukuFile::build_block_from_records(
        0,
        1000,
        None,
        &device,
        vec![json!({
            "type": "scan",
            "signature": signature,
            "previous_signature": "genesis_fake",
            "canonical_string": canonical,
            "payload": {
                "ctr": 1,
                "timestamp_utc": 1000,
                "genesis_hash": "genesis_fake"
            }
        })],
        None,
    );

    let mut manifest_extra = HashMap::new();
    manifest_extra.insert(
        "lukuid_block_reasons".to_string(),
        json!([{
            "block_id": 0,
            "code": "archive_start",
            "label": "Block start",
            "detail_code": serde_json::Value::Null,
            "detail_label": serde_json::Value::Null
        }]),
    );

    let path = temp_dir.join("manifest-extra.luku");
    LukuFile::export_blocks_with_manifest(
        &path,
        vec![block],
        HashMap::new(),
        "Manifest extra parity".to_string(),
        manifest_extra,
        &signing_key,
        LukuExportOptions {
            policy: Some(lukuid_sdk::luku::LukuPolicy {
                name: "test_policy".to_string(),
                native_continuity_gap_seconds: Some(600),
            }),
        }
    )
    .unwrap();

    let reopened = LukuFile::open(&path).unwrap();
    assert_eq!(
        reopened.manifest.native_continuity_gap_seconds,
        Some(600)
    );
    let reasons = reopened
        .manifest
        .extra
        .get("lukuid_block_reasons")
        .and_then(|value| value.as_array())
        .expect("lukuid_block_reasons should be preserved");
    assert_eq!(reasons.len(), 1);
    assert_eq!(
        reasons[0].get("code").and_then(|value| value.as_str()),
        Some("archive_start")
    );
    assert_eq!(
        reasons[0].get("label").and_then(|value| value.as_str()),
        Some("Block start")
    );

    let _ = fs::remove_file(path);
}

#[test]
fn test_luku_export_emits_current_manifest_version() {
    let temp_dir = std::env::temp_dir().join("lukuid_tests_version");
    fs::create_dir_all(&temp_dir).unwrap();
    let (luku, _) = create_valid_export(&temp_dir, "LUK-VERSION");
    assert_eq!(luku.manifest.version, "1.0.0");
}

#[test]
fn test_luku_verify_enforces_native_continuity_when_requested() {
    let temp_dir = std::env::temp_dir().join("lukuid_tests_continuity");
    fs::create_dir_all(&temp_dir).unwrap();
    let (signing_key, pub_b64) = generate_test_keypair();
    let identity = LukuDeviceIdentity {
        device_id: "LUK-CONT".to_string(),
        public_key: pub_b64,
    };

    let env1 = "env-1";
    let env1_sig = BASE64.encode(signing_key.sign(env1.as_bytes()).to_bytes());
    let env2 = "env-2";
    let env2_sig = BASE64.encode(signing_key.sign(env2.as_bytes()).to_bytes());

    let path = temp_dir.join("continuity.luku");
    LukuFile::export_with_identity(
        vec![
            json!({
                "type": "environment",
                "signature": env1_sig,
                "previous_signature": "genesis_fake",
                "canonical_string": env1,
                "payload": {
                    "ctr": 1,
                    "timestamp_utc": 1000,
                    "genesis_hash": "genesis_fake"
                }
            }),
            json!({
                "type": "environment",
                "signature": env2_sig,
                "previous_signature": BASE64.encode(signing_key.sign(env1.as_bytes()).to_bytes()),
                "canonical_string": env2,
                "payload": {
                    "ctr": 2,
                    "timestamp_utc": 2000,
                    "genesis_hash": "genesis_fake"
                }
            }),
        ],
        &path,
        identity,
        HashMap::new(),
        &signing_key,
        LukuExportOptions {
            policy: Some(lukuid_sdk::luku::LukuPolicy {
                name: "guardcard".to_string(),
                native_continuity_gap_seconds: Some(600),
            }),
        },
    )
    .unwrap();

    let luku = LukuFile::open(&path).unwrap();
    let issues = luku.verify(LukuVerifyOptions {
        allow_untrusted_roots: true,
        skip_certificate_temporal_checks: true,
        trusted_external_fingerprints: Vec::new(),
        trust_profile: "dev".to_string(),
        policy: None,
        require_continuity: true,
    });
    assert!(issues.iter().any(|issue| issue.code == "CONTINUITY_GAP_EXCEEDED"));
}

#[test]
fn test_luku_verify_rejects_untrusted_external_identity_endorsements() {
    let temp_dir = std::env::temp_dir().join("lukuid_tests_external_identity");
    fs::create_dir_all(&temp_dir).unwrap();
    let fixture = external_identity_fixture();
    let (signing_key, pub_b64) = generate_test_keypair();
    let identity = LukuDeviceIdentity {
        device_id: "LUK-EXT".to_string(),
        public_key: pub_b64,
    };

    let canonical = "attachment-ext";
    let device_sig = BASE64.encode(signing_key.sign(canonical.as_bytes()).to_bytes());
    let checksum = fixture.get("checksum").and_then(|value| value.as_str()).unwrap();
    let attachment_bytes = fixture
        .get("attachment_utf8")
        .and_then(|value| value.as_str())
        .unwrap()
        .as_bytes()
        .to_vec();

    let path = temp_dir.join("external-identity.luku");
    let mut attachments = HashMap::new();
    attachments.insert(checksum.to_string(), attachment_bytes);

    LukuFile::export_with_identity(
        vec![json!({
            "type": "attachment",
            "attachment_id": "ATT-EXT-1",
            "signature": device_sig,
            "previous_signature": "",
            "canonical_string": canonical,
            "checksum": checksum,
            "external_identity": {
                "endorser_id": fixture.get("endorser_id").and_then(|value| value.as_str()).unwrap(),
                "root_fingerprint": fixture.get("root_fingerprint").and_then(|value| value.as_str()).unwrap(),
                "cert_chain_der": fixture.get("cert_chain_der").cloned().unwrap(),
                "signature": fixture.get("signature").and_then(|value| value.as_str()).unwrap()
            }
        })],
        &path,
        identity,
        attachments,
        &signing_key,
        LukuExportOptions::default(),
    )
    .unwrap();

    let luku = LukuFile::open(&path).unwrap();
    let trusted = luku.verify(LukuVerifyOptions {
        allow_untrusted_roots: true,
        skip_certificate_temporal_checks: true,
        trusted_external_fingerprints: vec![
            fixture
                .get("root_fingerprint")
                .and_then(|value| value.as_str())
                .unwrap()
                .to_string(),
        ],
        trust_profile: "dev".to_string(),
        policy: None,
        require_continuity: false,
    });
    assert!(!trusted.iter().any(|issue| issue.code == "EXTERNAL_IDENTITY_VERIFICATION_FAILED"));

    let untrusted = luku.verify(test_options());
    assert!(untrusted.iter().any(|issue| issue.code == "EXTERNAL_IDENTITY_VERIFICATION_FAILED"));
}

// ------------------------------------------------------------------
// Cryptographic Guarantees Validation (dotluku/spec.md mapping)
// ------------------------------------------------------------------

#[test]
fn test_crypto_guarantee_record_deletion() {
    let temp_dir = std::env::temp_dir().join("lukuid_tests_del");
    fs::create_dir_all(&temp_dir).unwrap();
    let (mut luku, _) = create_valid_export(&temp_dir, "LUK-DEL");

    // Deleting the middle record (index 1) causes the third record's `previous_signature`
    // (which points to record 1) to mismatch the actual previous record in the archive (record 0).
    luku.blocks[0].batch.remove(1);

    let issues = luku.verify(test_options());
    assert!(
        issues.iter().any(|i| i.code == "RECORD_CHAIN_BROKEN"),
        "Failed to detect record deletion in the middle of a chain. Issues: {:?}",
        issues
    );
}

#[test]
fn test_crypto_guarantee_record_injection() {
    let temp_dir = std::env::temp_dir().join("lukuid_tests_inj");
    fs::create_dir_all(&temp_dir).unwrap();
    let (mut luku, _) = create_valid_export(&temp_dir, "LUK-INJ");

    // Inject a fake record in the middle
    luku.blocks[0].batch.insert(
        1,
        json!({
            "type": "scan",
            "signature": "fake_sig",
            "previous_signature": "doesnt_matter",
            "payload": { "ctr": 2, "timestamp_utc": 1002 }
        }),
    );

    let issues = luku.verify(test_options());
    assert!(
        issues
            .iter()
            .any(|i| i.code == "RECORD_CHAIN_BROKEN" || i.code == "RECORD_SIGNATURE_INVALID"),
        "Failed to detect injection"
    );
}

#[test]
fn test_crypto_guarantee_clock_winding() {
    let temp_dir = std::env::temp_dir().join("lukuid_tests_time");
    fs::create_dir_all(&temp_dir).unwrap();
    let (mut luku, _) = create_valid_export(&temp_dir, "LUK-TIME");

    // Rewind clock
    luku.blocks[0].batch[1]["payload"]["timestamp_utc"] = json!(999);

    let issues = luku.verify(test_options());
    assert!(
        issues.iter().any(|i| i.code == "TIME_REGRESSION"),
        "Failed to detect clock winding (time regression)"
    );
}

#[test]
fn test_crypto_guarantee_replay_counter() {
    let temp_dir = std::env::temp_dir().join("lukuid_tests_ctr_reg");
    fs::create_dir_all(&temp_dir).unwrap();
    let (mut luku, _) = create_valid_export(&temp_dir, "LUK-CTR");

    luku.blocks[0].batch[1]["payload"]["ctr"] = json!(1);

    let issues = luku.verify(test_options());
    assert!(
        issues.iter().any(|i| i.code == "COUNTER_REGRESSION"),
        "Failed to detect counter regression"
    );
}

#[test]
fn test_crypto_guarantee_export_tampering() {
    let temp_dir = std::env::temp_dir().join("lukuid_tests_exp_tamper");
    fs::create_dir_all(&temp_dir).unwrap();
    let (luku, _) = create_valid_export(&temp_dir, "LUK-EXP");

    // Manually alter blocks.jsonl in the zip
    let altered_path = temp_dir.join("LUK-EXP_altered.luku");
    let file = File::create(&altered_path).unwrap();
    let mut zip = zip::ZipWriter::new(file);
    zip.start_file(
        "mimetype",
        FileOptions::<()>::default().compression_method(zip::CompressionMethod::Stored),
    )
    .unwrap();
    zip.write_all(lukuid_sdk::LUKU_MIMETYPE.as_bytes()).unwrap();

    // Modify blocks hash content to be invalid but still valid JSON structure
    let mut altered_block = luku.blocks[0].clone();
    altered_block.block_id = 999; // Tampered

    zip.start_file("blocks.jsonl", FileOptions::<()>::default())
        .unwrap();
    zip.write_all(serde_json::to_string(&altered_block).unwrap().as_bytes())
        .unwrap();
    zip.write_all(b"\n").unwrap();

    zip.start_file("manifest.json", FileOptions::<()>::default())
        .unwrap();
    zip.write_all(serde_json::to_string(&luku.manifest).unwrap().as_bytes())
        .unwrap();

    zip.start_file("manifest.sig", FileOptions::<()>::default())
        .unwrap();
    zip.write_all(b"placeholder_signature").unwrap();

    zip.finish().unwrap();

    let altered_luku = LukuFile::open(&altered_path).unwrap();
    let issues = altered_luku.verify(test_options());

    assert!(
        issues.iter().any(|i| i.code == "BLOCKS_HASH_MISMATCH"),
        "Failed to detect export zip tampering"
    );
}

#[test]
fn test_crypto_guarantee_large_file_tamper() {
    let temp_dir = std::env::temp_dir().join("lukuid_tests_att_corr");
    fs::create_dir_all(&temp_dir).unwrap();
    let (mut luku, _) = create_valid_export(&temp_dir, "LUK-ATT2");

    let hash = luku.add_attachment(b"valid_data".to_vec());

    luku.blocks[0].batch.push(json!({
        "type": "attachment",
        "checksum": hash,
        "payload": { "ctr": 3 }
    }));

    luku.attachments
        .insert(hash.clone(), b"tampered_data".to_vec());

    let issues = luku.verify(test_options());
    assert!(
        issues.iter().any(|i| i.code == "ATTACHMENT_CORRUPT"),
        "Failed to detect corrupt attachment"
    );
}

#[test]
fn test_luku_verify_attested_attachment_does_not_advance_device_chain() {
    let temp_dir = std::env::temp_dir().join("lukuid_tests_attested_attachment");
    fs::create_dir_all(&temp_dir).unwrap();

    let (signing_key, pub_b64) = generate_test_keypair();
    let device_id = "LUK-ATTEST";
    let attachment_bytes = b"desktop-added-attachment".to_vec();
    let attachment_hash = format!("{:x}", Sha256::digest(&attachment_bytes));

    let scan_canonical = "attested-scan";
    let scan_sig = BASE64.encode(signing_key.sign(scan_canonical.as_bytes()).to_bytes());
    let env_canonical = "attested-environment";
    let env_sig = BASE64.encode(signing_key.sign(env_canonical.as_bytes()).to_bytes());
    let att_canonical = "attested-attachment";
    let att_sig = BASE64.encode(signing_key.sign(att_canonical.as_bytes()).to_bytes());
    let device = LukuDeviceIdentity {
        device_id: device_id.to_string(),
        public_key: pub_b64.clone(),
    };

    let records = vec![
        json!({
            "type": "scan",
            "scan_id": "SCAN-ATTEST-1",
            "device_id": device_id,
            "public_key": pub_b64.clone(),
            "signature": scan_sig,
            "previous_signature": "genesis_fake",
            "canonical_string": scan_canonical,
            "payload": {
                "ctr": 1,
                "timestamp_utc": 1000,
                "genesis_hash": "genesis_fake"
            }
        }),
        json!({
            "type": "attachment",
            "attachment_id": "ATT-ATTEST-1",
            "parent_record_id": "SCAN-ATTEST-1",
            "device_id": device_id,
            "public_key": device.public_key.clone(),
            "signature": att_sig,
            "parent_signature": scan_sig,
            "canonical_string": att_canonical,
            "timestamp_utc": 1001,
            "checksum": attachment_hash,
            "mime": "text/plain",
            "title": "Desktop Note"
        }),
        json!({
            "type": "environment",
            "event_id": "ENV-ATTEST-1",
            "device_id": device_id,
            "public_key": device.public_key,
            "signature": env_sig,
            "previous_signature": scan_sig,
            "canonical_string": env_canonical,
            "payload": {
                "ctr": 2,
                "timestamp_utc": 1002
            }
        }),
    ];

    let path = temp_dir.join("attested_attachment.luku");
    let block = LukuFile::build_block_from_records(0, 1003, None, &device, records, None);
    LukuFile::export_blocks_with_manifest(
        &path,
        vec![block],
        HashMap::from([(attachment_hash.clone(), attachment_bytes)]),
        "Attested attachment export".to_string(),
        HashMap::new(),
        &signing_key,
        LukuExportOptions::default(),
    )
    .unwrap();

    let luku = LukuFile::open(&path).unwrap();
    let issues = luku.verify(test_options());
    let criticals: Vec<_> = issues
        .iter()
        .filter(|issue| issue.criticality == Criticality::Critical)
        .collect();

    assert!(
        criticals.is_empty(),
        "Attested attachment export should remain openable: {:?}",
        criticals
    );
    assert!(
        issues
            .iter()
            .all(|issue| issue.code != "RECORD_CHAIN_BROKEN"),
        "Attested aux records must not advance device continuity state."
    );
}

#[test]
fn test_luku_verify_attested_custody_does_not_advance_device_chain() {
    let temp_dir = std::env::temp_dir().join("lukuid_tests_attested_custody");
    fs::create_dir_all(&temp_dir).unwrap();

    let (signing_key, pub_b64) = generate_test_keypair();
    let device_id = "LUK-CUSTODY";

    let scan_canonical = "custody-scan";
    let scan_sig = BASE64.encode(signing_key.sign(scan_canonical.as_bytes()).to_bytes());
    let env_canonical = "custody-environment";
    let env_sig = BASE64.encode(signing_key.sign(env_canonical.as_bytes()).to_bytes());
    let custody_canonical = "custody-checkpoint";
    let custody_sig = BASE64.encode(signing_key.sign(custody_canonical.as_bytes()).to_bytes());
    let device = LukuDeviceIdentity {
        device_id: device_id.to_string(),
        public_key: pub_b64.clone(),
    };

    let records = vec![
        json!({
            "type": "scan",
            "scan_id": "SCAN-CUSTODY-1",
            "device_id": device_id,
            "public_key": pub_b64.clone(),
            "signature": scan_sig,
            "previous_signature": "genesis_fake",
            "canonical_string": scan_canonical,
            "payload": {
                "ctr": 1,
                "timestamp_utc": 1000,
                "genesis_hash": "genesis_fake"
            }
        }),
        json!({
            "type": "custody",
            "custody_id": "CUSTODY-1",
            "parent_record_id": "SCAN-CUSTODY-1",
            "device_id": device_id,
            "public_key": pub_b64.clone(),
            "signature": custody_sig,
            "parent_signature": scan_sig,
            "canonical_string": custody_canonical,
            "timestamp_utc": 1001,
            "payload": {
                "event": "handoff",
                "status": "received",
                "context_ref": "shipment-123"
            }
        }),
        json!({
            "type": "environment",
            "event_id": "ENV-CUSTODY-1",
            "device_id": device_id,
            "public_key": device.public_key.clone(),
            "signature": env_sig,
            "previous_signature": scan_sig,
            "canonical_string": env_canonical,
            "payload": {
                "ctr": 2,
                "timestamp_utc": 1002
            }
        }),
    ];

    let path = temp_dir.join("attested_custody.luku");
    let block = LukuFile::build_block_from_records(0, 1003, None, &device, records, None);
    LukuFile::export_blocks_with_manifest(
        &path,
        vec![block],
        HashMap::new(),
        "Attested custody export".to_string(),
        HashMap::new(),
        &signing_key,
        LukuExportOptions::default(),
    )
    .unwrap();

    let luku = LukuFile::open(&path).unwrap();
    let issues = luku.verify(test_options());
    let criticals: Vec<_> = issues
        .iter()
        .filter(|issue| issue.criticality == Criticality::Critical)
        .collect();

    assert!(
        criticals.is_empty(),
        "Attested custody export should remain openable: {:?}",
        criticals
    );
    assert!(
        issues
            .iter()
            .all(|issue| issue.code != "RECORD_CHAIN_BROKEN"),
        "Attested custody records must not advance device continuity state."
    );
}

// ------------------------------------------------------------------
// Attestation Verification Failure Path
// ------------------------------------------------------------------

#[test]
fn test_luku_verify_attestation_failure_when_strict() {
    let temp_dir = std::env::temp_dir().join("lukuid_tests_strict_att");
    fs::create_dir_all(&temp_dir).unwrap();
    let (mut luku, _) = create_valid_export(&temp_dir, "LUK-STRICT");

    // Inject fake DER chain
    luku.blocks[0].attestation_dac_der = Some(BASE64.encode(b"fake_der_data"));

    let mut strict_options = test_options();
    strict_options.allow_untrusted_roots = false; // Turn ON strict checking

    let issues = luku.verify(strict_options);

    assert!(
        issues
            .iter()
            .any(|i| i.code == "ATTESTATION_FAILED" || i.code == "ATTESTATION_CHAIN_MISSING"),
        "Failed to enforce strict attestation check on untrusted/fake roots."
    );
}

// ------------------------------------------------------------------
// Fuzz Testing (Structural Failures)
// ------------------------------------------------------------------

#[test]
fn test_luku_fuzz_bad_zip() {
    let temp_dir = std::env::temp_dir().join("lukuid_tests_fuzz");
    fs::create_dir_all(&temp_dir).unwrap();

    // 1. Not a zip file
    let bad_zip_path = temp_dir.join("not_a_zip.luku");
    let mut file = File::create(&bad_zip_path).unwrap();
    file.write_all(b"just random garbage bytes").unwrap();

    let res = LukuFile::open(&bad_zip_path);
    assert!(res.is_err(), "Should fail on non-zip file");

    // 2. Valid zip, wrong mimetype
    let wrong_mime_path = temp_dir.join("wrong_mime.luku");
    let file = File::create(&wrong_mime_path).unwrap();
    let mut zip = zip::ZipWriter::new(file);
    zip.start_file("mimetype", FileOptions::<()>::default())
        .unwrap();
    zip.write_all(b"application/pdf").unwrap();
    zip.finish().unwrap();

    let res2 = LukuFile::open(&wrong_mime_path);
    assert!(res2.is_err());
    assert!(res2.unwrap_err().contains("Invalid mimetype"));

    // 3. Valid zip, missing manifest
    let no_manifest_path = temp_dir.join("no_manifest.luku");
    let file = File::create(&no_manifest_path).unwrap();
    let mut zip = zip::ZipWriter::new(file);
    zip.start_file(
        "mimetype",
        FileOptions::<()>::default().compression_method(zip::CompressionMethod::Stored),
    )
    .unwrap();
    zip.write_all(lukuid_sdk::LUKU_MIMETYPE.as_bytes()).unwrap();
    zip.finish().unwrap();

    let res3 = LukuFile::open(&no_manifest_path);
    assert!(res3.is_err());
    assert!(res3.unwrap_err().contains("manifest.json missing"));
}

// ------------------------------------------------------------------
// INSTRUCTIONS FOR FUTURE FIXTURE TESTING
// ------------------------------------------------------------------

#[test]
#[ignore = "Awaiting real .luku fixtures"]
fn test_fixtures_valid_files() {
    let fixture_dir = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests")
        .join("fixtures")
        .join("valid_files");

    if fixture_dir.exists() {
        for entry in fs::read_dir(fixture_dir).unwrap() {
            let entry = entry.unwrap();
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) == Some("luku") {
                let luku =
                    LukuFile::open(&path).expect(&format!("Failed to open fixture {:?}", path));
                let issues = luku.verify(LukuVerifyOptions {
                    allow_untrusted_roots: false,
                    skip_certificate_temporal_checks: false,
                    trusted_external_fingerprints: Vec::new(),
                    trust_profile: "dev".to_string(),
                    policy: None,
                    require_continuity: false,
                });

                let criticals: Vec<_> = issues
                    .iter()
                    .filter(|i| i.criticality == Criticality::Critical)
                    .collect();
                assert!(
                    criticals.is_empty(),
                    "Fixture {:?} failed verification: {:?}",
                    path,
                    criticals
                );
            }
        }
    }
}

#[test]
fn test_real_sample_in_memory_mutations() {
    let sample_path = samples_dir().join("first-passable-verification-sample.luku");
    
    // Make sure it exists before testing
    if !sample_path.exists() {
        println!("Sample file not found, skipping test.");
        return;
    }
    
    // 1. Verify the untouched file is valid
    let original_luku = LukuFile::open(&sample_path).expect("Failed to open sample .luku file");
    let options = test_options(); // uses allow_untrusted_roots
    let original_issues = original_luku.verify(options.clone());
    
    let criticals: Vec<_> = original_issues.iter().filter(|i| i.criticality == Criticality::Critical).collect();
    assert!(
        criticals.is_empty(),
        "Original sample file has critical issues: {:?}",
        criticals
    );

    // 2. Mutate a record's signature to be invalid format (corrupt base64)
    let mut mutated_luku = LukuFile::open(&sample_path).unwrap();
    let first_block = &mut mutated_luku.blocks[0];
    let first_record = first_block.batch[0].as_object_mut().unwrap();
    first_record.insert("signature".to_string(), serde_json::Value::String("not_base64_data!!!".to_string()));
    
    let issues = mutated_luku.verify(options.clone());
    assert!(
        issues.iter().any(|i| i.code == "RECORD_SIGNATURE_INVALID" || i.code == "ATTESTATION_FAILED"),
        "Failed to catch invalid signature format"
    );

    // 3. Mutate a record's canonical_string (wrong hash/signature mismatch)
    let mut mutated_luku = LukuFile::open(&sample_path).unwrap();
    let first_record = mutated_luku.blocks[0].batch[0].as_object_mut().unwrap();
    let current_canonical = first_record.get("canonical_string").unwrap().as_str().unwrap().to_string();
    first_record.insert("canonical_string".to_string(), serde_json::Value::String(format!("{}X", current_canonical)));
    
    let issues = mutated_luku.verify(options.clone());
    assert!(
        issues.iter().any(|i| i.code == "RECORD_SIGNATURE_INVALID"),
        "Failed to catch canonical_string mutation"
    );

    // 4. Mutate previous_signature to break the chain (not on the first record to avoid floating anchor logic)
    if original_luku.blocks[0].batch.len() > 1 {
        let mut mutated_luku = LukuFile::open(&sample_path).unwrap();
        let second_record = mutated_luku.blocks[0].batch[1].as_object_mut().unwrap();
        second_record.insert("previous_signature".to_string(), serde_json::Value::String("broken_link".to_string()));
        
        let issues = mutated_luku.verify(options.clone());
        assert!(
            issues.iter().any(|i| i.code == "RECORD_CHAIN_BROKEN"),
            "Failed to catch broken record chain"
        );
    }

    // 5. Test Floating Anchor Logic by creating a gap between blocks
    if original_luku.blocks.len() > 1 {
        let mut mutated_luku = LukuFile::open(&sample_path).unwrap();
        // Modify the previous_signature of the FIRST record in the SECOND block.
        // Because of our dynamic block chunking, this is a floating anchor and SHOULD NOT trigger RECORD_CHAIN_BROKEN
        let second_block_first_record = mutated_luku.blocks[1].batch[0].as_object_mut().unwrap();
        second_block_first_record.insert("previous_signature".to_string(), serde_json::Value::String("floating_anchor_test".to_string()));
        
        let issues = mutated_luku.verify(options.clone());
        // Should NOT have a RECORD_CHAIN_BROKEN issue for this specific gap between blocks
        assert!(
            !issues.iter().any(|i| i.code == "RECORD_CHAIN_BROKEN"),
            "Floating anchor test failed: triggered RECORD_CHAIN_BROKEN between blocks"
        );
    }

    // 6. Mutate the counter to cause a regression
    if original_luku.blocks[0].batch.len() > 1 {
        let mut mutated_luku = LukuFile::open(&sample_path).unwrap();
        let second_record = mutated_luku.blocks[0].batch[1].as_object_mut().unwrap();
        let payload = second_record.get_mut("payload").unwrap().as_object_mut().unwrap();
        payload.insert("ctr".to_string(), serde_json::Value::Number(serde_json::Number::from(0))); // regress to 0
        
        let issues = mutated_luku.verify(options.clone());
        assert!(
            issues.iter().any(|i| i.code == "COUNTER_REGRESSION"),
            "Failed to catch counter regression"
        );
    }
}

#[test]
fn test_samples_directory_files() {
    let samples_dir = samples_dir();
    if !samples_dir.exists() {
        println!("Samples directory not found, skipping test.");
        return;
    }

    let options = test_options(); // uses allow_untrusted_roots

    // 1. first-passable-verification-sample.luku (Valid)
    let passable_path = samples_dir.join("first-passable-verification-sample.luku");
    if passable_path.exists() {
        let luku = LukuFile::open(&passable_path).unwrap();
        let mut strict_options = options.clone();
        strict_options.allow_untrusted_roots = false;
        let issues = luku.verify(strict_options);
        let criticals: Vec<_> = issues.iter().filter(|i| i.criticality == Criticality::Critical).collect();
        assert!(criticals.is_empty(), "Expected passable sample to be valid, found: {:?}", criticals);
    }

    // 2. signature-mismatch.luku (Invalid)
    let mismatch_path = samples_dir.join("signature-mismatch.luku");
    if mismatch_path.exists() {
        let luku = LukuFile::open(&mismatch_path).unwrap();
        let mut mismatch_options = options.clone();
        mismatch_options.allow_untrusted_roots = false; // enforce checking
        let issues = luku.verify(mismatch_options);
        assert!(
            issues.iter().any(|i| i.code == "ATTESTATION_FAILED" || i.code == "RECORD_SIGNATURE_INVALID" || i.code == "ATTESTATION_CHAIN_MISSING"),
            "Expected signature-mismatch.luku to fail attestation or signature checks"
        );
    }

    // 3. invalid-chain.luku (Invalid)
    let invalid_chain_path = samples_dir.join("invalid-chain.luku");
    if invalid_chain_path.exists() {
        let luku = LukuFile::open(&invalid_chain_path).unwrap();
        let issues = luku.verify(options.clone());
        assert!(
            issues.iter().any(|i| i.code == "RECORD_CHAIN_BROKEN" || i.code == "BLOCK_HASH_MISMATCH" || i.code == "ATTESTATION_FAILED"),
            "Expected invalid-chain.luku to fail verification"
        );
    }

    // 4. Trust Profile Logic (Valid dev file rejected by test/prod profiles)
    if passable_path.exists() {
        let luku = LukuFile::open(&passable_path).unwrap();
        
        // Ensure it passes with "dev"
        let mut dev_options = options.clone();
        dev_options.allow_untrusted_roots = false; // enforce checking against real roots
        dev_options.trust_profile = "dev".to_string();
        let dev_issues = luku.verify(dev_options);
        assert!(
            !dev_issues.iter().any(|i| i.code == "ATTESTATION_FAILED" && i.message.contains("Certificate chain does not match the requested trust profile")),
            "Expected passable sample to pass trust profile check under 'dev' profile"
        );

        // Ensure it fails with "test"
        let mut test_options = options.clone();
        test_options.allow_untrusted_roots = false; // enforce checking
        test_options.trust_profile = "test".to_string();
        let test_issues = luku.verify(test_options);
        assert!(
            test_issues.iter().any(|i| i.code == "ATTESTATION_FAILED" && i.message.contains("Certificate chain does not match the requested trust profile")),
            "Expected passable sample (dev) to fail trust profile check under 'test' profile"
        );

        // Ensure it fails with "prod"
        let mut prod_options = options.clone();
        prod_options.allow_untrusted_roots = false; // enforce checking
        prod_options.trust_profile = "prod".to_string();
        let prod_issues = luku.verify(prod_options);
        assert!(
            prod_issues.iter().any(|i| i.code == "ATTESTATION_FAILED" && i.message.contains("Certificate chain does not match the requested trust profile")),
            "Expected passable sample (dev) to fail trust profile check under 'prod' profile"
        );
    }
}

#[test]
fn test_lukuid_sdk_self_test() {
    let results = lukuid_sdk::LukuidSdk::self_test();
    assert!(!results.is_empty());
    for result in results {
        println!("{} {} {} : {}", result.alg, result.operation, result.id, result.passed);
        assert!(result.passed, "Self-test failed for {} {}", result.alg, result.operation);
    }
}
