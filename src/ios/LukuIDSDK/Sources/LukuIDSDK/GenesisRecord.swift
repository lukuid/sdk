// SPDX-License-Identifier: Apache-2.0
import CryptoKit
import Foundation

/// Genesis record (dotluku spec "Genesis Anchoring"): a native record whose
/// previous_signature is the canonical base64 of exactly 32 bytes carries
/// SHA-256 of the device's raw Ed25519 public key instead of a 64-byte
/// predecessor signature. That value must match the record's public key, and
/// genesis_hash when present. The key survives DAC reissue.
func genesisRecordIssue(previousSignature: String, genesisHash: String, publicKeyBase64: String?, deviceID: String) -> VerificationIssue? {
    guard let previous = Data(base64Encoded: previousSignature),
          previous.count == 32,
          previous.base64EncodedString() == previousSignature else {
        return nil
    }
    guard let publicKeyBase64, let publicKey = Data(base64Encoded: publicKeyBase64), publicKey.count == 32 else {
        return VerificationIssue(code: "GENESIS_HASH_MISMATCH", message: "Genesis record for device \(deviceID) cannot be anchored: device public key missing or invalid.", criticality: .critical)
    }
    if Data(SHA256.hash(data: publicKey)) != previous {
        return VerificationIssue(code: "GENESIS_HASH_MISMATCH", message: "Genesis record for device \(deviceID) has previous_signature that does not match the SHA-256 of its public key.", criticality: .critical)
    }
    if !genesisHash.isEmpty && genesisHash != previousSignature {
        return VerificationIssue(code: "GENESIS_HASH_MISMATCH", message: "Genesis record for device \(deviceID) has genesis_hash that does not match previous_signature.", criticality: .critical)
    }
    return nil
}
