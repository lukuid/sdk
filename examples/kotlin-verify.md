# Kotlin Verify Example

```kotlin
import com.lukuid.sdk.LukuSDK

val sdk = LukuSDK()
val result = sdk.verify(fileBuffer)

if (result.valid) {
    println(result.manifest)
} else {
    println(result.reason)
}
```
