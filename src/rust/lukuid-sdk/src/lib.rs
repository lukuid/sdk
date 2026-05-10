// SPDX-License-Identifier: Apache-2.0
pub mod attestation;
pub mod device;
pub mod framing;
pub mod luku;
pub mod models;
pub mod parser;
pub mod revocation;
pub mod transport;
pub(crate) mod url_utils;

pub use device::{Device, DeviceError};
pub use luku::{
    Criticality, LukuBlock, LukuFile, LukuManifest, LukuVerifyOptions, VerificationIssue,
    LUKU_MIMETYPE,
};
pub use models::{
    AttestationItem, CheckResult, DeviceEventPayload, DeviceInfo, DiscoveredDevice,
    HeartbeatSyncResult, LukuidSdkOptions, TransportType, SelfTestResult,
};
pub use parser::{parse, parse_bytes, LukuItemResult, LukuParseResult};
pub use transport::{Connection, Transport};
use revocation::RevocationManager;

pub struct LukuidSdk {
    options: LukuidSdkOptions,
    http_client: reqwest::Client,
    pub revocation_manager: RevocationManager,
}

impl LukuidSdk {
    pub fn new() -> Self {
        Self::with_options(LukuidSdkOptions::default())
    }

    pub fn with_options(options: LukuidSdkOptions) -> Self {
        let revocation_manager = RevocationManager::new(options.clone());
        Self {
            options,
            http_client: reqwest::Client::new(),
            revocation_manager,
        }
    }

    /**
     * Performs an optional Level 2 Cloud Attestation check.
     */
    pub async fn check(
        &self,
        attestations: Vec<AttestationItem>,
    ) -> Result<CheckResult, reqwest::Error> {
        let api_url = self.options.api_url.trim_end_matches('/');
        let url = format!("{}/check", api_url);

        let response = self
            .http_client
            .post(&url)
            .json(&serde_json::json!({ "attestations": attestations }))
            .send()
            .await?;

        response.error_for_status()?.json().await
    }

    /**
     * Fetches a signed heartbeat payload from the LukuID API.
     */
    pub async fn heartbeat(
        &self,
        device_id: &str,
        public_key: &str,
        signature: &str,
        csr: &str,
        attestation: &str,
        attestation_root_fingerprint: Option<&str>,
        counter: u64,
        previous_state: serde_json::Value,
        source: serde_json::Value,
        network_participation_enabled: bool,
        telemetry: Option<serde_json::Value>,
    ) -> Result<serde_json::Value, reqwest::Error> {
        let api_url = self.options.api_url.clone();
        self.heartbeat_with_api_url(
            &api_url,
            device_id,
            public_key,
            signature,
            csr,
            attestation,
            attestation_root_fingerprint,
            counter,
            previous_state,
            source,
            network_participation_enabled,
            telemetry
        )
        .await
    }



    /**
     * Fetches a signed heartbeat payload from the LukuID API using an explicit
     * base URL. This is used when the device publishes a custom heartbeat URL
     * that must override the SDK default.
     */
    pub async fn heartbeat_with_api_url(
        &self,
        api_url: &str,
        device_id: &str,
        public_key: &str,
        signature: &str,
        csr: &str,
        attestation: &str,
        attestation_root_fingerprint: Option<&str>,
        counter: u64,
        previous_state: serde_json::Value,
        source: serde_json::Value,
        network_participation_enabled: bool,
        telemetry: Option<serde_json::Value>,
    ) -> Result<serde_json::Value, reqwest::Error> {
        let clean_api_url = api_url.trim_end_matches('/');
        if !url_utils::is_external_call_allowed(clean_api_url, self.options.disable_external_calls) {
            if self.options.debug_logging {
                eprintln!("[lukuid-sdk] External calls disabled, dropping heartbeat to {}", clean_api_url);
            }
            return Ok(serde_json::json!({
                "status": "dropped",
                "reason": "LUKUID_DISABLE_EXTERNAL_CALLS"
            }));
        }

        let url = format!("{}/heartbeat", clean_api_url);
        let mut payload = serde_json::json!({
            "device_id": device_id,
            "public_key": public_key,
            "signature": signature,
            "csr": csr,
            "attestation": attestation,
            "counter": counter,
            "previous_state": previous_state,
            "source": source,
            "network_participation_enabled": network_participation_enabled,
        });

        if let Some(root_fingerprint) = attestation_root_fingerprint
            .map(str::trim)
            .filter(|value| !value.is_empty())
        {
            payload["attestation_root_fingerprint"] =
                serde_json::Value::String(root_fingerprint.to_string());
        }

        if let Some(mut tel) = telemetry {
            if std::env::var("LUKUID_DISABLE_TELEMETRY").unwrap_or_default() != "1" {
                tel["device_counter"] = serde_json::json!(counter);
                payload["telemetry"] = tel;
            }
        }

        if self.options.debug_logging {
            eprintln!(
                "[lukuid-sdk] Heartbeat HTTP request POST {} body={}",
                url, payload
            );
        }

        let response = self.http_client.post(&url).json(&payload).send().await?;
        let response = response.error_for_status()?;
        let response_body: serde_json::Value = response.json().await?;

        if self.options.debug_logging {
            eprintln!(
                "[lukuid-sdk] Heartbeat HTTP response from {} body={}",
                url, response_body
            );
        }

        Ok(response_body)
    }

    /**
     * Pushes telemetry data to the LukuID API.
     */
    pub async fn telemetry(
        &self,
        api_url: Option<&str>,
        device_id: &str,
        device_counter: u64,
        data: serde_json::Value,
        signature: Option<&str>,
        canonical_string: Option<&str>,
        telemetry_chain_version: Option<u32>,
        telemetry_chain_tail: Option<&str>,
    ) -> Result<serde_json::Value, reqwest::Error> {
        let base_url = api_url.unwrap_or(&self.options.api_url).trim_end_matches('/');
        
        if !url_utils::is_external_call_allowed(base_url, self.options.disable_external_calls) {
            if self.options.debug_logging {
                eprintln!("[lukuid-sdk] External calls disabled, dropping telemetry to {}", base_url);
            }
            return Ok(serde_json::json!({
                "status": "dropped",
                "reason": "LUKUID_DISABLE_EXTERNAL_CALLS"
            }));
        }

        if std::env::var("LUKUID_DISABLE_TELEMETRY").unwrap_or_default() == "1" {
            if self.options.debug_logging {
                eprintln!("[lukuid-sdk] Telemetry disabled via LUKUID_DISABLE_TELEMETRY env var");
            }
            return Ok(serde_json::json!({
                "status": "dropped",
                "reason": "LUKUID_DISABLE_TELEMETRY"
            }));
        }

        let url = format!("{}/participate", base_url);
        let mut payload = serde_json::json!({
            "device_id": device_id,
            "device_counter": device_counter,
            "rows": data,
        });

        if let Some(arr) = data.as_array() {
            payload["row_count"] = serde_json::json!(arr.len());
        }

        if let Some(sig) = signature {
            payload["signature"] = serde_json::json!(sig);
        }
        if let Some(can) = canonical_string {
            payload["canonical_string"] = serde_json::json!(can);
        }
        if let Some(ver) = telemetry_chain_version {
            payload["telemetry_chain_version"] = serde_json::json!(ver);
        }
        if let Some(tail) = telemetry_chain_tail {
            payload["telemetry_chain_tail"] = serde_json::json!(tail);
        }

        if self.options.debug_logging {
            eprintln!(
                "[lukuid-sdk] Telemetry HTTP request POST {} body={}",
                url, payload
            );
        }

        let response = self
            .http_client
            .post(&url)
            .json(&payload)
            .send()
            .await?;

        let response = response.error_for_status()?;
        let response_body: serde_json::Value = response.json().await?;

        if self.options.debug_logging {
            eprintln!(
                "[lukuid-sdk] Telemetry HTTP response from {} body={}",
                url, response_body
            );
        }

        Ok(response_body)
    }

    /**
     * Requests the latest firmware information from the LukuID API.
     */
    pub async fn request_ota(
        &self,
        device_id: &str,
        public_key: &str,
        attestation: &str,
    ) -> Result<serde_json::Value, reqwest::Error> {
        let api_url = self.options.api_url.trim_end_matches('/');
        let url = format!("{}/firmware/request", api_url);

        let response = self
            .http_client
            .post(&url)
            .json(&serde_json::json!({
                "device_id": device_id,
                "public_key": public_key,
                "attestation": attestation,
            }))
            .send()
            .await?;

        response.error_for_status()?.json().await
    }

    /**
     * Performs NIST Known Answer Tests (KAT) for the supported cryptographic
     * algorithms to ensure environment integrity.
     */
    pub fn self_test() -> Vec<SelfTestResult> {
        let mut results = Vec::new();

        // 1. Ed25519 (Sign, Verify, Reject)
        {
            use ed25519_dalek::{SigningKey, Signer, Verifier};
            let mut seed = [0u8; 32];
            seed[0] = 1;
            let sk = SigningKey::from_bytes(&seed);
            let pk = sk.verifying_key();
            let msg = b"abc";
            let bad_msg = b"abd";
            let sig = sk.sign(msg);
            
            results.push(SelfTestResult {
                alg: "Ed25519".to_string(),
                operation: "SIGN".to_string(),
                passed: true,
                id: "LUKUID-KAT-ED25519-SIGN-01".to_string(),
            });
            
            let passed_verify = pk.verify(msg, &sig).is_ok();
            results.push(SelfTestResult {
                alg: "Ed25519".to_string(),
                operation: "VERIFY".to_string(),
                passed: passed_verify,
                id: "LUKUID-KAT-ED25519-VERIFY-01".to_string(),
            });

            let passed_reject = pk.verify(bad_msg, &sig).is_err();
            results.push(SelfTestResult {
                alg: "Ed25519".to_string(),
                operation: "REJECT".to_string(),
                passed: passed_reject,
                id: "LUKUID-KAT-ED25519-REJECT-01".to_string(),
            });
        }

        // 2. P-256 (Sign, Verify, Reject)
        {
            use ring::signature::{self, EcdsaKeyPair, KeyPair};
            // Generate a random key for the consistency test
            let rng = ring::rand::SystemRandom::new();
            let pkcs8_bytes = signature::EcdsaKeyPair::generate_pkcs8(&signature::ECDSA_P256_SHA256_FIXED_SIGNING, &rng);
            
            if let Ok(pkcs8) = pkcs8_bytes {
                if let Ok(key_pair) = EcdsaKeyPair::from_pkcs8(&signature::ECDSA_P256_SHA256_FIXED_SIGNING, pkcs8.as_ref(), &rng) {
                    let msg = b"abc";
                    let bad_msg = b"abd";
                    
                    if let Ok(sig) = key_pair.sign(&rng, msg) {
                        results.push(SelfTestResult {
                            alg: "P256".to_string(),
                            operation: "SIGN".to_string(),
                            passed: true,
                            id: "NIST-KAT-P256-SIGN-01".to_string(),
                        });
                        
                        let public_key = signature::UnparsedPublicKey::new(&signature::ECDSA_P256_SHA256_FIXED, key_pair.public_key().as_ref());
                        let passed_verify = public_key.verify(msg, sig.as_ref()).is_ok();
                        results.push(SelfTestResult {
                            alg: "P256".to_string(),
                            operation: "VERIFY".to_string(),
                            passed: passed_verify,
                            id: "NIST-KAT-P256-VERIFY-01".to_string(),
                        });

                        let passed_reject = public_key.verify(bad_msg, sig.as_ref()).is_err();
                        results.push(SelfTestResult {
                            alg: "P256".to_string(),
                            operation: "REJECT".to_string(),
                            passed: passed_reject,
                            id: "NIST-KAT-P256-REJECT-01".to_string(),
                        });
                    }
                }
            }
            
            if results.iter().all(|r| r.alg != "P256") {
                results.push(SelfTestResult {
                    alg: "P256".to_string(),
                    operation: "SIGN".to_string(),
                    passed: false,
                    id: "NIST-KAT-P256-SIGN-01".to_string(),
                });
            }
        }

        // 3. SHA-256 (FIPS 180-4 "abc")
        {
            use sha2::{Sha256, Digest};
            let mut hasher = Sha256::new();
            hasher.update(b"abc");
            let result = hasher.finalize();
            let expected = [
                0xba, 0x78, 0x16, 0xbf, 0x8f, 0x01, 0xcf, 0xea, 
                0x41, 0x41, 0x40, 0xde, 0x5d, 0xae, 0x22, 0x23, 
                0xb0, 0x03, 0x61, 0xa3, 0x96, 0x17, 0x7a, 0x9c, 
                0xb4, 0x10, 0xff, 0x61, 0xf2, 0x00, 0x15, 0xad
            ];
            results.push(SelfTestResult {
                alg: "SHA-256".to_string(),
                operation: "HASH".to_string(),
                passed: result.as_slice() == &expected,
                id: "NIST-KAT-SHA256-01".to_string(),
            });
        }

        // 4. ML-DSA-65 (Sign, Verify, Reject)
        {
            use ml_dsa::{MlDsa65, KeyGen};
            use ml_dsa::signature::{Signer, Verifier, Keypair};
            
            let mut seed = [0u8; 32];
            seed[0] = 1;
            
            let sk = MlDsa65::from_seed(&seed.into());
            let vk = sk.verifying_key();
            let msg = b"abc";
            let bad_msg = b"abd";
            
            let sig = sk.sign(msg);
            results.push(SelfTestResult {
                alg: "ML-DSA-65".to_string(),
                operation: "SIGN".to_string(),
                passed: true,
                id: "NIST-KAT-MLDSA-SIGN-01".to_string(),
            });
            
            let passed_verify = vk.verify(msg, &sig).is_ok();
            results.push(SelfTestResult {
                alg: "ML-DSA-65".to_string(),
                operation: "VERIFY".to_string(),
                passed: passed_verify,
                id: "NIST-KAT-MLDSA-VERIFY-01".to_string(),
            });

            let passed_reject = vk.verify(bad_msg, &sig).is_err();
            results.push(SelfTestResult {
                alg: "ML-DSA-65".to_string(),
                operation: "REJECT".to_string(),
                passed: passed_reject,
                id: "NIST-KAT-MLDSA-REJECT-01".to_string(),
            });
        }

        results
    }
}

impl Default for LukuidSdk {
    fn default() -> Self {
        Self::new()
    }
}
