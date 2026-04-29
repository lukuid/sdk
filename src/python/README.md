# LukuID SDK for Python

`lukuid-sdk` provides Python support for opening, parsing, exporting, and verifying `.luku` forensic evidence archives.

The Python package is for offline evidence workflows. It does not currently ship live reader transport support.

## Install

```bash
python -m pip install lukuid-sdk
```

Requires Python 3.11 or newer.

## Quick start

```python
from lukuid_sdk import LukuFile

result = LukuFile.parse("identity.luku")

print(result.verified)
print(len(result.items))
print(result.issues)
```

Parse bytes directly:

```python
from pathlib import Path
from lukuid_sdk import LukuFile

data = Path("identity.luku").read_bytes()
result = LukuFile.parse_bytes(data)
```

Inspect verification issues:

```python
from lukuid_sdk import LukuArchive

archive = LukuArchive.open("identity.luku")
issues = archive.verify()

for issue in issues:
    print(issue.criticality.value, issue.code, issue.message)
```

## Parse envelope

Verify a single envelope loaded from JSON:

```python
import json
from lukuid_sdk import LukuFile

with open("envelope.json", "r", encoding="utf-8") as handle:
    envelope = json.load(handle)

issues = LukuFile.verify_envelope(envelope)
print(issues)
```

## Documentation

- Python guide: https://github.com/lukuid/sdk/blob/main/docs/python.md
- Verification guide: https://github.com/lukuid/sdk/blob/main/docs/verification.md
