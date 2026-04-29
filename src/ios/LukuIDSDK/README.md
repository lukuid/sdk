# LukuID SDK for Apple Platforms

`LukuIDSDK` is the native Swift SDK for iOS and macOS applications that need to discover LukuID devices, validate device identity, and verify `.luku` forensic evidence archives.

The package currently exposes BLE transport for live device communication.

## Swift Package Manager

```swift
dependencies: [
    .package(url: "https://github.com/lukuid/sdk.git", from: "<version>")
]
```

Then add the `LukuIDSDK` product to your target dependencies.

## CocoaPods

```ruby
pod 'LukuIDSDK', '<version>'
```

## Platform requirements

- iOS 15 or newer
- macOS 12 or newer
- Swift 5.9

## Permissions

For iOS BLE access, add a Bluetooth usage description:

```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>We use Bluetooth to connect to LukuID devices.</string>
```

## Quick start

```swift
import LukuIDSDK

let client = LukuIDClient()
let devices = try await client.getConnectedDevices()

for device in devices {
    print("\(device.info.id) verified=\(device.info.verified)")
}
```

Parse a `.luku` archive:

```swift
import Foundation
import LukuIDSDK

let result = try LukuFile.parse(url: URL(fileURLWithPath: "identity.luku"))
print(result.verified)
```

## Parse envelope

Verify a single envelope dictionary:

```swift
import LukuIDSDK

let issues = client.verifyEnvelope(envelope: envelopeJson)
print(issues)
```

## Documentation

- Apple guide: https://github.com/lukuid/sdk/blob/main/docs/apple.md
- Verification guide: https://github.com/lukuid/sdk/blob/main/docs/verification.md
