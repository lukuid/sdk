// SPDX-License-Identifier: Apache-2.0
use crate::attestation::{validate_certificate_chain, verify_signature_robust};
use crate::LukuidSdkOptions;
use base64::{engine::general_purpose::STANDARD, Engine};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashSet;
use std::fs;
use std::path::PathBuf;
use std::sync::{atomic::{AtomicBool, Ordering}, Arc, RwLock};
use std::time::Duration;
use x509_parser::prelude::*;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct SignedSnapshot {
    payload: String,
    signature: String,
    certificate_chain: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct CrlCache {
    checked_at: String,
    snapshot: SignedSnapshot,
}

#[derive(Debug)]
pub struct RevocationManager {
    options: LukuidSdkOptions,
    revoked_fingerprints: Arc<RwLock<HashSet<String>>>,
    last_sync: Arc<RwLock<Option<DateTime<Utc>>>>,
    verified: Arc<AtomicBool>,
    stop_tx: Option<tokio::sync::oneshot::Sender<()>>,
}

impl RevocationManager {
    pub fn new(options: LukuidSdkOptions) -> Self {
        let mut manager = Self {
            options,
            revoked_fingerprints: Arc::new(RwLock::new(HashSet::new())),
            last_sync: Arc::new(RwLock::new(None)),
            verified: Arc::new(AtomicBool::new(false)),
            stop_tx: None,
        };
        manager.load_from_cache();
        manager.start_auto_refresh();
        manager
    }

    fn get_cache_file(&self) -> Option<PathBuf> {
        if self.options.crl_memory_only { return None; }
        let dir = self.options.crl_cache_path.as_ref().map(PathBuf::from)
            .or_else(|| dirs::home_dir().map(|home| home.join(".lukuid")))?;
        if fs::create_dir_all(&dir).is_err() { return None; }
        Some(dir.join("lukuid_crl.json"))
    }

    fn validate_snapshot(snapshot: &SignedSnapshot, trust_profile: &str) -> Result<HashSet<String>, Box<dyn std::error::Error>> {
        let payload = STANDARD.decode(&snapshot.payload)?;
        let signature = STANDARD.decode(&snapshot.signature)?;
        let data: serde_json::Value = serde_json::from_slice(&payload)?;
        if data["version"] != 1 { return Err("Invalid CRL version".into()); }
        let generated = DateTime::parse_from_rfc3339(data["generated_at"].as_str().ok_or("Missing CRL timestamp")?)?;
        if generated.timestamp() > Utc::now().timestamp() + 300 || generated.timestamp() < Utc::now().timestamp() - 86400 { return Err("Stale or future CRL timestamp".into()); }
        let chain = validate_certificate_chain(&snapshot.certificate_chain, Some(generated.timestamp()), trust_profile, None);
        if !chain.ok { return Err(format!("CRL signing chain rejected: {:?}", chain.reason).into()); }
        let leaf_pem = x509_parser::pem::Pem::iter_from_buffer(snapshot.certificate_chain.as_bytes())
            .next().ok_or("Missing CRL signing certificate")??;
        let leaf = leaf_pem.parse_x509()?;
        if !verify_signature_robust(&signature, &payload, &leaf.public_key().subject_public_key.data) {
            return Err("CRL signature rejected".into());
        }
        let entries = data["revoked_fingerprints"].as_array().ok_or("Missing CRL fingerprints")?;
        let mut fingerprints = HashSet::new();
        for item in entries {
            let value = item.as_str().ok_or("Invalid CRL fingerprint")?;
            if value.len() != 64 || !value.bytes().all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b)) {
                return Err("Invalid CRL fingerprint".into());
            }
            fingerprints.insert(value.to_owned());
        }
        Ok(fingerprints)
    }

    fn load_from_cache(&mut self) {
        if let Some(path) = self.get_cache_file() {
            if let Ok(content) = fs::read_to_string(path) {
                if let Ok(cache) = serde_json::from_str::<CrlCache>(&content) {
                    match Self::validate_snapshot(&cache.snapshot, &self.options.trust_profile) {
                        Ok(fingerprints) => {
                            *self.revoked_fingerprints.write().unwrap() = fingerprints;
                            *self.last_sync.write().unwrap() = DateTime::parse_from_rfc3339(&cache.checked_at).ok()
                                .map(|time| time.with_timezone(&Utc))
                                .filter(|time| time.timestamp() <= Utc::now().timestamp() + 300);
                            self.verified.store(true, Ordering::Release);
                        }
                        Err(error) => eprintln!("[RevocationManager] Rejected cached CRL: {error}"),
                    }
                }
            }
        }
    }

    fn start_auto_refresh(&mut self) {
        if self.options.crl_refresh_interval_hours == 0 || self.options.disable_external_calls { return; }
        let Ok(handle) = tokio::runtime::Handle::try_current() else { return; };
        let (tx, mut rx) = tokio::sync::oneshot::channel();
        self.stop_tx = Some(tx);
        let options = self.options.clone();
        let fingerprints = Arc::clone(&self.revoked_fingerprints);
        let last_sync = Arc::clone(&self.last_sync);
        let verified = Arc::clone(&self.verified);
        let cache_file = self.get_cache_file();
        handle.spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(options.crl_refresh_interval_hours as u64 * 3600));
            loop {
                tokio::select! {
                    _ = interval.tick() => {
                        if let Err(error) = Self::sync_internal(&options, &fingerprints, &last_sync, &verified, &cache_file).await {
                            eprintln!("[RevocationManager] CRL sync failed: {error}");
                        }
                    }
                    _ = &mut rx => break,
                }
            }
        });
    }

    pub async fn sync(&self) -> Result<(), Box<dyn std::error::Error>> {
        Self::sync_internal(&self.options, &self.revoked_fingerprints, &self.last_sync, &self.verified, &self.get_cache_file()).await
    }

    async fn sync_internal(
        options: &LukuidSdkOptions,
        fingerprints: &Arc<RwLock<HashSet<String>>>,
        last_sync: &Arc<RwLock<Option<DateTime<Utc>>>>,
        verified: &Arc<AtomicBool>,
        cache_file: &Option<PathBuf>,
    ) -> Result<(), Box<dyn std::error::Error>> {
        if options.disable_external_calls { return Ok(()); }
        if options.crl_refresh_interval_hours > 0 {
            if let Some(last) = *last_sync.read().unwrap() {
                if Utc::now().signed_duration_since(last).num_seconds() < options.crl_refresh_interval_hours as i64 * 3600 { return Ok(()); }
            }
        }
        let url = format!("{}/crl", options.api_url.trim_end_matches('/'));
        let snapshot: SignedSnapshot = reqwest::get(url).await?.error_for_status()?.json().await?;
        let next = Self::validate_snapshot(&snapshot, &options.trust_profile)?;
        let now = Utc::now();
        *fingerprints.write().unwrap() = next;
        *last_sync.write().unwrap() = Some(now);
        verified.store(true, Ordering::Release);
        if let Some(path) = cache_file {
            let cache = CrlCache { checked_at: now.to_rfc3339(), snapshot };
            fs::write(path, serde_json::to_vec(&cache)?)?;
        }
        Ok(())
    }

    pub fn is_revoked(&self, cert: &X509Certificate) -> bool {
        self.revoked_fingerprints.read().unwrap().contains(&self.get_fingerprint(cert))
    }

    pub fn has_verified_snapshot(&self) -> bool {
        self.verified.load(Ordering::Acquire) && self.last_sync.read().unwrap().as_ref()
            .is_some_and(|time| Utc::now().signed_duration_since(*time).num_seconds() <= 86400)
    }

    pub fn get_fingerprint(&self, cert: &X509Certificate) -> String {
        let mut hasher = Sha256::new();
        hasher.update(&cert.public_key().subject_public_key.data);
        hex::encode(hasher.finalize())
    }
}

impl Drop for RevocationManager {
    fn drop(&mut self) {
        if let Some(tx) = self.stop_tx.take() { let _ = tx.send(()); }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Same root certificate embedded in attestation.rs's TRUSTED_ROOT_CERTS_PEM,
    // duplicated here so this test does not depend on that module's internals.
    const TEST_CERT_PEM: &str = r#"-----BEGIN CERTIFICATE-----
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
DxQWGRk=
-----END CERTIFICATE-----"#;

    fn test_options() -> LukuidSdkOptions {
        LukuidSdkOptions {
            crl_memory_only: true,
            disable_external_calls: true,
            crl_refresh_interval_hours: 0,
            ..Default::default()
        }
    }

    /// Regression test for the bug where the Rust SDK hashed the full SPKI DER
    /// bytes instead of the raw public key bytes (the BIT STRING content minus
    /// the leading "unused bits" byte). The expected digest below was computed
    /// independently with `openssl`/Python against this certificate's public
    /// key, not via any code in this crate.
    #[test]
    fn fingerprint_hashes_raw_public_key_bytes_not_full_spki() {
        let pem = x509_parser::pem::Pem::iter_from_buffer(TEST_CERT_PEM.as_bytes())
            .next()
            .expect("valid PEM block")
            .expect("parseable PEM");
        let cert = pem.parse_x509().expect("valid X.509 certificate");

        let manager = RevocationManager::new(test_options());
        let fingerprint = manager.get_fingerprint(&cert);

        assert_eq!(
            fingerprint,
            "a8bdda4addc146ec678cf034c3f9355214233fad01b5ec1b17fe839f77a85426"
        );

        // Sanity check that this is NOT simply a hash of the whole SPKI DER
        // (algorithm identifier + BIT STRING header + raw key), which was the
        // original bug.
        let mut spki_hasher = Sha256::new();
        spki_hasher.update(pem.contents.as_slice());
        let spki_hash = hex::encode(spki_hasher.finalize());
        assert_ne!(fingerprint, spki_hash);
    }

    #[test]
    fn validate_snapshot_fails_closed_on_malformed_certificate_chain() {
        let snapshot = SignedSnapshot {
            payload: STANDARD.encode(
                serde_json::json!({
                    "version": 1,
                    "generated_at": Utc::now().to_rfc3339(),
                    "revoked_fingerprints": Vec::<String>::new(),
                })
                .to_string(),
            ),
            signature: STANDARD.encode(vec![0u8; 64]),
            certificate_chain: "not a certificate".to_string(),
        };

        let result = RevocationManager::validate_snapshot(&snapshot, "dev");
        assert!(result.is_err());
    }

    #[test]
    fn validate_snapshot_fails_closed_on_bad_signature() {
        let payload = serde_json::json!({
            "version": 1,
            "generated_at": Utc::now().to_rfc3339(),
            "revoked_fingerprints": Vec::<String>::new(),
        })
        .to_string();

        let snapshot = SignedSnapshot {
            payload: STANDARD.encode(payload),
            signature: STANDARD.encode(vec![0u8; 64]),
            certificate_chain: TEST_CERT_PEM.to_string(),
        };

        // The signature is all zero bytes and will not verify against the
        // embedded certificate's real public key, so this must be rejected
        // rather than silently treated as an empty (trusted) revocation set.
        let result = RevocationManager::validate_snapshot(&snapshot, "dev");
        assert!(result.is_err());
    }

    #[test]
    fn fresh_manager_has_no_verified_snapshot_by_default() {
        let manager = RevocationManager::new(test_options());
        assert!(!manager.has_verified_snapshot());
    }
}
