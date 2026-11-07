// Every device-signed record binds the firmware that signed it (dotluku "Firmware Binding").
// The samples are real exports from the test-PKI Environment card and Animal Reader.
use lukuid_sdk::luku::{LukuFile, LukuVerifyOptions};
use serde_json::{Map, Value};
use std::path::PathBuf;

const SAMPLES: [&str; 2] = ["firmware-bound-environment.luku", "firmware-bound-reader.luku"];

fn sample(name: &str) -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../../samples/dotluku/test/1.1.0").join(name)
}

fn options() -> LukuVerifyOptions {
    LukuVerifyOptions { trust_profile: "test".to_string(), ..LukuVerifyOptions::default() }
}

fn critical_codes(luku: &LukuFile) -> Vec<String> {
    luku.verify(options())
        .into_iter()
        .filter(|i| matches!(i.criticality, lukuid_sdk::luku::Criticality::Critical))
        .map(|i| i.code)
        .collect()
}

/// Where the record keeps `firmware`, and its index in the canonical string.
fn firmware_slot(record_type: &str) -> (bool, usize) {
    match record_type {
        "scan" => (true, 9),
        "environment" => (true, 7),
        "attachment" | "custody" => (false, 7),
        "location" => (false, 6),
        other => panic!("unexpected record type {other}"),
    }
}

fn holder<'a>(record: &'a mut Map<String, Value>, in_payload: bool) -> &'a mut Map<String, Value> {
    if in_payload { record.get_mut("payload").and_then(Value::as_object_mut).unwrap() } else { record }
}

/// Opens the sample, applies `edit` to record `index`, and returns its critical codes.
fn tampered(name: &str, index: usize, edit: impl Fn(&mut Map<String, Value>, bool, usize)) -> Vec<String> {
    let mut luku = LukuFile::open(sample(name)).unwrap();
    let record = luku.blocks[0].batch[index].as_object_mut().unwrap();
    let (in_payload, slot) = firmware_slot(record["type"].as_str().unwrap());
    edit(record, in_payload, slot);
    critical_codes(&luku)
}

fn set_canonical_slot(record: &mut Map<String, Value>, slot: usize, value: Option<&str>) {
    let mut parts: Vec<String> = record["canonical_string"].as_str().unwrap().split(':').map(str::to_string).collect();
    match value {
        Some(v) => parts[slot] = v.to_string(),
        None => {
            parts.remove(slot);
        }
    }
    record.insert("canonical_string".to_string(), Value::String(parts.join(":")));
}

#[test]
fn firmware_bound_samples_verify() {
    for name in SAMPLES {
        let luku = LukuFile::open(sample(name)).unwrap();
        assert!(critical_codes(&luku).is_empty(), "{name}: {:?}", critical_codes(&luku));
    }
}

#[test]
fn every_record_signs_its_firmware_in_the_prefix() {
    let mut seen = Vec::new();
    for name in SAMPLES {
        let mut luku = LukuFile::open(sample(name)).unwrap();
        for record in luku.blocks[0].batch.iter_mut() {
            let record = record.as_object_mut().unwrap();
            let record_type = record["type"].as_str().unwrap().to_string();
            let (in_payload, slot) = firmware_slot(&record_type);
            let canonical = record["canonical_string"].as_str().unwrap().to_string();
            let firmware = holder(record, in_payload)["firmware"].as_str().unwrap().to_string();
            assert_eq!(firmware, "v1.0.0", "{name} {record_type}");
            assert_eq!(canonical.split(':').nth(slot), Some(firmware.as_str()), "{name} {record_type}: {canonical}");
            seen.push(record_type);
        }
    }
    seen.sort();
    assert_eq!(seen, ["attachment", "attachment", "custody", "custody", "environment", "location", "location", "scan"]);
}

#[test]
fn a_changed_firmware_field_is_a_canonical_mismatch() {
    for name in SAMPLES {
        for index in 0..4 {
            let codes = tampered(name, index, |r, in_payload, _| {
                holder(r, in_payload).insert("firmware".into(), Value::String("v9.9.9".into()));
            });
            assert!(codes.contains(&"RECORD_CANONICAL_MISMATCH".to_string()), "{name}[{index}]: {codes:?}");
            assert!(!codes.contains(&"RECORD_SIGNATURE_INVALID".to_string()), "{name}[{index}]: {codes:?}");
            let codes = tampered(name, index, |r, in_payload, _| {
                holder(r, in_payload).remove("firmware");
            });
            assert!(codes.contains(&"RECORD_CANONICAL_MISMATCH".to_string()), "{name}[{index}] removed: {codes:?}");
        }
    }
}

#[test]
fn a_firmware_changed_in_the_signed_string_fails_the_signature() {
    for name in SAMPLES {
        for index in 0..4 {
            let codes = tampered(name, index, |r, in_payload, slot| {
                holder(r, in_payload).insert("firmware".into(), Value::String("v9.9.9".into()));
                set_canonical_slot(r, slot, Some("v9.9.9"));
            });
            assert!(codes.contains(&"RECORD_SIGNATURE_INVALID".to_string()), "{name}[{index}]: {codes:?}");
            assert!(!codes.contains(&"RECORD_CANONICAL_MISMATCH".to_string()), "{name}[{index}]: {codes:?}");
        }
    }
}

#[test]
fn a_firmware_bound_record_cannot_pass_as_one_from_before_the_rule() {
    // Removing the slot and the field gives the older layout; the device signed the slot.
    for name in SAMPLES {
        for index in 0..4 {
            if LukuFile::open(sample(name)).unwrap().blocks[0].batch[index]["type"] == "scan" {
                continue; // scan has always had a firmware slot
            }
            let codes = tampered(name, index, |r, in_payload, slot| {
                holder(r, in_payload).remove("firmware");
                set_canonical_slot(r, slot, None);
            });
            assert!(codes.contains(&"RECORD_SIGNATURE_INVALID".to_string()), "{name}[{index}]: {codes:?}");
            assert!(!codes.contains(&"RECORD_CANONICAL_MISMATCH".to_string()), "{name}[{index}]: {codes:?}");
        }
    }
}

#[test]
fn records_from_before_firmware_binding_verify_with_a_warning() {
    let legacy = LukuFile::open(sample("first-passable-verification-sample.luku")).unwrap();
    let issues = legacy.verify(options());
    assert!(!issues.iter().any(|i| matches!(i.criticality, lukuid_sdk::luku::Criticality::Critical)), "{issues:?}");
    let warned: Vec<_> = issues.iter().filter(|i| i.code == "RECORD_FIRMWARE_MISSING").collect();
    assert!(!warned.is_empty());
    assert!(warned.iter().all(|i| matches!(i.criticality, lukuid_sdk::luku::Criticality::Warning)));
    for name in SAMPLES {
        let issues = LukuFile::open(sample(name)).unwrap().verify(options());
        assert!(!issues.iter().any(|i| i.code == "RECORD_FIRMWARE_MISSING"), "{name}: {issues:?}");
    }
}

#[test]
fn a_stripped_firmware_is_flagged_as_missing() {
    for name in SAMPLES {
        for index in 0..4 {
            let mut luku = LukuFile::open(sample(name)).unwrap();
            let record = luku.blocks[0].batch[index].as_object_mut().unwrap();
            let (in_payload, _) = firmware_slot(record["type"].as_str().unwrap());
            holder(record, in_payload).remove("firmware");
            assert!(luku.verify(options()).iter().any(|i| i.code == "RECORD_FIRMWARE_MISSING"), "{name}[{index}]");
        }
    }
}
