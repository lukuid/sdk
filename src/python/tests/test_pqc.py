# SPDX-License-Identifier: Apache-2.0
import unittest
import base64
from lukuid_sdk.attestation import verify_device_attestation, DeviceAttestationInputs

class TestPqcVerification(unittest.TestCase):
    def test_pqc_stub_rejection(self):
        # Test that a PQC signature is actually checked and rejected if invalid
        inputs = DeviceAttestationInputs(
            id="test-device",
            key="base64-key",
            attestation_sig=base64.b64encode(bytes([0]*3309)).decode(),
            certificate_chain="-----BEGIN CERTIFICATE-----\nMII...\n-----END CERTIFICATE-----",
            trust_profile="prod"
        )
        # This should fail because the sig is all zeros
        result = verify_device_attestation(inputs)
        self.assertFalse(result.ok)

if __name__ == "__main__":
    unittest.main()
