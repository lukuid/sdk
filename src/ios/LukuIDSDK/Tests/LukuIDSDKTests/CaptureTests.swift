// SPDX-License-Identifier: Apache-2.0
import CryptoKit
import XCTest
@testable import LukuIDSDK

final class CaptureTests: XCTestCase {
    private let key = Curve25519.Signing.PrivateKey()
    private let token = "app-capture-0123456789AB"
    private var publicKey: String { key.publicKey.rawRepresentation.base64EncodedString() }

    private func canonical(_ nonce: String) -> String {
        "AR-TEST-1:\(publicKey):scan:LUKUID-1-2464-999000000000002:2464:1793769018:12000000:animal:\(nonce):v1.0.0:FDX-B:1.0:999000000000002:::prev"
    }

    private func reply(_ nonce: String, signed: String? = nil) throws -> [String: Any] {
        let signature = try key.signature(for: Data((signed ?? canonical(nonce)).utf8))
        let record: [String: Any] = [
            "id": "LUKUID-1-2464-999000000000002",
            "signature": signature,
            "canonical_string": canonical(nonce),
            "payload": ["nonce": nonce, "tag_id": "999000000000002"]
        ]
        return ["full_record": ["record_id": "LUKUID-1-2464-999000000000002", "scan_record": record]]
    }

    func testAcceptsTheSignedRecordWithTheToken() throws {
        let result = try Capture.verifyReply(try reply(token), publicKey: publicKey, token: token)
        XCTAssertEqual(result.type, "scan")
        XCTAssertEqual(result.nonce, token)
        XCTAssertEqual(result.id, "LUKUID-1-2464-999000000000002")
    }

    func testRejectsAWrongTokenAndABadSignature() throws {
        XCTAssertThrowsError(try Capture.verifyReply(try reply("some-other-token-0123"), publicKey: publicKey, token: token)) {
            XCTAssertEqual(($0 as? CaptureError)?.code, "NONCE_MISMATCH")
        }
        XCTAssertThrowsError(try Capture.verifyReply(try reply(token, signed: canonical("tampered-0123456789")), publicKey: publicKey, token: token)) {
            XCTAssertEqual(($0 as? CaptureError)?.code, "RECORD_SIGNATURE_INVALID")
        }
        XCTAssertThrowsError(try Capture.verifyReply(["full_record": [String: Any]()], publicKey: publicKey, token: nil)) {
            XCTAssertEqual(($0 as? CaptureError)?.code, "CAPTURE_INVALID_REPLY")
        }
    }

    func testChallengeTokens() {
        for _ in 0..<20 { XCTAssertTrue(Capture.isValidToken(Capture.createToken())) }
        for bad in ["short-token", String(repeating: "a", count: 32), "abcdefgh:ijklmnop", "abcdefgh ijklmnop"] {
            XCTAssertFalse(Capture.isValidToken(bad), bad)
        }
        XCTAssertTrue(Capture.isValidToken("ABCDEFGHIJKLMNOPQRSTUVWXYZ-_.~+"))
    }
}
