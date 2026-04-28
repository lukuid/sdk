// SPDX-License-Identifier: Apache-2.0
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tokio::sync::{broadcast, mpsc, oneshot};
use tokio::time::{timeout, Duration};
use uuid::Uuid;

use crate::attestation::{verify_device_attestation, DeviceAttestationInputs};
use crate::framing::LukuDecoder;
use crate::models::{DeviceEventPayload, DeviceInfo, HeartbeatSyncResult, LukuidSdkOptions};
use crate::transport::Transport;
use crate::LukuidSdk;

#[derive(Debug, thiserror::Error)]
pub enum DeviceError {
    #[error("Transport error: {0}")]
    Transport(String),
    #[error("Protocol error: {0}")]
    Protocol(String),
    #[error("Verification error: {0}")]
    Verification(String),
    #[error("Device closed")]
    Closed,
    #[error("Command failed: {0}")]
    CommandFailed(String),
    #[error("Timeout")]
    Timeout,
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
}

pub const DEFAULT_COMMAND_TIMEOUT_SEC: u64 = 30;
pub const DEFAULT_RPC_TIMEOUT_SEC: u64 = 5;

type CommandCallback = oneshot::Sender<Result<Value, DeviceError>>;

struct PendingCommand {
    action: String,
    callback: CommandCallback,
    accumulated_data: Vec<Value>,
    accumulated_batches: Vec<Value>,
    accumulated_full_records: Vec<Value>,
}

fn value_as_u64_integral(value: &Value) -> Option<u64> {
    value.as_u64().or_else(|| {
        value.as_f64().and_then(|number| {
            if number.is_finite()
                && number >= 0.0
                && number.fract() == 0.0
                && number <= u64::MAX as f64
            {
                Some(number as u64)
            } else {
                None
            }
        })
    })
}

fn pem_from_der_value(value: Option<&Value>) -> Option<String> {
    let encoded = value.and_then(|v| v.as_str())?;
    let decoded = BASE64.decode(encoded.trim()).ok()?;

    if let Ok(text) = String::from_utf8(decoded.clone()) {
        if text.contains("-----BEGIN CERTIFICATE-----") {
            return Some(text);
        }
    }

    let b64 = BASE64.encode(decoded);
    let mut pem = String::from("-----BEGIN CERTIFICATE-----\n");
    for chunk in b64.as_bytes().chunks(64) {
        pem.push_str(std::str::from_utf8(chunk).ok()?);
        pem.push('\n');
    }
    pem.push_str("-----END CERTIFICATE-----\n");
    Some(pem)
}

fn assemble_certificate_chain(info_obj: &serde_json::Map<String, Value>) -> Option<String> {
    let mut chain = String::new();

    for key in [
        "attestation_dac_der",
        "attestation_manufacturer_der",
        "attestation_intermediate_der",
    ] {
        if let Some(pem) = pem_from_der_value(info_obj.get(key)) {
            chain.push_str(&pem);
        }
    }

    if chain.is_empty() {
        None
    } else {
        Some(chain)
    }
}

fn pem_from_der_string(value: Option<&str>) -> Option<String> {
    let encoded = value?.trim();
    if encoded.is_empty() {
        return None;
    }
    let decoded = BASE64.decode(encoded).ok()?;

    if let Ok(text) = String::from_utf8(decoded.clone()) {
        if text.contains("-----BEGIN CERTIFICATE-----") {
            return Some(text);
        }
    }

    let b64 = BASE64.encode(decoded);
    let mut pem = String::from("-----BEGIN CERTIFICATE-----\n");
    for chunk in b64.as_bytes().chunks(64) {
        pem.push_str(std::str::from_utf8(chunk).ok()?);
        pem.push('\n');
    }
    pem.push_str("-----END CERTIFICATE-----\n");
    Some(pem)
}

fn assemble_attestation_chain_from_info(info: &DeviceInfo) -> Option<String> {
    let mut chain = String::new();

    for value in [
        info.attestation_dac_der.as_deref(),
        info.attestation_manufacturer_der.as_deref(),
        info.attestation_intermediate_der.as_deref(),
    ] {
        if let Some(pem) = pem_from_der_string(value) {
            chain.push_str(&pem);
        }
    }

    if chain.is_empty() {
        None
    } else {
        Some(chain)
    }
}

fn required_string_field(value: &Value, field: &str) -> Result<String, DeviceError> {
    value
        .get(field)
        .and_then(|v| v.as_str())
        .filter(|v| !v.trim().is_empty())
        .map(|v| v.to_string())
        .ok_or_else(|| DeviceError::Protocol(format!("Heartbeat field '{}' is missing", field)))
}

fn required_i64_field(value: &Value, field: &str) -> Result<i64, DeviceError> {
    value
        .get(field)
        .and_then(|v| v.as_i64())
        .ok_or_else(|| DeviceError::Protocol(format!("Heartbeat field '{}' is missing", field)))
}

fn resolve_heartbeat_api_url(custom_heartbeat_url: Option<&str>, default_api_url: &str) -> String {
    custom_heartbeat_url
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .unwrap_or(default_api_url)
        .trim_end_matches('/')
        .to_string()
}

fn log_device_target(info: &DeviceInfo) -> &str {
    if info.id.is_empty() {
        &info.transport_id
    } else {
        &info.id
    }
}

pub struct Device {
    pub info: Arc<DeviceInfo>,
    debug_logging: bool,
    command_timeout: u64,
    cmd_tx: mpsc::Sender<(String, Value, CommandCallback)>,
    raw_tx: mpsc::Sender<(Vec<u8>, oneshot::Sender<Result<(), String>>)>,
    event_tx: broadcast::Sender<DeviceEventPayload>,
    close_tx: mpsc::Sender<()>,
    _event_rx: broadcast::Receiver<DeviceEventPayload>,
    cmd_mutex: tokio::sync::Mutex<()>,
}

impl Device {
    pub fn with_info(&self, info: Arc<DeviceInfo>) -> Self {
        Device {
            info,
            debug_logging: self.debug_logging,
            command_timeout: self.command_timeout,
            cmd_tx: self.cmd_tx.clone(),
            raw_tx: self.raw_tx.clone(),
            event_tx: self.event_tx.clone(),
            close_tx: self.close_tx.clone(),
            _event_rx: self.event_tx.subscribe(),
            cmd_mutex: tokio::sync::Mutex::new(()),
        }
    }

    pub async fn connect(
        transport: &dyn Transport,
        device_id: &str,
        options: LukuidSdkOptions,
    ) -> Result<Self, DeviceError> {
        if options.debug_logging {
            eprintln!(
                "[lukuid-sdk] Connecting to device {} over transport {}",
                device_id,
                transport.name()
            );
        }
        let (incoming_tx, mut incoming_rx) = mpsc::channel(100);

        let connection = transport
            .open(device_id, incoming_tx)
            .await
            .map_err(DeviceError::Transport)?;

        let connection = Arc::new(tokio::sync::Mutex::new(connection));

        let (cmd_tx, mut cmd_rx) = mpsc::channel::<(String, Value, CommandCallback)>(32);
        let (raw_tx, mut raw_rx) =
            mpsc::channel::<(Vec<u8>, oneshot::Sender<Result<(), String>>)>(32);
        let (close_tx, mut close_rx) = mpsc::channel(1);
        let (event_tx, event_rx) = broadcast::channel(100);

        let pending_cmds: Arc<Mutex<HashMap<String, PendingCommand>>> =
            Arc::new(Mutex::new(HashMap::new()));

        let conn_loop = connection.clone();
        let pending_cmds_loop = pending_cmds.clone();
        let event_tx_loop = event_tx.clone();
        let debug_logging = options.debug_logging;

        tokio::spawn(async move {
            let mut decoder = LukuDecoder::new();

            loop {
                tokio::select! {
                    Some(chunk) = incoming_rx.recv() => {
                        if debug_logging {
                            eprintln!(
                                "[lukuid-sdk] Received serial chunk ({} bytes): {:?}",
                                chunk.len(),
                                chunk
                            );
                        }
                        let frames = decoder.feed(&chunk);
                        for frame in frames {
                            process_frame(frame, &pending_cmds_loop, &event_tx_loop, debug_logging);
                        }
                    }

                    Some((key, opts, callback)) = cmd_rx.recv() => {
                        let id = Uuid::new_v4().to_string();
                        let frame = json!({
                            "action": key,
                            "id": id,
                            "opts": opts
                        });

                        let payload = LukuDecoder::encode(&frame);

                        if debug_logging {
                            eprintln!(
                                "[lukuid-sdk] Sending device command action={} id={} opts={} frame_bytes={:?}",
                                key,
                                id,
                                opts,
                                payload
                            );
                        }

                        {
                            let mut map = pending_cmds_loop.lock().unwrap();
                            map.insert(id.clone(), PendingCommand {
                                action: key,
                                callback,
                                accumulated_data: Vec::new(),
                                accumulated_batches: Vec::new(),
                                accumulated_full_records: Vec::new(),
                            });
                        }

                        let conn = conn_loop.lock().await;
                        if let Err(e) = conn.write(&payload).await {
                             let mut map = pending_cmds_loop.lock().unwrap();
                             if let Some(pending) = map.remove(&id) {
                                 let _ = pending.callback.send(Err(DeviceError::Transport(e)));
                             }
                        }
                    }

                    Some((payload, callback)) = raw_rx.recv() => {
                        let conn = conn_loop.lock().await;
                        let result = conn.write(&payload).await;
                        let _ = callback.send(result);
                    }

                    _ = close_rx.recv() => {
                        let conn = conn_loop.lock().await;
                        let _ = conn.close().await;
                        break;
                    }
                }
            }
        });

        let dev = Device {
            info: Arc::new(DeviceInfo {
                transport_id: device_id.to_string(),
                transport: transport.transport_type(),
                name: None,
                product: None,
                meta: HashMap::new(),
                id: "".to_string(),
                key: "".to_string(),
                capabilities: vec![],
                firmware: None,
                model: None,
                signature: None,
                custom_heartbeat_url: None,
                attestation_dac_der: None,
                attestation_manufacturer_der: None,
                attestation_intermediate_der: None,
                attestation_root_fingerprint: None,
                heartbeat_slac_der: None,
                heartbeat_der: None,
                heartbeat_intermediate_der: None,
                heartbeat_root_fingerprint: None,
                verified: false,
                telemetry: false,
                last_sync: None,
                counter: 0,
                sync_required: false,
            }),
            debug_logging: options.debug_logging,
            command_timeout: options.command_timeout,
            cmd_tx: cmd_tx.clone(),
            raw_tx: raw_tx.clone(),
            event_tx: event_tx.clone(),
            close_tx: close_tx.clone(),
            _event_rx: event_rx,
            cmd_mutex: tokio::sync::Mutex::new(()),
        };

        // Initial Handshake
        let status_val = dev
            .call("status", json!({}))
            .await
            .map_err(|e| DeviceError::CommandFailed(format!("STATUS failed: {}", e)))?;

        if options.debug_logging {
            eprintln!("[lukuid-sdk] STATUS handshake completed for {}", device_id);
        }

        let status_obj = status_val
            .as_object()
            .ok_or(DeviceError::Protocol("Invalid STATUS".to_string()))?;

        let id = status_obj
            .get("id")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        let sync_required = status_obj
            .get("needs_sync")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);

        let final_info = DeviceInfo {
            transport_id: device_id.to_string(),
            transport: transport.transport_type(),
            name: status_obj
                .get("name")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string()),
            product: status_obj
                .get("product")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string()),
            meta: HashMap::new(),
            id: id.clone(),
            key: "".to_string(),
            capabilities: vec![],
            firmware: None,
            model: status_obj
                .get("model")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string()),
            signature: None,
            custom_heartbeat_url: None,
            attestation_dac_der: None,
            attestation_manufacturer_der: None,
            attestation_intermediate_der: None,
            attestation_root_fingerprint: None,
            heartbeat_slac_der: None,
            heartbeat_der: None,
            heartbeat_intermediate_der: None,
            heartbeat_root_fingerprint: None,
            verified: false,
            telemetry: false,
            last_sync: None,
            counter: 0,
            sync_required,
        };

        let device = dev.with_info(Arc::new(final_info));

        if options.debug_logging {
            eprintln!(
                "[lukuid-sdk] Device {} connected via status",
                device.info.id
            );
        }

        Ok(device)
    }

    pub async fn verify(&self, options: LukuidSdkOptions) -> Result<Self, DeviceError> {
        let info_val = self
            .call("info", json!({}))
            .await
            .map_err(|e| DeviceError::CommandFailed(format!("INFO failed: {}", e)))?;

        if options.debug_logging {
            eprintln!("[lukuid-sdk] INFO handshake completed for {}", self.info.id);
        }

        let info_obj = info_val
            .as_object()
            .ok_or(DeviceError::Protocol("Invalid INFO".to_string()))?;

        let id = info_obj
            .get("id")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
        let key = info_obj
            .get("key")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
        let attestation_sig = info_obj
            .get("signature")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
        let certificate_chain = assemble_certificate_chain(info_obj);

        let inputs = DeviceAttestationInputs {
            id: id.clone(),
            key: key.clone(),
            attestation_sig,
            certificate_chain,
            created: None,
            attestation_alg: info_obj
                .get("attestationAlg")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string()),
            attestation_payload_version: info_obj
                .get("attestationPayloadVersion")
                .and_then(|v| v.as_u64())
                .map(|u| u as u32),
            trust_profile: options.trust_profile.clone(),
        };

        let verification = verify_device_attestation(&inputs);

        if options.debug_logging {
            eprintln!(
                "[lukuid-sdk] Device {} verification result: ok={} reason={:?}",
                id, verification.ok, verification.reason
            );
        }

        if !verification.ok && !options.allow_unverified_devices {
            return Err(DeviceError::Verification(
                verification
                    .reason
                    .unwrap_or_else(|| "Verification failed".to_string()),
            ));
        }

        let last_sync = info_obj
            .get("slac")
            .and_then(|v| v.get("valid_from"))
            .and_then(|v| v.as_u64());
        let counter = info_obj
            .get("counter")
            .and_then(value_as_u64_integral)
            .unwrap_or(0);
        let sync_required = info_obj
            .get("sync_required")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);

        let mut current_info = (*self.info).clone();
        current_info.key = key;
        current_info.firmware = info_obj
            .get("firmware")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        current_info.signature = info_obj
            .get("signature")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        current_info.custom_heartbeat_url = info_obj
            .get("custom_heartbeat_url")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        current_info.attestation_dac_der = info_obj
            .get("attestation_dac_der")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        current_info.attestation_manufacturer_der = info_obj
            .get("attestation_manufacturer_der")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        current_info.attestation_intermediate_der = info_obj
            .get("attestation_intermediate_der")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        current_info.attestation_root_fingerprint = info_obj
            .get("attestation_root_fingerprint")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        current_info.heartbeat_slac_der = info_obj
            .get("heartbeat_slac_der")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        current_info.heartbeat_der = info_obj
            .get("heartbeat_der")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        current_info.heartbeat_intermediate_der = info_obj
            .get("heartbeat_intermediate_der")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        current_info.heartbeat_root_fingerprint = info_obj
            .get("heartbeat_root_fingerprint")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        current_info.verified = verification.ok;
        current_info.last_sync = last_sync;
        current_info.counter = counter;
        current_info.sync_required = sync_required;

        let verified_device = self.with_info(Arc::new(current_info));

        if verified_device.info.verified && options.connect_lifecycle_sync {
            let sdk = LukuidSdk::with_options(options);
            let last_sync_val = verified_device.info.last_sync.unwrap_or(0);

            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs();
            if now - last_sync_val > 24 * 3600 || verified_device.info.sync_required {
                let _ = verified_device.sync_heartbeat(&sdk).await;
            }
        }

        Ok(verified_device)
    }

    pub async fn action(&self, key: &str, opts: Value) -> Result<(), DeviceError> {
        let (tx, _rx) = oneshot::channel();
        self.cmd_tx
            .send((key.to_string(), opts, tx))
            .await
            .map_err(|_| DeviceError::Closed)?;
        Ok(())
    }

    pub async fn sync_heartbeat(
        &self,
        sdk: &LukuidSdk,
    ) -> Result<HeartbeatSyncResult, DeviceError> {
        if sdk.options.debug_logging {
            eprintln!("[lukuid-sdk] Heartbeat sync starting for {}", self.info.id);
        }

        // 1. Fetch Telemetry if needed (either for public API or custom heartbeat)
        let mut telemetry = json!([]);
        let mut telemetry_signature = None;
        let mut telemetry_canonical_string = None;

        if self.info.telemetry || self.info.custom_heartbeat_url.is_some() {
            let telemetry_resp = self
                .call("fetch_telemetry", json!({}))
                .await
                .unwrap_or(json!({ "data": [] }));

            telemetry = telemetry_resp.get("data").cloned().unwrap_or(json!([]));
            telemetry_signature = telemetry_resp.get("signature").and_then(|v| v.as_str()).map(|s| s.to_string());
            telemetry_canonical_string = telemetry_resp.get("canonical_string").and_then(|v| v.as_str()).map(|s| s.to_string());

            if sdk.options.debug_logging {
                let telemetry_count = telemetry.as_array().map(|items| items.len()).unwrap_or(0);
                eprintln!(
                    "[lukuid-sdk] Heartbeat sync fetched telemetry for {} ({} entries)",
                    self.info.id, telemetry_count
                );
            }
        }

        // 2. Push Telemetry to public API if enabled
        if self.info.telemetry {
            let _ = sdk.telemetry(
                None, // Always default API
                &self.info.id,
                telemetry.clone(),
                telemetry_signature.as_deref(),
                telemetry_canonical_string.as_deref()
            ).await;
        }

        // 3. Generate Heartbeat CSR
        let generate_response =
            self.call("generate_heartbeat", json!({}))
                .await
                .map_err(|error| {
                    DeviceError::Protocol(format!("generate_heartbeat failed: {}", error))
                })?;

        if sdk.options.debug_logging {
            eprintln!(
                "[lukuid-sdk] Heartbeat sync received generate_heartbeat response for {} body={}",
                self.info.id, generate_response
            );
        }

        let signature = required_string_field(&generate_response, "signature")?;
        let csr = required_string_field(&generate_response, "csr")?;
        let attestation = assemble_attestation_chain_from_info(&self.info).unwrap_or_else(|| {
            generate_response
                .get("attestation")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string()
        });
        let counter = generate_response
            .get("counter")
            .and_then(value_as_u64_integral)
            .ok_or_else(|| {
                DeviceError::Protocol("Heartbeat field 'counter' is missing".to_string())
            })?;

        let previous_state = serde_json::json!({
            "last_sync_bucket": generate_response.get("last_sync_bucket"),
            "last_timestamp": generate_response.get("latest_timestamp"),
            "current_timestamp": generate_response.get("current_timestamp"),
            "last_intermediate_serial": generate_response.get("last_intermediate_serial"),
            "last_slac_serial": generate_response.get("last_slac_serial")
        });

        let source = serde_json::json!({
            "platform": std::env::consts::OS,
            "arch": std::env::consts::ARCH,
            "version": env!("CARGO_PKG_VERSION"),
            "integration": "native-sdk"
        });

        let has_custom_url = self.info.custom_heartbeat_url.is_some();
        let api_url = resolve_heartbeat_api_url(
            self.info.custom_heartbeat_url.as_deref(),
            &sdk.options.api_url,
        );

        if sdk.options.debug_logging {
            eprintln!(
                "[lukuid-sdk] Heartbeat sync generated request for {} and will call {}",
                self.info.id, api_url
            );
        }

        let heartbeat_payload = sdk
            .heartbeat_with_api_url(
                &api_url,
                &self.info.id,
                &self.info.key,
                &signature,
                &csr,
                &attestation,
                self.info.attestation_root_fingerprint.as_deref(),
                counter,
                previous_state,
                source,
                if has_custom_url { Some(telemetry) } else { None },
                if has_custom_url { telemetry_signature.as_deref() } else { None },
                if has_custom_url { telemetry_canonical_string.as_deref() } else { None },
            )
            .await
            .map_err(|error| {
                DeviceError::Protocol(format!("Heartbeat API request failed: {}", error))
            })?;

        if sdk.options.debug_logging {
            eprintln!(
                "[lukuid-sdk] Heartbeat sync received API payload for {}",
                self.info.id
            );
        }

        let apply_payload = json!({
            "slac_der": required_string_field(&heartbeat_payload, "slac_der")?,
            "heartbeat_der": required_string_field(&heartbeat_payload, "heartbeat_der")?,
            "intermediate_der": required_string_field(&heartbeat_payload, "intermediate_der")?,
            "signature": required_string_field(&heartbeat_payload, "signature")?,
            "timestamp": required_i64_field(&heartbeat_payload, "timestamp")?
        });

        let apply_response = self.call("set_heartbeat", apply_payload).await?;

        if sdk.options.debug_logging {
            eprintln!(
                "[lukuid-sdk] Heartbeat sync applied set_heartbeat for {}",
                self.info.id
            );
        }

        Ok(HeartbeatSyncResult {
            api_url,
            generate_response,
            heartbeat_payload,
            apply_response,
        })
    }

    pub async fn attest_attachment(
        &self,
        record_id: &str,
        checksum: &str,
        mime: &str,
        title: &str,
    ) -> Result<Value, DeviceError> {
        let opts = json!({
            "parent_record_id": record_id,
            "checksum": checksum,
            "mime": mime,
            "title": title,
            "type": "attachment"
        });

        self.call("attest", opts).await
    }

    pub async fn attest_location(
        &self,
        record_id: &str,
        lat: f64,
        lng: f64,
    ) -> Result<Value, DeviceError> {
        let opts = json!({
            "parent_record_id": record_id,
            "lat": lat,
            "lng": lng,
            "type": "location"
        });

        self.call("attest", opts).await
    }

    pub async fn attest_custody(
        &self,
        record_id: &str,
        event: &str,
        status: &str,
        context_ref: Option<&str>,
    ) -> Result<Value, DeviceError> {
        let mut opts = json!({
            "parent_record_id": record_id,
            "event": event,
            "status": status,
            "type": "custody"
        });
        if let Some(context_ref) = context_ref.filter(|value| !value.trim().is_empty()) {
            opts["context_ref"] = Value::String(context_ref.to_string());
        }

        self.call("attest", opts).await
    }

    pub async fn call(&self, key: &str, opts: Value) -> Result<Value, DeviceError> {
        self.call_with_timeout(key, opts, Duration::from_secs(self.command_timeout))
            .await
    }

    pub async fn call_with_timeout(
        &self,
        key: &str,
        opts: Value,
        timeout_duration: Duration,
    ) -> Result<Value, DeviceError> {
        let _guard = self.cmd_mutex.lock().await;

        if self.debug_logging {
            eprintln!(
                "[lukuid-sdk] Device call start target={} action={} opts={}",
                log_device_target(&self.info),
                key,
                opts
            );
        }

        let (tx, rx) = oneshot::channel();
        self.cmd_tx
            .send((key.to_string(), opts, tx))
            .await
            .map_err(|_| DeviceError::Closed)?;

        match timeout(timeout_duration, rx).await {
            Ok(Ok(res)) => {
                if self.debug_logging {
                    match &res {
                        Ok(value) => eprintln!(
                            "[lukuid-sdk] Device call success target={} action={} body={}",
                            log_device_target(&self.info),
                            key,
                            value
                        ),
                        Err(error) => eprintln!(
                            "[lukuid-sdk] Device call error target={} action={} error={}",
                            log_device_target(&self.info),
                            key,
                            error
                        ),
                    }
                }
                res
            }
            Ok(Err(_)) => {
                if self.debug_logging {
                    eprintln!(
                        "[lukuid-sdk] Device call channel closed target={} action={}",
                        log_device_target(&self.info),
                        key
                    );
                }
                Err(DeviceError::Closed)
            }
            Err(_) => {
                if self.debug_logging {
                    eprintln!(
                        "[lukuid-sdk] Device call timeout target={} action={}",
                        log_device_target(&self.info),
                        key
                    );
                }
                Err(DeviceError::Timeout)
            }
        }
    }

    pub async fn send(&self, data: &[u8]) -> Result<(), DeviceError> {
        let (tx, rx) = oneshot::channel();
        self.raw_tx
            .send((data.to_vec(), tx))
            .await
            .map_err(|_| DeviceError::Closed)?;

        rx.await
            .map_err(|_| DeviceError::Closed)?
            .map_err(DeviceError::Transport)
    }

    pub fn subscribe(&self) -> broadcast::Receiver<DeviceEventPayload> {
        self.event_tx.subscribe()
    }

    pub async fn close(&self) {
        let _ = self.close_tx.send(()).await;
    }
}

fn process_frame(
    frame: Value,
    pending: &Arc<Mutex<HashMap<String, PendingCommand>>>,
    events: &broadcast::Sender<DeviceEventPayload>,
    debug_logging: bool,
) {
    if debug_logging {
        eprintln!("[lukuid-sdk] Decoded device frame {}", frame);
    }

    let obj = match frame.as_object() {
        Some(o) => o,
        None => return,
    };

    let action = match obj.get("action").and_then(|v| v.as_str()) {
        Some(a) => a,
        None => return,
    };

    let is_response = obj.contains_key("ok")
        || obj.contains_key("success")
        || obj.contains_key("error")
        || obj.contains_key("err");

    if is_response {
        let mut pending_cb = None;
        let has_more = obj
            .get("has_more")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);

        {
            let mut map = pending.lock().unwrap();

            // 1. Try match by ID
            let mut match_id = obj
                .get("id")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());

            // 2. Try match by action if no ID match
            if match_id.is_none() || !map.contains_key(match_id.as_ref().unwrap()) {
                match_id = None;
                for (id, p) in map.iter() {
                    if p.action == action {
                        match_id = Some(id.clone());
                        break;
                    }
                }
            }

            if let Some(id) = match_id {
                let ok = obj.get("ok").and_then(|v| v.as_bool()).unwrap_or(true);

                if !ok {
                    // On error, immediately remove and resolve
                    if let Some(p) = map.remove(&id) {
                        pending_cb = Some((
                            p.callback,
                            p.accumulated_data,
                            p.accumulated_batches,
                            p.accumulated_full_records,
                            false,
                        ));
                    }
                } else if has_more {
                    // Accumulate data and keep pending
                    if let Some(p) = map.get_mut(&id) {
                        let mut chunk_count = 0;
                        if let Some(data_arr) = obj.get("data").and_then(|v| v.as_array()) {
                            chunk_count += data_arr.len();
                            p.accumulated_data.extend(data_arr.clone());
                        }
                        if let Some(batches) = obj
                            .get("record_batches")
                            .and_then(|v| v.get("batches"))
                            .and_then(|v| v.as_array())
                        {
                            if chunk_count == 0 {
                                chunk_count += batches.len();
                            }
                            p.accumulated_batches.extend(batches.clone());
                        }
                        if let Some(full) = obj.get("full_record_response") {
                            chunk_count += 1;
                            p.accumulated_full_records.push(full.clone());
                        }

                        // Local emission for progress
                        let mut progress_map = HashMap::new();
                        progress_map.insert("action".to_string(), Value::String(p.action.clone()));
                        let total = p
                            .accumulated_data
                            .len()
                            .max(p.accumulated_batches.len())
                            .max(p.accumulated_full_records.len());
                        progress_map.insert(
                            "total_accumulated".to_string(),
                            Value::Number(serde_json::Number::from(total)),
                        );
                        progress_map.insert(
                            "chunk_size".to_string(),
                            Value::Number(serde_json::Number::from(chunk_count)),
                        );

                        let _ = events.send(DeviceEventPayload {
                            key: "fetch_progress".to_string(),
                            data: progress_map,
                        });
                    }
                } else {
                    // Final chunk, remove from pending
                    if let Some(mut p) = map.remove(&id) {
                        if let Some(data_arr) = obj.get("data").and_then(|v| v.as_array()) {
                            p.accumulated_data.extend(data_arr.clone());
                        }
                        if let Some(batches) = obj
                            .get("record_batches")
                            .and_then(|v| v.get("batches"))
                            .and_then(|v| v.as_array())
                        {
                            p.accumulated_batches.extend(batches.clone());
                        }
                        if let Some(full) = obj.get("full_record_response") {
                            p.accumulated_full_records.push(full.clone());
                        }
                        pending_cb = Some((
                            p.callback,
                            p.accumulated_data,
                            p.accumulated_batches,
                            p.accumulated_full_records,
                            true,
                        ));
                    }
                }
            }
        }

        if let Some((cb, accum, accum_batches, accum_full, ok)) = pending_cb {
            if ok {
                let mut final_obj = obj.clone();
                // If we accumulated arrays, or the response originally had a "data" array, return the merged array.
                // Otherwise, return the raw object if it wasn't a list-based fetch.
                if !accum.is_empty()
                    || (obj.contains_key("data") && obj.get("data").unwrap().is_array())
                {
                    final_obj.insert("data".to_string(), Value::Array(accum));
                }

                if !accum_batches.is_empty() || obj.contains_key("record_batches") {
                    let mut rb = serde_json::Map::new();
                    rb.insert("batches".to_string(), Value::Array(accum_batches));
                    final_obj.insert("record_batches".to_string(), Value::Object(rb));
                }

                if !accum_full.is_empty() {
                    final_obj.insert("records".to_string(), Value::Array(accum_full));
                }

                let _ = cb.send(Ok(Value::Object(final_obj)));
            } else {
                let err_msg = obj
                    .get("err")
                    .and_then(|v| v.get("msg"))
                    .and_then(|v| v.as_str())
                    .or_else(|| obj.get("error").and_then(|v| v.as_str()))
                    .or_else(|| obj.get("message").and_then(|v| v.as_str()))
                    .or_else(|| obj.get("error_code").and_then(|v| v.as_str()))
                    .unwrap_or("Unknown error")
                    .to_string();
                let _ = cb.send(Err(DeviceError::CommandFailed(err_msg)));
            }
        }
    } else {
        // Event
        let data_map = match obj.get("data").and_then(|v| v.as_object()) {
            Some(o) => o.iter().map(|(k, v)| (k.clone(), v.clone())).collect(),
            None => HashMap::new(),
        };

        let payload = DeviceEventPayload {
            key: action.to_string(),
            data: data_map,
        };
        let _ = events.send(payload);
    }
}

#[cfg(test)]
mod tests {
    use super::{resolve_heartbeat_api_url, value_as_u64_integral};
    use serde_json::json;

    #[test]
    fn parses_integral_float_counter_values() {
        assert_eq!(value_as_u64_integral(&json!(42.0)), Some(42));
        assert_eq!(value_as_u64_integral(&json!(42)), Some(42));
        assert_eq!(value_as_u64_integral(&json!(42.5)), None);
    }

    #[test]
    fn prefers_device_custom_heartbeat_url() {
        let resolved = resolve_heartbeat_api_url(
            Some(" https://factory-heartbeat.example.com/custom/ "),
            "https://api.lukuid.com",
        );

        assert_eq!(resolved, "https://factory-heartbeat.example.com/custom");
    }

    #[test]
    fn falls_back_to_default_heartbeat_url() {
        let resolved = resolve_heartbeat_api_url(Some("   "), "https://api.lukuid.com/");

        assert_eq!(resolved, "https://api.lukuid.com");
    }
}
