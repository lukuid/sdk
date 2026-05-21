// SPDX-License-Identifier: Apache-2.0
import XCTest
@testable import LukuIDSDK

final class GuardCardParityTests: XCTestCase {

    private func getValidEnvelope() -> [String: Any] {
        let fileManager = FileManager.default
        var currentURL = URL(fileURLWithPath: #file)
        var sampleURL: URL?

        while currentURL.path != "/" {
            let candidate = currentURL.appendingPathComponent("samples/envelopes/dev/1.0.0/valid_envelope.json")
            if fileManager.fileExists(atPath: candidate.path) {
                sampleURL = candidate
                break
            }
            currentURL = currentURL.deletingLastPathComponent()
        }

        guard let url = sampleURL, let data = try? Data(contentsOf: url) else {
            fatalError("Could not locate valid_envelope.json")
        }

        return try! JSONSerialization.jsonObject(with: data, options: []) as! [String: Any]
    }

    private func verify(_ envelope: [String: Any]) -> [VerificationIssue] {
        LukuFile.verifyEnvelope(
            envelope: envelope,
            options: LukuVerifyOptions(
                allowUntrustedRoots: false,
                skipCertificateTemporalChecks: true,
                trustProfile: "dev"
            )
        )
    }

    func testMissingDetachedDacSignatureFails() {
        var envelope = getValidEnvelope()
        envelope.removeValue(forKey: "attestation_signature")
        if var identity = envelope["identity"] as? [String: Any] {
            identity.removeValue(forKey: "signature")
            envelope["identity"] = identity
        }

        let issues = verify(envelope)
        XCTAssertTrue(
            issues.contains { $0.code == "ATTESTATION_FAILED" && $0.message.contains("attestationSig missing") },
            "Expected attestationSig missing failure, got \(issues)"
        )
    }

    func testHeartbeatSignatureRequiresTrustedHeartbeatTimestamp() {
        var envelope = getValidEnvelope()
        guard var identity = envelope["identity"] as? [String: Any],
              let signature = identity["signature"] as? String else {
            XCTFail("Missing identity signature")
            return
        }

        envelope["heartbeat_signature"] = signature
        identity.removeValue(forKey: "last_sync_utc")
        envelope["identity"] = identity
        envelope.removeValue(forKey: "last_sync_utc")

        let issues = verify(envelope)
        XCTAssertTrue(
            issues.contains { $0.code == "ATTESTATION_FAILED" && $0.message.contains("Missing trusted heartbeat timestamp") },
            "Expected missing trusted heartbeat timestamp failure, got \(issues)"
        )
    }

    func testHeartbeatSignatureMustMatchHeartbeatPayload() {
        var envelope = getValidEnvelope()
        guard var identity = envelope["identity"] as? [String: Any],
              let signature = identity["signature"] as? String else {
            XCTFail("Missing identity signature")
            return
        }

        envelope["heartbeat_signature"] = signature
        identity["last_sync_utc"] = 1777286310
        envelope["identity"] = identity

        let issues = verify(envelope)
        XCTAssertTrue(
            issues.contains { $0.code == "ATTESTATION_FAILED" && $0.message.contains("SLAC (heartbeat)") },
            "Expected heartbeat payload verification failure, got \(issues)"
        )
    }

    func testLastSyncCannotBeAfterRecordTimestamp() {
        var envelope = getValidEnvelope()
        guard var identity = envelope["identity"] as? [String: Any],
              let signature = identity["signature"] as? String else {
            XCTFail("Missing identity signature")
            return
        }

        envelope["heartbeat_signature"] = signature
        identity["last_sync_utc"] = 1777286312
        envelope["identity"] = identity

        let issues = verify(envelope)
        XCTAssertTrue(
            issues.contains { $0.code == "LAST_SYNC_AFTER_RECORD" },
            "Expected LAST_SYNC_AFTER_RECORD, got \(issues)"
        )
    }
}
