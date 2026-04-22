# Python Verify Example

```python
from lukuid_sdk import LukuSDK

sdk = LukuSDK()
result = sdk.verify(file_buffer)

if result.valid:
    print(result.manifest)
else:
    print(result.reason)
```
