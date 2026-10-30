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
// exactly 32 bytes must carry SHA-256 of the device's raw Ed25519 public key,
// and match genesis_hash if present. Independent of the (reissuable) DAC.
class GenesisRecordTest {
    private val random = SecureRandom()
    private fun bytes(n: Int) = ByteArray(n).also { random.nextBytes(it) }
    private fun b64(value: ByteArray) = Base64.getEncoder().encodeToString(value)

    private val publicKey = bytes(32)
    private val publicKeyB64 = b64(publicKey)
    private val keyHash = b64(MessageDigest.getInstance("SHA-256").digest(publicKey))

    @Test
    fun acceptsGenesisAnchoredToPublicKeyWithGenesisHash() {
        assertNull(genesisRecordIssue(keyHash, keyHash, publicKeyB64, "LUK-GENESIS"))
    }

    @Test
    fun acceptsGenesisAnchoredToPublicKeyWithoutGenesisHash() {
        assertNull(genesisRecordIssue(keyHash, "", publicKeyB64, "LUK-GENESIS"))
    }

    @Test
    fun rejects32BytePreviousSignatureNotMatchingPublicKey() {
        val issue = genesisRecordIssue(b64(bytes(32)), "", publicKeyB64, "LUK-GENESIS")
        assertEquals("GENESIS_HASH_MISMATCH", issue?.code)
        assertTrue(issue!!.message.contains("SHA-256 of its public key"))
    }

    @Test
    fun rejectsGenesisWithoutValidPublicKey() {
        val issue = genesisRecordIssue(keyHash, keyHash, b64(bytes(31)), "LUK-GENESIS")
        assertTrue(issue!!.message.contains("public key missing or invalid"))
    }

    @Test
    fun rejectsGenesisHashDifferingFromPreviousSignature() {
        val issue = genesisRecordIssue(keyHash, b64(bytes(32)), publicKeyB64, "LUK-GENESIS")
        assertTrue(issue!!.message.contains("genesis_hash that does not match previous_signature"))
    }

    @Test
    fun sixtyFourBytePreviousSignatureIsNotGenesis() {
        assertNull(genesisRecordIssue(b64(bytes(64)), "genesis_fake", publicKeyB64, "LUK-GENESIS"))
    }
}
