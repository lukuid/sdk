# Swift Verify Example

```swift
import LukuSDK

let sdk = LukuSDK()
let result = try await sdk.verify(fileBuffer)

if result.valid {
    print(result.manifest)
} else {
    print(result.reason)
}
```
