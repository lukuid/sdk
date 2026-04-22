# LukuID SwiftPM Wrapper Template

This folder contains a thin Swift Package Manager binary wrapper that points to SDK binaries published on the Lukuid CDN. The wrapper is intended to live in a separate public repository; CI can populate `Package.swift` from `Package.swift.template`, commit it, and tag a release for SwiftPM consumers.

## Template workflow

1. Copy `Package.swift.template` to `Package.swift` and replace the placeholders:
   - `__VERSION__` with the UTC timestamp version (e.g., `20260126153045`).
   - `__YEAR__` / `__MONTH__` with their respective slices from the version.
   - `__ZIP_CHECKSUM__` with the output of `swift package compute-checksum LukuIDSDK-<version>.zip`.
   - Optionally set `__LATEST_ZIP_CHECKSUM__` if you want to expose the `latest` CDN alias (useful for beta builds only).
2. Update `packageName`/`binaryTargetName` to match the eventual public repo branding.
3. Commit and tag the wrapper in its public repo. Pinning to specific CDN versions is recommended. The latest alias lives at `https://cdn.lukuid.com/sdk/latest/ios/LukuIDSDK-latest.zip` but should only be used for quick experiments.

## Example versioned target URL

```
https://cdn.lukuid.com/sdk/2026/01/ios/LukuIDSDK-20260126153045.zip
```

## Example automation script (commented)

```bash
# export VERSION=20260126153045
# export WRAPPER_REPO=git@github.com:lukuid/lukuid-ios-spm-wrapper.git
# export CDN_YEAR=${VERSION:0:4}
# export CDN_MONTH=${VERSION:4:2}
# export GH_TOKEN=... # required to push to the public repo
# tmp_dir=$(mktemp -d)
# git clone "$WRAPPER_REPO" "$tmp_dir"
# cp Package.swift README.md "$tmp_dir"/
# pushd "$tmp_dir"
# git add Package.swift README.md
# git commit -m "release: LukuIDSDK ${VERSION}"
# git tag "${VERSION}"
# git -c user.email=ci@lukuid.com -c user.name="Lukuid CI" \
#   push origin main "${VERSION}" # requires GH_TOKEN permissions
# popd
```

Pin the SDK in downstream `Package.swift` files so builds remain deterministic:

```swift
.package(url: "https://github.com/lukuid/lukuid-ios-spm-wrapper", exact: "20260126153045")
```
