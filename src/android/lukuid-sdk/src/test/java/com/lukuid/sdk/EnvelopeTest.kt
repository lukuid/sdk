// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk

import org.json.JSONObject
import org.junit.Assert.assertTrue
import org.junit.Test
import java.nio.charset.StandardCharsets
import java.util.Base64
import java.io.File
import com.lukuid.sdk.internal.JsonUtils

class EnvelopeTest {

    private fun getValidEnvelopeStr(): String {
        val file = java.io.File("../../../samples/envelopes/dev/1.0.0/valid_envelope.json")
        return file.readText()
    }
    @Test
    fun testVerifyEnvelopeValid() {
        val json = JSONObject(getValidEnvelopeStr())
        val map = JsonUtils.fromJson(json)
        val issues = LukuFile.verifyEnvelope(map, LukuVerifyOptions(
            allowUntrustedRoots = false,
            skipCertificateTemporalChecks = true,
            trustProfile = "dev"
        ))
        assertTrue("Expected no issues, got ${issues.joinToString { it.code + ":" + it.message }}", issues.isEmpty())
    }

    @Test
    fun testVerifyEnvelopeInvalidSignature() {
        val json = JSONObject(getValidEnvelopeStr())
        json.put("signature", Base64.getEncoder().encodeToString(ByteArray(64)))
        val map = JsonUtils.fromJson(json)

        val issues = LukuFile.verifyEnvelope(map, LukuVerifyOptions(
            allowUntrustedRoots = false,
            skipCertificateTemporalChecks = true,
            trustProfile = "dev"
        ))
        assertTrue(issues.any { it.code == "RECORD_SIGNATURE_INVALID" })
    }

    @Test
    fun testVerifyEnvelopeMissingIdentity() {
        val json = JSONObject(getValidEnvelopeStr())
        json.remove("device")
        json.remove("device_id")
        json.remove("public_key")
        val map = JsonUtils.fromJson(json)

        val issues = LukuFile.verifyEnvelope(map, LukuVerifyOptions(
            allowUntrustedRoots = false,
            skipCertificateTemporalChecks = true,
            trustProfile = "dev"
        ))
        assertTrue(issues.any { it.code == "DEVICE_IDENTITY_MISSING" })
    }

    @Test
    fun testVerifyEnvelopeInvalidDac() {
        val json = JSONObject(getValidEnvelopeStr())
        json.put("attestation_intermediate_der", Base64.getEncoder().encodeToString("bad_cert".toByteArray()))
        val map = JsonUtils.fromJson(json)

        val issues = LukuFile.verifyEnvelope(map, LukuVerifyOptions(
            allowUntrustedRoots = false,
            skipCertificateTemporalChecks = true,
            trustProfile = "dev"
        ))
        assertTrue(issues.any { it.code == "ATTESTATION_FAILED" })
    }

    @Test
    fun testVerifyEnvelopeInvalidCanonicalString() {
        val json = JSONObject(getValidEnvelopeStr())
        json.put("canonical_string", "tampered:canonical:string")
        val map = JsonUtils.fromJson(json)

        val issues = LukuFile.verifyEnvelope(map, LukuVerifyOptions(
            allowUntrustedRoots = false,
            skipCertificateTemporalChecks = true,
            trustProfile = "dev"
        ))
        assertTrue(issues.any { it.code == "RECORD_SIGNATURE_INVALID" })
    }

    @Test
    fun testVerifyEnvelopeTamperedMldsaSignature() {
        val json = JSONObject(getValidEnvelopeStr())
        val derBase64 = json.getString("attestation_intermediate_der")
        val der = Base64.getDecoder().decode(derBase64)
        // Tamper with the last byte of the signature (which is at the end of the DER)
        der[der.size - 1] = (der[der.size - 1].toInt() xor 0xFF).toByte()
        json.put("attestation_intermediate_der", Base64.getEncoder().encodeToString(der))
        val map = JsonUtils.fromJson(json)

        val issues = LukuFile.verifyEnvelope(map, LukuVerifyOptions(
            allowUntrustedRoots = false,
            skipCertificateTemporalChecks = true,
            trustProfile = "dev"
        ))
        assertTrue("Expected ATTESTATION_FAILED due to tampered signature", issues.any { it.code == "ATTESTATION_FAILED" })
    }

    @Test
    fun testVerifyEnvelopeWrongRoot() {
        val json = JSONObject(getValidEnvelopeStr())
        // Remove the intermediate so it tries to verify DAC against roots directly (and fails because it's signed by intermediate)
        json.remove("attestation_intermediate_der")
        val identity = json.optJSONObject("identity")
        if (identity != null) {
            identity.remove("attestation_intermediate_der")
            json.put("identity", identity)
        }
        val map = JsonUtils.fromJson(json)

        val issues = LukuFile.verifyEnvelope(map, LukuVerifyOptions(
            allowUntrustedRoots = false,
            skipCertificateTemporalChecks = true,
            trustProfile = "dev"
        ))
        assertTrue("Expected ATTESTATION_FAILED due to missing/wrong root chain", issues.any { it.code == "ATTESTATION_FAILED" })
    }

    @Test
    fun testVerifyEnvelopeMalformedSpki() {
        val json = JSONObject(getValidEnvelopeStr())
        val derBase64 = json.getString("attestation_intermediate_der")
        val der = Base64.getDecoder().decode(derBase64)
        // Search for a sequence that looks like ML-DSA-65 OID or similar and mess it up
        // Or just mess up the middle of the cert where SPKI usually is
        for (i in 100..200) { der[i] = 0x00 }
        json.put("attestation_intermediate_der", Base64.getEncoder().encodeToString(der))
        val map = JsonUtils.fromJson(json)

        val issues = LukuFile.verifyEnvelope(map, LukuVerifyOptions(
            allowUntrustedRoots = false,
            skipCertificateTemporalChecks = true,
            trustProfile = "dev"
        ))
        assertTrue("Expected ATTESTATION_FAILED or similar due to malformed SPKI", issues.any { it.code == "ATTESTATION_FAILED" })
    }

    @Test
    fun testVerifyEnvelopeMalformedTbs() {
        val json = JSONObject(getValidEnvelopeStr())
        val derBase64 = json.getString("attestation_intermediate_der")
        val der = Base64.getDecoder().decode(derBase64)
        // Mess up the start of the TBS SEQUENCE
        der[4] = 0xFF.toByte()
        der[5] = 0xFF.toByte()
        json.put("attestation_intermediate_der", Base64.getEncoder().encodeToString(der))
        val map = JsonUtils.fromJson(json)

        val issues = LukuFile.verifyEnvelope(map, LukuVerifyOptions(
            allowUntrustedRoots = false,
            skipCertificateTemporalChecks = true,
            trustProfile = "dev"
        ))
        assertTrue("Expected ATTESTATION_FAILED due to malformed TBS", issues.any { it.code == "ATTESTATION_FAILED" })
    }
}
