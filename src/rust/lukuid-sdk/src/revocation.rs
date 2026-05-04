// SPDX-License-Identifier: Apache-2.0
use std::collections::HashSet;
use std::sync::{Arc, RwLock};
use std::time::{Duration, SystemTime};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use crate::LukuidSdkOptions;
use x509_parser::prelude::*;
use sha2::{Digest, Sha256};

#[derive(Debug, Serialize, Deserialize)]
struct CrlCache {
    last_sync: Option<String>,
    fingerprints: Vec<String>,
}

pub struct RevocationManager {
    options: LukuidSdkOptions,
    revoked_fingerprints: Arc<RwLock<HashSet<String>>>,
    last_sync_date: Arc<RwLock<Option<String>>>,
    stop_tx: Option<tokio::sync::oneshot::Sender<()>>,
}

impl RevocationManager {
    pub fn new(options: LukuidSdkOptions) -> Self {
        let revoked_fingerprints = Arc::new(RwLock::new(HashSet::new()));
        let last_sync_date = Arc::new(RwLock::new(None));

        let mut manager = Self {
            options: options.clone(),
            revoked_fingerprints,
            last_sync_date,
            stop_tx: None,
        };

        manager.load_from_cache();
        manager.start_auto_refresh();
        manager
    }

    fn get_cache_file(&self) -> Option<PathBuf> {
        if self.options.crl_memory_only {
            return None;
        }

        let mut path = if let Some(custom) = &self.options.crl_cache_path {
            PathBuf::from(custom)
        } else {
            dirs::home_dir()?.join(".lukuid")
        };

        if !path.exists() {
            let _ = fs::create_dir_all(&path);
        }
        Some(path.join("lukuid_crl.json"))
    }

    fn load_from_cache(&mut self) {
        if let Some(file_path) = self.get_cache_file() {
            if let Ok(content) = fs::read_to_string(file_path) {
                if let Ok(cache) = serde_json::from_str::<CrlCache>(&content) {
                    *self.last_sync_date.write().unwrap() = cache.last_sync;
                    let mut fingerprints = self.revoked_fingerprints.write().unwrap();
                    for f in cache.fingerprints {
                        fingerprints.insert(f.to_lowercase());
                    }
                }
            }
        }
    }

    fn save_to_cache(&self) {
        if let Some(file_path) = self.get_cache_file() {
            let cache = CrlCache {
                last_sync: self.last_sync_date.read().unwrap().clone(),
                fingerprints: self.revoked_fingerprints.read().unwrap().iter().cloned().collect(),
            };
            if let Ok(content) = serde_json::to_string(&cache) {
                let _ = fs::write(file_path, content);
            }
        }
    }

    fn start_auto_refresh(&mut self) {
        let interval_hours = self.options.crl_refresh_interval_hours;
        if interval_hours <= 0 {
            return;
        }

        let (tx, mut rx) = tokio::sync::oneshot::channel();
        self.stop_tx = Some(tx);

        let revoked_fingerprints = Arc::clone(&self.revoked_fingerprints);
        let last_sync_date = Arc::clone(&self.last_sync_date);
        let options = self.options.clone();
        let cache_file = self.get_cache_file();

        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(interval_hours as u64 * 3600));
            loop {
                tokio::select! {
                    _ = interval.tick() => {
                        let _ = Self::sync_internal(&options, &revoked_fingerprints, &last_sync_date, &cache_file).await;
                    }
                    _ = &mut rx => break,
                }
            }
        });
    }

    pub async fn sync(&self) -> Result<(), Box<dyn std::error::Error>> {
        Self::sync_internal(&self.options, &self.revoked_fingerprints, &self.last_sync_date, &self.get_cache_file()).await
    }

    async fn sync_internal(
        options: &LukuidSdkOptions,
        revoked_fingerprints: &Arc<RwLock<HashSet<String>>>,
        last_sync_date: &Arc<RwLock<Option<String>>>,
        cache_file: &Option<PathBuf>
    ) -> Result<(), Box<dyn std::error::Error>> {
        if options.disable_external_calls {
            return Ok(());
        }

        let api_url = options.api_url.trim_end_matches('/');
        let last_sync = last_sync_date.read().unwrap().clone();
        let url = if let Some(from) = last_sync {
            format!("{}/revocations?from={}", api_url, from)
        } else {
            format!("{}/revocations", api_url)
        };

        let response = reqwest::get(&url).await?;
        if response.status() == 200 {
            let data: serde_json::Value = response.json().await?;
            if let Some(revocations) = data.get("revocations").and_then(|v| v.as_array()) {
                let mut fingerprints = revoked_fingerprints.write().unwrap();
                for item in revocations {
                    if let Some(identifier) = item.get("identifier").and_then(|v| v.as_str()) {
                        fingerprints.insert(identifier.to_lowercase());
                    }
                }
            }

            let now: DateTime<Utc> = Utc::now();
            *last_sync_date.write().unwrap() = Some(now.to_rfc3339());
            
            if let Some(file_path) = cache_file {
                let cache = CrlCache {
                    last_sync: last_sync_date.read().unwrap().clone(),
                    fingerprints: revoked_fingerprints.read().unwrap().iter().cloned().collect(),
                };
                if let Ok(content) = serde_json::to_string(&cache) {
                    let _ = fs::write(file_path, content);
                }
            }
        }
        Ok(())
    }

    pub fn is_revoked(&self, cert: &X509Certificate) -> bool {
        let fingerprint = self.get_fingerprint(cert);
        self.revoked_fingerprints.read().unwrap().contains(&fingerprint.to_lowercase())
    }

    pub fn get_fingerprint(&self, cert: &X509Certificate) -> String {
        let public_key = cert.public_key();
        let raw_bytes = public_key.raw;
        let mut hasher = Sha256::new();
        hasher.update(raw_bytes);
        hex::encode(hasher.finalize())
    }
}
