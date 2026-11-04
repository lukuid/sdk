// SPDX-License-Identifier: Apache-2.0
import CryptoKit
import Foundation
import XCTest
import ZIPFoundation
@testable import LukuIDSDK

final class LukuArchiveTests: XCTestCase {
    private struct TestSigner {
        let privateKey: Curve25519.Signing.PrivateKey
        let publicKeyBase64: String
    }

    private func createTestSigner() -> TestSigner {
        let privateKey = Curve25519.Signing.PrivateKey()
        let publicKeyBase64 = Data(privateKey.publicKey.rawRepresentation).base64EncodedString()
        return TestSigner(privateKey: privateKey, publicKeyBase64: publicKeyBase64)
    }

    private func signCanonical(_ privateKey: Curve25519.Signing.PrivateKey, canonical: String) throws -> String {
        try Data(privateKey.signature(for: Data(canonical.utf8))).base64EncodedString()
    }

    private func testOptions() -> LukuVerifyOptions {
        LukuVerifyOptions(
            allowUntrustedRoots: true,
            skipCertificateTemporalChecks: true,
            trustedExternalFingerprints: [],
            trustProfile: "dev"
        )
    }

    private func currentSampleOptions(allowUntrustedRoots: Bool = true, trustProfile: String = "test") -> LukuVerifyOptions {
        LukuVerifyOptions(
            allowUntrustedRoots: allowUntrustedRoots,
            skipCertificateTemporalChecks: true,
            trustedExternalFingerprints: [],
            trustProfile: trustProfile
        )
    }

    /// Signs the record over the canonical string recomputed from its own fields (LUKU.md Field Order rule).
    private func signInPlace(_ signer: TestSigner, _ record: inout [String: Any], deviceID: String) throws -> String {
        let canonical = try XCTUnwrap(LukuFile.recomputeRecordCanonicalString(record, deviceID: deviceID, publicKey: signer.publicKeyBase64))
        let signature = try signCanonical(signer.privateKey, canonical: canonical)
        record["canonical_string"] = canonical
        record["signature"] = signature
        return signature
    }

    private func animalScan(_ id: String, deviceID: String, publicKey: String, ctr: Int, timestamp: Int, previous: String) -> [String: Any] {
        var payload: [String: Any] = [
            "ctr": ctr, "timestamp_utc": timestamp, "uptime_us": 1000000, "profile": "animal", "firmware": "v1.0.0",
            "protocol": "FDX-B", "scan_version": "1.0", "tag_id": "999000000000001"
        ]
        if previous == "genesis_fake" { payload["genesis_hash"] = "genesis_fake" }
        return ["type": "scan", "vendor": "LUKUID", "id": id, "device_id": deviceID, "public_key": publicKey, "previous_signature": previous, "payload": payload]
    }

    /// Current-format real exports under the test PKI (samples/dotluku/test/1.1.0/README.md).
    private func currentSampleURL(_ name: String) -> URL {
        var current = URL(fileURLWithPath: #filePath).deletingLastPathComponent()
        while true {
            let candidate = current.appendingPathComponent("samples/dotluku/test/1.1.0/\(name)")
            if FileManager.default.fileExists(atPath: candidate.path) { return candidate }
            let parent = current.deletingLastPathComponent()
            if parent.path == current.path { break }
            current = parent
        }
        return URL(fileURLWithPath: #filePath).deletingLastPathComponent().appendingPathComponent("samples/dotluku/test/1.1.0/\(name)")
    }

    private func createValidExport(deviceID: String) throws -> (archive: LukuArchive, signer: TestSigner) {
        let signer = createTestSigner()
        let identity = LukuDeviceIdentity(deviceID: deviceID, publicKey: signer.publicKeyBase64, vendor: "LUKUID")

        var records: [[String: Any]] = []
        var previous = "genesis_fake"
        for (index, timestamp) in [1000, 1005, 1010].enumerated() {
            var record = animalScan("SCAN-VALID-\(index + 1)", deviceID: deviceID, publicKey: signer.publicKeyBase64, ctr: index + 1, timestamp: timestamp, previous: previous)
            previous = try signInPlace(signer, &record, deviceID: deviceID)
            records.append(record)
        }

        let exported = try LukuFile.exportWithIdentity(records: records, device: identity, attachments: [:], signer: LukuSigner(privateKey: signer.privateKey, publicKeyBase64: signer.publicKeyBase64))
        let reopened = try LukuFile.open(data: exported.saveToData())
        return (reopened, signer)
    }

    private func hasIssue(_ issues: [VerificationIssue], _ codes: String...) -> Bool {
        issues.contains { codes.contains($0.code) }
    }

    private func criticalIssues(_ issues: [VerificationIssue]) -> [VerificationIssue] {
        issues.filter { $0.criticality == .critical }
    }

    private func sampleURL(_ name: String) -> URL {
        let start = URL(fileURLWithPath: #filePath)
        var current = start.deletingLastPathComponent()

        while true {
            for version in ["1.0.0", "1.0"] {
                let candidate = current.appendingPathComponent("samples/dotluku/dev/\(version)/\(name)")
                if FileManager.default.fileExists(atPath: candidate.path) {
                    return candidate
                }
            }

            let parent = current.deletingLastPathComponent()
            if parent.path == current.path {
                break
            }
            current = parent
        }

        return start.deletingLastPathComponent().appendingPathComponent("samples/dotluku/dev/1.0.0/\(name)")
    }

    private func externalIdentityFixture() throws -> [String: Any] {
        let start = URL(fileURLWithPath: #filePath)
        var current = start.deletingLastPathComponent()

        while true {
            let candidate = current.appendingPathComponent("samples/external_identity/dev/self_signed_ed25519.json")
            if FileManager.default.fileExists(atPath: candidate.path) {
                let data = try Data(contentsOf: candidate)
                return try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
            }

            let parent = current.deletingLastPathComponent()
            if parent.path == current.path {
                break
            }
            current = parent
        }

        throw NSError(domain: "lukuid-tests", code: -1, userInfo: [NSLocalizedDescriptionKey: "Missing external identity fixture"])
    }

    func testExportsAndReopensArchives() throws {
        let signer = createTestSigner()
        let identity = LukuDeviceIdentity(deviceID: "LUK-TEST", publicKey: signer.publicKeyBase64, vendor: "LUKUID")
        let canonical = "can1"

        let exported = try LukuFile.export(
            records: [[
                "type": "scan",
                "signature": try signCanonical(signer.privateKey, canonical: canonical),
                "previous_signature": "genesis_fake",
                "canonical_string": canonical,
                "payload": [
                    "ctr": 1,
                    "timestamp_utc": 1000
                ]
            ]],
            device: identity,
            attachments: [:],
            signer: LukuSigner(privateKey: signer.privateKey, publicKeyBase64: signer.publicKeyBase64)
        )

        let reopened = try LukuFile.open(data: exported.saveToData())
        XCTAssertEqual(reopened.manifest.version, "1.0.0")
        XCTAssertEqual(reopened.blocks.count, 1)
        XCTAssertEqual(reopened.blocks[0].batch.count, 1)
    }

    func testPreservesTemporalContinuityManifestMetadata() throws {
        let signer = createTestSigner()
        let identity = LukuDeviceIdentity(deviceID: "LUK-META", publicKey: signer.publicKeyBase64, vendor: "LUKUID")
        let canonical = "manifest-extra-scan"

        let block = try LukuFile.buildBlockFromRecords(
            blockID: 0,
            timestampUTC: 1000,
            previousBlockHash: nil,
            defaultDevice: identity,
            batch: [[
                "type": "scan",
                "signature": try signCanonical(signer.privateKey, canonical: canonical),
                "previous_signature": "genesis_fake",
                "canonical_string": canonical,
                "payload": [
                    "ctr": 1,
                    "timestamp_utc": 1000,
                    "genesis_hash": "genesis_fake"
                ]
            ]],
            commonCerts: nil
        )

        let exported = try LukuFile.exportBlocksWithManifest(
            blocks: [block],
            attachments: [:],
            description: "Manifest extra parity",
            manifestExtra: [
                "native_continuity_gap_seconds": 600,
                "lukuid_block_reasons": [[
                    "block_id": 0,
                    "code": "archive_start",
                    "label": "Block start",
                    "detail_code": NSNull(),
                    "detail_label": NSNull()
                ]]
            ],
            signer: LukuSigner(privateKey: signer.privateKey, publicKeyBase64: signer.publicKeyBase64)
        )

        let reopened = try LukuFile.open(data: exported.saveToData())
        XCTAssertEqual(reopened.manifest.nativeContinuityGapSeconds, 600)
        let reasons = reopened.manifest.extra["lukuid_block_reasons"] as? [[String: Any]]
        XCTAssertEqual(reasons?.count, 1)
        XCTAssertEqual(reasons?.first?["code"] as? String, "archive_start")
        XCTAssertEqual(reasons?.first?["label"] as? String, "Block start")
    }

    func testBuildsBlockFallbackCertFields() throws {
        let identity = LukuDeviceIdentity(deviceID: "LUK-TEST", publicKey: Data(repeating: 0, count: 32).base64EncodedString(), vendor: "LUKUID")
        let block = try LukuFile.buildBlockFromRecords(
            blockID: 0,
            timestampUTC: 1000,
            previousBlockHash: nil,
            defaultDevice: identity,
            batch: [[
                "type": "scan",
                "signature": "sig1",
                "canonical_string": "can1",
                "payload": [
                    "ctr": 1,
                    "timestamp_utc": 1000
                ]
            ]],
            commonCerts: [
                "dac_der": "mock_dac_der",
                "attestation_root_fingerprint": "mock_fingerprint"
            ]
        )

        XCTAssertEqual(block.attestationDacDer, "mock_dac_der")
        XCTAssertEqual(block.attestationRootFingerprint, "mock_fingerprint")
    }

    func testVerifiesAValidArchive() throws {
        let archive = try createValidExport(deviceID: "LUK-VALID").archive
        XCTAssertTrue(criticalIssues(archive.verify(options: testOptions())).isEmpty)
    }

    func testEnforcesRequestedNativeContinuityChecks() throws {
        let signer = createTestSigner()
        let archive = try LukuFile.exportWithIdentity(
            records: [
                [
                    "type": "environment",
                    "signature": try signCanonical(signer.privateKey, canonical: "env-1"),
                    "previous_signature": "genesis_fake",
                    "canonical_string": "env-1",
                    "payload": [
                        "ctr": 1,
                        "timestamp_utc": 1000,
                        "genesis_hash": "genesis_fake"
                    ]
                ],
                [
                    "type": "environment",
                    "signature": try signCanonical(signer.privateKey, canonical: "env-2"),
                    "previous_signature": try signCanonical(signer.privateKey, canonical: "env-1"),
                    "canonical_string": "env-2",
                    "payload": [
                        "ctr": 2,
                        "timestamp_utc": 2000,
                        "genesis_hash": "genesis_fake"
                    ]
                ]
            ],
            device: LukuDeviceIdentity(deviceID: "LUK-CONT", publicKey: signer.publicKeyBase64, vendor: "LUKUID"),
            attachments: [:],
            signer: LukuSigner(privateKey: signer.privateKey, publicKeyBase64: signer.publicKeyBase64),
            options: LukuExportOptions(policy: LukuPolicy(name: "environment", nativeContinuityGapSeconds: 600))
        )

        let issues = archive.verify(options: LukuVerifyOptions(
            allowUntrustedRoots: true,
            skipCertificateTemporalChecks: true,
            trustedExternalFingerprints: [],
            trustProfile: "dev",
            policy: nil,
            requireContinuity: true
        ))
        XCTAssertTrue(hasIssue(issues, "CONTINUITY_GAP_EXCEEDED"))
    }

    func testRejectsUntrustedExternalIdentityEndorsements() throws {
        let fixture = try externalIdentityFixture()
        let signer = createTestSigner()
        let checksum = try XCTUnwrap(fixture["checksum"] as? String)
        let archive = try LukuFile.exportWithIdentity(
            records: [[
                "type": "attachment",
                "id": "ATT-EXT-1",
                "signature": try signCanonical(signer.privateKey, canonical: "attachment-ext"),
                "previous_signature": "",
                "canonical_string": "attachment-ext",
                "checksum": checksum,
                "external_identity": [
                    "endorser_id": fixture["endorser_id"] as? String ?? "",
                    "root_fingerprint": fixture["root_fingerprint"] as? String ?? "",
                    "cert_chain_der": fixture["cert_chain_der"] as? [String] ?? [],
                    "signature": fixture["signature"] as? String ?? ""
                ]
            ]],
            device: LukuDeviceIdentity(deviceID: "LUK-EXT", publicKey: signer.publicKeyBase64, vendor: "LUKUID"),
            attachments: [checksum: Data((fixture["attachment_utf8"] as? String ?? "").utf8)],
            signer: LukuSigner(privateKey: signer.privateKey, publicKeyBase64: signer.publicKeyBase64)
        )

        let trusted = archive.verify(options: LukuVerifyOptions(
            allowUntrustedRoots: true,
            skipCertificateTemporalChecks: true,
            trustedExternalFingerprints: [fixture["root_fingerprint"] as? String ?? ""],
            trustProfile: "dev"
        ))
        XCTAssertFalse(hasIssue(trusted, "EXTERNAL_IDENTITY_VERIFICATION_FAILED"))

        let untrusted = archive.verify(options: testOptions())
        XCTAssertTrue(hasIssue(untrusted, "EXTERNAL_IDENTITY_VERIFICATION_FAILED"))
    }

    func testDetectsRecordDeletion() throws {
        let archive = try createValidExport(deviceID: "LUK-DEL").archive
        archive.blocks[0].batch.remove(at: 1)
        XCTAssertTrue(hasIssue(archive.verify(options: testOptions()), "RECORD_CHAIN_BROKEN"))
    }

    func testDetectsRecordInjection() throws {
        let archive = try createValidExport(deviceID: "LUK-INJ").archive
        archive.blocks[0].batch.insert([
            "type": "scan",
            "signature": "fake_sig",
            "previous_signature": "doesnt_matter",
            "payload": [
                "ctr": 2,
                "timestamp_utc": 1002
            ]
        ], at: 1)
        XCTAssertTrue(hasIssue(archive.verify(options: testOptions()), "RECORD_CHAIN_BROKEN", "RECORD_SIGNATURE_INVALID"))
    }

    func testDetectsTimeRegression() throws {
        let archive = try createValidExport(deviceID: "LUK-TIME").archive
        var record = archive.blocks[0].batch[1]
        var payload = record["payload"] as? [String: Any] ?? [:]
        payload["timestamp_utc"] = 999
        record["payload"] = payload
        archive.blocks[0].batch[1] = record
        XCTAssertTrue(hasIssue(archive.verify(options: testOptions()), "TIME_REGRESSION"))
    }

    func testDetectsCounterRegression() throws {
        let archive = try createValidExport(deviceID: "LUK-CTR").archive
        var record = archive.blocks[0].batch[1]
        var payload = record["payload"] as? [String: Any] ?? [:]
        payload["ctr"] = 1
        record["payload"] = payload
        archive.blocks[0].batch[1] = record
        XCTAssertTrue(hasIssue(archive.verify(options: testOptions()), "COUNTER_REGRESSION"))
    }

    func testDetectsExportTampering() throws {
        let archive = try createValidExport(deviceID: "LUK-EXP").archive
        archive.blocks[0].blockID = 999
        let tampered = try LukuFile.open(data: archive.saveToData())
        XCTAssertTrue(hasIssue(tampered.verify(options: testOptions()), "BLOCKS_HASH_MISMATCH"))
    }

    func testDetectsAttachmentCorruption() throws {
        let archive = try createValidExport(deviceID: "LUK-ATT").archive
        let checksum = archive.addAttachment(Data("valid_data".utf8))
        archive.blocks[0].batch.append([
            "type": "attachment",
            "checksum": checksum,
            "payload": ["ctr": 3]
        ])
        archive.attachments[checksum] = Data("tampered_data".utf8)
        XCTAssertTrue(hasIssue(archive.verify(options: testOptions()), "ATTACHMENT_CORRUPT"))
    }

    func testKeepsAttestedAttachmentsOutOfTheNativeChain() throws {
        let signer = createTestSigner()
        let deviceID = "LUK-ATTEST"
        let attachment = Data("desktop-added-attachment".utf8)
        let checksum = SHA256.hash(data: attachment).map { String(format: "%02x", $0) }.joined()
        let pk = signer.publicKeyBase64
        var scan = animalScan("SCAN-ATTEST-1", deviceID: deviceID, publicKey: pk, ctr: 1, timestamp: 1000, previous: "genesis_fake")
        let scanSig = try signInPlace(signer, &scan, deviceID: deviceID)
        var attachmentRecord: [String: Any] = [
            "type": "attachment", "vendor": "LUKUID", "id": "ATT-ATTEST-1", "parent_record_id": "SCAN-ATTEST-1", "parent_id": "SCAN-ATTEST-1",
            "device_id": deviceID, "public_key": pk, "parent_signature": scanSig, "timestamp_utc": 1001,
            "checksum": checksum, "mime": "text/plain", "title": "Desktop Note"
        ]
        _ = try signInPlace(signer, &attachmentRecord, deviceID: deviceID)
        var environment: [String: Any] = [
            "type": "environment", "vendor": "LUKUID", "id": "ENV-ATTEST-1", "device_id": deviceID, "public_key": pk,
            "previous_signature": scanSig, "payload": ["ctr": 2, "timestamp_utc": 1002]
        ]
        _ = try signInPlace(signer, &environment, deviceID: deviceID)

        let block = try LukuFile.buildBlockFromRecords(
            blockID: 0,
            timestampUTC: 1003,
            previousBlockHash: nil,
            defaultDevice: LukuDeviceIdentity(deviceID: deviceID, publicKey: pk, vendor: "LUKUID"),
            batch: [scan, attachmentRecord, environment],
            commonCerts: nil
        )

        let exported = try LukuFile.exportBlocksWithManifest(
            blocks: [block],
            attachments: [checksum: attachment],
            description: "Attested attachment export",
            manifestExtra: [:],
            signer: LukuSigner(privateKey: signer.privateKey, publicKeyBase64: signer.publicKeyBase64)
        )
        let reopened = try LukuFile.open(data: exported.saveToData())
        let issues = reopened.verify(options: testOptions())
        XCTAssertTrue(criticalIssues(issues).isEmpty)
        XCTAssertFalse(hasIssue(issues, "RECORD_CHAIN_BROKEN"))
    }

    func testKeepsAttestedCustodyRecordsOutOfTheNativeChain() throws {
        let signer = createTestSigner()
        let deviceID = "LUK-CUSTODY"
        let pk = signer.publicKeyBase64
        var scan = animalScan("SCAN-CUSTODY-1", deviceID: deviceID, publicKey: pk, ctr: 1, timestamp: 1000, previous: "genesis_fake")
        let scanSig = try signInPlace(signer, &scan, deviceID: deviceID)
        var custody: [String: Any] = [
            "type": "custody", "vendor": "LUKUID", "id": "CUSTODY-1", "parent_record_id": "SCAN-CUSTODY-1", "parent_id": "SCAN-CUSTODY-1",
            "device_id": deviceID, "public_key": pk, "parent_signature": scanSig, "timestamp_utc": 1001,
            "payload": ["event": "handoff", "status": "received", "context_ref": "shipment-123"]
        ]
        _ = try signInPlace(signer, &custody, deviceID: deviceID)
        var environment: [String: Any] = [
            "type": "environment", "vendor": "LUKUID", "id": "ENV-CUSTODY-1", "device_id": deviceID, "public_key": pk,
            "previous_signature": scanSig, "payload": ["ctr": 2, "timestamp_utc": 1002]
        ]
        _ = try signInPlace(signer, &environment, deviceID: deviceID)

        let block = try LukuFile.buildBlockFromRecords(
            blockID: 0,
            timestampUTC: 1003,
            previousBlockHash: nil,
            defaultDevice: LukuDeviceIdentity(deviceID: deviceID, publicKey: pk, vendor: "LUKUID"),
            batch: [scan, custody, environment],
            commonCerts: nil
        )

        let exported = try LukuFile.exportBlocksWithManifest(
            blocks: [block],
            attachments: [:],
            description: "Attested custody export",
            manifestExtra: [:],
            signer: LukuSigner(privateKey: signer.privateKey, publicKeyBase64: signer.publicKeyBase64)
        )
        let reopened = try LukuFile.open(data: exported.saveToData())
        let issues = reopened.verify(options: testOptions())
        XCTAssertTrue(criticalIssues(issues).isEmpty)
        XCTAssertFalse(hasIssue(issues, "RECORD_CHAIN_BROKEN"))
    }

    func testFailsStrictAttestationWhenTheChainIsFake() throws {
        let archive = try createValidExport(deviceID: "LUK-STRICT").archive
        archive.blocks[0].attestationDacDer = Data("fake_der_data".utf8).base64EncodedString()
        let issues = archive.verify(options: LukuVerifyOptions(
            allowUntrustedRoots: false,
            skipCertificateTemporalChecks: true,
            trustedExternalFingerprints: [],
            trustProfile: "dev"
        ))
        XCTAssertTrue(hasIssue(issues, "ATTESTATION_FAILED", "ATTESTATION_CHAIN_MISSING"))
    }

    func testRejectsStructurallyInvalidArchives() throws {
        XCTAssertThrowsError(try LukuFile.open(data: Data("just random garbage bytes".utf8)))

        let wrongMimeData = try makeArchive(entries: ["mimetype": Data("application/pdf".utf8)])
        XCTAssertThrowsError(try LukuFile.open(data: wrongMimeData))

        let missingManifestData = try makeArchive(entries: ["mimetype": Data(LUKUMimetype.utf8)])
        XCTAssertThrowsError(try LukuFile.open(data: missingManifestData))
    }

    func testMutatesRealSampleArchivesInMemory() throws {
        let sampleData = try Data(contentsOf: currentSampleURL("first-passable-verification-sample.luku"))
        let original = try LukuFile.open(data: sampleData)
        XCTAssertTrue(criticalIssues(original.verify(options: currentSampleOptions())).isEmpty)

        let invalidSignature = try LukuFile.open(data: sampleData)
        invalidSignature.blocks[0].batch[0]["signature"] = "not_base64_data!!!"
        XCTAssertTrue(hasIssue(invalidSignature.verify(options: currentSampleOptions()), "RECORD_SIGNATURE_INVALID", "ATTESTATION_FAILED"))

        let mutatedCanonical = try LukuFile.open(data: sampleData)
        let currentCanonical = mutatedCanonical.blocks[0].batch[0]["canonical_string"] as? String ?? ""
        mutatedCanonical.blocks[0].batch[0]["canonical_string"] = "\(currentCanonical)X"
        XCTAssertTrue(hasIssue(mutatedCanonical.verify(options: currentSampleOptions()), "RECORD_SIGNATURE_INVALID"))

        if original.blocks[0].batch.count > 1 {
            let brokenChain = try LukuFile.open(data: sampleData)
            brokenChain.blocks[0].batch[1]["previous_signature"] = "broken_link"
            XCTAssertTrue(hasIssue(brokenChain.verify(options: currentSampleOptions()), "RECORD_CHAIN_BROKEN"))
        }

        if original.blocks.count > 1 {
            let floatingAnchor = try LukuFile.open(data: sampleData)
            floatingAnchor.blocks[1].batch[0]["previous_signature"] = "floating_anchor_test"
            XCTAssertFalse(hasIssue(floatingAnchor.verify(options: currentSampleOptions()), "RECORD_CHAIN_BROKEN"))
        }

        if original.blocks[0].batch.count > 1 {
            let regressedCounter = try LukuFile.open(data: sampleData)
            var record = regressedCounter.blocks[0].batch[1]
            var payload = record["payload"] as? [String: Any] ?? [:]
            payload["ctr"] = 0
            record["payload"] = payload
            regressedCounter.blocks[0].batch[1] = record
            XCTAssertTrue(hasIssue(regressedCounter.verify(options: currentSampleOptions()), "COUNTER_REGRESSION"))
        }
    }

    func testVerifiesTheShippedSampleDirectory() throws {
        let passable = try LukuFile.open(data: Data(contentsOf: currentSampleURL("first-passable-verification-sample.luku")))
        XCTAssertTrue(criticalIssues(passable.verify(options: currentSampleOptions())).isEmpty)

        let signatureMismatch = try LukuFile.open(data: Data(contentsOf: currentSampleURL("signature-mismatch.luku")))
        let mismatchIssues = signatureMismatch.verify(options: currentSampleOptions(allowUntrustedRoots: false))
        XCTAssertTrue(hasIssue(mismatchIssues, "ATTESTATION_FAILED", "RECORD_SIGNATURE_INVALID", "ATTESTATION_CHAIN_MISSING"))

        let invalidChain = try LukuFile.open(data: Data(contentsOf: currentSampleURL("invalid-chain.luku")))
        XCTAssertTrue(hasIssue(invalidChain.verify(options: currentSampleOptions()), "RECORD_CHAIN_BROKEN", "BLOCKS_HASH_MISMATCH", "ATTESTATION_FAILED"))

        // A test-PKI sample passes its own profile and is rejected by dev and prod.
        let testIssues = passable.verify(options: currentSampleOptions(allowUntrustedRoots: false, trustProfile: "test"))
        XCTAssertFalse(testIssues.contains { $0.code == "ATTESTATION_FAILED" && $0.message.contains("Certificate chain does not match the requested trust profile") })

        let devIssues = passable.verify(options: currentSampleOptions(allowUntrustedRoots: false, trustProfile: "dev"))
        XCTAssertTrue(devIssues.contains { $0.code == "ATTESTATION_FAILED" && $0.message.contains("Certificate chain does not match the requested trust profile") })

        let prodIssues = passable.verify(options: LukuVerifyOptions(
            allowUntrustedRoots: false,
            skipCertificateTemporalChecks: true,
            trustedExternalFingerprints: [],
            trustProfile: "prod"
        ))
        XCTAssertTrue(prodIssues.contains { $0.code == "ATTESTATION_FAILED" && $0.message.contains("Certificate chain does not match the requested trust profile") })
    }

    private func makeArchive(entries: [String: Data]) throws -> Data {
        let archive = try Archive(data: Data(), accessMode: .create)
        for (path, data) in entries {
            let compression: CompressionMethod = path == "mimetype" ? .none : .deflate
            try archive.addEntry(
                with: path,
                type: .file,
                uncompressedSize: Int64(data.count),
                compressionMethod: compression,
                provider: { position, size in
                    let lower = Int(position)
                    let upper = min(lower + size, data.count)
                    return lower < upper ? data.subdata(in: lower..<upper) : Data()
                }
            )
        }
        guard let data = archive.data else {
            throw NSError(domain: "lukuid-tests", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to serialize archive"])
        }
        return data
    }
    func testSelfTest() throws {
        let results = LukuIDClient.selfTest()
        XCTAssertTrue(results.count >= 4)
        for result in results {
            print("\(result.alg) \(result.operation)\t\(result.passed ? "PASS" : "FAIL")\t\(result.id)")
            XCTAssertTrue(result.passed, "Self-test failed for \(result.alg) \(result.operation)")
        }
    }
}
