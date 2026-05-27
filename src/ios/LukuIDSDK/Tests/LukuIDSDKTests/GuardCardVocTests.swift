// SPDX-License-Identifier: Apache-2.0
import XCTest
@testable import LukuIDSDK
import CryptoKit

final class GuardCardVocTests: XCTestCase {
    private let magic = Data([0x4C, 0x55, 0x4B, 0x55, 0x49, 0x44, 0x01, 0x7E])

    func testDecoderMapsVocRawAndVocIndexFromEnvironmentFrames() throws {
        var payload = LukuIDEnvironmentPayload()
        payload.ctr = 4502
        payload.timestampUtc = 1770823456
        payload.vocRaw = 30000
        payload.vocIndex = 137

        var envRecord = LukuIDEnvironmentRecord()
        envRecord.version = "1.0.0"
        envRecord.id = "ENV-VOC-1"
        envRecord.canonicalString = "env-voc-canonical"
        envRecord.payload = payload

        var response = LukuIDCommandResponse()
        response.status = .ok
        response.success = true
        response.envRecord = envRecord

        var decoded: [String: Any]?
        let codec = LukuCodec(
            onMessage: { decoded = $0 },
            onError: { XCTFail("Unexpected codec error: \($0)") }
        )
        codec.feed(frame(try response.serializedData()))

        let envMap = decoded?["env_record"] as? [String: Any]
        let envPayload = envMap?["payload"] as? [String: Any]
        XCTAssertEqual(envPayload?["voc_raw"] as? UInt32, 30000)
        XCTAssertEqual(envPayload?["voc_index"] as? UInt32, 137)
        XCTAssertEqual(envMap?["canonical_string"] as? String, "env-voc-canonical")
    }

    func testVerifyEnvelopeAcceptsNewVocCanonicalAndRejectsOldFormat() throws {
        let privateKey = Curve25519.Signing.PrivateKey()
        let publicKeyBase64 = privateKey.publicKey.rawRepresentation.base64EncodedString()
        let canonical = "GC-TEST-1:\(publicKeyBase64):environment:ENV-VOC-1:4502:1770823456:3600000000:85:false:350.50:22.40:45.20:1013.20:30000:110:false:0.01:0.02:1.00:genesis_fake"
        let signature = try privateKey.signature(for: Data(canonical.utf8)).base64EncodedString()

        let envelope: [String: Any] = [
            "type": "environment",
            "id": "ENV-VOC-1",
            "device_id": "GC-TEST-1",
            "public_key": publicKeyBase64,
            "signature": signature,
            "previous_signature": "genesis_fake",
            "canonical_string": canonical,
            "payload": [
                "ctr": 4502,
                "timestamp_utc": 1770823456,
                "uptime_us": 3600000000 as Int64,
                "battery_percent": 85,
                "vbus_present": false,
                "lux": 350.5,
                "temp_c": 22.4,
                "humidity_pct": 45.2,
                "pressure_hpa": 1013.2,
                "voc_raw": 30000,
                "voc_index": 110,
                "tamper": false,
                "accel_g": ["x": 0.01, "y": 0.02, "z": 1.0],
                "genesis_hash": "genesis_fake"
            ]
        ]

        let validIssues = LukuFile.verifyEnvelope(
            envelope: envelope,
            options: LukuVerifyOptions(
                allowUntrustedRoots: true,
                skipCertificateTemporalChecks: true,
                trustedExternalFingerprints: [],
                trustProfile: "dev"
            )
        )
        XCTAssertTrue(validIssues.isEmpty, "Expected no issues, got \(validIssues)")

        let oldCanonical = "GC-TEST-1:\(publicKeyBase64):environment:ENV-VOC-1:4502:1770823456:3600000000:85:false:350.50:22.40:45.20:1013.20:110:false:0.01:0.02:1.00:genesis_fake"
        var invalidEnvelope = envelope
        invalidEnvelope["canonical_string"] = oldCanonical

        let invalidIssues = LukuFile.verifyEnvelope(
            envelope: invalidEnvelope,
            options: LukuVerifyOptions(
                allowUntrustedRoots: true,
                skipCertificateTemporalChecks: true,
                trustedExternalFingerprints: [],
                trustProfile: "dev"
            )
        )
        XCTAssertTrue(invalidIssues.contains { $0.code == "RECORD_SIGNATURE_INVALID" })
    }

    private func frame(_ payload: Data) -> Data {
        var data = Data()
        data.append(magic)
        var length = UInt32(payload.count).littleEndian
        withUnsafeBytes(of: &length) { data.append(contentsOf: $0) }
        data.append(payload)
        data.append(magic)
        return data
    }
}
