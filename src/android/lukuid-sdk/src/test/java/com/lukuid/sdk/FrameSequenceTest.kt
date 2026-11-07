// SPDX-License-Identifier: Apache-2.0
// Streamed replies number every frame (`frame_seq` 1, 2, 3...); a lost frame shows up
// as a gap and fails the command instead of returning an incomplete reply.
package com.lukuid.sdk

import com.lukuid.sdk.internal.FrameSequence
import com.lukuid.sdk.internal.LukuCodec
import com.lukuid.sdk.proto.LukuIDProto
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class FrameSequenceTest {
    private fun run(vararg frames: Long?): String? {
        val seq = FrameSequence()
        for (f in frames) {
            val err = seq.accept(f)
            if (err != null) return err
        }
        return null
    }

    @Test
    fun contiguousSequenceIsAccepted() {
        assertNull(run(1, 2, 3, 4))
    }

    @Test
    fun lostMiddleFrameFails() {
        assertTrue(run(1, 3, 4)!!.startsWith("FRAME_SEQUENCE_GAP"))
    }

    @Test
    fun lostFirstFrameFails() {
        assertTrue(run(2, 3)!!.startsWith("FRAME_SEQUENCE_GAP"))
    }

    @Test
    fun lostLastDataFrameBeforeCloseFails() {
        assertTrue(run(1, 2, 4)!!.startsWith("FRAME_SEQUENCE_GAP"))
    }

    @Test
    fun unnumberedFrameAfterNumberedFails() {
        assertTrue(run(1, null)!!.startsWith("FRAME_SEQUENCE_GAP"))
    }

    @Test
    fun legacyUnnumberedFramesAreAccepted() {
        assertNull(run(null, null, null))
    }

    @Test
    fun codecDecodesFrameSeq() {
        val messages = mutableListOf<Map<String, Any?>>()
        val codec = LukuCodec(onMessage = { messages += it }, onError = { throw AssertionError("codec error", it) })
        val payload = LukuIDProto.CommandResponse.newBuilder()
            .setAction("fetch").setStatus(LukuIDProto.Status.STATUS_OK).setSuccess(true)
            .setHasMore(true).setFrameSeq(7).build().toByteArray()
        val magic = byteArrayOf(0x4C, 0x55, 0x4B, 0x55, 0x49, 0x44, 0x01, 0x7E)
        val len = payload.size
        val length = byteArrayOf((len and 0xFF).toByte(), ((len ushr 8) and 0xFF).toByte(), ((len ushr 16) and 0xFF).toByte(), ((len ushr 24) and 0xFF).toByte())
        codec.feed(magic + length + payload + magic)
        assertEquals(1, messages.size)
        assertEquals(7L, messages.single()["frame_seq"])
        assertEquals(true, messages.single()["has_more"])
    }
}
