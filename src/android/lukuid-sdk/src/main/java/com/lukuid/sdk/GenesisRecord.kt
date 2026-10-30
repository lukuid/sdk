// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk

import java.security.MessageDigest
import java.util.Base64

/**
 * Genesis record (dotluku spec "Genesis Anchoring"): a native record whose
 * previous_signature is the canonical base64 of exactly 32 bytes carries
 * SHA-256 of the device's raw Ed25519 public key instead of a 64-byte
 * predecessor signature. That value must match the record's public key, and
 * genesis_hash when present. The key survives DAC reissue.
 */
internal fun genesisRecordIssue(
    previousSignature: String,
    genesisHash: String,
    publicKeyBase64: String?,
    deviceId: String
): VerificationIssue? {
    val previous = try {
        Base64.getDecoder().decode(previousSignature)
    } catch (e: IllegalArgumentException) {
        return null
    }
    if (previous.size != 32 || Base64.getEncoder().encodeToString(previous) != previousSignature) {
        return null
    }
    val publicKey = publicKeyBase64
        ?.let { value -> try { Base64.getDecoder().decode(value) } catch (e: IllegalArgumentException) { null } }
        ?.takeIf { it.size == 32 }
        ?: return VerificationIssue(
            "GENESIS_HASH_MISMATCH",
            "Genesis record for device $deviceId cannot be anchored: device public key missing or invalid.",
            Criticality.CRITICAL
        )
    if (!MessageDigest.getInstance("SHA-256").digest(publicKey).contentEquals(previous)) {
        return VerificationIssue(
            "GENESIS_HASH_MISMATCH",
            "Genesis record for device $deviceId has previous_signature that does not match the SHA-256 of its public key.",
            Criticality.CRITICAL
        )
    }
    if (genesisHash.isNotEmpty() && genesisHash != previousSignature) {
        return VerificationIssue(
            "GENESIS_HASH_MISMATCH",
            "Genesis record for device $deviceId has genesis_hash that does not match previous_signature.",
            Criticality.CRITICAL
        )
    }
    return null
}
