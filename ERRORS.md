# LukuID Verification Errors

This document lists the error codes produced by LukuID SDK verification functions (`verify`, `verify_envelope`, `LukuFile.verify`, etc.) and their meanings.

| Error Code | Criticality | Description |
|------------|-------------|-------------|
| `MANIFEST_SIGNATURE_MISSING` | Critical | The archive manifest is missing a signature or the `manifest.sig` file is empty. |
| `MANIFEST_SIGNATURE_INVALID` | Critical | The manifest signature failed cryptographic verification against the exporter's public key. |
| `EXPORTER_KEY_MISSING` | Warning | The archive does not declare an `exporter_public_key`, preventing offline manifest verification. |
| `BLOCKS_HASH_MISMATCH` | Critical | The SHA-256 hash of the `blocks.jsonl` file does not match the hash recorded in the manifest. |
| `BLOCK_CHAIN_BROKEN` | Critical | A block's `previous_block_hash` field does not match the hash of the preceding block. |
| `BLOCK_BATCH_HASH_INVALID` | Critical | The block's `batch_hash` does not match the ordered concatenation of record signatures within that block. |
| `BLOCK_CANONICAL_MISMATCH` | Critical | The block's `block_canonical_string` does not match the recomputed canonical representation. |
| `BLOCK_HASH_INVALID` | Critical | The block's hash does not match the hash of its canonical string. |
| `RECORD_CHAIN_BROKEN` | Critical | A record's `previous_signature` does not match the signature of the previous record from the same device. |
| `GENESIS_HASH_MISMATCH` | Critical | A device's first record (counter 0) has a `previous_signature` that doesn't match its declared `genesis_hash`. |
| `COUNTER_REGRESSION` | Critical | A record was found with a counter value lower than or equal to a previous record from the same device. |
| `TIME_REGRESSION` | Critical | A record's `timestamp_utc` is earlier than a previous record from the same device. |
| `CONTINUITY_GAP_EXCEEDED` | Critical | The time gap between two native records exceeds the threshold defined in the archive's continuity policy. |
| `RECORD_SIGNATURE_INVALID` | Critical | A record's native signature failed verification against the device's public key. |
| `ATTESTATION_FAILED` | Critical | Device attestation (DAC) failed (e.g., invalid signature or certificate chain issues). |
| `ATTESTATION_CHAIN_MISSING` | Warning | The device has an attestation signature but is missing the required certificate chain (DAC). |
| `HEARTBEAT_VERIFICATION_FAILED` | Critical | The trusted-time heartbeat (SLAC) verification failed. |
| `HEARTBEAT_CHAIN_MISSING` | Warning | The record carries a heartbeat signature but is missing the required SLAC certificate chain. |
| `LAST_SYNC_AFTER_RECORD` | Critical | The device reports a `last_sync_utc` that is chronologically after the record's own capture time. |
| `ATTACHMENT_CORRUPT` | Critical | An attachment's actual SHA-256 hash does not match the `checksum` recorded in its parent record. |
| `ATTACHMENT_MISSING` | Critical | An attachment referenced by a record is missing from the archive's `attachments/` store. |
| `EXTERNAL_IDENTITY_VERIFICATION_FAILED` | Critical | An external identity endorsement (e.g., third-party signature) failed verification. |
| `PARENT_RECORD_MISSING` | Critical | An auxiliary record (attachment, location, custody) references a parent record ID that is not present in the archive. |
| `POLICY_NATIVE_TIME_GAP_UNSPLIT` | Warning | A block contains a native time gap exceeding the policy threshold that should have triggered a block split. |
