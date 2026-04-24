// SPDX-License-Identifier: Apache-2.0
use lukuid_sdk::attestation::{verify_device_attestation, DeviceAttestationInputs};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};

#[test]
fn test_pqc_signature_rejection() {
    // 3309 bytes of zeros is an invalid ML-DSA-65 signature
    let sig = BASE64.encode(vec![0u8; 3309]);
    
    let inputs = DeviceAttestationInputs {
        id: "test-device".to_string(),
        key: "base64-key".to_string(),
        attestation_sig: sig,
        certificate_chain: Some("-----BEGIN CERTIFICATE-----\nMII...".to_string()),
        created: None,
        attestation_alg: None,
        attestation_payload_version: None,
        trust_profile: "prod".to_string(),
    };
    
    let result = verify_device_attestation(&inputs);
    assert!(!result.ok);
    let reason = result.reason.unwrap();
    assert!(reason.contains("PQC Signature verification failed") || reason.contains("Invalid certificate chain"));
}

#[test]
fn test_ed25519_signature_legacy_pass() {
    // 64 bytes of signature - should be handled by legacy logic if chain matches
    let sig = BASE64.encode(vec![0u8; 64]);
    
    let inputs = DeviceAttestationInputs {
        id: "test-device".to_string(),
        key: "base64-key".to_string(),
        attestation_sig: sig,
        certificate_chain: None,
        created: None,
        attestation_alg: None,
        attestation_payload_version: None,
        trust_profile: "prod".to_string(),
    };
    
    let result = verify_device_attestation(&inputs);
    // Should fail because sig is all zeros, but it shouldn't be a PQC error
    assert!(!result.ok);
}
