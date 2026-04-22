# Python SDK

The Python SDK (`lukuid-sdk`) provides Python helpers for opening, exporting, and verifying `.luku` forensic evidence archives.

Today, the Python package is focused on offline evidence workflows rather than live reader transport.

---

## Installation

```bash
python -m pip install lukuid-sdk
```

Requires Python 3.11 or newer.

---

## Basic usage

### Parse a `.luku` archive from disk

```python
from lukuid_sdk import LukuFile

result = LukuFile.parse("identity.luku")

print("Verified:", result.verified)
print("Items:", len(result.items))

for item in result.items:
    print(item.type, item.verified)
```

### Parse bytes directly

```python
from pathlib import Path
from lukuid_sdk import LukuFile

data = Path("identity.luku").read_bytes()
result = LukuFile.parse_bytes(data)

print("Verified:", result.verified)
```

### Inspect verification issues

```python
from lukuid_sdk import LukuArchive

archive = LukuArchive.open("identity.luku")
issues = archive.verify()

for issue in issues:
    print(issue.criticality.value, issue.code, issue.message)
```

---

## What the Python package currently covers

- open `.luku` archives
- parse manifest and record batches
- verify signatures and attestation chains
- run trust-profile-aware offline verification

If you need device transport today, use the JavaScript, Rust, Apple, or Android SDKs.
