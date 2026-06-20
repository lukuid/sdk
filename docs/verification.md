# Verification

The SDK verifies `.luku` files by checking:

- archive structure
- manifest integrity
- block integrity
- record signatures
- certificate chains
- trust profile compatibility
- continuity rules

DAC/device attestation is anchored to provisioning time. SDK verifiers check the DAC chain validity window at the DAC leaf certificate's `notBefore` timestamp plus 60 minutes, then apply CRL revocation checks. They do not use each record's timestamp as the DAC validity time, so a device can continue producing valid `.luku` evidence after its DAC expires as long as the DAC has not been revoked and the record, heartbeat, and continuity checks pass.

Heartbeat/SLAC trust remains record-time sensitive: the SDK still verifies the heartbeat chain and enforces that trusted heartbeat timestamps do not occur after the record timestamp.

Verification should be deterministic and aligned with the [published specification](https://github.com/lukuid/dotluku).
