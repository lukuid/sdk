# Certificate Revocation List (CRL) Checking

The LukuID SDKs implement a robust, low-memory certificate revocation checking mechanism to ensure compromised or manually revoked devices and certificates are rejected during attestation and identity verification.

## Core Mechanics

1. **Signed Full Snapshot**: `GET /crl` returns a Base64 payload, detached ECDSA-P256-SHA256 signature, and leaf-first PEM certificate chain. The payload contains version, generation time, and the complete set of revoked SHA-256 raw-public-key fingerprints. The SDK verifies the chain against pinned roots and the signature over the exact decoded payload bytes before replacing the active set. This permits rescinded entries to disappear safely.
2. **Local Persistence**: The signed envelope and check time are cached locally. Cache contents are cryptographically reverified on load; an unverified cache is never used for revocation decisions.
3. **Background Refresh**: Long-running SDK instances refresh at the configured interval (default: 4 hours). A recently checked cache suppresses the startup fetch. JavaScript SDK instances share concurrent requests for the same API origin.
4. **Fingerprint Verification**: Revocations are checked by generating a SHA-256 hash of the **raw public key bytes** of each certificate in the chain. Verification fails closed when no authenticated snapshot is available.
5. **Verification Order**: The SDK strictly verifies the cryptographic signatures of the certificate chain *before* checking against the revocation list.

## Configuration Options

All platforms expose the following CRL configuration options via their respective SDK initialization structures (e.g., `LukuSdkOptions`, `LukuIDClientOptions`):

*   `crlRefreshIntervalHours` (Integer): Frequency of background syncs. Set to `0` to disable automatic refreshing. Default: `4`.
*   `crlMemoryOnly` (Boolean): If `true`, the SDK will not write the signed snapshot to disk. Every application restart will require a full sync. Default: `false`.
*   `crlCachePath` (String/Path): Override the default directory where `lukuid_crl.json` is stored.
*   `trustProfile` (String, where supported): Selects the pinned certificate trust profile (`prod`, `test`, or `dev`) used to authenticate the signed snapshot. Defaults to `prod` or the platform's `LUKUID_TRUST_PROFILE` environment setting.

---

## Platform Details

### Android (Kotlin)

*   **Storage Location**: Defaults to `context.filesDir` (internal app storage).
*   **Initialization**: Configured via `LukuSdkOptions`.
*   **Background Task**: Managed via Kotlin Coroutines (`CoroutineScope` tied to the SDK lifecycle). Cancelled automatically when `LukuSdk.close()` is called.

```kotlin
val options = LukuSdkOptions(
    crlRefreshIntervalHours = 2,
    crlMemoryOnly = false,
    crlCachePath = context.cacheDir.absolutePath // Optional override
)
val sdk = LukuSdk(context, options)
```

### iOS (Swift)

*   **Storage Location**: Defaults to the application's `Application Support` directory (`.../Library/Application Support/LukuID/lukuid_crl.json`).
*   **Initialization**: Configured via `LukuIDClientOptions`.
*   **Background Task**: Managed using a repeating `Timer` and Swift Concurrency (`Task`).

```swift
let options = LukuIDClientOptions(
    crlRefreshIntervalHours: 4,
    crlMemoryOnly: false
)
let sdk = LukuIDClient(options: options)
```

### JavaScript / TypeScript (Node.js & Browser)

*   **Storage Location**: 
    *   *Browser*: Uses `localStorage` under the key `lukuid_crl_v2:<apiUrl>:<trustProfile>`.
    *   *Node.js*: Uses memory only (or requires custom implementation if `crlCachePath` is utilized depending on the environment).
*   **Initialization**: Configured via `LukuidSdkOptions`.
*   **Background Task**: Uses `setInterval`.

```typescript
import { LukuidSdk } from '@lukuid/sdk';

const sdk = new LukuidSdk({
  crlRefreshIntervalHours: 4,
  crlMemoryOnly: false
});
```

### Python

*   **Storage Location**: Defaults to `~/.lukuid/lukuid_crl.json` in the user's home directory.
*   **Initialization**: Passed as a dictionary of options to `RevocationManager` or through `LukuVerifyOptions` for file verification.
*   **Background Task**: Managed using a daemon `threading.Thread` and a `threading.Event` for clean shutdown.

```python
from lukuid_sdk import LukuVerifyOptions

options = LukuVerifyOptions(
    # Revocation manager is configured manually or via SDK wrapper if applicable
)
```

### Rust

*   **Storage Location**: Defaults to `~/.lukuid/lukuid_crl.json` (using the `dirs` crate).
*   **Initialization**: Configured via `LukuidSdkOptions`.
*   **Background Task**: Managed via a `tokio::spawn` task. Gracefully shuts down via a `oneshot` channel when the manager is dropped.

```rust
use lukuid_sdk::{LukuidSdkOptions, LukuidSdk};

let mut options = LukuidSdkOptions::default();
options.crl_refresh_interval_hours = 4;
options.crl_memory_only = false;

let sdk = LukuidSdk::with_options(options);
```
