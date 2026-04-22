// SPDX-License-Identifier: Apache-2.0
import XCTest
@testable import LukuIDSDK

final class LukuCodecTests: XCTestCase {

    func testIgnoresEchoedInfoRequestAndDecodesSplitInfoResponse() throws {
        var messages: [[String: Any]] = []
        let codec = LukuCodec(
            onMessage: { messages.append($0) },
            onError: { error in XCTFail("Unexpected codec error: \(error)") }
        )

        let echoedRequest = try LukuCodec.encode([
            "action": "info",
            "id": "probe",
            "opts": [:]
        ])

        var info = LukuIDDeviceInfoResponse()
        info.id = "B784AE14"
        info.product = "guardcard"
        info.model = "LUKUID-GUARDCARD-V1"
        info.firmware = "v1.0.0"
        info.key = Data(base64Encoded: "t4SuFBxXUx2rMw4uYlwcPuAoXJB/NuNSQF1lTLrbVRg=")!

        var response = LukuIDCommandResponse()
        response.action = "info"
        response.status = .ok
        response.success = true
        response.deviceInfo = info

        let responseFrame = framePayload(try response.serializedData())
        let stream = echoedRequest + responseFrame

        var offset = 0
        while offset < stream.count {
            let end = min(offset + 64, stream.count)
            codec.feed(stream.subdata(in: offset..<end))
            offset = end
        }

        XCTAssertEqual(messages.count, 1)
        XCTAssertEqual(messages.first?["action"] as? String, "info")
        XCTAssertEqual(messages.first?["id"] as? String, "B784AE14")
        XCTAssertEqual((messages.first?["key"] as? Data)?.base64EncodedString(), "t4SuFBxXUx2rMw4uYlwcPuAoXJB/NuNSQF1lTLrbVRg=")
        XCTAssertEqual(messages.first?["ok"] as? Bool, true)
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
}
