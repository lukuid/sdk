// SPDX-License-Identifier: Apache-2.0
import XCTest
@testable import LukuIDSDK

/// Streamed replies number every frame (`frame_seq` 1, 2, 3...); a lost frame shows up
/// as a gap and fails the command instead of returning an incomplete reply.
final class FrameSequenceTests: XCTestCase {
    private func run(_ frames: [Int?]) -> String? {
        var seq = FrameSequence()
        for f in frames {
            if let err = seq.accept(f) { return err }
        }
        return nil
    }

    func testContiguousSequenceIsAccepted() {
        XCTAssertNil(run([1, 2, 3, 4]))
    }

    func testLostMiddleFrameFails() {
        XCTAssertTrue(run([1, 3, 4])?.hasPrefix("FRAME_SEQUENCE_GAP") == true)
    }

    func testLostFirstFrameFails() {
        XCTAssertTrue(run([2, 3])?.hasPrefix("FRAME_SEQUENCE_GAP") == true)
    }

    func testLostLastDataFrameBeforeCloseFails() {
        XCTAssertTrue(run([1, 2, 4])?.hasPrefix("FRAME_SEQUENCE_GAP") == true)
    }

    func testUnnumberedFrameAfterNumberedFails() {
        XCTAssertTrue(run([1, nil])?.hasPrefix("FRAME_SEQUENCE_GAP") == true)
    }

    func testLegacyUnnumberedFramesAreAccepted() {
        XCTAssertNil(run([nil, nil, nil]))
    }

    func testCodecDecodesFrameSeq() throws {
        var response = LukuIDCommandResponse()
        response.action = "fetch"
        response.status = .ok
        response.success = true
        response.hasMore_p = true
        response.frameSeq = 7
        let payload = try response.serializedData()
        let magic = Data([0x4C, 0x55, 0x4B, 0x55, 0x49, 0x44, 0x01, 0x7E])
        var length = UInt32(payload.count).littleEndian
        var framed = Data()
        framed.append(magic)
        withUnsafeBytes(of: &length) { framed.append(contentsOf: $0) }
        framed.append(payload)
        framed.append(magic)

        var messages: [[String: Any]] = []
        let codec = LukuCodec(onMessage: { messages.append($0) }, onError: { XCTFail("codec error: \($0)") })
        codec.feed(framed)
        XCTAssertEqual(messages.count, 1)
        XCTAssertEqual(messages.first?["frame_seq"] as? Int, 7)
        XCTAssertEqual(messages.first?["has_more"] as? Bool, true)
    }
}
