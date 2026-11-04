# Current-format samples (test trust profile)

Real exports from a LukuID Environment card provisioned under the **test** PKI
(device `A0403F98`), made on 2026-11-04 with the current firmware: records
`4099-env` … `4108-env` (10-minute schedule and host captures), plus device-attested
`location`, `custody` and `attachment` records, sealed (`seals.json`). They follow
the dotluku 1.1.0 Field Order rule. Verify them with `trust_profile = "test"`; the
`dev` and `prod` profiles must reject their certificate chain.

- `first-passable-verification-sample.luku`: untouched export; verifies with no issues.
- `signature-mismatch.luku`: the same export with one bit of record `4100-env`'s
  `signature` flipped (`RECORD_SIGNATURE_INVALID`).
- `invalid-chain.luku`: the same export with record `4101-env`'s
  `previous_signature` replaced by an older record's signature (`RECORD_CHAIN_BROKEN`).

`../../envelopes/test/1.1.0/valid_envelope.json` is record `4099-env` with its block's
device identity and certificates.

The `dev/1.0.0` samples predate the Field Order rule and archive seals; they are kept
for the certificate-chain tests that still use them.
