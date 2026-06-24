// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk.internal

import org.junit.Assert.*
import org.junit.Test
import org.json.JSONObject
import java.io.File
import java.util.Base64

class DeviceAttestationTest {

    private fun getValidEnvelope(): JSONObject {
        return JSONObject(File("../../../samples/envelopes/dev/1.0.0/valid_envelope.json").readText())
    }

    private fun pemFromDerBase64(value: String): String {
        return "-----BEGIN CERTIFICATE-----\n" +
            value.chunked(64).joinToString("\n") +
            "\n-----END CERTIFICATE-----\n"
    }

    @Test
    fun `fails when signature is missing`() {
        val input = DeviceAttestationInput(
            id = "u1",
            key = "pk1",
            attestationSig = "",
            attestationAlg = "Ed25519",
            attestationPayloadVersion = 1
        )
        val result = verifyDeviceAttestation(input)
        assertFalse(result.ok)
        assertEquals("attestationSig missing", result.reason)
    }

    @Test
    fun `fails when signature is invalid base64`() {
        val input = DeviceAttestationInput(
            id = "u1",
            key = "pk1",
            attestationSig = "not-base64",
            attestationAlg = "Ed25519",
            attestationPayloadVersion = 1
        )
        val result = verifyDeviceAttestation(input)
        assertFalse(result.ok)
        assertEquals("attestationSig is not valid base64", result.reason)
    }

    @Test
    fun `fails when signature length is wrong`() {
        // "AAAA" is 3 bytes decoded
        val input = DeviceAttestationInput(
            id = "u1",
            key = "pk1",
            attestationSig = "AAAA",
            attestationAlg = "Ed25519",
            attestationPayloadVersion = 1
        )
        val result = verifyDeviceAttestation(input)
        assertFalse(result.ok)
        assertEquals("Attestation verification failed", result.reason)
    }

    @Test
    fun `fails when certificate is revoked`() {
        val rm = io.mockk.mockk<RevocationManager>()
        io.mockk.every { rm.isRevoked(any()) } returns true
        
        val input = DeviceAttestationInput(
            id = "u1",
            key = "pk1",
            attestationSig = Base64.getEncoder().encodeToString(ByteArray(64)),
            certificateChain = """
                -----BEGIN CERTIFICATE-----
                MIHhMIGUoAMCAQICFDBuxrgcYpuheOUtSj+5MNeNceKdMAUGAytlcDARMQ8wDQYD
                VQQDDAZMdWt1SUQwHhcNMjYwNTAzMTc0NDMzWhcNMjYwNTA1MTc0NDMzWjARMQ8w
                DQYDVQQDDAZMdWt1SUQwKjAFBgMrZXADIQBTnje3eWj/vySKRmsOI1+nLqOC1fZj
                ZjhwLYult7i7MjAFBgMrZXADQQD+1kT5vGzbjsJYupiT31op66BsZHq0vQwsPaOp
                PxbF+fhDYmefcFH2KgEXgDTLu2k559JclEq3GN/a9oXUxUkN
                -----END CERTIFICATE-----
            """.trimIndent(),
            trustProfile = "prod"
        )
        
        val result = verifyDeviceAttestation(input, rm)
        assertFalse(result.ok)
        println("REASON: ${result.reason}"); assertTrue(result.reason?.contains("revoked") == true)
    }

    @Test
    fun `uses DAC start anchor instead of record time for temporal validity`() {
        val envelope = getValidEnvelope()
        val identity = envelope.getJSONObject("identity")
        val device = envelope.getJSONObject("device")
        val chain = listOf(
            envelope.getString("attestation_dac_der"),
            envelope.getString("attestation_manufacturer_der"),
            envelope.getString("attestation_intermediate_der")
        ).joinToString("") { pemFromDerBase64(it) }

        val payload = envelope.getJSONObject("payload")
        val result = verifyDeviceAttestation(
            DeviceAttestationInput(
                id = device.getString("device_id"),
                key = device.getString("public_key"),
                attestationSig = identity.optString("dac_signature", identity.optString("signature", "")),
                vendor = device.optString("vendor", null),
                ctr = if (payload.has("ctr")) payload.getLong("ctr") else null,
                recordId = envelope.optString("id", null),
                certificateChain = chain,
                created = 4102444800L,
                trustProfile = "dev"
            )
        )

        assertTrue("unexpected attestation failure: ${result.reason}", result.ok)
    }
}
