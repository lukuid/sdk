// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk

import com.lukuid.sdk.internal.JsonUtils
import org.json.JSONObject
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

class LukuIDEnvironmentParityTest {

    private fun getValidEnvelopeStr(): String {
        val file = File("../../../samples/envelopes/dev/1.0.0/valid_envelope.json")
        return file.readText()
    }

    private fun verify(json: JSONObject): List<VerificationIssue> {
        val map = JsonUtils.fromJson(json)
        return LukuFile.verifyEnvelope(map, LukuVerifyOptions(
            allowUntrustedRoots = false,
            skipCertificateTemporalChecks = true,
            trustProfile = "dev"
        ))
    }

    @Test
    fun testMissingDetachedDacSignatureFails() {
        val json = JSONObject(getValidEnvelopeStr())
        json.remove("attestation_signature")
        json.getJSONObject("identity").remove("signature")

        val issues = verify(json)
        val summary = issues.joinToString { "${it.code}:${it.message}" }
        assertTrue(
            "Expected attestationSig missing failure, got $summary",
            issues.any { it.code == "ATTESTATION_FAILED" && it.message.contains("attestationSig missing") }
        )
    }

    @Test
    fun testHeartbeatSignatureRequiresTrustedHeartbeatTimestamp() {
        val json = JSONObject(getValidEnvelopeStr())
        val identity = json.getJSONObject("identity")
        json.put("heartbeat_signature", identity.getString("signature"))
        identity.remove("last_sync_utc")
        json.remove("last_sync_utc")

        val issues = verify(json)
        val summary = issues.joinToString { "${it.code}:${it.message}" }
        assertTrue(
            "Expected missing heartbeat timestamp failure, got $summary",
            issues.any { it.code == "ATTESTATION_FAILED" && it.message.contains("Missing trusted heartbeat timestamp") }
        )
    }

    @Test
    fun testHeartbeatSignatureMustMatchHeartbeatPayload() {
        val json = JSONObject(getValidEnvelopeStr())
        val identity = json.getJSONObject("identity")
        json.put("heartbeat_signature", identity.getString("signature"))
        identity.put("last_sync_utc", 1777286310L)

        val issues = verify(json)
        val summary = issues.joinToString { "${it.code}:${it.message}" }
        assertTrue(
            "Expected heartbeat payload verification failure, got $summary",
            issues.any { it.code == "ATTESTATION_FAILED" && it.message.contains("SLAC (heartbeat)") }
        )
    }

    @Test
    fun testLastSyncCannotBeAfterRecordTimestamp() {
        val json = JSONObject(getValidEnvelopeStr())
        val identity = json.getJSONObject("identity")
        json.put("heartbeat_signature", identity.getString("signature"))
        identity.put("last_sync_utc", 1777286312L)

        val issues = verify(json)
        val summary = issues.joinToString { "${it.code}:${it.message}" }
        assertTrue(
            "Expected LAST_SYNC_AFTER_RECORD, got $summary",
            issues.any { it.code == "LAST_SYNC_AFTER_RECORD" }
        )
    }
}
