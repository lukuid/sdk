// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk

import java.security.SecureRandom
import java.util.Base64

/** The stored record returned by [capture]. */
data class CaptureResult(
    /** The stored record's ID (as `get` would return it). */
    val id: String,
    /** `scan` or `environment`. */
    val type: String,
    /** The record as decoded from the device. */
    val record: Map<String, Any?>,
    /** The record's signed nonce ("" when none). */
    val nonce: String
)

/** A capture reply that failed its check (`code`: RECORD_SIGNATURE_INVALID, NONCE_MISMATCH, …). */
class CaptureException(val code: String, message: String) : Exception(message)

/**
 * `capture`: the device makes one signed record now, stores it, and returns it. A challenge
 * token becomes the record's signed nonce, which proves the record was made after the token
 * was issued.
 */
object Capture {
    /** How long the Animal Reader waits for a tag. */
    const val WINDOW_MILLIS = 60_000L

    private val TOKEN = Regex("^[A-Za-z0-9\\-_.~+/=]{16,31}$")

    /** 16–31 characters from `A–Z a–z 0–9 - _ . ~ + / =` (never `:`). */
    fun isValidToken(token: String): Boolean = TOKEN.matches(token)

    /** A fresh random 24-character URL-safe token (144 bits). */
    fun createToken(): String {
        val bytes = ByteArray(18)
        SecureRandom().nextBytes(bytes)
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
    }

    /**
     * Checks a `capture` reply: the record's Ed25519 signature over its canonical string must
     * verify with the device key, and with a token the signed canonical string and the payload
     * must both carry it as the nonce. Field-by-field canonical recomputation and certificate
     * chains are checked when the record is exported or verified as evidence.
     */
    fun verifyReply(reply: Any?, publicKey: String, token: String?): CaptureResult {
        val full = (reply as? Map<*, *>)?.get("full_record") as? Map<*, *>
            ?: throw CaptureException("CAPTURE_INVALID_REPLY", "The device reply holds no record")
        val scan = full["scan_record"] as? Map<*, *>
        val environment = full["env_record"] as? Map<*, *>
        val record = scan ?: environment ?: throw CaptureException("CAPTURE_INVALID_REPLY", "The device reply holds no record")
        val type = if (scan != null) "scan" else "environment"
        val canonical = record["canonical_string"] as? String ?: ""
        val signature = bytesOf(record["signature"])
        if (canonical.isEmpty() || signature == null ||
            !LukuArchive.verifyDetachedSignature(publicKey, canonical.toByteArray(Charsets.UTF_8), Base64.getEncoder().encodeToString(signature))
        ) {
            throw CaptureException("RECORD_SIGNATURE_INVALID", "The captured record signature does not verify with the device key")
        }
        val nonce = ((record["payload"] as? Map<*, *>)?.get("nonce") as? String).orEmpty()
        if (token != null) {
            // Scan: nonce is the 9th canonical field; environment: an alphabetical content field.
            val fields = canonical.split(':')
            val signed = if (type == "scan") fields.getOrNull(8) == token else fields.contains(token)
            if (nonce != token || !signed) {
                throw CaptureException("NONCE_MISMATCH", "The captured record does not carry the challenge token")
            }
        }
        val id = (record["id"] as? String)?.takeIf { it.isNotEmpty() } ?: (full["record_id"] as? String).orEmpty()
        @Suppress("UNCHECKED_CAST")
        return CaptureResult(id, type, record as Map<String, Any?>, nonce)
    }

    private fun bytesOf(value: Any?): ByteArray? = when (value) {
        is ByteArray -> value
        is com.google.protobuf.ByteString -> value.toByteArray()
        is String -> runCatching { Base64.getDecoder().decode(value) }.getOrNull()
        else -> null
    }
}

/**
 * Asks the device for one signed record now and returns it once stored and checked
 * ([Capture.verifyReply]). The Animal Reader waits up to 60 s for a tag (keepalive frames
 * hold the inactivity timeout open); the Environment card records at once. Another capture
 * running on the device fails with `capture_in_progress`.
 */
suspend fun Device.capture(token: String? = null, timeoutMillis: Long = Device.DEFAULT_CALL_TIMEOUT): CaptureResult {
    if (token != null && !Capture.isValidToken(token)) {
        throw CaptureException("INVALID_ARG", "invalid_token")
    }
    val reply = call("capture", if (token != null) mapOf("token" to token) else emptyMap(), timeoutMillis)
    return Capture.verifyReply(reply, info.key, token)
}
