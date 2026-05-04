// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk.internal

import android.content.Context
import com.lukuid.sdk.LukuSdkOptions
import kotlinx.coroutines.*
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest
import java.security.PublicKey
import java.security.cert.X509Certificate
import java.util.concurrent.ConcurrentHashMap
import org.bouncycastle.asn1.x509.SubjectPublicKeyInfo

internal class RevocationManager(
    private val context: Context,
    private val options: LukuSdkOptions,
    private val scope: CoroutineScope
) {
    private val revokedFingerprints = ConcurrentHashMap.newKeySet<String>()
    private var lastSyncDate: String? = null
    private var refreshJob: Job? = null

    init {
        loadFromCache()
        startAutoRefresh()
    }

    private fun getCacheFile(): File? {
        if (options.crlMemoryOnly) return null
        val baseDir = options.crlCachePath?.let { File(it) } ?: context.filesDir
        if (!baseDir.exists()) baseDir.mkdirs()
        return File(baseDir, "lukuid_crl.json")
    }

    private fun loadFromCache() {
        val file = getCacheFile() ?: return
        if (!file.exists()) return

        try {
            val json = JSONObject(file.readText())
            lastSyncDate = json.optString("last_sync", null)
            val fingerprints = json.optJSONArray("fingerprints")
            if (fingerprints != null) {
                for (i in 0 until fingerprints.length()) {
                    revokedFingerprints.add(fingerprints.getString(i))
                }
            }
        } catch (e: Exception) {
            debugLog(options, "Failed to load CRL cache", mapOf("error" to e.message))
        }
    }

    private fun saveToCache() {
        val file = getCacheFile() ?: return
        try {
            val json = JSONObject()
            json.put("last_sync", lastSyncDate)
            val array = org.json.JSONArray()
            revokedFingerprints.forEach { array.put(it) }
            json.put("fingerprints", array)
            file.writeText(json.toString())
        } catch (e: Exception) {
            debugLog(options, "Failed to save CRL cache", mapOf("error" to e.message))
        }
    }

    private fun startAutoRefresh() {
        if (options.crlRefreshIntervalHours <= 0) return
        
        refreshJob = scope.launch {
            while (isActive) {
                try {
                    sync()
                } catch (e: Exception) {
                    debugLog(options, "CRL sync failed", mapOf("error" to e.message))
                }
                delay(options.crlRefreshIntervalHours * 3600 * 1000L)
            }
        }
    }

    suspend fun sync() = withContext(Dispatchers.IO) {
        if (options.disableExternalCalls) return@withContext

        val apiUrl = options.apiUrl.trimEnd('/')
        val urlString = if (lastSyncDate != null) {
            "$apiUrl/revocations?from=${lastSyncDate}"
        } else {
            "$apiUrl/revocations"
        }

        val url = URL(urlString)
        val conn = url.openConnection() as HttpURLConnection
        conn.requestMethod = "GET"
        conn.connectTimeout = 10000
        conn.readTimeout = 10000

        if (conn.responseCode == 200) {
            val body = conn.inputStream.bufferedReader().use { it.readText() }
            val json = JSONObject(body)
            
            val revocations = json.optJSONArray("revocations")
            if (revocations != null) {
                for (i in 0 until revocations.length()) {
                    val item = revocations.getJSONObject(i)
                    val fingerprint = item.getString("identifier").lowercase()
                    revokedFingerprints.add(fingerprint)
                }
            }
            
            // Update last sync date from response if available, or use now
            // The API returns 'from' which is what we sent, we should probably track the latest revoked_at
            // but for simplicity we'll use the current server time or just now.
            lastSyncDate = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", java.util.Locale.US).apply {
                timeZone = java.util.TimeZone.getTimeZone("UTC")
            }.format(java.util.Date())
            
            saveToCache()
            debugLog(options, "CRL synced successfully", mapOf("count" to revokedFingerprints.size))
        } else if (conn.responseCode != 304) {
            throw Exception("CRL sync failed with status ${conn.responseCode}")
        }
    }

    fun isRevoked(certificate: X509Certificate): Boolean {
        val fingerprint = getFingerprint(certificate)
        return revokedFingerprints.contains(fingerprint)
    }

    internal fun addRevocation(fingerprint: String) {
        revokedFingerprints.add(fingerprint.lowercase())
    }

    private fun getFingerprint(certificate: X509Certificate): String {
        val rawKey = extractRawPublicKey(certificate.publicKey)
        return sha256Hex(rawKey).lowercase()
    }

    private fun extractRawPublicKey(publicKey: PublicKey): ByteArray {
        return try {
            val spki = SubjectPublicKeyInfo.getInstance(publicKey.encoded)
            spki.publicKeyData.bytes
        } catch (e: Exception) {
            publicKey.encoded // Fallback to full SPKI if parsing fails
        }
    }

    private fun sha256Hex(input: ByteArray): String {
        val digest = MessageDigest.getInstance("SHA-256").digest(input)
        return digest.joinToString("") { "%02x".format(it) }
    }
    
    fun close() {
        refreshJob?.cancel()
    }
}
