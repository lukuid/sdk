// SPDX-License-Identifier: Apache-2.0
import XCTest
@testable import LukuIDSDK

final class AttestationTests: XCTestCase {

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
}
