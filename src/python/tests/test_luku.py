# SPDX-License-Identifier: Apache-2.0
from __future__ import annotations

import hashlib
import io
import json
import unittest
import zipfile
from pathlib import Path

from lukuid_sdk import (
    Criticality,
    LUKU_MIMETYPE,
    LukuDeviceIdentity,
    LukuFile,
    LukuSigner,
    LukuVerifyOptions,
)
from lukuid_sdk.luku import LukuExportOptions, LukuPolicy


class LukuArchiveTests(unittest.TestCase):
    @staticmethod
    def create_test_signer() -> LukuSigner:
        return LukuSigner.generate()

    @staticmethod
    def sign_canonical(signer: LukuSigner, canonical: str) -> str:
        from lukuid_sdk.attestation import sign_detached

        return sign_detached(signer.private_key_pem, canonical.encode("utf-8"))

    @staticmethod
    def build_test_options() -> LukuVerifyOptions:
        return LukuVerifyOptions(
            allow_untrusted_roots=True,
            skip_certificate_temporal_checks=True,
            trusted_external_fingerprints=[],
            trust_profile="dev",
        )

    @staticmethod
    def sample_path(name: str) -> Path:
        start = Path(__file__).resolve()
        for root in start.parents:
            for version in ("1.0.0", "1.0"):
                candidate = root / "samples" / "dotluku" / "dev" / version / name
                if candidate.exists():
                    return candidate
        raise FileNotFoundError(f"Missing sample archive {name} while searching ancestors of {start}")

    @staticmethod
    def external_identity_fixture() -> dict[str, object]:
        start = Path(__file__).resolve()
        for root in start.parents:
            candidate = root / "samples" / "external_identity" / "dev" / "self_signed_ed25519.json"
            if candidate.exists():
                return json.loads(candidate.read_text(encoding="utf-8"))
        raise FileNotFoundError(f"Missing external identity fixture while searching ancestors of {start}")

    def create_valid_export(self, device_id: str):
        signer = self.create_test_signer()
        identity = LukuDeviceIdentity(device_id=device_id, public_key=signer.public_key_base64)

        sig1 = self.sign_canonical(signer, "can1")
        sig2 = self.sign_canonical(signer, "can2")
        sig3 = self.sign_canonical(signer, "can3")

        records = [
            {
                "type": "scan",
                "signature": sig1,
                "previous_signature": "genesis_fake",
                "canonical_string": "can1",
                "payload": {"ctr": 1, "timestamp_utc": 1000, "genesis_hash": "genesis_fake"},
            },
            {
                "type": "scan",
                "signature": sig2,
                "previous_signature": sig1,
                "canonical_string": "can2",
                "payload": {"ctr": 2, "timestamp_utc": 1005, "genesis_hash": "genesis_fake"},
            },
            {
                "type": "scan",
                "signature": sig3,
                "previous_signature": sig2,
                "canonical_string": "can3",
                "payload": {"ctr": 3, "timestamp_utc": 1010, "genesis_hash": "genesis_fake"},
            },
        ]

        exported = LukuFile.export_with_identity(records, identity, {}, signer)
        reopened = LukuFile.open_bytes(exported.save_to_bytes())
        return reopened, signer

    @staticmethod
    def has_issue(issues, *codes) -> bool:
        return any(issue.code in codes for issue in issues)

    def test_exports_and_reopens_archives(self):
        signer = self.create_test_signer()
        identity = LukuDeviceIdentity(device_id="LUK-TEST", public_key=signer.public_key_base64)
        exported = LukuFile.export(
            [
                {
                    "type": "scan",
                    "signature": self.sign_canonical(signer, "can1"),
                    "previous_signature": "genesis_fake",
                    "canonical_string": "can1",
                    "payload": {"ctr": 1, "timestamp_utc": 1000},
                }
            ],
            identity,
            {},
            signer,
        )
        reopened = LukuFile.open_bytes(exported.save_to_bytes())
        self.assertEqual(reopened.manifest.version, "1.0.0")
        self.assertEqual(len(reopened.blocks), 1)
        self.assertEqual(len(reopened.blocks[0].batch), 1)

    def test_preserves_temporal_continuity_manifest_metadata(self):
        signer = self.create_test_signer()
        identity = LukuDeviceIdentity(device_id="LUK-META", public_key=signer.public_key_base64)
        canonical = "manifest-extra-scan"
        block = LukuFile.build_block_from_records(
            block_id=0,
            timestamp_utc=1000,
            previous_block_hash=None,
            default_device=identity,
            batch=[{
                "type": "scan",
                "signature": self.sign_canonical(signer, canonical),
                "previous_signature": "genesis_fake",
                "canonical_string": canonical,
                "payload": {"ctr": 1, "timestamp_utc": 1000, "genesis_hash": "genesis_fake"},
            }],
            common_certs=None,
        )

        exported = LukuFile.export_blocks_with_manifest(
            [block],
            {},
            "Manifest extra parity",
            {
                "native_continuity_gap_seconds": 600,
                "lukuid_block_reasons": [{
                    "block_id": 0,
                    "code": "archive_start",
                    "label": "Block start",
                    "detail_code": None,
                    "detail_label": None,
                }],
            },
            signer,
        )
        reopened = LukuFile.open_bytes(exported.save_to_bytes())
        self.assertEqual(reopened.manifest.extra.get("native_continuity_gap_seconds"), 600)
        self.assertEqual(
            reopened.manifest.extra.get("lukuid_block_reasons"),
            [{
                "block_id": 0,
                "code": "archive_start",
                "label": "Block start",
                "detail_code": None,
                "detail_label": None,
            }],
        )

    def test_builds_block_fallback_cert_fields(self):
        identity = LukuDeviceIdentity(device_id="LUK-TEST", public_key=bytes(32).hex())
        block = LukuFile.build_block_from_records(
            block_id=0,
            timestamp_utc=1000,
            previous_block_hash=None,
            default_device=identity,
            batch=[{"type": "scan", "signature": "sig1", "canonical_string": "can1", "payload": {"ctr": 1, "timestamp_utc": 1000}}],
            common_certs={"dac_der": "mock_dac_der", "attestation_root_fingerprint": "mock_fingerprint"},
        )
        self.assertEqual(block.attestation_dac_der, "mock_dac_der")
        self.assertEqual(block.attestation_root_fingerprint, "mock_fingerprint")

    def test_verifies_a_valid_archive(self):
        archive, _ = self.create_valid_export("LUK-VALID")
        issues = archive.verify(self.build_test_options())
        self.assertFalse(any(issue.criticality == Criticality.CRITICAL for issue in issues))

    def test_requires_native_continuity_when_requested(self):
        signer = self.create_test_signer()
        identity = LukuDeviceIdentity(device_id="LUK-CONT", public_key=signer.public_key_base64)
        archive = LukuFile.export_with_identity(
            [
                {
                    "type": "environment",
                    "signature": self.sign_canonical(signer, "env-1"),
                    "previous_signature": "genesis_fake",
                    "canonical_string": "env-1",
                    "payload": {"ctr": 1, "timestamp_utc": 1000, "genesis_hash": "genesis_fake"},
                },
                {
                    "type": "environment",
                    "signature": self.sign_canonical(signer, "env-2"),
                    "previous_signature": self.sign_canonical(signer, "env-1"),
                    "canonical_string": "env-2",
                    "payload": {"ctr": 2, "timestamp_utc": 2000, "genesis_hash": "genesis_fake"},
                },
            ],
            identity,
            {},
            signer,
            LukuExportOptions(policy=LukuPolicy(name="guardcard", native_continuity_gap_seconds=600)),
        )
        issues = archive.verify(
            LukuVerifyOptions(
                allow_untrusted_roots=True,
                skip_certificate_temporal_checks=True,
                trust_profile="dev",
                require_continuity=True,
            )
        )
        self.assertTrue(self.has_issue(issues, "CONTINUITY_GAP_EXCEEDED"))

    def test_rejects_untrusted_external_identity_endorsements(self):
        fixture = self.external_identity_fixture()
        signer = self.create_test_signer()
        identity = LukuDeviceIdentity(device_id="LUK-EXT", public_key=signer.public_key_base64)
        canonical = "attachment-ext"
        archive = LukuFile.export_with_identity(
            [{
                "type": "attachment",
                "attachment_id": "ATT-EXT-1",
                "signature": self.sign_canonical(signer, canonical),
                "previous_signature": "",
                "canonical_string": canonical,
                "checksum": fixture["checksum"],
                "external_identity": {
                    "endorser_id": fixture["endorser_id"],
                    "root_fingerprint": fixture["root_fingerprint"],
                    "cert_chain_der": fixture["cert_chain_der"],
                    "signature": fixture["signature"],
                },
            }],
            identity,
            {str(fixture["checksum"]): str(fixture["attachment_utf8"]).encode("utf-8")},
            signer,
        )

        trusted = archive.verify(
            LukuVerifyOptions(
                allow_untrusted_roots=True,
                skip_certificate_temporal_checks=True,
                trust_profile="dev",
                trusted_external_fingerprints=[str(fixture["root_fingerprint"])],
            )
        )
        self.assertFalse(self.has_issue(trusted, "EXTERNAL_IDENTITY_VERIFICATION_FAILED"))

        untrusted = archive.verify(
            LukuVerifyOptions(
                allow_untrusted_roots=True,
                skip_certificate_temporal_checks=True,
                trust_profile="dev",
                trusted_external_fingerprints=[],
            )
        )
        self.assertTrue(self.has_issue(untrusted, "EXTERNAL_IDENTITY_VERIFICATION_FAILED"))

    def test_detects_record_deletion(self):
        archive, _ = self.create_valid_export("LUK-DEL")
        archive.blocks[0].batch.pop(1)
        self.assertTrue(self.has_issue(archive.verify(self.build_test_options()), "RECORD_CHAIN_BROKEN"))

    def test_detects_record_injection(self):
        archive, _ = self.create_valid_export("LUK-INJ")
        archive.blocks[0].batch.insert(1, {"type": "scan", "signature": "fake_sig", "previous_signature": "doesnt_matter", "payload": {"ctr": 2, "timestamp_utc": 1002}})
        self.assertTrue(self.has_issue(archive.verify(self.build_test_options()), "RECORD_CHAIN_BROKEN", "RECORD_SIGNATURE_INVALID"))

    def test_detects_time_regression(self):
        archive, _ = self.create_valid_export("LUK-TIME")
        archive.blocks[0].batch[1]["payload"]["timestamp_utc"] = 999
        self.assertTrue(self.has_issue(archive.verify(self.build_test_options()), "TIME_REGRESSION"))

    def test_detects_counter_regression(self):
        archive, _ = self.create_valid_export("LUK-CTR")
        archive.blocks[0].batch[1]["payload"]["ctr"] = 1
        self.assertTrue(self.has_issue(archive.verify(self.build_test_options()), "COUNTER_REGRESSION"))

    def test_detects_export_tampering(self):
        archive, _ = self.create_valid_export("LUK-EXP")
        archive.blocks[0].block_id = 999
        tampered = LukuFile.open_bytes(archive.save_to_bytes())
        self.assertTrue(self.has_issue(tampered.verify(self.build_test_options()), "BLOCKS_HASH_MISMATCH"))

    def test_detects_attachment_corruption(self):
        archive, _ = self.create_valid_export("LUK-ATT")
        checksum = archive.add_attachment(b"valid_data")
        archive.blocks[0].batch.append({"type": "attachment", "checksum": checksum, "payload": {"ctr": 3}})
        archive.attachments[checksum] = b"tampered_data"
        self.assertTrue(self.has_issue(archive.verify(self.build_test_options()), "ATTACHMENT_CORRUPT"))

    def test_keeps_attested_attachments_out_of_the_native_chain(self):
        signer = self.create_test_signer()
        device_id = "LUK-ATTEST"
        attachment_bytes = b"desktop-added-attachment"
        checksum = hashlib.sha256(attachment_bytes).hexdigest()
        scan_sig = self.sign_canonical(signer, "attested-scan")
        block = LukuFile.build_block_from_records(
            block_id=0,
            timestamp_utc=1003,
            previous_block_hash=None,
            default_device=LukuDeviceIdentity(device_id=device_id, public_key=signer.public_key_base64),
            batch=[
                {"type": "scan", "scan_id": "SCAN-ATTEST-1", "device_id": device_id, "public_key": signer.public_key_base64, "signature": scan_sig, "previous_signature": "genesis_fake", "canonical_string": "attested-scan", "payload": {"ctr": 1, "timestamp_utc": 1000, "genesis_hash": "genesis_fake"}},
                {"type": "attachment", "attachment_id": "ATT-ATTEST-1", "parent_record_id": "SCAN-ATTEST-1", "device_id": device_id, "public_key": signer.public_key_base64, "signature": self.sign_canonical(signer, "attested-attachment"), "parent_signature": scan_sig, "canonical_string": "attested-attachment", "timestamp_utc": 1001, "checksum": checksum, "mime": "text/plain", "title": "Desktop Note"},
                {"type": "environment", "event_id": "ENV-ATTEST-1", "device_id": device_id, "public_key": signer.public_key_base64, "signature": self.sign_canonical(signer, "attested-environment"), "previous_signature": scan_sig, "canonical_string": "attested-environment", "payload": {"ctr": 2, "timestamp_utc": 1002}},
            ],
            common_certs=None,
        )
        exported = LukuFile.export_blocks_with_manifest([block], {checksum: attachment_bytes}, "Attested attachment export", {}, signer)
        reopened = LukuFile.open_bytes(exported.save_to_bytes())
        issues = reopened.verify(self.build_test_options())
        self.assertFalse(any(issue.criticality == Criticality.CRITICAL for issue in issues))
        self.assertFalse(self.has_issue(issues, "RECORD_CHAIN_BROKEN"))

    def test_keeps_attested_custody_records_out_of_the_native_chain(self):
        signer = self.create_test_signer()
        device_id = "LUK-CUSTODY"
        scan_sig = self.sign_canonical(signer, "custody-scan")
        block = LukuFile.build_block_from_records(
            block_id=0,
            timestamp_utc=1003,
            previous_block_hash=None,
            default_device=LukuDeviceIdentity(device_id=device_id, public_key=signer.public_key_base64),
            batch=[
                {"type": "scan", "scan_id": "SCAN-CUSTODY-1", "device_id": device_id, "public_key": signer.public_key_base64, "signature": scan_sig, "previous_signature": "genesis_fake", "canonical_string": "custody-scan", "payload": {"ctr": 1, "timestamp_utc": 1000, "genesis_hash": "genesis_fake"}},
                {"type": "custody", "custody_id": "CUSTODY-1", "parent_record_id": "SCAN-CUSTODY-1", "device_id": device_id, "public_key": signer.public_key_base64, "signature": self.sign_canonical(signer, "custody-checkpoint"), "parent_signature": scan_sig, "canonical_string": "custody-checkpoint", "timestamp_utc": 1001, "payload": {"event": "handoff", "status": "received", "context_ref": "shipment-123"}},
                {"type": "environment", "event_id": "ENV-CUSTODY-1", "device_id": device_id, "public_key": signer.public_key_base64, "signature": self.sign_canonical(signer, "custody-environment"), "previous_signature": scan_sig, "canonical_string": "custody-environment", "payload": {"ctr": 2, "timestamp_utc": 1002}},
            ],
            common_certs=None,
        )
        exported = LukuFile.export_blocks_with_manifest([block], {}, "Attested custody export", {}, signer)
        reopened = LukuFile.open_bytes(exported.save_to_bytes())
        issues = reopened.verify(self.build_test_options())
        self.assertFalse(any(issue.criticality == Criticality.CRITICAL for issue in issues))
        self.assertFalse(self.has_issue(issues, "RECORD_CHAIN_BROKEN"))

    def test_fails_strict_attestation_when_the_chain_is_fake(self):
        archive, _ = self.create_valid_export("LUK-STRICT")
        archive.blocks[0].attestation_dac_der = b"fake_der_data".hex()
        issues = archive.verify(LukuVerifyOptions(allow_untrusted_roots=False, skip_certificate_temporal_checks=True, trust_profile="dev"))
        self.assertTrue(self.has_issue(issues, "ATTESTATION_FAILED", "ATTESTATION_CHAIN_MISSING"))

    def test_rejects_structurally_invalid_archives(self):
        with self.assertRaises(Exception):
            LukuFile.open_bytes(b"just random garbage bytes")

        wrong_mime = io.BytesIO()
        with zipfile.ZipFile(wrong_mime, "w") as archive:
            archive.writestr("mimetype", b"application/pdf", compress_type=zipfile.ZIP_STORED)
        with self.assertRaisesRegex(Exception, "Invalid mimetype"):
            LukuFile.open_bytes(wrong_mime.getvalue())

        missing_manifest = io.BytesIO()
        with zipfile.ZipFile(missing_manifest, "w") as archive:
            archive.writestr("mimetype", LUKU_MIMETYPE.encode("utf-8"), compress_type=zipfile.ZIP_STORED)
        with self.assertRaisesRegex(Exception, "manifest.json missing"):
            LukuFile.open_bytes(missing_manifest.getvalue())

    def test_mutates_real_sample_archives_in_memory(self):
        sample_bytes = self.sample_path("first-passable-verification-sample.luku").read_bytes()
        original = LukuFile.open_bytes(sample_bytes)
        self.assertFalse(any(issue.criticality == Criticality.CRITICAL for issue in original.verify(self.build_test_options())))

        invalid_signature = LukuFile.open_bytes(sample_bytes)
        invalid_signature.blocks[0].batch[0]["signature"] = "not_base64_data!!!"
        self.assertTrue(self.has_issue(invalid_signature.verify(self.build_test_options()), "RECORD_SIGNATURE_INVALID", "ATTESTATION_FAILED"))

        mutated_canonical = LukuFile.open_bytes(sample_bytes)
        mutated_canonical.blocks[0].batch[0]["canonical_string"] += "X"
        self.assertTrue(self.has_issue(mutated_canonical.verify(self.build_test_options()), "RECORD_SIGNATURE_INVALID"))

        if len(original.blocks[0].batch) > 1:
            broken_chain = LukuFile.open_bytes(sample_bytes)
            broken_chain.blocks[0].batch[1]["previous_signature"] = "broken_link"
            self.assertTrue(self.has_issue(broken_chain.verify(self.build_test_options()), "RECORD_CHAIN_BROKEN"))

        if len(original.blocks) > 1:
            floating_anchor = LukuFile.open_bytes(sample_bytes)
            floating_anchor.blocks[1].batch[0]["previous_signature"] = "floating_anchor_test"
            self.assertFalse(self.has_issue(floating_anchor.verify(self.build_test_options()), "RECORD_CHAIN_BROKEN"))

        if len(original.blocks[0].batch) > 1:
            regressed_counter = LukuFile.open_bytes(sample_bytes)
            regressed_counter.blocks[0].batch[1]["payload"]["ctr"] = 0
            self.assertTrue(self.has_issue(regressed_counter.verify(self.build_test_options()), "COUNTER_REGRESSION"))

    def test_verifies_the_shipped_sample_directory(self):
        passable = LukuFile.open(self.sample_path("first-passable-verification-sample.luku"))
        self.assertFalse(any(issue.criticality == Criticality.CRITICAL for issue in passable.verify(self.build_test_options())))

        mismatch = LukuFile.open(self.sample_path("signature-mismatch.luku"))
        mismatch_issues = mismatch.verify(LukuVerifyOptions(allow_untrusted_roots=False, skip_certificate_temporal_checks=True, trust_profile="dev"))
        self.assertTrue(self.has_issue(mismatch_issues, "ATTESTATION_FAILED", "RECORD_SIGNATURE_INVALID", "ATTESTATION_CHAIN_MISSING"))

        invalid_chain = LukuFile.open(self.sample_path("invalid-chain.luku"))
        invalid_chain_issues = invalid_chain.verify(self.build_test_options())
        self.assertTrue(self.has_issue(invalid_chain_issues, "RECORD_CHAIN_BROKEN", "BLOCKS_HASH_MISMATCH", "ATTESTATION_FAILED"))

        dev_issues = passable.verify(LukuVerifyOptions(allow_untrusted_roots=False, skip_certificate_temporal_checks=True, trust_profile="dev"))
        self.assertFalse(any(issue.code == "ATTESTATION_FAILED" and "trust profile" in issue.message for issue in dev_issues))

        test_issues = passable.verify(LukuVerifyOptions(allow_untrusted_roots=False, skip_certificate_temporal_checks=True, trust_profile="test"))
        self.assertTrue(any(issue.code == "ATTESTATION_FAILED" and "trust profile" in issue.message for issue in test_issues))

        prod_issues = passable.verify(LukuVerifyOptions(allow_untrusted_roots=False, skip_certificate_temporal_checks=True, trust_profile="prod"))
        self.assertTrue(any(issue.code == "ATTESTATION_FAILED" and "trust profile" in issue.message for issue in prod_issues))


if __name__ == "__main__":
    unittest.main()
