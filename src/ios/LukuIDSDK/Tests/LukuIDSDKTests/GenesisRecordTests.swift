// SPDX-License-Identifier: Apache-2.0
import CryptoKit
import Foundation
import XCTest
@testable import LukuIDSDK

// Genesis record rule: a native record whose previous_signature is the base64 of
// exactly 32 bytes must carry SHA-256 of the device's raw Ed25519 public key,
// and match genesis_hash if present. Independent of the (reissuable) DAC.
final class GenesisRecordTests: XCTestCase {
    private func randomData(_ count: Int) -> Data {
        Data((0..<count).map { _ in UInt8.random(in: 0...255) })
    }

    private lazy var publicKey = randomData(32)
    private lazy var publicKeyB64 = publicKey.base64EncodedString()
    private lazy var keyHash = Data(SHA256.hash(data: publicKey)).base64EncodedString()

    func testAcceptsGenesisAnchoredToPublicKeyWithGenesisHash() {
        XCTAssertNil(genesisRecordIssue(previousSignature: keyHash, genesisHash: keyHash, publicKeyBase64: publicKeyB64, deviceID: "LUK-GENESIS"))
    }

    func testAcceptsGenesisAnchoredToPublicKeyWithoutGenesisHash() {
        XCTAssertNil(genesisRecordIssue(previousSignature: keyHash, genesisHash: "", publicKeyBase64: publicKeyB64, deviceID: "LUK-GENESIS"))
    }

    func testRejects32BytePreviousSignatureNotMatchingPublicKey() {
        let issue = genesisRecordIssue(previousSignature: randomData(32).base64EncodedString(), genesisHash: "", publicKeyBase64: publicKeyB64, deviceID: "LUK-GENESIS")
        XCTAssertEqual(issue?.code, "GENESIS_HASH_MISMATCH")
        XCTAssertTrue(issue?.message.contains("SHA-256 of its public key") ?? false)
    }

    func testRejectsGenesisWithoutValidPublicKey() {
        let issue = genesisRecordIssue(previousSignature: keyHash, genesisHash: keyHash, publicKeyBase64: randomData(31).base64EncodedString(), deviceID: "LUK-GENESIS")
        XCTAssertTrue(issue?.message.contains("public key missing or invalid") ?? false)
    }

    func testRejectsGenesisHashDifferingFromPreviousSignature() {
        let issue = genesisRecordIssue(previousSignature: keyHash, genesisHash: randomData(32).base64EncodedString(), publicKeyBase64: publicKeyB64, deviceID: "LUK-GENESIS")
        XCTAssertTrue(issue?.message.contains("genesis_hash that does not match previous_signature") ?? false)
    }

    func testSixtyFourBytePreviousSignatureIsNotGenesis() {
        XCTAssertNil(genesisRecordIssue(previousSignature: randomData(64).base64EncodedString(), genesisHash: "genesis_fake", publicKeyBase64: publicKeyB64, deviceID: "LUK-GENESIS"))
    }
}
