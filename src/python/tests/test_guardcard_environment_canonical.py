# SPDX-License-Identifier: Apache-2.0
import base64
import unittest

from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization

from lukuid_sdk import LukuFile, LukuVerifyOptions


class TestLukuIDEnvironmentEnvironmentCanonical(unittest.TestCase):
    def test_verify_envelope_accepts_new_voc_canonical_and_rejects_old_format(self):
        private_key = ed25519.Ed25519PrivateKey.generate()
        public_key = private_key.public_key()
        public_key_raw = public_key.public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw,
        )
        public_key_base64 = base64.b64encode(public_key_raw).decode("utf-8")

        canonical = (
            f"GC-TEST-1:{public_key_base64}:environment:ENV-VOC-1:4502:1770823456:"
            "3600000000:85:false:350.50:22.40:45.20:1013.20:30000:110:false:0.01:0.02:1.00:genesis_fake"
        )
        signature = base64.b64encode(private_key.sign(canonical.encode("utf-8"))).decode("utf-8")

        envelope = {
            "type": "environment",
            "id": "ENV-VOC-1",
            "device_id": "GC-TEST-1",
            "public_key": public_key_base64,
            "vendor": "LUKUID",
            "device": {
                "vendor": "LUKUID",
                "device_id": "GC-TEST-1",
                "public_key": public_key_base64,
            },
            "signature": signature,
            "previous_signature": "genesis_fake",
            "canonical_string": canonical,
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

        options = LukuVerifyOptions(
            allow_untrusted_roots=True,
            skip_certificate_temporal_checks=True,
            trust_profile="dev",
        )
        valid_issues = LukuFile.verify_envelope(envelope, options)
        self.assertFalse(valid_issues, f"Expected no issues, got: {valid_issues}")

        invalid_envelope = dict(envelope)
        invalid_envelope["canonical_string"] = (
            f"GC-TEST-1:{public_key_base64}:environment:ENV-VOC-1:4502:1770823456:"
            "3600000000:85:false:350.50:22.40:45.20:1013.20:110:false:0.01:0.02:1.00:genesis_fake"
        )
        invalid_issues = LukuFile.verify_envelope(invalid_envelope, options)
        self.assertTrue(any(issue.code == "RECORD_SIGNATURE_INVALID" for issue in invalid_issues))
