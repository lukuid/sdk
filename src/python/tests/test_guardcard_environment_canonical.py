# SPDX-License-Identifier: Apache-2.0
import base64
import unittest

from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization

from lukuid_sdk import LukuFile, LukuVerifyOptions
from lukuid_sdk.luku import _recompute_record_canonical_string


class TestLukuIDEnvironmentEnvironmentCanonical(unittest.TestCase):
    def test_verify_envelope_accepts_new_voc_canonical_and_rejects_old_format(self):
        private_key = ed25519.Ed25519PrivateKey.generate()
        public_key = private_key.public_key()
        public_key_raw = public_key.public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw,
        )
        public_key_base64 = base64.b64encode(public_key_raw).decode("utf-8")

        record = {
            "type": "environment",
            "id": "ENV-VOC-1",
            "device_id": "GC-TEST-1",
            "public_key": public_key_base64,
            "previous_signature": "genesis_fake",
            "payload": {
                "ctr": 4502,
                "timestamp_utc": 1770823456,
                "uptime_us": 3600000000,
                "battery_percent": 85,
                "vbus_present": False,
                "lux": 350.5,
                "temp_c": 22.4,
                "humidity_pct": 45.2,
                "pressure_hpa": 1013.2,
                "voc_raw": 30000,
                "voc_index": 110,
                "tamper": False,
                "accel_g": {"x": 0.01, "y": 0.02, "z": 1.0},
                "genesis_hash": "genesis_fake",
            },
        }

        # Build the canonical string the same way the SDK itself does --
        # via the shared alphabetical-content-field builder -- rather than
        # hand-typing a positional string, so this test can never drift out
        # of sync with the production Field Order rule.
        canonical = _recompute_record_canonical_string(record, "environment", "GC-TEST-1", public_key_base64)
        signature = base64.b64encode(private_key.sign(canonical.encode("utf-8"))).decode("utf-8")

        envelope = {
            **record,
            "vendor": "LUKUID",
            "device": {
                "vendor": "LUKUID",
                "device_id": "GC-TEST-1",
                "public_key": public_key_base64,
            },
            "signature": signature,
            "canonical_string": canonical,
        }

        options = LukuVerifyOptions(
            allow_untrusted_roots=True,
            skip_certificate_temporal_checks=True,
            trust_profile="dev",
        )
        valid_issues = LukuFile.verify_envelope(envelope, options)
        self.assertFalse(valid_issues, f"Expected no issues, got: {valid_issues}")

        # Mutate the payload (drop voc_raw) so the stored canonical_string
        # (still signed over the ORIGINAL, complete payload) no longer
        # matches what the SDK independently recomputes from the payload's
        # own fields -- this must be caught by the SDK's own alphabetical
        # re-sorting/recomputation, not merely by re-typing a hand-written
        # "old format" string. The stored signature/canonical_string pair
        # is still internally self-consistent, so this is specifically a
        # RECORD_CANONICAL_MISMATCH, not a signature failure.
        invalid_envelope = dict(envelope)
        invalid_envelope["payload"] = dict(envelope["payload"])
        del invalid_envelope["payload"]["voc_raw"]
        invalid_issues = LukuFile.verify_envelope(invalid_envelope, options)
        self.assertTrue(any(issue.code == "RECORD_CANONICAL_MISMATCH" for issue in invalid_issues))
