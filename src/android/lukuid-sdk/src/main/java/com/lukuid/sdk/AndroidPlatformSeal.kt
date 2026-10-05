// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk

import android.os.Build
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import org.bouncycastle.asn1.ASN1Enumerated
import org.bouncycastle.asn1.ASN1Integer
import org.bouncycastle.asn1.ASN1OctetString
import org.bouncycastle.asn1.ASN1Primitive
import org.bouncycastle.asn1.ASN1Sequence
import org.bouncycastle.asn1.ASN1Set
import org.bouncycastle.asn1.ASN1TaggedObject
import org.bouncycastle.asn1.DERSequence
import org.bouncycastle.asn1.x509.SubjectPublicKeyInfo
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayInputStream
import java.math.BigInteger
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.MessageDigest
import java.security.Signature
import java.security.cert.CertificateFactory
import java.security.cert.X509Certificate
import java.security.interfaces.ECPublicKey
import java.security.spec.ECGenParameterSpec
import java.time.Instant
import java.util.Base64
import java.util.Date
import java.util.UUID
import java.util.logging.Logger

internal object AndroidPlatformSeal {
    private const val ATTESTATION_OID = "1.3.6.1.4.1.11129.2.1.17"
    // SHA-256 of the two Google hardware attestation root DER certificates published at
    // https://developer.android.com/privacy-and-security/security-key-attestation
    private val ROOT_SHA256 = setOf(
        "cedb1cb6dc896ae5ec797348bce9286753c2b38ee71ce0fbe34a9a1248800dfc",
        "6d9db4ce6c5c0b293166d08986e05774a8776ceb525d9e4329520de12ba4bcc0"
    )
    private val logger = Logger.getLogger(AndroidPlatformSeal::class.java.name)

    private fun sha256(bytes: ByteArray): ByteArray = MessageDigest.getInstance("SHA-256").digest(bytes)
    private fun hex(bytes: ByteArray): String = bytes.joinToString("") { "%02x".format(it) }

    /** Returns only attested hardware-backed keys; failures are nonfatal to archive export. */
    fun create(manifestHash: ByteArray, payload: ByteArray, timestamp: Long): JSONObject? {
        if (Build.VERSION.SDK_INT < 26) return null
        return chooseCandidate(
            strongBox = { if (Build.VERSION.SDK_INT >= 28) createCandidate(manifestHash, payload, timestamp, true) else null },
            tee = { createCandidate(manifestHash, payload, timestamp, false) }
        )
    }

    internal fun chooseCandidate(strongBox: () -> JSONObject?, tee: () -> JSONObject?): JSONObject? =
        strongBox() ?: tee()

    private fun createCandidate(manifestHash: ByteArray, payload: ByteArray, timestamp: Long, strongBox: Boolean): JSONObject? {
        val alias = "lukuid-archive-seal-${UUID.randomUUID()}"
        try {
                val spec = KeyGenParameterSpec.Builder(alias, KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY)
                    .setAlgorithmParameterSpec(ECGenParameterSpec("secp256r1"))
                    .setDigests(KeyProperties.DIGEST_SHA256)
                    .setAttestationChallenge(manifestHash)
                    .apply { if (Build.VERSION.SDK_INT >= 28) setIsStrongBoxBacked(strongBox) }
                    .build()
                val generator = KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_EC, "AndroidKeyStore")
                generator.initialize(spec)
                val pair = generator.generateKeyPair()
                val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
                val chain = keyStore.getCertificateChain(alias)?.map { it as X509Certificate }.orEmpty()
                val level = validateChain(chain, manifestHash, timestamp) ?: return null
                if (strongBox && level != "strongbox") return null
                val signer = Signature.getInstance("SHA256withECDSA")
                signer.initSign(pair.private)
                signer.update(payload)
                val signature = derToP1363(signer.sign())
                val publicKey = pair.public.encoded
                val seal = JSONObject()
                    .put("type", "platform")
                    .put("platform", "android")
                    .put("alg", "ES256")
                    .put("created_at_utc", timestamp)
                    .put("key_id", hex(sha256(publicKey)))
                    .put("public_key", Base64.getEncoder().encodeToString(publicKey))
                    .put("certificate_chain", JSONArray(chain.map { Base64.getEncoder().encodeToString(it.encoded) }))
                    .put("metadata", JSONObject().put("security_level", level))
                    .put("signature", Base64.getEncoder().encodeToString(signature))
                return if (verify(seal, manifestHash, payload)) seal else null
        } catch (error: Exception) {
            logger.fine("Android ${if (strongBox) "StrongBox" else "TEE"} archive seal unavailable: ${error.javaClass.simpleName}")
        } finally {
            try { KeyStore.getInstance("AndroidKeyStore").apply { load(null) }.deleteEntry(alias) }
            catch (_: Exception) { /* The key was not created, or cleanup is unavailable. */ }
        }
        return null
    }

    fun verify(seal: JSONObject, manifestHash: ByteArray, payload: ByteArray): Boolean =
        verifyWithRoots(seal, manifestHash, payload, ROOT_SHA256)

    internal fun verifyWithRoots(seal: JSONObject, manifestHash: ByteArray, payload: ByteArray, roots: Set<String>): Boolean {
        return try {
        if (seal.getString("type") != "platform" || seal.getString("platform") != "android" ||
            seal.getString("alg") != "ES256") return false
        val timestamp = seal.getLong("created_at_utc")
        if (timestamp < 0) return false
        val publicKey = Base64.getDecoder().decode(seal.getString("public_key"))
        val signature = Base64.getDecoder().decode(seal.getString("signature"))
        if (Base64.getEncoder().encodeToString(publicKey) != seal.getString("public_key") ||
            Base64.getEncoder().encodeToString(signature) != seal.getString("signature")) return false
        if (signature.size != 64 || seal.getString("key_id") != hex(sha256(publicKey))) return false
        val encodedChain = seal.getJSONArray("certificate_chain")
        if (encodedChain.length() < 2 || encodedChain.length() > 12) return false
        val factory = CertificateFactory.getInstance("X.509")
        val chain = (0 until encodedChain.length()).map { index ->
            val source = encodedChain.getString(index)
            val bytes = Base64.getDecoder().decode(source)
            require(Base64.getEncoder().encodeToString(bytes) == source)
            val certificate = factory.generateCertificate(ByteArrayInputStream(bytes)) as X509Certificate
            require(certificate.encoded.contentEquals(bytes))
            certificate
        }
        if (!chain[0].publicKey.encoded.contentEquals(publicKey)) return false
        val ecKey = chain[0].publicKey as? ECPublicKey ?: return false
        if (ecKey.params.curve.field.fieldSize != 256) return false
        val level = validateChain(chain, manifestHash, timestamp, roots) ?: return false
        if (seal.optJSONObject("metadata")?.optString("security_level") != level) return false
        val verifier = Signature.getInstance("SHA256withECDSA")
        verifier.initVerify(chain[0].publicKey)
        verifier.update(payload)
        verifier.verify(p1363ToDer(signature))
        } catch (_: Exception) { false }
    }

    private fun validateChain(chain: List<X509Certificate>, manifestHash: ByteArray, timestamp: Long, roots: Set<String> = ROOT_SHA256): String? {
        if (chain.size < 2 || chain.size > 12 || timestamp < 0) return null
        val root = chain.last()
        if (hex(sha256(root.encoded)) !in roots) return null
        root.verify(root.publicKey)
        val at = Date.from(Instant.ofEpochSecond(timestamp))
        for (index in chain.indices) {
            chain[index].checkValidity(at)
            if (index > 0) {
                if (chain[index].basicConstraints < 0) return null
                val usage = chain[index].keyUsage
                if (usage != null && (usage.size <= 5 || !usage[5])) return null
            }
            if (index < chain.lastIndex) {
                if (chain[index].issuerX500Principal != chain[index + 1].subjectX500Principal) return null
                chain[index].verify(chain[index + 1].publicKey)
            }
        }
        // The first attestation extension nearest the root must be on the leaf. Reject chains
        // with an intermediate attestation extension rather than trusting an attacker-added leaf.
        if (chain.drop(1).any { it.getExtensionValue(ATTESTATION_OID) != null }) return null
        val extension = chain[0].getExtensionValue(ATTESTATION_OID) ?: return null
        val octets = ASN1OctetString.getInstance(ASN1Primitive.fromByteArray(extension)).octets
        val description = ASN1Sequence.getInstance(ASN1Primitive.fromByteArray(octets))
        if (description.size() < 8) return null
        val attestationLevel = ASN1Enumerated.getInstance(description.getObjectAt(1)).value.toInt()
        val keyLevel = ASN1Enumerated.getInstance(description.getObjectAt(3)).value.toInt()
        if (attestationLevel !in 1..2 || keyLevel != attestationLevel) return null
        if (!ASN1OctetString.getInstance(description.getObjectAt(4)).octets.contentEquals(manifestHash)) return null
        val hardware = ASN1Sequence.getInstance(description.getObjectAt(7))
        if (taggedInteger(hardware, 2) != 3 || taggedInteger(hardware, 3) != 256 || taggedInteger(hardware, 702) != 0) return null
        if (!taggedSet(hardware, 1).contains(ASN1Integer(2)) || !taggedSet(hardware, 5).contains(ASN1Integer(4))) return null
        return if (attestationLevel == 2) "strongbox" else "tee"
    }

    private fun taggedInteger(sequence: ASN1Sequence, tag: Int): Int? = (0 until sequence.size())
        .map { ASN1TaggedObject.getInstance(sequence.getObjectAt(it)) }
        .firstOrNull { it.tagNo == tag }
        ?.let { ASN1Integer.getInstance(it, true).value.toInt() }

    private fun taggedSet(sequence: ASN1Sequence, tag: Int): ASN1Set = (0 until sequence.size())
        .map { ASN1TaggedObject.getInstance(sequence.getObjectAt(it)) }
        .first { it.tagNo == tag }
        .let { ASN1Set.getInstance(it, true) }

    private fun derToP1363(der: ByteArray): ByteArray {
        val sequence = ASN1Sequence.getInstance(ASN1Primitive.fromByteArray(der))
        require(sequence.size() == 2)
        val result = ByteArray(64)
        for (index in 0..1) {
            val value = ASN1Integer.getInstance(sequence.getObjectAt(index)).positiveValue.toByteArray()
            require(value.size <= 33)
            val stripped = if (value.size == 33 && value[0] == 0.toByte()) value.copyOfRange(1, 33) else value
            require(stripped.size <= 32)
            stripped.copyInto(result, index * 32 + 32 - stripped.size)
        }
        return result
    }

    private fun p1363ToDer(raw: ByteArray): ByteArray {
        require(raw.size == 64)
        return DERSequence(arrayOf(
            ASN1Integer(BigInteger(1, raw.copyOfRange(0, 32))),
            ASN1Integer(BigInteger(1, raw.copyOfRange(32, 64)))
        )).encoded
    }
}
