// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk.internal

import com.google.protobuf.ByteString
import com.lukuid.sdk.proto.LukuIDProto
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * Firmware `info` carries no certificate DER: verify() fetches each one with
 * get_certificate, so the request must carry the name and the reply its DER.
 */
class CertificateCommandTest {

    private fun decodeRequest(frame: ByteArray): LukuIDProto.CommandRequest =
        LukuIDProto.CommandRequest.parseFrom(frame.copyOfRange(12, frame.size - 8))

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

    @Test
    fun `encodes get_certificate name`() {
        val frame = LukuCodec.encode(mapOf("action" to "get_certificate", "id" to "r1", "opts" to mapOf("name" to "attestation_dac")))
        val request = decodeRequest(frame)
        assertEquals("get_certificate", request.action)
        assertEquals("attestation_dac", request.getCertificate.name)
    }

    @Test
    fun `encodes get_chain ref`() {
        val frame = LukuCodec.encode(mapOf("action" to "get_chain", "id" to "r2", "opts" to mapOf("ref" to "CHAIN-1")))
        assertEquals("CHAIN-1", decodeRequest(frame).getChain.ref)
    }

    @Test
    fun `decodes certificate der`() {
        val der = byteArrayOf(0x30, 0x82.toByte(), 0x01, 0x0A)
        val response = LukuIDProto.CommandResponse.newBuilder()
            .setAction("get_certificate")
            .setStatus(LukuIDProto.Status.STATUS_OK)
            .setSuccess(true)
            .setCertificateResponse(LukuIDProto.GetCertificateResponse.newBuilder().setDer(ByteString.copyFrom(der)))
            .build()
        val messages = mutableListOf<Map<String, Any?>>()
        val codec = LukuCodec(onMessage = { messages += it }, onError = { throw AssertionError("codec error", it) })
        codec.feed(framePayload(response.toByteArray()))
        assertEquals(1, messages.size)
        assertArrayEquals(der, messages.single()["der"] as ByteArray)
    }
}
