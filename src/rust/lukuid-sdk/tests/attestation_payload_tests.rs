use lukuid_sdk::attestation::{
    build_record_attestation_payload, build_record_heartbeat_payload, verify_device_attestation,
    DeviceAttestationInputs,
};
use serde_json::Value;
use std::fs;
use std::path::PathBuf;

#[test]
fn builds_record_attestation_payload() {
    assert_eq!(
        build_record_attestation_payload(
            "GC-2005-EU",
            "base64_device_public_key",
            Some(42),
            Some("LUKUID"),
            Some("env-123")
        ),
        "attestation:GC-2005-EU:base64_device_public_key:42:LUKUID:env-123"
    );
}

#[test]
fn builds_record_heartbeat_payload() {
    assert_eq!(
        build_record_heartbeat_payload("GC-2005-EU", 1770800000, Some(42), Some("env-123")),
        "heartbeat:GC-2005-EU:1770800000:42:env-123"
    );
}

fn resolve_valid_envelope() -> PathBuf {
    let mut current = std::env::current_dir().unwrap();
    loop {
        let candidate = current
            .join("samples")
            .join("envelopes")
            .join("dev")
            .join("1.0.0")
            .join("valid_envelope.json");
        if candidate.exists() {
            return candidate;
        }
        if !current.pop() {
            break;
        }
    }
    PathBuf::from("../../../samples/envelopes/dev/1.0.0/valid_envelope.json")
}

fn pem_from_der_base64(value: &str) -> String {
    let mut out = String::from("-----BEGIN CERTIFICATE-----\n");
    for chunk in value.as_bytes().chunks(64) {
        out.push_str(std::str::from_utf8(chunk).unwrap());
        out.push('\n');
    }
    out.push_str("-----END CERTIFICATE-----\n");
    out
}

#[test]
fn dac_attestation_uses_dac_start_anchor_instead_of_record_time() {
    let envelope: Value = serde_json::from_str(
        &fs::read_to_string(resolve_valid_envelope()).expect("read valid envelope"),
    )
    .expect("parse valid envelope");
    let identity = envelope.get("identity").and_then(Value::as_object).unwrap();
    let device = envelope.get("device").and_then(Value::as_object).unwrap();
    let chain = [
        envelope.get("attestation_dac_der"),
        envelope.get("attestation_manufacturer_der"),
        envelope.get("attestation_intermediate_der"),
    ]
    .iter()
    .filter_map(|value| value.and_then(Value::as_str))
    .map(pem_from_der_base64)
    .collect::<String>();

    let result = verify_device_attestation(
        &DeviceAttestationInputs {
            id: device.get("device_id").and_then(Value::as_str).unwrap().to_string(),
            key: device.get("public_key").and_then(Value::as_str).unwrap().to_string(),
            attestation_sig: identity
                .get("dac_signature")
                .or_else(|| identity.get("signature"))
                .and_then(Value::as_str)
                .unwrap()
                .to_string(),
            ctr: envelope.get("payload").and_then(|p| p.get("ctr")).and_then(Value::as_u64),
            vendor: device.get("vendor").and_then(Value::as_str).map(String::from),
            record_id: envelope.get("id").and_then(Value::as_str).map(String::from),
            certificate_chain: Some(chain),
            created: Some(4102444800),
            attestation_alg: None,
            attestation_payload_version: None,
            trust_profile: "dev".to_string(),
        },
        None,
    );

    assert!(result.ok, "unexpected attestation failure: {:?}", result.reason);
}
