// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk

import org.bouncycastle.jcajce.interfaces.MLDSAPublicKey
import org.bouncycastle.jcajce.provider.asymmetric.mldsa.BCMLDSAPublicKey
import org.bouncycastle.jce.provider.BouncyCastleProvider
import org.bouncycastle.pqc.crypto.mldsa.MLDSAParameters
import org.bouncycastle.pqc.crypto.mldsa.MLDSAPublicKeyParameters
import org.json.JSONArray
import org.json.JSONObject
import java.nio.charset.StandardCharsets
import java.security.KeyPairGenerator
import java.security.MessageDigest
import java.security.Signature
import java.util.Base64
import java.util.logging.Logger

internal object ArchiveSeals {
    private val logger = Logger.getLogger(ArchiveSeals::class.java.name)
    private val provider = BouncyCastleProvider()

    private fun hash(manifest: ByteArray): String = MessageDigest.getInstance("SHA-256")
        .digest(manifest).joinToString("") { "%02x".format(it) }

    private fun payload(hash: String, timestamp: Long): ByteArray =
        "LUKUID-ARCHIVE-SEAL-V1\nmanifest_hash_alg=SHA-256\nmanifest_hash=$hash\ncreated_at_utc=$timestamp"
            .toByteArray(StandardCharsets.UTF_8)

    fun create(manifest: ByteArray, timestamp: Long): String =
        createWithPlatform(manifest, timestamp, AndroidPlatformSeal::create)

    internal fun createWithPlatform(
        manifest: ByteArray, timestamp: Long,
        platform: (ByteArray, ByteArray, Long) -> JSONObject?
    ): String {
        require(timestamp >= 0) { "Archive seal timestamp is negative" }
        val manifestHash = hash(manifest)
        val keyPair = KeyPairGenerator.getInstance("ML-DSA-65", provider).generateKeyPair()
        val signer = Signature.getInstance("ML-DSA-65", provider)
        signer.initSign(keyPair.private)
        signer.update(payload(manifestHash, timestamp))
        val seal = JSONObject()
            .put("type", "self")
            .put("alg", "ML-DSA-65")
            .put("created_at_utc", timestamp)
            .put("public_key", Base64.getEncoder().encodeToString((keyPair.public as MLDSAPublicKey).publicData))
            .put("signature", Base64.getEncoder().encodeToString(signer.sign()))
        val seals = JSONArray().put(seal)
        try {
            platform(
                MessageDigest.getInstance("SHA-256").digest(manifest),
                payload(manifestHash, timestamp), timestamp
            )?.let { seals.put(it) }
        } catch (error: Exception) {
            logger.warning("Android platform archive seal unavailable: ${error.javaClass.simpleName}")
        }
        return JSONObject()
            .put("version", 1)
            .put("manifest_hash", JSONObject().put("alg", "SHA-256").put("value", manifestHash))
            .put("seals", seals)
            .toString(2)
    }

    fun verify(raw: String?, manifest: ByteArray): List<VerificationIssue> {
        fun critical(code: String, message: String) = VerificationIssue(code, message, Criticality.CRITICAL)
        if (raw == null) return listOf(critical("ARCHIVE_SEALS_MISSING", "The required seals.json file is missing."))
        val root = try { JSONObject(raw) } catch (_: Exception) {
            return listOf(critical("ARCHIVE_SEALS_MALFORMED", "seals.json is not valid JSON."))
        }
        val seals = root.optJSONArray("seals")
        val version = root.opt("version")
        if (!((version is Int && version == 1) || (version is Long && version == 1L)) ||
            root.optJSONObject("manifest_hash")?.optString("alg") != "SHA-256" ||
            seals == null || seals.length() == 0) {
            return listOf(critical("ARCHIVE_SEALS_MALFORMED", "seals.json has invalid required fields."))
        }
        val manifestHash = hash(manifest)
        if (root.getJSONObject("manifest_hash").optString("value") != manifestHash) {
            return listOf(critical("ARCHIVE_SEALS_MANIFEST_HASH_MISMATCH", "seals.json does not commit to the exact manifest.json bytes."))
        }
        val issues = mutableListOf<VerificationIssue>()
        var validSelf = false
        var sharedTimestamp: Long? = null
        for (index in 0 until seals.length()) {
            val seal = seals.optJSONObject(index)
            val timestamp = seal?.opt("created_at_utc")
            val sealTimestamp = when (timestamp) { is Long -> timestamp; is Int -> timestamp.toLong(); else -> null }
            if (seal == null || sealTimestamp == null || sealTimestamp < 0) {
                issues += critical("ARCHIVE_SEALS_MALFORMED", "A seal has invalid required fields.")
                continue
            }
            if (sharedTimestamp != null && sealTimestamp != sharedTimestamp) {
                issues += critical("ARCHIVE_SEALS_MALFORMED", "Seals do not share one canonical payload timestamp.")
                continue
            }
            sharedTimestamp = sealTimestamp
            when (seal.optString("type")) {
                "self" -> {
                    if (seal.optString("alg") != "ML-DSA-65") {
                        issues += critical("ARCHIVE_SEALS_MALFORMED", "A self seal has an invalid algorithm.")
                        continue
                    }
                    val valid = try {
                        val keyBytes = Base64.getDecoder().decode(seal.getString("public_key"))
                        val signatureBytes = Base64.getDecoder().decode(seal.getString("signature"))
                        require(keyBytes.size == 1952 && signatureBytes.size == 3309)
                        require(Base64.getEncoder().encodeToString(keyBytes) == seal.getString("public_key"))
                        require(Base64.getEncoder().encodeToString(signatureBytes) == seal.getString("signature"))
                        val key = BCMLDSAPublicKey(MLDSAPublicKeyParameters(MLDSAParameters.ml_dsa_65, keyBytes))
                        val verifier = Signature.getInstance("ML-DSA-65", provider)
                        verifier.initVerify(key)
                        verifier.update(payload(manifestHash, sealTimestamp))
                        verifier.verify(signatureBytes)
                    } catch (_: Exception) { false }
                    if (valid) validSelf = true
                    else issues += critical("ARCHIVE_SELF_SEAL_INVALID", "A required ML-DSA-65 self seal failed cryptographic verification.")
                }
                "platform" -> {
                    if (listOf("platform", "alg", "public_key", "signature").any { seal.optString(it).isEmpty() }) {
                        issues += critical("ARCHIVE_SEALS_MALFORMED", "A platform seal has invalid required fields.")
                        continue
                    }
                    if (seal.optString("platform") == "android" && seal.optString("alg") == "ES256") {
                        val valid = AndroidPlatformSeal.verify(seal, MessageDigest.getInstance("SHA-256").digest(manifest),
                            payload(manifestHash, sealTimestamp))
                        if (!valid) issues += critical("ARCHIVE_PLATFORM_SEAL_INVALID", "The Android hardware seal failed offline signature or attestation verification.")
                    } else {
                        issues += VerificationIssue("ARCHIVE_PLATFORM_SEAL_UNSUPPORTED", "This SDK cannot independently validate this platform seal.", Criticality.WARNING)
                    }
                }
                "authority" -> {
                    if (listOf("alg", "key_id", "root_fingerprint", "signature").any { seal.optString(it).isEmpty() }
                        || seal.optJSONArray("certificate_chain") == null) {
                        issues += critical("ARCHIVE_SEALS_MALFORMED", "An authority seal has invalid required fields.")
                    } else {
                        issues += VerificationIssue("ARCHIVE_AUTHORITY_SEAL_UNSUPPORTED", "Authority seals are reserved and are not trusted by this SDK.", Criticality.WARNING)
                    }
                }
                else -> issues += critical("ARCHIVE_SEALS_MALFORMED", "Unknown seal type.")
            }
        }
        if (!validSelf) issues += critical("ARCHIVE_SELF_SEAL_MISSING", "The archive has no valid ML-DSA-65 self seal.")
        return issues
    }
}
