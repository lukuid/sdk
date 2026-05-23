# SPDX-License-Identifier: Apache-2.0
import unittest

from lukuid_sdk.attestation import (
    build_record_attestation_payload,
    build_record_heartbeat_payload,
)


class TestAttestationPayloads(unittest.TestCase):
    def test_build_record_attestation_payload(self) -> None:
        self.assertEqual(
            build_record_attestation_payload("GC-2005-EU", "base64_device_public_key", 42, "env-123"),
            b"attestation:GC-2005-EU:base64_device_public_key:42:env-123",
        )

    def test_build_record_heartbeat_payload(self) -> None:
        self.assertEqual(
            build_record_heartbeat_payload("GC-2005-EU", 1770800000, 42, "env-123"),
            b"heartbeat:GC-2005-EU:1770800000:42:env-123",
        )


if __name__ == "__main__":
    unittest.main()
