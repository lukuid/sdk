// SPDX-License-Identifier: Apache-2.0
import XCTest
@testable import LukuIDSDK

/// Every device-signed record binds the firmware that signed it (dotluku "Firmware Binding").
/// The samples are real exports from the test-PKI Environment card and Animal Reader.
final class FirmwareBindingTests: XCTestCase {
    private let samples = ["firmware-bound-environment.luku", "firmware-bound-reader.luku"]
    /// Index of `firmware` in each type's canonical string, and whether it lives in `payload`.
    private let slot: [String: (index: Int, inPayload: Bool)] = [
        "scan": (9, true),
        "environment": (7, true),
        "attachment": (7, false),
        "custody": (7, false),
        "location": (6, false),
    ]

    private func sampleURL(_ name: String) throws -> URL {
        var current = URL(fileURLWithPath: #filePath).deletingLastPathComponent()
        while true {
            let candidate = current.appendingPathComponent("samples/dotluku/test/1.1.0/\(name)")
            if FileManager.default.fileExists(atPath: candidate.path) { return candidate }
            let parent = current.deletingLastPathComponent()
            if parent == current { throw XCTSkip("missing sample \(name)") }
            current = parent
        }
    }

    private func open(_ name: String) throws -> LukuArchive {
        try LukuFile.open(data: Data(contentsOf: sampleURL(name)))
    }

    private func criticalCodes(_ archive: LukuArchive) -> [String] {
        archive.verify(options: LukuVerifyOptions(allowUntrustedRoots: false, skipCertificateTemporalChecks: true, trustProfile: "test"))
            .filter { $0.criticality == .critical }
            .map { $0.code }
    }

    private func firmware(_ record: [String: Any]) -> String? {
        let type = record["type"] as? String ?? ""
        let source = slot[type]?.inPayload == true ? record["payload"] as? [String: Any] ?? [:] : record
        return source["firmware"] as? String
    }

    private func setFirmware(_ record: inout [String: Any], _ value: String?) {
        let type = record["type"] as? String ?? ""
        if slot[type]?.inPayload == true {
            var payload = record["payload"] as? [String: Any] ?? [:]
            payload["firmware"] = value
            record["payload"] = payload
        } else {
            record["firmware"] = value
        }
    }

    private func setSlot(_ record: inout [String: Any], _ value: String?) {
        var parts = (record["canonical_string"] as? String ?? "").components(separatedBy: ":")
        let index = slot[record["type"] as? String ?? ""]!.index
        if let value { parts[index] = value } else { parts.remove(at: index) }
        record["canonical_string"] = parts.joined(separator: ":")
    }

    private func tampered(_ name: String, _ index: Int, _ edit: (inout [String: Any]) -> Void) throws -> [String] {
        let archive = try open(name)
        var record = archive.blocks[0].batch[index]
        edit(&record)
        archive.blocks[0].batch[index] = record
        return criticalCodes(archive)
    }

    func testFirmwareBoundSamplesVerify() throws {
        for name in samples { XCTAssertEqual(criticalCodes(try open(name)), [], name) }
    }

    func testEveryRecordSignsItsFirmwareInThePrefix() throws {
        var seen: [String] = []
        for name in samples {
            for record in try open(name).blocks[0].batch {
                let type = record["type"] as? String ?? ""
                XCTAssertEqual(firmware(record), "v1.0.0", "\(name) \(type)")
                let parts = (record["canonical_string"] as? String ?? "").components(separatedBy: ":")
                XCTAssertEqual(parts[slot[type]!.index], "v1.0.0", "\(name) \(type)")
                seen.append(type)
            }
        }
        XCTAssertEqual(seen.sorted(), ["attachment", "attachment", "custody", "custody", "environment", "location", "location", "scan"])
    }

    func testChangedOrRemovedFirmwareFieldIsACanonicalMismatch() throws {
        for name in samples {
            for index in 0..<4 {
                var codes = try tampered(name, index) { setFirmware(&$0, "v9.9.9") }
                XCTAssertTrue(codes.contains("RECORD_CANONICAL_MISMATCH"), "\(name)[\(index)] \(codes)")
                XCTAssertFalse(codes.contains("RECORD_SIGNATURE_INVALID"), "\(name)[\(index)] \(codes)")
                codes = try tampered(name, index) { setFirmware(&$0, nil) }
                XCTAssertTrue(codes.contains("RECORD_CANONICAL_MISMATCH"), "\(name)[\(index)] removed \(codes)")
            }
        }
    }

    func testFirmwareChangedInTheSignedStringFailsTheSignature() throws {
        for name in samples {
            for index in 0..<4 {
                let codes = try tampered(name, index) { setFirmware(&$0, "v9.9.9"); setSlot(&$0, "v9.9.9") }
                XCTAssertTrue(codes.contains("RECORD_SIGNATURE_INVALID"), "\(name)[\(index)] \(codes)")
                XCTAssertFalse(codes.contains("RECORD_CANONICAL_MISMATCH"), "\(name)[\(index)] \(codes)")
            }
        }
    }

    func testFirmwareBoundRecordCannotPassAsOneFromBeforeTheRule() throws {
        for name in samples {
            for index in 0..<4 {
                if try open(name).blocks[0].batch[index]["type"] as? String == "scan" { continue } // scan has always had the slot
                let codes = try tampered(name, index) { setFirmware(&$0, nil); setSlot(&$0, nil) }
                XCTAssertTrue(codes.contains("RECORD_SIGNATURE_INVALID"), "\(name)[\(index)] \(codes)")
                XCTAssertFalse(codes.contains("RECORD_CANONICAL_MISMATCH"), "\(name)[\(index)] \(codes)")
            }
        }
    }

    func testRecordsFromBeforeFirmwareBindingVerifyWithAWarning() throws {
        let options = LukuVerifyOptions(allowUntrustedRoots: false, skipCertificateTemporalChecks: true, trustProfile: "test")
        let issues = try open("first-passable-verification-sample.luku").verify(options: options)
        XCTAssertFalse(issues.contains { $0.criticality == .critical }, "\(issues)")
        let warned = issues.filter { $0.code == "RECORD_FIRMWARE_MISSING" }
        XCTAssertFalse(warned.isEmpty)
        XCTAssertTrue(warned.allSatisfy { $0.criticality == .warning })
        for name in samples {
            XCTAssertFalse(try open(name).verify(options: options).contains { $0.code == "RECORD_FIRMWARE_MISSING" }, name)
        }
    }
}
