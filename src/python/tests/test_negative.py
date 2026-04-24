# SPDX-License-Identifier: Apache-2.0
import unittest
import base64
import json
import copy
from pathlib import Path
from typing import Any
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization
from lukuid_sdk.luku import LukuFile, LukuVerifyOptions, LukuDeviceIdentity, LukuSigner

class TestSigner(LukuSigner):
    def __init__(self, private_key: ed25519.Ed25519PrivateKey):
        self._private_key = private_key
        self.public_key_bytes = private_key.public_key().public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw
        )

    @property
    def public_key_base64(self) -> str:
        return base64.b64encode(self.public_key_bytes).decode('utf-8')

    @property
    def private_key_pem(self) -> str:
        return self._private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ).decode('utf-8')

    def sign(self, data: bytes) -> bytes:
        return self._private_key.sign(data)

class TestNegativeTampering(unittest.TestCase):
    def samples_dir(self):
        current = Path(__file__).parent
        while not (current / "samples").exists():
            if current.parent == current:
                break
            current = current.parent
        return current / "samples" / "dotluku" / "dev" / "1.0.0"

    def create_valid_export(self, device_id: str) -> LukuFile:
        private_key = ed25519.Ed25519PrivateKey.generate()
        signer = TestSigner(private_key)
        public_key_b64 = base64.b64encode(signer.public_key_bytes).decode('utf-8')
        
        device = LukuDeviceIdentity(device_id=device_id, public_key=public_key_b64)
        
        records = [
            {
                "type": "scan",
                "signature": base64.b64encode(signer.sign(b"can1")).decode('utf-8'),
                "previous_signature": "genesis_fake",
                "canonical_string": "can1",
                "payload": {
                    "ctr": 1,
                    "timestamp_utc": 1000,
                    "genesis_hash": "genesis_fake"
                }
            }
        ]
        
        archive = LukuFile.export_with_identity(records, device, {}, signer)
        return LukuFile.open_bytes(archive.save_to_bytes())

    def get_test_options(self):
        return LukuVerifyOptions(allow_untrusted_roots=False, trust_profile="dev")

    def test_fails_when_attestation_signature_is_tampered(self):
        archive = self.create_valid_export("LUK-TAMPER-1")
        
        # Tamper with signature in the first block's first record
        record = archive.blocks[0].batch[0]
        original_sig = record["signature"]
        new_sig = original_sig.replace("A", "B")
        if new_sig == original_sig:
            new_sig = original_sig.replace("B", "A")
        if new_sig == original_sig:
            new_sig = original_sig + "X"
        record["signature"] = new_sig
        
        issues = archive.verify(self.get_test_options())
        self.assertTrue(any(i.code in ["RECORD_SIGNATURE_INVALID", "ATTESTATION_FAILED"] for i in issues))

    def test_fails_when_blocks_hash_is_tampered(self):
        archive = self.create_valid_export("LUK-TAMPER-2")
        
        # Tamper with blocks_hash in manifest
        archive.manifest.blocks_hash = "0" * 64
        
        options = LukuVerifyOptions()
        issues = archive.verify(options)
        self.assertTrue(any(i.code == "BLOCKS_HASH_MISMATCH" for i in issues))

    def test_fails_when_root_fingerprint_is_tampered(self):
        archive = self.create_valid_export("LUK-TAMPER-3")
        
        archive.blocks[0].attestation_root_fingerprint = "0" * 64
        
        issues = archive.verify(self.get_test_options())
        self.assertTrue(any(i.code in ["ATTESTATION_FAILED", "BLOCK_HASH_INVALID"] for i in issues))

    def test_fails_when_attestation_dac_cert_is_tampered(self):
        archive = self.create_valid_export("LUK-TAMPER-4")
        archive.blocks[0].attestation_dac_der = base64.b64encode(b"fake_der_data").decode('utf-8')
        
        issues = archive.verify(self.get_test_options())
        self.assertTrue(any(i.code in ["ATTESTATION_FAILED", "ATTESTATION_CHAIN_MISSING"] for i in issues))

    def test_fails_when_attestation_intermediate_cert_is_tampered(self):
        archive = self.create_valid_export("LUK-TAMPER-5")
        archive.blocks[0].attestation_intermediate_der = base64.b64encode(b"fake_der_data").decode('utf-8')
        
        issues = archive.verify(self.get_test_options())
        self.assertTrue(any(i.code in ["ATTESTATION_FAILED", "ATTESTATION_CHAIN_MISSING"] for i in issues))

    def test_fails_with_tampered_chain(self):
        sample_path = self.samples_dir() / "chain-tampered.luku"
        if not sample_path.exists():
            self.skipTest("Sample file not found")
            
        archive = LukuFile.open(sample_path)
        issues = archive.verify(self.get_test_options())
        self.assertTrue(any(i.code in ["ATTESTATION_FAILED", "BLOCKS_HASH_MISMATCH"] for i in issues))

if __name__ == "__main__":
    unittest.main()
