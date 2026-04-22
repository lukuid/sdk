// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk.internal

import com.lukuid.sdk.proto.LukuIDProto
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.util.Base64

class LukuCodecTest {

    @Test
    fun `ignores echoed info request and decodes split info response`() {
        val messages = mutableListOf<Map<String, Any?>>()
        val codec = LukuCodec(
            onMessage = { messages += it },
            onError = { throw AssertionError("Unexpected codec error", it) }
        )

        val echoedRequest = LukuCodec.encode(
            mapOf(
                "action" to "info",
                "id" to "probe",
                "opts" to emptyMap<String, Any?>()
            )
        )

        val info = LukuIDProto.DeviceInfoResponse.newBuilder()
            .setId("B784AE14")
            .setProduct("guardcard")
            .setModel("LUKUID-GUARDCARD-V1")
            .setFirmware("v1.0.0")
            .setKey(com.google.protobuf.ByteString.copyFrom(Base64.getDecoder().decode("t4SuFBxXUx2rMw4uYlwcPuAoXJB/NuNSQF1lTLrbVRg=")))
            .build()
        val responsePayload = LukuIDProto.CommandResponse.newBuilder()
            .setAction("info")
            .setStatus(LukuIDProto.Status.STATUS_OK)
            .setSuccess(true)
            .setDeviceInfo(info)
            .build()
            .toByteArray()

        val responseFrame = framePayload(responsePayload)
        val combined = echoedRequest + responseFrame

        combined.asList().chunked(64).forEach { chunk ->
            codec.feed(chunk.toByteArray())
        }

        assertEquals(1, messages.size)
        val response = messages.single()
        assertEquals("info", response["action"])
        assertEquals("B784AE14", response["id"])
        assertEquals("t4SuFBxXUx2rMw4uYlwcPuAoXJB/NuNSQF1lTLrbVRg=", Base64.getEncoder().encodeToString(response["key"] as ByteArray))
        assertTrue(response["ok"] as Boolean)
    }

    private fun framePayload(payload: ByteArray): ByteArray {
        val magic = byteArrayOf(0x4C, 0x55, 0x4B, 0x55, 0x49, 0x44, 0x01, 0x7E)
        val framed = ByteArray(magic.size + 4 + payload.size + magic.size)
        System.arraycopy(magic, 0, framed, 0, magic.size)
        val length = payload.size
        framed[8] = (length and 0xFF).toByte()
        framed[9] = ((length ushr 8) and 0xFF).toByte()
        framed[10] = ((length ushr 16) and 0xFF).toByte()
        framed[11] = ((length ushr 24) and 0xFF).toByte()
        System.arraycopy(payload, 0, framed, 12, payload.size)
        System.arraycopy(magic, 0, framed, 12 + payload.size, magic.size)
        return framed
    }
}
