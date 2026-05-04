// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk.internal

import org.junit.Assert.*
import org.junit.Test
import java.util.Base64

class DeviceAttestationTest {

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
}
