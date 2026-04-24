// SPDX-License-Identifier: Apache-2.0
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use ed25519_dalek::{Signature, Signer, Verifier, VerifyingKey};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::collections::{HashMap, HashSet};
use std::fs::File;
use std::io::Cursor;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use zip::write::FileOptions;
use zip::{ZipArchive, ZipWriter};

pub const LUKU_MIMETYPE: &str = "application/vnd.lukuid.package+zip";
const SUPPORTED_ARCHIVE_VERSIONS: &[&str] = &["1.0.0", "1.0"];

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LukuManifest {
    pub r#type: String,
    pub version: String,
    pub created_at_utc: u64,
    pub description: String,
    pub blocks_hash: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub native_continuity_gap_seconds: Option<u64>,
    #[serde(flatten, default)]
    pub extra: HashMap<String, Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LukuBlock {
    pub block_id: u32,
    pub timestamp_utc: u64,
    #[serde(default)]
    pub previous_block_hash: Option<String>,
    pub device: LukuDeviceIdentity,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub attestation_dac_der: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub attestation_manufacturer_der: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub attestation_intermediate_der: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub attestation_root_fingerprint: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub heartbeat_slac_der: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub heartbeat_der: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub heartbeat_intermediate_der: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub heartbeat_root_fingerprint: Option<String>,
    pub batch: Vec<Value>,
    #[serde(default)]
    pub batch_hash: String,
    #[serde(default)]
    pub block_canonical_string: String,
    #[serde(default)]
    pub block_hash: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LukuDeviceIdentity {
    pub device_id: String,
    pub public_key: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VerificationIssue {
    pub code: String,
    pub message: String,
    pub criticality: Criticality,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq, PartialOrd, Ord)]
#[serde(rename_all = "lowercase")]
pub enum Criticality {
    Info,
    Warning,
    Critical,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
pub struct LukuPolicy {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub native_continuity_gap_seconds: Option<u64>,
}

#[derive(Debug, Clone, Default)]
pub struct LukuExportOptions {
    pub policy: Option<LukuPolicy>,
}

#[derive(Debug, Clone)]
pub struct LukuVerifyOptions {
    pub allow_untrusted_roots: bool,
    pub skip_certificate_temporal_checks: bool,
    pub trusted_external_fingerprints: Vec<String>,
    pub trust_profile: String,
    pub policy: Option<LukuPolicy>,
    pub require_continuity: bool,
}

impl Default for LukuVerifyOptions {
    fn default() -> Self {
        Self {
            allow_untrusted_roots: false,
            skip_certificate_temporal_checks: false,
            trusted_external_fingerprints: Vec::new(),
            trust_profile: std::env::var("LUKUID_TRUST_PROFILE").unwrap_or_else(|_| "prod".to_string()),
            policy: None,
            require_continuity: false,
        }
    }
}

#[derive(Debug)]
pub struct LukuFile {
    pub manifest: LukuManifest,
    pub manifest_sig: String,
    pub blocks: Vec<LukuBlock>,
    pub attachments: HashMap<String, Vec<u8>>,
    pub path: Option<PathBuf>,
    manifest_raw: Option<String>,
    blocks_raw: Option<String>,
    mimetype_is_first: bool,
    mimetype_is_stored: bool,
}

impl LukuFile {
    pub fn from_parts(
        manifest: LukuManifest,
        manifest_sig: String,
        blocks: Vec<LukuBlock>,
        attachments: HashMap<String, Vec<u8>>,
        path: Option<PathBuf>,
    ) -> Self {
        let manifest_raw = serde_json::to_string_pretty(&manifest).ok();
        let blocks_raw: String = blocks
            .iter()
            .map(|b| serde_json::to_string(b).unwrap())
            .collect::<Vec<_>>()
            .join("\n")
            + "\n";
        Self {
            manifest,
            manifest_sig,
            blocks,
            attachments,
            path,
            manifest_raw,
            blocks_raw: Some(blocks_raw),
            mimetype_is_first: true,
            mimetype_is_stored: true,
        }
    }

    pub fn open<P: AsRef<Path>>(path: P) -> Result<Self, String> {
        let file = File::open(&path).map_err(|e| e.to_string())?;
        Self::open_reader(file, Some(path.as_ref().to_path_buf()))
    }

    pub fn open_bytes(data: &[u8]) -> Result<Self, String> {
        Self::open_reader(Cursor::new(data), None)
    }

    fn open_reader<R: Read + std::io::Seek>(
        reader: R,
        path: Option<PathBuf>,
    ) -> Result<Self, String> {
        let mut archive = ZipArchive::new(reader).map_err(|e| e.to_string())?;

        let mut seen_names = HashSet::new();
        for i in 0..archive.len() {
            let file = archive.by_index(i).map_err(|e| e.to_string())?;
            let name = file.name().to_string();
            if !is_safe_zip_entry_name(&name) {
                return Err(format!("Archive contains unsafe ZIP entry path: {}", name));
            }
            if !seen_names.insert(name.clone()) {
                return Err(format!("Archive contains duplicate ZIP entry: {}", name));
            }
        }

        let (mimetype_is_first, mimetype_is_stored) = match archive.by_index(0) {
            Ok(file0) => (
                file0.name() == "mimetype",
                file0.compression() == zip::CompressionMethod::Stored,
            ),
            Err(_) => (false, false),
        };

        let mut mimetype_file = archive
            .by_name("mimetype")
            .map_err(|_| "mimetype file missing")?;
        let mut mimetype = String::new();
        mimetype_file
            .read_to_string(&mut mimetype)
            .map_err(|e| e.to_string())?;
        if mimetype.trim() != LUKU_MIMETYPE {
            return Err(format!("Invalid mimetype: expected {}", LUKU_MIMETYPE));
        }
        drop(mimetype_file);

        let mut manifest_file = archive
            .by_name("manifest.json")
            .map_err(|_| "manifest.json missing")?;
        let mut manifest_content = String::new();
        manifest_file
            .read_to_string(&mut manifest_content)
            .map_err(|e| e.to_string())?;
        let manifest: LukuManifest =
            serde_json::from_str(&manifest_content).map_err(|e| e.to_string())?;
        drop(manifest_file);

        let mut manifest_sig = String::new();
        if let Ok(mut sig_file) = archive.by_name("manifest.sig") {
            sig_file
                .read_to_string(&mut manifest_sig)
                .map_err(|e| e.to_string())?;
        }

        let mut blocks_file = archive
            .by_name("blocks.jsonl")
            .map_err(|_| "blocks.jsonl missing")?;
        let mut blocks_content = String::new();
        blocks_file
            .read_to_string(&mut blocks_content)
            .map_err(|e| e.to_string())?;
        let blocks: Vec<LukuBlock> = blocks_content
            .lines()
            .filter(|l| !l.trim().is_empty())
            .map(|l| serde_json::from_str(l).map_err(|e| e.to_string()))
            .collect::<Result<Vec<_>, _>>()?;
        drop(blocks_file);

        let mut attachments = HashMap::new();
        for i in 0..archive.len() {
            let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
            if file.name().starts_with("attachments/") && !file.is_dir() {
                let mut content = Vec::new();
                file.read_to_end(&mut content).map_err(|e| e.to_string())?;
                let hash = file.name().split('/').last().unwrap_or("").to_string();
                attachments.insert(hash, content);
            }
        }

        Ok(Self {
            manifest,
            manifest_sig,
            blocks,
            attachments,
            path,
            manifest_raw: Some(manifest_content),
            blocks_raw: Some(blocks_content),
            mimetype_is_first,
            mimetype_is_stored,
        })
    }

    fn exporter_public_key(&self) -> Option<&str> {
        self.manifest
            .extra
            .get("exporter_public_key")
            .and_then(Value::as_str)
            .filter(|value| !value.is_empty())
    }

    fn verify_detached_signature(
        public_key_b64: &str,
        payload: &[u8],
        signature_b64: &str,
    ) -> bool {
        let Ok(pubkey_bytes) = BASE64.decode(public_key_b64) else {
            return false;
        };
        let Ok(sig_bytes) = BASE64.decode(signature_b64) else {
            return false;
        };
        let Ok(public_key) =
            VerifyingKey::from_bytes(pubkey_bytes[..32].try_into().unwrap_or(&[0u8; 32]))
        else {
            return false;
        };
        let Ok(signature) = Signature::from_slice(&sig_bytes) else {
            return false;
        };

        public_key.verify(payload, &signature).is_ok()
    }

    fn is_aux_record_type(record_type: &str) -> bool {
        matches!(record_type, "attachment" | "location" | "custody")
    }

    fn record_timestamp_utc(record: &Value) -> Option<u64> {
        record
            .get("payload")
            .and_then(|value| value.get("timestamp_utc"))
            .and_then(Value::as_u64)
            .or_else(|| record.get("timestamp_utc").and_then(Value::as_u64))
            .or_else(|| record.get("timestamp").and_then(Value::as_u64))
    }

    fn record_signature(record: &Value) -> Option<&str> {
        record.get("signature").and_then(Value::as_str)
    }

    fn record_previous_signature(record: &Value) -> Option<&str> {
        record.get("previous_signature").and_then(Value::as_str)
    }

    fn manifest_policy(manifest: &LukuManifest) -> Option<LukuPolicy> {
        if let Some(policy) = manifest.extra.get("policy").and_then(Value::as_object) {
            let name = policy
                .get("name")
                .and_then(Value::as_str)
                .unwrap_or("")
                .to_string();
            let native_continuity_gap_seconds = policy
                .get("native_continuity_gap_seconds")
                .and_then(Value::as_u64);
            return Some(LukuPolicy {
                name,
                native_continuity_gap_seconds,
            });
        }

        if let Some(threshold) = manifest.native_continuity_gap_seconds {
            return Some(LukuPolicy {
                name: String::new(),
                native_continuity_gap_seconds: Some(threshold),
            });
        }

        None
    }

    fn apply_export_options(
        manifest: &mut LukuManifest,
        options: &LukuExportOptions,
    ) -> Result<(), String> {
        if let Some(policy) = &options.policy {
            let policy_value = serde_json::to_value(policy).map_err(|e| e.to_string())?;
            manifest.extra.insert("policy".to_string(), policy_value);
            if let Some(threshold) = policy.native_continuity_gap_seconds {
                manifest.native_continuity_gap_seconds = Some(threshold);
                // DO NOT add to extra if it's already a top-level field in LukuManifest
            }
        }
        Ok(())
    }

    fn first_record_timestamp_utc(records: &[Value]) -> u64 {
        records
            .iter()
            .filter_map(Self::record_timestamp_utc)
            .next()
            .unwrap_or(0)
    }

    fn build_blocks_for_export(
        records: Vec<Value>,
        device: &LukuDeviceIdentity,
        policy: Option<&LukuPolicy>,
    ) -> Vec<LukuBlock> {
        let native_gap_threshold_seconds = policy.and_then(|value| value.native_continuity_gap_seconds);
        let mut blocks = Vec::new();
        let mut previous_block_hash: Option<String> = None;
        let mut current_batch: Vec<Value> = Vec::new();
        let mut last_signature: Option<String> = None;
        let mut last_native_timestamp_utc: Option<u64> = None;

        for record in records {
            let record_type = record.get("type").and_then(Value::as_str).unwrap_or("unknown");
            let is_aux = Self::is_aux_record_type(record_type);
            let timestamp_utc = Self::record_timestamp_utc(&record);

            let mut should_split = false;
            if !is_aux {
                if let (Some(last_sig), Some(previous_signature)) =
                    (last_signature.as_deref(), Self::record_previous_signature(&record))
                {
                    if !previous_signature.is_empty() && previous_signature != last_sig {
                        should_split = true;
                    }
                }

                if !should_split {
                    if let (Some(threshold), Some(last_timestamp), Some(current_timestamp)) = (
                        native_gap_threshold_seconds,
                        last_native_timestamp_utc,
                        timestamp_utc,
                    ) {
                        if current_timestamp > last_timestamp
                            && current_timestamp - last_timestamp > threshold
                        {
                            should_split = true;
                        }
                    }
                }
            }

            if should_split && !current_batch.is_empty() {
                let block = Self::build_block_from_records(
                    blocks.len() as u32,
                    Self::first_record_timestamp_utc(&current_batch),
                    previous_block_hash.clone(),
                    device,
                    current_batch,
                    None,
                );
                previous_block_hash = Some(block.block_hash.clone());
                blocks.push(block);
                current_batch = Vec::new();
                last_signature = None;
                last_native_timestamp_utc = None;
            }

            current_batch.push(record);

            if !is_aux {
                if let Some(signature) = Self::record_signature(current_batch.last().unwrap()) {
                    if !signature.is_empty() {
                        last_signature = Some(signature.to_string());
                    }
                }
                if let Some(current_timestamp) = timestamp_utc {
                    last_native_timestamp_utc = Some(current_timestamp);
                }
            }
        }

        if !current_batch.is_empty() {
            let block = Self::build_block_from_records(
                blocks.len() as u32,
                Self::first_record_timestamp_utc(&current_batch),
                previous_block_hash,
                device,
                current_batch,
                None,
            );
            blocks.push(block);
        }

        blocks
    }

    fn batch_hash(batch: &[Value]) -> String {
        let joined = batch
            .iter()
            .map(|record| {
                record
                    .get("signature")
                    .and_then(Value::as_str)
                    .unwrap_or("")
                    .to_string()
            })
            .collect::<Vec<_>>()
            .join(":");
        let mut hasher = Sha256::new();
        hasher.update(joined.as_bytes());
        format!("{:x}", hasher.finalize())
    }

    fn block_canonical_string(
        block_id: u32,
        timestamp_utc: u64,
        previous_block_hash: Option<&str>,
        device: &LukuDeviceIdentity,
        attestation_root_fingerprint: Option<&str>,
        heartbeat_root_fingerprint: Option<&str>,
        batch_hash: &str,
    ) -> String {
        format!(
            "{}:{}:{}:{}:{}:{}:{}:{}",
            block_id,
            timestamp_utc,
            previous_block_hash.unwrap_or(""),
            device.device_id,
            device.public_key,
            attestation_root_fingerprint.unwrap_or(""),
            heartbeat_root_fingerprint.unwrap_or(""),
            batch_hash
        )
    }

    fn block_hash(block_canonical_string: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(block_canonical_string.as_bytes());
        format!("{:x}", hasher.finalize())
    }

    fn recompute_block_fields(block: &LukuBlock) -> (String, String, String) {
        let batch_hash = Self::batch_hash(&block.batch);
        let block_canonical_string = Self::block_canonical_string(
            block.block_id,
            block.timestamp_utc,
            block.previous_block_hash.as_deref(),
            &block.device,
            block.attestation_root_fingerprint.as_deref(),
            block.heartbeat_root_fingerprint.as_deref(),
            &batch_hash,
        );
        let block_hash = Self::block_hash(&block_canonical_string);
        (batch_hash, block_canonical_string, block_hash)
    }

    fn debug_logging_enabled() -> bool {
        std::env::var_os("LUKUID_SDK_DEBUG").is_some()
            || std::env::var_os("LUKUID_FACTORY_SDK_DEBUG").is_some()
    }

    fn debug_log(message: impl AsRef<str>) {
        if Self::debug_logging_enabled() {
            eprintln!("[lukuid-sdk:luku] {}", message.as_ref());
        }
    }

    fn push_issue(
        issues: &mut Vec<VerificationIssue>,
        debug_logging: bool,
        context: Option<&str>,
        issue: VerificationIssue,
    ) {
        if debug_logging {
            match context {
                Some(value) => Self::debug_log(format!(
                    "{value} issue={} criticality={:?} message={}",
                    issue.code, issue.criticality, issue.message
                )),
                None => Self::debug_log(format!(
                    "issue={} criticality={:?} message={}",
                    issue.code, issue.criticality, issue.message
                )),
            }
        }
        issues.push(issue);
    }

    fn debug_record_id(record: &Value) -> String {
        for key in [
            "scan_id",
            "event_id",
            "custody_id",
            "attachment_id",
            "location_id",
            "parent_record_id",
            "id",
        ] {
            if let Some(value) = record.get(key).and_then(Value::as_str) {
                return value.to_string();
            }
            if let Some(value) = record
                .get("payload")
                .and_then(|payload| payload.get(key))
                .and_then(Value::as_str)
            {
                return value.to_string();
            }
        }
        "-".to_string()
    }

    fn debug_block_context(block_index: usize, block: &LukuBlock) -> String {
        format!(
            "block[{block_index}] id={} device={} records={} prev_hash={} block_hash={}",
            block.block_id,
            block.device.device_id,
            block.batch.len(),
            block.previous_block_hash.as_deref().unwrap_or("-"),
            if block.block_hash.is_empty() {
                "-"
            } else {
                block.block_hash.as_str()
            }
        )
    }

    fn debug_record_context(
        block_index: usize,
        record_index: usize,
        record: &Value,
        block: &LukuBlock,
    ) -> String {
        let payload = record.get("payload");
        let device_id = record
            .get("device_id")
            .and_then(Value::as_str)
            .unwrap_or(block.device.device_id.as_str());
        let record_type = record
            .get("type")
            .and_then(Value::as_str)
            .unwrap_or("unknown");
        let ctr = payload
            .and_then(|value| value.get("ctr"))
            .and_then(Value::as_u64);
        let timestamp = payload
            .and_then(|value| value.get("timestamp_utc"))
            .and_then(Value::as_u64)
            .or_else(|| record.get("timestamp_utc").and_then(Value::as_u64));

        format!(
            "block[{block_index}] record[{record_index}] type={} id={} device={} ctr={} timestamp_utc={}",
            record_type,
            Self::debug_record_id(record),
            device_id,
            ctr.map(|value| value.to_string())
                .unwrap_or_else(|| "-".to_string()),
            timestamp
                .map(|value| value.to_string())
                .unwrap_or_else(|| "-".to_string())
        )
    }

    pub fn verify(&self, options: LukuVerifyOptions) -> Vec<VerificationIssue> {
        let debug_logging = Self::debug_logging_enabled();
        let mut issues = Vec::new();

        if !SUPPORTED_ARCHIVE_VERSIONS.contains(&self.manifest.version.as_str()) {
            Self::push_issue(
                &mut issues,
                debug_logging,
                Some("archive"),
                VerificationIssue {
                    code: "MANIFEST_VERSION_UNSUPPORTED".to_string(),
                    message: format!("Archive manifest version {} is not supported.", self.manifest.version),
                    criticality: Criticality::Critical,
                },
            );
        }
        if debug_logging {
            let archive_path = self
                .path
                .as_ref()
                .map(|value| value.display().to_string())
                .unwrap_or_else(|| "<memory>".to_string());
            Self::debug_log(format!(
                "verify start path={} manifest_version={} blocks={} attachments={} allow_untrusted_roots={} skip_certificate_temporal_checks={} trusted_external_fingerprints={}",
                archive_path,
                self.manifest.version,
                self.blocks.len(),
                self.attachments.len(),
                options.allow_untrusted_roots,
                options.skip_certificate_temporal_checks,
                options.trusted_external_fingerprints.len()
            ));
        }

        // 0. Verify archive shape and manifest signature
        if self.manifest_sig.trim().is_empty() {
            Self::push_issue(
                &mut issues,
                debug_logging,
                Some("archive"),
                VerificationIssue {
                    code: "MANIFEST_SIGNATURE_MISSING".to_string(),
                    message: "The manifest.sig file is empty or missing.".to_string(),
                    criticality: Criticality::Critical,
                },
            );
        } else if let Some(public_key) = self.exporter_public_key() {
            if let Some(manifest_raw) = &self.manifest_raw {
                if !Self::verify_detached_signature(
                    public_key,
                    manifest_raw.as_bytes(),
                    &self.manifest_sig,
                ) {
                    Self::push_issue(
                        &mut issues,
                        debug_logging,
                        Some("archive"),
                        VerificationIssue {
                            code: "MANIFEST_SIGNATURE_INVALID".to_string(),
                            message:
                                "The manifest signature does not verify against the exporter key."
                                    .to_string(),
                            criticality: Criticality::Critical,
                        },
                    );
                }
            }
        } else {
            Self::push_issue(&mut issues, debug_logging, Some("archive"), VerificationIssue {
                code: "EXPORTER_KEY_MISSING".to_string(),
                message:
                    "Archive does not publish an exporter_public_key; manifest/block signatures cannot be checked offline."
                        .to_string(),
                criticality: Criticality::Warning,
            });
        }

        // 1. Check blocks_hash and archive structure
        if !self.mimetype_is_first {
            Self::push_issue(
                &mut issues,
                debug_logging,
                Some("archive"),
                VerificationIssue {
                    code: "MIMETYPE_NOT_FIRST".to_string(),
                    message: "The mimetype entry is not the first ZIP entry.".to_string(),
                    criticality: Criticality::Critical,
                },
            );
        } else if !self.mimetype_is_stored {
            Self::push_issue(
                &mut issues,
                debug_logging,
                Some("archive"),
                VerificationIssue {
                    code: "MIMETYPE_COMPRESSED".to_string(),
                    message: "The mimetype entry must be stored uncompressed.".to_string(),
                    criticality: Criticality::Critical,
                },
            );
        }

        if let Some(blocks_raw) = &self.blocks_raw {
            let mut hasher = Sha256::new();
            hasher.update(blocks_raw.as_bytes());
            let hash = format!("{:x}", hasher.finalize());
            if hash != self.manifest.blocks_hash {
                if debug_logging {
                    Self::debug_log(format!(
                        "archive blocks_hash expected={} actual={}",
                        self.manifest.blocks_hash, hash
                    ));
                }
                Self::push_issue(
                    &mut issues,
                    debug_logging,
                    Some("archive"),
                    VerificationIssue {
                        code: "BLOCKS_HASH_MISMATCH".to_string(),
                        message: "The blocks.jsonl file hash does not match the manifest."
                            .to_string(),
                        criticality: Criticality::Critical,
                    },
                );
            }
        } else {
            Self::push_issue(
                &mut issues,
                debug_logging,
                Some("archive"),
                VerificationIssue {
                    code: "BLOCKS_FILE_MISSING".to_string(),
                    message: "The blocks.jsonl file is missing or not loaded.".to_string(),
                    criticality: Criticality::Critical,
                },
            );
        }

        // 2. Verify block chain and hashes
        let mut prev_hash: Option<String> = None;
        for (i, block) in self.blocks.iter().enumerate() {
            let block_context = Self::debug_block_context(i, block);
            if debug_logging {
                Self::debug_log(format!("{block_context} verifying"));
            }
            if block.block_id != i as u32 {
                Self::push_issue(
                    &mut issues,
                    debug_logging,
                    Some(block_context.as_str()),
                    VerificationIssue {
                        code: "BLOCK_ID_MISMATCH".to_string(),
                        message: format!("Block {} has incorrect block_id {}.", i, block.block_id),
                        criticality: Criticality::Critical,
                    },
                );
            }

            if block.previous_block_hash != prev_hash {
                if debug_logging {
                    Self::debug_log(format!(
                        "{block_context} previous_hash expected={} actual={}",
                        prev_hash.as_deref().unwrap_or("-"),
                        block.previous_block_hash.as_deref().unwrap_or("-")
                    ));
                }
                Self::push_issue(
                    &mut issues,
                    debug_logging,
                    Some(block_context.as_str()),
                    VerificationIssue {
                        code: "BLOCK_CHAIN_BROKEN".to_string(),
                        message: format!("Block {} previous hash link is broken.", i),
                        criticality: Criticality::Critical,
                    },
                );
            }

            let (expected_batch_hash, expected_block_canonical_string, expected_block_hash) =
                Self::recompute_block_fields(block);

            if block.batch_hash != expected_batch_hash {
                if debug_logging {
                    Self::debug_log(format!(
                        "{block_context} batch_hash expected={} actual={}",
                        expected_batch_hash, block.batch_hash
                    ));
                }
                Self::push_issue(
                    &mut issues,
                    debug_logging,
                    Some(block_context.as_str()),
                    VerificationIssue {
                        code: "BLOCK_BATCH_HASH_INVALID".to_string(),
                        message: format!(
                            "Block {} batch_hash does not match ordered record signatures.",
                            i
                        ),
                        criticality: Criticality::Critical,
                    },
                );
            }

            if block.block_canonical_string != expected_block_canonical_string {
                if debug_logging {
                    Self::debug_log(format!(
                        "{block_context} canonical expected={} actual={}",
                        expected_block_canonical_string, block.block_canonical_string
                    ));
                }
                Self::push_issue(
                    &mut issues,
                    debug_logging,
                    Some(block_context.as_str()),
                    VerificationIssue {
                        code: "BLOCK_CANONICAL_MISMATCH".to_string(),
                        message: format!(
                            "Block {} canonical string does not match recomputed content.",
                            i
                        ),
                        criticality: Criticality::Critical,
                    },
                );
            }

            if block.block_hash.is_empty() {
                Self::push_issue(
                    &mut issues,
                    debug_logging,
                    Some(block_context.as_str()),
                    VerificationIssue {
                        code: "BLOCK_HASH_MISSING".to_string(),
                        message: format!("Block {} is missing block_hash.", i),
                        criticality: Criticality::Critical,
                    },
                );
            } else if block.block_hash != expected_block_hash {
                if debug_logging {
                    Self::debug_log(format!(
                        "{block_context} block_hash expected={} actual={}",
                        expected_block_hash, block.block_hash
                    ));
                }
                Self::push_issue(
                    &mut issues,
                    debug_logging,
                    Some(block_context.as_str()),
                    VerificationIssue {
                        code: "BLOCK_HASH_INVALID".to_string(),
                        message: format!(
                            "Block {} block_hash does not match canonical content.",
                            i
                        ),
                        criticality: Criticality::Critical,
                    },
                );
            }

            prev_hash = Some(block.block_hash.clone());
        }

        // Helper to map DER base64 to PEM
        fn pem_from_der_string(value: Option<&String>) -> Option<String> {
            let encoded = value?.trim();
            if encoded.is_empty() {
                return None;
            }
            let decoded = BASE64.decode(encoded).ok()?;
            let b64 = BASE64.encode(decoded);
            let mut pem = String::from("-----BEGIN CERTIFICATE-----\n");
            for chunk in b64.as_bytes().chunks(64) {
                pem.push_str(std::str::from_utf8(chunk).ok()?);
                pem.push('\n');
            }
            pem.push_str("-----END CERTIFICATE-----\n");
            Some(pem)
        }

        // 3. Verify record chain and signatures
        let mut last_ctrs: HashMap<String, u64> = HashMap::new();
        let mut last_times: HashMap<String, u64> = HashMap::new();
        let mut last_continuity_times: HashMap<String, HashMap<String, u64>> = HashMap::new();
        let mut has_seen_device: HashMap<String, bool> = HashMap::new();
        let mut record_ids = HashSet::new();

        let policy = options.policy.clone().or_else(|| Self::manifest_policy(&self.manifest));
        let continuity_types: HashSet<&str> = ["environment"].iter().cloned().collect();

        for block in &self.blocks {
            for record in &block.batch {
                for key in ["scan_id", "event_id", "attachment_id", "custody_id"] {
                    if let Some(value) = record.get(key).and_then(|v| v.as_str()) {
                        record_ids.insert(value.to_string());
                    }
                }
            }
        }

        for (block_index, block) in self.blocks.iter().enumerate() {
            let mut last_sigs: HashMap<String, String> = HashMap::new();

            // Build block-level certificate chains
            let mut block_dac_chain = String::new();
            if let Some(pem) = pem_from_der_string(block.attestation_dac_der.as_ref()) {
                block_dac_chain.push_str(&pem);
            }
            if let Some(pem) = pem_from_der_string(block.attestation_manufacturer_der.as_ref()) {
                block_dac_chain.push_str(&pem);
            }
            if let Some(pem) = pem_from_der_string(block.attestation_intermediate_der.as_ref()) {
                block_dac_chain.push_str(&pem);
            }

            let mut block_slac_chain = String::new();
            if let Some(pem) = pem_from_der_string(block.heartbeat_slac_der.as_ref()) {
                block_slac_chain.push_str(&pem);
            }
            if let Some(pem) = pem_from_der_string(block.heartbeat_der.as_ref()) {
                block_slac_chain.push_str(&pem);
            }
            if let Some(pem) = pem_from_der_string(block.heartbeat_intermediate_der.as_ref()) {
                block_slac_chain.push_str(&pem);
            }

            if debug_logging {
                Self::debug_log(format!(
                    "{} attestation_chain_certs={} heartbeat_chain_certs={}",
                    Self::debug_block_context(block_index, block),
                    block_dac_chain.matches("BEGIN CERTIFICATE").count(),
                    block_slac_chain.matches("BEGIN CERTIFICATE").count()
                ));
            }

            for (record_index, record) in block.batch.iter().enumerate() {
                let device_id = record
                    .get("device_id")
                    .and_then(|v| v.as_str())
                    .unwrap_or(block.device.device_id.as_str());
                let public_key = record
                    .get("public_key")
                    .and_then(|v| v.as_str())
                    .unwrap_or(block.device.public_key.as_str());
                let r#type = record
                    .get("type")
                    .and_then(|v| v.as_str())
                    .unwrap_or("unknown");
                let is_aux_record = matches!(r#type, "attachment" | "location" | "custody");
                let is_compat_attachment = record
                    .get("_compat_nested_attachment")
                    .and_then(|v| v.as_bool())
                    .unwrap_or(false);
                let payload = record.get("payload");
                let ctr = payload.and_then(|p| p.get("ctr")).and_then(|v| v.as_u64());
                let timestamp = payload
                    .and_then(|p| p.get("timestamp_utc"))
                    .and_then(|v| v.as_u64())
                    .or_else(|| record.get("timestamp_utc").and_then(|v| v.as_u64()));
                let sig = record
                    .get("signature")
                    .and_then(|v| v.as_str())
                    .unwrap_or("");
                let prev_record_sig = record
                    .get("previous_signature")
                    .and_then(|v| v.as_str())
                    .unwrap_or("");
                let canonical = record
                    .get("canonical_string")
                    .and_then(|v| v.as_str())
                    .unwrap_or("");
                let genesis_hash = payload
                    .and_then(|p| p.get("genesis_hash"))
                    .and_then(|v| v.as_str())
                    .unwrap_or("");
                let record_context =
                    Self::debug_record_context(block_index, record_index, record, block);

                if debug_logging {
                    Self::debug_log(format!(
                        "{record_context} verifying sig_len={} prev_sig_len={} canonical_len={} aux={} compat_attachment={}",
                        sig.len(),
                        prev_record_sig.len(),
                        canonical.len(),
                        is_aux_record,
                        is_compat_attachment
                    ));
                }

                if !device_id.is_empty() {
                    // Check if this is the first time we see this device
                    let is_first = !is_aux_record && !has_seen_device.contains_key(device_id);
                    if is_first {
                        has_seen_device.insert(device_id.to_string(), true);

                        // If it's the first record in the archive, we only report GENESIS_HASH_MISMATCH
                        // if we know it's supposed to be the genesis record (ctr == 0).
                        // Otherwise, it's a "Floating Anchor" for a history slice.
                        if let Some(current_ctr) = ctr {
                            if current_ctr == 0
                                && !genesis_hash.is_empty()
                                && prev_record_sig != genesis_hash
                            {
                                Self::push_issue(&mut issues, debug_logging, Some(record_context.as_str()), VerificationIssue {
                                    code: "GENESIS_HASH_MISMATCH".to_string(),
                                    message: format!("Genesis record (ctr=0) for device {} has previous_signature that does not match genesis_hash.", device_id),
                                    criticality: Criticality::Critical,
                                });
                            }
                        }
                    }

                    // Chain verification
                    if !is_aux_record {
                        if let Some(last_sig) = last_sigs.get(device_id) {
                            if prev_record_sig != last_sig {
                                if debug_logging {
                                    Self::debug_log(format!(
                                        "{record_context} previous_signature expected={} actual={}",
                                        last_sig, prev_record_sig
                                    ));
                                }
                                Self::push_issue(
                                    &mut issues,
                                    debug_logging,
                                    Some(record_context.as_str()),
                                    VerificationIssue {
                                        code: "RECORD_CHAIN_BROKEN".to_string(),
                                        message: format!(
                                            "Record chain broken for device {} at record type {}.",
                                            device_id, r#type
                                        ),
                                        criticality: Criticality::Critical,
                                    },
                                );
                            }
                        }
                    }

                    if !is_aux_record {
                        if let Some(last_ctr) = last_ctrs.get(device_id) {
                            if let Some(current_ctr) = ctr {
                                if current_ctr <= *last_ctr {
                                    Self::push_issue(
                                        &mut issues,
                                        debug_logging,
                                        Some(record_context.as_str()),
                                        VerificationIssue {
                                            code: "COUNTER_REGRESSION".to_string(),
                                            message: format!(
                                            "Counter regression detected for device {} ({} -> {}).",
                                            device_id, last_ctr, current_ctr
                                        ),
                                            criticality: Criticality::Critical,
                                        },
                                    );
                                }
                            }
                        }
                    }

                    if !is_aux_record {
                        if let Some(last_time) = last_times.get(device_id) {
                            if let Some(current_time) = timestamp {
                                if current_time < *last_time {
                                    Self::push_issue(
                                        &mut issues,
                                        debug_logging,
                                        Some(record_context.as_str()),
                                        VerificationIssue {
                                            code: "TIME_REGRESSION".to_string(),
                                            message: format!(
                                                "Time travel detected for device {} ({} -> {}).",
                                                device_id, last_time, current_time
                                            ),
                                            criticality: Criticality::Critical,
                                        },
                                    );
                                }
                            }
                        }

                        if options.require_continuity && continuity_types.contains(r#type) {
                            if let Some(threshold) = policy.as_ref().and_then(|p| p.native_continuity_gap_seconds) {
                                let device_continuity = last_continuity_times.entry(device_id.to_string()).or_insert_with(HashMap::new);
                                if let Some(last_env_time) = device_continuity.get(r#type) {
                                    if let Some(timestamp) = timestamp {
                                        let gap = timestamp - last_env_time;
                                        if gap > threshold {
                                            Self::push_issue(&mut issues, debug_logging, Some(record_context.as_str()), VerificationIssue {
                                                code: "CONTINUITY_GAP_EXCEEDED".to_string(),
                                                message: format!("Continuity gap of {}s exceeded for device {} type {} (threshold {}s).", gap, device_id, r#type, threshold),
                                                criticality: Criticality::Critical,
                                            });
                                        }
                                    }
                                }
                                if let Some(timestamp) = timestamp {
                                    device_continuity.insert(r#type.to_string(), timestamp);
                                }
                            }
                        }
                    }

                    // Attestation Verification
                    if !options.allow_untrusted_roots {
                        use crate::attestation::{
                            verify_device_attestation, DeviceAttestationInputs,
                        };

                        let mut dac_chain = block_dac_chain.clone();
                        // Support record-level certificates if they exist (identity.dac_der, etc)
                        if let Some(identity) = record.get("identity") {
                            if let Some(dac_der) = identity.get("dac_der").and_then(|v| v.as_str())
                            {
                                dac_chain.clear();
                                if let Some(pem) = pem_from_der_string(Some(&dac_der.to_string())) {
                                    dac_chain.push_str(&pem);
                                }
                                if let Some(m_der) = identity
                                    .get("attestation_manufacturer_der")
                                    .and_then(|v| v.as_str())
                                {
                                    if let Some(pem) = pem_from_der_string(Some(&m_der.to_string()))
                                    {
                                        dac_chain.push_str(&pem);
                                    }
                                }
                                if let Some(i_der) = identity
                                    .get("attestation_intermediate_der")
                                    .and_then(|v| v.as_str())
                                {
                                    if let Some(pem) = pem_from_der_string(Some(&i_der.to_string()))
                                    {
                                        dac_chain.push_str(&pem);
                                    }
                                }
                            }
                        }

                        let attestation_sig = record
                            .get("identity")
                            .and_then(|i| i.get("signature"))
                            .and_then(|v| v.as_str())
                            .unwrap_or("");

                        if dac_chain.is_empty() {
                            Self::push_issue(
                                &mut issues,
                                debug_logging,
                                Some(record_context.as_str()),
                                VerificationIssue {
                                    code: "ATTESTATION_CHAIN_MISSING".to_string(),
                                    message: format!(
                                        "Missing DAC attestation chain for device {}.",
                                        device_id
                                    ),
                                    criticality: Criticality::Warning,
                                },
                            );
                        } else if !is_aux_record || !attestation_sig.is_empty() {
                            let inputs = DeviceAttestationInputs {
                                id: device_id.to_string(),
                                key: public_key.to_string(),
                                attestation_sig: attestation_sig.to_string(),
                                certificate_chain: Some(dac_chain),
                                created: if options.skip_certificate_temporal_checks {
                                    None
                                } else {
                                    timestamp.map(|v| v as i64)
                                },
                                attestation_alg: None,
                                attestation_payload_version: None,
                                trust_profile: options.trust_profile.clone(),
                            };

                            let result = verify_device_attestation(&inputs);
                            if !result.ok {
                                if debug_logging {
                                    Self::debug_log(format!(
                                        "{record_context} attestation_check certs={} attestation_sig_len={} created={:?} reason={}",
                                        inputs
                                            .certificate_chain
                                            .as_ref()
                                            .map(|chain| chain.matches("BEGIN CERTIFICATE").count())
                                            .unwrap_or(0),
                                        attestation_sig.len(),
                                        inputs.created,
                                        result.reason.clone().unwrap_or_default()
                                    ));
                                }
                                Self::push_issue(
                                    &mut issues,
                                    debug_logging,
                                    Some(record_context.as_str()),
                                    VerificationIssue {
                                        code: "ATTESTATION_FAILED".to_string(),
                                        message: format!(
                                            "Device {} failed DAC attestation: {}",
                                            device_id,
                                            result.reason.unwrap_or_default()
                                        ),
                                        criticality: Criticality::Critical,
                                    },
                                );
                            }
                        }
                    }

                    // 3.1 External Identity Verification
                    fn verify_ext(
                        record_or_attachment: &Value,
                        r#type: &str,
                        options: &LukuVerifyOptions,
                        debug_logging: bool,
                        context: &str,
                        issues: &mut Vec<VerificationIssue>,
                    ) {
                        if let Some(ext_id) = record_or_attachment.get("external_identity") {
                            if !matches!(r#type, "attachment" | "location" | "custody") {
                                LukuFile::push_issue(
                                    issues,
                                    debug_logging,
                                    Some(context),
                                    VerificationIssue {
                                        code: "EXTERNAL_IDENTITY_UNSUPPORTED_RECORD_TYPE".to_string(),
                                        message: format!("Record type {} must not carry external_identity.", r#type),
                                        criticality: Criticality::Critical,
                                    },
                                );
                                return;
                            }
                            use crate::attestation::{
                                verify_external_identity, ExternalIdentityInputs,
                            };

                            let endorser_id = ext_id
                                .get("endorser_id")
                                .and_then(|v| v.as_str())
                                .unwrap_or("");
                            let root_fingerprint = ext_id
                                .get("root_fingerprint")
                                .and_then(|v| v.as_str())
                                .unwrap_or("");
                            let signature = ext_id
                                .get("signature")
                                .and_then(|v| v.as_str())
                                .unwrap_or("");
                            let cert_chain_der: Vec<String> = ext_id
                                .get("cert_chain_der")
                                .and_then(|v| v.as_array())
                                .map(|arr| {
                                    arr.iter()
                                        .filter_map(|v| v.as_str().map(|s| s.to_string()))
                                        .collect()
                                })
                                .unwrap_or_default();

                            let expected_payload = match r#type {
                                "attachment" => {
                                    let checksum = record_or_attachment
                                        .get("checksum")
                                        .and_then(|v| v.as_str())
                                        .unwrap_or("");
                                    let merkle = record_or_attachment
                                        .get("merkle_root")
                                        .and_then(|v| v.as_str())
                                        .unwrap_or("");
                                    format!("{}:{}:{}", checksum, merkle, endorser_id)
                                }
                                "location" => {
                                    let lat = record_or_attachment
                                        .get("lat")
                                        .and_then(|v| v.as_f64())
                                        .unwrap_or(0.0);
                                    let lng = record_or_attachment
                                        .get("lng")
                                        .and_then(|v| v.as_f64())
                                        .unwrap_or(0.0);
                                    format!("{}:{}:{}", lat, lng, endorser_id)
                                }
                                "custody" => {
                                    let event = record_or_attachment
                                        .get("payload")
                                        .and_then(|v| v.get("event"))
                                        .and_then(|v| v.as_str())
                                        .unwrap_or("");
                                    let status = record_or_attachment
                                        .get("payload")
                                        .and_then(|v| v.get("status"))
                                        .and_then(|v| v.as_str())
                                        .unwrap_or("");
                                    let context_ref = record_or_attachment
                                        .get("payload")
                                        .and_then(|v| v.get("context_ref"))
                                        .and_then(|v| v.as_str())
                                        .unwrap_or("");
                                    format!("{}:{}:{}:{}", event, status, context_ref, endorser_id)
                                }
                                _ => {
                                    let checksum = record_or_attachment
                                        .get("checksum")
                                        .and_then(|v| v.as_str())
                                        .unwrap_or("");
                                    format!("{}:{}", checksum, endorser_id)
                                }
                            };

                            let inputs = ExternalIdentityInputs {
                                endorser_id: endorser_id.to_string(),
                                root_fingerprint: root_fingerprint.to_string(),
                                cert_chain_der,
                                signature: signature.to_string(),
                                expected_payload,
                                trusted_fingerprints: options.trusted_external_fingerprints.clone(),
                            };

                            let result = verify_external_identity(&inputs);
                            if !result.ok {
                                LukuFile::push_issue(
                                    issues,
                                    debug_logging,
                                    Some(context),
                                    VerificationIssue {
                                        code: "EXTERNAL_IDENTITY_VERIFICATION_FAILED".to_string(),
                                        message: format!(
                                            "External identity verification failed: {}",
                                            result.reason.unwrap_or_default()
                                        ),
                                        criticality: Criticality::Critical,
                                    },
                                );
                            }
                        }
                    }

                    verify_ext(
                        record,
                        r#type,
                        &options,
                        debug_logging,
                        record_context.as_str(),
                        &mut issues,
                    );

                    if let Some(attachments) = record.get("attachments").and_then(|v| v.as_array())
                    {
                        for (attachment_index, attachment) in attachments.iter().enumerate() {
                            let attachment_context =
                                format!("{record_context} attachment[{attachment_index}]");
                            verify_ext(
                                attachment,
                                "attachment",
                                &options,
                                debug_logging,
                                attachment_context.as_str(),
                                &mut issues,
                            );
                        }
                    }

                    if !is_aux_record {
                        if let Some(last_sync_utc) = record
                            .get("identity")
                            .and_then(|i| i.get("last_sync_utc"))
                            .and_then(|v| v.as_i64())
                        {
                            if let Some(current_time) = timestamp {
                                if last_sync_utc.is_positive()
                                    && last_sync_utc as u64 > current_time
                                {
                                    Self::push_issue(&mut issues, debug_logging, Some(record_context.as_str()), VerificationIssue {
                                        code: "LAST_SYNC_AFTER_RECORD".to_string(),
                                        message: format!(
                                            "Device {} reports last_sync_utc {} after record timestamp {}.",
                                            device_id, last_sync_utc, current_time
                                        ),
                                        criticality: Criticality::Critical,
                                    });
                                }
                            }
                        }
                    }

                    // Signature verification
                    if !sig.is_empty() && !canonical.is_empty() {
                        match BASE64.decode(public_key) {
                            Ok(pubkey_bytes) => {
                                if pubkey_bytes.len() < 32 {
                                    if debug_logging {
                                        Self::debug_log(format!(
                                            "{record_context} record_verify public_key_decoded_len={} expected_at_least=32",
                                            pubkey_bytes.len()
                                        ));
                                    }
                                } else {
                                    match BASE64.decode(sig) {
                                        Ok(sig_bytes) => match VerifyingKey::from_bytes(
                                            pubkey_bytes[..32].try_into().unwrap_or(&[0u8; 32]),
                                        ) {
                                            Ok(verifying_key) => {
                                                match Signature::from_slice(&sig_bytes) {
                                                    Ok(signature) => {
                                                        if verifying_key
                                                            .verify(
                                                                canonical.as_bytes(),
                                                                &signature,
                                                            )
                                                            .is_err()
                                                        {
                                                            Self::push_issue(&mut issues, debug_logging, Some(record_context.as_str()), VerificationIssue {
                                                            code: "RECORD_SIGNATURE_INVALID".to_string(),
                                                            message: format!("Invalid signature for record type {} on device {}.", r#type, device_id),
                                                            criticality: Criticality::Critical,
                                                        });
                                                        }
                                                    }
                                                    Err(error) => {
                                                        if debug_logging {
                                                            Self::debug_log(format!(
                                                            "{record_context} record_verify signature_decode_error={error}"
                                                        ));
                                                        }
                                                        Self::push_issue(&mut issues, debug_logging, Some(record_context.as_str()), VerificationIssue {
                                                            code: "RECORD_SIGNATURE_INVALID".to_string(),
                                                            message: format!("Signature decode error for record type {} on device {}.", r#type, device_id),
                                                            criticality: Criticality::Critical,
                                                        });
                                                    }
                                                }
                                            }
                                            Err(error) => {
                                                if debug_logging {
                                                    Self::debug_log(format!(
                                                        "{record_context} record_verify public_key_parse_error={error}"
                                                    ));
                                                }
                                                Self::push_issue(&mut issues, debug_logging, Some(record_context.as_str()), VerificationIssue {
                                                    code: "RECORD_SIGNATURE_INVALID".to_string(),
                                                    message: format!("Public key parse error for record type {} on device {}.", r#type, device_id),
                                                    criticality: Criticality::Critical,
                                                });
                                            }
                                        },
                                        Err(error) => {
                                            if debug_logging {
                                                Self::debug_log(format!(
                                                    "{record_context} record_verify signature_base64_error={error}"
                                                ));
                                            }
                                            Self::push_issue(&mut issues, debug_logging, Some(record_context.as_str()), VerificationIssue {
                                                code: "RECORD_SIGNATURE_INVALID".to_string(),
                                                message: format!("Signature base64 decode error for record type {} on device {}.", r#type, device_id),
                                                criticality: Criticality::Critical,
                                            });
                                        }
                                    }
                                }
                            }
                            Err(error) => {
                                if debug_logging {
                                    Self::debug_log(format!(
                                        "{record_context} record_verify public_key_base64_error={error}"
                                    ));
                                }
                                Self::push_issue(&mut issues, debug_logging, Some(record_context.as_str()), VerificationIssue {
                                    code: "RECORD_SIGNATURE_INVALID".to_string(),
                                    message: format!("Public key base64 decode error for record type {} on device {}.", r#type, device_id),
                                    criticality: Criticality::Critical,
                                });
                            }
                        }
                    } else if canonical.is_empty() {
                        Self::push_issue(
                            &mut issues,
                            debug_logging,
                            Some(record_context.as_str()),
                            VerificationIssue {
                                code: "RECORD_CANONICAL_MISSING".to_string(),
                                message: format!(
                                "Record type {} on device {} does not include a canonical_string.",
                                r#type, device_id
                            ),
                                criticality: if is_compat_attachment {
                                    Criticality::Warning
                                } else {
                                    Criticality::Critical
                                },
                            },
                        );
                    } else if sig.is_empty() {
                        Self::push_issue(
                            &mut issues,
                            debug_logging,
                            Some(record_context.as_str()),
                            VerificationIssue {
                                code: "RECORD_SIGNATURE_MISSING".to_string(),
                                message: format!(
                                    "Record type {} on device {} is missing a signature.",
                                    r#type, device_id
                                ),
                                criticality: if is_compat_attachment {
                                    Criticality::Warning
                                } else {
                                    Criticality::Critical
                                },
                            },
                        );
                    }

                    if !is_aux_record && !sig.is_empty() {
                        last_sigs.insert(device_id.to_string(), sig.to_string());
                    }
                    if !is_aux_record {
                        if let Some(c) = ctr {
                            last_ctrs.insert(device_id.to_string(), c);
                        }
                    }
                    if !is_aux_record {
                        if let Some(t) = timestamp {
                            last_times.insert(device_id.to_string(), t);
                        }
                    }
                }

                if matches!(r#type, "attachment" | "location" | "custody") {
                    if let Some(parent_record_id) =
                        record.get("parent_record_id").and_then(|v| v.as_str())
                    {
                        if !parent_record_id.is_empty() && !record_ids.contains(parent_record_id) {
                            Self::push_issue(
                                &mut issues,
                                debug_logging,
                                Some(record_context.as_str()),
                                VerificationIssue {
                                    code: "PARENT_RECORD_MISSING".to_string(),
                                    message: format!(
                                        "Record type {} references missing parent {}.",
                                        r#type, parent_record_id
                                    ),
                                    criticality: Criticality::Critical,
                                },
                            );
                        }
                    }
                }

                // Attachment specific checks
                if r#type == "attachment" {
                    let checksum = record
                        .get("checksum")
                        .and_then(|v| v.as_str())
                        .unwrap_or("");
                    if !checksum.is_empty() {
                        if !self.attachments.contains_key(checksum) {
                            Self::push_issue(
                                &mut issues,
                                debug_logging,
                                Some(record_context.as_str()),
                                VerificationIssue {
                                    code: "ATTACHMENT_MISSING".to_string(),
                                    message: format!(
                                        "Attachment with hash {} is missing from archive.",
                                        checksum
                                    ),
                                    criticality: Criticality::Critical,
                                },
                            );
                        } else {
                            let content = &self.attachments[checksum];
                            let mut hasher = Sha256::new();
                            hasher.update(content);
                            let actual_hash = format!("{:x}", hasher.finalize());
                            if actual_hash != checksum {
                                if debug_logging {
                                    Self::debug_log(format!(
                                        "{record_context} attachment_hash expected={} actual={}",
                                        checksum, actual_hash
                                    ));
                                }
                                Self::push_issue(
                                    &mut issues,
                                    debug_logging,
                                    Some(record_context.as_str()),
                                    VerificationIssue {
                                        code: "ATTACHMENT_CORRUPT".to_string(),
                                        message: format!(
                                            "Attachment with hash {} is corrupt (actual hash {}).",
                                            checksum, actual_hash
                                        ),
                                        criticality: Criticality::Critical,
                                    },
                                );
                            }
                        }
                    }
                }
            }
        }

        if let Some(expected_policy) = options.policy.as_ref() {
            let manifest_policy = Self::manifest_policy(&self.manifest);
            match manifest_policy.as_ref() {
                None => {
                    Self::push_issue(
                        &mut issues,
                        debug_logging,
                        Some("archive"),
                        VerificationIssue {
                            code: "POLICY_MISSING".to_string(),
                            message: format!(
                                "Archive does not declare the expected continuity policy '{}'.",
                                expected_policy.name
                            ),
                            criticality: Criticality::Warning,
                        },
                    );
                }
                Some(actual_policy) => {
                    if !expected_policy.name.trim().is_empty()
                        && !actual_policy.name.trim().is_empty()
                        && actual_policy.name != expected_policy.name
                    {
                        Self::push_issue(
                            &mut issues,
                            debug_logging,
                            Some("archive"),
                            VerificationIssue {
                                code: "POLICY_NAME_MISMATCH".to_string(),
                                message: format!(
                                    "Archive policy name '{}' does not match expected policy '{}'.",
                                    actual_policy.name, expected_policy.name
                                ),
                                criticality: Criticality::Warning,
                            },
                        );
                    }

                    if actual_policy.native_continuity_gap_seconds
                        != expected_policy.native_continuity_gap_seconds
                    {
                        Self::push_issue(
                            &mut issues,
                            debug_logging,
                            Some("archive"),
                            VerificationIssue {
                                code: "POLICY_THRESHOLD_MISMATCH".to_string(),
                                message: format!(
                                    "Archive continuity threshold {:?} does not match expected threshold {:?}.",
                                    actual_policy.native_continuity_gap_seconds,
                                    expected_policy.native_continuity_gap_seconds
                                ),
                                criticality: Criticality::Warning,
                            },
                        );
                    }
                }
            }
        }

        if let Some(threshold) = policy.as_ref().and_then(|p| p.native_continuity_gap_seconds) {
            for (block_index, block) in self.blocks.iter().enumerate() {
                let mut last_native_timestamp_utc: Option<u64> = None;
                for (record_index, record) in block.batch.iter().enumerate() {
                    let record_type =
                        record.get("type").and_then(Value::as_str).unwrap_or("unknown");
                    if Self::is_aux_record_type(record_type) {
                        continue;
                    }

                    if let Some(timestamp_utc) = Self::record_timestamp_utc(record) {
                        if let Some(previous_timestamp_utc) = last_native_timestamp_utc {
                            if timestamp_utc > previous_timestamp_utc
                                && timestamp_utc - previous_timestamp_utc > threshold
                            {
                                let record_context = Self::debug_record_context(
                                    block_index,
                                    record_index,
                                    record,
                                    block,
                                );
                                Self::push_issue(
                                    &mut issues,
                                    debug_logging,
                                    Some(record_context.as_str()),
                                    VerificationIssue {
                                        code: "POLICY_NATIVE_TIME_GAP_UNSPLIT".to_string(),
                                        message: format!(
                                            "Native time gap of {} seconds exceeds expected policy threshold {} within block {}.",
                                            timestamp_utc - previous_timestamp_utc,
                                            threshold,
                                            block_index
                                        ),
                                        criticality: Criticality::Warning,
                                    },
                                );
                            }
                        }
                        last_native_timestamp_utc = Some(timestamp_utc);
                    }
                }
            }
        }

        if debug_logging {
            let critical = issues
                .iter()
                .filter(|issue| issue.criticality == Criticality::Critical)
                .count();
            let warning = issues
                .iter()
                .filter(|issue| issue.criticality == Criticality::Warning)
                .count();
            let info = issues
                .iter()
                .filter(|issue| issue.criticality == Criticality::Info)
                .count();
            Self::debug_log(format!(
                "verify complete issues={} critical={} warning={} info={}",
                issues.len(),
                critical,
                warning,
                info
            ));
        }

        issues
    }

    pub fn add_attachment(&mut self, content: Vec<u8>) -> String {
        let mut hasher = Sha256::new();
        hasher.update(&content);
        let hash = format!("{:x}", hasher.finalize());
        self.attachments.insert(hash.clone(), content);
        hash
    }

    pub fn build_block_from_records(
        block_id: u32,
        timestamp_utc: u64,
        previous_block_hash: Option<String>,
        default_device: &LukuDeviceIdentity,
        batch: Vec<Value>,
        common_certs: Option<&HashMap<String, String>>,
    ) -> LukuBlock {
        fn common_record_value(
            records: &[Value],
            extractor: impl Fn(&Value) -> Option<String>,
        ) -> Option<String> {
            let mut values = records.iter().filter_map(extractor);
            let first = values.next()?;
            if values.all(|value| value == first) {
                Some(first)
            } else {
                None
            }
        }

        let device = batch
            .iter()
            .find_map(|record| record.get("device").and_then(Value::as_object))
            .map(|device| LukuDeviceIdentity {
                device_id: device
                    .get("device_id")
                    .and_then(Value::as_str)
                    .unwrap_or(default_device.device_id.as_str())
                    .to_string(),
                public_key: device
                    .get("public_key")
                    .and_then(Value::as_str)
                    .unwrap_or(default_device.public_key.as_str())
                    .to_string(),
            })
            .unwrap_or_else(|| default_device.clone());

        let attestation_root_fingerprint = common_record_value(&batch, |record| {
            record
                .get("identity")
                .and_then(|identity| identity.get("attestation_root_fingerprint"))
                .and_then(Value::as_str)
                .map(str::to_string)
        })
        .or_else(|| {
            common_certs
                .and_then(|c| c.get("attestation_root_fingerprint"))
                .cloned()
        });

        let heartbeat_root_fingerprint = common_record_value(&batch, |record| {
            record
                .get("identity")
                .and_then(|identity| identity.get("heartbeat_root_fingerprint"))
                .and_then(Value::as_str)
                .map(str::to_string)
        })
        .or_else(|| {
            common_certs
                .and_then(|c| c.get("heartbeat_root_fingerprint"))
                .cloned()
        });

        let batch_hash = Self::batch_hash(&batch);
        let block_canonical_string = Self::block_canonical_string(
            block_id,
            timestamp_utc,
            previous_block_hash.as_deref(),
            &device,
            attestation_root_fingerprint.as_deref(),
            heartbeat_root_fingerprint.as_deref(),
            &batch_hash,
        );
        let block_hash = Self::block_hash(&block_canonical_string);

        LukuBlock {
            block_id,
            timestamp_utc,
            previous_block_hash,
            device,
            attestation_dac_der: common_record_value(&batch, |record| {
                record
                    .get("identity")
                    .and_then(|identity| identity.get("dac_der"))
                    .and_then(Value::as_str)
                    .map(str::to_string)
            })
            .or_else(|| common_certs.and_then(|c| c.get("dac_der")).cloned()),
            attestation_manufacturer_der: common_record_value(&batch, |record| {
                record
                    .get("identity")
                    .and_then(|identity| identity.get("attestation_manufacturer_der"))
                    .and_then(Value::as_str)
                    .map(str::to_string)
            })
            .or_else(|| {
                common_certs
                    .and_then(|c| c.get("attestation_manufacturer_der"))
                    .cloned()
            }),
            attestation_intermediate_der: common_record_value(&batch, |record| {
                record
                    .get("identity")
                    .and_then(|identity| identity.get("attestation_intermediate_der"))
                    .and_then(Value::as_str)
                    .map(str::to_string)
            })
            .or_else(|| {
                common_certs
                    .and_then(|c| c.get("attestation_intermediate_der"))
                    .cloned()
            }),
            attestation_root_fingerprint,
            heartbeat_slac_der: common_record_value(&batch, |record| {
                record
                    .get("identity")
                    .and_then(|identity| identity.get("slac_der"))
                    .and_then(Value::as_str)
                    .map(str::to_string)
            })
            .or_else(|| common_certs.and_then(|c| c.get("slac_der")).cloned()),
            heartbeat_der: common_record_value(&batch, |record| {
                record
                    .get("identity")
                    .and_then(|identity| identity.get("heartbeat_der"))
                    .and_then(Value::as_str)
                    .map(str::to_string)
            })
            .or_else(|| common_certs.and_then(|c| c.get("heartbeat_der")).cloned()),
            heartbeat_intermediate_der: common_record_value(&batch, |record| {
                record
                    .get("identity")
                    .and_then(|identity| identity.get("heartbeat_intermediate_der"))
                    .and_then(Value::as_str)
                    .map(str::to_string)
            })
            .or_else(|| {
                common_certs
                    .and_then(|c| c.get("heartbeat_intermediate_der"))
                    .cloned()
            }),
            heartbeat_root_fingerprint,
            batch,
            batch_hash,
            block_canonical_string,
            block_hash,
        }
    }

    pub fn export_blocks_with_manifest<P: AsRef<Path>>(
        path: P,
        mut blocks: Vec<LukuBlock>,
        attachments: HashMap<String, Vec<u8>>,
        description: String,
        manifest_extra: HashMap<String, Value>,
        exporter_key: &ed25519_dalek::SigningKey,
        options: LukuExportOptions,
    ) -> Result<(), String> {
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let mut manifest = LukuManifest {
            r#type: "LukuArchive".to_string(),
            version: "1.0.0".to_string(),
            created_at_utc: timestamp,
            description,
            blocks_hash: String::new(),
            native_continuity_gap_seconds: None,
            extra: manifest_extra,
        };

        Self::apply_export_options(&mut manifest, &options)?;

        manifest
            .extra
            .entry("exporter_public_key".to_string())
            .or_insert_with(|| {
                Value::String(BASE64.encode(exporter_key.verifying_key().as_bytes()))
            });
        manifest
            .extra
            .entry("exporter_alg".to_string())
            .or_insert_with(|| Value::String("ED25519".to_string()));

        let mut prev_hash = None;
        for (index, block) in blocks.iter_mut().enumerate() {
            block.block_id = index as u32;
            block.previous_block_hash = prev_hash.clone();
            if block.timestamp_utc == 0 {
                block.timestamp_utc = timestamp;
            }
            let (batch_hash, block_canonical_string, block_hash) =
                Self::recompute_block_fields(block);
            block.batch_hash = batch_hash;
            block.block_canonical_string = block_canonical_string;
            block.block_hash = block_hash;
            prev_hash = Some(block.block_hash.clone());
        }

        let blocks_content: String = blocks
            .iter()
            .map(|b| serde_json::to_string(b).unwrap())
            .collect::<Vec<_>>()
            .join("\n")
            + "\n";

        let mut hasher = Sha256::new();
        hasher.update(blocks_content.as_bytes());
        manifest.blocks_hash = format!("{:x}", hasher.finalize());

        let manifest_json = serde_json::to_string_pretty(&manifest).unwrap();
        let manifest_sig = BASE64.encode(exporter_key.sign(manifest_json.as_bytes()).to_bytes());

        let luku = Self {
            manifest,
            manifest_sig,
            blocks,
            attachments,
            path: None,
            manifest_raw: Some(manifest_json),
            blocks_raw: Some(blocks_content),
            mimetype_is_first: true,
            mimetype_is_stored: true,
        };

        luku.save_to(path)
    }

    pub fn export<P: AsRef<Path>>(
        records: Vec<Value>,
        path: P,
        device: LukuDeviceIdentity,
        attachments: HashMap<String, Vec<u8>>,
        exporter_key: &ed25519_dalek::SigningKey,
        options: LukuExportOptions,
    ) -> Result<(), String> {
        Self::export_with_identity(records, path, device, attachments, exporter_key, options)
    }

    pub fn export_with_identity<P: AsRef<Path>>(
        records: Vec<Value>,
        path: P,
        device: LukuDeviceIdentity,
        attachments: HashMap<String, Vec<u8>>,
        exporter_key: &ed25519_dalek::SigningKey,
        options: LukuExportOptions,
    ) -> Result<(), String> {
        let record_count = records.len();
        let blocks = Self::build_blocks_for_export(records, &device, options.policy.as_ref());

        Self::export_blocks_with_manifest(
            path,
            blocks,
            attachments,
            format!("Exported {} records", record_count),
            HashMap::new(),
            exporter_key,
            options,
        )
    }

    pub fn append(
        &mut self,
        records: Vec<Value>,
        device: LukuDeviceIdentity,
        exporter_key: &ed25519_dalek::SigningKey,
    ) -> Result<(), String> {
        // Create a new block
        let last_block = self.blocks.last();
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let block_id = self.blocks.len() as u32;
        let new_block = Self::build_block_from_records(
            block_id,
            timestamp,
            last_block.map(|b| b.block_hash.clone()),
            &device,
            records,
            None,
        );

        self.blocks.push(new_block);

        // Update manifest
        let blocks_content: String = self
            .blocks
            .iter()
            .map(|b| serde_json::to_string(b).unwrap())
            .collect::<Vec<_>>()
            .join("\n")
            + "\n";

        let mut hasher = Sha256::new();
        hasher.update(blocks_content.as_bytes());
        self.manifest.blocks_hash = format!("{:x}", hasher.finalize());
        self.manifest.created_at_utc = timestamp;

        let manifest_json = serde_json::to_string_pretty(&self.manifest).unwrap();
        let manifest_sig_bytes = exporter_key.sign(manifest_json.as_bytes()).to_bytes();
        self.manifest_sig = BASE64.encode(manifest_sig_bytes);
        self.manifest_raw = Some(manifest_json);
        self.blocks_raw = Some(blocks_content);

        if let Some(path) = &self.path {
            self.save_to(path)?;
        }

        Ok(())
    }

    pub fn merge(
        &mut self,
        other: LukuFile,
        exporter_key: &ed25519_dalek::SigningKey,
    ) -> Result<(), String> {
        for mut block in other.blocks {
            block.block_id = self.blocks.len() as u32;
            block.previous_block_hash = self.blocks.last().map(|b| b.block_hash.clone());
            let (batch_hash, block_canonical_string, block_hash) =
                Self::recompute_block_fields(&block);
            block.batch_hash = batch_hash;
            block.block_canonical_string = block_canonical_string;
            block.block_hash = block_hash;

            self.blocks.push(block);
        }

        for (hash, content) in other.attachments {
            self.attachments.insert(hash, content);
        }

        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let blocks_content: String = self
            .blocks
            .iter()
            .map(|b| serde_json::to_string(b).unwrap())
            .collect::<Vec<_>>()
            .join("\n")
            + "\n";

        let mut hasher = Sha256::new();
        hasher.update(blocks_content.as_bytes());
        self.manifest.blocks_hash = format!("{:x}", hasher.finalize());
        self.manifest.created_at_utc = timestamp;

        let manifest_json = serde_json::to_string_pretty(&self.manifest).unwrap();
        let manifest_sig_bytes = exporter_key.sign(manifest_json.as_bytes()).to_bytes();
        self.manifest_sig = BASE64.encode(manifest_sig_bytes);
        self.manifest_raw = Some(manifest_json);
        self.blocks_raw = Some(blocks_content);

        if let Some(path) = &self.path {
            self.save_to(path)?;
        }

        Ok(())
    }

    pub fn save_to<P: AsRef<Path>>(&self, path: P) -> Result<(), String> {
        let file = File::create(&path).map_err(|e| e.to_string())?;
        let mut zip = ZipWriter::new(file);

        let options =
            FileOptions::<()>::default().compression_method(zip::CompressionMethod::Stored);

        zip.start_file("mimetype", options)
            .map_err(|e| e.to_string())?;
        zip.write_all(LUKU_MIMETYPE.as_bytes())
            .map_err(|e| e.to_string())?;

        let blocks_content = self.blocks_raw.clone().unwrap_or_else(|| {
            self.blocks
                .iter()
                .map(|b| serde_json::to_string(b).unwrap())
                .collect::<Vec<_>>()
                .join("\n")
                + "\n"
        });

        zip.start_file(
            "blocks.jsonl",
            FileOptions::<()>::default().compression_method(zip::CompressionMethod::Deflated),
        )
        .map_err(|e| e.to_string())?;
        zip.write_all(blocks_content.as_bytes())
            .map_err(|e| e.to_string())?;

        zip.start_file(
            "manifest.json",
            FileOptions::<()>::default().compression_method(zip::CompressionMethod::Deflated),
        )
        .map_err(|e| e.to_string())?;
        let manifest_json = self
            .manifest_raw
            .clone()
            .unwrap_or_else(|| serde_json::to_string_pretty(&self.manifest).unwrap());
        zip.write_all(manifest_json.as_bytes())
            .map_err(|e| e.to_string())?;

        zip.start_file(
            "manifest.sig",
            FileOptions::<()>::default().compression_method(zip::CompressionMethod::Deflated),
        )
        .map_err(|e| e.to_string())?;
        zip.write_all(self.manifest_sig.as_bytes())
            .map_err(|e| e.to_string())?;

        for (hash, content) in &self.attachments {
            let dir1 = if hash.len() >= 2 { &hash[0..2] } else { "00" };
            let dir2 = if hash.len() >= 4 { &hash[2..4] } else { "00" };
            let path = format!("attachments/{}/{}/{}", dir1, dir2, hash);
            zip.start_file(
                path,
                FileOptions::<()>::default().compression_method(zip::CompressionMethod::Deflated),
            )
            .map_err(|e| e.to_string())?;
            zip.write_all(content).map_err(|e| e.to_string())?;
        }

        zip.finish().map_err(|e| e.to_string())?;
        Ok(())
    }
}

fn is_safe_zip_entry_name(name: &str) -> bool {
    if name.is_empty() || name.starts_with('/') || name.starts_with('\\') || name.contains('\\') {
        return false;
    }
    name.split('/')
        .all(|part| !part.is_empty() && part != "." && part != "..")
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use std::fs;

    #[test]
    fn test_export_and_open() {
        let temp_dir = std::env::temp_dir().join("lukuid_tests");
        fs::create_dir_all(&temp_dir).unwrap();
        let luku_path = temp_dir.join("test.luku");

        let records = vec![json!({
            "type": "scan",
            "signature": "sig1",
            "canonical_string": "can1",
            "payload": {
                "ctr": 1,
                "timestamp_utc": 1000
            }
        })];

        let identity = LukuDeviceIdentity {
            device_id: "LUK-TEST".to_string(),
            public_key: BASE64.encode([0u8; 32]),
        };

        let signing_key = ed25519_dalek::SigningKey::from_bytes(&[7u8; 32]);

        LukuFile::export(records, &luku_path, identity, HashMap::new(), &signing_key, LukuExportOptions::default()).unwrap();

        let luku = LukuFile::open(&luku_path).unwrap();
        assert_eq!(luku.manifest.version, "1.0.0");
        assert_eq!(luku.blocks.len(), 1);
        assert_eq!(luku.blocks[0].batch.len(), 1);

        let issues = luku.verify(LukuVerifyOptions {
            allow_untrusted_roots: true,
            skip_certificate_temporal_checks: true,
            trusted_external_fingerprints: Vec::new(),
            trust_profile: "dev".to_string(),
            policy: None,
            require_continuity: false,
        });

        assert!(
            issues.iter().all(|issue| {
                issue.code == "BLOCK_HASH_MISSING" || issue.code == "MANIFEST_SIGNATURE_MISSING" || issue.code == "RECORD_SIGNATURE_INVALID"
            }),
            "unexpected issues: {:?}",
            issues
        );
    }

    #[test]
    fn test_build_block_uses_common_certs_fallback() {
        let identity = LukuDeviceIdentity {
            device_id: "LUK-TEST".to_string(),
            public_key: BASE64.encode([0u8; 32]),
        };

        let records = vec![json!({
            "type": "scan",
            "signature": "sig1",
            "canonical_string": "can1",
            "payload": {
                "ctr": 1,
                "timestamp_utc": 1000
            }
        })];

        let mut common_certs = HashMap::new();
        common_certs.insert("dac_der".to_string(), "mock_dac_der".to_string());
        common_certs.insert(
            "attestation_root_fingerprint".to_string(),
            "mock_fingerprint".to_string(),
        );

        let block = LukuFile::build_block_from_records(
            0,
            1000,
            None,
            &identity,
            records,
            Some(&common_certs),
        );

        assert_eq!(block.attestation_dac_der, Some("mock_dac_der".to_string()));
        assert_eq!(
            block.attestation_root_fingerprint,
            Some("mock_fingerprint".to_string())
        );
    }
}
