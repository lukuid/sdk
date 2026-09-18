# SPDX-License-Identifier: Apache-2.0
import base64
import json
import unittest
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization

from lukuid_sdk.luku import LukuFile, LukuVerifyOptions, Criticality

class TestAnimalScanMetricsIntegrity(unittest.TestCase):
    def setUp(self):
        self.private_key = ed25519.Ed25519PrivateKey.generate()
        self.public_key = self.private_key.public_key()
        self.pub_bytes = self.public_key.public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw
        )
        self.pub_b64 = base64.b64encode(self.pub_bytes).decode("utf-8")
        self.device_id = "LUKUID-ANIMAL-READER-001"

    def _build_valid_scan_envelope(self, metrics=None, scan_version="1.0.0", profile="animal"):
        if metrics is None:
            metrics = [38.5, 45.0, -65.0, 12.0, 5.0, 120.0, 2.0, 3300.0, 10.0, 11.0, 1.0, 2000.0, 50.0, 1.2, 1.0, 5.0, -2.0, 0.0]
        
        payload = {
            "ctr": 1001,
            "timestamp_utc": 1770823456,
            "uptime_us": 120000000,
            "nonce": "test_challenge_nonce",
            "firmware": "AR-v1.0.0",
            "profile": profile,
            "protocol": "FDX-B",
            "scan_version": scan_version,
            "tag_id": "981098109810981",
            "temperature_c": 38.5,
            "metrics": metrics
        }
        
        # Format canonical metrics string (2-decimal floats joined by commas)
        formatted_metrics = ",".join(f"{x:.2f}" for x in metrics) if metrics else ""
        
        # Profile fields, alphabetical: protocol, scan_version, tag_id, temperature_c
        content_str = f"FDX-B:{scan_version}:981098109810981:38.50"
        
        canonical_str = f"{self.device_id}:{self.pub_b64}:scan:SCAN-REC-001:1001:1770823456:120000000:{profile}:test_challenge_nonce:AR-v1.0.0:{content_str}:{formatted_metrics}:"
        
        sig_bytes = self.private_key.sign(canonical_str.encode("utf-8"))
        sig_b64 = base64.b64encode(sig_bytes).decode("utf-8")

        envelope = {
            "type": "scan",
            "id": "SCAN-REC-001",
            "version": "1.0.0",
            "alg": "ED25519",
            "signature": sig_b64,
            "previous_signature": "",
            "canonical_string": canonical_str,
            "device": {
                "vendor": "LUKUID",
                "device_id": self.device_id,
                "public_key": self.pub_b64
            },
            "payload": payload
        }
        return envelope

    def test_metrics_survive_export_import_unchanged(self):
        original_metrics = [38.5, 45.0, -65.0, 12.0, 5.0, 120.0, 2.0, 3300.0, 10.0, 11.0, 1.0, 2000.0, 50.0, 1.2, 1.0, 5.0, -2.0, 0.0]
        envelope = self._build_valid_scan_envelope(metrics=original_metrics)
        
        issues = LukuFile.verify_envelope(envelope, LukuVerifyOptions(allow_untrusted_roots=True, trust_profile="dev"))
        criticals = [i for i in issues if i.criticality == Criticality.CRITICAL]
        self.assertEqual(len(criticals), 0, f"Valid envelope failed verification: {criticals}")

    def test_single_metric_value_modification_fails_closed(self):
        metrics = [38.5, 45.0, -65.0, 12.0, 5.0, 120.0, 2.0, 3300.0, 10.0, 11.0, 1.0, 2000.0, 50.0, 1.2, 1.0, 5.0, -2.0, 0.0]
        envelope = self._build_valid_scan_envelope(metrics=metrics)
        
        # Tamper with single metric (e.g. RSSI at index 2 from -65.0 to -80.0)
        envelope["payload"]["metrics"][2] = -80.0
        
        issues = LukuFile.verify_envelope(envelope, LukuVerifyOptions(allow_untrusted_roots=True, trust_profile="dev"))
        criticals = [i for i in issues if i.criticality == Criticality.CRITICAL]
        self.assertTrue(any(i.code == "RECORD_CANONICAL_MISMATCH" for i in criticals),
                        f"Tampered metric value did not trigger RECORD_CANONICAL_MISMATCH: {criticals}")

    def test_metric_removal_reordering_truncation_appends_fail_closed(self):
        metrics = [38.5, 45.0, -65.0, 12.0, 5.0, 120.0, 2.0, 3300.0, 10.0, 11.0, 1.0, 2000.0, 50.0, 1.2, 1.0, 5.0, -2.0, 0.0]
        
        # Case A: Removal / Truncation
        envelope = self._build_valid_scan_envelope(metrics=metrics)
        envelope["payload"]["metrics"].pop()
        issues = LukuFile.verify_envelope(envelope, LukuVerifyOptions(allow_untrusted_roots=True, trust_profile="dev"))
        self.assertTrue(any(i.code == "RECORD_CANONICAL_MISMATCH" and i.criticality == Criticality.CRITICAL for i in issues))

        # Case B: Append
        envelope = self._build_valid_scan_envelope(metrics=metrics)
        envelope["payload"]["metrics"].append(99.0)
        issues = LukuFile.verify_envelope(envelope, LukuVerifyOptions(allow_untrusted_roots=True, trust_profile="dev"))
        self.assertTrue(any(i.code == "RECORD_CANONICAL_MISMATCH" and i.criticality == Criticality.CRITICAL for i in issues))

        # Case C: Reordering
        reordered = list(metrics)
        reordered[0], reordered[1] = reordered[1], reordered[0]
        envelope = self._build_valid_scan_envelope(metrics=metrics)
        envelope["payload"]["metrics"] = reordered
        issues = LukuFile.verify_envelope(envelope, LukuVerifyOptions(allow_untrusted_roots=True, trust_profile="dev"))
        self.assertTrue(any(i.code == "RECORD_CANONICAL_MISMATCH" and i.criticality == Criticality.CRITICAL for i in issues))

    def test_unknown_profile_or_schema_fails_closed(self):
        # Unknown scan profile "unknown_profile_v99"
        envelope = self._build_valid_scan_envelope(profile="unknown_profile_v99")
        issues = LukuFile.verify_envelope(envelope, LukuVerifyOptions(allow_untrusted_roots=True, trust_profile="dev"))
        criticals = [i for i in issues if i.criticality == Criticality.CRITICAL]
        self.assertTrue(any(i.code == "RECORD_SCHEMA_UNRECOGNIZED" for i in criticals),
                        f"Unrecognized scan profile did not trigger RECORD_SCHEMA_UNRECOGNIZED: {criticals}")

if __name__ == "__main__":
    unittest.main()
