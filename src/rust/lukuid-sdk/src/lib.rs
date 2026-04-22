// SPDX-License-Identifier: Apache-2.0
pub mod attestation;
pub mod device;
pub mod framing;
pub mod luku;
pub mod models;
pub mod parser;
pub mod transport;

pub use device::{Device, DeviceError};
pub use luku::{
    Criticality, LukuBlock, LukuFile, LukuManifest, LukuVerifyOptions, VerificationIssue,
    LUKU_MIMETYPE,
};
pub use models::{
    AttestationItem, CheckResult, DeviceEventPayload, DeviceInfo, DiscoveredDevice,
    HeartbeatSyncResult, LukuidSdkOptions, TransportType,
};
pub use parser::{parse, parse_bytes, LukuItemResult, LukuParseResult};
pub use transport::{Connection, Transport};

pub struct LukuidSdk {
    options: LukuidSdkOptions,
    http_client: reqwest::Client,
}

impl LukuidSdk {
    pub fn new() -> Self {
        Self::with_options(LukuidSdkOptions::default())
    }

    pub fn with_options(options: LukuidSdkOptions) -> Self {
        Self {
            options,
            http_client: reqwest::Client::new(),
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
        telemetry: serde_json::Value,
    ) -> Result<serde_json::Value, reqwest::Error> {
        self.heartbeat_with_api_url(
            &self.options.api_url,
            device_id,
            public_key,
            signature,
            csr,
            attestation,
            attestation_root_fingerprint,
            counter,
            previous_state,
            source,
            telemetry,
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
        telemetry: serde_json::Value,
    ) -> Result<serde_json::Value, reqwest::Error> {
        let url = format!("{}/heartbeat", api_url.trim_end_matches('/'));
        let mut payload = serde_json::json!({
            "device_id": device_id,
            "public_key": public_key,
            "signature": signature,
            "csr": csr,
            "attestation": attestation,
            "counter": counter,
            "previous_state": previous_state,
            "source": source,
            "telemetry": telemetry,
        });
        if let Some(root_fingerprint) = attestation_root_fingerprint
            .map(str::trim)
            .filter(|value| !value.is_empty())
        {
            payload["attestation_root_fingerprint"] =
                serde_json::Value::String(root_fingerprint.to_string());
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
}

impl Default for LukuidSdk {
    fn default() -> Self {
        Self::new()
    }
}
