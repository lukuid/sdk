// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk

import com.lukuid.sdk.internal.DeviceAttestationInput
import com.lukuid.sdk.internal.ExternalIdentityInput
import com.lukuid.sdk.internal.verifyDeviceAttestation
import com.lukuid.sdk.internal.verifyExternalIdentity
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileInputStream
import java.nio.charset.StandardCharsets
import java.security.KeyFactory
import java.security.PrivateKey
import java.security.PublicKey
import java.security.Signature
import java.security.spec.X509EncodedKeySpec
import java.time.Instant
import java.util.Base64
import java.util.LinkedHashMap
import java.util.zip.ZipEntry
import java.util.zip.ZipInputStream
import java.util.zip.ZipOutputStream

const val LUKU_MIMETYPE: String = "application/vnd.lukuid.package+zip"
private val SUPPORTED_ARCHIVE_VERSIONS = setOf("1.0.0", "1.0")

data class LukuManifest(
    val type: String,
    val version: String,
    val createdAtUtc: Long,
    val description: String,
    var blocksHash: String,
    val nativeContinuityGapSeconds: Long? = null,
    val extra: MutableMap<String, Any?> = linkedMapOf()
) {
    fun toJson(): JSONObject {
        val json = JSONObject()
        json.put("type", type)
        json.put("version", version)
        json.put("created_at_utc", createdAtUtc)
        json.put("description", description)
        json.put("blocks_hash", blocksHash)
        if (nativeContinuityGapSeconds != null) {
            json.put("native_continuity_gap_seconds", nativeContinuityGapSeconds)
        }
        for ((key, value) in extra) {
            json.put(key, value ?: JSONObject.NULL)
        }
        return json
    }

    companion object {
        fun fromJson(json: JSONObject): LukuManifest {
            val extra = linkedMapOf<String, Any?>()
            val keys = json.keys()
            while (keys.hasNext()) {
                val key = keys.next()
                if (key !in setOf("type", "version", "created_at_utc", "description", "blocks_hash", "native_continuity_gap_seconds")) {
                    extra[key] = json.opt(key).takeUnless { it == JSONObject.NULL }
                }
            }
            return LukuManifest(
                type = json.optString("type"),
                version = json.optString("version"),
                createdAtUtc = json.optLong("created_at_utc"),
                description = json.optString("description"),
                blocksHash = json.optString("blocks_hash"),
                nativeContinuityGapSeconds = if (json.has("native_continuity_gap_seconds")) json.optLong("native_continuity_gap_seconds") else null,
                extra = extra
            )
        }
    }
}

data class LukuDeviceIdentity(
    val deviceId: String,
    val publicKey: String
) {
    fun toJson(): JSONObject = JSONObject()
        .put("device_id", deviceId)
        .put("public_key", publicKey)

    companion object {
        fun fromJson(json: JSONObject): LukuDeviceIdentity = LukuDeviceIdentity(
            deviceId = json.optString("device_id"),
            publicKey = json.optString("public_key")
        )
    }
}

data class LukuBlock(
    var blockId: Int,
    var timestampUtc: Long,
    var previousBlockHash: String?,
    val device: LukuDeviceIdentity,
    var attestationDacDer: String? = null,
    var attestationManufacturerDer: String? = null,
    var attestationIntermediateDer: String? = null,
    var attestationRootFingerprint: String? = null,
    var heartbeatSlacDer: String? = null,
    var heartbeatDer: String? = null,
    var heartbeatIntermediateDer: String? = null,
    var heartbeatRootFingerprint: String? = null,
    val batch: MutableList<JSONObject>,
    var batchHash: String = "",
    var blockCanonicalString: String = "",
    var blockHash: String = ""
) {
    fun toJson(): JSONObject {
        val json = JSONObject()
        json.put("block_id", blockId)
        json.put("timestamp_utc", timestampUtc)
        if (previousBlockHash != null) {
            json.put("previous_block_hash", previousBlockHash)
        }
        json.put("device", device.toJson())
        if (attestationDacDer != null) json.put("attestation_dac_der", attestationDacDer)
        if (attestationManufacturerDer != null) json.put("attestation_manufacturer_der", attestationManufacturerDer)
        if (attestationIntermediateDer != null) json.put("attestation_intermediate_der", attestationIntermediateDer)
        if (attestationRootFingerprint != null) json.put("attestation_root_fingerprint", attestationRootFingerprint)
        if (heartbeatSlacDer != null) json.put("heartbeat_slac_der", heartbeatSlacDer)
        if (heartbeatDer != null) json.put("heartbeat_der", heartbeatDer)
        if (heartbeatIntermediateDer != null) json.put("heartbeat_intermediate_der", heartbeatIntermediateDer)
        if (heartbeatRootFingerprint != null) json.put("heartbeat_root_fingerprint", heartbeatRootFingerprint)
        json.put("batch", JSONArray().apply { batch.forEach { put(JSONObject(it.toString())) } })
        json.put("batch_hash", batchHash)
        json.put("block_canonical_string", blockCanonicalString)
        json.put("block_hash", blockHash)
        return json
    }

    companion object {
        fun fromJson(json: JSONObject): LukuBlock {
            val batchArray = json.optJSONArray("batch") ?: JSONArray()
            val batch = mutableListOf<JSONObject>()
            for (index in 0 until batchArray.length()) {
                batch += JSONObject(batchArray.getJSONObject(index).toString())
            }
            return LukuBlock(
                blockId = json.optInt("block_id"),
                timestampUtc = json.optLong("timestamp_utc"),
                previousBlockHash = json.optString("previous_block_hash").ifBlank { null },
                device = LukuDeviceIdentity.fromJson(json.optJSONObject("device") ?: JSONObject()),
                attestationDacDer = json.optString("attestation_dac_der").ifBlank { null },
                attestationManufacturerDer = json.optString("attestation_manufacturer_der").ifBlank { null },
                attestationIntermediateDer = json.optString("attestation_intermediate_der").ifBlank { null },
                attestationRootFingerprint = json.optString("attestation_root_fingerprint").ifBlank { null },
                heartbeatSlacDer = json.optString("heartbeat_slac_der").ifBlank { null },
                heartbeatDer = json.optString("heartbeat_der").ifBlank { null },
                heartbeatIntermediateDer = json.optString("heartbeat_intermediate_der").ifBlank { null },
                heartbeatRootFingerprint = json.optString("heartbeat_root_fingerprint").ifBlank { null },
                batch = batch,
                batchHash = json.optString("batch_hash"),
                blockCanonicalString = json.optString("block_canonical_string"),
                blockHash = json.optString("block_hash")
            )
        }
    }
}

enum class Criticality {
    INFO,
    WARNING,
    CRITICAL
}

data class VerificationIssue(
    val code: String,
    val message: String,
    val criticality: Criticality
)

data class LukuVerifyOptions(
    val allowUntrustedRoots: Boolean = false,
    val skipCertificateTemporalChecks: Boolean = false,
    val trustedExternalFingerprints: List<String> = emptyList(),
    val trustProfile: String = System.getenv("LUKUID_TRUST_PROFILE") ?: "prod",
    val policy: LukuPolicy? = null,
    val requireContinuity: Boolean = false
)

data class LukuPolicy(
    val name: String,
    val nativeContinuityGapSeconds: Long? = null
)

data class LukuExportOptions(
    val policy: LukuPolicy? = null
)

data class LukuSigner(
    val privateKey: PrivateKey,
    val publicKeyBase64: String
)

class LukuArchive private constructor(
    val manifest: LukuManifest,
    var manifestSig: String,
    val blocks: MutableList<LukuBlock>,
    val attachments: MutableMap<String, ByteArray>,
    private var manifestRaw: String,
    private var blocksRaw: String
) {
    fun addAttachment(content: ByteArray): String {
        val hash = sha256Hex(content)
        attachments[hash] = content
        return hash
    }

    fun saveToBytes(): ByteArray {
        val blocksContent = blocks.joinToString("\n") { it.toJson().toString() } + "\n"
        val out = ByteArrayOutputStream()
        ZipOutputStream(out).use { zip ->
            zip.putNextEntry(ZipEntry("mimetype").apply { method = ZipEntry.STORED; size = LUKU_MIMETYPE.toByteArray().size.toLong(); compressedSize = size; crc = crc32(LUKU_MIMETYPE.toByteArray()) })
            zip.write(LUKU_MIMETYPE.toByteArray(StandardCharsets.UTF_8))
            zip.closeEntry()

            zip.putNextEntry(ZipEntry("blocks.jsonl"))
            zip.write(blocksContent.toByteArray(StandardCharsets.UTF_8))
            zip.closeEntry()

            zip.putNextEntry(ZipEntry("manifest.json"))
            zip.write(manifestRaw.toByteArray(StandardCharsets.UTF_8))
            zip.closeEntry()

            zip.putNextEntry(ZipEntry("manifest.sig"))
            zip.write(manifestSig.toByteArray(StandardCharsets.UTF_8))
            zip.closeEntry()

            for ((hash, bytes) in attachments) {
                val dir1 = hash.take(2).ifBlank { "00" }
                val dir2 = hash.drop(2).take(2).ifBlank { "00" }
                zip.putNextEntry(ZipEntry("attachments/$dir1/$dir2/$hash"))
                zip.write(bytes)
                zip.closeEntry()
            }
        }
        return out.toByteArray()
    }

    fun verify(options: LukuVerifyOptions = LukuVerifyOptions()): List<VerificationIssue> {
        val issues = mutableListOf<VerificationIssue>()
        val exporterPublicKey = manifest.extra["exporter_public_key"] as? String
        if (manifestSig.isBlank()) {
            issues += VerificationIssue("MANIFEST_SIGNATURE_MISSING", "The manifest.sig file is empty or missing.", Criticality.CRITICAL)
        } else if (exporterPublicKey.isNullOrBlank()) {
            issues += VerificationIssue("EXPORTER_KEY_MISSING", "Archive does not publish an exporter_public_key; manifest/block signatures cannot be checked offline.", Criticality.WARNING)
        } else if (!verifyDetachedSignature(exporterPublicKey, manifestRaw.toByteArray(StandardCharsets.UTF_8), manifestSig)) {
            issues += VerificationIssue("MANIFEST_SIGNATURE_INVALID", "The manifest signature does not verify against the exporter key.", Criticality.CRITICAL)
        }

        if (sha256Hex(blocksRaw.toByteArray(StandardCharsets.UTF_8)) != manifest.blocksHash) {
            issues += VerificationIssue("BLOCKS_HASH_MISMATCH", "The blocks.jsonl file hash does not match the manifest.", Criticality.CRITICAL)
        }
        if (manifest.version !in SUPPORTED_ARCHIVE_VERSIONS) {
            issues += VerificationIssue("MANIFEST_VERSION_UNSUPPORTED", "Archive manifest version ${manifest.version} is not supported.", Criticality.CRITICAL)
        }

        var previousBlockHash: String? = null
        for ((index, block) in blocks.withIndex()) {
            if (block.blockId != index) {
                issues += VerificationIssue("BLOCK_ID_MISMATCH", "Block $index has incorrect block_id ${block.blockId}.", Criticality.CRITICAL)
            }
            if (block.previousBlockHash != previousBlockHash) {
                issues += VerificationIssue("BLOCK_CHAIN_BROKEN", "Block $index previous hash link is broken.", Criticality.CRITICAL)
            }
            val recomputed = recomputeBlockFields(block)
            if (block.batchHash != recomputed.first) {
                issues += VerificationIssue("BLOCK_BATCH_HASH_INVALID", "Block $index batch_hash does not match ordered record signatures.", Criticality.CRITICAL)
            }
            if (block.blockCanonicalString != recomputed.second) {
                issues += VerificationIssue("BLOCK_CANONICAL_MISMATCH", "Block $index canonical string does not match recomputed content.", Criticality.CRITICAL)
            }
            if (block.blockHash.isBlank()) {
                issues += VerificationIssue("BLOCK_HASH_MISSING", "Block $index is missing block_hash.", Criticality.CRITICAL)
            } else if (block.blockHash != recomputed.third) {
                issues += VerificationIssue("BLOCK_HASH_INVALID", "Block $index block_hash does not match canonical content.", Criticality.CRITICAL)
            }
            previousBlockHash = block.blockHash
        }

        val recordIds = mutableSetOf<String>()
        for (block in blocks) {
            for (record in block.batch) {
                for (key in listOf("scan_id", "event_id", "attachment_id", "custody_id", "location_id")) {
                    record.optString(key).takeIf { it.isNotBlank() }?.let(recordIds::add)
                }
            }
        }

        val lastCounters = mutableMapOf<String, Long>()
        val lastTimes = mutableMapOf<String, Long>()
        val lastContinuityTimes = mutableMapOf<String, MutableMap<String, Long>>()
        val seenDevices = mutableSetOf<String>()

        val policy = options.policy ?: manifestPolicy(manifest)
        val continuityTypes = setOf("environment")

        for (block in blocks) {
            val lastSignatures = mutableMapOf<String, String>()
            val blockDacChain = listOf(
                pemFromDerString(block.attestationDacDer),
                pemFromDerString(block.attestationManufacturerDer),
                pemFromDerString(block.attestationIntermediateDer)
            ).filterNotNull().joinToString("")

            for (record in block.batch) {
                val recordType = record.optString("type", "unknown")
                val isAux = recordType in setOf("attachment", "location", "custody")
                val isCompatAttachment = record.optBoolean("_compat_nested_attachment", false)
                val payload = record.optJSONObject("payload")
                val deviceId = record.optString("device_id").ifBlank { block.device.deviceId }
                val publicKey = record.optString("public_key").ifBlank { block.device.publicKey }
                val signature = record.optString("signature")
                val previousSignature = record.optString("previous_signature")
                val canonicalString = record.optString("canonical_string")
                val timestamp = payload?.optLong("timestamp_utc") ?: record.optLong("timestamp_utc").takeIf { record.has("timestamp_utc") }
                val counter = payload?.optLong("ctr")?.takeIf { payload.has("ctr") }
                val genesisHash = payload?.optString("genesis_hash").orEmpty()

                if (!isAux && seenDevices.add(deviceId) && counter == 0L && genesisHash.isNotBlank() && previousSignature != genesisHash) {
                    issues += VerificationIssue("GENESIS_HASH_MISMATCH", "Genesis record (ctr=0) for device $deviceId has previous_signature that does not match genesis_hash.", Criticality.CRITICAL)
                }

                if (!isAux) {
                    lastSignatures[deviceId]?.let { lastSig ->
                        if (previousSignature != lastSig) {
                            issues += VerificationIssue("RECORD_CHAIN_BROKEN", "Record chain broken for device $deviceId at record type $recordType.", Criticality.CRITICAL)
                        }
                    }
                    lastCounters[deviceId]?.let { lastCtr ->
                        if (counter != null && counter <= lastCtr) {
                            issues += VerificationIssue("COUNTER_REGRESSION", "Counter regression detected for device $deviceId ($lastCtr -> $counter).", Criticality.CRITICAL)
                        }
                    }
                    lastTimes[deviceId]?.let { lastTime ->
                        if (timestamp != null && timestamp < lastTime) {
                            issues += VerificationIssue("TIME_REGRESSION", "Time travel detected for device $deviceId ($lastTime -> $timestamp).", Criticality.CRITICAL)
                        }
                    }
                }

                if (options.requireContinuity && recordType in continuityTypes && policy?.nativeContinuityGapSeconds != null) {
                    val deviceContinuity = lastContinuityTimes.getOrPut(deviceId) { mutableMapOf() }
                    val lastEnvTime = deviceContinuity[recordType]
                    if (lastEnvTime != null && timestamp != null) {
                        val gap = timestamp - lastEnvTime
                        if (gap > policy.nativeContinuityGapSeconds) {
                            issues += VerificationIssue("CONTINUITY_GAP_EXCEEDED", "Continuity gap of ${gap}s exceeded for device $deviceId type $recordType (threshold ${policy.nativeContinuityGapSeconds}s).", Criticality.CRITICAL)
                        }
                    }
                    if (timestamp != null) {
                        deviceContinuity[recordType] = timestamp
                    }
                }

                if (!options.allowUntrustedRoots) {
                    val identity = record.optJSONObject("identity")
                    var attestationChain = blockDacChain
                    identity?.optString("dac_der")?.takeIf { it.isNotBlank() }?.let {
                        attestationChain = listOf(
                            pemFromDerString(it),
                            pemFromDerString(identity.optString("attestation_manufacturer_der").ifBlank { null }),
                            pemFromDerString(identity.optString("attestation_intermediate_der").ifBlank { null })
                        ).filterNotNull().joinToString("")
                    }

                    val attestationSignature = identity?.optString("signature").orEmpty()
                    if (attestationChain.isBlank()) {
                        issues += VerificationIssue("ATTESTATION_CHAIN_MISSING", "Missing DAC attestation chain for device $deviceId.", Criticality.WARNING)
                    } else if (!isAux || attestationSignature.isNotBlank()) {
                        val result = verifyDeviceAttestation(
                            DeviceAttestationInput(
                                id = deviceId,
                                key = publicKey,
                                attestationSig = attestationSignature,
                                certificateChain = attestationChain,
                                created = if (options.skipCertificateTemporalChecks) null else timestamp,
                                trustProfile = options.trustProfile
                            )
                        )
                        if (!result.ok) {
                            issues += VerificationIssue("ATTESTATION_FAILED", "Device $deviceId failed DAC attestation: ${result.reason ?: "unknown"}", Criticality.CRITICAL)
                        }
                    }
                }

                if (canonicalString.isBlank()) {
                    issues += VerificationIssue("RECORD_CANONICAL_MISSING", "Record type $recordType on device $deviceId does not include a canonical_string.", if (isCompatAttachment) Criticality.WARNING else Criticality.CRITICAL)
                } else if (signature.isBlank()) {
                    issues += VerificationIssue("RECORD_SIGNATURE_MISSING", "Record type $recordType on device $deviceId is missing a signature.", if (isCompatAttachment) Criticality.WARNING else Criticality.CRITICAL)
                } else if (!verifyDetachedSignature(publicKey, canonicalString.toByteArray(StandardCharsets.UTF_8), signature)) {
                    issues += VerificationIssue("RECORD_SIGNATURE_INVALID", "Invalid signature for record type $recordType on device $deviceId.", Criticality.CRITICAL)
                }

                if (!isAux && signature.isNotBlank()) lastSignatures[deviceId] = signature
                if (!isAux && counter != null) lastCounters[deviceId] = counter
                if (!isAux && timestamp != null) lastTimes[deviceId] = timestamp

                if (isAux) {
                    record.optString("parent_record_id").takeIf { it.isNotBlank() && it !in recordIds }?.let { parentId ->
                        issues += VerificationIssue("PARENT_RECORD_MISSING", "Record type $recordType references missing parent $parentId.", Criticality.CRITICAL)
                    }
                }

                if (recordType == "attachment") {
                    val checksum = record.optString("checksum")
                    if (checksum.isNotBlank()) {
                        val attachment = attachments[checksum]
                        if (attachment == null) {
                            issues += VerificationIssue("ATTACHMENT_MISSING", "Attachment with hash $checksum is missing from archive.", Criticality.CRITICAL)
                        } else {
                            val actualHash = sha256Hex(attachment)
                            if (actualHash != checksum) {
                                issues += VerificationIssue("ATTACHMENT_CORRUPT", "Attachment with hash $checksum is corrupt (actual hash $actualHash).", Criticality.CRITICAL)
                            }
                        }
                    }
                }

                val externalIdentity = record.optJSONObject("external_identity")
                if (externalIdentity != null && !isAux) {
                    issues += VerificationIssue("EXTERNAL_IDENTITY_UNSUPPORTED_RECORD_TYPE", "Record type $recordType must not carry external_identity.", Criticality.CRITICAL)
                }

                if (isAux) {
                    val expectedPayload = expectedExternalIdentityPayload(record, recordType)
                    val endorserId = externalIdentity?.optString("endorser_id").orEmpty()
                    val rootFingerprint = externalIdentity?.optString("root_fingerprint").orEmpty()
                    val externalSignature = externalIdentity?.optString("signature").orEmpty()
                    val certChainDer = mutableListOf<String>()
                    val certChain = externalIdentity?.optJSONArray("cert_chain_der")
                    if (certChain != null) {
                        for (index in 0 until certChain.length()) {
                            certChain.optString(index).takeIf { it.isNotBlank() }?.let(certChainDer::add)
                        }
                    }
                    if (externalIdentity != null
                        && expectedPayload != null
                        && endorserId.isNotBlank()
                        && rootFingerprint.isNotBlank()
                        && externalSignature.isNotBlank()
                        && certChainDer.isNotEmpty()) {
                        val result = verifyExternalIdentity(
                            ExternalIdentityInput(
                                endorserId = endorserId,
                                rootFingerprint = rootFingerprint,
                                certChainDer = certChainDer,
                                signature = externalSignature,
                                expectedPayload = expectedPayload,
                                trustedFingerprints = options.trustedExternalFingerprints
                            )
                        )
                        if (!result.ok) {
                            issues += VerificationIssue(
                                "EXTERNAL_IDENTITY_VERIFICATION_FAILED",
                                "External identity verification failed: ${result.reason ?: "unknown"}",
                                Criticality.CRITICAL
                            )
                        }
                    }
                }
            }
        }

        options.policy?.let { expectedPolicy ->
            val actualPolicy = manifestPolicy(manifest)
            if (actualPolicy == null) {
                issues += VerificationIssue("POLICY_MISSING", "Archive does not declare the expected continuity policy '${expectedPolicy.name}'.", Criticality.WARNING)
            } else {
                if (expectedPolicy.name.isNotBlank() && actualPolicy.name.isNotBlank() && actualPolicy.name != expectedPolicy.name) {
                    issues += VerificationIssue("POLICY_NAME_MISMATCH", "Archive policy name '${actualPolicy.name}' does not match expected policy '${expectedPolicy.name}'.", Criticality.WARNING)
                }
                if (actualPolicy.nativeContinuityGapSeconds != expectedPolicy.nativeContinuityGapSeconds) {
                    issues += VerificationIssue("POLICY_THRESHOLD_MISMATCH", "Archive continuity threshold ${actualPolicy.nativeContinuityGapSeconds} does not match expected threshold ${expectedPolicy.nativeContinuityGapSeconds}.", Criticality.WARNING)
                }
            }

            expectedPolicy.nativeContinuityGapSeconds?.let { threshold ->
                for ((blockIndex, block) in blocks.withIndex()) {
                    var lastNativeTimestamp: Long? = null
                    for (record in block.batch) {
                        val recordType = record.optString("type", "unknown")
                        if (isAuxRecordType(recordType)) {
                            continue
                        }
                        val timestamp = recordTimestamp(record) ?: continue
                        if (lastNativeTimestamp != null && timestamp > lastNativeTimestamp && (timestamp - lastNativeTimestamp) > threshold) {
                            issues += VerificationIssue("POLICY_NATIVE_TIME_GAP_UNSPLIT", "Native time gap of ${timestamp - lastNativeTimestamp} seconds exceeds expected policy threshold $threshold within block $blockIndex.", Criticality.WARNING)
                        }
                        lastNativeTimestamp = timestamp
                    }
                }
            }
        }
        return issues
    }

    companion object {
        fun open(file: File): LukuArchive = open(FileInputStream(file).use { it.readBytes() })

        fun open(data: ByteArray): LukuArchive {
            val files = linkedMapOf<String, ByteArray>()
            val seenNames = linkedSetOf<String>()
            ZipInputStream(ByteArrayInputStream(data)).use { zip ->
                var entry = zip.nextEntry
                while (entry != null) {
                    validateZipEntryName(entry.name)
                    check(seenNames.add(entry.name)) { "Archive contains duplicate ZIP entry: ${entry.name}" }
                    files[entry.name] = zip.readBytes()
                    zip.closeEntry()
                    entry = zip.nextEntry
                }
            }

            val mimetype = files["mimetype"]?.toString(StandardCharsets.UTF_8)
                ?: error("mimetype file missing")
            if (mimetype.trim() != LUKU_MIMETYPE) {
                error("Invalid mimetype: expected $LUKU_MIMETYPE")
            }
            val manifestRaw = files["manifest.json"]?.toString(StandardCharsets.UTF_8)
                ?: error("manifest.json missing")
            val blocksRaw = files["blocks.jsonl"]?.toString(StandardCharsets.UTF_8)
                ?: error("blocks.jsonl missing")

            val manifestJson = JSONObject(manifestRaw)
            validateManifestJson(manifestJson)
            val manifest = LukuManifest.fromJson(manifestJson)
            val blocks = blocksRaw
                .lineSequence()
                .filter { it.isNotBlank() }
                .map { LukuBlock.fromJson(JSONObject(it)) }
                .toMutableList()

            val attachments = mutableMapOf<String, ByteArray>()
            for ((name, bytes) in files) {
                if (name.startsWith("attachments/")) {
                    attachments[name.substringAfterLast('/')] = bytes
                }
            }

            return LukuArchive(
                manifest = manifest,
                manifestSig = files["manifest.sig"]?.toString(StandardCharsets.UTF_8).orEmpty(),
                blocks = blocks,
                attachments = attachments,
                manifestRaw = manifestRaw,
                blocksRaw = blocksRaw
            )
        }

        fun export(
            records: List<JSONObject>,
            device: LukuDeviceIdentity,
            attachments: Map<String, ByteArray>,
            signer: LukuSigner,
            options: LukuExportOptions = LukuExportOptions()
        ): LukuArchive = exportWithIdentity(records, device, attachments, signer, options)

        fun exportWithIdentity(
            records: List<JSONObject>,
            device: LukuDeviceIdentity,
            attachments: Map<String, ByteArray>,
            signer: LukuSigner,
            options: LukuExportOptions = LukuExportOptions()
        ): LukuArchive {
            val blocks = mutableListOf<LukuBlock>()
            var previousBlockHash: String? = null
            val nativeGapThreshold = options.policy?.nativeContinuityGapSeconds
            var currentBatch = mutableListOf<JSONObject>()
            var lastSignature: String? = null
            var lastNativeTimestamp: Long? = null

            fun flushCurrentBatch() {
                if (currentBatch.isEmpty()) {
                    return
                }
                val timestamp = currentBatch.firstNotNullOfOrNull { recordTimestamp(it) } ?: 0L
                val block = buildBlockFromRecords(blocks.size, timestamp, previousBlockHash, device, currentBatch, null)
                previousBlockHash = block.blockHash
                blocks += block
                currentBatch = mutableListOf()
                lastSignature = null
                lastNativeTimestamp = null
            }

            records.forEach { record ->
                val recordType = record.optString("type", "unknown")
                val isAux = isAuxRecordType(recordType)
                val signature = record.optString("signature")
                val previousSignature = record.optString("previous_signature")
                val timestamp = recordTimestamp(record)

                var shouldSplit = false
                if (!isAux) {
                    if (!lastSignature.isNullOrBlank() && previousSignature.isNotBlank() && previousSignature != lastSignature) {
                        shouldSplit = true
                    }
                    if (!shouldSplit && nativeGapThreshold != null && lastNativeTimestamp != null && timestamp != null && timestamp > lastNativeTimestamp!! && (timestamp - lastNativeTimestamp!!) > nativeGapThreshold) {
                        shouldSplit = true
                    }
                }

                if (shouldSplit) {
                    flushCurrentBatch()
                }

                currentBatch += JSONObject(record.toString())
                if (!isAux) {
                    if (signature.isNotBlank()) {
                        lastSignature = signature
                    }
                    if (timestamp != null) {
                        lastNativeTimestamp = timestamp
                    }
                }
            }
            flushCurrentBatch()

            return exportBlocksWithManifest(blocks, attachments, "Exported ${records.size} records", linkedMapOf(), signer, options)
        }

        fun exportBlocksWithManifest(
            blocks: List<LukuBlock>,
            attachments: Map<String, ByteArray>,
            description: String,
            manifestExtra: MutableMap<String, Any?>,
            signer: LukuSigner,
            options: LukuExportOptions = LukuExportOptions()
        ): LukuArchive {
            val now = Instant.now().epochSecond
            val normalizedBlocks = mutableListOf<LukuBlock>()
            var previousBlockHash: String? = null
            blocks.forEachIndexed { index, block ->
                val normalized = block.copy(
                    blockId = index,
                    timestampUtc = if (block.timestampUtc == 0L) now else block.timestampUtc,
                    previousBlockHash = previousBlockHash,
                    batch = block.batch.map { JSONObject(it.toString()) }.toMutableList()
                )
                val recomputed = recomputeBlockFields(normalized)
                normalized.batchHash = recomputed.first
                normalized.blockCanonicalString = recomputed.second
                normalized.blockHash = recomputed.third
                previousBlockHash = normalized.blockHash
                normalizedBlocks += normalized
            }

            val blocksRaw = normalizedBlocks.joinToString("\n") { it.toJson().toString() } + "\n"
            applyExportOptions(manifestExtra, options)
            manifestExtra.putIfAbsent("exporter_public_key", signer.publicKeyBase64)
            manifestExtra.putIfAbsent("exporter_alg", "ED25519")

            val manifest = LukuManifest(
                type = "LukuArchive",
                version = "1.0.0",
                createdAtUtc = now,
                description = description,
                blocksHash = sha256Hex(blocksRaw.toByteArray(StandardCharsets.UTF_8)),
                extra = manifestExtra
            )
            val manifestRaw = manifest.toJson().toString(2)
            val manifestSig = signDetached(signer.privateKey, manifestRaw.toByteArray(StandardCharsets.UTF_8))
            return LukuArchive(manifest, manifestSig, normalizedBlocks, attachments.toMutableMap(), manifestRaw, blocksRaw)
        }

        fun buildBlockFromRecords(
            blockId: Int,
            timestampUtc: Long,
            previousBlockHash: String?,
            defaultDevice: LukuDeviceIdentity,
            batch: List<JSONObject>,
            commonCerts: Map<String, String>?
        ): LukuBlock {
            val normalizedBatch = batch.map { JSONObject(it.toString()) }.toMutableList()
            val deviceJson = normalizedBatch.asSequence()
                .mapNotNull { it.optJSONObject("device") }
                .firstOrNull()
            val device = if (deviceJson != null) {
                LukuDeviceIdentity(
                    deviceId = deviceJson.optString("device_id", defaultDevice.deviceId),
                    publicKey = deviceJson.optString("public_key", defaultDevice.publicKey)
                )
            } else {
                defaultDevice
            }

            fun commonValue(path1: String, path2: String): String? {
                val values = normalizedBatch.mapNotNull { it.optJSONObject(path1)?.optString(path2)?.takeIf { value -> value.isNotBlank() } }
                return values.firstOrNull()?.takeIf { first -> values.all { it == first } }
            }

            val block = LukuBlock(
                blockId = blockId,
                timestampUtc = timestampUtc,
                previousBlockHash = previousBlockHash,
                device = device,
                attestationDacDer = commonValue("identity", "dac_der") ?: commonCerts?.get("dac_der"),
                attestationManufacturerDer = commonValue("identity", "attestation_manufacturer_der") ?: commonCerts?.get("attestation_manufacturer_der"),
                attestationIntermediateDer = commonValue("identity", "attestation_intermediate_der") ?: commonCerts?.get("attestation_intermediate_der"),
                attestationRootFingerprint = commonValue("identity", "attestation_root_fingerprint") ?: commonCerts?.get("attestation_root_fingerprint"),
                heartbeatSlacDer = commonValue("identity", "slac_der") ?: commonCerts?.get("slac_der"),
                heartbeatDer = commonValue("identity", "heartbeat_der") ?: commonCerts?.get("heartbeat_der"),
                heartbeatIntermediateDer = commonValue("identity", "heartbeat_intermediate_der") ?: commonCerts?.get("heartbeat_intermediate_der"),
                heartbeatRootFingerprint = commonValue("identity", "heartbeat_root_fingerprint") ?: commonCerts?.get("heartbeat_root_fingerprint"),
                batch = normalizedBatch
            )
            val recomputed = recomputeBlockFields(block)
            block.batchHash = recomputed.first
            block.blockCanonicalString = recomputed.second
            block.blockHash = recomputed.third
            return block
        }

        private fun recordTimestamp(record: JSONObject): Long? {
            return record.optJSONObject("payload")?.takeIf { it.has("timestamp_utc") }?.optLong("timestamp_utc")
                ?: record.takeIf { it.has("timestamp_utc") }?.optLong("timestamp_utc")
                ?: record.takeIf { it.has("timestamp") }?.optLong("timestamp")
        }

        private fun isAuxRecordType(recordType: String): Boolean {
            return recordType in setOf("attachment", "location", "custody")
        }

        private fun expectedExternalIdentityPayload(record: JSONObject, recordType: String): String? {
            val externalIdentity = record.optJSONObject("external_identity") ?: return null
            val endorserId = externalIdentity.optString("endorser_id")
            if (endorserId.isBlank()) {
                return null
            }

            return when (recordType) {
                "attachment" -> {
                    val checksum = record.optString("checksum")
                    val merkleRoot = record.optString("merkle_root")
                    "$checksum:$merkleRoot:$endorserId"
                }
                "location" -> {
                    val lat = if (record.has("lat")) record.optDouble("lat") else 0.0
                    val lng = if (record.has("lng")) record.optDouble("lng") else 0.0
                    "$lat:$lng:$endorserId"
                }
                "custody" -> {
                    val payload = record.optJSONObject("payload")
                    val event = payload?.optString("event").orEmpty()
                    val status = payload?.optString("status").orEmpty()
                    val contextRef = payload?.optString("context_ref").orEmpty()
                    "$event:$status:$contextRef:$endorserId"
                }
                else -> null
            }
        }

        private fun manifestPolicy(manifest: LukuManifest): LukuPolicy? {
            val policy = manifest.extra["policy"] as? JSONObject
            if (policy != null) {
                val threshold = if (policy.has("native_continuity_gap_seconds")) policy.optLong("native_continuity_gap_seconds") else null
                return LukuPolicy(
                    name = policy.optString("name"),
                    nativeContinuityGapSeconds = threshold
                )
            }

            if (manifest.nativeContinuityGapSeconds != null) {
                return LukuPolicy(name = "", nativeContinuityGapSeconds = manifest.nativeContinuityGapSeconds)
            }

            val legacyThreshold = when (val value = manifest.extra["native_continuity_gap_seconds"]) {
                is Number -> value.toLong()
                else -> null
            }
            return legacyThreshold?.let { LukuPolicy(name = "", nativeContinuityGapSeconds = it) }
        }

        private fun applyExportOptions(manifestExtra: MutableMap<String, Any?>, options: LukuExportOptions) {
            options.policy?.let { policy ->
                val policyJson = JSONObject()
                    .put("name", policy.name)
                if (policy.nativeContinuityGapSeconds != null) {
                    policyJson.put("native_continuity_gap_seconds", policy.nativeContinuityGapSeconds)
                    manifestExtra["native_continuity_gap_seconds"] = policy.nativeContinuityGapSeconds
                }
                manifestExtra["policy"] = policyJson
            }
        }

        private fun validateZipEntryName(name: String) {
            require(name.isNotBlank() && !name.startsWith("/") && !name.startsWith("\\") && !name.contains("\\")) {
                "Archive contains unsafe ZIP entry path: $name"
            }
            val parts = name.split('/')
            require(parts.all { it.isNotBlank() && it != "." && it != ".." }) {
                "Archive contains unsafe ZIP entry path: $name"
            }
        }

        private fun validateManifestJson(json: JSONObject) {
            require(json.optString("type") == "LukuArchive") {
                "manifest.json field type must be \"LukuArchive\""
            }
            require(json.has("version") && json.opt("version") is String && json.optString("version").isNotBlank()) {
                "manifest.json field version must be a non-empty string"
            }
            require(json.has("created_at_utc") && json.opt("created_at_utc") is Number) {
                "manifest.json field created_at_utc must be a number"
            }
            require(json.has("description") && json.opt("description") is String) {
                "manifest.json field description must be a string"
            }
            require(json.has("blocks_hash") && json.opt("blocks_hash") is String && json.optString("blocks_hash").isNotBlank()) {
                "manifest.json field blocks_hash must be a non-empty string"
            }
        }

        private fun recomputeBlockFields(block: LukuBlock): Triple<String, String, String> {
            val batchHash = sha256Hex(block.batch.joinToString(":") { it.optString("signature") }.toByteArray(StandardCharsets.UTF_8))
            val canonical = listOf(
                block.blockId.toString(),
                block.timestampUtc.toString(),
                block.previousBlockHash.orEmpty(),
                block.device.deviceId,
                block.device.publicKey,
                block.attestationRootFingerprint.orEmpty(),
                block.heartbeatRootFingerprint.orEmpty(),
                batchHash
            ).joinToString(":")
            val blockHash = sha256Hex(canonical.toByteArray(StandardCharsets.UTF_8))
            return Triple(batchHash, canonical, blockHash)
        }

        private fun signDetached(privateKey: PrivateKey, payload: ByteArray): String {
            val signature = Signature.getInstance("Ed25519")
            signature.initSign(privateKey)
            signature.update(payload)
            return Base64.getEncoder().encodeToString(signature.sign())
        }

        private fun verifyDetachedSignature(publicKeyBase64: String, payload: ByteArray, signatureBase64: String): Boolean {
            val publicKey = rawEd25519PublicKey(publicKeyBase64) ?: return false
            val signatureBytes = runCatching { Base64.getDecoder().decode(signatureBase64) }.getOrNull() ?: return false
            return runCatching {
                val verifier = Signature.getInstance("Ed25519")
                verifier.initVerify(publicKey)
                verifier.update(payload)
                verifier.verify(signatureBytes)
            }.getOrDefault(false)
        }

        private fun rawEd25519PublicKey(publicKeyBase64: String): PublicKey? {
            val raw = runCatching { Base64.getDecoder().decode(publicKeyBase64) }.getOrNull() ?: return null
            if (raw.size < 32) return null
            val prefix = byteArrayOf(
                0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00
            )
            val spki = prefix + raw.copyOfRange(0, 32)
            return runCatching {
                KeyFactory.getInstance("Ed25519").generatePublic(X509EncodedKeySpec(spki))
            }.getOrNull()
        }

        private fun sha256Hex(input: ByteArray): String {
            val digest = java.security.MessageDigest.getInstance("SHA-256").digest(input)
            return digest.joinToString("") { "%02x".format(it) }
        }

        private fun pemFromDerString(value: String?): String? {
            if (value.isNullOrBlank()) return null
            val decoded = runCatching { Base64.getDecoder().decode(value) }.getOrNull() ?: return null
            val body = Base64.getEncoder().encodeToString(decoded).chunked(64).joinToString("\n")
            return "-----BEGIN CERTIFICATE-----\n$body\n-----END CERTIFICATE-----\n"
        }

        private fun crc32(bytes: ByteArray): Long {
            val crc = java.util.zip.CRC32()
            crc.update(bytes)
            return crc.value
        }
    }
}
