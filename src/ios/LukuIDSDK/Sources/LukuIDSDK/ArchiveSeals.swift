// SPDX-License-Identifier: Apache-2.0
import CryptoKit
import Foundation
import Security

enum ArchiveSeals {
    private static func hash(_ manifest: Data) -> String {
        SHA256.hash(data: manifest).map { String(format: "%02x", $0) }.joined()
    }

    private static func payload(_ manifestHash: String, _ timestamp: Int64) -> Data {
        Data("LUKUID-ARCHIVE-SEAL-V1\nmanifest_hash_alg=SHA-256\nmanifest_hash=\(manifestHash)\ncreated_at_utc=\(timestamp)".utf8)
    }

    static func create(manifest: Data, timestamp: Int64) throws -> String {
        guard timestamp >= 0 else { throw error("Archive seal timestamp is negative") }
        var seed = [UInt8](repeating: 0, count: mldsaSeedBytes)
        let randomStatus = seed.withUnsafeMutableBytes { bytes in
            SecRandomCopyBytes(kSecRandomDefault, bytes.count, bytes.baseAddress!)
        }
        guard randomStatus == errSecSuccess else { throw error("Secure randomness unavailable for ML-DSA-65 seal") }
        var publicKey = [UInt8](repeating: 0, count: mldsa65PublicKeyBytes)
        var secretKey = [UInt8](repeating: 0, count: mldsa65SecretKeyBytes)
        defer {
            for index in seed.indices { seed[index] = 0 }
            for index in secretKey.indices { secretKey[index] = 0 }
        }
        guard mldsa65KeypairInternal(publicKey: &publicKey, secretKey: &secretKey, seed: &seed) == 0 else {
            throw error("ML-DSA-65 key generation failed")
        }
        let manifestHash = hash(manifest)
        var signature = [UInt8](repeating: 0, count: mldsa65Bytes)
        var signatureLength = 0
        guard mldsa65Signature(signature: &signature, signatureLength: &signatureLength,
                               message: [UInt8](payload(manifestHash, timestamp)), secretKey: &secretKey) == 0,
              signatureLength == mldsa65Bytes else {
            throw error("ML-DSA-65 archive signing failed")
        }
        let object: [String: Any] = [
            "version": 1,
            "manifest_hash": ["alg": "SHA-256", "value": manifestHash],
            "seals": [[
                "type": "self", "alg": "ML-DSA-65", "created_at_utc": timestamp,
                "public_key": Data(publicKey).base64EncodedString(),
                "signature": Data(signature).base64EncodedString()
            ]]
        ]
        let encoded = try JSONSerialization.data(withJSONObject: object, options: [.prettyPrinted, .sortedKeys])
        return String(decoding: encoded, as: UTF8.self)
    }

    static func verify(raw: String?, manifest: Data) -> [VerificationIssue] {
        func critical(_ code: String, _ message: String) -> VerificationIssue {
            VerificationIssue(code: code, message: message, criticality: .critical)
        }
        guard let raw else { return [critical("ARCHIVE_SEALS_MISSING", "The required seals.json file is missing.")] }
        guard let root = (try? JSONSerialization.jsonObject(with: Data(raw.utf8))) as? [String: Any],
              let versionNumber = root["version"] as? NSNumber,
              !["d", "f", "c", "B"].contains(String(cString: versionNumber.objCType)),
              versionNumber.intValue == 1,
              let manifestHash = root["manifest_hash"] as? [String: Any],
              manifestHash["alg"] as? String == "SHA-256",
              let seals = root["seals"] as? [[String: Any]], !seals.isEmpty else {
            return [critical("ARCHIVE_SEALS_MALFORMED", "seals.json has invalid required fields.")]
        }
        let expectedHash = hash(manifest)
        guard manifestHash["value"] as? String == expectedHash else {
            return [critical("ARCHIVE_SEALS_MANIFEST_HASH_MISMATCH", "seals.json does not commit to the exact manifest.json bytes.")]
        }
        var issues: [VerificationIssue] = []
        var validSelf = false
        var sharedTimestamp: Int64?
        for seal in seals {
            guard let type = seal["type"] as? String,
                  let timestampNumber = seal["created_at_utc"] as? NSNumber,
                  !["d", "f", "c", "B"].contains(String(cString: timestampNumber.objCType)),
                  let timestamp = seal["created_at_utc"] as? Int64, timestamp >= 0 else {
                issues.append(critical("ARCHIVE_SEALS_MALFORMED", "A seal has invalid required fields."))
                continue
            }
            if let sharedTimestamp, timestamp != sharedTimestamp {
                issues.append(critical("ARCHIVE_SEALS_MALFORMED", "Seals do not share one canonical payload timestamp."))
                continue
            }
            sharedTimestamp = timestamp
            switch type {
            case "self":
                guard seal["alg"] as? String == "ML-DSA-65",
                      let keyString = seal["public_key"] as? String,
                      let signatureString = seal["signature"] as? String,
                      let key = Data(base64Encoded: keyString), key.count == mldsa65PublicKeyBytes,
                      let signature = Data(base64Encoded: signatureString), signature.count == mldsa65Bytes,
                      key.base64EncodedString() == keyString,
                      signature.base64EncodedString() == signatureString,
                      mldsa65Verify(signature: [UInt8](signature), message: [UInt8](payload(expectedHash, timestamp)),
                                    publicKey: [UInt8](key)) == 0 else {
                    issues.append(critical("ARCHIVE_SELF_SEAL_INVALID", "A required ML-DSA-65 self seal failed cryptographic verification."))
                    continue
                }
                validSelf = true
            case "platform":
                if ["platform", "alg", "public_key", "signature"].contains(where: { (seal[$0] as? String)?.isEmpty != false }) {
                    issues.append(critical("ARCHIVE_SEALS_MALFORMED", "A platform seal has invalid required fields."))
                } else if seal["platform"] as? String == "android" && seal["alg"] as? String == "ES256",
                          ((seal["key_id"] as? String)?.range(of: "^[0-9a-f]{64}$", options: .regularExpression) == nil
                           || Data(base64Encoded: seal["public_key"] as? String ?? "") == nil
                           || Data(base64Encoded: seal["signature"] as? String ?? "")?.count != 64
                           || ((seal["certificate_chain"] as? [String])?.count ?? 0) < 2
                           || ((seal["certificate_chain"] as? [String])?.count ?? 0) > 12
                           || !((seal["certificate_chain"] as? [String]) ?? []).allSatisfy({ Data(base64Encoded: $0) != nil })
                           || !["strongbox", "tee"].contains((seal["metadata"] as? [String: Any])?["security_level"] as? String ?? "")) {
                    issues.append(critical("ARCHIVE_SEALS_MALFORMED", "An Android platform seal has malformed verification material."))
                } else {
                    issues.append(VerificationIssue(code: "ARCHIVE_PLATFORM_SEAL_UNSUPPORTED", message: "This SDK cannot independently validate this platform seal.", criticality: .warning))
                }
            case "authority":
                if ["alg", "key_id", "root_fingerprint", "signature"].contains(where: { (seal[$0] as? String)?.isEmpty != false })
                    || !(seal["certificate_chain"] is [String]) {
                    issues.append(critical("ARCHIVE_SEALS_MALFORMED", "An authority seal has invalid required fields."))
                } else {
                    issues.append(VerificationIssue(code: "ARCHIVE_AUTHORITY_SEAL_UNSUPPORTED", message: "Authority seals are reserved and are not trusted by this SDK.", criticality: .warning))
                }
            default:
                issues.append(critical("ARCHIVE_SEALS_MALFORMED", "Unknown seal type."))
            }
        }
        if !validSelf { issues.append(critical("ARCHIVE_SELF_SEAL_MISSING", "The archive has no valid ML-DSA-65 self seal.")) }
        return issues
    }

    private static func error(_ message: String) -> NSError {
        NSError(domain: "lukuid.archive.seal", code: -1, userInfo: [NSLocalizedDescriptionKey: message])
    }
}
