// SPDX-License-Identifier: Apache-2.0
import Foundation
import XCTest
@testable import LukuIDSDK

final class ArchiveSealsTests: XCTestCase {
    func testSelfSealVerifiesAndCorruptionFails() throws {
        let manifest = Data("{\"type\":\"LukuArchive\"}".utf8)
        let raw = try ArchiveSeals.create(manifest: manifest, timestamp: 1_791_051_600)
        XCTAssertTrue(ArchiveSeals.verify(raw: raw, manifest: manifest).isEmpty)
        var root = try XCTUnwrap(JSONSerialization.jsonObject(with: Data(raw.utf8)) as? [String: Any])
        var seals = try XCTUnwrap(root["seals"] as? [[String: Any]])
        seals[0]["signature"] = "AA=="
        root["seals"] = seals
        let corrupted = try JSONSerialization.data(withJSONObject: root)
        XCTAssertTrue(ArchiveSeals.verify(raw: String(decoding: corrupted, as: UTF8.self), manifest: manifest)
            .contains { $0.code == "ARCHIVE_SELF_SEAL_INVALID" })
        XCTAssertTrue(ArchiveSeals.verify(raw: nil, manifest: manifest)
            .contains { $0.code == "ARCHIVE_SEALS_MISSING" })
    }

    func testSharedSelfOnlyFixtureVerifies() throws {
        let fixture = URL(fileURLWithPath: #filePath).deletingLastPathComponent()
            .appendingPathComponent("../../../../../samples/dotluku/sealed-self-only.luku").standardizedFileURL
        let archive = try LukuFile.open(data: Data(contentsOf: fixture))
        XCTAssertFalse(archive.verify().contains { $0.code.hasPrefix("ARCHIVE_") })
    }

    func testUnsupportedAndMalformedPlatformSeals() throws {
        let manifest = Data("{}".utf8)
        let raw = try ArchiveSeals.create(manifest: manifest, timestamp: 1_791_051_600)
        var root = try XCTUnwrap(JSONSerialization.jsonObject(with: Data(raw.utf8)) as? [String: Any])
        var seals = try XCTUnwrap(root["seals"] as? [[String: Any]])
        seals.append(["type": "platform", "platform": "future-platform", "alg": "ES256",
                      "created_at_utc": 1_791_051_600, "public_key": "AA==", "signature": "AA=="])
        root["seals"] = seals
        let unsupported = try JSONSerialization.data(withJSONObject: root)
        XCTAssertTrue(ArchiveSeals.verify(raw: String(decoding: unsupported, as: UTF8.self), manifest: manifest)
            .contains { $0.code == "ARCHIVE_PLATFORM_SEAL_UNSUPPORTED" })
        seals[1]["platform"] = "android"
        root["seals"] = seals
        let malformed = try JSONSerialization.data(withJSONObject: root)
        XCTAssertTrue(ArchiveSeals.verify(raw: String(decoding: malformed, as: UTF8.self), manifest: manifest)
            .contains { $0.code == "ARCHIVE_SEALS_MALFORMED" })
    }
}
