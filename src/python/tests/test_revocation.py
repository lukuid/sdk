# SPDX-License-Identifier: Apache-2.0
from __future__ import annotations

import base64
import datetime
import hashlib
import json
import unittest
from unittest import mock

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec, ed25519

from lukuid_sdk.attestation import CertificateChainValidationResult
from lukuid_sdk.revocation import RevocationManager


def _make_test_options() -> dict:
    # Keep the manager fully offline/in-memory so construction has no
    # side effects (no disk cache, no background refresh thread).
    return {
        "crl_memory_only": True,
        "crl_refresh_interval_hours": 0,
        "disable_external_calls": True,
    }


def _self_signed_ec_cert(private_key) -> x509.Certificate:
    name = x509.Name([x509.NameAttribute(x509.NameOID.COMMON_NAME, "test-leaf")])
    now = datetime.datetime.now(datetime.timezone.utc)
    return (
        x509.CertificateBuilder()
        .subject_name(name)
        .issuer_name(name)
        .public_key(private_key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now - datetime.timedelta(days=1))
        .not_valid_after(now + datetime.timedelta(days=1))
        .sign(private_key, hashes.SHA256())
    )


class RevocationFingerprintTests(unittest.TestCase):
    def test_fingerprint_hashes_raw_ec_public_key_bytes(self):
        manager = RevocationManager(_make_test_options())
        private_key = ec.generate_private_key(ec.SECP256R1())
        cert = _self_signed_ec_cert(private_key)

        raw_bytes = private_key.public_key().public_bytes(
            encoding=serialization.Encoding.X962,
            format=serialization.PublicFormat.UncompressedPoint,
        )
        expected = hashlib.sha256(raw_bytes).hexdigest()

        self.assertEqual(manager.get_fingerprint(cert), expected)
        manager.close()

    def test_fingerprint_hashes_raw_ed25519_public_key_bytes(self):
        manager = RevocationManager(_make_test_options())
        private_key = ed25519.Ed25519PrivateKey.generate()
        name = x509.Name([x509.NameAttribute(x509.NameOID.COMMON_NAME, "test-leaf")])
        now = datetime.datetime.now(datetime.timezone.utc)
        cert = (
            x509.CertificateBuilder()
            .subject_name(name)
            .issuer_name(name)
            .public_key(private_key.public_key())
            .serial_number(x509.random_serial_number())
            .not_valid_before(now - datetime.timedelta(days=1))
            .not_valid_after(now + datetime.timedelta(days=1))
            .sign(private_key, None)
        )

        raw_bytes = private_key.public_key().public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw,
        )
        expected = hashlib.sha256(raw_bytes).hexdigest()

        self.assertEqual(manager.get_fingerprint(cert), expected)
        manager.close()


class RevocationSnapshotFailClosedTests(unittest.TestCase):
    def _envelope_with_signature(self, leaf_cert, payload_bytes, signature_bytes):
        pem = leaf_cert.public_bytes(serialization.Encoding.PEM).decode("ascii")
        return {
            "certificate_chain": pem,
            "payload": base64.b64encode(payload_bytes).decode("ascii"),
            "signature": base64.b64encode(signature_bytes).decode("ascii"),
        }

    def test_apply_snapshot_rejects_bad_signature_and_keeps_fail_closed(self):
        private_key = ec.generate_private_key(ec.SECP256R1())
        leaf_cert = _self_signed_ec_cert(private_key)

        payload = json.dumps({
            "version": 1,
            "generated_at": datetime.datetime.now(datetime.timezone.utc)
            .isoformat()
            .replace("+00:00", "Z"),
            "revoked_fingerprints": ["a" * 64],
        }).encode("utf-8")

        good_signature = private_key.sign(payload, ec.ECDSA(hashes.SHA256()))
        bad_signature = bytes([good_signature[0] ^ 0xFF]) + good_signature[1:]

        envelope = self._envelope_with_signature(leaf_cert, payload, bad_signature)

        manager = RevocationManager(_make_test_options())
        try:
            with mock.patch(
                "lukuid_sdk.attestation.validate_certificate_chain",
                return_value=CertificateChainValidationResult(True, certificates=[leaf_cert]),
            ):
                with self.assertRaises(Exception):
                    manager._apply_snapshot(envelope)

            # A rejected snapshot must never be trusted: no fingerprints
            # applied and has_verified_snapshot() stays False.
            self.assertEqual(manager.revoked_fingerprints, set())
            self.assertFalse(manager.has_verified_snapshot())
        finally:
            manager.close()

    def test_apply_snapshot_accepts_valid_signature(self):
        private_key = ec.generate_private_key(ec.SECP256R1())
        leaf_cert = _self_signed_ec_cert(private_key)

        fingerprint = "b" * 64
        payload = json.dumps({
            "version": 1,
            "generated_at": datetime.datetime.now(datetime.timezone.utc)
            .isoformat()
            .replace("+00:00", "Z"),
            "revoked_fingerprints": [fingerprint],
        }).encode("utf-8")

        signature = private_key.sign(payload, ec.ECDSA(hashes.SHA256()))
        envelope = self._envelope_with_signature(leaf_cert, payload, signature)

        manager = RevocationManager(_make_test_options())
        try:
            with mock.patch(
                "lukuid_sdk.attestation.validate_certificate_chain",
                return_value=CertificateChainValidationResult(True, certificates=[leaf_cert]),
            ):
                manager._apply_snapshot(envelope)

            self.assertEqual(manager.revoked_fingerprints, {fingerprint})
            self.assertTrue(manager.has_verified_snapshot())
        finally:
            manager.close()


if __name__ == "__main__":
    unittest.main()
