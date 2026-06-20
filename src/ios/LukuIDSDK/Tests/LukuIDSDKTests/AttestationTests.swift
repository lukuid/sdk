// SPDX-License-Identifier: Apache-2.0
import XCTest
@testable import LukuIDSDK

final class AttestationTests: XCTestCase {

    private func getValidEnvelope() -> [String: Any] {
        let fileManager = FileManager.default
        var currentURL = URL(fileURLWithPath: #file)
        while currentURL.path != "/" {
            let candidate = currentURL.appendingPathComponent("samples/envelopes/dev/1.0.0/valid_envelope.json")
            if fileManager.fileExists(atPath: candidate.path),
               let data = try? Data(contentsOf: candidate),
               let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                return object
            }
            currentURL = currentURL.deletingLastPathComponent()
        }
        fatalError("Could not locate valid_envelope.json")
    }

    private func pemFromDerBase64(_ value: String) -> String {
        let chunks = stride(from: 0, to: value.count, by: 64).map { offset -> String in
            let start = value.index(value.startIndex, offsetBy: offset)
            let end = value.index(start, offsetBy: min(64, value.distance(from: start, to: value.endIndex)))
            return String(value[start..<end])
        }
        return "-----BEGIN CERTIFICATE-----\n\(chunks.joined(separator: "\n"))\n-----END CERTIFICATE-----\n"
    }

    func testMissingSignature() {
        let inputInvalid = DeviceAttestationInputs(
            id: "u1",
            key: "pk1",
            attestationSig: "!!!",
            certificateChain: nil,
            created: nil,
            attestationAlg: "Ed25519",
            attestationPayloadVersion: 1
        )
        
        let result = verifyDeviceAttestation(inputInvalid)
        switch result {
        case .success:
            XCTFail("Should fail")
        case .failure(let error):
            XCTAssertEqual(error.reason, "attestationSig is not valid base64")
        }
    }

    func testWrongLength() {
        let sig = Data([0, 1, 2]).base64EncodedString()
        let input = DeviceAttestationInputs(
            id: "u1",
            key: "pk1",
            attestationSig: sig,
            certificateChain: nil,
            created: nil,
            attestationAlg: "Ed25519",
            attestationPayloadVersion: 1
        )
        
        let result = verifyDeviceAttestation(input)
        switch result {
        case .success:
            XCTFail("Should fail")
        case .failure(let error):
            XCTAssertEqual(error.reason, "Attestation verification failed")
        }
    }
    
    func testVerificationFailure() {
        let sig = Data(count: 64).base64EncodedString()
        let input = DeviceAttestationInputs(
            id: "u1",
            key: "pk1",
            attestationSig: sig,
            certificateChain: nil,
            created: nil,
            attestationAlg: "Ed25519",
            attestationPayloadVersion: 1
        )
        
        let result = verifyDeviceAttestation(input)
        switch result {
        case .success:
            XCTFail("Should fail")
        case .failure(let error):
            XCTAssertEqual(error.reason, "Attestation verification failed")
        }
    }

    func testUsesDACStartAnchorInsteadOfRecordTimeForTemporalValidity() {
        let envelope = getValidEnvelope()
        let identity = envelope["identity"] as! [String: Any]
        let device = envelope["device"] as! [String: Any]
        let chain = [
            envelope["attestation_dac_der"] as? String,
            envelope["attestation_manufacturer_der"] as? String,
            envelope["attestation_intermediate_der"] as? String
        ].compactMap { $0 }.map(pemFromDerBase64).joined()

        let input = DeviceAttestationInputs(
            id: device["device_id"] as! String,
            key: device["public_key"] as! String,
            attestationSig: identity["signature"] as! String,
            certificateChain: chain,
            created: 4_102_444_800,
            attestationAlg: nil,
            attestationPayloadVersion: nil,
            trustProfile: "dev"
        )

        switch verifyDeviceAttestation(input) {
        case .success:
            break
        case .failure(let error):
            XCTFail("unexpected attestation failure: \(error.reason)")
        }
    }
}
