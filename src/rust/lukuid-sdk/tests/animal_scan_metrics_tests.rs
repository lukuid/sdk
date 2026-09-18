use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use ed25519_dalek::{Signer, SigningKey};
use lukuid_sdk::{Criticality, LukuFile, LukuVerifyOptions};
use rand_core::OsRng;
use serde_json::{json, Value};

fn build_valid_scan_envelope(
    metrics: Option<Vec<f64>>,
    scan_version: &str,
    profile: &str,
) -> (Value, SigningKey) {
    let mut csprng = OsRng;
    let signing_key = SigningKey::generate(&mut csprng);
    let verifying_key = signing_key.verifying_key();
    let pub_b64 = BASE64.encode(verifying_key.as_bytes());
    let device_id = "LUKUID-ANIMAL-READER-001";

    let m_vec = metrics.unwrap_or_else(|| vec![
        38.5, 45.0, -65.0, 12.0, 5.0, 120.0, 2.0, 3300.0, 10.0, 11.0, 1.0, 2000.0, 50.0, 1.2, 1.0, 5.0, -2.0, 0.0
    ]);

    let formatted_metrics = m_vec
        .iter()
        .map(|x| format!("{:.2}", x))
        .collect::<Vec<_>>()
        .join(",");

    let content_str = format!("FDX-B:{}:981098109810981:38.50", scan_version);
    let canonical_str = format!(
        "{}:{}:scan:SCAN-REC-001:1001:1770823456:120000000:{}:test_challenge_nonce:AR-v1.0.0:{}:{}:",
        device_id, pub_b64, profile, content_str, formatted_metrics
    );

    let signature = signing_key.sign(canonical_str.as_bytes());
    let sig_b64 = BASE64.encode(signature.to_bytes());

    let envelope = json!({
        "type": "scan",
        "id": "SCAN-REC-001",
        "version": "1.0.0",
        "alg": "ED25519",
        "signature": sig_b64,
        "previous_signature": "",
        "canonical_string": canonical_str,
        "device": {
            "vendor": "LUKUID",
            "device_id": device_id,
            "public_key": pub_b64
        },
        "payload": {
            "ctr": 1001,
            "timestamp_utc": 1770823456,
            "uptime_us": 120000000,
            "nonce": "test_challenge_nonce",
            "firmware": "AR-v1.0.0",
            "profile": profile,
            "protocol": "FDX-B",
            "scan_version": scan_version,
            "tag_id": "981098109810981",
            "temperature_c": 38.5,
            "metrics": m_vec
        }
    });

    (envelope, signing_key)
}

#[test]
fn test_metrics_survive_verification_unchanged() {
    let (envelope, _) = build_valid_scan_envelope(None, "1.0.0", "animal");
    let mut options = LukuVerifyOptions::default();
    options.allow_untrusted_roots = true;
    options.trust_profile = "dev".to_string();

    let issues = LukuFile::verify_envelope(&envelope, options);
    let criticals: Vec<_> = issues.into_iter().filter(|i| i.criticality == Criticality::Critical).collect();
    assert!(criticals.is_empty(), "Expected 0 critical issues, got {:?}", criticals);
}

#[test]
fn test_single_metric_value_modification_fails_closed() {
    let (mut envelope, _) = build_valid_scan_envelope(None, "1.0.0", "animal");
    if let Some(metrics) = envelope.get_mut("payload").and_then(|p| p.get_mut("metrics")).and_then(|m| m.as_array_mut()) {
        metrics[2] = json!(-80.0);
    }
    let mut options = LukuVerifyOptions::default();
    options.allow_untrusted_roots = true;
    options.trust_profile = "dev".to_string();

    let issues = LukuFile::verify_envelope(&envelope, options);
    assert!(
        issues.iter().any(|i| i.code == "RECORD_CANONICAL_MISMATCH" && i.criticality == Criticality::Critical),
        "Tampered metric value must trigger RECORD_CANONICAL_MISMATCH"
    );
}

#[test]
fn test_metric_removal_reordering_truncation_appends_fail_closed() {
    let mut options = LukuVerifyOptions::default();
    options.allow_untrusted_roots = true;
    options.trust_profile = "dev".to_string();

    // Case A: Truncation
    let (mut env1, _) = build_valid_scan_envelope(None, "1.0.0", "animal");
    if let Some(metrics) = env1.get_mut("payload").and_then(|p| p.get_mut("metrics")).and_then(|m| m.as_array_mut()) {
        metrics.pop();
    }
    let issues1 = LukuFile::verify_envelope(&env1, options.clone());
    assert!(issues1.iter().any(|i| i.code == "RECORD_CANONICAL_MISMATCH"));

    // Case B: Append
    let (mut env2, _) = build_valid_scan_envelope(None, "1.0.0", "animal");
    if let Some(metrics) = env2.get_mut("payload").and_then(|p| p.get_mut("metrics")).and_then(|m| m.as_array_mut()) {
        metrics.push(json!(99.0));
    }
    let issues2 = LukuFile::verify_envelope(&env2, options.clone());
    assert!(issues2.iter().any(|i| i.code == "RECORD_CANONICAL_MISMATCH"));

    // Case C: Reordering
    let (mut env3, _) = build_valid_scan_envelope(None, "1.0.0", "animal");
    if let Some(metrics) = env3.get_mut("payload").and_then(|p| p.get_mut("metrics")).and_then(|m| m.as_array_mut()) {
        metrics.swap(0, 1);
    }
    let issues3 = LukuFile::verify_envelope(&env3, options.clone());
    assert!(issues3.iter().any(|i| i.code == "RECORD_CANONICAL_MISMATCH"));
}

#[test]
fn test_unknown_profile_or_schema_fails_closed() {
    let (envelope, _) = build_valid_scan_envelope(None, "1.0.0", "unknown_profile_v99");
    let mut options = LukuVerifyOptions::default();
    options.allow_untrusted_roots = true;
    options.trust_profile = "dev".to_string();

    let issues = LukuFile::verify_envelope(&envelope, options);
    assert!(
        issues.iter().any(|i| i.code == "RECORD_SCHEMA_UNRECOGNIZED" && i.criticality == Criticality::Critical),
        "Unrecognized scan profile must trigger RECORD_SCHEMA_UNRECOGNIZED"
    );
}
