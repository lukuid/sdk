package com.lukuid.sdk

import org.json.JSONObject
import org.junit.Test
import com.lukuid.sdk.internal.JsonUtils

class DebugCanonicalTest {
    @Test
    fun debugPrint() {
        val file = java.io.File("../../../samples/envelopes/dev/1.0.0/valid_envelope.json")
        val json = JSONObject(file.readText())
        val map = JsonUtils.fromJson(json)
        val envelope = JSONObject(map)
        val payload = envelope.optJSONObject("payload") ?: JSONObject()
        val device = envelope.optJSONObject("device")
        val deviceId = envelope.optString("device_id").takeIf { it.isNotEmpty() } ?: device?.optString("device_id") ?: ""
        val publicKey = envelope.optString("public_key").takeIf { it.isNotEmpty() } ?: device?.optString("public_key") ?: ""
        val previousSignature = envelope.optString("previous_signature", "")
        val recomputed = LukuArchive.recomputeRecordCanonicalString(envelope, payload, deviceId, publicKey, previousSignature)
        println("RECOMPUTED=$recomputed")
        println("STORED=${envelope.optString("canonical_string")}")
        println("PAYLOAD_ACCEL=${payload.opt("accel_g")}")
    }
}
