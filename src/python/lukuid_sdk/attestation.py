# SPDX-License-Identifier: Apache-2.0
from __future__ import annotations

import base64
import os
import re
import subprocess
import tempfile
import hashlib
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
    allow_untrusted_roots: bool = False


@dataclass(slots=True)
class VerificationResult:
    ok: bool
    reason: str | None = None


@dataclass(slots=True)
class ExternalIdentityInputs:
    endorser_id: str
    root_fingerprint: str
    cert_chain_der: list[str]
    signature: str
    expected_payload: str
    trusted_fingerprints: list[str]


# Trusted Root Certificates (PEM)
TRUSTED_ROOT_CERTS_PEM = [
    """-----BEGIN CERTIFICATE-----
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 DxQWGRk=
-----END CERTIFICATE-----"""
]

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

        # Enforce full end-to-end PQC chain-signature validation
        for i in range(len(certs)):
            cert_pem = certs[i]
            verified = False
            if i + 1 < len(certs):
                next_cert_pem = certs[i+1]
                next_meta = _certificate_metadata(next_cert_pem)
                next_pub_pem = next_meta["public_key_pem"]
                if _verify_cert_signature(cert_pem, next_pub_pem):
                    verified = True
            else:
                for root_pem in TRUSTED_ROOT_CERTS_PEM:
                    try:
                        root_meta = _certificate_metadata(root_pem)
                        if _verify_cert_signature(cert_pem, root_meta["public_key_pem"]):
                            verified = True
                            break
                    except Exception:
                        continue
            
            if not verified:
                if i + 1 == len(certs) and inputs.allow_untrusted_roots:
                    # Only bypass if we are at the top of the chain (the root anchor)
                    verified = True

            if not verified:
                return VerificationResult(False, f"Signature verification failed at chain level {i}")

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
        return VerificationResult(False, "Attestation verification failed against leaf")

    for root_pem in TRUSTED_ROOT_CERTS_PEM:
        try:
            root_meta = _certificate_metadata(root_pem)
            if _verify_signature_with_pem(root_meta["public_key_pem"], payload, signature_bytes):
                return VerificationResult(True)
        except Exception:
            continue

    return VerificationResult(False, "Attestation verification failed")


def verify_detached_signature(public_key_base64: str, payload: bytes, signature_base64: str) -> bool:
    try:
        raw_public_key = base64.b64decode(public_key_base64)
        signature = base64.b64decode(signature_base64)
    except Exception:
        return False

    if len(raw_public_key) < 32:
        return False

    public_key_pem = _ed25519_public_key_pem(raw_public_key[:32])
    return _verify_signature_with_pem(public_key_pem, payload, signature)


def verify_external_identity(inputs: ExternalIdentityInputs) -> VerificationResult:
    try:
        signature = base64.b64decode(inputs.signature)
    except Exception:
        return VerificationResult(False, "signature is not valid base64")

    if not inputs.cert_chain_der:
        return VerificationResult(False, "Certificate chain is empty")

    root_der = base64.b64decode(inputs.cert_chain_der[-1])
    actual_root_fingerprint = hashlib.sha256(root_der).hexdigest()
    
    if actual_root_fingerprint != inputs.root_fingerprint.lower():
        return VerificationResult(False, f"Root fingerprint mismatch: expected {inputs.root_fingerprint}, got {actual_root_fingerprint}")

    trusted = actual_root_fingerprint in {f.lower() for f in inputs.trusted_fingerprints}
    
    if not trusted:
        for root_pem in TRUSTED_ROOT_CERTS_PEM:
            try:
                root_der_trusted = base64.b64decode(_pem_to_der_b64(root_pem))
                if hashlib.sha256(root_der_trusted).hexdigest() == actual_root_fingerprint:
                    leaf_pem = pem_from_der_string(inputs.cert_chain_der[0])
                    if leaf_pem:
                        t = _tmp_file(leaf_pem)
                        if "1.3.6.1.4.1.65432.1.4" in _run(["openssl", "x509", "-in", t, "-text", "-noout"]):
                            trusted = True
                            os.unlink(t)
                            break
                        os.unlink(t)
            except Exception:
                continue

    if not trusted:
        return VerificationResult(False, f"Root fingerprint {actual_root_fingerprint} is not in the trusted list")

    leaf_pem = pem_from_der_string(inputs.cert_chain_der[0])
    if not leaf_pem:
        return VerificationResult(False, "Invalid leaf certificate")
    
    leaf_meta = _certificate_metadata(leaf_pem)
    if _verify_signature_with_pem(leaf_meta["public_key_pem"], inputs.expected_payload.encode("utf-8"), signature):
        return VerificationResult(True)
    
    return VerificationResult(False, "External identity signature verification failed")


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
        return base64.b64encode(pub_der[-32:]).decode("ascii")


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
        der_bytes = base64.b64decode(value)
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


def _verify_cert_signature(cert_pem: str, issuer_pub_pem: str) -> bool:
    with tempfile.TemporaryDirectory() as tmpdir:
        cert_path = Path(tmpdir) / "cert.pem"
        issuer_pub_path = Path(tmpdir) / "issuer_pub.pem"
        cert_path.write_text(cert_pem, encoding="utf-8")
        issuer_pub_path.write_text(issuer_pub_pem, encoding="utf-8")
        
        # Check signature length first. OpenSSL might not support ML-DSA-65 directly
        # but we can try to use pkeyutl or verify if it's a standard algorithm.
        meta = _certificate_metadata(cert_pem)
        if meta.get("sig_len") == 3309:
            # We don't have python-mldsa integrated yet for chain cert verification,
            # but returning True blindly is a security risk. Fail the verification if we can't verify.
            return False

        result = subprocess.run(
            [
                "openssl",
                "verify",
                "-pubkey",
                str(issuer_pub_path),
                str(cert_path),
            ],
            capture_output=True,
            text=True,
        )
        # Note: 'openssl verify' with -pubkey might not work as expected in all versions.
        # Another way is to extract TBS and Signature and use pkeyutl.
        return result.returncode == 0


def _certificate_metadata(cert_pem: str) -> dict[str, any]:
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
                "-text"
            ]
        )

    lines = [line.strip() for line in result.splitlines() if line.strip()]
    subject_line = next(line for line in lines if line.startswith("subject="))
    not_before_line = next(line for line in lines if line.startswith("notBefore="))
    not_after_line = next(line for line in lines if line.startswith("notAfter="))
    pub_start = lines.index("-----BEGIN PUBLIC KEY-----")
    public_key_pem = "\n".join(lines[pub_start:]) + "\n"
    
    sig_len = 0
    if "Signature Value:" in result:
        match = re.search(r"Signature Value:.*?([0-9a-f:]{50,})", result, re.DOTALL)
        if match:
            sig_len = len(match.group(1).replace(":", "").replace("\n", "").replace(" ", "")) // 2

    return {
        "subject": subject_line.split("=", 1)[1],
        "not_before": _parse_openssl_time(not_before_line.split("=", 1)[1]),
        "not_after": _parse_openssl_time(not_after_line.split("=", 1)[1]),
        "public_key_pem": public_key_pem,
        "sig_len": sig_len
    }


def _parse_openssl_time(value: str) -> int:
    for fmt in ("%b %d %H:%M:%S %Y %Z", "%b %d %H:%M:%S %Y GMT"):
        try:
            parsed = datetime.strptime(value, fmt)
            return int(parsed.replace(tzinfo=timezone.utc).timestamp())
        except ValueError:
            continue
    raise ValueError(f"Unknown openssl time format: {value}")


def _ed25519_public_key_pem(raw_public_key: bytes) -> str:
    der = _ED25519_SPKI_PREFIX + raw_public_key
    body = base64.encodebytes(der).decode("ascii").replace("\n", "")
    lines = [body[index:index + 64] for index in range(0, len(body), 64)]
    return "-----BEGIN PUBLIC KEY-----\n" + "\n".join(lines) + "\n-----END PUBLIC KEY-----\n"


def _pem_to_der_b64(pem: str) -> str:
    return pem.replace("-----BEGIN CERTIFICATE-----", "").replace("-----END CERTIFICATE-----", "").replace("\n", "").replace("\r", "").replace(" ", "")


def _tmp_file(content: str) -> str:
    fd, path = tempfile.mkstemp()
    with os.fdopen(fd, 'w') as f:
        f.write(content)
    return path


def _run(cmd: list[str]) -> str:
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip() or "openssl command failed")
    return result.stdout
