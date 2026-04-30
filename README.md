# LukuID SDK

Multi-language SDK for interacting with LukuID devices and parsing, exporting, and verifying `.luku` forensic evidence files.

This repository is licensed under Apache License 2.0 (`SPDX: Apache-2.0`). See [LICENSE](LICENSE).

## Build Status

[![SDK JS](https://github.com/lukuid/sdk/actions/workflows/js.yml/badge.svg)](https://github.com/lukuid/sdk/actions/workflows/js.yml)
[![SDK Rust](https://github.com/lukuid/sdk/actions/workflows/rust.yml/badge.svg)](https://github.com/lukuid/sdk/actions/workflows/rust.yml)
[![SDK Python](https://github.com/lukuid/sdk/actions/workflows/python.yml/badge.svg)](https://github.com/lukuid/sdk/actions/workflows/python.yml)
[![SDK iOS](https://github.com/lukuid/sdk/actions/workflows/ios.yml/badge.svg)](https://github.com/lukuid/sdk/actions/workflows/ios.yml)
[![SDK Android](https://github.com/lukuid/sdk/actions/workflows/android.yml/badge.svg)](https://github.com/lukuid/sdk/actions/workflows/android.yml)

## Published Status

[![npm version](https://img.shields.io/npm/v/%40lukuid%2Fsdk?style=flat-square&logo=npm)](https://www.npmjs.com/package/@lukuid/sdk)
[![crates.io](https://img.shields.io/crates/v/lukuid-sdk?style=flat-square&logo=rust)](https://crates.io/crates/lukuid-sdk)
[![PyPI](https://img.shields.io/pypi/v/lukuid-sdk?style=flat-square&logo=pypi)](https://pypi.org/project/lukuid-sdk/)
[![Maven Central](https://img.shields.io/maven-central/v/com.lukuid/lukuid-sdk-android?style=flat-square&logo=apachemaven)](https://central.sonatype.com/artifact/com.lukuid/lukuid-sdk-android)
[![CocoaPods](https://img.shields.io/cocoapods/v/LukuIDSDK?style=flat-square&logo=cocoapods)](https://cocoapods.org/pods/LukuIDSDK)
[![SwiftPM](https://img.shields.io/badge/SwiftPM-compatible-orange?style=flat-square&logo=swift)](https://github.com/lukuid/sdk)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache%202.0-blue?style=flat-square)](LICENSE)

## Supported platforms

- JavaScript / TypeScript
- React web apps (via the JavaScript SDK)
- Rust
- Python
- Swift (Swift Package Manager and CocoaPods)
- Android / Kotlin

## Public distribution channels

| Platform | Public package |
| --- | --- |
| JavaScript / TypeScript | `npm install @lukuid/sdk` |
| React web apps | `npm install @lukuid/sdk` |
| Rust | `cargo add lukuid-sdk` |
| Python | `python -m pip install lukuid-sdk` |
| Swift Package Manager | `.package(url: "https://github.com/lukuid/sdk.git", from: "1.0.8")` |
| CocoaPods | `pod 'LukuIDSDK', '~> 1.0'` |
| Android / Maven Central | `implementation("com.lukuid:lukuid-sdk-android:1.0.8")` |

The JavaScript release also publishes:

- `@lukuid/core`
- `@lukuid/transport-webble`
- `@lukuid/transport-webusb`
- `@lukuid/transport-serial-node`
- `@lukuid/transport-ble-node`

Android releases are also mirrored to GitHub Packages for private or pinned enterprise distribution.

## Versioning and release

The SDK release version is governed by a single source of truth: [`VERSION`](VERSION).

When you want to cut a new SDK release:

1. Update the canonical semver and sync every derived manifest:
   `python3 scripts/version_sync.py apply 1.0.8`
2. Verify that every managed package file matches:
   `python3 scripts/version_sync.py check`
3. Review the resulting manifest changes and commit them normally.
4. Create the release tag as `v1.0.8` after the release commit is on `main`.

The release workflows do not publish on every merge. They only publish when all of the following are true:

- the ref is a semver tag in the form `vX.Y.Z`
- the tag version matches `VERSION`
- the tagged commit is reachable from `main`

This means a normal merge without a version bump is safe: CI can still test and build the SDK, but no package will be published.

If you merge release-relevant changes without bumping the version, the repository simply remains ahead of the last published SDK release until you later update `VERSION`, run the sync script, commit the versioned manifests, and tag that commit. Reusing an already-published version number is not safe, because registry publishes are immutable and the publish jobs will fail once they try to push an existing version.

## What this SDK does

The SDK provides:

- device communication helpers
- `.luku` parsing
- offline verification of `.luku` archives
- trust profile support (`prod`, `test`, `development`)
- export helpers for valid LukuID devices

## What this SDK does not do

The SDK does not itself create production trust.

Production-valid evidence depends on:

- valid device attestation chains
- trusted roots and intermediates
- verifier trust profile configuration

## Documentation

- [JavaScript](docs/js.md)
- [Rust](docs/rust.md)
- [Python](docs/python.md)
- [Apple](docs/apple.md)
- [Android](docs/android.md)
- [Verification](docs/verification.md)
- [Snippets](docs/snippets.md)

## Related repositories

- `.luku` specification: [dotluku](https://github.com/lukuid/dotluku)
- CLI: [lukuid-cli](https://github.com/lukuid/cli)

## Trust profiles

By default, verification should use the `prod` trust profile.

Non-production profiles exist for:

- testing
- staging
- development devices
- reflashing / JTAG workflows

See [TRUST_PROFILES.md](TRUST_PROFILES.md).

## Compatibility

This SDK follows the canonical `.luku` specification.
See [COMPATIBILITY.md](COMPATIBILITY.md).

## License

Apache License 2.0 (`SPDX: Apache-2.0`). See [LICENSE](LICENSE).
