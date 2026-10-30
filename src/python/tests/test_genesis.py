# SPDX-License-Identifier: Apache-2.0
# Genesis record rule: a native record whose previous_signature is the base64 of
# exactly 32 bytes must carry SHA-256(DAC DER), and match genesis_hash if present.
import base64
import hashlib
import os
import unittest

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ed25519
from lukuid_sdk.luku import LukuDeviceIdentity, LukuFile, LukuSigner, LukuVerifyOptions

DAC = os.urandom(300)
DAC_B64 = base64.b64encode(DAC).decode("ascii")
DAC_HASH_B64 = base64.b64encode(hashlib.sha256(DAC).digest()).decode("ascii")


class _Signer(LukuSigner):
    def __init__(self) -> None:
        self._key = ed25519.Ed25519PrivateKey.generate()

    @property
    def public_key_base64(self) -> str:
        raw = self._key.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
        return base64.b64encode(raw).decode("ascii")

    @property
    def private_key_pem(self) -> str:
        return self._key.private_bytes(
            serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()
        ).decode("ascii")

    def sign(self, data: bytes) -> bytes:
        return self._key.sign(data)


def _genesis_issues(previous_signature: str, genesis_hash: str | None = None, dac_b64: str | None = DAC_B64):
    signer = _Signer()
    payload = {"ctr": 7, "timestamp_utc": 1000}
    if genesis_hash is not None:
        payload["genesis_hash"] = genesis_hash
    records = [{
        "type": "scan",
        "signature": base64.b64encode(signer.sign(b"can1")).decode("ascii"),
        "previous_signature": previous_signature,
        "canonical_string": "can1",
        "payload": payload,
    }]
    device = LukuDeviceIdentity(device_id="LUK-GENESIS", public_key=signer.public_key_base64)
    archive = LukuFile.open_bytes(LukuFile.export_with_identity(records, device, {}, signer).save_to_bytes())
    archive.blocks[0].attestation_dac_der = dac_b64
    issues = archive.verify(LukuVerifyOptions(allow_untrusted_roots=False, trust_profile="dev"))
    return [i for i in issues if i.code == "GENESIS_HASH_MISMATCH"]


class TestGenesisRecord(unittest.TestCase):
    def test_accepts_genesis_anchored_to_dac_with_genesis_hash(self):
        self.assertEqual(_genesis_issues(DAC_HASH_B64, DAC_HASH_B64), [])

    def test_accepts_genesis_anchored_to_dac_without_genesis_hash(self):
        self.assertEqual(_genesis_issues(DAC_HASH_B64), [])

    def test_rejects_32_byte_previous_signature_not_matching_dac(self):
        issues = _genesis_issues(base64.b64encode(os.urandom(32)).decode("ascii"))
        self.assertTrue(any("SHA-256 of its DAC" in i.message for i in issues))

    def test_rejects_genesis_without_dac(self):
        issues = _genesis_issues(DAC_HASH_B64, DAC_HASH_B64, None)
        self.assertTrue(any("DAC certificate missing" in i.message for i in issues))

    def test_rejects_genesis_hash_differing_from_previous_signature(self):
        issues = _genesis_issues(DAC_HASH_B64, base64.b64encode(os.urandom(32)).decode("ascii"))
        self.assertTrue(any("genesis_hash that does not match previous_signature" in i.message for i in issues))

    def test_64_byte_previous_signature_is_not_genesis(self):
        self.assertEqual(_genesis_issues(base64.b64encode(os.urandom(64)).decode("ascii"), "genesis_fake"), [])


if __name__ == "__main__":
    unittest.main()
