# SPDX-License-Identifier: Apache-2.0
import json
import unittest
from pathlib import Path

from lukuid_sdk.attestation import TRUSTED_ROOT_CERTS_PEM, _certificate_metadata, pem_from_der_string


def resolve_valid_envelope() -> Path:
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


class TestAttestationMetadata(unittest.TestCase):
    def test_certificate_metadata_public_key_pem_is_bounded(self):
        envelope = json.loads(resolve_valid_envelope().read_text(encoding="utf-8"))
        cert_pem = pem_from_der_string(envelope["attestation_intermediate_der"])
        self.assertIsNotNone(cert_pem)

        metadata = _certificate_metadata(cert_pem)
        public_key_pem = metadata["public_key_pem"]

        self.assertIn("-----BEGIN PUBLIC KEY-----\n", public_key_pem)
        self.assertTrue(public_key_pem.endswith("-----END PUBLIC KEY-----\n"))
        self.assertNotIn("Certificate:\n", public_key_pem)
        self.assertEqual(public_key_pem.count("-----BEGIN PUBLIC KEY-----"), 1)
        self.assertEqual(public_key_pem.count("-----END PUBLIC KEY-----"), 1)

    def test_certificate_metadata_exposes_issuer(self):
        envelope = json.loads(resolve_valid_envelope().read_text(encoding="utf-8"))
        cert_pem = pem_from_der_string(envelope["attestation_intermediate_der"])
        self.assertIsNotNone(cert_pem)

        metadata = _certificate_metadata(cert_pem)
        self.assertIn("LukuID PQC Root CA", metadata["issuer"])

    def test_trusted_root_metadata_is_parseable_without_pubkey_support(self):
        metadata = _certificate_metadata(TRUSTED_ROOT_CERTS_PEM[0], include_pubkey=False)
        self.assertIn("LukuID PQC Root CA", metadata["subject"])
        self.assertIsNone(metadata["public_key_pem"])


if __name__ == "__main__":
    unittest.main()
