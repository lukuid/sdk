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
import java.security.Signature
import java.security.cert.CertificateFactory
import java.security.cert.X509Certificate
import java.io.ByteArrayInputStream
import android.util.Base64
import java.util.concurrent.ConcurrentHashMap
import org.bouncycastle.asn1.x509.SubjectPublicKeyInfo

class RevocationManager(
    private val context: Context,
    private val options: LukuSdkOptions,
    private val scope: CoroutineScope
) {
    private val revokedFingerprints = ConcurrentHashMap.newKeySet<String>()
    private var lastSyncTime: Long = 0
    private var generatedAt: Long = 0
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
            applySnapshot(json.getJSONObject("snapshot"))
            lastSyncTime = json.optLong("checked_at", 0).takeIf { it <= System.currentTimeMillis() + 300000L } ?: 0
        } catch (e: Exception) {
            debugLog(options, "Failed to load CRL cache", mapOf("error" to e.message))
        }
    }

    private fun saveToCache() {
        val file = getCacheFile() ?: return
        try {
            val json = JSONObject()
            json.put("checked_at", lastSyncTime)
            json.put("snapshot", snapshot ?: return)
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
        val interval = options.crlRefreshIntervalHours * 3600 * 1000L
        if (interval > 0 && System.currentTimeMillis() - lastSyncTime < interval) return@withContext
        val apiUrl = options.apiUrl.trimEnd('/')
        val urlString = "$apiUrl/crl"

        val url = URL(urlString)
        val conn = url.openConnection() as HttpURLConnection
        conn.requestMethod = "GET"
        conn.connectTimeout = 10000
        conn.readTimeout = 10000

        if (conn.responseCode == 200) {
            val body = conn.inputStream.bufferedReader().use { it.readText() }
            val json = JSONObject(body)
            
            applySnapshot(json)
            lastSyncTime = System.currentTimeMillis()
            saveToCache()
            debugLog(options, "CRL synced successfully", mapOf("count" to revokedFingerprints.size))
        } else if (conn.responseCode != 304) {
            throw Exception("CRL sync failed with status ${conn.responseCode}")
        }
    }

    private var snapshot: JSONObject? = null

    private fun applySnapshot(envelope: JSONObject) {
        val chain = envelope.getString("certificate_chain")
        val payload = Base64.decode(envelope.getString("payload"), Base64.DEFAULT)
        val signature = Base64.decode(envelope.getString("signature"), Base64.DEFAULT)
        val data = JSONObject(String(payload, Charsets.UTF_8))
        val generatedAt = java.time.Instant.parse(data.getString("generated_at")).toEpochMilli()
        if (data.getInt("version") != 1 || generatedAt > System.currentTimeMillis() + 300000L || generatedAt < System.currentTimeMillis() - 86400000L) throw SecurityException("Invalid signed CRL timestamp or version")
        val chainResult = validateCertificateChain(chain, generatedAt / 1000, options.trustProfile)
        if (!chainResult.ok) throw SecurityException("CRL signing chain rejected: ${chainResult.reason}")
        val firstPem = Regex("-----BEGIN CERTIFICATE-----[\\s\\S]*?-----END CERTIFICATE-----").find(chain)?.value
            ?: throw SecurityException("Missing CRL signing certificate")
        val leaf = CertificateFactory.getInstance("X.509").generateCertificate(ByteArrayInputStream(firstPem.toByteArray())) as X509Certificate
        val verifier = Signature.getInstance("SHA256withECDSA")
        verifier.initVerify(leaf.publicKey)
        verifier.update(payload)
        if (!verifier.verify(signature)) throw SecurityException("Invalid CRL signature")
        val entries = data.getJSONArray("revoked_fingerprints")
        val next = mutableSetOf<String>()
        for (i in 0 until entries.length()) {
            val fingerprint = entries.getString(i)
            if (!fingerprint.matches(Regex("[a-f0-9]{64}"))) throw SecurityException("Invalid CRL fingerprint")
            next.add(fingerprint)
        }
        revokedFingerprints.clear()
        revokedFingerprints.addAll(next)
        snapshot = envelope
        this.generatedAt = generatedAt
    }

    fun isRevoked(certificate: X509Certificate): Boolean {
        val fingerprint = getFingerprint(certificate)
        return revokedFingerprints.contains(fingerprint)
    }

    fun hasVerifiedSnapshot(): Boolean = snapshot != null && generatedAt >= System.currentTimeMillis() - 86400000L

    internal fun addRevocation(fingerprint: String) {
        revokedFingerprints.add(fingerprint.lowercase())
    }

    private fun getFingerprint(certificate: X509Certificate): String {
        val rawKey = extractRawPublicKey(certificate.publicKey)
        return sha256Hex(rawKey).lowercase()
    }

    private fun extractRawPublicKey(publicKey: PublicKey): ByteArray {
        val spki = SubjectPublicKeyInfo.getInstance(publicKey.encoded)
        return spki.publicKeyData.bytes
    }

    private fun sha256Hex(input: ByteArray): String {
        val digest = MessageDigest.getInstance("SHA-256").digest(input)
        return digest.joinToString("") { "%02x".format(it) }
    }
    
    fun close() {
        refreshJob?.cancel()
    }
}
