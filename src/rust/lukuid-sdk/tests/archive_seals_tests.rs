// SPDX-License-Identifier: Apache-2.0
use lukuid_sdk::luku::{LukuExportOptions, LukuFile, LukuVerifyOptions};
use std::collections::HashMap;

#[test]
fn self_seal_survives_export_and_detects_corruption() {
    let path = std::env::temp_dir().join(format!("lukuid-seal-{}.luku", uuid::Uuid::new_v4()));
    let signer = ed25519_dalek::SigningKey::from_bytes(&[7u8; 32]);
    LukuFile::export_blocks_with_manifest(
        &path, vec![], HashMap::new(), "Seal test".into(), HashMap::new(),
        &signer, LukuExportOptions::default(),
    ).expect("export must create a self seal");
    let mut archive = LukuFile::open(&path).expect("open exported archive");
    std::fs::remove_file(&path).expect("remove temporary archive");
    let issues = archive.verify(LukuVerifyOptions::default());
    assert!(!issues.iter().any(|issue| issue.code.starts_with("ARCHIVE_")), "{issues:?}");

    archive.seals_raw = Some("{}".into());
    let issues = archive.verify(LukuVerifyOptions::default());
    assert!(issues.iter().any(|issue| issue.code == "ARCHIVE_SEALS_MALFORMED"));
    assert!(archive.save_to(&path).is_err());
}

#[test]
fn shared_self_only_fixture_verifies() {
    let path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../../samples/dotluku/sealed-self-only.luku");
    let archive = LukuFile::open(path).expect("open shared self seal fixture");
    let issues = archive.verify(LukuVerifyOptions::default());
    assert!(!issues.iter().any(|issue| issue.code.starts_with("ARCHIVE_")), "{issues:?}");
}

#[test]
fn unsupported_platform_is_reported_and_invalid_android_seal_fails() {
    let path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../../samples/dotluku/sealed-self-only.luku");
    let mut archive = LukuFile::open(path).unwrap();
    let mut root: serde_json::Value = serde_json::from_str(archive.seals_raw.as_deref().unwrap()).unwrap();
    let timestamp = root["seals"][0]["created_at_utc"].clone();
    root["seals"].as_array_mut().unwrap().push(serde_json::json!({
        "type": "platform", "platform": "future-platform", "alg": "ES256",
        "created_at_utc": timestamp, "public_key": "AA==", "signature": "AA=="
    }));
    archive.seals_raw = Some(root.to_string());
    assert!(archive.verify(LukuVerifyOptions::default()).iter().any(|issue| issue.code == "ARCHIVE_PLATFORM_SEAL_UNSUPPORTED"));
    let mut no_self = root.clone();
    no_self["seals"] = serde_json::json!([root["seals"][1].clone()]);
    archive.seals_raw = Some(no_self.to_string());
    assert!(archive.verify(LukuVerifyOptions::default()).iter().any(|issue| issue.code == "ARCHIVE_SELF_SEAL_MISSING"));
    root["seals"][1]["platform"] = "android".into();
    archive.seals_raw = Some(root.to_string());
    assert!(archive.verify(LukuVerifyOptions::default()).iter().any(|issue| issue.code == "ARCHIVE_PLATFORM_SEAL_INVALID"));
}
