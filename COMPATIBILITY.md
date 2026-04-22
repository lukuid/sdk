# Compatibility

This SDK is intended to implement the canonical [`.luku` specification](https://github.com/lukuid/dotluku).

## Compatibility expectations

A compatible SDK implementation must correctly implement:

- archive parsing
- canonical serialization rules
- record signature verification
- block integrity verification
- manifest verification
- trust profile behavior

## Trust compatibility

Support for custom roots or non-default trust profiles does not by itself make an implementation incompatible.

However, production-valid verification depends on trusted production roots and correct verifier configuration.

## Specification authority

If SDK behavior and specification text diverge, the [specification](https://github.com/lukuid/dotluku) is the normative authority and the SDK should be updated accordingly.
