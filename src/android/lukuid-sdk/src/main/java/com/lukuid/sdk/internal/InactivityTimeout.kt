// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk.internal

import kotlinx.coroutines.Deferred
import kotlinx.coroutines.withTimeout
import kotlinx.coroutines.withTimeoutOrNull

/** Records when the last frame for a pending command arrived. */
internal class ActivityClock {
    @Volatile
    var lastNanos: Long = System.nanoTime()
        private set

    fun touch() {
        lastNanos = System.nanoTime()
    }
}

private class Box<T>(val value: T)

/**
 * Awaits [deferred] with an inactivity timeout: a streamed reply (`has_more`
 * frames, for example a full-history export) may take longer than
 * [timeoutMillis] in total as long as [clock] is touched for each frame. A device
 * that goes silent for [timeoutMillis] still fails with a timeout.
 */
internal suspend fun <T> awaitWithInactivityTimeout(
    deferred: Deferred<T>,
    timeoutMillis: Long,
    clock: ActivityClock
): T {
    while (true) {
        val idleMillis = (System.nanoTime() - clock.lastNanos) / 1_000_000L
        val remaining = timeoutMillis - idleMillis
        if (remaining <= 0L) {
            // Throws TimeoutCancellationException unless the reply just completed.
            return withTimeout(1L) { deferred.await() }
        }
        val box = withTimeoutOrNull(remaining) { Box(deferred.await()) }
        if (box != null) return box.value
    }
}
