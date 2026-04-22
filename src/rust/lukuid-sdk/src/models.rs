// SPDX-License-Identifier: Apache-2.0
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TransportType {
    #[serde(rename = "ble")]
    Ble,
    #[serde(rename = "usb")]
    Usb,
    #[serde(rename = "serial")]
    Serial,
}

#[derive(Debug, Clone)]
pub struct LukuidSdkOptions {
    /**
     * If true, emit verbose discovery and validation diagnostics through the
     * standard Rust `log` facade at debug level. Default is `false`.
     */
    pub debug_logging: bool,
    /**
     * If true, devices that fail cryptographic attestation will still be exposed
     * but will have `verified = false`. Default is `false`.
     */
    pub allow_unverified_devices: bool,
    /**
     * Base URL for the LukuID API. Defaults to https://api.lukuid.com.
     */
    pub api_url: String,
    /**
     * If true, Device::connect(...) will immediately attempt the built-in
     * heartbeat/OTA lifecycle sync after verification. Default is `true`.
     */
    pub connect_lifecycle_sync: bool,
    /**
     * Global timeout for device commands in seconds. Default is 30.
     */
    pub command_timeout: u64,
    /**
     * Trust profile for evaluating device intermediate certificates.
     * Can be "prod", "test", or "dev". Default is "prod".
     */
    pub trust_profile: String,
}

impl Default for LukuidSdkOptions {
    fn default() -> Self {
        let trust_profile =
            std::env::var("LUKUID_TRUST_PROFILE").unwrap_or_else(|_| "prod".to_string());
        Self {
            debug_logging: false,
            allow_unverified_devices: false,
            api_url: "https://api.lukuid.com".to_string(),
            connect_lifecycle_sync: true,
            command_timeout: 30,
            trust_profile,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttestationItem {
    pub r#type: String,
    pub data: serde_json::Value,
    pub signature: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CheckResult {
    pub status: String,
    pub attestations: Vec<AttestationResult>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttestationResult {
    pub r#type: String,
    pub verified: bool,
    pub status: String,
    #[serde(flatten)]
    pub meta: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceInfo {
    #[serde(rename = "transportId")]
    pub transport_id: String,
    pub transport: TransportType,
    pub name: Option<String>,
    pub product: Option<String>,
    #[serde(default)]
    pub meta: HashMap<String, serde_json::Value>,
    pub id: String,
    pub key: String,
    #[serde(default)]
    pub capabilities: Vec<String>,
    pub firmware: Option<String>,
    pub model: Option<String>,
    pub signature: Option<String>,
    pub custom_heartbeat_url: Option<String>,
    pub attestation_dac_der: Option<String>,
    pub attestation_manufacturer_der: Option<String>,
    pub attestation_intermediate_der: Option<String>,
    pub attestation_root_fingerprint: Option<String>,
    pub heartbeat_slac_der: Option<String>,
    pub heartbeat_der: Option<String>,
    pub heartbeat_intermediate_der: Option<String>,
    pub heartbeat_root_fingerprint: Option<String>,
    pub verified: bool,
    #[serde(rename = "lastSync")]
    pub last_sync: Option<u64>,
    pub counter: u64,
    #[serde(rename = "syncRequired", default)]
    pub sync_required: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceEventPayload {
    pub key: String,
    pub data: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeartbeatSyncResult {
    pub api_url: String,
    pub generate_response: serde_json::Value,
    pub heartbeat_payload: serde_json::Value,
    pub apply_response: serde_json::Value,
}

#[derive(Debug, Clone)]
pub struct DiscoveredDevice {
    pub id: String,
    pub label: Option<String>,
    pub transport: TransportType,
}
