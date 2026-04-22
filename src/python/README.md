# LukuID SDK for Python

Python helpers for opening, exporting, and verifying `.luku` forensic evidence archives.

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
```

For fuller documentation, see [docs/python.md](../../docs/python.md).
