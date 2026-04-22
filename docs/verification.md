# Verification

The SDK verifies `.luku` files by checking:

- archive structure
- manifest integrity
- block integrity
- record signatures
- certificate chains
- trust profile compatibility
- continuity rules

Verification should be deterministic and aligned with the [published specification](https://github.com/lukuid/dotluku).
