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

    private fun verifyEvent(event: JSONObject): LukuItemResult {
        val errors = mutableListOf<String>()
        var isVerified = false
        val type = event.optString("type", "unknown")

        if (type == "scan") {
            isVerified = verifyScanEvent(event, errors)
        } else if (type == "attachment") {
            isVerified = true // Simplified
        } else {
            errors.add("Unknown event type: $type")
        }

        return LukuItemResult(
            type = type,
            verified = isVerified,
            payload = JsonUtils.fromJson(event),
            errors = if (errors.isEmpty()) null else errors
        )
    }

    private fun verifyScanEvent(event: JSONObject, errors: MutableList<String>): Boolean {
        val device = event.optJSONObject("device")
        val deviceId = device?.optString("device_id") ?: ""
        val publicKey = device?.optString("public_key") ?: ""
        val signature = event.optString("signature", "")
        
        val identity = event.optJSONObject("identity")
        val dacPem = identity?.optString("dac_pem")
        
        val created = if (identity?.has("created") == true) identity.optLong("created") 
            else event.optJSONObject("dac")?.optLong("created")

        val input = DeviceAttestationInput(
            id = deviceId,
            key = publicKey,
            attestationSig = signature,
            certificateChain = dacPem,
            created = if (created != null && created > 0) created else null
        )

        var ok = true
        val result = verifyDeviceAttestation(input)
        if (!result.ok) {
            errors.add("Root attestation failed: ${result.reason}")
            ok = false
        }
        
        // 2. Operational SLAC Verification
        val slacPem = identity?.optString("slac_pem")
        if (!slacPem.isNullOrEmpty()) {
            val slacSig = identity.optString("signature", "")
            val slacResult = verifyDeviceAttestation(DeviceAttestationInput(
                id = deviceId,
                key = publicKey,
                attestationSig = slacSig,
                certificateChain = slacPem,
                created = null
            ))
            if (!slacResult.ok) {
                errors.add("Operational attestation (SLAC) failed: ${slacResult.reason}")
            }
        }
        
        return ok
    }
}
