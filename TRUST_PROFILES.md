# Trust Profiles

The SDK supports multiple trust profiles.

## Profiles

### `prod`
Production trust profile.

Use for:

- live devices
- customer evidence
- real forensic verification
- compliance-facing workflows

This profile should be the default.

### `test`
Test / staging trust profile.

Use for:

- CI
- QA
- staging environments
- integration testing
- sandbox systems

Evidence verified under this profile is not production-valid.

### `development`
Development trust profile.

Use for:

- reflashing
- JTAG-enabled devices
- local debugging
- non-production hardware experimentation

Evidence verified under this profile is not production-valid.

## Default behavior

SDKs and tools should default to `prod` unless explicitly configured otherwise.

## Output expectations

Verification results should make the active trust profile clear, especially when using `test` or `development`.
