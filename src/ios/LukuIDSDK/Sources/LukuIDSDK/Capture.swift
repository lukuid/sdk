// SPDX-License-Identifier: Apache-2.0
// `capture`: the device makes one signed record now, stores it, and returns it. A challenge
// token becomes the record's signed nonce, which proves the record was made after the token
// was issued.
import CryptoKit
import Foundation

/// The stored record returned by `capture`.
public struct CaptureResult: @unchecked Sendable {
    /// The stored record's ID (as `get` would return it).
    public let id: String
    /// `scan` or `environment`.
    public let type: String
    /// The record as decoded from the device.
    public let record: [String: Any]
    /// The record's signed nonce ("" when none).
    public let nonce: String
}

/// A capture that failed (`code`: INVALID_ARG, RECORD_SIGNATURE_INVALID, NONCE_MISMATCH, …).
public struct CaptureError: Error, LocalizedError {
    public let code: String
    public let message: String
    public var errorDescription: String? { message }

    public init(code: String, message: String) {
        self.code = code
        self.message = message
    }
}

public enum Capture {
    /// How long the Animal Reader waits for a tag.
    public static let windowSeconds: TimeInterval = 60

    /// 16–31 characters from `A–Z a–z 0–9 - _ . ~ + / =` (never `:`).
    public static func isValidToken(_ token: String) -> Bool {
        let allowed = Set("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.~+/=")
        return (16...31).contains(token.count) && token.allSatisfy { allowed.contains($0) }
    }

    /// A fresh random 24-character URL-safe token (144 bits).
    public static func createToken() -> String {
        let bytes = (0..<18).map { _ in UInt8.random(in: 0...255) }
        return Data(bytes).base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
    }

    /// Checks a `capture` reply: the record's Ed25519 signature over its canonical string must
    /// verify with the device key, and with a token the signed canonical string and the payload
    /// must both carry it as the nonce. Field-by-field canonical recomputation and certificate
    /// chains are checked when the record is exported or verified as evidence.
    public static func verifyReply(_ reply: Any, publicKey: String, token: String?) throws -> CaptureResult {
        guard let full = (reply as? [String: Any])?["full_record"] as? [String: Any] else {
            throw CaptureError(code: "CAPTURE_INVALID_REPLY", message: "The device reply holds no record")
        }
        let scan = full["scan_record"] as? [String: Any]
        guard let record = scan ?? (full["env_record"] as? [String: Any]) else {
            throw CaptureError(code: "CAPTURE_INVALID_REPLY", message: "The device reply holds no record")
        }
        let type = scan != nil ? "scan" : "environment"
        let canonical = record["canonical_string"] as? String ?? ""
        let signature: Data? = (record["signature"] as? Data) ?? (record["signature"] as? String).flatMap { Data(base64Encoded: $0) }
        guard !canonical.isEmpty, let signature,
              let keyData = Data(base64Encoded: publicKey), keyData.count == 32,
              let key = try? Curve25519.Signing.PublicKey(rawRepresentation: keyData),
              key.isValidSignature(signature, for: Data(canonical.utf8)) else {
            throw CaptureError(code: "RECORD_SIGNATURE_INVALID", message: "The captured record signature does not verify with the device key")
        }
        let nonce = ((record["payload"] as? [String: Any])?["nonce"] as? String) ?? ""
        if let token {
            // Scan: nonce is the 9th canonical field; environment: an alphabetical content field.
            let fields = canonical.split(separator: ":", omittingEmptySubsequences: false).map(String.init)
            let signed = type == "scan" ? (fields.count > 8 && fields[8] == token) : fields.contains(token)
            guard nonce == token, signed else {
                throw CaptureError(code: "NONCE_MISMATCH", message: "The captured record does not carry the challenge token")
            }
        }
        let id = (record["id"] as? String).flatMap { $0.isEmpty ? nil : $0 } ?? (full["record_id"] as? String ?? "")
        return CaptureResult(id: id, type: type, record: record, nonce: nonce)
    }
}

public extension LukuDevice {
    /// Asks the device for one signed record now and returns it once stored and checked
    /// (`Capture.verifyReply`). The Animal Reader waits up to 60 s for a tag (keepalive frames
    /// hold the inactivity timeout open); the Environment card records at once. Another capture
    /// running on the device fails with `capture_in_progress`.
    func capture(token: String? = nil, timeout: TimeInterval = 30) async throws -> CaptureResult {
        if let token, !Capture.isValidToken(token) {
            throw CaptureError(code: "INVALID_ARG", message: "invalid_token")
        }
        let opts: [String: Any] = token.map { ["token": $0] } ?? [:]
        let reply = try await call(key: "capture", opts: opts, timeout: timeout)
        return try Capture.verifyReply(reply, publicKey: info.key, token: token)
    }
}
