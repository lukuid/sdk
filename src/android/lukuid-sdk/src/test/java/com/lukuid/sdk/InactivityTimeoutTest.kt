// SPDX-License-Identifier: Apache-2.0
// The command timeout measures inactivity: a streamed reply may take longer than
// the timeout in total while frames keep arriving; a silent device still times out.
package com.lukuid.sdk

import com.lukuid.sdk.internal.ActivityClock
import com.lukuid.sdk.internal.awaitWithInactivityTimeout
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.fail
import org.junit.Test

class InactivityTimeoutTest {
    @Test
    fun streamLongerThanTimeoutCompletesWhileFramesArrive() = runBlocking {
        val deferred = CompletableDeferred<String>()
        val clock = ActivityClock()
        launch {
            repeat(5) { delay(250); clock.touch() } // 1.25 s in total, 250 ms gaps
            deferred.complete("done")
        }
        assertEquals("done", awaitWithInactivityTimeout(deferred, 500L, clock))
    }

    @Test
    fun silentDeviceTimesOut() = runBlocking {
        val deferred = CompletableDeferred<String>()
        try {
            awaitWithInactivityTimeout(deferred, 300L, ActivityClock())
            fail("expected a timeout")
        } catch (_: TimeoutCancellationException) {
        }
    }

    @Test
    fun stalledStreamTimesOut() = runBlocking {
        val deferred = CompletableDeferred<String>()
        val clock = ActivityClock()
        launch { delay(100); clock.touch() } // one frame, then silence
        try {
            awaitWithInactivityTimeout(deferred, 300L, clock)
            fail("expected a timeout")
        } catch (_: TimeoutCancellationException) {
        }
        deferred.cancel()
    }
}
