# SPDX-License-Identifier: Apache-2.0
import base64
import io
import json
import unittest
import zipfile

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ed25519

from lukuid_sdk.luku import LukuDeviceIdentity, LukuFile, LukuSigner, LukuVerifyOptions


EMPTY_SHA256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"


class TestSigner(LukuSigner):
    def __init__(self, private_key: ed25519.Ed25519PrivateKey):
        self._private_key = private_key
        self.public_key_bytes = private_key.public_key().public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw,
        )

    @property
    def public_key_base64(self) -> str:
        return base64.b64encode(self.public_key_bytes).decode("utf-8")

    @property
    def private_key_pem(self) -> str:
        return self._private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        ).decode("utf-8")

    def sign(self, data: bytes) -> bytes:
        return self._private_key.sign(data)


def build_archive_bytes(manifest: dict, extra_entries: list[tuple[str, bytes]] | None = None) -> bytes:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        archive.writestr("mimetype", "application/vnd.lukuid.package+zip", compress_type=zipfile.ZIP_STORED)
        archive.writestr("manifest.json", json.dumps(manifest), compress_type=zipfile.ZIP_DEFLATED)
        archive.writestr("blocks.jsonl", b"", compress_type=zipfile.ZIP_DEFLATED)
        for name, payload in extra_entries or []:
            archive.writestr(name, payload, compress_type=zipfile.ZIP_DEFLATED)
    return buffer.getvalue()


class TestArchiveHardening(unittest.TestCase):
    def verify_options(self) -> LukuVerifyOptions:
        return LukuVerifyOptions(allow_untrusted_roots=True, skip_certificate_temporal_checks=True, trust_profile="dev")

    def create_valid_export(self, device_id: str) -> LukuFile:
        private_key = ed25519.Ed25519PrivateKey.generate()
        signer = TestSigner(private_key)
        device = LukuDeviceIdentity(device_id=device_id, public_key=signer.public_key_base64)
        archive = LukuFile.export_with_identity(
            [
                {
                    "type": "scan",
                    "signature": base64.b64encode(signer.sign(b"scan-can")).decode("utf-8"),
                    "previous_signature": "genesis_fake",
                    "canonical_string": "scan-can",
                    "payload": {"ctr": 1, "timestamp_utc": 1, "genesis_hash": "genesis_fake"},
                }
            ],
            device,
            {},
            signer,
        )
        return LukuFile.open_bytes(archive.save_to_bytes())

    def test_rejects_unsafe_zip_entry_paths(self):
        data = build_archive_bytes(
            {
                "type": "LukuArchive",
                "version": "1.0.0",
                "created_at_utc": 1,
                "description": "test",
                "blocks_hash": EMPTY_SHA256,
            },
            [("attachments/../../evil", b"boom")],
        )
        with self.assertRaisesRegex(ValueError, "unsafe ZIP entry path"):
            LukuFile.open_bytes(data)

    def test_rejects_duplicate_zip_entries(self):
        data = build_archive_bytes(
            {
                "type": "LukuArchive",
                "version": "1.0.0",
                "created_at_utc": 1,
                "description": "test",
                "blocks_hash": EMPTY_SHA256,
            },
            [("manifest.json", b"{}")],
        )
        with self.assertRaisesRegex(ValueError, "duplicate ZIP entry"):
            LukuFile.open_bytes(data)

    def test_rejects_manifest_missing_required_fields(self):
        data = build_archive_bytes(
            {
                "type": "LukuArchive",
                "version": "1.0.0",
                "created_at_utc": 1,
                "description": "test",
            }
        )
        with self.assertRaisesRegex(ValueError, "blocks_hash"):
            LukuFile.open_bytes(data)

    def test_rejects_manifest_malformed_types(self):
        data = build_archive_bytes(
            {
                "type": "LukuArchive",
                "version": "1.0.0",
                "created_at_utc": "bad",
                "description": "test",
                "blocks_hash": EMPTY_SHA256,
            }
        )
        with self.assertRaisesRegex(ValueError, "created_at_utc"):
            LukuFile.open_bytes(data)

    def test_flags_unsupported_manifest_versions(self):
        archive = LukuFile.open_bytes(
            build_archive_bytes(
                {
                    "type": "LukuArchive",
                    "version": "9.9.9",
                    "created_at_utc": 1,
                    "description": "test",
                    "blocks_hash": EMPTY_SHA256,
                }
            )
        )
        issues = archive.verify(self.verify_options())
        self.assertTrue(any(issue.code == "MANIFEST_VERSION_UNSUPPORTED" for issue in issues))

    def test_rejects_external_identity_on_unsupported_record_types(self):
        archive = self.create_valid_export("LUK-PY-HARDEN")
        archive.blocks[0].batch[0]["external_identity"] = {"endorser_id": "ext-1"}
        issues = archive.verify(self.verify_options())
        self.assertTrue(any(issue.code == "EXTERNAL_IDENTITY_UNSUPPORTED_RECORD_TYPE" for issue in issues))


if __name__ == "__main__":
    unittest.main()
