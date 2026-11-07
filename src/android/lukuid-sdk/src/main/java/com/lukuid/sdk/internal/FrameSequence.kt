// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk.internal

/**
 * Checks the `frame_seq` of each frame of one command's reply. Streamed replies
 * number every frame 1, 2, 3... from the first `has_more` frame through the closing
 * frame; a gap, or an unnumbered frame after numbered ones, means a frame was lost
 * and the reply must fail (FRAME_SEQUENCE_GAP) instead of returning incomplete data.
 * Firmware that does not number frames sends none and is not checked.
 */
internal class FrameSequence {
    var last: Long = 0
        private set

    /** Returns null when [frameSeq] continues the sequence, else the reason it does not. */
    fun accept(frameSeq: Long?): String? {
        if (frameSeq == null) {
            return if (last > 0) "FRAME_SEQUENCE_GAP: unnumbered frame after frame $last" else null
        }
        if (frameSeq != last + 1) {
            return "FRAME_SEQUENCE_GAP: expected frame ${last + 1}, received frame $frameSeq"
        }
        last = frameSeq
        return null
    }
}
