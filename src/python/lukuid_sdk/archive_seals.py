# SPDX-License-Identifier: Apache-2.0
"""Offline ML-DSA-65 archive seals using a local OpenSSL 3.5+ executable."""

from __future__ import annotations

import base64
import hashlib
import json
import subprocess
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from asn1crypto import core, parser
from cryptography import x509
from cryptography.exceptions import InvalidSignature, UnsupportedAlgorithm
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec, padding, rsa
from cryptography.hazmat.primitives.asymmetric.utils import encode_dss_signature

# DER SubjectPublicKeyInfo prefix for id-ml-dsa-65 and a 1952-byte key.
_MLDSA65_SPKI_PREFIX = bytes.fromhex("308207b2300b0609608648016503040312038207a100")
_ANDROID_ROOTS = {
    "cedb1cb6dc896ae5ec797348bce9286753c2b38ee71ce0fbe34a9a1248800dfc",
    "6d9db4ce6c5c0b293166d08986e05774a8776ceb525d9e4329520de12ba4bcc0",
}
_ANDROID_ATTESTATION_OID = x509.ObjectIdentifier("1.3.6.1.4.1.11129.2.1.17")


class _IntegerSet(core.SetOf):
    _child_spec = core.Integer


def _der_children(encoded: bytes, expected_tag: int) -> list[tuple[int, int, bytes]]:
    class_id, method, tag, _, content, trailer = parser.parse(encoded, strict=True)
    if class_id != 0 or method != 1 or tag != expected_tag or trailer:
        raise ValueError("Invalid attestation DER structure")
    children = []
    while content:
        consumed = parser.peek(content)
        child_class, child_method, child_tag, header, child_content, _ = parser.parse(content[:consumed], strict=True)
        children.append((child_class, child_tag, header + child_content))
        content = content[consumed:]
        if child_class == 2 and child_method != 1:
            raise ValueError("Invalid attestation authorization tag")
    return children


def _authorization_value(encoded: bytes, tag: int, expected_tag: int) -> bytes:
    for child_class, child_tag, child in _der_children(encoded, 16):
        if child_class == 2 and child_tag == tag:
            _, _, _, _, inner, trailer = parser.parse(child, strict=True)
            if trailer:
                raise ValueError("Trailing authorization DER")
            class_id, _, actual_tag, _, _, trailing = parser.parse(inner, strict=True)
            if class_id != 0 or actual_tag != expected_tag or trailing:
                raise ValueError("Invalid authorization value")
            return inner
    raise ValueError("Missing hardware authorization")


def _signed_android_level(cert: x509.Certificate, challenge: bytes) -> str:
    extension = cert.extensions.get_extension_for_oid(_ANDROID_ATTESTATION_OID)
    children = _der_children(extension.value.value, 16)
    if len(children) < 8:
        raise ValueError("Incomplete Android attestation")
    attestation_level = int(core.Enumerated.load(children[1][2]))
    key_level = int(core.Enumerated.load(children[3][2]))
    if attestation_level not in (1, 2) or key_level != attestation_level:
        raise ValueError("Software security level")
    if core.OctetString.load(children[4][2]).native != challenge:
        raise ValueError("Attestation challenge mismatch")
    hardware = children[7][2]
    if (core.Integer.load(_authorization_value(hardware, 2, 2)).native != 3
            or core.Integer.load(_authorization_value(hardware, 3, 2)).native != 256
            or core.Integer.load(_authorization_value(hardware, 702, 2)).native != 0):
        raise ValueError("Hardware key properties mismatch")
    purposes = _IntegerSet.load(_authorization_value(hardware, 1, 17))
    digests = _IntegerSet.load(_authorization_value(hardware, 5, 17))
    if 2 not in purposes.native or 4 not in digests.native:
        raise ValueError("Hardware signing authorization absent")
    return "strongbox" if attestation_level == 2 else "tee"


def _verify_cert_signature(cert: x509.Certificate, issuer: x509.Certificate) -> None:
    key = issuer.public_key()
    if isinstance(key, ec.EllipticCurvePublicKey):
        key.verify(cert.signature, cert.tbs_certificate_bytes, ec.ECDSA(cert.signature_hash_algorithm))
    elif isinstance(key, rsa.RSAPublicKey):
        key.verify(cert.signature, cert.tbs_certificate_bytes, padding.PKCS1v15(), cert.signature_hash_algorithm)
    else:
        raise ValueError("Unsupported Android attestation certificate key")


def verify_android(seal: dict[str, Any], manifest_hash: str) -> bool:
    try:
        if seal.get("platform") != "android" or seal.get("alg") != "ES256":
            return False
        key_der = base64.b64decode(seal["public_key"], validate=True)
        signature = base64.b64decode(seal["signature"], validate=True)
        chain_values = seal["certificate_chain"]
        if (len(signature) != 64 or type(chain_values) is not list or not 2 <= len(chain_values) <= 12
                or seal.get("key_id") != hashlib.sha256(key_der).hexdigest()):
            return False
        chain_der = [base64.b64decode(value, validate=True) for value in chain_values]
        if (base64.b64encode(key_der).decode("ascii") != seal["public_key"]
                or base64.b64encode(signature).decode("ascii") != seal["signature"]
                or any(base64.b64encode(value).decode("ascii") != source for value, source in zip(chain_der, chain_values))):
            return False
        chain = [x509.load_der_x509_certificate(value) for value in chain_der]
        if hashlib.sha256(chain_der[-1]).hexdigest() not in _ANDROID_ROOTS:
            return False
        timestamp = datetime.fromtimestamp(seal["created_at_utc"], tz=timezone.utc)
        for index, cert in enumerate(chain):
            valid_from = getattr(cert, "not_valid_before_utc", None) or cert.not_valid_before.replace(tzinfo=timezone.utc)
            valid_to = getattr(cert, "not_valid_after_utc", None) or cert.not_valid_after.replace(tzinfo=timezone.utc)
            if not valid_from <= timestamp <= valid_to:
                return False
            if index > 0:
                if not cert.extensions.get_extension_for_class(x509.BasicConstraints).value.ca:
                    return False
                try:
                    usage = cert.extensions.get_extension_for_class(x509.KeyUsage).value
                    if not usage.key_cert_sign:
                        return False
                except x509.ExtensionNotFound:
                    pass
            if index < len(chain) - 1:
                if cert.issuer != chain[index + 1].subject:
                    return False
                _verify_cert_signature(cert, chain[index + 1])
        _verify_cert_signature(chain[-1], chain[-1])
        for cert in chain[1:]:
            try:
                cert.extensions.get_extension_for_oid(_ANDROID_ATTESTATION_OID)
                return False
            except x509.ExtensionNotFound:
                pass
    except (ValueError, TypeError, KeyError, OverflowError, AttributeError, InvalidSignature, UnsupportedAlgorithm, x509.ExtensionNotFound):
        return False
    try:
        key = chain[0].public_key()
        if (not isinstance(key, ec.EllipticCurvePublicKey) or not isinstance(key.curve, ec.SECP256R1)
                or key.public_bytes(serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo) != key_der):
            return False
        level = _signed_android_level(chain[0], bytes.fromhex(manifest_hash))
        if seal.get("metadata", {}).get("security_level") != level:
            return False
        r = int.from_bytes(signature[:32], "big")
        s = int.from_bytes(signature[32:], "big")
        key.verify(encode_dss_signature(r, s), _payload(manifest_hash, seal["created_at_utc"]), ec.ECDSA(hashes.SHA256()))
        return True
    except (ValueError, TypeError, KeyError, AttributeError, x509.ExtensionNotFound, InvalidSignature, UnsupportedAlgorithm):
        return False


def _payload(manifest_hash: str, timestamp: int) -> bytes:
    if type(timestamp) is not int or timestamp < 0:
        raise ValueError("Archive seal timestamp is invalid")
    return (
        "LUKUID-ARCHIVE-SEAL-V1\n"
        "manifest_hash_alg=SHA-256\n"
        f"manifest_hash={manifest_hash}\n"
        f"created_at_utc={timestamp}"
    ).encode("utf-8")


def _run(*args: str) -> bool:
    try:
        return subprocess.run(["openssl", *args], capture_output=True, check=False).returncode == 0
    except OSError:
        return False


def create(manifest: bytes, timestamp: int) -> str:
    manifest_hash = hashlib.sha256(manifest).hexdigest()
    payload = _payload(manifest_hash, timestamp)
    with tempfile.TemporaryDirectory(prefix="lukuid-archive-seal-") as temporary:
        directory = Path(temporary)
        private_key = directory / "key.pem"
        public_key = directory / "public.der"
        message = directory / "payload"
        signature = directory / "signature"
        message.write_bytes(payload)
        if not _run("genpkey", "-algorithm", "ML-DSA-65", "-out", str(private_key)):
            raise RuntimeError("A local OpenSSL 3.5+ ML-DSA-65 provider is required for .luku export")
        if not _run("pkey", "-in", str(private_key), "-pubout", "-outform", "DER", "-out", str(public_key)):
            raise RuntimeError("Failed to export ML-DSA-65 public key")
        if not _run("pkeyutl", "-sign", "-rawin", "-inkey", str(private_key), "-in", str(message), "-out", str(signature)):
            raise RuntimeError("Failed to create ML-DSA-65 archive seal")
        public_der = public_key.read_bytes()
        signature_bytes = signature.read_bytes()
        if not public_der.startswith(_MLDSA65_SPKI_PREFIX) or len(public_der) != 1974 or len(signature_bytes) != 3309:
            raise RuntimeError("OpenSSL returned nonconforming ML-DSA-65 material")
        raw_public_key = public_der[len(_MLDSA65_SPKI_PREFIX):]
    return json.dumps({
        "version": 1,
        "manifest_hash": {"alg": "SHA-256", "value": manifest_hash},
        "seals": [{
            "type": "self",
            "alg": "ML-DSA-65",
            "created_at_utc": timestamp,
            "public_key": base64.b64encode(raw_public_key).decode("ascii"),
            "signature": base64.b64encode(signature_bytes).decode("ascii"),
        }],
    }, indent=2)


def verify_self(seal: dict[str, Any], manifest_hash: str) -> bool:
    try:
        timestamp = seal["created_at_utc"]
        payload = _payload(manifest_hash, timestamp)
        key = base64.b64decode(seal["public_key"], validate=True)
        signature = base64.b64decode(seal["signature"], validate=True)
        if (seal["alg"] != "ML-DSA-65" or len(key) != 1952 or len(signature) != 3309
                or base64.b64encode(key).decode("ascii") != seal["public_key"]
                or base64.b64encode(signature).decode("ascii") != seal["signature"]):
            return False
    except (ValueError, TypeError, KeyError):
        return False
    with tempfile.TemporaryDirectory(prefix="lukuid-archive-verify-") as temporary:
        directory = Path(temporary)
        public_key = directory / "public.der"
        message = directory / "payload"
        signature_file = directory / "signature"
        public_key.write_bytes(_MLDSA65_SPKI_PREFIX + key)
        message.write_bytes(payload)
        signature_file.write_bytes(signature)
        return _run("pkeyutl", "-verify", "-rawin", "-pubin", "-inkey", str(public_key),
                    "-keyform", "DER", "-in", str(message), "-sigfile", str(signature_file))


def verify(raw: str | None, manifest: bytes) -> list[tuple[str, str, str]]:
    if raw is None:
        return [("ARCHIVE_SEALS_MISSING", "The required seals.json file is missing.", "critical")]
    try:
        root = json.loads(raw)
        seals = root["seals"]
        if (type(root) is not dict or type(root.get("version")) is not int or root["version"] != 1
                or type(seals) is not list or not seals
                or type(root.get("manifest_hash")) is not dict
                or root["manifest_hash"]["alg"] != "SHA-256"):
            raise ValueError("Invalid required fields")
    except (ValueError, TypeError, KeyError):
        return [("ARCHIVE_SEALS_MALFORMED", "seals.json has invalid required fields.", "critical")]
    manifest_hash = hashlib.sha256(manifest).hexdigest()
    if root["manifest_hash"].get("value") != manifest_hash:
        return [("ARCHIVE_SEALS_MANIFEST_HASH_MISMATCH", "seals.json does not commit to the exact manifest.json bytes.", "critical")]
    issues: list[tuple[str, str, str]] = []
    valid_self = False
    shared_timestamp: int | None = None
    for seal in seals:
        if (type(seal) is not dict or type(seal.get("created_at_utc")) is not int
                or seal["created_at_utc"] < 0 or type(seal.get("type")) is not str):
            issues.append(("ARCHIVE_SEALS_MALFORMED", "A seal has invalid required fields.", "critical"))
            continue
        if shared_timestamp is not None and seal["created_at_utc"] != shared_timestamp:
            issues.append(("ARCHIVE_SEALS_MALFORMED", "Seals do not share one canonical payload timestamp.", "critical"))
            continue
        shared_timestamp = seal["created_at_utc"]
        if seal["type"] == "self":
            if verify_self(seal, manifest_hash):
                valid_self = True
            else:
                issues.append(("ARCHIVE_SELF_SEAL_INVALID", "A required ML-DSA-65 self seal failed cryptographic verification.", "critical"))
        elif seal["type"] == "platform":
            if not all(type(seal.get(field)) is str and seal[field] for field in ("platform", "alg", "public_key", "signature")):
                issues.append(("ARCHIVE_SEALS_MALFORMED", "A platform seal has invalid required fields.", "critical"))
            elif seal["platform"] == "android" and seal["alg"] == "ES256":
                if not verify_android(seal, manifest_hash):
                    issues.append(("ARCHIVE_PLATFORM_SEAL_INVALID", "The Android hardware seal failed offline signature or attestation verification.", "critical"))
            else:
                issues.append(("ARCHIVE_PLATFORM_SEAL_UNSUPPORTED", "This SDK cannot independently validate this platform seal.", "warning"))
        elif seal["type"] == "authority":
            if (not all(type(seal.get(field)) is str and seal[field] for field in ("alg", "key_id", "root_fingerprint", "signature"))
                    or type(seal.get("certificate_chain")) is not list):
                issues.append(("ARCHIVE_SEALS_MALFORMED", "An authority seal has invalid required fields.", "critical"))
            else:
                issues.append(("ARCHIVE_AUTHORITY_SEAL_UNSUPPORTED", "Authority seals are reserved and are not trusted by this SDK.", "warning"))
        else:
            issues.append(("ARCHIVE_SEALS_MALFORMED", "Unknown seal type.", "critical"))
    if not valid_self:
        issues.append(("ARCHIVE_SELF_SEAL_MISSING", "The archive has no valid ML-DSA-65 self seal.", "critical"))
    return issues
