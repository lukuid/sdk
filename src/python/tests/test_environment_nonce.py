# SPDX-License-Identifier: Apache-2.0
# Environment records may carry a host challenge token: `nonce` is a content field
# at its alphabetical slot (between mobile_sinr_db and pressure_hpa) only when the
# record carries one (dotluku LUKU.md "environment").
import base64
import unittest

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ed25519

from lukuid_sdk import LukuFile, LukuVerifyOptions

NONCE = "app-nonce-0123456789"


def _canonical(public_key, nonce=None):
    slot = f"{nonce}:" if nonce else ""
    return (f"GC-TEST-1:{public_key}:environment:ENV-NONCE-1:4502:1770823456:3600000000:0.01:0.02:1.00:85:::::::::"
            f"45.20:21.50:350.50:::::::::::::{slot}1013.20:false:22.40:false:110:30000:genesis_fake")


def _envelope(nonce_in_signature=None, nonce_in_payload=None, canonical_nonce=None):
    key = ed25519.Ed25519PrivateKey.generate()
    raw = key.public_key().public_bytes(encoding=serialization.Encoding.Raw, format=serialization.PublicFormat.Raw)
    public_key = base64.b64encode(raw).decode()
    signed = _canonical(public_key, nonce_in_signature)
    payload = {
        "ctr": 4502, "timestamp_utc": 1770823456, "uptime_us": 3600000000,
        "battery_percent": 85, "vbus_present": False, "lux": 350.5, "temp_c": 22.4,
        "humidity_pct": 45.2, "initial_temp_c": 21.5, "pressure_hpa": 1013.2,
        "voc_raw": 30000, "voc_index": 110, "tamper": False,
        "accel_g": {"x": 0.01, "y": 0.02, "z": 1.0}, "genesis_hash": "genesis_fake",
    }
    if nonce_in_payload is not None:
        payload["nonce"] = nonce_in_payload
    return {
        "type": "environment", "id": "ENV-NONCE-1", "device_id": "GC-TEST-1", "public_key": public_key,
        "vendor": "LUKUID", "device": {"vendor": "LUKUID", "device_id": "GC-TEST-1", "public_key": public_key},
        "signature": base64.b64encode(key.sign(signed.encode())).decode(), "previous_signature": "genesis_fake",
        "canonical_string": _canonical(public_key, canonical_nonce) if canonical_nonce else signed,
        "payload": payload,
    }


def _codes(envelope):
    options = LukuVerifyOptions(allow_untrusted_roots=True, skip_certificate_temporal_checks=True, trust_profile="dev")
    return [issue.code for issue in LukuFile.verify_envelope(envelope, options)]


class TestEnvironmentNonce(unittest.TestCase):
    def test_record_with_nonce_verifies(self):
        self.assertEqual(_codes(_envelope(NONCE, NONCE)), [])

    def test_record_without_nonce_keeps_its_layout(self):
        self.assertEqual(_codes(_envelope()), [])
        self.assertEqual(_codes(_envelope(None, "")), [])

    def test_stripped_changed_or_added_nonce_fails(self):
        for env in (_envelope(NONCE, None), _envelope(NONCE, "app-nonce-XXXXXXXXXX"), _envelope(None, NONCE)):
            self.assertIn("RECORD_CANONICAL_MISMATCH", _codes(env))

    def test_forged_nonce_with_matching_canonical_fails_signature(self):
        self.assertIn("RECORD_SIGNATURE_INVALID", _codes(_envelope(None, NONCE, NONCE)))


if __name__ == "__main__":
    unittest.main()
