use lukuid_sdk::{LukuFile, LukuVerifyOptions};
use serde_json::Value;
use std::fs;
use std::path::PathBuf;

fn resolve_sample() -> PathBuf {
    let mut current = std::env::current_dir().unwrap();
    loop {
        let candidate = current
            .join("samples")
            .join("envelopes")
            .join("dev")
            .join("1.0.0")
            .join("valid_envelope.json");
        if candidate.exists() {
            return candidate;
        }
        if !current.pop() {
            break;
        }
    }
    PathBuf::from("../../../samples/envelopes/dev/1.0.0/valid_envelope.json")
}

fn get_valid_envelope() -> Value {
    let path = resolve_sample();
    let content = fs::read_to_string(&path).expect("Failed to read valid_envelope.json");
    serde_json::from_str(&content).expect("Failed to parse valid_envelope.json")
}

fn verify(envelope: &Value) -> Vec<lukuid_sdk::VerificationIssue> {
    let mut options = LukuVerifyOptions::default();
    options.allow_untrusted_roots = false;
    options.skip_certificate_temporal_checks = true;
    options.trust_profile = "dev".to_string();
    LukuFile::verify_envelope(envelope, options)
}

#[test]
fn test_missing_detached_dac_signature_fails() {
    let mut envelope = get_valid_envelope();
    if let Some(object) = envelope.as_object_mut() {
        object.remove("attestation_signature");
    }
    if let Some(identity) = envelope.get_mut("identity").and_then(|v| v.as_object_mut()) {
        identity.remove("signature");
    }

    let issues = verify(&envelope);
    assert!(
        issues.iter().any(|issue| issue.code == "ATTESTATION_FAILED" && issue.message.contains("attestationSig missing")),
        "Expected attestationSig missing failure, got: {:?}",
        issues
    );
}

#[test]
fn test_heartbeat_signature_requires_trusted_heartbeat_timestamp() {
    let mut envelope = get_valid_envelope();
    let signature = envelope["identity"]["signature"].as_str().unwrap().to_string();
    envelope["heartbeat_signature"] = Value::String(signature);
    if let Some(identity) = envelope.get_mut("identity").and_then(|v| v.as_object_mut()) {
        identity.remove("last_sync_utc");
    }
    if let Some(object) = envelope.as_object_mut() {
        object.remove("last_sync_utc");
    }

    let issues = verify(&envelope);
    assert!(
        issues.iter().any(|i| i.code == "ATTESTATION_FAILED" && i.message.contains("Missing trusted heartbeat timestamp")),
        "Expected missing trusted heartbeat timestamp failure, got: {:?}",
        issues
    );
}

#[test]
fn test_heartbeat_signature_must_match_heartbeat_payload() {
    let mut envelope = get_valid_envelope();
    let signature = envelope["identity"]["signature"].as_str().unwrap().to_string();
    envelope["heartbeat_signature"] = Value::String(signature);
    if let Some(identity) = envelope.get_mut("identity").and_then(|v| v.as_object_mut()) {
        identity.insert("last_sync_utc".to_string(), Value::from(1777286310_i64));
    }

    let issues = verify(&envelope);
    assert!(
        issues.iter().any(|i| i.code == "ATTESTATION_FAILED" && i.message.contains("SLAC (heartbeat)")),
        "Expected heartbeat signature verification failure, got: {:?}",
        issues
    );
}

#[test]
fn test_last_sync_cannot_be_after_record_timestamp() {
    let mut envelope = get_valid_envelope();
    let signature = envelope["identity"]["signature"].as_str().unwrap().to_string();
    envelope["heartbeat_signature"] = Value::String(signature);
    if let Some(identity) = envelope.get_mut("identity").and_then(|v| v.as_object_mut()) {
        identity.insert("last_sync_utc".to_string(), Value::from(1777286312_i64));
    }

    let issues = verify(&envelope);
    assert!(
        issues.iter().any(|i| i.code == "LAST_SYNC_AFTER_RECORD"),
        "Expected LAST_SYNC_AFTER_RECORD, got: {:?}",
        issues
    );
}
