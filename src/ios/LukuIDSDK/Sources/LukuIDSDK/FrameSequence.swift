// SPDX-License-Identifier: Apache-2.0
import Foundation

/// Checks the `frame_seq` of each frame of one command's reply. Streamed replies
/// number every frame 1, 2, 3... from the first `has_more` frame through the closing
/// frame; a gap, or an unnumbered frame after numbered ones, means a frame was lost
/// and the reply must fail (FRAME_SEQUENCE_GAP) instead of returning incomplete data.
/// Firmware that does not number frames sends none and is not checked.
struct FrameSequence {
    private(set) var last: Int = 0

    /// Returns nil when `frameSeq` continues the sequence, else the reason it does not.
    mutating func accept(_ frameSeq: Int?) -> String? {
        guard let frameSeq else {
            return last > 0 ? "FRAME_SEQUENCE_GAP: unnumbered frame after frame \(last)" : nil
        }
        guard frameSeq == last + 1 else {
            return "FRAME_SEQUENCE_GAP: expected frame \(last + 1), received frame \(frameSeq)"
        }
        last = frameSeq
        return nil
    }
}
