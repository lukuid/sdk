// SPDX-License-Identifier: Apache-2.0
//! `capture`: the device makes one signed record now, stores it, and returns it. A host
//! challenge token becomes the record's signed nonce, which proves the record was made
//! after the token was issued.
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use ring::rand::{SecureRandom, SystemRandom};
use serde_json::Value;

use crate::luku::LukuFile;

/// How long the Animal Reader waits for a tag after `capture`.
pub const CAPTURE_WINDOW_SECS: u64 = 60;

#[derive(Debug, Clone)]
pub struct CaptureResult {
    /// The stored record's ID (as `get` would return it).
    pub id: String,
    /// `scan` or `environment`.
    pub record_type: String,
    /// The signed record exactly as stored on the device.
    pub record: Value,
    /// The record's signed nonce ("" when none).
    pub nonce: String,
}

/// A token is 16–31 characters from `A–Z a–z 0–9 - _ . ~ + / =` (it must never hold `:`).
pub fn is_valid_challenge_token(token: &str) -> bool {
    (16..=31).contains(&token.len())
        && token.bytes().all(|c| c.is_ascii_alphanumeric() || b"-_.~+/=".contains(&c))
}

/// A fresh random 24-character URL-safe token (144 bits).
pub fn create_challenge_token() -> Result<String, String> {
    let mut bytes = [0u8; 18];
    SystemRandom::new().fill(&mut bytes).map_err(|_| "system random source unavailable".to_string())?;
    Ok(BASE64.encode(bytes).replace('+', "-").replace('/', "_"))
}

/// Checks a `capture` reply before it is handed to the app: the record's canonical
/// string must recompute from its own fields, its Ed25519 signature must verify with
/// the device key, and, when a token was sent, its signed nonce must equal the token.
/// Errors carry a code prefix (`RECORD_CANONICAL_MISMATCH`, `RECORD_SIGNATURE_INVALID`,
/// `NONCE_MISMATCH`, `CAPTURE_INVALID_REPLY`). Certificate chains are verified when the
/// record is exported or checked as evidence.
pub fn verify_capture_reply(reply: &Value, device_id: &str, public_key: &str, token: Option<&str>) -> Result<CaptureResult, String> {
    let full = reply
        .get("records")
        .and_then(|r| r.get(0))
        .or_else(|| reply.get("full_record_response"))
        .ok_or("CAPTURE_INVALID_REPLY: the device reply holds no record")?;
    let (record_type, record) = match (full.get("scan_full"), full.get("environment_full")) {
        (Some(r), _) if r.is_object() => ("scan", r),
        (_, Some(r)) if r.is_object() => ("environment", r),
        _ => return Err("CAPTURE_INVALID_REPLY: the device reply holds no record".into()),
    };
    let mut typed = record.clone();
    typed["type"] = Value::String(record_type.to_string());
    let canonical = record.get("canonical_string").and_then(Value::as_str).unwrap_or("");
    let recomputed = LukuFile::recompute_canonical_string(&typed, device_id, public_key);
    if canonical.is_empty() || recomputed.as_deref() != Some(canonical) {
        return Err("RECORD_CANONICAL_MISMATCH: the captured record does not match its signed canonical string".into());
    }
    let key = BASE64.decode(public_key.trim()).unwrap_or_default();
    let signature = record.get("signature").and_then(Value::as_str).unwrap_or("");
    if key.len() != 32 || !crate::attestation::verify_payload_signature_with_public_key(&key, signature, canonical.as_bytes()).ok {
        return Err("RECORD_SIGNATURE_INVALID: the captured record signature does not verify with the device key".into());
    }
    let nonce = record.pointer("/payload/nonce").and_then(Value::as_str).unwrap_or("").to_string();
    if let Some(token) = token {
        if nonce != token {
            return Err("NONCE_MISMATCH: the captured record does not carry the challenge token".into());
        }
    }
    let id = record
        .get("id")
        .or_else(|| full.get("id"))
        .and_then(Value::as_str)
        .unwrap_or("")
        .to_string();
    Ok(CaptureResult { id, record_type: record_type.to_string(), record: record.clone(), nonce })
}
