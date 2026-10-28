# SPDX-License-Identifier: Apache-2.0
from __future__ import annotations

import json
import hashlib
import base64
import logging
import os
import threading
import time
from datetime import datetime, timezone, timedelta
from typing import Set, Any
import requests
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec, ed25519

class RevocationManager:
    def __init__(self, options: dict[str, Any]):
        self.options = options
        self.revoked_fingerprints: Set[str] = set()
        self.last_sync_date: str | None = None
        self.checked_at: float = 0
        self.snapshot: dict[str, Any] | None = None
        self.generated_at: datetime | None = None
        self._lock = threading.Lock()
        self._stop_event = threading.Event()
        self._refresh_thread: threading.Thread | None = None

        self.load_from_cache()
        self.start_auto_refresh()

    def _get_cache_file(self) -> str | None:
        if self.options.get("crl_memory_only"):
            return None
        
        cache_path = self.options.get("crl_cache_path")
        if not cache_path:
            # Default to user's home directory or current dir
            cache_path = os.path.expanduser("~/.lukuid")
        
        if not os.path.exists(cache_path):
            try:
                os.makedirs(cache_path, exist_ok=True)
            except Exception:
                return None
        
        return os.path.join(cache_path, "lukuid_crl.json")

    def load_from_cache(self):
        file_path = self._get_cache_file()
        if not file_path or not os.path.exists(file_path):
            return

        try:
            with open(file_path, "r") as f:
                data = json.load(f)
                self._apply_snapshot(data["snapshot"])
                checked_at = float(data.get("checked_at", 0))
                self.checked_at = checked_at if checked_at <= time.time() + 300 else 0
        except Exception as exc:
            logging.warning("Rejected cached CRL: %s", exc)

    def save_to_cache(self):
        file_path = self._get_cache_file()
        if not file_path:
            return

        try:
            data = {
                "checked_at": self.checked_at,
                "snapshot": self.snapshot
            }
            with open(file_path, "w") as f:
                json.dump(data, f)
        except Exception as exc:
            logging.warning("Failed to save CRL: %s", exc)

    def start_auto_refresh(self):
        interval_hours = self.options.get("crl_refresh_interval_hours", 4)
        if interval_hours <= 0:
            return

        def refresh_loop():
            while not self._stop_event.is_set():
                try:
                    self.sync()
                except Exception as exc:
                    logging.warning("CRL sync failed: %s", exc)
                self._stop_event.wait(interval_hours * 3600)

        self._refresh_thread = threading.Thread(target=refresh_loop, daemon=True)
        self._refresh_thread.start()

    def sync(self):
        if self.options.get("disable_external_calls"):
            return
        interval = self.options.get("crl_refresh_interval_hours", 4) * 3600
        if interval > 0 and time.time() - self.checked_at < interval:
            return
        api_url = self.options.get("api_url", "https://api.lukuid.com").rstrip("/")
        response = requests.get(f"{api_url}/crl", timeout=10)
        response.raise_for_status()
        self._apply_snapshot(response.json())
        self.checked_at = time.time()
        self.save_to_cache()

    def _apply_snapshot(self, envelope: dict[str, Any]) -> None:
        from .attestation import validate_certificate_chain
        chain = envelope["certificate_chain"]
        payload = base64.b64decode(envelope["payload"], validate=True)
        signature = base64.b64decode(envelope["signature"], validate=True)
        data = json.loads(payload.decode("utf-8", errors="strict"))
        generated = datetime.fromisoformat(data["generated_at"].replace("Z", "+00:00"))
        if data["version"] != 1 or generated > datetime.now(timezone.utc) + timedelta(minutes=5) or generated < datetime.now(timezone.utc) - timedelta(hours=24):
            raise ValueError("Invalid CRL version or timestamp")
        result = validate_certificate_chain(chain, created=int(generated.timestamp()), trust_profile=self.options.get("trust_profile", os.environ.get("LUKUID_TRUST_PROFILE", "prod")))
        if not result.ok:
            raise ValueError(f"CRL signing chain rejected: {result.reason}")
        pem = chain.split("-----END CERTIFICATE-----")[0] + "-----END CERTIFICATE-----"
        leaf = x509.load_pem_x509_certificate(pem.encode("ascii"))
        leaf.public_key().verify(signature, payload, ec.ECDSA(hashes.SHA256()))
        fingerprints = data["revoked_fingerprints"]
        if not isinstance(fingerprints, list) or any(not isinstance(f, str) or len(f) != 64 or any(ch not in "0123456789abcdef" for ch in f) for f in fingerprints):
            raise ValueError("Invalid CRL fingerprints")
        with self._lock:
            self.revoked_fingerprints = set(fingerprints)
            self.snapshot = envelope
            self.generated_at = generated

    def is_revoked(self, cert: x509.Certificate) -> bool:
        fingerprint = self.get_fingerprint(cert)
        with self._lock:
            return fingerprint.lower() in self.revoked_fingerprints

    def has_verified_snapshot(self) -> bool:
        with self._lock:
            return self.snapshot is not None and self.generated_at is not None and self.generated_at >= datetime.now(timezone.utc) - timedelta(hours=24)

    def get_fingerprint(self, cert: x509.Certificate) -> str:
        # Extract raw public key bytes
        public_key = cert.public_key()
        if isinstance(public_key, ed25519.Ed25519PublicKey):
            raw_bytes = public_key.public_bytes(
                encoding=serialization.Encoding.Raw,
                format=serialization.PublicFormat.Raw
            )
        else:
            # For others, extract from SubjectPublicKeyInfo bit string
            # In cryptography, we can use public_bytes(DER, SubjectPublicKeyInfo)
            # but that's the whole SPKI.
            # To get consistent with others, we'll try to get the raw bytes.
            if isinstance(public_key, ec.EllipticCurvePublicKey):
                raw_bytes = public_key.public_bytes(
                    encoding=serialization.Encoding.X962,
                    format=serialization.PublicFormat.UncompressedPoint
                )
            else:
                raise ValueError("Unsupported certificate public key")
        
        digest = hashlib.sha256(raw_bytes).hexdigest()
        return digest.lower()

    def close(self):
        self._stop_event.set()
        if self._refresh_thread:
            # We don't join because it's a daemon thread and might be sleeping for hours
            pass
