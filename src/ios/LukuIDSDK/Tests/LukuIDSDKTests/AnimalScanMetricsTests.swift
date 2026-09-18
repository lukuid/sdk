// SPDX-License-Identifier: Apache-2.0
import CryptoKit
import Foundation
import XCTest
@testable import LukuIDSDK

final class AnimalScanMetricsTests: XCTestCase {

    private struct TestSigner {
        let privateKey: Curve25519.Signing.PrivateKey
        let publicKeyBase64: String
    }

    private func createTestSigner() -> TestSigner {
        let privateKey = Curve25519.Signing.PrivateKey()
        let publicKeyBase64 = Data(privateKey.publicKey.rawRepresentation).base64EncodedString()
        return TestSigner(privateKey: privateKey, publicKeyBase64: publicKeyBase64)
    }

    private func buildValidScanEnvelope(
        metrics: [Double] = [38.5, 45.0, -65.0, 12.0, 5.0, 120.0, 2.0, 3300.0, 10.0, 11.0, 1.0, 2000.0, 50.0, 1.2, 1.0, 5.0, -2.0, 0.0],
        scanVersion: String = "1.0.0",
        profile: String = "animal"
    ) throws -> [String: Any] {
        let signer = createTestSigner()
        let deviceID = "LUKUID-ANIMAL-READER-001"

        let payload: [String: Any] = [
            "ctr": 1001,
            "timestamp_utc": 1770823456,
            "uptime_us": 120000000,
            "nonce": "test_challenge_nonce",
            "firmware": "AR-v1.0.0",
            "profile": profile,
            "protocol": "FDX-B",
            "scan_version": scanVersion,
            "tag_id": "981098109810981",
            "temperature_c": 38.5,
            "metrics": metrics
        ]

        let formattedMetrics = metrics.map { String(format: "%.2f", $0) }.joined(separator: ",")
        let contentStr = "FDX-B:\(scanVersion):981098109810981:38.50"
        let canonicalStr = "\(deviceID):\(signer.publicKeyBase64):scan:SCAN-REC-001:1001:1770823456:120000000:\(profile):test_challenge_nonce:AR-v1.0.0:\(contentStr):\(formattedMetrics):"

        let signatureData = try signer.privateKey.signature(for: Data(canonicalStr.utf8))
        let sigB64 = Data(signatureData).base64EncodedString()

        let envelope: [String: Any] = [
            "type": "scan",
            "id": "SCAN-REC-001",
            "version": "1.0.0",
            "alg": "ED25519",
            "signature": sigB64,
            "previous_signature": "",
            "canonical_string": canonicalStr,
            "device": [
                "vendor": "LUKUID",
                "device_id": deviceID,
                "public_key": signer.publicKeyBase64
            ],
            "payload": payload
        ]

        return envelope
    }

    private func testOptions() -> LukuVerifyOptions {
        LukuVerifyOptions(
            allowUntrustedRoots: true,
            skipCertificateTemporalChecks: true,
            trustedExternalFingerprints: [],
            trustProfile: "dev"
        )
    }

    func testMetricsSurviveVerificationUnchanged() throws {
        let envelope = try buildValidScanEnvelope()
        let issues = LukuFile.verifyEnvelope(envelope: envelope, options: testOptions())
        let criticals = issues.filter { $0.criticality == .critical }
        XCTAssertEqual(criticals.count, 0, "Expected 0 critical issues, got \(criticals)")
    }

    func testSingleMetricValueMutationFailsClosed() throws {
        // Metric index 0 mutation
        var env0 = try buildValidScanEnvelope()
        var payload0 = env0["payload"] as! [String: Any]
        var metrics0 = payload0["metrics"] as! [Double]
        metrics0[0] = 99.0
        payload0["metrics"] = metrics0
        env0["payload"] = payload0
        var issues = LukuFile.verifyEnvelope(envelope: env0, options: testOptions())
        XCTAssertTrue(issues.contains { $0.code == "RECORD_CANONICAL_MISMATCH" }, "Metric[0] mutation must fail closed")

        // Metric middle index mutation
        var envMid = try buildValidScanEnvelope()
        var payloadMid = envMid["payload"] as! [String: Any]
        var metricsMid = payloadMid["metrics"] as! [Double]
        metricsMid[8] = 99.0
        payloadMid["metrics"] = metricsMid
        envMid["payload"] = payloadMid
        issues = LukuFile.verifyEnvelope(envelope: envMid, options: testOptions())
        XCTAssertTrue(issues.contains { $0.code == "RECORD_CANONICAL_MISMATCH" }, "Metric[middle] mutation must fail closed")

        // Metric last index mutation
        var envLast = try buildValidScanEnvelope()
        var payloadLast = envLast["payload"] as! [String: Any]
        var metricsLast = payloadLast["metrics"] as! [Double]
        metricsLast[metricsLast.count - 1] = 99.0
        payloadLast["metrics"] = metricsLast
        envLast["payload"] = payloadLast
        issues = LukuFile.verifyEnvelope(envelope: envLast, options: testOptions())
        XCTAssertTrue(issues.contains { $0.code == "RECORD_CANONICAL_MISMATCH" }, "Metric[last] mutation must fail closed")
    }

    func testMetricRemovalInsertionTruncationReorderingFailsClosed() throws {
        let opts = testOptions()

        // Truncation / Removal
        var envTrunc = try buildValidScanEnvelope()
        var payloadTrunc = envTrunc["payload"] as! [String: Any]
        var metricsTrunc = payloadTrunc["metrics"] as! [Double]
        metricsTrunc.removeLast()
        payloadTrunc["metrics"] = metricsTrunc
        envTrunc["payload"] = payloadTrunc
        var issues = LukuFile.verifyEnvelope(envelope: envTrunc, options: opts)
        XCTAssertTrue(issues.contains { $0.code == "RECORD_CANONICAL_MISMATCH" }, "Truncation must fail closed")

        // Append / Insertion
        var envApp = try buildValidScanEnvelope()
        var payloadApp = envApp["payload"] as! [String: Any]
        var metricsApp = payloadApp["metrics"] as! [Double]
        metricsApp.append(99.0)
        payloadApp["metrics"] = metricsApp
        envApp["payload"] = payloadApp
        issues = LukuFile.verifyEnvelope(envelope: envApp, options: opts)
        XCTAssertTrue(issues.contains { $0.code == "RECORD_CANONICAL_MISMATCH" }, "Append must fail closed")

        // Reordering / Swapping two metrics
        var envSwap = try buildValidScanEnvelope()
        var payloadSwap = envSwap["payload"] as! [String: Any]
        var metricsSwap = payloadSwap["metrics"] as! [Double]
        metricsSwap.swapAt(0, 1)
        payloadSwap["metrics"] = metricsSwap
        envSwap["payload"] = payloadSwap
        issues = LukuFile.verifyEnvelope(envelope: envSwap, options: opts)
        XCTAssertTrue(issues.contains { $0.code == "RECORD_CANONICAL_MISMATCH" }, "Swapping metrics must fail closed")
    }

    func testUnknownScanProfileOrSchemaFailsClosed() throws {
        let envelope = try buildValidScanEnvelope(profile: "unknown_profile_v99")
        let issues = LukuFile.verifyEnvelope(envelope: envelope, options: testOptions())
        XCTAssertTrue(issues.contains { $0.code == "RECORD_SCHEMA_UNRECOGNIZED" && $0.criticality == .critical },
                      "Unrecognized scan profile must trigger RECORD_SCHEMA_UNRECOGNIZED")
    }

    func testCanonicalReconstructionMatchesKnownFirmwareFixture() throws {
        let payload: [String: Any] = [
            "temperature_c": 38.5,
            "tag_id": "981098109810981",
            "scan_version": "1.0.0",
            "protocol": "FDX-B",
            "firmware": "AR-1.5.0",
            "nonce": "marketplace_challenge_token_xyz",
            "profile": "animal",
            "uptime_us": 120000000,
            "timestamp_utc": 1770823456,
            "ctr": 4501,
            "metrics": [38.5, 45, -65, 12, 5, 120, 2, 3300, 10, 11, 1, 2000, 50, 1.2, 1, 5, -2, 0]
        ]

        let record: [String: Any] = [
            "type": "scan",
            "id": "LUKUID-1770823456-4501-981098109810981",
            "previous_signature": "sha256_of_factory_dac",
            "payload": payload
        ]

        let expected = "LUK-1005-EU:base64_device_public_key:scan:LUKUID-1770823456-4501-981098109810981:4501:1770823456:120000000:animal:marketplace_challenge_token_xyz:AR-1.5.0:FDX-B:1.0.0:981098109810981:38.50:38.50,45.00,-65.00,12.00,5.00,120.00,2.00,3300.00,10.00,11.00,1.00,2000.00,50.00,1.20,1.00,5.00,-2.00,0.00:sha256_of_factory_dac"

        let actual = LukuFile.recomputeRecordCanonicalString(
            record,
            deviceID: "LUK-1005-EU",
            publicKey: "base64_device_public_key"
        )
        XCTAssertEqual(actual, expected)
    }
}
