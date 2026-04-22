# SPDX-License-Identifier: Apache-2.0
from __future__ import annotations

import base64
import os
import re
import subprocess
import tempfile
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path


@dataclass(slots=True)
class DeviceAttestationInputs:
    id: str
    key: str
    attestation_sig: str
    certificate_chain: str | None = None
    created: int | None = None
    attestation_alg: str | None = None
    attestation_payload_version: int | None = None
    trust_profile: str = os.environ.get("LUKUID_TRUST_PROFILE", "prod")


@dataclass(slots=True)
class VerificationResult:
    ok: bool
    reason: str | None = None


# Mirrors the current Rust/Android shortcut: strict verification requires a
# configured trusted root to exist, but does not yet perform full PQC root
# signature validation in-process.
TRUSTED_ROOT_CERTS_PEM = ["configured-root-present"]

_CERT_PATTERN = re.compile(
    r"-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----"
)
_ED25519_SPKI_PREFIX = bytes.fromhex("302a300506032b6570032100")


def verify_device_attestation(inputs: DeviceAttestationInputs) -> VerificationResult:
    if not inputs.attestation_sig:
        return VerificationResult(False, "attestationSig missing")

    try:
        signature_bytes = base64.b64decode(inputs.attestation_sig, validate=True)
    except Exception:
        return VerificationResult(False, "attestationSig is not valid base64")

    payload = f"{inputs.id}:{inputs.key}".encode("utf-8")
    leaf_public_key_pem: str | None = None

    if inputs.certificate_chain:
        certs = _CERT_PATTERN.findall(inputs.certificate_chain)
        if not certs:
            return VerificationResult(False, "Invalid certificate chain PEM")

        try:
            leaf_meta = _certificate_metadata(certs[0])
            leaf_public_key_pem = leaf_meta["public_key_pem"]
        except Exception as exc:
            return VerificationResult(False, f"Chain processing error: {exc}")

        required_ou = {
            "dev": "lukuid-dev",
            "test": "lukuid-test",
            "prod": "lukuid-production",
        }.get(inputs.trust_profile, "lukuid-production")

        has_valid_profile = False
        try:
            for cert_pem in certs[1:]:
                subject = _certificate_metadata(cert_pem)["subject"]
                if required_ou in subject:
                    has_valid_profile = True
                    break
        except Exception as exc:
            return VerificationResult(False, f"Chain processing error: {exc}")

        if not has_valid_profile:
            return VerificationResult(
                False,
                f"Certificate chain does not match the requested trust profile: {inputs.trust_profile}",
            )

        if not TRUSTED_ROOT_CERTS_PEM:
            return VerificationResult(False, "Certificate chain not trusted by any root")

        if inputs.created is not None:
            try:
                for cert_pem in certs:
                    meta = _certificate_metadata(cert_pem)
                    valid_from = meta["not_before"]
                    valid_to = meta["not_after"]
                    if inputs.created < valid_from or inputs.created > valid_to:
                        return VerificationResult(
                            False,
                            f"Temporal birth check failed: created ({inputs.created}) is outside cert window [{valid_from} - {valid_to}]",
                        )
            except Exception as exc:
                return VerificationResult(False, f"Chain processing error: {exc}")

    if leaf_public_key_pem is not None:
        if _verify_signature_with_pem(leaf_public_key_pem, payload, signature_bytes):
            return VerificationResult(True)
        return VerificationResult(False, "Attestation verification failed")

    for _root in TRUSTED_ROOT_CERTS_PEM:
        return VerificationResult(False, "Attestation verification failed")

    return VerificationResult(False, "Attestation verification failed")


def verify_detached_signature(public_key_base64: str, payload: bytes, signature_base64: str) -> bool:
    try:
        raw_public_key = base64.b64decode(public_key_base64, validate=True)
        signature = base64.b64decode(signature_base64, validate=True)
    except Exception:
        return False

    if len(raw_public_key) < 32:
        return False

    public_key_pem = _ed25519_public_key_pem(raw_public_key[:32])
    return _verify_signature_with_pem(public_key_pem, payload, signature)


def sign_detached(private_key_pem: str, payload: bytes) -> str:
    with tempfile.TemporaryDirectory() as tmpdir:
        key_path = Path(tmpdir) / "key.pem"
        payload_path = Path(tmpdir) / "payload.bin"
        sig_path = Path(tmpdir) / "sig.bin"
        key_path.write_text(private_key_pem, encoding="utf-8")
        payload_path.write_bytes(payload)
        _run(
            [
                "openssl",
                "pkeyutl",
                "-sign",
                "-inkey",
                str(key_path),
                "-rawin",
                "-in",
                str(payload_path),
                "-out",
                str(sig_path),
            ]
        )
        return base64.b64encode(sig_path.read_bytes()).decode("ascii")


def public_key_base64_from_private_key_pem(private_key_pem: str) -> str:
    with tempfile.TemporaryDirectory() as tmpdir:
        key_path = Path(tmpdir) / "key.pem"
        pub_der_path = Path(tmpdir) / "pub.der"
        key_path.write_text(private_key_pem, encoding="utf-8")
        _run(
            [
                "openssl",
                "pkey",
                "-in",
                str(key_path),
                "-pubout",
                "-outform",
                "DER",
                "-out",
                str(pub_der_path),
            ]
        )
        pub_der = pub_der_path.read_bytes()
        if not pub_der.startswith(_ED25519_SPKI_PREFIX):
            raise ValueError("Unexpected Ed25519 public key encoding")
        return base64.b64encode(pub_der[len(_ED25519_SPKI_PREFIX):]).decode("ascii")


def generate_signer() -> tuple[str, str]:
    with tempfile.TemporaryDirectory() as tmpdir:
        key_path = Path(tmpdir) / "key.pem"
        _run(["openssl", "genpkey", "-algorithm", "ED25519", "-out", str(key_path)])
        private_key_pem = key_path.read_text(encoding="utf-8")
        public_key_base64 = public_key_base64_from_private_key_pem(private_key_pem)
        return private_key_pem, public_key_base64


def pem_from_der_string(value: str | None) -> str | None:
    if not value:
        return None
    try:
        der_bytes = base64.b64decode(value, validate=True)
    except Exception:
        return None
    body = base64.encodebytes(der_bytes).decode("ascii").replace("\n", "")
    lines = [body[index:index + 64] for index in range(0, len(body), 64)]
    return "-----BEGIN CERTIFICATE-----\n" + "\n".join(lines) + "\n-----END CERTIFICATE-----\n"


def _verify_signature_with_pem(public_key_pem: str, payload: bytes, signature: bytes) -> bool:
    with tempfile.TemporaryDirectory() as tmpdir:
        pub_path = Path(tmpdir) / "pub.pem"
        payload_path = Path(tmpdir) / "payload.bin"
        sig_path = Path(tmpdir) / "sig.bin"
        pub_path.write_text(public_key_pem, encoding="utf-8")
        payload_path.write_bytes(payload)
        sig_path.write_bytes(signature)
        result = subprocess.run(
            [
                "openssl",
                "pkeyutl",
                "-verify",
                "-pubin",
                "-inkey",
                str(pub_path),
                "-rawin",
                "-in",
                str(payload_path),
                "-sigfile",
                str(sig_path),
            ],
            capture_output=True,
            text=True,
        )
        return result.returncode == 0


def _certificate_metadata(cert_pem: str) -> dict[str, str | int]:
    with tempfile.TemporaryDirectory() as tmpdir:
        cert_path = Path(tmpdir) / "cert.pem"
        cert_path.write_text(cert_pem, encoding="utf-8")
        result = _run(
            [
                "openssl",
                "x509",
                "-in",
                str(cert_path),
                "-noout",
                "-subject",
                "-dates",
                "-pubkey",
                "-nameopt",
                "RFC2253",
            ]
        )

    lines = [line.strip() for line in result.splitlines() if line.strip()]
    subject_line = next(line for line in lines if line.startswith("subject="))
    not_before_line = next(line for line in lines if line.startswith("notBefore="))
    not_after_line = next(line for line in lines if line.startswith("notAfter="))
    pub_start = lines.index("-----BEGIN PUBLIC KEY-----")
    public_key_pem = "\n".join(lines[pub_start:]) + "\n"

    return {
        "subject": subject_line.split("=", 1)[1],
        "not_before": _parse_openssl_time(not_before_line.split("=", 1)[1]),
        "not_after": _parse_openssl_time(not_after_line.split("=", 1)[1]),
        "public_key_pem": public_key_pem,
    }


def _parse_openssl_time(value: str) -> int:
    parsed = datetime.strptime(value, "%b %d %H:%M:%S %Y %Z")
    return int(parsed.replace(tzinfo=timezone.utc).timestamp())


def _ed25519_public_key_pem(raw_public_key: bytes) -> str:
    der = _ED25519_SPKI_PREFIX + raw_public_key
    body = base64.encodebytes(der).decode("ascii").replace("\n", "")
    lines = [body[index:index + 64] for index in range(0, len(body), 64)]
    return "-----BEGIN PUBLIC KEY-----\n" + "\n".join(lines) + "\n-----END PUBLIC KEY-----\n"


def _run(cmd: list[str]) -> str:
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip() or "openssl command failed")
    return result.stdout
