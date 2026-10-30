# SPDX-License-Identifier: Apache-2.0
# Genesis record rule: a native record whose previous_signature is the base64 of
# exactly 32 bytes must carry SHA-256 of the device's raw Ed25519 public key,
# and match genesis_hash if present. Independent of the (reissuable) DAC.
import base64
import hashlib
import os
import unittest

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ed25519
from lukuid_sdk.luku import LukuDeviceIdentity, LukuFile, LukuSigner, LukuVerifyOptions


class _Signer(LukuSigner):
    def __init__(self) -> None:
        self._key = ed25519.Ed25519PrivateKey.generate()
        self.raw_public_key = self._key.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)

    @property
    def public_key_base64(self) -> str:
        return base64.b64encode(self.raw_public_key).decode("ascii")

    @property
    def private_key_pem(self) -> str:
        return self._key.private_bytes(
            serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()
        ).decode("ascii")

    def sign(self, data: bytes) -> bytes:
        return self._key.sign(data)


def _random_b64(n: int) -> str:
    return base64.b64encode(os.urandom(n)).decode("ascii")


def _own(key_hash: str) -> str:
    return key_hash


def _genesis_issues(previous, genesis_hash=None, dac_b64=None):
    signer = _Signer()
    key_hash = base64.b64encode(hashlib.sha256(signer.raw_public_key).digest()).decode("ascii")
    payload = {"ctr": 7, "timestamp_utc": 1000}
    if genesis_hash is not None:
        payload["genesis_hash"] = genesis_hash(key_hash)
    records = [{
        "type": "scan",
        "signature": base64.b64encode(signer.sign(b"can1")).decode("ascii"),
        "previous_signature": previous(key_hash),
        "canonical_string": "can1",
        "payload": payload,
    }]
    device = LukuDeviceIdentity(device_id="LUK-GENESIS", public_key=signer.public_key_base64)
    archive = LukuFile.open_bytes(LukuFile.export_with_identity(records, device, {}, signer).save_to_bytes())
    if dac_b64 is not None:
        archive.blocks[0].attestation_dac_der = dac_b64
    issues = archive.verify(LukuVerifyOptions(allow_untrusted_roots=False, trust_profile="dev"))
    return [i for i in issues if i.code == "GENESIS_HASH_MISMATCH"]


class TestGenesisRecord(unittest.TestCase):
    def test_accepts_genesis_anchored_to_public_key_with_genesis_hash(self):
        self.assertEqual(_genesis_issues(_own, _own), [])

    def test_accepts_genesis_anchored_to_public_key_without_genesis_hash(self):
        self.assertEqual(_genesis_issues(_own), [])

    def test_does_not_depend_on_the_dac(self):
        self.assertEqual(_genesis_issues(_own, _own, _random_b64(300)), [])

    def test_rejects_32_byte_previous_signature_not_matching_public_key(self):
        issues = _genesis_issues(lambda _: _random_b64(32))
        self.assertTrue(any("SHA-256 of its public key" in i.message for i in issues))

    def test_rejects_genesis_hash_differing_from_previous_signature(self):
        issues = _genesis_issues(_own, lambda _: _random_b64(32))
        self.assertTrue(any("genesis_hash that does not match previous_signature" in i.message for i in issues))

    def test_64_byte_previous_signature_is_not_genesis(self):
        self.assertEqual(_genesis_issues(lambda _: _random_b64(64), lambda _: "genesis_fake"), [])


if __name__ == "__main__":
    unittest.main()
