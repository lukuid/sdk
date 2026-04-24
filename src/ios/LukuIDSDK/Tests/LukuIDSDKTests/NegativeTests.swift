// SPDX-License-Identifier: Apache-2.0
import XCTest
@testable import LukuIDSDK

final class NegativeTamperingTests: XCTestCase {
    
    private func samplesDir() -> URL {
        let start = URL(fileURLWithPath: #filePath)
        var current = start.deletingLastPathComponent()
        while true {
            let candidate = current.appendingPathComponent("samples/dotluku/dev/1.0.0")
            if FileManager.default.fileExists(atPath: candidate.path) {
                return candidate
            }
            let parent = current.deletingLastPathComponent()
            if parent == current { break }
            current = parent
        }
        // Fallback to searching upwards from project root if needed
        return start
    }

    func testFailsWhenAttestationSignatureIsTampered() throws {
        let samplePath = samplesDir().appendingPathComponent("first-passable-verification-sample.luku")
        guard FileManager.default.fileExists(atPath: samplePath.path) else { return }
        let data = try Data(contentsOf: samplePath)
        let archive = try LukuFile.open(data: data)
        
        // Tamper with attestation signature in the first block's first record
        if var record = archive.blocks[0].batch.first,
           let sig = record["signature"] as? String {
            var newSig = sig.replacingOccurrences(of: "A", with: "B")
            if newSig == sig {
                newSig = sig.replacingOccurrences(of: "B", with: "A")
            }
            if newSig == sig {
                newSig = sig + "X"
            }
            record["signature"] = newSig
            archive.blocks[0].batch[0] = record
        }
        
        let issues = archive.verify(options: LukuVerifyOptions(allowUntrustedRoots: false, trustProfile: "dev"))
        XCTAssertTrue(issues.contains { $0.code == "RECORD_SIGNATURE_INVALID" || $0.code == "ATTESTATION_FAILED" })
    }

    func testFailsWhenAttestationDACCertIsTampered() throws {
        let samplePath = samplesDir().appendingPathComponent("first-passable-verification-sample.luku")
        guard FileManager.default.fileExists(atPath: samplePath.path) else { return }
        let data = try Data(contentsOf: samplePath)
        let archive = try LukuFile.open(data: data)
        
        // Tamper with DAC cert. Since this sample has record-level identity, we tamper with the record-level one too.
        if var record = archive.blocks[0].batch.first,
           var identity = record["identity"] as? [String: Any],
           let dac = identity["dac_der"] as? String {
            identity["dac_der"] = dac.replacingOccurrences(of: "M", with: "N")
            record["identity"] = identity
            archive.blocks[0].batch[0] = record
        }
        
        // Also tamper block level for good measure
        if let dac = archive.blocks[0].attestationDacDer {
            archive.blocks[0].attestationDacDer = dac.replacingOccurrences(of: "M", with: "N")
        }
        
        let issues = archive.verify(options: LukuVerifyOptions(allowUntrustedRoots: false, trustProfile: "dev"))
        XCTAssertTrue(issues.contains { $0.code == "ATTESTATION_FAILED" })
    }

    func testFailsWhenBlocksHashIsTampered() throws {
        let samplePath = samplesDir().appendingPathComponent("first-passable-verification-sample.luku")
        guard FileManager.default.fileExists(atPath: samplePath.path) else { return }
        let data = try Data(contentsOf: samplePath)
        let archive = try LukuFile.open(data: data)
        
        // Tamper with blocks_hash in manifest
        archive.manifest.blocksHash = String(repeating: "0", count: 64)
        
        let issues = archive.verify(options: LukuVerifyOptions())
        XCTAssertTrue(issues.contains { $0.code == "BLOCKS_HASH_MISMATCH" })
    }

    func testFailsWhenRootFingerprintIsTampered() throws {
        let samplePath = samplesDir().appendingPathComponent("first-passable-verification-sample.luku")
        guard FileManager.default.fileExists(atPath: samplePath.path) else { return }
        let data = try Data(contentsOf: samplePath)
        let archive = try LukuFile.open(data: data)
        
        // Tamper with root fingerprint
        if let fp = archive.blocks[0].attestationRootFingerprint {
            let index = fp.index(fp.startIndex, offsetBy: 10)
            let replacement = fp[index] == "a" ? "b" : "a"
            archive.blocks[0].attestationRootFingerprint = String(fp.prefix(10) + String(replacement) + fp.dropFirst(11))
        }
        
        let issues = archive.verify(options: LukuVerifyOptions(allowUntrustedRoots: false, trustProfile: "dev"))
        XCTAssertTrue(issues.contains { $0.code == "ATTESTATION_FAILED" || $0.code == "BLOCK_HASH_INVALID" })
    }

    func testFailsWithTamperedChain() throws {
        let samplePath = samplesDir().appendingPathComponent("chain-tampered.luku")
        guard FileManager.default.fileExists(atPath: samplePath.path) else { return }
        let data = try Data(contentsOf: samplePath)
        let archive = try LukuFile.open(data: data)
        
        let issues = archive.verify(options: LukuVerifyOptions(allowUntrustedRoots: false, trustProfile: "dev"))
        XCTAssertTrue(issues.contains { $0.code == "ATTESTATION_FAILED" || $0.code == "BLOCKS_HASH_MISMATCH" })
    }
}
