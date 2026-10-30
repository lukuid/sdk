// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk

import java.security.MessageDigest
import java.security.SecureRandom
import java.util.Base64
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

// Genesis record rule: a native record whose previous_signature is the base64 of
// exactly 32 bytes must carry SHA-256(DAC DER), and match genesis_hash if present.
class GenesisRecordTest {
    private val random = SecureRandom()
    private fun bytes(n: Int) = ByteArray(n).also { random.nextBytes(it) }
    private fun b64(value: ByteArray) = Base64.getEncoder().encodeToString(value)

    private val dac = bytes(300)
    private val dacB64 = b64(dac)
    private val dacHash = b64(MessageDigest.getInstance("SHA-256").digest(dac))

    @Test
    fun acceptsGenesisAnchoredToDacWithGenesisHash() {
        assertNull(genesisRecordIssue(dacHash, dacHash, dacB64, "LUK-GENESIS"))
    }

    @Test
    fun acceptsGenesisAnchoredToDacWithoutGenesisHash() {
        assertNull(genesisRecordIssue(dacHash, "", dacB64, "LUK-GENESIS"))
    }

    @Test
    fun rejects32BytePreviousSignatureNotMatchingDac() {
        val issue = genesisRecordIssue(b64(bytes(32)), "", dacB64, "LUK-GENESIS")
        assertEquals("GENESIS_HASH_MISMATCH", issue?.code)
        assertTrue(issue!!.message.contains("SHA-256 of its DAC"))
    }

    @Test
    fun rejectsGenesisWithoutDac() {
        val issue = genesisRecordIssue(dacHash, dacHash, null, "LUK-GENESIS")
        assertTrue(issue!!.message.contains("DAC certificate missing"))
    }

    @Test
    fun rejectsGenesisHashDifferingFromPreviousSignature() {
        val issue = genesisRecordIssue(dacHash, b64(bytes(32)), dacB64, "LUK-GENESIS")
        assertTrue(issue!!.message.contains("genesis_hash that does not match previous_signature"))
    }

    @Test
    fun sixtyFourBytePreviousSignatureIsNotGenesis() {
        assertNull(genesisRecordIssue(b64(bytes(64)), "genesis_fake", dacB64, "LUK-GENESIS"))
    }
}
