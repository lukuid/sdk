// SPDX-License-Identifier: Apache-2.0
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use ml_dsa::signature::{Keypair, Signer, Verifier};
use ml_dsa::{Generate, MlDsa65, SigningKey};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};

use crate::luku::{Criticality, VerificationIssue};

trait PlatformSealProvider {
    fn available(&self) -> bool;
    fn create_seal(&self, canonical_payload: &[u8], created_at_utc: i64) -> Result<Value, String>;
}

// No desktop OS currently supplies a bundled, independently verifiable hardware attestation
// path in this SDK. Native providers are registered here only after their offline verifier exists.
fn platform_providers() -> Vec<Box<dyn PlatformSealProvider>> { Vec::new() }

fn issue(code: &str, message: &str, criticality: Criticality) -> VerificationIssue {
    VerificationIssue { code: code.into(), message: message.into(), criticality }
}

fn manifest_hash(manifest: &[u8]) -> String {
    hex::encode(Sha256::digest(manifest))
}

fn payload(hash: &str, timestamp: i64) -> Vec<u8> {
    format!("LUKUID-ARCHIVE-SEAL-V1\nmanifest_hash_alg=SHA-256\nmanifest_hash={hash}\ncreated_at_utc={timestamp}").into_bytes()
}

pub(crate) fn create(manifest: &[u8], timestamp: i64) -> Result<String, String> {
    create_with_providers(manifest, timestamp, platform_providers())
}

fn create_with_providers(manifest: &[u8], timestamp: i64, providers: Vec<Box<dyn PlatformSealProvider>>) -> Result<String, String> {
    if timestamp < 0 { return Err("Archive seal timestamp is negative".into()); }
    let hash = manifest_hash(manifest);
    let key = SigningKey::<MlDsa65>::generate();
    let signature = key.sign(&payload(&hash, timestamp));
    let canonical_payload = payload(&hash, timestamp);
    let mut seals = vec![json!({
        "type": "self",
        "alg": "ML-DSA-65",
        "created_at_utc": timestamp,
        "public_key": BASE64.encode(key.verifying_key().encode()),
        "signature": BASE64.encode(signature.encode()),
    })];
    for provider in providers {
        if provider.available() {
            match provider.create_seal(&canonical_payload, timestamp) {
                Ok(seal) => seals.push(seal),
                Err(error) => log::warn!("Archive platform seal provider failed: {error}"),
            }
        }
    }
    serde_json::to_string_pretty(&json!({
        "version": 1,
        "manifest_hash": { "alg": "SHA-256", "value": hash },
        "seals": seals
    })).map_err(|error| error.to_string())
}

pub(crate) fn verify(seals_raw: Option<&str>, manifest: &[u8]) -> Vec<VerificationIssue> {
    let mut issues = Vec::new();
    let Some(raw) = seals_raw else {
        issues.push(issue("ARCHIVE_SEALS_MISSING", "The required seals.json file is missing.", Criticality::Critical));
        return issues;
    };
    let Ok(root): Result<Value, _> = serde_json::from_str(raw) else {
        issues.push(issue("ARCHIVE_SEALS_MALFORMED", "seals.json is not valid JSON.", Criticality::Critical));
        return issues;
    };
    let Some(seals) = root.get("seals").and_then(Value::as_array) else {
        issues.push(issue("ARCHIVE_SEALS_MALFORMED", "seals.json has no seals array.", Criticality::Critical));
        return issues;
    };
    if root.get("version").and_then(Value::as_u64) != Some(1)
        || root.pointer("/manifest_hash/alg").and_then(Value::as_str) != Some("SHA-256")
        || seals.is_empty() {
        issues.push(issue("ARCHIVE_SEALS_MALFORMED", "seals.json has invalid required fields.", Criticality::Critical));
        return issues;
    }
    let hash = manifest_hash(manifest);
    if root.pointer("/manifest_hash/value").and_then(Value::as_str) != Some(hash.as_str()) {
        issues.push(issue("ARCHIVE_SEALS_MANIFEST_HASH_MISMATCH", "seals.json does not commit to the exact manifest.json bytes.", Criticality::Critical));
        return issues;
    }
    let mut valid_self = false;
    let mut shared_timestamp = None;
    for seal in seals {
        let Some(kind) = seal.get("type").and_then(Value::as_str) else {
            issues.push(issue("ARCHIVE_SEALS_MALFORMED", "A seal has no type.", Criticality::Critical));
            continue;
        };
        let Some(timestamp) = seal.get("created_at_utc").and_then(Value::as_i64).filter(|time| *time >= 0) else {
            issues.push(issue("ARCHIVE_SEALS_MALFORMED", "A seal has an invalid timestamp.", Criticality::Critical));
            continue;
        };
        if shared_timestamp.is_some_and(|expected| expected != timestamp) {
            issues.push(issue("ARCHIVE_SEALS_MALFORMED", "Seals do not share one canonical payload timestamp.", Criticality::Critical));
            continue;
        }
        shared_timestamp = Some(timestamp);
        match kind {
            "self" => {
                if seal.get("alg").and_then(Value::as_str) != Some("ML-DSA-65") {
                    issues.push(issue("ARCHIVE_SEALS_MALFORMED", "A self seal has an invalid algorithm.", Criticality::Critical));
                    continue;
                }
                let key = seal.get("public_key").and_then(Value::as_str).and_then(|s| BASE64.decode(s).ok().filter(|bytes| BASE64.encode(bytes) == s));
                let sig = seal.get("signature").and_then(Value::as_str).and_then(|s| BASE64.decode(s).ok().filter(|bytes| BASE64.encode(bytes) == s));
                let valid = key.as_ref().zip(sig.as_ref()).is_some_and(|(key, sig)| {
                    let Ok(key): Result<&[u8; 1952], _> = key.as_slice().try_into() else { return false; };
                    let Ok(sig): Result<&[u8; 3309], _> = sig.as_slice().try_into() else { return false; };
                    let verifier = ml_dsa::VerifyingKey::<MlDsa65>::decode(key.into());
                    ml_dsa::Signature::<MlDsa65>::decode(sig.into())
                        .is_some_and(|signature| verifier.verify(&payload(&hash, timestamp), &signature).is_ok())
                });
                if valid { valid_self = true; }
                else { issues.push(issue("ARCHIVE_SELF_SEAL_INVALID", "A required ML-DSA-65 self seal failed cryptographic verification.", Criticality::Critical)); }
            }
            "platform" => {
                if ["platform", "alg", "public_key", "signature"].iter().any(|field| seal.get(*field).and_then(Value::as_str).is_none_or(str::is_empty)) {
                    issues.push(issue("ARCHIVE_SEALS_MALFORMED", "A platform seal has invalid required fields.", Criticality::Critical));
                } else if seal.get("platform").and_then(Value::as_str) == Some("android")
                    && seal.get("alg").and_then(Value::as_str) == Some("ES256") {
                    let manifest_digest: [u8; 32] = Sha256::digest(manifest).into();
                    if !crate::android_platform_seal::verify(seal, &manifest_digest, &payload(&hash, timestamp)) {
                        issues.push(issue("ARCHIVE_PLATFORM_SEAL_INVALID", "The Android hardware seal failed offline signature or attestation verification.", Criticality::Critical));
                    }
                } else {
                    issues.push(issue("ARCHIVE_PLATFORM_SEAL_UNSUPPORTED", "This SDK cannot independently validate this platform seal.", Criticality::Warning));
                }
            }
            "authority" => {
                if ["alg", "key_id", "root_fingerprint", "signature"].iter().any(|field| seal.get(*field).and_then(Value::as_str).is_none_or(str::is_empty))
                    || seal.get("certificate_chain").and_then(Value::as_array).is_none() {
                    issues.push(issue("ARCHIVE_SEALS_MALFORMED", "An authority seal has invalid required fields.", Criticality::Critical));
                } else {
                    issues.push(issue("ARCHIVE_AUTHORITY_SEAL_UNSUPPORTED", "Authority seals are reserved and are not trusted by this SDK.", Criticality::Warning));
                }
            }
            _ => issues.push(issue("ARCHIVE_SEALS_MALFORMED", "Unknown seal type.", Criticality::Critical)),
        }
    }
    if !valid_self {
        issues.push(issue("ARCHIVE_SELF_SEAL_MISSING", "The archive has no valid ML-DSA-65 self seal.", Criticality::Critical));
    }
    issues
}

#[cfg(test)]
mod tests {
    use super::*;

    struct FailingProvider;
    impl PlatformSealProvider for FailingProvider {
        fn available(&self) -> bool { true }
        fn create_seal(&self, _: &[u8], _: i64) -> Result<Value, String> { Err("hardware unavailable".into()) }
    }

    #[test]
    fn platform_failure_does_not_interrupt_self_seal_export() {
        let raw = create_with_providers(b"{}", 1, vec![Box::new(FailingProvider)]).unwrap();
        let envelope: Value = serde_json::from_str(&raw).unwrap();
        assert_eq!(envelope["seals"].as_array().unwrap().len(), 1);
        assert!(verify(Some(&raw), b"{}").is_empty());
    }
}
