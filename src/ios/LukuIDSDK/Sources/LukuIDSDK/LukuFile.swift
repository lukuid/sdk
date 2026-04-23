// SPDX-License-Identifier: Apache-2.0
import CryptoKit
import Foundation
import ZIPFoundation

public let LUKUMimetype = "application/vnd.lukuid.package+zip"

public struct LukuParseResult: Sendable {
    public let verified: Bool
    public let items: [LukuItemResult]
    public let issues: [VerificationIssue]
}

public struct LukuItemResult: Sendable {
    public let type: String
    public let verified: Bool
    public let payload: [String: AnySendable]
    public let errors: [String]?
}

public struct AnySendable: @unchecked Sendable {
    public let value: Any
    public init(_ value: Any) { self.value = value }
}

public struct LukuManifest {
    public let type: String
    public let version: String
    public var createdAtUTC: UInt64
    public let description: String
    public var blocksHash: String
    public var nativeContinuityGapSeconds: UInt64?
    public var extra: [String: Any]

    public init(type: String,
                version: String,
                createdAtUTC: UInt64,
                description: String,
                blocksHash: String,
                nativeContinuityGapSeconds: UInt64? = nil,
                extra: [String: Any] = [:]) {
        self.type = type
        self.version = version
        self.createdAtUTC = createdAtUTC
        self.description = description
        self.blocksHash = blocksHash
        self.nativeContinuityGapSeconds = nativeContinuityGapSeconds
        self.extra = extra
    }

    fileprivate init(json: [String: Any]) {
        var extra = json
        extra.removeValue(forKey: "type")
        extra.removeValue(forKey: "version")
        extra.removeValue(forKey: "created_at_utc")
        extra.removeValue(forKey: "description")
        extra.removeValue(forKey: "blocks_hash")
        extra.removeValue(forKey: "native_continuity_gap_seconds")
        self.init(
            type: json["type"] as? String ?? "",
            version: json["version"] as? String ?? "",
            createdAtUTC: uint64(json["created_at_utc"]) ?? 0,
            description: json["description"] as? String ?? "",
            blocksHash: json["blocks_hash"] as? String ?? "",
            nativeContinuityGapSeconds: uint64(json["native_continuity_gap_seconds"]),
            extra: extra
        )
    }

    fileprivate func jsonObject() -> [String: Any] {
        var json = extra
        json["type"] = type
        json["version"] = version
        json["created_at_utc"] = createdAtUTC
        json["description"] = description
        json["blocks_hash"] = blocksHash
        if let nativeContinuityGapSeconds {
            json["native_continuity_gap_seconds"] = nativeContinuityGapSeconds
        }
        return json
    }
}

public struct LukuDeviceIdentity {
    public let deviceID: String
    public let publicKey: String

    public init(deviceID: String, publicKey: String) {
        self.deviceID = deviceID
        self.publicKey = publicKey
    }

    fileprivate init(json: [String: Any]) {
        self.init(
            deviceID: json["device_id"] as? String ?? "",
            publicKey: json["public_key"] as? String ?? ""
        )
    }

    fileprivate func jsonObject() -> [String: Any] {
        [
            "device_id": deviceID,
            "public_key": publicKey
        ]
    }
}

public struct LukuBlock {
    public var blockID: UInt32
    public var timestampUTC: UInt64
    public var previousBlockHash: String?
    public var device: LukuDeviceIdentity
    public var attestationDacDer: String?
    public var attestationManufacturerDer: String?
    public var attestationIntermediateDer: String?
    public var attestationRootFingerprint: String?
    public var heartbeatSlacDer: String?
    public var heartbeatDer: String?
    public var heartbeatIntermediateDer: String?
    public var heartbeatRootFingerprint: String?
    public var batch: [[String: Any]]
    public var batchHash: String
    public var blockCanonicalString: String
    public var blockHash: String

    public init(blockID: UInt32,
                timestampUTC: UInt64,
                previousBlockHash: String?,
                device: LukuDeviceIdentity,
                attestationDacDer: String? = nil,
                attestationManufacturerDer: String? = nil,
                attestationIntermediateDer: String? = nil,
                attestationRootFingerprint: String? = nil,
                heartbeatSlacDer: String? = nil,
                heartbeatDer: String? = nil,
                heartbeatIntermediateDer: String? = nil,
                heartbeatRootFingerprint: String? = nil,
                batch: [[String: Any]],
                batchHash: String = "",
                blockCanonicalString: String = "",
                blockHash: String = "") {
        self.blockID = blockID
        self.timestampUTC = timestampUTC
        self.previousBlockHash = previousBlockHash
        self.device = device
        self.attestationDacDer = attestationDacDer
        self.attestationManufacturerDer = attestationManufacturerDer
        self.attestationIntermediateDer = attestationIntermediateDer
        self.attestationRootFingerprint = attestationRootFingerprint
        self.heartbeatSlacDer = heartbeatSlacDer
        self.heartbeatDer = heartbeatDer
        self.heartbeatIntermediateDer = heartbeatIntermediateDer
        self.heartbeatRootFingerprint = heartbeatRootFingerprint
        self.batch = batch
        self.batchHash = batchHash
        self.blockCanonicalString = blockCanonicalString
        self.blockHash = blockHash
    }

    fileprivate init(json: [String: Any]) {
        self.init(
            blockID: json["block_id"] as? UInt32 ?? json["block_id"] as? NSNumber as? UInt32 ?? 0,
            timestampUTC: json["timestamp_utc"] as? UInt64 ?? json["timestamp_utc"] as? NSNumber as? UInt64 ?? 0,
            previousBlockHash: json["previous_block_hash"] as? String,
            device: LukuDeviceIdentity(json: json["device"] as? [String: Any] ?? [:]),
            attestationDacDer: json["attestation_dac_der"] as? String,
            attestationManufacturerDer: json["attestation_manufacturer_der"] as? String,
            attestationIntermediateDer: json["attestation_intermediate_der"] as? String,
            attestationRootFingerprint: json["attestation_root_fingerprint"] as? String,
            heartbeatSlacDer: json["heartbeat_slac_der"] as? String,
            heartbeatDer: json["heartbeat_der"] as? String,
            heartbeatIntermediateDer: json["heartbeat_intermediate_der"] as? String,
            heartbeatRootFingerprint: json["heartbeat_root_fingerprint"] as? String,
            batch: json["batch"] as? [[String: Any]] ?? [],
            batchHash: json["batch_hash"] as? String ?? "",
            blockCanonicalString: json["block_canonical_string"] as? String ?? "",
            blockHash: json["block_hash"] as? String ?? ""
        )
    }

    fileprivate func jsonObject() -> [String: Any] {
        var json: [String: Any] = [
            "block_id": blockID,
            "timestamp_utc": timestampUTC,
            "device": device.jsonObject(),
            "batch": batch,
            "batch_hash": batchHash,
            "block_canonical_string": blockCanonicalString,
            "block_hash": blockHash
        ]
        if let previousBlockHash {
            json["previous_block_hash"] = previousBlockHash
        }
        if let attestationDacDer { json["attestation_dac_der"] = attestationDacDer }
        if let attestationManufacturerDer { json["attestation_manufacturer_der"] = attestationManufacturerDer }
        if let attestationIntermediateDer { json["attestation_intermediate_der"] = attestationIntermediateDer }
        if let attestationRootFingerprint { json["attestation_root_fingerprint"] = attestationRootFingerprint }
        if let heartbeatSlacDer { json["heartbeat_slac_der"] = heartbeatSlacDer }
        if let heartbeatDer { json["heartbeat_der"] = heartbeatDer }
        if let heartbeatIntermediateDer { json["heartbeat_intermediate_der"] = heartbeatIntermediateDer }
        if let heartbeatRootFingerprint { json["heartbeat_root_fingerprint"] = heartbeatRootFingerprint }
        return json
    }
}

public enum Criticality: String, Codable, Sendable {
    case info
    case warning
    case critical
}

public struct VerificationIssue: Sendable {
    public let code: String
    public let message: String
    public let criticality: Criticality
}

public struct LukuVerifyOptions: Sendable {
    public let allowUntrustedRoots: Bool
    public let skipCertificateTemporalChecks: Bool
    public let trustedExternalFingerprints: [String]
    public let trustProfile: String
    public let policy: LukuPolicy?
    public let requireContinuity: Bool

    public init(allowUntrustedRoots: Bool = false,
                skipCertificateTemporalChecks: Bool = false,
                trustedExternalFingerprints: [String] = [],
                trustProfile: String = ProcessInfo.processInfo.environment["LUKUID_TRUST_PROFILE"] ?? "prod",
                policy: LukuPolicy? = nil,
                requireContinuity: Bool = false) {
        self.allowUntrustedRoots = allowUntrustedRoots
        self.skipCertificateTemporalChecks = skipCertificateTemporalChecks
        self.trustedExternalFingerprints = trustedExternalFingerprints
        self.trustProfile = trustProfile
        self.policy = policy
        self.requireContinuity = requireContinuity
    }
}

public struct LukuPolicy: Sendable {
    public let name: String
    public let nativeContinuityGapSeconds: UInt64?

    public init(name: String, nativeContinuityGapSeconds: UInt64? = nil) {
        self.name = name
        self.nativeContinuityGapSeconds = nativeContinuityGapSeconds
    }
}

public struct LukuExportOptions: Sendable {
    public let policy: LukuPolicy?

    public init(policy: LukuPolicy? = nil) {
        self.policy = policy
    }
}

public struct LukuSigner {
    public let privateKey: Curve25519.Signing.PrivateKey
    public let publicKeyBase64: String

    public init(privateKey: Curve25519.Signing.PrivateKey, publicKeyBase64: String? = nil) {
        self.privateKey = privateKey
        self.publicKeyBase64 = publicKeyBase64 ?? Data(privateKey.publicKey.rawRepresentation).base64EncodedString()
    }
}

public final class LukuArchive {
    public var manifest: LukuManifest
    public var manifestSig: String
    public var blocks: [LukuBlock]
    public var attachments: [String: Data]

    private var manifestRaw: String
    private var blocksRaw: String

    public init(manifest: LukuManifest,
                manifestSig: String,
                blocks: [LukuBlock],
                attachments: [String: Data],
                manifestRaw: String,
                blocksRaw: String) {
        self.manifest = manifest
        self.manifestSig = manifestSig
        self.blocks = blocks
        self.attachments = attachments
        self.manifestRaw = manifestRaw
        self.blocksRaw = blocksRaw
    }

    public func addAttachment(_ content: Data) -> String {
        let hash = sha256Hex(content)
        attachments[hash] = content
        return hash
    }

    public func saveToData() throws -> Data {
        let currentBlocksRaw = try serializedBlocks()
        let archive = try Archive(data: Data(), accessMode: .create)

        try addEntry("mimetype", data: Data(LUKUMimetype.utf8), compression: .none, archive: archive)
        try addEntry("blocks.jsonl", data: Data(currentBlocksRaw.utf8), compression: .deflate, archive: archive)
        try addEntry("manifest.json", data: Data(manifestRaw.utf8), compression: .deflate, archive: archive)
        try addEntry("manifest.sig", data: Data(manifestSig.utf8), compression: .deflate, archive: archive)

        for (hash, content) in attachments {
            let dir1 = String(hash.prefix(2)).isEmpty ? "00" : String(hash.prefix(2))
            let dir2 = hash.count >= 4 ? String(hash.dropFirst(2).prefix(2)) : "00"
            try addEntry("attachments/\(dir1)/\(dir2)/\(hash)", data: content, compression: .deflate, archive: archive)
        }

        guard let data = archive.data else {
            throw NSError(domain: "lukuid", code: -80, userInfo: [NSLocalizedDescriptionKey: "Failed to serialize .luku archive"])
        }
        return data
    }

    public func append(records: [[String: Any]],
                       device: LukuDeviceIdentity,
                       signer: LukuSigner) throws {
        let timestamp = UInt64(Date().timeIntervalSince1970)
        let newBlock = try LukuFile.buildBlockFromRecords(
            blockID: UInt32(blocks.count),
            timestampUTC: timestamp,
            previousBlockHash: blocks.last?.blockHash,
            defaultDevice: device,
            batch: records,
            commonCerts: nil
        )
        blocks.append(newBlock)
        try refreshManifestSignature(signer: signer)
    }

    public func merge(_ other: LukuArchive, signer: LukuSigner) throws {
        for incoming in other.blocks {
            var normalized = incoming
            normalized.blockID = UInt32(blocks.count)
            normalized.previousBlockHash = blocks.last?.blockHash
            let fields = try recomputeBlockFields(normalized)
            normalized.batchHash = fields.batchHash
            normalized.blockCanonicalString = fields.blockCanonicalString
            normalized.blockHash = fields.blockHash
            blocks.append(normalized)
        }
        for (hash, content) in other.attachments {
            attachments[hash] = content
        }
        try refreshManifestSignature(signer: signer)
    }

    public func verify(options: LukuVerifyOptions = LukuVerifyOptions()) -> [VerificationIssue] {
        var issues: [VerificationIssue] = []

        let exporterPublicKey = manifest.extra["exporter_public_key"] as? String
        if manifestSig.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            issues.append(issue("MANIFEST_SIGNATURE_MISSING", "The manifest.sig file is empty or missing.", .critical))
        } else if exporterPublicKey == nil || exporterPublicKey?.isEmpty == true {
            issues.append(issue("EXPORTER_KEY_MISSING", "Archive does not publish an exporter_public_key; manifest/block signatures cannot be checked offline.", .warning))
        } else if !verifyDetachedSignature(publicKeyBase64: exporterPublicKey ?? "", payload: Data(manifestRaw.utf8), signatureBase64: manifestSig) {
            issues.append(issue("MANIFEST_SIGNATURE_INVALID", "The manifest signature does not verify against the exporter key.", .critical))
        }

        if sha256Hex(Data(blocksRaw.utf8)) != manifest.blocksHash {
            issues.append(issue("BLOCKS_HASH_MISMATCH", "The blocks.jsonl file hash does not match the manifest.", .critical))
        }

        var previousBlockHash: String?
        for (index, block) in blocks.enumerated() {
            if block.blockID != UInt32(index) {
                issues.append(issue("BLOCK_ID_MISMATCH", "Block \(index) has incorrect block_id \(block.blockID).", .critical))
            }
            if block.previousBlockHash != previousBlockHash {
                issues.append(issue("BLOCK_CHAIN_BROKEN", "Block \(index) previous hash link is broken.", .critical))
            }
            if let fields = try? recomputeBlockFields(block) {
                if block.batchHash != fields.batchHash {
                    issues.append(issue("BLOCK_BATCH_HASH_INVALID", "Block \(index) batch_hash does not match ordered record signatures.", .critical))
                }
                if block.blockCanonicalString != fields.blockCanonicalString {
                    issues.append(issue("BLOCK_CANONICAL_MISMATCH", "Block \(index) canonical string does not match recomputed content.", .critical))
                }
                if block.blockHash.isEmpty {
                    issues.append(issue("BLOCK_HASH_MISSING", "Block \(index) is missing block_hash.", .critical))
                } else if block.blockHash != fields.blockHash {
                    issues.append(issue("BLOCK_HASH_INVALID", "Block \(index) block_hash does not match canonical content.", .critical))
                }
            }
            previousBlockHash = block.blockHash
        }

        var recordIDs = Set<String>()
        for block in blocks {
            for record in block.batch {
                for key in ["scan_id", "event_id", "attachment_id", "custody_id", "location_id"] {
                    if let value = record[key] as? String, !value.isEmpty {
                        recordIDs.insert(value)
                    }
                }
            }
        }

        var lastCounters: [String: UInt64] = [:]
        var lastTimes: [String: UInt64] = [:]
        var lastContinuityTimes: [String: [String: UInt64]] = [:]
        var seenDevices = Set<String>()

        let policy = options.policy ?? manifestPolicy(manifest)
        let continuityTypes = Set(["environment"])

        for block in blocks {
            var lastSignatures: [String: String] = [:]
            let blockDACChain = [
                pemFromDerString(block.attestationDacDer),
                pemFromDerString(block.attestationManufacturerDer),
                pemFromDerString(block.attestationIntermediateDer)
            ].compactMap { $0 }.joined()

            for record in block.batch {
                let recordType = record["type"] as? String ?? "unknown"
                let isAuxRecord = ["attachment", "location", "custody"].contains(recordType)
                let isCompatAttachment = record["_compat_nested_attachment"] as? Bool ?? false
                let payload = record["payload"] as? [String: Any]
                let deviceID = (record["device_id"] as? String).flatMap { $0.isEmpty ? nil : $0 } ?? block.device.deviceID
                let publicKey = (record["public_key"] as? String).flatMap { $0.isEmpty ? nil : $0 } ?? block.device.publicKey
                let signature = record["signature"] as? String ?? ""
                let previousSignature = record["previous_signature"] as? String ?? ""
                let canonicalString = record["canonical_string"] as? String ?? ""
                let timestamp = uint64(payload?["timestamp_utc"]) ?? uint64(record["timestamp_utc"])
                let counter = uint64(payload?["ctr"])
                let genesisHash = payload?["genesis_hash"] as? String ?? ""

                if !isAuxRecord && !seenDevices.contains(deviceID) {
                    seenDevices.insert(deviceID)
                    if counter == 0, !genesisHash.isEmpty, previousSignature != genesisHash {
                        issues.append(issue("GENESIS_HASH_MISMATCH", "Genesis record (ctr=0) for device \(deviceID) has previous_signature that does not match genesis_hash.", .critical))
                    }
                }

                if !isAuxRecord {
                    if let lastSignature = lastSignatures[deviceID], previousSignature != lastSignature {
                        issues.append(issue("RECORD_CHAIN_BROKEN", "Record chain broken for device \(deviceID) at record type \(recordType).", .critical))
                    }
                    if let lastCounter = lastCounters[deviceID], let counter, counter <= lastCounter {
                        issues.append(issue("COUNTER_REGRESSION", "Counter regression detected for device \(deviceID) (\(lastCounter) -> \(counter)).", .critical))
                    }
                    if let lastTime = lastTimes[deviceID], let timestamp, timestamp < lastTime {
                        issues.append(issue("TIME_REGRESSION", "Time travel detected for device \(deviceID) (\(lastTime) -> \(timestamp)).", .critical))
                    }
                }

                if options.requireContinuity, continuityTypes.contains(recordType), let threshold = policy?.nativeContinuityGapSeconds {
                    var deviceContinuity = lastContinuityTimes[deviceID] ?? [:]
                    if let lastEnvTime = deviceContinuity[recordType], let timestamp {
                        let gap = timestamp - lastEnvTime
                        if gap > threshold {
                            issues.append(issue("CONTINUITY_GAP_EXCEEDED", "Continuity gap of \(gap)s exceeded for device \(deviceID) type \(recordType) (threshold \(threshold)s).", .critical))
                        }
                    }
                    if let timestamp {
                        deviceContinuity[recordType] = timestamp
                        lastContinuityTimes[deviceID] = deviceContinuity
                    }
                }

                if !options.allowUntrustedRoots {
                    let identity = record["identity"] as? [String: Any]
                    var attestationChain = blockDACChain
                    if let identity,
                       let dacDer = identity["dac_der"] as? String,
                       !dacDer.isEmpty {
                        attestationChain = [
                            pemFromDerString(dacDer),
                            pemFromDerString(identity["attestation_manufacturer_der"] as? String),
                            pemFromDerString(identity["attestation_intermediate_der"] as? String)
                        ].compactMap { $0 }.joined()
                    }

                    let attestationSignature = (identity?["signature"] as? String) ?? ""
                    if attestationChain.isEmpty {
                        issues.append(issue("ATTESTATION_CHAIN_MISSING", "Missing DAC attestation chain for device \(deviceID).", .warning))
                    } else if !isAuxRecord || !attestationSignature.isEmpty {
                        let inputs = DeviceAttestationInputs(
                            id: deviceID,
                            key: publicKey,
                            attestationSig: attestationSignature,
                            certificateChain: attestationChain,
                            created: options.skipCertificateTemporalChecks ? nil : timestamp.map(Int64.init),
                            attestationAlg: nil,
                            attestationPayloadVersion: nil,
                            trustProfile: options.trustProfile
                        )
                        if case .failure(let error) = verifyDeviceAttestation(inputs) {
                            issues.append(issue("ATTESTATION_FAILED", "Device \(deviceID) failed DAC attestation: \(error.reason)", .critical))
                        }
                    }
                }

                if canonicalString.isEmpty {
                    issues.append(issue("RECORD_CANONICAL_MISSING", "Record type \(recordType) on device \(deviceID) does not include a canonical_string.", isCompatAttachment ? .warning : .critical))
                } else if signature.isEmpty {
                    issues.append(issue("RECORD_SIGNATURE_MISSING", "Record type \(recordType) on device \(deviceID) is missing a signature.", isCompatAttachment ? .warning : .critical))
                } else if !verifyDetachedSignature(publicKeyBase64: publicKey, payload: Data(canonicalString.utf8), signatureBase64: signature) {
                    issues.append(issue("RECORD_SIGNATURE_INVALID", "Invalid signature for record type \(recordType) on device \(deviceID).", .critical))
                }

                if !isAuxRecord, !signature.isEmpty {
                    lastSignatures[deviceID] = signature
                }
                if !isAuxRecord, let counter {
                    lastCounters[deviceID] = counter
                }
                if !isAuxRecord, let timestamp {
                    lastTimes[deviceID] = timestamp
                }

                if isAuxRecord,
                   let parentRecordID = record["parent_record_id"] as? String,
                   !parentRecordID.isEmpty,
                   !recordIDs.contains(parentRecordID) {
                    issues.append(issue("PARENT_RECORD_MISSING", "Record type \(recordType) references missing parent \(parentRecordID).", .critical))
                }

                if recordType == "attachment",
                   let checksum = record["checksum"] as? String,
                   !checksum.isEmpty {
                    guard let content = attachments[checksum] else {
                        issues.append(issue("ATTACHMENT_MISSING", "Attachment with hash \(checksum) is missing from archive.", .critical))
                        continue
                    }
                    let actualHash = sha256Hex(content)
                    if actualHash != checksum {
                        issues.append(issue("ATTACHMENT_CORRUPT", "Attachment with hash \(checksum) is corrupt (actual hash \(actualHash)).", .critical))
                    }
                }
            }
        }

        if let expectedPolicy = options.policy {
            let actualPolicy = manifestPolicy(manifest)
            if actualPolicy == nil {
                issues.append(issue("POLICY_MISSING", "Archive does not declare the expected continuity policy '\(expectedPolicy.name)'.", .warning))
            } else {
                if !expectedPolicy.name.isEmpty, let actualName = actualPolicy?.name, !actualName.isEmpty, actualName != expectedPolicy.name {
                    issues.append(issue("POLICY_NAME_MISMATCH", "Archive policy name '\(actualName)' does not match expected policy '\(expectedPolicy.name)'.", .warning))
                }
                if actualPolicy?.nativeContinuityGapSeconds != expectedPolicy.nativeContinuityGapSeconds {
                    issues.append(issue("POLICY_THRESHOLD_MISMATCH", "Archive continuity threshold \(actualPolicy?.nativeContinuityGapSeconds ?? 0) does not match expected threshold \(expectedPolicy.nativeContinuityGapSeconds ?? 0).", .warning))
                }
            }

            if let threshold = expectedPolicy.nativeContinuityGapSeconds {
                for (blockIndex, block) in blocks.enumerated() {
                    var lastNativeTimestamp: UInt64?
                    for record in block.batch {
                        let recordType = record["type"] as? String ?? "unknown"
                        if ["attachment", "location", "custody"].contains(recordType) {
                            continue
                        }
                        guard let timestamp = recordTimestamp(from: record) else { continue }
                        if let lastNativeTimestamp, timestamp > lastNativeTimestamp, (timestamp - lastNativeTimestamp) > threshold {
                            issues.append(issue("POLICY_NATIVE_TIME_GAP_UNSPLIT", "Native time gap of \(timestamp - lastNativeTimestamp) seconds exceeds expected policy threshold \(threshold) within block \(blockIndex).", .warning))
                        }
                        lastNativeTimestamp = timestamp
                    }
                }
            }
        }

        return issues
    }

    private func refreshManifestSignature(signer: LukuSigner) throws {
        let timestamp = UInt64(Date().timeIntervalSince1970)
        let currentBlocksRaw = try serializedBlocks()
        manifest.blocksHash = sha256Hex(Data(currentBlocksRaw.utf8))
        manifest.createdAtUTC = timestamp
        manifestRaw = try serializeJSONObject(manifest.jsonObject(), pretty: true)
        blocksRaw = currentBlocksRaw
        manifestSig = try detachedSignatureBase64(privateKey: signer.privateKey, payload: Data(manifestRaw.utf8))
    }

    private func serializedBlocks() throws -> String {
        let lines = try blocks.map { try serializeJSONObject($0.jsonObject(), pretty: false) }
        return lines.joined(separator: "\n") + "\n"
    }
}

public enum LukuFile {
    public static func open(url: URL) throws -> LukuArchive {
        try open(data: Data(contentsOf: url))
    }

    public static func open(data: Data) throws -> LukuArchive {
        let archive: Archive
        do {
            archive = try Archive(data: data, accessMode: .read)
        } catch {
            throw NSError(domain: "lukuid", code: -50, userInfo: [NSLocalizedDescriptionKey: "Failed to open .luku archive: \(error.localizedDescription)"])
        }

        guard let mimetypeEntry = archive["mimetype"] else {
            throw NSError(domain: "lukuid", code: -50, userInfo: [NSLocalizedDescriptionKey: "mimetype file missing"])
        }
        let mimetype = try extractString(mimetypeEntry, from: archive)
        guard mimetype.trimmingCharacters(in: .whitespacesAndNewlines) == LUKUMimetype else {
            throw NSError(domain: "lukuid", code: -50, userInfo: [NSLocalizedDescriptionKey: "Invalid mimetype: expected \(LUKUMimetype)"])
        }

        guard let manifestEntry = archive["manifest.json"] else {
            throw NSError(domain: "lukuid", code: -51, userInfo: [NSLocalizedDescriptionKey: "manifest.json missing from archive"])
        }
        let manifestRaw = try extractString(manifestEntry, from: archive)
        let manifestJSON = try jsonObject(from: Data(manifestRaw.utf8))
        let manifest = LukuManifest(json: manifestJSON)

        guard let blocksEntry = archive["blocks.jsonl"] else {
            throw NSError(domain: "lukuid", code: -52, userInfo: [NSLocalizedDescriptionKey: "blocks.jsonl missing from archive"])
        }
        let blocksRaw = try extractString(blocksEntry, from: archive)
        let blocks = try blocksRaw
            .split(separator: "\n")
            .filter { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
            .map { line -> LukuBlock in
                let data = Data(line.utf8)
                return LukuBlock(json: try jsonObject(from: data))
            }

        let manifestSig: String
        if let manifestSigEntry = archive["manifest.sig"] {
            manifestSig = try extractString(manifestSigEntry, from: archive)
        } else {
            manifestSig = ""
        }

        var attachments: [String: Data] = [:]
        for entry in archive where entry.path.hasPrefix("attachments/") {
            attachments[(entry.path as NSString).lastPathComponent] = try extractData(entry, from: archive)
        }

        return LukuArchive(
            manifest: manifest,
            manifestSig: manifestSig,
            blocks: blocks,
            attachments: attachments,
            manifestRaw: manifestRaw,
            blocksRaw: blocksRaw
        )
    }

    public static func parse(url: URL) throws -> LukuParseResult {
        try parse(data: Data(contentsOf: url))
    }

    public static func parse(data: Data) throws -> LukuParseResult {
        let archive = try open(data: data)
        let issues = archive.verify()
        let verified = !issues.contains { $0.criticality == .critical }
        let items = archive.blocks.flatMap { block in
            block.batch.map { record in
                LukuItemResult(
                    type: record["type"] as? String ?? "unknown",
                    verified: verified,
                    payload: record.mapValues { AnySendable($0) },
                    errors: nil
                )
            }
        }
        return LukuParseResult(verified: verified, items: items, issues: issues)
    }

    public static func export(records: [[String: Any]],
                              device: LukuDeviceIdentity,
                              attachments: [String: Data],
                              signer: LukuSigner,
                              options: LukuExportOptions = LukuExportOptions()) throws -> LukuArchive {
        try exportWithIdentity(records: records, device: device, attachments: attachments, signer: signer, options: options)
    }

    public static func exportWithIdentity(records: [[String: Any]],
                                          device: LukuDeviceIdentity,
                                          attachments: [String: Data],
                                          signer: LukuSigner,
                                          options: LukuExportOptions = LukuExportOptions()) throws -> LukuArchive {
        var blocks: [LukuBlock] = []
        var previousBlockHash: String?
        let nativeGapThreshold = options.policy?.nativeContinuityGapSeconds
        var currentBatch: [[String: Any]] = []
        var lastSignature: String?
        var lastNativeTimestamp: UInt64?

        func flushCurrentBatch() throws {
            if currentBatch.isEmpty { return }
            let timestamp = currentBatch.lazy.compactMap { recordTimestamp(from: $0) }.first ?? 0
            let block = try buildBlockFromRecords(
                blockID: UInt32(blocks.count),
                timestampUTC: timestamp,
                previousBlockHash: previousBlockHash,
                defaultDevice: device,
                batch: currentBatch,
                commonCerts: nil
            )
            previousBlockHash = block.blockHash
            blocks.append(block)
            currentBatch = []
            lastSignature = nil
            lastNativeTimestamp = nil
        }

        for record in records {
            let recordType = record["type"] as? String ?? "unknown"
            let isAux = ["attachment", "location", "custody"].contains(recordType)
            let signature = record["signature"] as? String ?? ""
            let previousSignature = record["previous_signature"] as? String ?? ""
            let timestamp = recordTimestamp(from: record)

            var shouldSplit = false
            if !isAux {
                if let lastSig = lastSignature, !lastSig.isEmpty, !previousSignature.isEmpty, previousSignature != lastSig {
                    shouldSplit = true
                }
                if !shouldSplit, let threshold = nativeGapThreshold, let lastTimestamp = lastNativeTimestamp, let timestamp, timestamp > lastTimestamp, (timestamp - lastTimestamp) > threshold {
                    shouldSplit = true
                }
            }

            if shouldSplit {
                try flushCurrentBatch()
            }

            currentBatch.append(record)
            if !isAux {
                if !signature.isEmpty {
                    lastSignature = signature
                }
                if let timestamp {
                    lastNativeTimestamp = timestamp
                }
            }
        }
        try flushCurrentBatch()

        return try exportBlocksWithManifest(
            blocks: blocks,
            attachments: attachments,
            description: "Exported \(records.count) records",
            manifestExtra: [:],
            signer: signer,
            options: options
        )
    }

    public static func exportBlocksWithManifest(blocks: [LukuBlock],
                                                attachments: [String: Data],
                                                description: String,
                                                manifestExtra: [String: Any],
                                                signer: LukuSigner,
                                                options: LukuExportOptions = LukuExportOptions()) throws -> LukuArchive {
        let timestamp = UInt64(Date().timeIntervalSince1970)
        var normalizedBlocks: [LukuBlock] = []
        var previousBlockHash: String?

        for (index, var block) in blocks.enumerated() {
            block.blockID = UInt32(index)
            block.previousBlockHash = previousBlockHash
            if block.timestampUTC == 0 {
                block.timestampUTC = timestamp
            }
            let fields = try recomputeBlockFields(block)
            block.batchHash = fields.batchHash
            block.blockCanonicalString = fields.blockCanonicalString
            block.blockHash = fields.blockHash
            previousBlockHash = block.blockHash
            normalizedBlocks.append(block)
        }

        let blocksRaw = try normalizedBlocks.map { try serializeJSONObject($0.jsonObject(), pretty: false) }.joined(separator: "\n") + "\n"
        var extra = manifestExtra
        extra["exporter_public_key"] = extra["exporter_public_key"] ?? signer.publicKeyBase64
        extra["exporter_alg"] = extra["exporter_alg"] ?? "ED25519"

        if let policy = options.policy {
            var policyJson: [String: Any] = ["name": policy.name]
            if let gap = policy.nativeContinuityGapSeconds {
                policyJson["native_continuity_gap_seconds"] = gap
                extra["native_continuity_gap_seconds"] = gap
            }
            extra["policy"] = policyJson
        }

        let manifest = LukuManifest(
            type: "LukuArchive",
            version: "1.0",
            createdAtUTC: timestamp,
            description: description,
            blocksHash: sha256Hex(Data(blocksRaw.utf8)),
            nativeContinuityGapSeconds: options.policy?.nativeContinuityGapSeconds,
            extra: extra
        )
        let manifestRaw = try serializeJSONObject(manifest.jsonObject(), pretty: true)
        let manifestSig = try detachedSignatureBase64(privateKey: signer.privateKey, payload: Data(manifestRaw.utf8))

        return LukuArchive(
            manifest: manifest,
            manifestSig: manifestSig,
            blocks: normalizedBlocks,
            attachments: attachments,
            manifestRaw: manifestRaw,
            blocksRaw: blocksRaw
        )
    }

    public static func buildBlockFromRecords(blockID: UInt32,
                                             timestampUTC: UInt64,
                                             previousBlockHash: String?,
                                             defaultDevice: LukuDeviceIdentity,
                                             batch: [[String: Any]],
                                             commonCerts: [String: String]?) throws -> LukuBlock {
        let normalizedBatch = batch.map { mutableCopy($0) }
        let recordDevice = normalizedBatch.lazy
            .compactMap { $0["device"] as? [String: Any] }
            .first

        let device = LukuDeviceIdentity(
            deviceID: recordDevice?["device_id"] as? String ?? defaultDevice.deviceID,
            publicKey: recordDevice?["public_key"] as? String ?? defaultDevice.publicKey
        )

        func commonIdentityValue(_ key: String) -> String? {
            let values = normalizedBatch.compactMap { ($0["identity"] as? [String: Any])?[key] as? String }
            guard let first = values.first else { return nil }
            return values.allSatisfy({ $0 == first }) ? first : nil
        }

        var block = LukuBlock(
            blockID: blockID,
            timestampUTC: timestampUTC,
            previousBlockHash: previousBlockHash,
            device: device,
            attestationDacDer: commonIdentityValue("dac_der") ?? commonCerts?["dac_der"],
            attestationManufacturerDer: commonIdentityValue("attestation_manufacturer_der") ?? commonCerts?["attestation_manufacturer_der"],
            attestationIntermediateDer: commonIdentityValue("attestation_intermediate_der") ?? commonCerts?["attestation_intermediate_der"],
            attestationRootFingerprint: commonIdentityValue("attestation_root_fingerprint") ?? commonCerts?["attestation_root_fingerprint"],
            heartbeatSlacDer: commonIdentityValue("slac_der") ?? commonCerts?["slac_der"],
            heartbeatDer: commonIdentityValue("heartbeat_der") ?? commonCerts?["heartbeat_der"],
            heartbeatIntermediateDer: commonIdentityValue("heartbeat_intermediate_der") ?? commonCerts?["heartbeat_intermediate_der"],
            heartbeatRootFingerprint: commonIdentityValue("heartbeat_root_fingerprint") ?? commonCerts?["heartbeat_root_fingerprint"],
            batch: normalizedBatch
        )
        let fields = try recomputeBlockFields(block)
        block.batchHash = fields.batchHash
        block.blockCanonicalString = fields.blockCanonicalString
        block.blockHash = fields.blockHash
        return block
    }
}

private struct BlockFields {
    let batchHash: String
    let blockCanonicalString: String
    let blockHash: String
}

private func recomputeBlockFields(_ block: LukuBlock) throws -> BlockFields {
    let batchHash = sha256Hex(Data(block.batch.map { $0["signature"] as? String ?? "" }.joined(separator: ":").utf8))
    let canonical = [
        String(block.blockID),
        String(block.timestampUTC),
        block.previousBlockHash ?? "",
        block.device.deviceID,
        block.device.publicKey,
        block.attestationRootFingerprint ?? "",
        block.heartbeatRootFingerprint ?? "",
        batchHash
    ].joined(separator: ":")
    return BlockFields(
        batchHash: batchHash,
        blockCanonicalString: canonical,
        blockHash: sha256Hex(Data(canonical.utf8))
    )
}

private func issue(_ code: String, _ message: String, _ criticality: Criticality) -> VerificationIssue {
    VerificationIssue(code: code, message: message, criticality: criticality)
}

private func extractData(_ entry: Entry, from archive: Archive) throws -> Data {
    var data = Data()
    _ = try archive.extract(entry) { data.append($0) }
    return data
}

private func extractString(_ entry: Entry, from archive: Archive) throws -> String {
    String(decoding: try extractData(entry, from: archive), as: UTF8.self)
}

private func addEntry(_ path: String, data: Data, compression: CompressionMethod, archive: Archive) throws {
    try archive.addEntry(with: path,
                         type: .file,
                         uncompressedSize: Int64(data.count),
                         compressionMethod: compression,
                         provider: { position, size in
        let lower = Int(position)
        let upper = min(lower + size, data.count)
        return lower < upper ? data.subdata(in: lower..<upper) : Data()
    })
}

private func jsonObject(from data: Data) throws -> [String: Any] {
    guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
        throw NSError(domain: "lukuid", code: -60, userInfo: [NSLocalizedDescriptionKey: "Expected JSON object"])
    }
    return json
}

private func serializeJSONObject(_ json: [String: Any], pretty: Bool) throws -> String {
    let options: JSONSerialization.WritingOptions = pretty ? [.prettyPrinted, .sortedKeys] : [.sortedKeys]
    let data = try JSONSerialization.data(withJSONObject: json, options: options)
    return String(decoding: data, as: UTF8.self)
}

private func sha256Hex(_ data: Data) -> String {
    SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
}

private func detachedSignatureBase64(privateKey: Curve25519.Signing.PrivateKey, payload: Data) throws -> String {
    try Data(privateKey.signature(for: payload)).base64EncodedString()
}

private func verifyDetachedSignature(publicKeyBase64: String, payload: Data, signatureBase64: String) -> Bool {
    guard let publicKeyData = Data(base64Encoded: publicKeyBase64),
          publicKeyData.count >= 32,
          let signatureData = Data(base64Encoded: signatureBase64) else {
        return false
    }

    do {
        let publicKey = try Curve25519.Signing.PublicKey(rawRepresentation: publicKeyData.prefix(32))
        return publicKey.isValidSignature(signatureData, for: payload)
    } catch {
        return false
    }
}

private func pemFromDerString(_ value: String?) -> String? {
    guard let value, !value.isEmpty, let data = Data(base64Encoded: value) else {
        return nil
    }
    let base64 = data.base64EncodedString()
    let body = stride(from: 0, to: base64.count, by: 64).map { index in
        let start = base64.index(base64.startIndex, offsetBy: index)
        let end = base64.index(start, offsetBy: min(64, base64.distance(from: start, to: base64.endIndex)), limitedBy: base64.endIndex) ?? base64.endIndex
        return String(base64[start..<end])
    }.joined(separator: "\n")
    return "-----BEGIN CERTIFICATE-----\n\(body)\n-----END CERTIFICATE-----\n"
}

private func uint64(_ value: Any?) -> UInt64? {
    switch value {
    case let value as UInt64:
        return value
    case let value as Int:
        return value >= 0 ? UInt64(value) : nil
    case let value as Int64:
        return value >= 0 ? UInt64(value) : nil
    case let value as NSNumber:
        return value.uint64Value
    case let value as Double:
        return value.rounded() == value && value >= 0 ? UInt64(value) : nil
    default:
        return nil
    }
}

private func recordTimestamp(from record: [String: Any]) -> UInt64? {
    if let payload = record["payload"] as? [String: Any], let timestamp = uint64(payload["timestamp_utc"]) {
        return timestamp
    }
    return uint64(record["timestamp_utc"])
}

private func manifestPolicy(_ manifest: LukuManifest) -> LukuPolicy? {
    if let policyJson = manifest.extra["policy"] as? [String: Any] {
        return LukuPolicy(
            name: policyJson["name"] as? String ?? "",
            nativeContinuityGapSeconds: uint64(policyJson["native_continuity_gap_seconds"])
        )
    }

    if let manifestThreshold = manifest.nativeContinuityGapSeconds {
        return LukuPolicy(name: "", nativeContinuityGapSeconds: manifestThreshold)
    }

    if let legacyThreshold = uint64(manifest.extra["native_continuity_gap_seconds"]) {
        return LukuPolicy(name: "", nativeContinuityGapSeconds: legacyThreshold)
    }

    return nil
}

private func mutableCopy(_ value: [String: Any]) -> [String: Any] {
    guard JSONSerialization.isValidJSONObject(value),
          let data = try? JSONSerialization.data(withJSONObject: value),
          let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
        return value
    }
    return json
}

private extension Array {
    func chunked(into size: Int) -> [[Element]] {
        stride(from: 0, to: count, by: size).map {
            Array(self[$0..<Swift.min($0 + size, count)])
        }
    }
}
