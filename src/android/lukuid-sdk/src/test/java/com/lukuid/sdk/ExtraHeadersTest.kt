// SPDX-License-Identifier: Apache-2.0
// Apps identify themselves through extra headers the SDK adds to every LukuID request.
package com.lukuid.sdk

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import java.net.HttpURLConnection
import java.net.URL

class ExtraHeadersTest {
    @Test
    fun appliesValidHeadersAndSkipsUnsafeOnes() {
        val options = LukuSdkOptions(
            extraHeaders = mapOf(
                "X-LukuID-App" to "android",
                "X-LukuID-App-Version" to "1.0.400",
                "Bad Header" to "x",
                "X-Bad-Value" to "line\nbreak",
            )
        )
        val conn = URL("http://127.0.0.1:9/heartbeat").openConnection() as HttpURLConnection
        conn.applyExtraHeaders(options)
        assertEquals("android", conn.getRequestProperty("X-LukuID-App"))
        assertEquals("1.0.400", conn.getRequestProperty("X-LukuID-App-Version"))
        assertNull(conn.getRequestProperty("Bad Header"))
        assertNull(conn.getRequestProperty("X-Bad-Value"))
    }
}
