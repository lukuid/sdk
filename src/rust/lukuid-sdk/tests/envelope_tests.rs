use lukuid_sdk::{LukuFile, LukuVerifyOptions};
use serde_json::Value;
use std::fs;
use std::path::{Path, PathBuf};
use ed25519_dalek::{SigningKey, Signer};
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};

fn resolve_sample() -> PathBuf {
    let mut current = std::env::current_dir().unwrap();
    loop {
        let candidate = current.join("samples").join("envelopes").join("dev").join("1.0.0").join("valid_envelope.json");
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

#[test]
fn test_verify_envelope_valid() {
    let envelope = get_valid_envelope();
    let mut options = LukuVerifyOptions::default();
    options.allow_untrusted_roots = false;
    options.skip_certificate_temporal_checks = true;
    options.trust_profile = "dev".to_string();

    let issues = LukuFile::verify_envelope(&envelope, options);
    assert!(issues.is_empty(), "Expected no issues, got: {:?}", issues);
}

use rand_core::OsRng;

#[test]
fn test_verify_envelope_key_mismatch() {
    let mut envelope = get_valid_envelope();
    
    let mut csprng = OsRng;
    let signing_key = SigningKey::generate(&mut csprng);
    let verifying_key = signing_key.verifying_key();
    let new_pub_key_base64 = BASE64.encode(verifying_key.as_bytes());

    if let Some(device) = envelope.get_mut("device").and_then(|d| d.as_object_mut()) {
        device.insert("public_key".to_string(), Value::String(new_pub_key_base64));
    }

    let canonical = envelope["canonical_string"].as_str().unwrap();
    let signature = signing_key.sign(canonical.as_bytes());
    envelope["signature"] = Value::String(BASE64.encode(signature.to_bytes()));

    let mut options = LukuVerifyOptions::default();
    options.allow_untrusted_roots = false;
    options.skip_certificate_temporal_checks = true;
    options.trust_profile = "dev".to_string();

    let issues = LukuFile::verify_envelope(&envelope, options);
    assert!(issues.iter().any(|i| i.code == "ATTESTATION_FAILED"), "Expected ATTESTATION_FAILED");
}

#[test]
fn test_verify_envelope_invalid_signature() {
    let mut envelope = get_valid_envelope();
    envelope["signature"] = Value::String(BASE64.encode(vec![0u8; 64]));

    let mut options = LukuVerifyOptions::default();
    options.allow_untrusted_roots = false;
    options.skip_certificate_temporal_checks = true;
    options.trust_profile = "dev".to_string();

    let issues = LukuFile::verify_envelope(&envelope, options);
    assert!(issues.iter().any(|i| i.code == "RECORD_SIGNATURE_INVALID"), "Expected RECORD_SIGNATURE_INVALID");
}

#[test]
fn test_verify_envelope_missing_identity() {
    let mut envelope = get_valid_envelope();
    if let Some(obj) = envelope.as_object_mut() {
        obj.remove("device");
        obj.remove("device_id");
        obj.remove("public_key");
    }

    let mut options = LukuVerifyOptions::default();
    options.allow_untrusted_roots = false;
    options.skip_certificate_temporal_checks = true;
    options.trust_profile = "dev".to_string();

    let issues = LukuFile::verify_envelope(&envelope, options);
    assert!(issues.iter().any(|i| i.code == "DEVICE_IDENTITY_MISSING"), "Expected DEVICE_IDENTITY_MISSING");
}

#[test]
fn test_verify_envelope_invalid_dac() {
    let mut envelope = get_valid_envelope();
    envelope["attestation_intermediate_der"] = Value::String(BASE64.encode(b"bad_cert"));

    let mut options = LukuVerifyOptions::default();
    options.allow_untrusted_roots = false;
    options.skip_certificate_temporal_checks = true;
    options.trust_profile = "dev".to_string();

    let issues = LukuFile::verify_envelope(&envelope, options);
    assert!(issues.iter().any(|i| i.code == "ATTESTATION_FAILED"), "Expected ATTESTATION_FAILED");
}

#[test]
fn test_verify_envelope_invalid_canonical_string() {
    let mut envelope = get_valid_envelope();
    envelope["canonical_string"] = Value::String("tampered:canonical:string".to_string());

    let mut options = LukuVerifyOptions::default();
    options.allow_untrusted_roots = false;
    options.skip_certificate_temporal_checks = true;
    options.trust_profile = "dev".to_string();

    let issues = LukuFile::verify_envelope(&envelope, options);
    assert!(issues.iter().any(|i| i.code == "RECORD_SIGNATURE_INVALID"), "Expected RECORD_SIGNATURE_INVALID");
}
