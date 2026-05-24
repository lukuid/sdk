use lukuid_sdk::attestation::{
    build_record_attestation_payload, build_record_heartbeat_payload,
};

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
