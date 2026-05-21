// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk

import com.lukuid.sdk.internal.LukuCodec
import com.lukuid.sdk.proto.LukuIDProto
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.security.KeyPairGenerator
import java.security.Signature
import java.util.Base64

class GuardCardVocTest {
    private val magic = byteArrayOf(0x4C, 0x55, 0x4B, 0x55, 0x49, 0x44, 0x01, 0x7E)

    @Test
    fun testDecoderMapsVocRawAndVocIndexFromEnvironmentFrames() {
        val payload = LukuIDProto.EnvironmentPayload.newBuilder()
            .setCtr(4502)
            .setTimestampUtc(1770823456)
            .setVocRaw(30000)
            .setVocIndex(137)
            .build()
        val envRecord = LukuIDProto.EnvironmentRecord.newBuilder()
            .setVersion("1.0.0")
            .setEventId("ENV-VOC-1")
            .setCanonicalString("env-voc-canonical")
            .setPayload(payload)
            .build()
        val response = LukuIDProto.CommandResponse.newBuilder()
            .setStatus(LukuIDProto.Status.STATUS_OK)
            .setSuccess(true)
            .setEnvRecord(envRecord)
            .build()

        var decoded: Map<String, Any?>? = null
        val codec = LukuCodec(
            onMessage = { decoded = it },
            onError = { throw it }
        )
        codec.feed(frame(response.toByteArray()))

        val envMap = decoded?.get("env_record") as Map<*, *>
        val envPayload = envMap["payload"] as Map<*, *>
        assertEquals(30000, envPayload["voc_raw"])
        assertEquals(137, envPayload["voc_index"])
        assertEquals("env-voc-canonical", envMap["canonical_string"])
    }

    @Test
    fun testVerifyEnvelopeAcceptsNewVocCanonicalAndRejectsOldFormat() {
        val keyPair = KeyPairGenerator.getInstance("Ed25519").generateKeyPair()
        val publicKeyRaw = keyPair.public.encoded.copyOfRange(keyPair.public.encoded.size - 32, keyPair.public.encoded.size)
        val publicKeyBase64 = Base64.getEncoder().encodeToString(publicKeyRaw)
        val canonical = "GC-TEST-1:$publicKeyBase64:environment:ENV-VOC-1:4502:1770823456:3600000000:85:false:350.50:22.40:45.20:1013.20:30000:110:false:0.01:0.02:1.00:genesis_fake"
        val signature = signCanonical(keyPair.private.encoded, canonical)

        val envelope = mapOf(
            "type" to "environment",
            "event_id" to "ENV-VOC-1",
            "device_id" to "GC-TEST-1",
            "public_key" to publicKeyBase64,
            "signature" to signature,
            "previous_signature" to "genesis_fake",
            "canonical_string" to canonical,
            "payload" to mapOf(
                "ctr" to 4502,
                "timestamp_utc" to 1770823456,
                "uptime_us" to 3600000000L,
                "battery_percent" to 85,
                "vbus_present" to false,
                "lux" to 350.5,
                "temp_c" to 22.4,
                "humidity_pct" to 45.2,
                "pressure_hpa" to 1013.2,
                "voc_raw" to 30000,
                "voc_index" to 110,
                "tamper" to false,
                "accel_g" to mapOf("x" to 0.01, "y" to 0.02, "z" to 1.0),
                "genesis_hash" to "genesis_fake"
            )
        )

        val validIssues = LukuFile.verifyEnvelope(envelope, LukuVerifyOptions(
            allowUntrustedRoots = true,
            skipCertificateTemporalChecks = true,
            trustProfile = "dev"
        ))
        assertTrue(validIssues.isEmpty())

        val oldCanonical = "GC-TEST-1:$publicKeyBase64:environment:ENV-VOC-1:4502:1770823456:3600000000:85:false:350.50:22.40:45.20:1013.20:110:false:0.01:0.02:1.00:genesis_fake"
        val invalidIssues = LukuFile.verifyEnvelope(
            envelope + mapOf("canonical_string" to oldCanonical),
            LukuVerifyOptions(
                allowUntrustedRoots = true,
                skipCertificateTemporalChecks = true,
                trustProfile = "dev"
            )
        )
        assertTrue(invalidIssues.any { it.code == "RECORD_SIGNATURE_INVALID" })
    }

    private fun frame(payload: ByteArray): ByteArray {
        val out = ByteBuffer.allocate(magic.size + 4 + payload.size + magic.size).order(ByteOrder.LITTLE_ENDIAN)
        out.put(magic)
        out.putInt(payload.size)
        out.put(payload)
        out.put(magic)
        return out.array()
    }

    private fun signCanonical(privateKeyEncoded: ByteArray, canonical: String): String {
        val keyFactory = java.security.KeyFactory.getInstance("Ed25519")
        val privateKey = keyFactory.generatePrivate(java.security.spec.PKCS8EncodedKeySpec(privateKeyEncoded))
        val signer = Signature.getInstance("Ed25519")
        signer.initSign(privateKey)
        signer.update(canonical.toByteArray())
        return Base64.getEncoder().encodeToString(signer.sign())
    }
}
