# SPDX-License-Identifier: Apache-2.0
from __future__ import annotations

import json
import os
import threading
import time
from datetime import datetime, timezone
from typing import Set, Any
import requests
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization

class RevocationManager:
    def __init__(self, options: dict[str, Any]):
        self.options = options
        self.revoked_fingerprints: Set[str] = set()
        self.last_sync_date: str | None = None
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
                self.last_sync_date = data.get("last_sync")
                fingerprints = data.get("fingerprints", [])
                with self._lock:
                    self.revoked_fingerprints = set(f.lower() for f in fingerprints)
        except Exception:
            pass

    def save_to_cache(self):
        file_path = self._get_cache_file()
        if not file_path:
            return

        try:
            data = {
                "last_sync": self.last_sync_date,
                "fingerprints": list(self.revoked_fingerprints)
            }
            with open(file_path, "w") as f:
                json.dump(data, f)
        except Exception:
            pass

    def start_auto_refresh(self):
        interval_hours = self.options.get("crl_refresh_interval_hours", 4)
        if interval_hours <= 0:
            return

        def refresh_loop():
            while not self._stop_event.is_set():
                try:
                    self.sync()
                except Exception:
                    pass
                self._stop_event.wait(interval_hours * 3600)

        self._refresh_thread = threading.Thread(target=refresh_loop, daemon=True)
        self._refresh_thread.start()

    def sync(self):
        if self.options.get("disable_external_calls"):
            return

        api_url = self.options.get("api_url", "https://api.lukuid.com").rstrip("/")
        url = f"{api_url}/revocations"
        if self.last_sync_date:
            url += f"?from={self.last_sync_date}"

        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                revocations = data.get("revocations", [])
                with self._lock:
                    for item in revocations:
                        fingerprint = item.get("identifier")
                        if fingerprint:
                            self.revoked_fingerprints.add(fingerprint.lower())
                
                self.last_sync_date = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
                self.save_to_cache()
            elif response.status_code != 304:
                pass
        except Exception:
            pass

    def is_revoked(self, cert: x509.Certificate) -> bool:
        fingerprint = self.get_fingerprint(cert)
        with self._lock:
            return fingerprint.lower() in self.revoked_fingerprints

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
                # Fallback to full cert DER
                raw_bytes = cert.public_bytes(serialization.Encoding.DER)
        
        digest = hashlib.sha256(raw_bytes).hexdigest()
        return digest.lower()

    def close(self):
        self._stop_event.set()
        if self._refresh_thread:
            # We don't join because it's a daemon thread and might be sleeping for hours
            pass
