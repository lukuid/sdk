# Android Demo

Minimal Android app showing how to wire the `LukuSdk` BLE discovery helpers into a basic UI. The
activity requests runtime BLE permissions, starts the watcher, lists devices as they are validated,
and shows how to call `requestDevice()` to trigger the validation flow from a user gesture.

Build with:

```bash
./gradlew :examples:android-demo:assembleDebug
```

The module consumes the published SDK project via a Gradle project dependency.
