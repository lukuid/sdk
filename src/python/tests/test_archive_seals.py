# SPDX-License-Identifier: Apache-2.0
import json
import base64
import hashlib
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

from asn1crypto import core
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.utils import decode_dss_signature
from cryptography.x509.oid import NameOID

from lukuid_sdk import archive_seals
from lukuid_sdk.luku import LukuFile, LukuSigner


class ArchiveSealsTest(unittest.TestCase):
    @staticmethod
    def _sequence(*encoded: bytes) -> bytes:
        content = b"".join(encoded)
        length = len(content)
        header = bytes([length]) if length < 128 else bytes([0x82]) + length.to_bytes(2, "big")
        return b"\x30" + header + content

    def test_self_seal_export_and_corruption(self) -> None:
        archive = LukuFile.export_blocks_with_manifest([], {}, "Seal test", {}, LukuSigner.generate())
        reopened = LukuFile.open_bytes(archive.save_to_bytes())
        self.assertFalse([issue for issue in reopened.verify() if issue.code.startswith("ARCHIVE_")])
        self.assertEqual(json.loads(reopened.seals_raw)["seals"][0]["type"], "self")

        corrupted = json.loads(reopened.seals_raw)
        corrupted["seals"][0]["signature"] = "AA=="
        reopened.seals_raw = json.dumps(corrupted)
        self.assertIn("ARCHIVE_SELF_SEAL_INVALID", [issue.code for issue in reopened.verify()])
        with self.assertRaisesRegex(ValueError, "valid archive self seal"):
            reopened.save_to_bytes()
        reopened.seals_raw = None
        self.assertIn("ARCHIVE_SEALS_MISSING", [issue.code for issue in reopened.verify()])

    def test_shared_self_only_fixture(self) -> None:
        fixture = Path(__file__).resolve().parents[3] / "samples/dotluku/sealed-self-only.luku"
        archive = LukuFile.open(fixture)
        self.assertFalse([issue for issue in archive.verify() if issue.code.startswith("ARCHIVE_")])

    def test_platform_validation_is_offline_and_fail_closed(self) -> None:
        archive = LukuFile.export_blocks_with_manifest([], {}, "Platform seal test", {}, LukuSigner.generate())
        root = json.loads(archive.seals_raw)
        platform = {
            "type": "platform", "platform": "android", "alg": "ES256",
            "created_at_utc": root["seals"][0]["created_at_utc"],
            "key_id": "00" * 32, "public_key": "AA==",
            "certificate_chain": ["AA==", "AA=="],
            "metadata": {"security_level": "strongbox"}, "signature": "AA==",
        }
        root["seals"].append(platform)
        archive.seals_raw = json.dumps(root)
        self.assertIn("ARCHIVE_PLATFORM_SEAL_INVALID", [issue.code for issue in archive.verify()])
        platform["platform"] = "future-platform"
        archive.seals_raw = json.dumps(root)
        self.assertIn("ARCHIVE_PLATFORM_SEAL_UNSUPPORTED", [issue.code for issue in archive.verify()])
        root["seals"] = [platform]
        archive.seals_raw = json.dumps(root)
        self.assertIn("ARCHIVE_SELF_SEAL_MISSING", [issue.code for issue in archive.verify()])

    @classmethod
    def synthetic_android_seal(cls) -> tuple[dict, str, bytes]:
        manifest = b'{"type":"LukuArchive"}'
        manifest_hash = hashlib.sha256(manifest).hexdigest()
        challenge = bytes.fromhex(manifest_hash)
        timestamp = 1791051600
        root_key = ec.generate_private_key(ec.SECP256R1())
        leaf_key = ec.generate_private_key(ec.SECP256R1())
        root_name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "Test Android attestation root")])
        leaf_name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "Test Android hardware key")])
        before = datetime(2025, 1, 1, tzinfo=timezone.utc)
        after = datetime(2030, 1, 1, tzinfo=timezone.utc)
        root_cert = (x509.CertificateBuilder().subject_name(root_name).issuer_name(root_name)
                     .public_key(root_key.public_key()).serial_number(1)
                     .not_valid_before(before).not_valid_after(after)
                     .add_extension(x509.BasicConstraints(ca=True, path_length=None), critical=True)
                     .sign(root_key, hashes.SHA256()))
        hardware = cls._sequence(
            archive_seals._IntegerSet([core.Integer(2)], explicit=1).dump(),
            core.Integer(3, explicit=2).dump(),
            core.Integer(256, explicit=3).dump(),
            archive_seals._IntegerSet([core.Integer(4)], explicit=5).dump(),
            core.Integer(0, explicit=702).dump(),
        )
        attestation = cls._sequence(
            core.Integer(300).dump(), b"\x0a\x01\x02",
            core.Integer(300).dump(), b"\x0a\x01\x02",
            core.OctetString(challenge).dump(), core.OctetString(b"").dump(),
            cls._sequence(), hardware,
        )
        leaf_cert = (x509.CertificateBuilder().subject_name(leaf_name).issuer_name(root_name)
                     .public_key(leaf_key.public_key()).serial_number(2)
                     .not_valid_before(before).not_valid_after(after)
                     .add_extension(x509.UnrecognizedExtension(archive_seals._ANDROID_ATTESTATION_OID, attestation), critical=False)
                     .sign(root_key, hashes.SHA256()))
        root_der = root_cert.public_bytes(serialization.Encoding.DER)
        leaf_der = leaf_cert.public_bytes(serialization.Encoding.DER)
        public_der = leaf_key.public_key().public_bytes(serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo)
        signature_der = leaf_key.sign(archive_seals._payload(manifest_hash, timestamp), ec.ECDSA(hashes.SHA256()))
        r, s = decode_dss_signature(signature_der)
        seal = {
            "type": "platform", "platform": "android", "alg": "ES256", "created_at_utc": timestamp,
            "key_id": hashlib.sha256(public_der).hexdigest(),
            "public_key": base64.b64encode(public_der).decode("ascii"),
            "certificate_chain": [base64.b64encode(value).decode("ascii") for value in (leaf_der, root_der)],
            "metadata": {"security_level": "strongbox"},
            "signature": base64.b64encode(r.to_bytes(32, "big") + s.to_bytes(32, "big")).decode("ascii"),
        }
        return seal, manifest_hash, root_der

    def test_android_chain_and_signature_are_cryptographically_verified(self) -> None:
        seal, manifest_hash, root_der = self.synthetic_android_seal()
        with patch.object(archive_seals, "_ANDROID_ROOTS", {hashlib.sha256(root_der).hexdigest()}):
            self.assertTrue(archive_seals.verify_android(seal, manifest_hash))
            tampered = {**seal, "signature": base64.b64encode(b"\0" * 64).decode("ascii")}
            self.assertFalse(archive_seals.verify_android(tampered, manifest_hash))
            untrusted = {**seal, "certificate_chain": [seal["certificate_chain"][0], seal["certificate_chain"][0]]}
            self.assertFalse(archive_seals.verify_android(untrusted, manifest_hash))
            unsigned_claim = {**seal, "metadata": {"security_level": "tee"}}
            self.assertFalse(archive_seals.verify_android(unsigned_claim, manifest_hash))


if __name__ == "__main__":
    unittest.main()
