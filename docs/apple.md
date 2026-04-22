# Apple SDK (iOS + macOS)

The Apple SDK provides a native Swift API for LukuID devices, supporting iOS (15+) and macOS (12+). It currently supports BLE transport via CoreBluetooth.

The public Swift API stays dictionary-based, but device commands are encoded as firmware-compatible protobuf payloads inside the `LUKUID\x01~` transport frame.

---

## Installation

### Swift Package Manager

```swift
dependencies: [
    .package(url: "https://github.com/lukuid/sdk.git", from: "0.1.0")
]
```

Then depend on the `LukuIDSDK` product from the package.

### CocoaPods

```ruby
pod 'LukuIDSDK', '~> 0.1'
```

## Permissions (iOS)

Add `NSBluetoothAlwaysUsageDescription` to your `Info.plist`:

```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>We use Bluetooth to connect to LukuID devices.</string>
```

---

## Usage

The primary entry point is `LukuIDClient`. It provides a unified API for BLE-based LukuID devices.

### Initialization

```swift
import LukuIDSDK

let client = LukuIDClient()
```

To print verbose discovery and validation diagnostics while debugging, enable `debugLogging`:

```swift
let client = LukuIDClient(
    options: LukuIDClientOptions(debugLogging: true)
)
```

### Discovery

To listen for devices appearing or disappearing:

```swift
let token = client.onDevice { event in
    switch event.type {
    case .added:
        print("Device found: \(event.device.info.id)")
    case .removed:
        print("Device removed: \(event.device.info.id)")
    }
}

client.startWatching()
```

For a lightweight snapshot without opening validated sessions, use `getDiscoveredDevices()`:

```swift
let discovered = try await client.getDiscoveredDevices()

for device in discovered {
    print("Discovered \(device.id) info=\(device.info?.id ?? "unknown")")
}
```

Notes:
- `getConnectedDevices()` still returns validated `LukuDevice` sessions.
- `getDiscoveredDevices()` is the faster picker/listing API.
- On BLE, `info` is optional and is returned when the SDK has cached identity from a prior validated connection.

### Direct Request

To wait for the next available device (with timeout):

```swift
do {
    let device = try await client.requestDevice(
        options: RequestDeviceOptions(timeout: 10)
    )
    print("Connected to \(device.info.id)")
} catch {
    print("Connection failed: \(error)")
}
```

---

## Device Interaction

### Send Commands (Asynchronous)

`action()` sends a command without waiting for a response.

```swift
try await device.action(key: "SET_LED", opts: ["color": "green"])
```

### Perform RPC Calls (Synchronous)

`call()` sends a command and waits for the response (default timeout 5s).

```swift
do {
    let result = try await device.call(key: "PING", opts: ["ts": Date().timeIntervalSince1970])
    print("Response data: \(result)")
} catch {
    print("Command error: \(error)")
}
```

### Send Raw Binary

```swift
try await device.send(data: firmwareData)
```

### Listening for Events

```swift
let token = device.onEvent { ev in
    print("Event [\(ev.key)]: \(ev.data)")
}
```

### Verification Status

The SDK only exposes devices that have passed cryptographic attestation.

```swift
if device.info.verified {
    print("Device is verified.")
}
```

### Error Handling

Listen for SDK-level errors:

```swift
client.onError { error in
    print("SDK Error in \(error.whereHint): \(error.underlying)")
}
```
