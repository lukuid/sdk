// SPDX-License-Identifier: Apache-2.0
import CryptoKit
import Foundation
import XCTest
@testable import LukuIDSDK

// Genesis record rule: a native record whose previous_signature is the base64 of
// exactly 32 bytes must carry SHA-256(DAC DER), and match genesis_hash if present.
final class GenesisRecordTests: XCTestCase {
    private func randomData(_ count: Int) -> Data {
        Data((0..<count).map { _ in UInt8.random(in: 0...255) })
    }

    private lazy var dac = randomData(300)
    private lazy var dacB64 = dac.base64EncodedString()
    private lazy var dacHash = Data(SHA256.hash(data: dac)).base64EncodedString()

    func testAcceptsGenesisAnchoredToDacWithGenesisHash() {
        XCTAssertNil(genesisRecordIssue(previousSignature: dacHash, genesisHash: dacHash, dacDerBase64: dacB64, deviceID: "LUK-GENESIS"))
    }

    func testAcceptsGenesisAnchoredToDacWithoutGenesisHash() {
        XCTAssertNil(genesisRecordIssue(previousSignature: dacHash, genesisHash: "", dacDerBase64: dacB64, deviceID: "LUK-GENESIS"))
    }

    func testRejects32BytePreviousSignatureNotMatchingDac() {
        let issue = genesisRecordIssue(previousSignature: randomData(32).base64EncodedString(), genesisHash: "", dacDerBase64: dacB64, deviceID: "LUK-GENESIS")
        XCTAssertEqual(issue?.code, "GENESIS_HASH_MISMATCH")
        XCTAssertTrue(issue?.message.contains("SHA-256 of its DAC") ?? false)
    }

    func testRejectsGenesisWithoutDac() {
        let issue = genesisRecordIssue(previousSignature: dacHash, genesisHash: dacHash, dacDerBase64: nil, deviceID: "LUK-GENESIS")
        XCTAssertTrue(issue?.message.contains("DAC certificate missing") ?? false)
    }

    func testRejectsGenesisHashDifferingFromPreviousSignature() {
        let issue = genesisRecordIssue(previousSignature: dacHash, genesisHash: randomData(32).base64EncodedString(), dacDerBase64: dacB64, deviceID: "LUK-GENESIS")
        XCTAssertTrue(issue?.message.contains("genesis_hash that does not match previous_signature") ?? false)
    }

    func testSixtyFourBytePreviousSignatureIsNotGenesis() {
        XCTAssertNil(genesisRecordIssue(previousSignature: randomData(64).base64EncodedString(), genesisHash: "genesis_fake", dacDerBase64: dacB64, deviceID: "LUK-GENESIS"))
    }
}
