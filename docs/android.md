# Android SDK (Kotlin)

The Android SDK provides a native Kotlin API aligned with the LukuID cross-platform model, enabling discovery, validation, and communication with LukuID devices.

The public Kotlin API stays JSON-like, but device commands are encoded as firmware-compatible protobuf payloads inside the `LUKUID\x01~` transport frame.

It currently supports BLE transport. USB Serial support is in development.

---

## Installation

### Maven Central

Add the SDK to your app's `build.gradle.kts`:

```kotlin
dependencies {
    implementation("com.lukuid:lukuid-sdk-android:0.1.0")
    implementation("org.bouncycastle:bcpkix-jdk18on:1.77")
}
```

### GitHub Packages fallback

If you need to consume a private or pinned build from GitHub Packages instead of Maven Central:

```kotlin
repositories {
    mavenCentral()
    maven {
        url = uri("https://maven.pkg.github.com/lukuid/sdk")
        credentials {
            username = providers.gradleProperty("gpr.user").orNull
            password = providers.gradleProperty("gpr.key").orNull
        }
    }
}
```

> **Note:** USB Serial transport for Android is currently in development (TODO) and not yet functional in this release.

---

## Permissions (BLE)

For Bluetooth Low Energy access, add to `AndroidManifest.xml`:

```xml
<!-- API 31+ (Android 12) -->
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />

<!-- Legacy (Android 11 and below) -->
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

---

## SDK Usage

The primary entry point is `LukuSdk`. It manages transports and provides a unified device stream.

### Initialization

```kotlin
val sdk = LukuSdk(context)
```

For verbose discovery and validation diagnostics in Logcat, enable `debugLogging`:

```kotlin
val sdk = LukuSdk(
    context,
    LukuSdkOptions(debugLogging = true)
)
```

Always call `sdk.close()` when the SDK is no longer needed (e.g., in `onCleared()` of a ViewModel).

### Discovery

To listen for devices appearing or disappearing:

```kotlin
val subscription = sdk.onDevice { event ->
    when (event.type) {
        DeviceLifecycleEvent.Type.Added -> {
            println("Found device: ${event.device.info.id}")
        }
        DeviceLifecycleEvent.Type.Removed -> {
            println("Lost device: ${event.device.info.id}")
        }
    }
}

// Start scanning for BLE devices
sdk.startWatching()
```

For a lightweight snapshot without forcing full validation, use `getDiscoveredDevices()`:

```kotlin
val discovered = sdk.getDiscoveredDevices(
    EnumerateOptions(transports = listOf(TransportType.BLE, TransportType.USB))
)

for (device in discovered) {
    println("Found ${device.transport}: ${device.id} info=${device.info?.id}")
}
```

Notes:
- `getConnectedDevices()` still returns validated `Device` sessions.
- `getDiscoveredDevices()` is the faster picker/listing API.
- BLE discovery may return `info = null` until the SDK has cached identity from a prior validated connection.
- USB serial discovery can return identity details directly from a lightweight `info` probe.

### Direct Request

To wait for the next available device (with timeout):

```kotlin
try {
    val device = sdk.requestDevice(RequestDeviceOptions(timeoutMillis = 10_000L))
    println("Connected to ${device.info.id}")
} catch (e: Exception) {
    println("Request timed out or failed")
}
```

---

## Device Interaction

### Send Commands (Asynchronous)

`action()` sends a command without waiting for a response.

```kotlin
device.action("SET_LED", mapOf("color" to "blue"))
```

### Perform RPC Calls (Synchronous)

`call()` sends a command and waits for the response (default timeout 5s).

```kotlin
val result = device.call("PING", mapOf("ts" to System.currentTimeMillis()))
println("PING Response data: $result")
```

### Send Raw Binary

```kotlin
device.send(firmwareData)
```

### Listening for Events

```kotlin
device.onEvent { ev ->
    println("Event [${ev.key}]: ${ev.data}")
}
```

### Verification

Every device exposed by the SDK has been verified via the LukuID root key.

```kotlin
if (device.info.verified) {
    println("Device is genuine")
}
```
