# SPDX-License-Identifier: Apache-2.0
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
    with open(resolve_sample(), "r", encoding="utf-8") as handle:
        return json.load(handle)


def verify(envelope: dict):
    return LukuFile.verify_envelope(envelope, LukuVerifyOptions(
        allow_untrusted_roots=False,
        skip_certificate_temporal_checks=True,
        trust_profile="dev"
    ))


class TestGuardCardParity(unittest.TestCase):
    def test_dac_chain_still_binds_device_without_detached_signature_fields(self):
        envelope = get_valid_envelope()
        envelope.pop("attestation_signature", None)
        envelope["identity"].pop("signature", None)

        issues = verify(envelope)
        self.assertFalse(issues, f"Expected no issues, got: {issues}")

    def test_heartbeat_signature_requires_trusted_heartbeat_timestamp(self):
        envelope = get_valid_envelope()
        envelope["heartbeat_signature"] = envelope["identity"]["signature"]
        envelope["identity"].pop("last_sync_utc", None)
        envelope.pop("last_sync_utc", None)

        issues = verify(envelope)
        self.assertTrue(
            any(i.code == "ATTESTATION_FAILED" and "Missing trusted heartbeat timestamp" in i.message for i in issues),
            f"Expected missing trusted heartbeat timestamp failure, got: {issues}"
        )

    def test_heartbeat_signature_must_match_heartbeat_payload(self):
        envelope = get_valid_envelope()
        envelope["heartbeat_signature"] = envelope["identity"]["signature"]
        envelope["identity"]["last_sync_utc"] = 1777286310

        issues = verify(envelope)
        self.assertTrue(
            any(i.code == "ATTESTATION_FAILED" and "SLAC (heartbeat)" in i.message for i in issues),
            f"Expected heartbeat signature verification failure, got: {issues}"
        )

    def test_last_sync_cannot_be_after_record_timestamp(self):
        envelope = get_valid_envelope()
        envelope["heartbeat_signature"] = envelope["identity"]["signature"]
        envelope["identity"]["last_sync_utc"] = 1777286312

        issues = verify(envelope)
        self.assertTrue(
            any(i.code == "LAST_SYNC_AFTER_RECORD" for i in issues),
            f"Expected LAST_SYNC_AFTER_RECORD, got: {issues}"
        )


if __name__ == "__main__":
    unittest.main()
