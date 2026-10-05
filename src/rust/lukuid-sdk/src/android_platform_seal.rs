// SPDX-License-Identifier: Apache-2.0
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use ring::signature::{UnparsedPublicKey, ECDSA_P256_SHA256_FIXED};
use serde_json::Value;
use sha2::{Digest, Sha256};
use x509_parser::der_parser::ber::{BerObject, BerObjectContent, Class};
use x509_parser::der_parser::der::parse_der;
use x509_parser::prelude::{FromDer, X509Certificate};
use x509_parser::time::ASN1Time;

const ATTESTATION_OID: &str = "1.3.6.1.4.1.11129.2.1.17";
const ROOT_SHA256: &[&str] = &[
    "cedb1cb6dc896ae5ec797348bce9286753c2b38ee71ce0fbe34a9a1248800dfc",
    "6d9db4ce6c5c0b293166d08986e05774a8776ceb525d9e4329520de12ba4bcc0",
];

fn text<'a>(seal: &'a Value, field: &str) -> Option<&'a str> {
    seal.get(field)?.as_str().filter(|value| !value.is_empty())
}

fn decode(value: &str) -> Option<Vec<u8>> {
    let bytes = BASE64.decode(value).ok()?;
    (BASE64.encode(&bytes) == value).then_some(bytes)
}

fn hardware_value<'a>(hardware: &[BerObject<'a>], tag: u32) -> Option<BerObject<'a>> {
    let mut matches = hardware.iter().filter(|object| object.header.class() == Class::ContextSpecific && object.header.tag().0 == tag);
    let object = matches.next()?;
    if matches.next().is_some() { return None; }
    let BerObjectContent::Unknown(any) = &object.content else { return None; };
    let (remaining, value) = parse_der(any.data).ok()?;
    remaining.is_empty().then_some(value)
}

fn authenticated_level(cert: &X509Certificate<'_>, challenge: &[u8]) -> Option<&'static str> {
    let mut extensions = cert.extensions().iter().filter(|ext| ext.oid.to_id_string() == ATTESTATION_OID);
    let extension = extensions.next()?;
    if extensions.next().is_some() { return None; }
    let (remaining, description) = parse_der(extension.value).ok()?;
    if !remaining.is_empty() { return None; }
    let description = description.as_sequence().ok()?;
    if description.len() < 8 { return None; }
    let level = description[1].as_u64().ok()?;
    if !(1..=2).contains(&level) || description[3].as_u64().ok()? != level { return None; }
    if description[4].as_slice().ok()? != challenge { return None; }
    let hardware = description[7].as_sequence().ok()?;
    if hardware_value(hardware, 2)?.as_u64().ok()? != 3
        || hardware_value(hardware, 3)?.as_u64().ok()? != 256
        || hardware_value(hardware, 702)?.as_u64().ok()? != 0 { return None; }
    let purpose_value = hardware_value(hardware, 1)?;
    let digest_value = hardware_value(hardware, 5)?;
    let purposes = purpose_value.as_set().ok()?;
    let digests = digest_value.as_set().ok()?;
    if !purposes.iter().any(|value| value.as_u64() == Ok(2))
        || !digests.iter().any(|value| value.as_u64() == Ok(4)) { return None; }
    Some(if level == 2 { "strongbox" } else { "tee" })
}

pub(crate) fn verify(seal: &Value, manifest_hash: &[u8; 32], payload: &[u8]) -> bool {
    verify_with_roots(seal, manifest_hash, payload, ROOT_SHA256)
}

fn verify_with_roots(seal: &Value, manifest_hash: &[u8; 32], payload: &[u8], roots: &[&str]) -> bool {
    (|| -> Option<()> {
        if text(seal, "platform")? != "android" || text(seal, "alg")? != "ES256" { return None; }
        let key_der = decode(text(seal, "public_key")?)?;
        let signature = decode(text(seal, "signature")?)?;
        if signature.len() != 64 || text(seal, "key_id")? != hex::encode(Sha256::digest(&key_der)) { return None; }
        let chain_values = seal.get("certificate_chain")?.as_array()?;
        if !(2..=12).contains(&chain_values.len()) { return None; }
        let chain_der = chain_values.iter().map(|value| decode(value.as_str()?)).collect::<Option<Vec<_>>>()?;
        if !roots.contains(&hex::encode(Sha256::digest(chain_der.last()?)).as_str()) { return None; }
        let chain = chain_der.iter().map(|bytes| {
            let (remaining, cert) = X509Certificate::from_der(bytes).ok()?;
            remaining.is_empty().then_some(cert)
        }).collect::<Option<Vec<_>>>()?;
        let timestamp = seal.get("created_at_utc")?.as_i64().filter(|value| *value >= 0)?;
        let at = ASN1Time::from_timestamp(timestamp).ok()?;
        for (index, cert) in chain.iter().enumerate() {
            if !cert.validity().is_valid_at(at) { return None; }
            if index > 0 {
                if !cert.basic_constraints().ok()??.value.ca { return None; }
                if cert.key_usage().ok()?.is_some_and(|usage| !usage.value.key_cert_sign()) { return None; }
            }
            if index + 1 < chain.len() {
                let issuer = &chain[index + 1];
                if cert.issuer() != issuer.subject() || cert.verify_signature(Some(issuer.public_key())).is_err() { return None; }
            }
        }
        chain.last()?.verify_signature(None).ok()?;
        if chain.iter().skip(1).any(|cert| cert.extensions().iter().any(|ext| ext.oid.to_id_string() == ATTESTATION_OID)) { return None; }
        let leaf = &chain[0];
        let public_key = leaf.public_key();
        if public_key.raw != key_der || public_key.algorithm.algorithm.to_id_string() != "1.2.840.10045.2.1"
            || public_key.algorithm.parameters.as_ref()?.as_oid().ok()?.to_id_string() != "1.2.840.10045.3.1.7" { return None; }
        let level = authenticated_level(leaf, manifest_hash)?;
        if seal.pointer("/metadata/security_level")?.as_str()? != level { return None; }
        UnparsedPublicKey::new(&ECDSA_P256_SHA256_FIXED, public_key.subject_public_key.data.as_ref())
            .verify(payload, &signature).ok()?;
        Some(())
    })().is_some()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn verifies_android_attestation_and_detects_tampering() {
        let fixture: Value = serde_json::from_str(include_str!("../tests/android-platform-seal-test.json")).unwrap();
        let seal = &fixture["seal"];
        let hash = fixture["manifest_hash"].as_str().unwrap();
        let digest: [u8; 32] = hex::decode(hash).unwrap().try_into().unwrap();
        let root = fixture["test_root_sha256"].as_str().unwrap();
        let timestamp = seal["created_at_utc"].as_i64().unwrap();
        let payload = format!("LUKUID-ARCHIVE-SEAL-V1\nmanifest_hash_alg=SHA-256\nmanifest_hash={hash}\ncreated_at_utc={timestamp}");
        let leaf_der = BASE64.decode(seal["certificate_chain"][0].as_str().unwrap()).unwrap();
        let (_, leaf) = X509Certificate::from_der(&leaf_der).unwrap();
        assert_eq!(authenticated_level(&leaf, &digest), Some("strongbox"));
        assert!(verify_with_roots(seal, &digest, payload.as_bytes(), &[root]));
        assert!(!verify(seal, &digest, payload.as_bytes()));
        let mut tampered = seal.clone();
        tampered["metadata"]["security_level"] = "tee".into();
        assert!(!verify_with_roots(&tampered, &digest, payload.as_bytes(), &[root]));
        tampered = seal.clone();
        tampered["signature"] = BASE64.encode([0u8; 64]).into();
        assert!(!verify_with_roots(&tampered, &digest, payload.as_bytes(), &[root]));
        tampered = seal.clone();
        tampered["certificate_chain"][1] = seal["certificate_chain"][0].clone();
        assert!(!verify_with_roots(&tampered, &digest, payload.as_bytes(), &[root]));
    }
}
