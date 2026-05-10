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

## Configuration & Privacy Options

The SDK and Device interactions can be customized using initialization options or environment variables.

| Option / Env Var | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `LUKUID_DISABLE_TELEMETRY` | Env Var | `undefined` | Set to `"1"` to strictly block all telemetry data extraction and transmission globally. |
| `disableExternalCalls` | Config | `false` | Air-gap mode. Blocks all outbound traffic to the LukuID cloud (allows custom local endpoints). |
| `apiUrl` | Config | `https://api.lukuid.com` | Base URL for the LukuID API. |
| `allowUnverifiedDevices` | Config | `false` | If true, permits connection to devices that fail cryptographic attestation (flags as `verified=false`). |
| `debugLogging` | Config | `false` | Emits verbose discovery and validation diagnostics. |
| `crlMemoryOnly` | Config | `false` | Keeps Certificate Revocation Lists (CRLs) strictly in memory without writing to disk. |
| `crlCachePath` | Config | *OS Default* | Custom local directory path for storing the CRL cache. |
| `crlRefreshIntervalHours`| Config | `4` | Frequency of background CRL refresh. Set to `0` to disable auto-refresh. |
| `trustProfile` | Verify Config | `'prod'` | Enforces specific trust roots during `.luku` parsing (`'prod'`, `'dev'`, `'test'`). |
| `allowUntrustedRoots` | Verify Config | `false` | Permits `.luku` verification even if the root certificate isn't in the trusted store. |
| `skipCertificateTemporalChecks`| Verify Config | `false` | Bypasses time-based expiration checks on certificates during `.luku` parsing. |
