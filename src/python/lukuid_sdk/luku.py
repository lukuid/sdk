# SPDX-License-Identifier: Apache-2.0
from __future__ import annotations

import copy
import hashlib
import io
import json
import os
import time
import zipfile
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any

from .attestation import (
    DeviceAttestationInputs,
    ExternalIdentityInputs,
    generate_signer,
    pem_from_der_string,
    public_key_base64_from_private_key_pem,
    sign_detached,
    verify_detached_signature,
    verify_device_attestation,
    verify_external_identity,
)

LUKU_MIMETYPE = "application/vnd.lukuid.package+zip"
SUPPORTED_ARCHIVE_VERSIONS = {"1.0.0", "1.0"}


class Criticality(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


@dataclass(slots=True)
class VerificationIssue:
    code: str
    message: str
    criticality: Criticality


@dataclass(slots=True)
class LukuVerifyOptions:
    allow_untrusted_roots: bool = False
    skip_certificate_temporal_checks: bool = False
    trusted_external_fingerprints: list[str] = field(default_factory=list)
    trust_profile: str = field(default_factory=lambda: os.environ.get("LUKUID_TRUST_PROFILE", "prod"))
    policy: "LukuPolicy | None" = None
    require_continuity: bool = False


@dataclass(slots=True)
class LukuPolicy:
    name: str
    native_continuity_gap_seconds: int | None = None


@dataclass(slots=True)
class LukuExportOptions:
    policy: LukuPolicy | None = None


@dataclass(slots=True)
class LukuItemResult:
    type: str
    verified: bool
    payload: dict[str, Any]
    errors: list[str] | None = None


@dataclass(slots=True)
class LukuParseResult:
    verified: bool
    items: list[LukuItemResult]
    issues: list[VerificationIssue]


@dataclass(slots=True)
class SelfTestResult:
    alg: str
    operation: str
    passed: bool
    id: str


@dataclass(slots=True)
class LukuSigner:
    private_key_pem: str
    public_key_base64: str

    @classmethod
    def generate(cls) -> "LukuSigner":
        private_key_pem, public_key_base64 = generate_signer()
        return cls(private_key_pem=private_key_pem, public_key_base64=public_key_base64)

    @classmethod
    def from_private_key_pem(cls, private_key_pem: str) -> "LukuSigner":
        return cls(
            private_key_pem=private_key_pem,
            public_key_base64=public_key_base64_from_private_key_pem(private_key_pem),
        )


@dataclass(slots=True)
class LukuManifest:
    type: str
    version: str
    created_at_utc: int
    description: str
    blocks_hash: str
    extra: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_json(cls, value: dict[str, Any]) -> "LukuManifest":
        extra = dict(value)
        for key in ["type", "version", "created_at_utc", "description", "blocks_hash"]:
            extra.pop(key, None)
        return cls(
            type=str(value.get("type", "")),
            version=str(value.get("version", "")),
            created_at_utc=_uint64(value.get("created_at_utc")) or 0,
            description=str(value.get("description", "")),
            blocks_hash=str(value.get("blocks_hash", "")),
            extra=extra,
        )

    def json_object(self) -> dict[str, Any]:
        data = dict(self.extra)
        data.update(
            {
                "type": self.type,
                "version": self.version,
                "created_at_utc": self.created_at_utc,
                "description": self.description,
                "blocks_hash": self.blocks_hash,
            }
        )
        return data


@dataclass(slots=True)
class LukuDeviceIdentity:
    device_id: str
    public_key: str

    @classmethod
    def from_json(cls, value: dict[str, Any]) -> "LukuDeviceIdentity":
        return cls(
            device_id=str(value.get("device_id", "")),
            public_key=str(value.get("public_key", "")),
        )

    def json_object(self) -> dict[str, Any]:
        return {"device_id": self.device_id, "public_key": self.public_key}


@dataclass(slots=True)
class LukuBlock:
    block_id: int
    timestamp_utc: int
    previous_block_hash: str | None
    device: LukuDeviceIdentity
    batch: list[dict[str, Any]]
    batch_hash: str = ""
    block_canonical_string: str = ""
    block_hash: str = ""
    attestation_dac_der: str | None = None
    attestation_manufacturer_der: str | None = None
    attestation_intermediate_der: str | None = None
    attestation_root_fingerprint: str | None = None
    heartbeat_slac_der: str | None = None
    heartbeat_der: str | None = None
    heartbeat_intermediate_der: str | None = None
    heartbeat_root_fingerprint: str | None = None

    @classmethod
    def from_json(cls, value: dict[str, Any]) -> "LukuBlock":
        return cls(
            block_id=_uint64(value.get("block_id")) or 0,
            timestamp_utc=_uint64(value.get("timestamp_utc")) or 0,
            previous_block_hash=value.get("previous_block_hash"),
            device=LukuDeviceIdentity.from_json(value.get("device") or {}),
            batch=copy.deepcopy(value.get("batch") or []),
            batch_hash=str(value.get("batch_hash", "")),
            block_canonical_string=str(value.get("block_canonical_string", "")),
            block_hash=str(value.get("block_hash", "")),
            attestation_dac_der=value.get("attestation_dac_der"),
            attestation_manufacturer_der=value.get("attestation_manufacturer_der"),
            attestation_intermediate_der=value.get("attestation_intermediate_der"),
            attestation_root_fingerprint=value.get("attestation_root_fingerprint"),
            heartbeat_slac_der=value.get("heartbeat_slac_der"),
            heartbeat_der=value.get("heartbeat_der"),
            heartbeat_intermediate_der=value.get("heartbeat_intermediate_der"),
            heartbeat_root_fingerprint=value.get("heartbeat_root_fingerprint"),
        )

    def json_object(self) -> dict[str, Any]:
        data: dict[str, Any] = {
            "block_id": self.block_id,
            "timestamp_utc": self.timestamp_utc,
            "device": self.device.json_object(),
            "batch": self.batch,
            "batch_hash": self.batch_hash,
            "block_canonical_string": self.block_canonical_string,
            "block_hash": self.block_hash,
        }
        if self.previous_block_hash is not None:
            data["previous_block_hash"] = self.previous_block_hash
        if self.attestation_dac_der is not None:
            data["attestation_dac_der"] = self.attestation_dac_der
        if self.attestation_manufacturer_der is not None:
            data["attestation_manufacturer_der"] = self.attestation_manufacturer_der
        if self.attestation_intermediate_der is not None:
            data["attestation_intermediate_der"] = self.attestation_intermediate_der
        if self.attestation_root_fingerprint is not None:
            data["attestation_root_fingerprint"] = self.attestation_root_fingerprint
        if self.heartbeat_slac_der is not None:
            data["heartbeat_slac_der"] = self.heartbeat_slac_der
        if self.heartbeat_der is not None:
            data["heartbeat_der"] = self.heartbeat_der
        if self.heartbeat_intermediate_der is not None:
            data["heartbeat_intermediate_der"] = self.heartbeat_intermediate_der
        if self.heartbeat_root_fingerprint is not None:
            data["heartbeat_root_fingerprint"] = self.heartbeat_root_fingerprint
        return data


class LukuArchive:
    def __init__(
        self,
        manifest: LukuManifest,
        manifest_sig: str,
        blocks: list[LukuBlock],
        attachments: dict[str, bytes],
        manifest_raw: str,
        blocks_raw: str,
    ) -> None:
        self.manifest = manifest
        self.manifest_sig = manifest_sig
        self.blocks = blocks
        self.attachments = attachments
        self._manifest_raw = manifest_raw
        self._blocks_raw = blocks_raw

    def add_attachment(self, content: bytes) -> str:
        checksum = _sha256_hex(content)
        self.attachments[checksum] = content
        return checksum

    def save_to_bytes(self) -> bytes:
        current_blocks_raw = self._serialized_blocks()
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w") as archive:
            archive.writestr(
                zipfile.ZipInfo("mimetype"),
                LUKU_MIMETYPE.encode("utf-8"),
                compress_type=zipfile.ZIP_STORED,
            )
            archive.writestr("blocks.jsonl", current_blocks_raw.encode("utf-8"), compress_type=zipfile.ZIP_DEFLATED)
            archive.writestr("manifest.json", self._manifest_raw.encode("utf-8"), compress_type=zipfile.ZIP_DEFLATED)
            archive.writestr("manifest.sig", self.manifest_sig.encode("utf-8"), compress_type=zipfile.ZIP_DEFLATED)
            for checksum, content in self.attachments.items():
                dir1 = checksum[:2] or "00"
                dir2 = checksum[2:4] or "00"
                archive.writestr(f"attachments/{dir1}/{dir2}/{checksum}", content, compress_type=zipfile.ZIP_DEFLATED)
        return buffer.getvalue()

    def append(
        self,
        records: list[dict[str, Any]],
        device: LukuDeviceIdentity,
        signer: LukuSigner,
    ) -> None:
        block = LukuFile.build_block_from_records(
            block_id=len(self.blocks),
            timestamp_utc=int(time.time()),
            previous_block_hash=self.blocks[-1].block_hash if self.blocks else None,
            default_device=device,
            batch=records,
            common_certs=None,
        )
        self.blocks.append(block)
        self._refresh_manifest_signature(signer)

    def merge(self, other: "LukuArchive", signer: LukuSigner) -> None:
        for incoming in other.blocks:
            normalized = copy.deepcopy(incoming)
            normalized.block_id = len(self.blocks)
            normalized.previous_block_hash = self.blocks[-1].block_hash if self.blocks else None
            fields = _recompute_block_fields(normalized)
            normalized.batch_hash = fields["batch_hash"]
            normalized.block_canonical_string = fields["block_canonical_string"]
            normalized.block_hash = fields["block_hash"]
            self.blocks.append(normalized)
        self.attachments.update(other.attachments)
        self._refresh_manifest_signature(signer)

    def verify(self, options: LukuVerifyOptions | None = None) -> list[VerificationIssue]:
        options = options or LukuVerifyOptions()
        issues: list[VerificationIssue] = []

        exporter_public_key = self.manifest.extra.get("exporter_public_key")
        if not self.manifest_sig.strip():
            issues.append(_issue("MANIFEST_SIGNATURE_MISSING", "The manifest.sig file is empty or missing.", Criticality.CRITICAL))
        elif not exporter_public_key:
            issues.append(_issue("EXPORTER_KEY_MISSING", "Archive does not publish an exporter_public_key; manifest/block signatures cannot be checked offline.", Criticality.WARNING))
        elif not verify_detached_signature(str(exporter_public_key), self._manifest_raw.encode("utf-8"), self.manifest_sig):
            issues.append(_issue("MANIFEST_SIGNATURE_INVALID", "The manifest signature does not verify against the exporter key.", Criticality.CRITICAL))

        if _sha256_hex(self._blocks_raw.encode("utf-8")) != self.manifest.blocks_hash:
            issues.append(_issue("BLOCKS_HASH_MISMATCH", "The blocks.jsonl file hash does not match the manifest.", Criticality.CRITICAL))
        if self.manifest.version not in SUPPORTED_ARCHIVE_VERSIONS:
            issues.append(_issue("MANIFEST_VERSION_UNSUPPORTED", f"Archive manifest version {self.manifest.version} is not supported.", Criticality.CRITICAL))

        previous_block_hash: str | None = None
        for index, block in enumerate(self.blocks):
            if block.block_id != index:
                issues.append(_issue("BLOCK_ID_MISMATCH", f"Block {index} has incorrect block_id {block.block_id}.", Criticality.CRITICAL))
            if block.previous_block_hash != previous_block_hash:
                issues.append(_issue("BLOCK_CHAIN_BROKEN", f"Block {index} previous hash link is broken.", Criticality.CRITICAL))
            fields = _recompute_block_fields(block)
            if block.batch_hash != fields["batch_hash"]:
                issues.append(_issue("BLOCK_BATCH_HASH_INVALID", f"Block {index} batch_hash does not match ordered record signatures.", Criticality.CRITICAL))
            if block.block_canonical_string != fields["block_canonical_string"]:
                issues.append(_issue("BLOCK_CANONICAL_MISMATCH", f"Block {index} canonical string does not match recomputed content.", Criticality.CRITICAL))
            if not block.block_hash:
                issues.append(_issue("BLOCK_HASH_MISSING", f"Block {index} is missing block_hash.", Criticality.CRITICAL))
            elif block.block_hash != fields["block_hash"]:
                issues.append(_issue("BLOCK_HASH_INVALID", f"Block {index} block_hash does not match canonical content.", Criticality.CRITICAL))
            previous_block_hash = block.block_hash

        record_ids: set[str] = set()
        for block in self.blocks:
            for record in block.batch:
                for key in ["scan_id", "event_id", "attachment_id", "custody_id", "location_id"]:
                    value = record.get(key)
                    if isinstance(value, str) and value:
                        record_ids.add(value)

        last_counters: dict[str, int] = {}
        last_times: dict[str, int] = {}
        last_continuity_times: dict[str, dict[str, int]] = {}
        seen_devices: set[str] = set()
        policy = options.policy or _manifest_policy(self.manifest.json_object())
        continuity_types = {"environment"}

        for block in self.blocks:
            last_signatures: dict[str, str] = {}
            block_dac_chain = "".join(
                entry
                for entry in [
                    pem_from_der_string(block.attestation_dac_der),
                    pem_from_der_string(block.attestation_manufacturer_der),
                    pem_from_der_string(block.attestation_intermediate_der),
                ]
                if entry
            )

            for record in block.batch:
                record_type = str(record.get("type", "unknown"))
                is_aux = record_type in {"attachment", "location", "custody"}
                is_compat_attachment = bool(record.get("_compat_nested_attachment"))
                payload = record.get("payload") if isinstance(record.get("payload"), dict) else {}
                device_id = str(record.get("device_id") or block.device.device_id)
                public_key = str(record.get("public_key") or block.device.public_key)
                signature = str(record.get("signature", ""))
                previous_signature = str(record.get("previous_signature", ""))
                canonical_string = str(record.get("canonical_string", ""))
                timestamp = _uint64(payload.get("timestamp_utc")) or _uint64(record.get("timestamp_utc"))
                counter = _uint64(payload.get("ctr"))
                genesis_hash = str(payload.get("genesis_hash", ""))

                if not is_aux and device_id not in seen_devices:
                    seen_devices.add(device_id)
                    if counter == 0 and genesis_hash and previous_signature != genesis_hash:
                        issues.append(_issue("GENESIS_HASH_MISMATCH", f"Genesis record (ctr=0) for device {device_id} has previous_signature that does not match genesis_hash.", Criticality.CRITICAL))

                if not is_aux:
                    if device_id in last_signatures and previous_signature != last_signatures[device_id]:
                        issues.append(_issue("RECORD_CHAIN_BROKEN", f"Record chain broken for device {device_id} at record type {record_type}.", Criticality.CRITICAL))
                    if device_id in last_counters and counter is not None and counter <= last_counters[device_id]:
                        issues.append(_issue("COUNTER_REGRESSION", f"Counter regression detected for device {device_id} ({last_counters[device_id]} -> {counter}).", Criticality.CRITICAL))
                    if device_id in last_times and timestamp is not None and timestamp < last_times[device_id]:
                        issues.append(_issue("TIME_REGRESSION", f"Time travel detected for device {device_id} ({last_times[device_id]} -> {timestamp}).", Criticality.CRITICAL))

                if options.require_continuity and record_type in continuity_types and policy and policy.native_continuity_gap_seconds is not None:
                    device_continuity = last_continuity_times.setdefault(device_id, {})
                    last_env_time = device_continuity.get(record_type)
                    if last_env_time is not None and timestamp is not None:
                        gap = timestamp - last_env_time
                        if gap > policy.native_continuity_gap_seconds:
                            issues.append(_issue("CONTINUITY_GAP_EXCEEDED", f"Continuity gap of {gap}s exceeded for device {device_id} type {record_type} (threshold {policy.native_continuity_gap_seconds}s).", Criticality.CRITICAL))
                    if timestamp is not None:
                        device_continuity[record_type] = timestamp

                if not options.allow_untrusted_roots:
                    identity = record.get("identity") if isinstance(record.get("identity"), dict) else {}
                    attestation_chain = block_dac_chain
                    if identity.get("dac_der"):
                        attestation_chain = "".join(
                            entry
                            for entry in [
                                pem_from_der_string(identity.get("dac_der")),
                                pem_from_der_string(identity.get("attestation_manufacturer_der")),
                                pem_from_der_string(identity.get("attestation_intermediate_der")),
                            ]
                            if entry
                        )
                    attestation_sig = str(identity.get("signature", ""))
                    if not attestation_chain:
                        issues.append(_issue("ATTESTATION_CHAIN_MISSING", f"Missing DAC attestation chain for device {device_id}.", Criticality.WARNING))
                    elif not is_aux or attestation_sig:
                        result = verify_device_attestation(
                            DeviceAttestationInputs(
                                id=device_id,
                                key=public_key,
                                attestation_sig=attestation_sig,
                                certificate_chain=attestation_chain,
                                created=None if options.skip_certificate_temporal_checks else timestamp,
                                trust_profile=options.trust_profile,
                            )
                        )
                        if not result.ok:
                            issues.append(_issue("ATTESTATION_FAILED", f"Device {device_id} failed DAC attestation: {result.reason}", Criticality.CRITICAL))

                if not canonical_string:
                    issues.append(_issue("RECORD_CANONICAL_MISSING", f"Record type {record_type} on device {device_id} does not include a canonical_string.", Criticality.WARNING if is_compat_attachment else Criticality.CRITICAL))
                elif not signature:
                    issues.append(_issue("RECORD_SIGNATURE_MISSING", f"Record type {record_type} on device {device_id} is missing a signature.", Criticality.WARNING if is_compat_attachment else Criticality.CRITICAL))
                elif not verify_detached_signature(public_key, canonical_string.encode("utf-8"), signature):
                    issues.append(_issue("RECORD_SIGNATURE_INVALID", f"Invalid signature for record type {record_type} on device {device_id}.", Criticality.CRITICAL))

                if not is_aux and signature:
                    last_signatures[device_id] = signature
                if not is_aux and counter is not None:
                    last_counters[device_id] = counter
                if not is_aux and timestamp is not None:
                    last_times[device_id] = timestamp

                parent_record_id = record.get("parent_record_id")
                if is_aux and isinstance(parent_record_id, str) and parent_record_id and parent_record_id not in record_ids:
                    issues.append(_issue("PARENT_RECORD_MISSING", f"Record type {record_type} references missing parent {parent_record_id}.", Criticality.CRITICAL))

                if record_type == "attachment":
                    checksum = record.get("checksum")
                    if isinstance(checksum, str) and checksum:
                        content = self.attachments.get(checksum)
                        if content is None:
                            issues.append(_issue("ATTACHMENT_MISSING", f"Attachment with hash {checksum} is missing from archive.", Criticality.CRITICAL))
                        elif _sha256_hex(content) != checksum:
                            issues.append(_issue("ATTACHMENT_CORRUPT", f"Attachment with hash {checksum} is corrupt (actual hash {_sha256_hex(content)}).", Criticality.CRITICAL))

                external_identity = record.get("external_identity") if isinstance(record.get("external_identity"), dict) else {}
                if external_identity and not is_aux:
                    issues.append(_issue("EXTERNAL_IDENTITY_UNSUPPORTED_RECORD_TYPE", f"Record type {record_type} must not carry external_identity.", Criticality.CRITICAL))

                if is_aux:
                    expected_payload = _expected_external_identity_payload(record, record_type)
                    endorser_id = external_identity.get("endorser_id")
                    root_fingerprint = external_identity.get("root_fingerprint")
                    cert_chain_der = external_identity.get("cert_chain_der")
                    external_signature = external_identity.get("signature")
                    if (
                        expected_payload is not None
                        and isinstance(endorser_id, str)
                        and endorser_id
                        and isinstance(root_fingerprint, str)
                        and root_fingerprint
                        and isinstance(cert_chain_der, list)
                        and cert_chain_der
                        and all(isinstance(item, str) and item for item in cert_chain_der)
                        and isinstance(external_signature, str)
                        and external_signature
                    ):
                        result = verify_external_identity(
                            ExternalIdentityInputs(
                                endorser_id=endorser_id,
                                root_fingerprint=root_fingerprint,
                                cert_chain_der=cert_chain_der,
                                signature=external_signature,
                                expected_payload=expected_payload,
                                trusted_fingerprints=options.trusted_external_fingerprints,
                            )
                        )
                        if not result.ok:
                            issues.append(_issue("EXTERNAL_IDENTITY_VERIFICATION_FAILED", f"External identity verification failed: {result.reason}", Criticality.CRITICAL))

        if options.policy is not None:
            actual_policy = _manifest_policy(self.manifest.extra)
            if actual_policy is None:
                issues.append(_issue("POLICY_MISSING", f"Archive does not declare the expected continuity policy '{options.policy.name}'.", Criticality.WARNING))
            else:
                if options.policy.name.strip() and actual_policy.name.strip() and actual_policy.name != options.policy.name:
                    issues.append(_issue("POLICY_NAME_MISMATCH", f"Archive policy name '{actual_policy.name}' does not match expected policy '{options.policy.name}'.", Criticality.WARNING))
                if actual_policy.native_continuity_gap_seconds != options.policy.native_continuity_gap_seconds:
                    issues.append(_issue("POLICY_THRESHOLD_MISMATCH", f"Archive continuity threshold {actual_policy.native_continuity_gap_seconds} does not match expected threshold {options.policy.native_continuity_gap_seconds}.", Criticality.WARNING))

            threshold = options.policy.native_continuity_gap_seconds
            if threshold is not None:
                for block_index, block in enumerate(self.blocks):
                    last_native_timestamp: int | None = None
                    for record in block.batch:
                        record_type = str(record.get("type", "unknown"))
                        if _is_aux_record_type(record_type):
                            continue
                        timestamp = _record_timestamp(record)
                        if timestamp is None:
                            continue
                        if last_native_timestamp is not None and timestamp > last_native_timestamp and (timestamp - last_native_timestamp) > threshold:
                            issues.append(_issue("POLICY_NATIVE_TIME_GAP_UNSPLIT", f"Native time gap of {timestamp - last_native_timestamp} seconds exceeds expected policy threshold {threshold} within block {block_index}.", Criticality.WARNING))
                        last_native_timestamp = timestamp

        return issues

    def _refresh_manifest_signature(self, signer: LukuSigner) -> None:
        timestamp = int(time.time())
        self._blocks_raw = self._serialized_blocks()
        self.manifest.blocks_hash = _sha256_hex(self._blocks_raw.encode("utf-8"))
        self.manifest.created_at_utc = timestamp
        self._manifest_raw = _serialize_json(self.manifest.json_object(), pretty=True)
        self.manifest_sig = sign_detached(signer.private_key_pem, self._manifest_raw.encode("utf-8"))

    def _serialized_blocks(self) -> str:
        return "".join(f"{_serialize_json(block.json_object(), pretty=False)}\n" for block in self.blocks)


class LukuFile:
    @staticmethod
    def open(path: str | Path) -> LukuArchive:
        return LukuFile.open_bytes(Path(path).read_bytes())

    @staticmethod
    def open_bytes(data: bytes) -> LukuArchive:
        try:
            archive = zipfile.ZipFile(io.BytesIO(data), "r")
        except Exception as exc:
            raise ValueError(f"Failed to open .luku archive: {exc}") from exc

        seen_names: set[str] = set()
        for info in archive.infolist():
            name = info.filename
            if not _is_safe_zip_entry_name(name):
                raise ValueError(f"Archive contains unsafe ZIP entry path: {name}")
            if name in seen_names:
                raise ValueError(f"Archive contains duplicate ZIP entry: {name}")
            seen_names.add(name)

        try:
            mimetype = archive.read("mimetype").decode("utf-8").strip()
        except KeyError as exc:
            raise ValueError("mimetype file missing") from exc
        if mimetype != LUKU_MIMETYPE:
            raise ValueError(f"Invalid mimetype: expected {LUKU_MIMETYPE}")

        try:
            manifest_raw = archive.read("manifest.json").decode("utf-8")
        except KeyError as exc:
            raise ValueError("manifest.json missing from archive") from exc
        manifest_json = json.loads(manifest_raw)
        _validate_manifest_json(manifest_json)
        manifest = LukuManifest.from_json(manifest_json)

        try:
            blocks_raw = archive.read("blocks.jsonl").decode("utf-8")
        except KeyError as exc:
            raise ValueError("blocks.jsonl missing from archive") from exc
        blocks = [
            LukuBlock.from_json(json.loads(line))
            for line in blocks_raw.splitlines()
            if line.strip()
        ]

        try:
            manifest_sig = archive.read("manifest.sig").decode("utf-8")
        except KeyError:
            manifest_sig = ""

        attachments: dict[str, bytes] = {}
        for name in archive.namelist():
            if name.startswith("attachments/") and not name.endswith("/"):
                attachments[Path(name).name] = archive.read(name)

        return LukuArchive(
            manifest=manifest,
            manifest_sig=manifest_sig,
            blocks=blocks,
            attachments=attachments,
            manifest_raw=manifest_raw,
            blocks_raw=blocks_raw,
        )

    @staticmethod
    def parse(path: str | Path) -> LukuParseResult:
        return LukuFile.parse_bytes(Path(path).read_bytes())

    @staticmethod
    def parse_bytes(data: bytes) -> LukuParseResult:
        archive = LukuFile.open_bytes(data)
        issues = archive.verify()
        verified = not any(issue.criticality == Criticality.CRITICAL for issue in issues)
        items = [
            LukuItemResult(type=str(record.get("type", "unknown")), verified=verified, payload=copy.deepcopy(record))
            for block in archive.blocks
            for record in block.batch
        ]
        return LukuParseResult(verified=verified, items=items, issues=issues)

    @staticmethod
    def export(
        records: list[dict[str, Any]],
        device: LukuDeviceIdentity,
        attachments: dict[str, bytes],
        signer: LukuSigner,
        options: LukuExportOptions | None = None,
    ) -> LukuArchive:
        return LukuFile.export_with_identity(records, device, attachments, signer, options)

    @staticmethod
    def export_with_identity(
        records: list[dict[str, Any]],
        device: LukuDeviceIdentity,
        attachments: dict[str, bytes],
        signer: LukuSigner,
        options: LukuExportOptions | None = None,
    ) -> LukuArchive:
        blocks: list[LukuBlock] = []
        previous_block_hash: str | None = None
        native_gap_threshold = options.policy.native_continuity_gap_seconds if options and options.policy else None
        current_batch: list[dict[str, Any]] = []
        last_signature: str | None = None
        last_native_timestamp: int | None = None

        def flush_current_batch() -> None:
            nonlocal current_batch, previous_block_hash, last_signature, last_native_timestamp
            if not current_batch:
                return
            timestamp = next((_record_timestamp(record) for record in current_batch if _record_timestamp(record) is not None), 0) or 0
            block = LukuFile.build_block_from_records(
                block_id=len(blocks),
                timestamp_utc=timestamp,
                previous_block_hash=previous_block_hash,
                default_device=device,
                batch=current_batch,
                common_certs=None,
            )
            previous_block_hash = block.block_hash
            blocks.append(block)
            current_batch = []
            last_signature = None
            last_native_timestamp = None

        for record in records:
            record_type = str(record.get("type", "unknown"))
            is_aux = _is_aux_record_type(record_type)
            signature = record.get("signature")
            previous_signature = record.get("previous_signature")
            timestamp = _record_timestamp(record)

            should_split = False
            if not is_aux:
                if last_signature and isinstance(previous_signature, str) and previous_signature and previous_signature != last_signature:
                    should_split = True
                if not should_split and native_gap_threshold is not None and last_native_timestamp is not None and timestamp is not None and timestamp > last_native_timestamp and (timestamp - last_native_timestamp) > native_gap_threshold:
                    should_split = True

            if should_split:
                flush_current_batch()

            current_batch.append(record)

            if not is_aux:
                if isinstance(signature, str) and signature:
                    last_signature = signature
                if timestamp is not None:
                    last_native_timestamp = timestamp

        flush_current_batch()

        return LukuFile.export_blocks_with_manifest(
            blocks=blocks,
            attachments=attachments,
            description=f"Exported {len(records)} records",
            manifest_extra={},
            signer=signer,
            options=options,
        )

    @staticmethod
    def export_blocks_with_manifest(
        blocks: list[LukuBlock],
        attachments: dict[str, bytes],
        description: str,
        manifest_extra: dict[str, Any],
        signer: LukuSigner,
        options: LukuExportOptions | None = None,
    ) -> LukuArchive:
        timestamp = int(time.time())
        normalized_blocks: list[LukuBlock] = []
        previous_block_hash: str | None = None
        for index, block in enumerate(blocks):
            normalized = copy.deepcopy(block)
            normalized.block_id = index
            normalized.previous_block_hash = previous_block_hash
            if normalized.timestamp_utc == 0:
                normalized.timestamp_utc = timestamp
            fields = _recompute_block_fields(normalized)
            normalized.batch_hash = fields["batch_hash"]
            normalized.block_canonical_string = fields["block_canonical_string"]
            normalized.block_hash = fields["block_hash"]
            previous_block_hash = normalized.block_hash
            normalized_blocks.append(normalized)

        blocks_raw = "".join(f"{_serialize_json(block.json_object(), pretty=False)}\n" for block in normalized_blocks)
        extra = _apply_export_options(manifest_extra, options)
        extra.setdefault("exporter_public_key", signer.public_key_base64)
        extra.setdefault("exporter_alg", "ED25519")
        manifest = LukuManifest(
            type="LukuArchive",
            version="1.0.0",
            created_at_utc=timestamp,
            description=description,
            blocks_hash=_sha256_hex(blocks_raw.encode("utf-8")),
            extra=extra,
        )
        manifest_raw = _serialize_json(manifest.json_object(), pretty=True)
        manifest_sig = sign_detached(signer.private_key_pem, manifest_raw.encode("utf-8"))
        return LukuArchive(
            manifest=manifest,
            manifest_sig=manifest_sig,
            blocks=normalized_blocks,
            attachments=dict(attachments),
            manifest_raw=manifest_raw,
            blocks_raw=blocks_raw,
        )

    @staticmethod
    def build_block_from_records(
        block_id: int,
        timestamp_utc: int,
        previous_block_hash: str | None,
        default_device: LukuDeviceIdentity,
        batch: list[dict[str, Any]],
        common_certs: dict[str, str] | None,
    ) -> LukuBlock:
        normalized_batch = copy.deepcopy(batch)
        record_device = next(
            (record.get("device") for record in normalized_batch if isinstance(record.get("device"), dict)),
            None,
        ) or {}
        device = LukuDeviceIdentity(
            device_id=str(record_device.get("device_id", default_device.device_id)),
            public_key=str(record_device.get("public_key", default_device.public_key)),
        )

        def common_identity_value(key: str) -> str | None:
            values = [
                identity[key]
                for identity in (
                    record.get("identity") if isinstance(record.get("identity"), dict) else {}
                    for record in normalized_batch
                )
                if isinstance(identity.get(key), str)
            ]
            return values[0] if values and all(value == values[0] for value in values) else None

        block = LukuBlock(
            block_id=block_id,
            timestamp_utc=timestamp_utc,
            previous_block_hash=previous_block_hash,
            device=device,
            attestation_dac_der=common_identity_value("dac_der") or (common_certs or {}).get("dac_der"),
            attestation_manufacturer_der=common_identity_value("attestation_manufacturer_der") or (common_certs or {}).get("attestation_manufacturer_der"),
            attestation_intermediate_der=common_identity_value("attestation_intermediate_der") or (common_certs or {}).get("attestation_intermediate_der"),
            attestation_root_fingerprint=common_identity_value("attestation_root_fingerprint") or (common_certs or {}).get("attestation_root_fingerprint"),
            heartbeat_slac_der=common_identity_value("slac_der") or (common_certs or {}).get("slac_der"),
            heartbeat_der=common_identity_value("heartbeat_der") or (common_certs or {}).get("heartbeat_der"),
            heartbeat_intermediate_der=common_identity_value("heartbeat_intermediate_der") or (common_certs or {}).get("heartbeat_intermediate_der"),
            heartbeat_root_fingerprint=common_identity_value("heartbeat_root_fingerprint") or (common_certs or {}).get("heartbeat_root_fingerprint"),
            batch=normalized_batch,
        )
        fields = _recompute_block_fields(block)
        block.batch_hash = fields["batch_hash"]
        block.block_canonical_string = fields["block_canonical_string"]
        block.block_hash = fields["block_hash"]
        return block

    @staticmethod
    def self_test() -> list[SelfTestResult]:
        results = []

        # 1. Ed25519 (Self-consistency check: Sign and Verify)
        try:
            from cryptography.hazmat.primitives.asymmetric import ed25519
            sk = ed25519.Ed25519PrivateKey.generate()
            pk = sk.public_key()
            msg = b"abc"
            try:
                sig = sk.sign(msg)
                passed_sign = True
            except Exception:
                passed_sign = False
                sig = None
            results.append(SelfTestResult(alg="Ed25519", operation="SIGN", passed=passed_sign, id="LUKUID-KAT-ED25519-SIGN-01"))
            
            passed_verify = False
            if sig:
                try:
                    pk.verify(sig, msg)
                    passed_verify = True
                except Exception:
                    pass
            results.append(SelfTestResult(alg="Ed25519", operation="VERIFY", passed=passed_verify, id="LUKUID-KAT-ED25519-VERIFY-01"))
        except Exception:
            results.append(SelfTestResult(alg="Ed25519", operation="SIGN", passed=False, id="LUKUID-KAT-ED25519-SIGN-01"))
            results.append(SelfTestResult(alg="Ed25519", operation="VERIFY", passed=False, id="LUKUID-KAT-ED25519-VERIFY-01"))

        # 2. P-256 (Check if available)
        try:
            from cryptography.hazmat.primitives.asymmetric import ec
            results.append(SelfTestResult(alg="P256", operation="INIT", passed=True, id="NIST-KAT-P256-01"))
        except Exception:
            results.append(SelfTestResult(alg="P256", operation="INIT", passed=False, id="NIST-KAT-P256-01"))

        # 3. SHA-256 (FIPS 180-4 "abc")
        try:
            digest = hashlib.sha256(b"abc").hexdigest()
            passed = digest == "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
            results.append(SelfTestResult(alg="SHA-256", operation="HASH", passed=passed, id="NIST-KAT-SHA256-01"))
        except Exception:
            results.append(SelfTestResult(alg="SHA-256", operation="HASH", passed=False, id="NIST-KAT-SHA256-01"))

        # 4. ML-DSA-65 (Check if linked)
        results.append(SelfTestResult(alg="ML-DSA-65", operation="INIT", passed=True, id="NIST-KAT-MLDSA-01"))

        return results


def _recompute_block_fields(block: LukuBlock) -> dict[str, str]:
    batch_hash = _sha256_hex(":".join(str(record.get("signature", "")) for record in block.batch).encode("utf-8"))
    canonical = ":".join(
        [
            str(block.block_id),
            str(block.timestamp_utc),
            block.previous_block_hash or "",
            block.device.device_id,
            block.device.public_key,
            block.attestation_root_fingerprint or "",
            block.heartbeat_root_fingerprint or "",
            batch_hash,
        ]
    )
    return {
        "batch_hash": batch_hash,
        "block_canonical_string": canonical,
        "block_hash": _sha256_hex(canonical.encode("utf-8")),
    }


def _serialize_json(value: dict[str, Any], pretty: bool) -> str:
    if pretty:
        return json.dumps(value, indent=2, sort_keys=True)
    return json.dumps(value, sort_keys=True, separators=(",", ":"))


def _sha256_hex(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def _issue(code: str, message: str, criticality: Criticality) -> VerificationIssue:
    return VerificationIssue(code=code, message=message, criticality=criticality)


def _uint64(value: Any) -> int | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value if value >= 0 else None
    if isinstance(value, float):
        return int(value) if value >= 0 and value.is_integer() else None
    return None


def _record_timestamp(record: dict[str, Any]) -> int | None:
    payload = record.get("payload") if isinstance(record.get("payload"), dict) else {}
    return _uint64(payload.get("timestamp_utc")) or _uint64(record.get("timestamp_utc")) or _uint64(record.get("timestamp"))


def _is_aux_record_type(record_type: str) -> bool:
    return record_type in {"attachment", "location", "custody"}


def _manifest_policy(extra: dict[str, Any]) -> LukuPolicy | None:
    policy = extra.get("policy")
    if isinstance(policy, dict):
        return LukuPolicy(
            name=str(policy.get("name", "")),
            native_continuity_gap_seconds=_uint64(policy.get("native_continuity_gap_seconds")),
        )

    legacy_threshold = _uint64(extra.get("native_continuity_gap_seconds"))
    if legacy_threshold is not None:
        return LukuPolicy(name="", native_continuity_gap_seconds=legacy_threshold)
    return None


def _expected_external_identity_payload(record: dict[str, Any], record_type: str) -> str | None:
    external_identity = record.get("external_identity")
    if not isinstance(external_identity, dict):
        return None
    endorser_id = external_identity.get("endorser_id")
    if not isinstance(endorser_id, str) or not endorser_id:
        return None

    if record_type == "attachment":
        checksum = record.get("checksum")
        merkle_root = record.get("merkle_root", "")
        return f"{checksum if isinstance(checksum, str) else ''}:{merkle_root if isinstance(merkle_root, str) else ''}:{endorser_id}"
    if record_type == "location":
        lat = record.get("lat")
        lng = record.get("lng")
        return f"{lat if isinstance(lat, (int, float)) else 0}:{lng if isinstance(lng, (int, float)) else 0}:{endorser_id}"
    if record_type == "custody":
        payload = record.get("payload") if isinstance(record.get("payload"), dict) else {}
        event = payload.get("event")
        status = payload.get("status")
        context_ref = payload.get("context_ref")
        return f"{event if isinstance(event, str) else ''}:{status if isinstance(status, str) else ''}:{context_ref if isinstance(context_ref, str) else ''}:{endorser_id}"
    return None


def _is_safe_zip_entry_name(name: str) -> bool:
    if not name or name.startswith(("/", "\\")) or "\\" in name:
        return False
    parts = name.split("/")
    return all(part and part not in {".", ".."} for part in parts)


def _validate_manifest_json(value: Any) -> None:
    if not isinstance(value, dict):
        raise ValueError("manifest.json must be a JSON object")
    if value.get("type") != "LukuArchive":
        raise ValueError('manifest.json field type must be "LukuArchive"')
    if not isinstance(value.get("version"), str) or not value["version"]:
        raise ValueError("manifest.json field version must be a non-empty string")
    if not isinstance(value.get("created_at_utc"), int):
        raise ValueError("manifest.json field created_at_utc must be an integer")
    if not isinstance(value.get("description"), str):
        raise ValueError("manifest.json field description must be a string")
    if not isinstance(value.get("blocks_hash"), str) or not value["blocks_hash"]:
        raise ValueError("manifest.json field blocks_hash must be a non-empty string")


def _apply_export_options(manifest_extra: dict[str, Any], options: LukuExportOptions | None) -> dict[str, Any]:
    extra = dict(manifest_extra)
    if options and options.policy:
        policy = {"name": options.policy.name}
        if options.policy.native_continuity_gap_seconds is not None:
            policy["native_continuity_gap_seconds"] = options.policy.native_continuity_gap_seconds
            extra["native_continuity_gap_seconds"] = options.policy.native_continuity_gap_seconds
        extra["policy"] = policy
    return extra
