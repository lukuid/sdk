// SPDX-License-Identifier: Apache-2.0
import XCTest
@testable import LukuIDSDK
import CryptoKit

final class EnvelopeTests: XCTestCase {

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

    func testVerifyEnvelopeValid() throws {
        let envelope = getValidEnvelope()
        let issues = LukuFile.verifyEnvelope(envelope: envelope, options: LukuVerifyOptions(allowUntrustedRoots: false, skipCertificateTemporalChecks: true, trustProfile: "dev"))
        XCTAssertTrue(issues.isEmpty, "Expected no issues, got \(issues)")
    }

    func testVerifyEnvelopeKeyMismatch() throws {
        var envelope = getValidEnvelope()
        
        let privateKey = Curve25519.Signing.PrivateKey()
        let publicKeyData = privateKey.publicKey.rawRepresentation
        let pubKeyBase64 = publicKeyData.base64EncodedString()
        
        var device = envelope["device"] as? [String: Any] ?? [:]
        device["public_key"] = pubKeyBase64
        envelope["device"] = device
        
        let canonical = envelope["canonical_string"] as? String ?? ""
        let signatureData = try privateKey.signature(for: canonical.data(using: .utf8)!)
        envelope["signature"] = signatureData.base64EncodedString()

        let issues = LukuFile.verifyEnvelope(envelope: envelope, options: LukuVerifyOptions(allowUntrustedRoots: false, skipCertificateTemporalChecks: true, trustProfile: "dev"))
        XCTAssertTrue(issues.contains { $0.code == "ATTESTATION_FAILED" })
    }

    func testVerifyEnvelopeInvalidSignature() throws {
        var envelope = getValidEnvelope()
        envelope["signature"] = Data(repeating: 0, count: 64).base64EncodedString()

        let issues = LukuFile.verifyEnvelope(envelope: envelope, options: LukuVerifyOptions(allowUntrustedRoots: false, skipCertificateTemporalChecks: true, trustProfile: "dev"))
        XCTAssertTrue(issues.contains { $0.code == "RECORD_SIGNATURE_INVALID" })
    }

    func testVerifyEnvelopeMissingIdentity() {
        var envelope = getValidEnvelope()
        envelope.removeValue(forKey: "device")
        envelope.removeValue(forKey: "device_id")
        envelope.removeValue(forKey: "public_key")
        
        let issues = LukuFile.verifyEnvelope(envelope: envelope, options: LukuVerifyOptions(allowUntrustedRoots: false, skipCertificateTemporalChecks: true, trustProfile: "dev"))
        XCTAssertTrue(issues.contains { $0.code == "DEVICE_IDENTITY_MISSING" })
    }

    func testVerifyEnvelopeInvalidDac() throws {
        var envelope = getValidEnvelope()
        envelope["attestation_intermediate_der"] = "bad_cert".data(using: .utf8)?.base64EncodedString()
        let issues = LukuFile.verifyEnvelope(envelope: envelope, options: LukuVerifyOptions(allowUntrustedRoots: false, skipCertificateTemporalChecks: true, trustProfile: "dev"))
        XCTAssertTrue(issues.contains { $0.code == "ATTESTATION_FAILED" })
    }

    func testVerifyEnvelopeInvalidCanonicalString() {
        var envelope = getValidEnvelope()
        envelope["canonical_string"] = "tampered:canonical:string"
        let issues = LukuFile.verifyEnvelope(envelope: envelope, options: LukuVerifyOptions(allowUntrustedRoots: false, skipCertificateTemporalChecks: true, trustProfile: "dev"))
        XCTAssertTrue(issues.contains { $0.code == "RECORD_SIGNATURE_INVALID" })
    }

    func testVerifyEnvelopeTamperedMldsaSignature() throws {
        var envelope = getValidEnvelope()
        guard let derBase64 = envelope["attestation_intermediate_der"] as? String,
              var der = Data(base64Encoded: derBase64) else {
            XCTFail("Missing attestation_intermediate_der")
            return
        }
        // Tamper with the last byte of the signature
        der[der.count - 1] = der[der.count - 1] ^ 0xFF
        envelope["attestation_intermediate_der"] = der.base64EncodedString()
        
        let issues = LukuFile.verifyEnvelope(envelope: envelope, options: LukuVerifyOptions(allowUntrustedRoots: false, skipCertificateTemporalChecks: true, trustProfile: "dev"))
        XCTAssertTrue(issues.contains { $0.code == "ATTESTATION_FAILED" }, "Expected ATTESTATION_FAILED due to tampered signature")
    }

    func testVerifyEnvelopeWrongRoot() throws {
        var envelope = getValidEnvelope()
        // Remove the intermediate so it tries to verify DAC against roots directly
        envelope.removeValue(forKey: "attestation_intermediate_der")
        if var identity = envelope["identity"] as? [String: Any] {
            identity.removeValue(forKey: "attestation_intermediate_der")
            envelope["identity"] = identity
        }
        
        let issues = LukuFile.verifyEnvelope(envelope: envelope, options: LukuVerifyOptions(allowUntrustedRoots: false, skipCertificateTemporalChecks: true, trustProfile: "dev"))
        XCTAssertTrue(issues.contains { $0.code == "ATTESTATION_FAILED" }, "Expected ATTESTATION_FAILED due to missing/wrong root chain, got: \(issues)")
    }

    func testVerifyEnvelopeMalformedSpki() throws {
        var envelope = getValidEnvelope()
        guard let derBase64 = envelope["attestation_intermediate_der"] as? String,
              var der = Data(base64Encoded: derBase64) else {
            XCTFail("Missing attestation_intermediate_der")
            return
        }
        // Mess up the middle of the cert where SPKI usually is
        for i in 100..<200 { der[i] = 0x00 }
        envelope["attestation_intermediate_der"] = der.base64EncodedString()
        
        let issues = LukuFile.verifyEnvelope(envelope: envelope, options: LukuVerifyOptions(allowUntrustedRoots: false, skipCertificateTemporalChecks: true, trustProfile: "dev"))
        XCTAssertTrue(issues.contains { $0.code == "ATTESTATION_FAILED" }, "Expected ATTESTATION_FAILED due to malformed SPKI")
    }

    func testVerifyEnvelopeMalformedTbs() throws {
        var envelope = getValidEnvelope()
        guard let derBase64 = envelope["attestation_intermediate_der"] as? String,
              var der = Data(base64Encoded: derBase64) else {
            XCTFail("Missing attestation_intermediate_der")
            return
        }
        // Mess up the start of the TBS SEQUENCE
        der[4] = 0xFF
        der[5] = 0xFF
        envelope["attestation_intermediate_der"] = der.base64EncodedString()
        
        let issues = LukuFile.verifyEnvelope(envelope: envelope, options: LukuVerifyOptions(allowUntrustedRoots: false, skipCertificateTemporalChecks: true, trustProfile: "dev"))
        XCTAssertTrue(issues.contains { $0.code == "ATTESTATION_FAILED" }, "Expected ATTESTATION_FAILED due to malformed TBS")
    }
}
