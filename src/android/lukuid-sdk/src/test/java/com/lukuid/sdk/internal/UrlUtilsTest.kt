package com.lukuid.sdk.internal

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class UrlUtilsTest {
    @Test
    fun testIsExternalCallAllowed() {
        // Disabled = false
        assertTrue(UrlUtils.isExternalCallAllowed("https://api.lukuid.com", false))
        assertTrue(UrlUtils.isExternalCallAllowed("https://custom.endpoint.com", false))

        // Disabled = true, block lukuid.com
        assertFalse(UrlUtils.isExternalCallAllowed("https://api.lukuid.com", true))
        assertFalse(UrlUtils.isExternalCallAllowed("http://lukuid.com", true))
        assertFalse(UrlUtils.isExternalCallAllowed("https://sub.api.lukuid.com/path", true))
        assertFalse(UrlUtils.isExternalCallAllowed("https://LUKUID.COM", true))

        // Disabled = true, allow custom endpoints
        assertTrue(UrlUtils.isExternalCallAllowed("https://custom.endpoint.com", true))
        assertTrue(UrlUtils.isExternalCallAllowed("https://notlukuid.com", true))
        assertTrue(UrlUtils.isExternalCallAllowed("http://localhost:8080", true))
        assertTrue(UrlUtils.isExternalCallAllowed("https://lukuid.com.br", true))
    }
}
