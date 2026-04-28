# SPDX-License-Identifier: Apache-2.0
import base64
import json
import unittest
from pathlib import Path
from lukuid_sdk import LukuFile, LukuVerifyOptions

def resolve_sample() -> Path:
    current = Path(__file__).parent.resolve()
    while True:
        candidate = current / "samples" / "envelopes" / "dev" / "1.0.0" / "valid_envelope.json"
        if candidate.exists():
            return candidate
        parent = current.parent
        if parent == current:
            break
        current = parent
    return Path(__file__).parent / ".." / ".." / ".." / "samples" / "envelopes" / "dev" / "1.0.0" / "valid_envelope.json"

def get_valid_envelope() -> dict:
    with open(resolve_sample(), "r") as f:
        return json.load(f)

class TestEnvelope(unittest.TestCase):
    def test_verify_envelope_valid(self):
        envelope = get_valid_envelope()
        issues = LukuFile.verify_envelope(envelope, LukuVerifyOptions(
            allow_untrusted_roots=False,
            skip_certificate_temporal_checks=True,
            trust_profile="dev"
        ))
        self.assertFalse(issues, f"Expected no issues, got: {issues}")

    def test_verify_envelope_key_mismatch(self):
        from cryptography.hazmat.primitives.asymmetric import ed25519
        from cryptography.hazmat.primitives import serialization

        envelope = get_valid_envelope()
        
        private_key = ed25519.Ed25519PrivateKey.generate()
        public_key = private_key.public_key()
        public_key_bytes = public_key.public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw,
        )
        new_pub_key_base64 = base64.b64encode(public_key_bytes).decode("utf-8")
        
        envelope["device"]["public_key"] = new_pub_key_base64
        
        signature_bytes = private_key.sign(envelope["canonical_string"].encode("utf-8"))
        envelope["signature"] = base64.b64encode(signature_bytes).decode("utf-8")
        
        issues = LukuFile.verify_envelope(envelope, LukuVerifyOptions(
            allow_untrusted_roots=False,
            skip_certificate_temporal_checks=True,
            trust_profile="dev"
        ))
        self.assertTrue(any(i.code == "ATTESTATION_FAILED" for i in issues))

    def test_verify_envelope_invalid_signature(self):
        envelope = get_valid_envelope()
        envelope["signature"] = base64.b64encode(b"0" * 64).decode("utf-8")
        issues = LukuFile.verify_envelope(envelope, LukuVerifyOptions(
            allow_untrusted_roots=False,
            skip_certificate_temporal_checks=True,
            trust_profile="dev"
        ))
        self.assertTrue(any(i.code == "RECORD_SIGNATURE_INVALID" for i in issues))

    def test_verify_envelope_missing_identity(self):
        envelope = get_valid_envelope()
        envelope.pop("device", None)
        envelope.pop("device_id", None)
        envelope.pop("public_key", None)
        issues = LukuFile.verify_envelope(envelope, LukuVerifyOptions(
            allow_untrusted_roots=False,
            skip_certificate_temporal_checks=True,
            trust_profile="dev"
        ))
        self.assertTrue(any(i.code == "DEVICE_IDENTITY_MISSING" for i in issues))

    def test_verify_envelope_invalid_dac(self):
        envelope = get_valid_envelope()
        envelope["attestation_intermediate_der"] = base64.b64encode(b"bad_cert").decode("utf-8")
        issues = LukuFile.verify_envelope(envelope, LukuVerifyOptions(
            allow_untrusted_roots=False,
            skip_certificate_temporal_checks=True,
            trust_profile="dev"
        ))
        self.assertTrue(any(i.code == "ATTESTATION_FAILED" for i in issues))

    def test_verify_envelope_invalid_canonical_string(self):
        envelope = get_valid_envelope()
        envelope["canonical_string"] = "tampered:canonical:string"
        issues = LukuFile.verify_envelope(envelope, LukuVerifyOptions(
            allow_untrusted_roots=False,
            skip_certificate_temporal_checks=True,
            trust_profile="dev"
        ))
        self.assertTrue(any(i.code == "RECORD_SIGNATURE_INVALID" for i in issues))
