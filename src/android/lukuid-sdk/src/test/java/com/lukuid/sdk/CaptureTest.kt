// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk

import com.google.protobuf.ByteString
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test
import java.security.KeyPairGenerator
import java.security.Signature
import java.util.Base64

class CaptureTest {
    private val pair = KeyPairGenerator.getInstance("Ed25519").generateKeyPair()
    // Raw 32-byte key: the last 32 bytes of the X.509 encoding.
    private val publicKey = Base64.getEncoder().encodeToString(pair.public.encoded.takeLast(32).toByteArray())
    private val token = "app-capture-0123456789AB"

    private fun reply(nonce: String, signedCanonical: String = canonical(nonce)): Map<String, Any?> {
        val signer = Signature.getInstance("Ed25519")
        signer.initSign(pair.private)
        signer.update(signedCanonical.toByteArray())
        val record = mapOf(
            "id" to "LUKUID-1-2464-999000000000002",
            "signature" to ByteString.copyFrom(signer.sign()),
            "canonical_string" to canonical(nonce),
            "payload" to mapOf("nonce" to nonce, "tag_id" to "999000000000002")
        )
        return mapOf("full_record" to mapOf("record_id" to "LUKUID-1-2464-999000000000002", "scan_record" to record))
    }

    private fun canonical(nonce: String) =
        "AR-TEST-1:$publicKey:scan:LUKUID-1-2464-999000000000002:2464:1793769018:12000000:animal:$nonce:v1.0.0:FDX-B:1.0:999000000000002:::prev"

    @Test fun acceptsTheSignedRecordWithTheToken() {
        val result = Capture.verifyReply(reply(token), publicKey, token)
        assertEquals("scan", result.type)
        assertEquals(token, result.nonce)
        assertEquals("LUKUID-1-2464-999000000000002", result.id)
    }

    @Test fun rejectsAWrongTokenAndABadSignature() {
        expect("NONCE_MISMATCH") { Capture.verifyReply(reply("some-other-token-0123"), publicKey, token) }
        expect("RECORD_SIGNATURE_INVALID") { Capture.verifyReply(reply(token, signedCanonical = canonical("tampered-0123456789")), publicKey, token) }
        expect("CAPTURE_INVALID_REPLY") { Capture.verifyReply(mapOf("full_record" to emptyMap<String, Any?>()), publicKey, null) }
    }

    @Test fun challengeTokens() {
        repeat(20) { assertTrue(Capture.isValidToken(Capture.createToken())) }
        listOf("short-token", "a".repeat(32), "abcdefgh:ijklmnop", "abcdefgh ijklmnop").forEach { assertFalse(it, Capture.isValidToken(it)) }
        assertTrue(Capture.isValidToken("ABCDEFGHIJKLMNOPQRSTUVWXYZ-_.~+"))
    }

    private fun expect(code: String, block: () -> Unit) {
        try {
            block()
            fail("expected $code")
        } catch (e: CaptureException) {
            assertEquals(code, e.code)
        }
    }
}
