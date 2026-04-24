// SPDX-License-Identifier: Apache-2.0
use std::collections::HashMap;
use std::io::{Cursor, Write};

use ed25519_dalek::{Signer, SigningKey};
use rand_core::OsRng;
use serde_json::json;
use zip::write::FileOptions;
use zip::CompressionMethod;
use zip::ZipWriter;

use lukuid_sdk::luku::{LukuDeviceIdentity, LukuExportOptions, LukuFile, LukuVerifyOptions};

const EMPTY_SHA256: &str = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

fn build_archive_bytes(manifest: serde_json::Value, extra_entries: Vec<(&str, &[u8])>) -> Vec<u8> {
    let mut out = Cursor::new(Vec::new());
    let mut zip = ZipWriter::new(&mut out);
    let stored = FileOptions::<()>::default().compression_method(CompressionMethod::Stored);
    let deflated = FileOptions::<()>::default().compression_method(CompressionMethod::Deflated);

    zip.start_file("mimetype", stored).unwrap();
    zip.write_all(b"application/vnd.lukuid.package+zip").unwrap();
    zip.start_file("manifest.json", deflated).unwrap();
    zip.write_all(manifest.to_string().as_bytes()).unwrap();
    zip.start_file("blocks.jsonl", deflated).unwrap();
    zip.write_all(b"").unwrap();

    for (name, payload) in extra_entries {
        zip.start_file(name, deflated).unwrap();
        zip.write_all(payload).unwrap();
    }
    zip.finish().unwrap();
    out.into_inner()
}

async fn create_valid_export(device_id: &str) -> LukuFile {
    let mut csprng = OsRng;
    let signing_key = SigningKey::generate(&mut csprng);
    let public_key = base64::Engine::encode(
        &base64::engine::general_purpose::STANDARD,
        signing_key.verifying_key().to_bytes(),
    );

    let device = LukuDeviceIdentity {
        device_id: device_id.to_string(),
        public_key,
    };

    let record = json!({
        "type": "scan",
        "signature": base64::Engine::encode(
            &base64::engine::general_purpose::STANDARD,
            signing_key.sign(b"scan-can").to_bytes()
        ),
        "previous_signature": "genesis_fake",
        "canonical_string": "scan-can",
        "payload": {
            "ctr": 1,
            "timestamp_utc": 1,
            "genesis_hash": "genesis_fake"
        }
    });

    let path = std::env::temp_dir().join(format!("{}.luku", device_id));
    LukuFile::export_with_identity(
        vec![record],
        &path,
        device,
        HashMap::new(),
        &signing_key,
        LukuExportOptions::default(),
    )
    .unwrap();
    let data = std::fs::read(&path).unwrap();
    let _ = std::fs::remove_file(&path);
    LukuFile::open_bytes(&data).unwrap()
}

fn verify_options() -> LukuVerifyOptions {
    LukuVerifyOptions {
        allow_untrusted_roots: true,
        skip_certificate_temporal_checks: true,
        trust_profile: "dev".to_string(),
        ..Default::default()
    }
}

#[test]
fn rejects_unsafe_zip_entry_paths() {
    let manifest = json!({
        "type": "LukuArchive",
        "version": "1.0.0",
        "created_at_utc": 1,
        "description": "test",
        "blocks_hash": EMPTY_SHA256
    });
    let data = build_archive_bytes(manifest, vec![("attachments/../../evil", b"boom")]);
    let error = LukuFile::open_bytes(&data).unwrap_err();
    assert!(error.contains("unsafe ZIP entry path"));
}

#[test]
fn flags_unsupported_manifest_versions() {
    let manifest = json!({
        "type": "LukuArchive",
        "version": "9.9.9",
        "created_at_utc": 1,
        "description": "test",
        "blocks_hash": EMPTY_SHA256
    });
    let archive = LukuFile::open_bytes(&build_archive_bytes(manifest, vec![])).unwrap();
    let issues = archive.verify(verify_options());
    assert!(issues.iter().any(|issue| issue.code == "MANIFEST_VERSION_UNSUPPORTED"));
}

#[tokio::test]
async fn rejects_external_identity_on_unsupported_record_types() {
    let mut archive = create_valid_export("LUK-RS-HARDEN").await;
    archive.blocks[0].batch[0]
        .as_object_mut()
        .unwrap()
        .insert("external_identity".to_string(), json!({ "endorser_id": "ext-1" }));

    let issues = archive.verify(verify_options());
    assert!(issues
        .iter()
        .any(|issue| issue.code == "EXTERNAL_IDENTITY_UNSUPPORTED_RECORD_TYPE"));
}
