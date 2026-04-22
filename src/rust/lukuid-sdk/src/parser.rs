// SPDX-License-Identifier: Apache-2.0
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::path::Path;

use crate::luku::{Criticality, LukuFile, LukuVerifyOptions};

#[derive(Debug, Serialize, Deserialize)]
pub struct LukuParseResult {
    pub verified: bool,
    pub items: Vec<LukuItemResult>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LukuItemResult {
    pub r#type: String,
    pub verified: bool,
    pub payload: Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub errors: Option<Vec<String>>,
}

pub fn parse<P: AsRef<Path>>(path: P) -> Result<LukuParseResult, String> {
    let luku = LukuFile::open(path)?;
    Ok(parse_luku_file(&luku))
}

pub fn parse_bytes(data: &[u8]) -> Result<LukuParseResult, String> {
    let luku = LukuFile::open_bytes(data)?;
    Ok(parse_luku_file(&luku))
}

fn parse_luku_file(luku: &LukuFile) -> LukuParseResult {
    let issues = luku.verify(LukuVerifyOptions::default());
    let has_critical = issues
        .iter()
        .any(|issue| issue.criticality == Criticality::Critical);

    let items = luku
        .blocks
        .iter()
        .flat_map(|block| block.batch.iter())
        .map(|record| {
            let record_type = record
                .get("type")
                .and_then(Value::as_str)
                .unwrap_or("unknown")
                .to_string();
            let record_signature = record
                .get("signature")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_string();
            let record_id = [
                "scan_id",
                "event_id",
                "attachment_id",
                "custody_id",
                "parent_record_id",
            ]
            .iter()
            .find_map(|key| record.get(*key).and_then(Value::as_str).map(str::to_string));

            let errors = issues
                .iter()
                .filter_map(|issue| {
                    let message_matches_signature = !record_signature.is_empty()
                        && issue.message.contains(record_signature.as_str());
                    let message_matches_id = record_id
                        .as_ref()
                        .map(|value| issue.message.contains(value.as_str()))
                        .unwrap_or(false);
                    let message_matches_type = issue
                        .message
                        .contains(format!("type {}", record_type).as_str());

                    if message_matches_signature || message_matches_id || message_matches_type {
                        Some(format!("[{}] {}", issue.code, issue.message))
                    } else {
                        None
                    }
                })
                .collect::<Vec<_>>();

            let verified = !has_critical
                && !errors.iter().any(|error| {
                    error.contains("RECORD_")
                        || error.contains("ATTACHMENT_")
                        || error.contains("PARENT_RECORD_MISSING")
                });

            LukuItemResult {
                r#type: record_type,
                verified,
                payload: record.clone(),
                errors: if errors.is_empty() {
                    None
                } else {
                    Some(errors)
                },
            }
        })
        .collect::<Vec<_>>();

    let verified = !items.is_empty() && items.iter().all(|item| item.verified);

    LukuParseResult { verified, items }
}
