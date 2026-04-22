# Architecture

The LukuID SDK is intentionally lightweight.

## Responsibilities

The SDK provides:

- device communication helpers
- `.luku` parsing
- offline verification
- export helpers where supported

## Root of trust

The root of trust remains in:

- device-generated signatures
- certificate chains
- verifier trust configuration

The SDK is not itself the trust anchor.
