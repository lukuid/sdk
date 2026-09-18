// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk

import com.lukuid.sdk.internal.JsonUtils
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.security.KeyPairGenerator
import java.security.Signature
import java.util.Base64

class AnimalScanMetricsTest {

    private fun generateEd25519KeyPair(): Pair<java.security.PrivateKey, String> {
        val kpg = KeyPairGenerator.getInstance("Ed25519")
        val kp = kpg.generateKeyPair()
        val pubBytes = kp.public.encoded.takeLast(32).toByteArray()
        val pubB64 = Base64.getEncoder().encodeToString(pubBytes)
        return Pair(kp.private, pubB64)
    }

    private fun buildValidScanEnvelope(
        metrics: List<Double> = listOf(38.5, 45.0, -65.0, 12.0, 5.0, 120.0, 2.0, 3300.0, 10.0, 11.0, 1.0, 2000.0, 50.0, 1.2, 1.0, 5.0, -2.0, 0.0),
        scanVersion: String = "1.0.0",
        profile: String = "animal"
    ): Pair<JSONObject, java.security.PrivateKey> {
        val (privKey, pubB64) = generateEd25519KeyPair()
        val deviceId = "LUKUID-ANIMAL-READER-001"

        val payload = JSONObject()
        payload.put("ctr", 1001)
        payload.put("timestamp_utc", 1770823456L)
        payload.put("uptime_us", 120000000L)
        payload.put("nonce", "test_challenge_nonce")
        payload.put("firmware", "AR-v1.0.0")
        payload.put("profile", profile)
        payload.put("protocol", "FDX-B")
        payload.put("scan_version", scanVersion)
        payload.put("tag_id", "981098109810981")
        payload.put("temperature_c", 38.5)
        payload.put("metrics", JSONArray(metrics))

        val formattedMetrics = metrics.joinToString(",") { String.format(java.util.Locale.US, "%.2f", it) }
        val contentStr = "FDX-B:$scanVersion:981098109810981:38.50"
        val canonicalStr = "$deviceId:$pubB64:scan:SCAN-REC-001:1001:1770823456:120000000:$profile:test_challenge_nonce:AR-v1.0.0:$contentStr:$formattedMetrics:"

        val sigEngine = Signature.getInstance("Ed25519")
        sigEngine.initSign(privKey)
        sigEngine.update(canonicalStr.toByteArray(Charsets.UTF_8))
        val sigB64 = Base64.getEncoder().encodeToString(sigEngine.sign())

        val envelope = JSONObject()
        envelope.put("type", "scan")
        envelope.put("id", "SCAN-REC-001")
        envelope.put("version", "1.0.0")
        envelope.put("alg", "ED25519")
        envelope.put("signature", sigB64)
        envelope.put("previous_signature", "")
        envelope.put("canonical_string", canonicalStr)
        val devObj = JSONObject()
        devObj.put("vendor", "LUKUID")
        devObj.put("device_id", deviceId)
        devObj.put("public_key", pubB64)
        envelope.put("device", devObj)
        envelope.put("payload", payload)

        return Pair(envelope, privKey)
    }

    private fun verifyEnv(envelope: JSONObject, opts: LukuVerifyOptions = LukuVerifyOptions(allowUntrustedRoots = true, trustProfile = "dev")): List<VerificationIssue> {
        val map = JsonUtils.fromJson(envelope)
        return LukuFile.verifyEnvelope(map, opts)
    }

    @Test
    fun testMetricsSurviveVerificationUnchanged() {
        val (envelope, _) = buildValidScanEnvelope()
        val issues = verifyEnv(envelope)
        val criticals = issues.filter { it.criticality == Criticality.CRITICAL }
        assertEquals("Expected 0 critical issues, got $criticals", 0, criticals.size)
    }

    @Test
    fun testSingleMetricValueMutationFailsClosed() {
        // Test index 0
        val (env0, _) = buildValidScanEnvelope()
        env0.getJSONObject("payload").getJSONArray("metrics").put(0, 99.0)
        val issues0 = verifyEnv(env0)
        assertTrue("Metric[0] mutation must fail closed", issues0.any { it.code == "RECORD_CANONICAL_MISMATCH" })

        // Test middle index
        val (envMid, _) = buildValidScanEnvelope()
        envMid.getJSONObject("payload").getJSONArray("metrics").put(8, 99.0)
        val issuesMid = verifyEnv(envMid)
        assertTrue("Metric[middle] mutation must fail closed", issuesMid.any { it.code == "RECORD_CANONICAL_MISMATCH" })

        // Test last index
        val (envLast, _) = buildValidScanEnvelope()
        val len = envLast.getJSONObject("payload").getJSONArray("metrics").length()
        envLast.getJSONObject("payload").getJSONArray("metrics").put(len - 1, 99.0)
        val issuesLast = verifyEnv(envLast)
        assertTrue("Metric[last] mutation must fail closed", issuesLast.any { it.code == "RECORD_CANONICAL_MISMATCH" })
    }

    @Test
    fun testMetricRemovalInsertionTruncationReorderingFailsClosed() {
        // Removal / Truncation
        val (envTrunc, _) = buildValidScanEnvelope()
        val mTrunc = JSONArray()
        val origArr = envTrunc.getJSONObject("payload").getJSONArray("metrics")
        for (i in 0 until origArr.length() - 1) {
            mTrunc.put(origArr.get(i))
        }
        envTrunc.getJSONObject("payload").put("metrics", mTrunc)
        val issuesTrunc = verifyEnv(envTrunc)
        assertTrue("Truncation must fail closed", issuesTrunc.any { it.code == "RECORD_CANONICAL_MISMATCH" })

        // Insertion / Append
        val (envApp, _) = buildValidScanEnvelope()
        envApp.getJSONObject("payload").getJSONArray("metrics").put(99.0)
        val issuesApp = verifyEnv(envApp)
        assertTrue("Append must fail closed", issuesApp.any { it.code == "RECORD_CANONICAL_MISMATCH" })

        // Reordering / Swapping two metrics
        val (envSwap, _) = buildValidScanEnvelope()
        val mSwap = envSwap.getJSONObject("payload").getJSONArray("metrics")
        val v0 = mSwap.getDouble(0)
        val v1 = mSwap.getDouble(1)
        mSwap.put(0, v1)
        mSwap.put(1, v0)
        val issuesSwap = verifyEnv(envSwap)
        assertTrue("Metric swapping must fail closed", issuesSwap.any { it.code == "RECORD_CANONICAL_MISMATCH" })
    }

    @Test
    fun testUnknownScanProfileOrSchemaFailsClosed() {
        val (envUnknown, _) = buildValidScanEnvelope(profile = "unknown_profile_v99")
        val issues = verifyEnv(envUnknown)
        assertTrue("Unrecognized profile must trigger RECORD_SCHEMA_UNRECOGNIZED",
            issues.any { it.code == "RECORD_SCHEMA_UNRECOGNIZED" && it.criticality == Criticality.CRITICAL })
    }

    @Test
    fun testCanonicalReconstructionMatchesKnownFirmwareFixture() {
        val payload = JSONObject()
        payload.put("temperature_c", 38.5)
        payload.put("tag_id", "981098109810981")
        payload.put("scan_version", "1.0.0")
        payload.put("protocol", "FDX-B")
        payload.put("firmware", "AR-1.5.0")
        payload.put("nonce", "marketplace_challenge_token_xyz")
        payload.put("profile", "animal")
        payload.put("uptime_us", 120000000L)
        payload.put("timestamp_utc", 1770823456L)
        payload.put("ctr", 4501)
        payload.put("metrics", JSONArray(listOf(38.5, 45, -65, 12, 5, 120, 2, 3300, 10, 11, 1, 2000, 50, 1.2, 1, 5, -2, 0)))

        val record = JSONObject()
        record.put("type", "scan")
        record.put("id", "LUKUID-1770823456-4501-981098109810981")
        record.put("payload", payload)

        val expected = "LUK-1005-EU:base64_device_public_key:scan:LUKUID-1770823456-4501-981098109810981:4501:1770823456:120000000:animal:marketplace_challenge_token_xyz:AR-1.5.0:FDX-B:1.0.0:981098109810981:38.50:38.50,45.00,-65.00,12.00,5.00,120.00,2.00,3300.00,10.00,11.00,1.00,2000.00,50.00,1.20,1.00,5.00,-2.00,0.00:sha256_of_factory_dac"

        val actual = LukuArchive.recomputeRecordCanonicalString(
            record, payload, "LUK-1005-EU", "base64_device_public_key", "sha256_of_factory_dac"
        )
        assertEquals(expected, actual)
    }
}
