// SPDX-License-Identifier: Apache-2.0
import CryptoKit
import Foundation

/// Genesis record (dotluku spec "Genesis Anchoring"): a native record whose
/// previous_signature is the canonical base64 of exactly 32 bytes carries
/// SHA-256(DAC DER) instead of a 64-byte predecessor signature. That value must
/// match the record's DAC, and genesis_hash when present.
func genesisRecordIssue(previousSignature: String, genesisHash: String, dacDerBase64: String?, deviceID: String) -> VerificationIssue? {
    guard let previous = Data(base64Encoded: previousSignature),
          previous.count == 32,
          previous.base64EncodedString() == previousSignature else {
        return nil
    }
    let dacText = dacDerBase64.map { $0.filter { !$0.isWhitespace } }
    guard let dacText, let dac = Data(base64Encoded: dacText), !dac.isEmpty else {
        return VerificationIssue(code: "GENESIS_HASH_MISMATCH", message: "Genesis record for device \(deviceID) cannot be anchored: DAC certificate missing.", criticality: .critical)
    }
    if Data(SHA256.hash(data: dac)) != previous {
        return VerificationIssue(code: "GENESIS_HASH_MISMATCH", message: "Genesis record for device \(deviceID) has previous_signature that does not match the SHA-256 of its DAC.", criticality: .critical)
    }
    if !genesisHash.isEmpty && genesisHash != previousSignature {
        return VerificationIssue(code: "GENESIS_HASH_MISMATCH", message: "Genesis record for device \(deviceID) has genesis_hash that does not match previous_signature.", criticality: .critical)
    }
    return nil
}
