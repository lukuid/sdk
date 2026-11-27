// SPDX-License-Identifier: Apache-2.0
import XCTest
@testable import LukuIDSDK

/// Firmware `info` carries no certificate DER: the SDK must fetch each one with
/// `get_certificate` (and chains with `get_chain`) before attestation can verify.
final class CertificateCommandTests: XCTestCase {

    private func decodeRequest(_ frame: Data) throws -> LukuIDCommandRequest {
        try LukuIDCommandRequest(serializedBytes: frame.subdata(in: 12..<(frame.count - 8)))
    }

    private func framePayload(_ payload: Data) -> Data {
        let magic = Data([0x4C, 0x55, 0x4B, 0x55, 0x49, 0x44, 0x01, 0x7E])
        var framed = Data()
        framed.append(magic)
        var length = UInt32(payload.count).littleEndian
        withUnsafeBytes(of: &length) { framed.append(contentsOf: $0) }
        framed.append(payload)
        framed.append(magic)
        return framed
    }

    private func decodeResponse(_ response: LukuIDCommandResponse) throws -> [String: Any] {
        var messages: [[String: Any]] = []
        let codec = LukuCodec(
            onMessage: { messages.append($0) },
            onError: { error in XCTFail("Unexpected codec error: \(error)") }
        )
        codec.feed(framePayload(try response.serializedData()))
        XCTAssertEqual(messages.count, 1)
        return messages.first ?? [:]
    }

    func testEncodesGetCertificateName() throws {
        let frame = try LukuCodec.encode([
            "action": "get_certificate",
            "id": "req-1",
            "opts": ["name": "attestation_dac"]
        ])
        let request = try decodeRequest(frame)
        XCTAssertEqual(request.action, "get_certificate")
        XCTAssertEqual(request.getCertificate.name, "attestation_dac")
    }

    func testEncodesGetChainRef() throws {
        let frame = try LukuCodec.encode([
            "action": "get_chain",
            "id": "req-2",
            "opts": ["ref": "CHAIN-1"]
        ])
        let request = try decodeRequest(frame)
        XCTAssertEqual(request.getChain.ref, "CHAIN-1")
    }

    func testDecodesCertificateDer() throws {
        var response = LukuIDCommandResponse()
        response.action = "get_certificate"
        response.status = .ok
        response.success = true
        var cert = LukuIDGetCertificateResponse()
        cert.der = Data([0x30, 0x82, 0x01, 0x0A])
        response.certificateResponse = cert

        let decoded = try decodeResponse(response)
        XCTAssertEqual(decoded["der"] as? Data, Data([0x30, 0x82, 0x01, 0x0A]))
    }

    func testDecodesInfoNetworkParticipation() throws {
        var info = LukuIDDeviceInfoResponse()
        info.id = "A0403F98"
        info.product = "environment"
        info.networkParticipationEnabled = true
        var response = LukuIDCommandResponse()
        response.action = "info"
        response.status = .ok
        response.success = true
        response.deviceInfo = info

        let decoded = try decodeResponse(response)
        XCTAssertEqual(decoded["product"] as? String, "environment")
        XCTAssertEqual(decoded["network_participation_enabled"] as? Bool, true)
    }
}
