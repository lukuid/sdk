package com.lukuid.sdk.internal

import java.net.URL

internal object UrlUtils {
    fun isExternalCallAllowed(targetUrl: String, disableExternalCalls: Boolean): Boolean {
        if (!disableExternalCalls) {
            return true
        }
        return try {
            val parsed = URL(targetUrl)
            val hostLower = parsed.host.lowercase()
            !(hostLower == "lukuid.com" || hostLower.endsWith(".lukuid.com"))
        } catch (e: Exception) {
            // Allow it to proceed and fail if not a valid URL
            true
        }
    }
}
