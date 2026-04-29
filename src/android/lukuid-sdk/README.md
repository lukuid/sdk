# LukuID SDK for Android

`com.lukuid:lukuid-sdk-android` is the native Kotlin SDK for Android applications that need to discover LukuID devices, validate device identity, and verify `.luku` evidence archives.

## Install

Add the dependency from Maven Central:

```kotlin
dependencies {
    implementation("com.lukuid:lukuid-sdk-android:<version>")
}
```

## Platform requirements

- Android `minSdk` 26
- Kotlin / JVM 17 toolchain
- BLE support is available in the current SDK surface
- USB serial classes are present in the codebase, but BLE is the stable documented path for application integration

## Permissions

Add the Bluetooth permissions your app needs:

```xml
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

For production apps, scope legacy permissions to the Android versions that still require them.

## Quick start

```kotlin
val sdk = LukuSdk(context)

lifecycleScope.launch {
    val devices = sdk.getConnectedDevices()
    for (device in devices) {
        println("${device.info.id} verified=${device.info.verified}")
    }
}
```

Watch for nearby devices:

```kotlin
val subscription = sdk.onDevice { event ->
    println("${event.type}: ${event.device.info.id}")
}

sdk.startWatching()
```

## Parse envelope

Verify a single envelope map without building a `.luku` archive:

```kotlin
val issues = sdk.verifyEnvelope(envelopeMap)

for (issue in issues) {
    println("${issue.criticality}: ${issue.code}")
}
```

Always call `sdk.close()` when the SDK is no longer needed.

## Documentation

- Android guide: https://github.com/lukuid/sdk/blob/main/docs/android.md
- Verification guide: https://github.com/lukuid/sdk/blob/main/docs/verification.md
