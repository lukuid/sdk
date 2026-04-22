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
    fun `fails verification with bad signature`() {
        val zeros = ByteArray(64)
        val sig = Base64.getEncoder().encodeToString(zeros)
        val input = DeviceAttestationInput(
            id = "u1",
            key = "pk1",
            attestationSig = sig,
            attestationAlg = "Ed25519",
            attestationPayloadVersion = 1
        )
        val result = verifyDeviceAttestation(input)
        assertFalse(result.ok)
        assertEquals("Attestation verification failed", result.reason)
    }
}
