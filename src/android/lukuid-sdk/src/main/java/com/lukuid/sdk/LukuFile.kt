// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk

import com.lukuid.sdk.internal.DeviceAttestationInput
import com.lukuid.sdk.internal.JsonUtils
import com.lukuid.sdk.internal.verifyDeviceAttestation
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayInputStream
import java.io.File
import java.io.FileInputStream
import java.io.InputStream
import java.nio.charset.StandardCharsets
import java.util.zip.ZipInputStream

data class LukuParseResult(
    val verified: Boolean,
    val items: List<LukuItemResult>
)

data class LukuItemResult(
    val type: String,
    val verified: Boolean,
    val payload: Map<String, Any?>,
    val errors: List<String>? = null
)

object LukuFile {
    fun open(file: File): LukuArchive = LukuArchive.open(file)

    fun open(data: ByteArray): LukuArchive = LukuArchive.open(data)

    fun parse(file: File): LukuParseResult {
        return parse(FileInputStream(file))
    }

    fun parse(data: ByteArray): LukuParseResult {
        return parse(ByteArrayInputStream(data))
    }

    fun parse(inputStream: InputStream): LukuParseResult {
        val archive = LukuArchive.open(inputStream.readBytes())
        val issues = archive.verify()
        val verified = issues.none { it.criticality == Criticality.CRITICAL }
        val items = archive.blocks.flatMap { block ->
            block.batch.map { record ->
                LukuItemResult(
                    type = record.optString("type", "unknown"),
                    verified = verified,
                    payload = JsonUtils.fromJson(record),
                    errors = null
                )
            }
        }
        return LukuParseResult(verified, items)
    }

    fun verifyFile(file: File, options: LukuVerifyOptions = LukuVerifyOptions()): List<VerificationIssue> {
        return open(file).verify(options)
    }

    fun verifyFile(data: ByteArray, options: LukuVerifyOptions = LukuVerifyOptions()): List<VerificationIssue> {
        return open(data).verify(options)
    }

    private fun pemFromDerBase64(value: String): String {
        return try {
            val bytes = java.util.Base64.getDecoder().decode(value)
            val b64 = java.util.Base64.getEncoder().encodeToString(bytes)
            val pem = java.lang.StringBuilder("-----BEGIN CERTIFICATE-----\n")
            var i = 0
            while (i < b64.length) {
                val end = java.lang.Math.min(i + 64, b64.length)
                pem.append(b64.substring(i, end)).append("\n")
                i += 64
            }
            pem.append("-----END CERTIFICATE-----\n").toString()
        } catch (e: Exception) {
            ""
        }
    }

    private fun sha256Hex(data: ByteArray): String {
        val digest = java.security.MessageDigest.getInstance("SHA-256")
        val hash = digest.digest(data)
        return hash.joinToString("") { "%02x".format(it) }
    }

    private fun expectedExternalIdentityPayload(record: JSONObject, recordType: String): String? {
        return when (recordType) {
            "attachment" -> {
                val checksum = record.optString("checksum", "")
                val merkleRoot = record.optString("merkle_root", "")
                val endorserId = record.optJSONObject("external_identity")?.optString("endorser_id", "") ?: ""
                "$checksum:$merkleRoot:$endorserId"
            }
            "location" -> {
                val lat = record.optDouble("lat", 0.0)
                val lng = record.optDouble("lng", 0.0)
                val endorserId = record.optJSONObject("external_identity")?.optString("endorser_id", "") ?: ""
                "$lat:$lng:$endorserId"
            }
            "custody" -> {
                val payload = record.optJSONObject("payload")
                val event = payload?.optString("event", "") ?: ""
                val status = payload?.optString("status", "") ?: ""
                val contextRef = payload?.optString("context_ref", "") ?: ""
                val endorserId = record.optJSONObject("external_identity")?.optString("endorser_id", "") ?: ""
                "$event:$status:$contextRef:$endorserId"
            }
            else -> null
        }
    }

    fun verifyEnvelope(envelopeMap: Map<String, Any?>, options: LukuVerifyOptions = LukuVerifyOptions()): List<VerificationIssue> {
        val envelope = JSONObject(envelopeMap)
        return verifyEnvelope(envelope, options)
    }

    fun verifyEnvelope(envelope: JSONObject, options: LukuVerifyOptions = LukuVerifyOptions()): List<VerificationIssue> {
        val issues = mutableListOf<VerificationIssue>()
        val recordType = envelope.optString("type", "unknown")
        val isAuxRecord = recordType == "attachment" || recordType == "location" || recordType == "custody"
        val payload = envelope.optJSONObject("payload") ?: JSONObject()
        
        val device = envelope.optJSONObject("device")
        val deviceId = envelope.optString("device_id").takeIf { it.isNotEmpty() } ?: device?.optString("device_id") ?: ""
        val publicKey = envelope.optString("public_key").takeIf { it.isNotEmpty() } ?: device?.optString("public_key") ?: ""
        val signature = envelope.optString("signature", "")
        val canonicalStringValue = envelope.optString("canonical_string", "")
        
        val timestamp = (payload.opt("timestamp_utc") as? Number)?.toLong() 
            ?: (envelope.opt("timestamp_utc") as? Number)?.toLong()
        val counter = (payload.opt("ctr") as? Number)?.toLong()
        val genesisHash = payload.optString("genesis_hash", "")
        val previousSignature = envelope.optString("previous_signature", "")

        if (deviceId.isEmpty() || publicKey.isEmpty()) {
            issues.add(VerificationIssue("DEVICE_IDENTITY_MISSING", "Envelope is missing device_id or public_key.", Criticality.CRITICAL))
        }

        if (!isAuxRecord && counter == 0L && genesisHash.isNotEmpty() && previousSignature.isNotEmpty() && previousSignature != genesisHash) {
            issues.add(VerificationIssue("GENESIS_HASH_MISMATCH", "Genesis record (ctr=0) for device $deviceId has previous_signature that does not match genesis_hash.", Criticality.CRITICAL))
        }

        if (!options.allowUntrustedRoots) {
            val identity = envelope.optJSONObject("identity")
            
            val dacDer = envelope.optString("attestation_dac_der").takeIf { it.isNotEmpty() }
                ?: identity?.optString("dac_der")?.takeIf { it.isNotEmpty() }
                ?: identity?.optString("attestation_dac_der")?.takeIf { it.isNotEmpty() }
            val manDer = envelope.optString("attestation_manufacturer_der").takeIf { it.isNotEmpty() }
                ?: identity?.optString("attestation_manufacturer_der")?.takeIf { it.isNotEmpty() }
            val intDer = envelope.optString("attestation_intermediate_der").takeIf { it.isNotEmpty() }
                ?: identity?.optString("attestation_intermediate_der")?.takeIf { it.isNotEmpty() }
                
            val attestationChain = listOfNotNull(
                dacDer?.let { pemFromDerBase64(it) },
                manDer?.let { pemFromDerBase64(it) },
                intDer?.let { pemFromDerBase64(it) }
            ).joinToString("")
            
            val attestationSig = envelope.optString("attestation_signature").takeIf { it.isNotEmpty() }
                ?: identity?.optString("signature") ?: ""

            if (attestationChain.isEmpty()) {
                issues.add(VerificationIssue("ATTESTATION_CHAIN_MISSING", "Missing DAC attestation chain for device $deviceId.", Criticality.WARNING))
            } else if (!isAuxRecord || attestationSig.isNotEmpty()) {
                val input = DeviceAttestationInput(
                    id = deviceId,
                    key = publicKey,
                    attestationSig = attestationSig,
                    certificateChain = attestationChain,
                    created = if (options.skipCertificateTemporalChecks) null else timestamp,
                    trustProfile = options.trustProfile
                )
                val result = verifyDeviceAttestation(input)
                if (!result.ok) {
                    issues.add(VerificationIssue("ATTESTATION_FAILED", "Device $deviceId failed DAC attestation: ${result.reason}", Criticality.CRITICAL))
                }
            }

            // Check Heartbeat (SLAC)
            val slac = envelope.optString("heartbeat_slac_der").takeIf { it.isNotEmpty() }
                ?: identity?.optString("hb_slac_der")?.takeIf { it.isNotEmpty() }
                ?: identity?.optString("heartbeat_slac_der")?.takeIf { it.isNotEmpty() }
            val hbMan = envelope.optString("heartbeat_der").takeIf { it.isNotEmpty() }
                ?: identity?.optString("hb_der")?.takeIf { it.isNotEmpty() }
                ?: identity?.optString("heartbeat_der")?.takeIf { it.isNotEmpty() }
            val hbInt = envelope.optString("heartbeat_intermediate_der").takeIf { it.isNotEmpty() }
                ?: identity?.optString("hb_intermediate_der")?.takeIf { it.isNotEmpty() }
                ?: identity?.optString("heartbeat_intermediate_der")?.takeIf { it.isNotEmpty() }

            if (!slac.isNullOrEmpty()) {
                val slacChain = listOfNotNull(
                    slac.let { pemFromDerBase64(it) },
                    hbMan?.let { pemFromDerBase64(it) },
                    hbInt?.let { pemFromDerBase64(it) }
                ).joinToString("")

                if (slacChain.isNotEmpty()) {
                    val slacSignature = envelope.optString("heartbeat_signature").takeIf { it.isNotEmpty() }
                        ?: identity?.optString("heartbeat_signature")?.takeIf { it.isNotEmpty() }
                        ?: attestationSig
                        
                    val slacResult = verifyDeviceAttestation(DeviceAttestationInput(
                        id = deviceId,
                        key = publicKey,
                        attestationSig = slacSignature,
                        certificateChain = slacChain,
                        created = if (options.skipCertificateTemporalChecks) null else timestamp,
                        trustProfile = options.trustProfile
                    ))
                    if (!slacResult.ok) {
                        issues.add(VerificationIssue("ATTESTATION_FAILED", "Device $deviceId failed SLAC (heartbeat) attestation: ${slacResult.reason}", Criticality.CRITICAL))
                    }
                }
            }
        }

        if (canonicalStringValue.isEmpty()) {
            issues.add(VerificationIssue("RECORD_CANONICAL_MISSING", "Record type $recordType does not include a canonical_string.", Criticality.CRITICAL))
        } else if (signature.isEmpty()) {
            issues.add(VerificationIssue("RECORD_SIGNATURE_MISSING", "Record type $recordType is missing a signature.", Criticality.CRITICAL))
        } else if (publicKey.isNotEmpty()) {
            val isSigValid = LukuArchive.verifyDetachedSignature(publicKey, canonicalStringValue.toByteArray(java.nio.charset.StandardCharsets.UTF_8), signature)
            if (!isSigValid) {
                issues.add(VerificationIssue("RECORD_SIGNATURE_INVALID", "Invalid signature for record type $recordType.", Criticality.CRITICAL))
            }
        }

        if (recordType == "attachment") {
            val checksum = envelope.optString("checksum", "")
            if (checksum.isNotEmpty() && options.attachments != null) {
                val content = options.attachments[checksum]
                if (content == null) {
                    issues.add(VerificationIssue("ATTACHMENT_MISSING", "Attachment with hash $checksum is missing from provided attachments.", Criticality.CRITICAL))
                } else {
                    val actualHash = sha256Hex(content)
                    if (actualHash != checksum) {
                        issues.add(VerificationIssue("ATTACHMENT_CORRUPT", "Attachment with hash $checksum is corrupt (actual hash $actualHash).", Criticality.CRITICAL))
                    }
                }
            }
        }

        val externalIdentity = envelope.optJSONObject("external_identity")
        if (externalIdentity != null && isAuxRecord) {
            val expectedPayload = expectedExternalIdentityPayload(envelope, recordType)
            val endorserId = externalIdentity.optString("endorser_id").takeIf { it.isNotEmpty() }
            val rootFingerprint = externalIdentity.optString("root_fingerprint").takeIf { it.isNotEmpty() }
            val extSignature = externalIdentity.optString("signature").takeIf { it.isNotEmpty() }
            val certChainDerArray = externalIdentity.optJSONArray("cert_chain_der")
            val certChainDer = if (certChainDerArray != null) {
                (0 until certChainDerArray.length()).mapNotNull { certChainDerArray.optString(it).takeIf { s -> s.isNotEmpty() } }
            } else null

            if (expectedPayload != null && endorserId != null && rootFingerprint != null && extSignature != null && !certChainDer.isNullOrEmpty()) {
                val input = com.lukuid.sdk.internal.ExternalIdentityInput(
                    endorserId = endorserId,
                    rootFingerprint = rootFingerprint,
                    certChainDer = certChainDer,
                    signature = extSignature,
                    expectedPayload = expectedPayload,
                    trustedFingerprints = options.trustedExternalFingerprints
                )
                val result = com.lukuid.sdk.internal.verifyExternalIdentity(input)
                if (!result.ok) {
                    issues.add(VerificationIssue("EXTERNAL_IDENTITY_VERIFICATION_FAILED", "External identity verification failed: ${result.reason}", Criticality.CRITICAL))
                }
            }
        }

        return issues
    }
}
