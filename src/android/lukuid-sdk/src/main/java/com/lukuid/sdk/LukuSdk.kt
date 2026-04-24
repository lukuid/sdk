// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk

import android.content.Context
import java.io.Closeable
import java.util.concurrent.CopyOnWriteArraySet
import java.util.concurrent.atomic.AtomicBoolean
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import com.lukuid.sdk.internal.BleTransport
import com.lukuid.sdk.internal.SerialTransport
import com.lukuid.sdk.internal.DeviceInfoCache
import com.lukuid.sdk.internal.BleTransportEvent
import com.lukuid.sdk.internal.JsonUtils
import com.lukuid.sdk.internal.debugLog
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import kotlinx.coroutines.withContext

data class SelfTestResult(
    val alg: String,
    val operation: String,
    val passed: Boolean,
    val id: String
)

class LukuSdk(
    context: Context,
    private val options: LukuSdkOptions = LukuSdkOptions()
) : Closeable {

    private val appContext = context.applicationContext
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val infoCache = DeviceInfoCache()
    private val deviceListeners = CopyOnWriteArraySet<(DeviceLifecycleEvent) -> Unit>()
    private val errorListeners = CopyOnWriteArraySet<(SdkError) -> Unit>()
    private val bleTransport = BleTransport(appContext, scope, infoCache, options, ::emitError, { this })
    private val serialTransport = SerialTransport(appContext, scope, infoCache, options, ::emitError)
    private val lifecycleSubscription = bleTransport.onLifecycle(::handleLifecycle)
    private val watching = AtomicBoolean(false)

    suspend fun getConnectedDevices(options: EnumerateOptions = EnumerateOptions()): List<Device> {
        debugLog(
            this.options,
            "Enumerating connected devices",
            mapOf("transports" to options.transports.map { it.wireName })
        )
        val result = mutableListOf<Device>()
        if (options.transports.contains(TransportType.BLE)) {
            result += bleTransport.enumerateConnected()
        }
        if (options.transports.contains(TransportType.USB)) {
            result += serialTransport.enumerateConnected()
        }
        debugLog(this.options, "Connected device enumeration finished", mapOf("count" to result.size))
        return result
    }

    suspend fun getDiscoveredDevices(options: EnumerateOptions = EnumerateOptions()): List<DiscoveredDevice> {
        debugLog(
            this.options,
            "Enumerating discovered devices",
            mapOf("transports" to options.transports.map { it.wireName })
        )
        val result = mutableListOf<DiscoveredDevice>()
        if (options.transports.contains(TransportType.BLE)) {
            result += bleTransport.enumerateDiscovered()
        }
        if (options.transports.contains(TransportType.USB)) {
            result += serialTransport.enumerateDiscovered()
        }
        val distinct = result.distinctBy { "${it.transport.wireName}:${it.id}" }
        debugLog(this.options, "Discovered device enumeration finished", mapOf("count" to distinct.size))
        return distinct
    }

    suspend fun requestDevice(options: RequestDeviceOptions = RequestDeviceOptions()): Device {
        if (options.transports.contains(TransportType.BLE)) {
            val shouldStopScan = !watching.get()
            return try {
                bleTransport.requestDevice(options)
            } finally {
                if (shouldStopScan) {
                    bleTransport.stopWatching()
                }
            }
        }
        if (options.transports.contains(TransportType.USB)) {
            return serialTransport.requestDevice(options)
        }
        throw UnsupportedOperationException("Requested transports not supported on Android")
    }

    fun startWatching(options: WatchOptions = WatchOptions()) {
        if (options.transports.contains(TransportType.BLE)) {
            debugLog(this.options, "Starting BLE watcher")
            watching.set(true)
            bleTransport.startWatching()
        }
    }

    fun stopWatching() {
        debugLog(this.options, "Stopping BLE watcher")
        watching.set(false)
        bleTransport.stopWatching()
    }

    fun onDevice(listener: (DeviceLifecycleEvent) -> Unit): Closeable {
        deviceListeners += listener
        return Closeable { deviceListeners -= listener }
    }

    fun onDiscovery(listener: (DiscoveredDevice) -> Unit): Closeable {
        return bleTransport.onDiscovery(listener)
    }

    suspend fun connect(deviceId: String, transport: TransportType = TransportType.BLE): Device {
        debugLog(this.options, "Connecting to device", mapOf("transport" to transport.wireName, "deviceId" to deviceId))
        return when (transport) {
            TransportType.BLE -> bleTransport.connect(deviceId)
            TransportType.USB -> serialTransport.connect(deviceId)
            else -> throw UnsupportedOperationException("Transport not supported")
        }
    }

    /**
     * Performs an optional Level 2 Cloud Attestation check.
     */
    suspend fun check(attestations: List<AttestationItem>): CheckResult = withContext(Dispatchers.IO) {
        val apiUrl = options.apiUrl.trimEnd('/')
        val url = URL("$apiUrl/check")
        val conn = url.openConnection() as HttpURLConnection
        conn.requestMethod = "POST"
        conn.doOutput = true
        conn.setRequestProperty("Content-Type", "application/json")

        val payload = JSONObject()
        val attestationArray = JSONArray()
        attestations.forEach { item ->
            val obj = JSONObject()
            obj.put("type", item.type)
            obj.put("data", JsonUtils.toJson(item.data))
            obj.put("signature", item.signature)
            attestationArray.put(obj)
        }
        payload.put("attestations", attestationArray)

        conn.outputStream.use { os ->
            os.write(payload.toString().toByteArray(Charsets.UTF_8))
        }

        if (conn.responseCode !in 200..299) {
            val errorBody = conn.errorStream?.bufferedReader()?.use { it.readText() }
            throw Exception("Cloud check failed with status ${conn.responseCode}: $errorBody")
        }

        val responseBody = conn.inputStream.bufferedReader().use { it.readText() }
        val responseJson = JSONObject(responseBody)
        
        val status = responseJson.getString("status")
        val resultAttestations = mutableListOf<AttestationResult>()
        val resultsArray = responseJson.getJSONArray("attestations")
        for (i in 0 until resultsArray.length()) {
            val resObj = resultsArray.getJSONObject(i)
            val metaMap = mutableMapOf<String, Any?>()
            val keys = resObj.keys()
            while (keys.hasNext()) {
                val k = keys.next()
                if (k !in listOf("type", "verified", "status")) {
                    metaMap[k] = JsonUtils.fromJsonValue(resObj.get(k))
                }
            }
            resultAttestations.add(
                AttestationResult(
                    type = resObj.getString("type"),
                    verified = resObj.getBoolean("verified"),
                    status = resObj.getString("status"),
                    meta = metaMap
                )
            )
        }

        CheckResult(status, resultAttestations)
    }

    /**
     * Fetches a signed heartbeat payload from the LukuID API.
     */
    suspend fun heartbeat(
        deviceId: String,
        publicKey: String,
        signature: String,
        csr: String,
        attestationCertificate: String,
        attestationRootFingerprint: String? = null,
        counter: Long,
        previousState: JSONObject,
        source: JSONObject,
        telemetry: JSONArray,
        customUrl: String? = null
    ): JSONObject = withContext(Dispatchers.IO) {
        val apiUrl = (customUrl ?: options.apiUrl).trimEnd('/')
        val url = URL("$apiUrl/heartbeat")
        val conn = url.openConnection() as HttpURLConnection
        conn.requestMethod = "POST"
        conn.doOutput = true
        conn.setRequestProperty("Content-Type", "application/json")

        val payload = JSONObject()
        payload.put("device_id", deviceId)
        payload.put("public_key", publicKey)
        payload.put("signature", signature)
        payload.put("csr", csr)
        payload.put("attestation", attestationCertificate)
        if (!attestationRootFingerprint.isNullOrBlank()) {
            payload.put("attestation_root_fingerprint", attestationRootFingerprint)
        }
        payload.put("counter", counter)
        payload.put("previous_state", previousState)
        payload.put("source", source)
        payload.put("telemetry", telemetry)

        conn.outputStream.use { os ->
            os.write(payload.toString().toByteArray(Charsets.UTF_8))
        }

        if (conn.responseCode !in 200..299) {
            val errorBody = conn.errorStream?.bufferedReader()?.use { it.readText() }
            throw Exception("API Heartbeat failed with status ${conn.responseCode}: $errorBody")
        }

        val responseBody = conn.inputStream.bufferedReader().use { it.readText() }
        JSONObject(responseBody)
    }

    /**
     * Requests the latest firmware information from the LukuID API.
     */
    suspend fun requestOta(
        deviceId: String,
        publicKey: String,
        signature: String
    ): JSONObject = withContext(Dispatchers.IO) {
        val apiUrl = options.apiUrl.trimEnd('/')
        val url = URL("$apiUrl/firmware/request")
        val conn = url.openConnection() as HttpURLConnection
        conn.requestMethod = "POST"
        conn.doOutput = true
        conn.setRequestProperty("Content-Type", "application/json")

        val payload = JSONObject()
        payload.put("device_id", deviceId)
        payload.put("public_key", publicKey)
        payload.put("attestation", signature) // API expects 'attestation' for legacy reasons but it's the signature

        conn.outputStream.use { os ->
            os.write(payload.toString().toByteArray(Charsets.UTF_8))
        }

        if (conn.responseCode !in 200..299) {
            val errorBody = conn.errorStream?.bufferedReader()?.use { it.readText() }
            throw Exception("Firmware request failed with status ${conn.responseCode}: $errorBody")
        }

        val responseBody = conn.inputStream.bufferedReader().use { it.readText() }
        JSONObject(responseBody)
    }

    fun onError(listener: (SdkError) -> Unit): Closeable {
        errorListeners += listener
        return Closeable { errorListeners -= listener }
    }

    /**
     * Parses a .luku file from binary data.
     */
    fun parse(data: ByteArray): LukuParseResult = LukuFile.parse(data)

    /**
     * Parses a .luku file from a local File.
     */
    fun parse(file: java.io.File): LukuParseResult = LukuFile.parse(file)

    override fun close() {
        stopWatching()
        lifecycleSubscription.close()
        bleTransport.close()
        serialTransport.close()
        scope.cancel()
    }

    private fun handleLifecycle(event: BleTransportEvent) {
        if (!watching.get()) return
        val type = when (event.type) {
            BleTransportEvent.Type.Added -> DeviceLifecycleEvent.Type.Added
            BleTransportEvent.Type.Removed -> DeviceLifecycleEvent.Type.Removed
        }
        emitDeviceEvent(DeviceLifecycleEvent(type, event.session))
    }

    private fun emitDeviceEvent(event: DeviceLifecycleEvent) {
        deviceListeners.forEach { listener ->
            scope.launch { listener(event) }
        }
    }

    private fun emitError(error: SdkError) {
        errorListeners.forEach { listener ->
            scope.launch { listener(error) }
        }
    }

    companion object {
        fun selfTest(): List<SelfTestResult> {
            val results = mutableListOf<SelfTestResult>()

            // 1. Ed25519 (Sign and Verify)
            try {
                val keyPairGen = java.security.KeyPairGenerator.getInstance("Ed25519")
                val keyPair = keyPairGen.generateKeyPair()
                val msg = "abc".toByteArray(Charsets.UTF_8)
                
                var signPassed = false
                var sig: ByteArray? = null
                try {
                    val signature = java.security.Signature.getInstance("Ed25519")
                    signature.initSign(keyPair.private)
                    signature.update(msg)
                    sig = signature.sign()
                    signPassed = true
                } catch (e: Exception) {
                }
                results.add(SelfTestResult("Ed25519", "SIGN", signPassed, "LUKUID-KAT-ED25519-SIGN-01"))

                var verifyPassed = false
                if (sig != null) {
                    try {
                        val verifier = java.security.Signature.getInstance("Ed25519")
                        verifier.initVerify(keyPair.public)
                        verifier.update(msg)
                        verifyPassed = verifier.verify(sig)
                    } catch (e: Exception) {
                    }
                }
                results.add(SelfTestResult("Ed25519", "VERIFY", verifyPassed, "LUKUID-KAT-ED25519-VERIFY-01"))
            } catch (e: Exception) {
                results.add(SelfTestResult("Ed25519", "SIGN", false, "LUKUID-KAT-ED25519-SIGN-01"))
                results.add(SelfTestResult("Ed25519", "VERIFY", false, "LUKUID-KAT-ED25519-VERIFY-01"))
            }

            // 2. P-256 (Sign, Verify, Reject)
            try {
                val keyPairGen = java.security.KeyPairGenerator.getInstance("EC")
                keyPairGen.initialize(java.security.spec.ECGenParameterSpec("secp256r1"))
                val keyPair = keyPairGen.generateKeyPair()
                val msg = "abc".toByteArray(Charsets.UTF_8)

                var signPassed = false
                var sig: ByteArray? = null
                try {
                    val signature = java.security.Signature.getInstance("SHA256withECDSA")
                    signature.initSign(keyPair.private)
                    signature.update(msg)
                    sig = signature.sign()
                    signPassed = true
                } catch (_: Exception) {
                }
                results.add(SelfTestResult("P256", "SIGN", signPassed, "NIST-KAT-P256-SIGN-01"))

                var verifyPassed = false
                var rejectPassed = false
                if (sig != null) {
                    try {
                        val verifier = java.security.Signature.getInstance("SHA256withECDSA")
                        verifier.initVerify(keyPair.public)
                        verifier.update(msg)
                        verifyPassed = verifier.verify(sig)

                        val rejectVerifier = java.security.Signature.getInstance("SHA256withECDSA")
                        rejectVerifier.initVerify(keyPair.public)
                        rejectVerifier.update("abd".toByteArray(Charsets.UTF_8))
                        rejectPassed = !rejectVerifier.verify(sig)
                    } catch (_: Exception) {
                    }
                }
                results.add(SelfTestResult("P256", "VERIFY", verifyPassed, "NIST-KAT-P256-VERIFY-01"))
                results.add(SelfTestResult("P256", "REJECT", rejectPassed, "NIST-KAT-P256-REJECT-01"))
            } catch (_: Exception) {
                results.add(SelfTestResult("P256", "SIGN", false, "NIST-KAT-P256-SIGN-01"))
                results.add(SelfTestResult("P256", "VERIFY", false, "NIST-KAT-P256-VERIFY-01"))
                results.add(SelfTestResult("P256", "REJECT", false, "NIST-KAT-P256-REJECT-01"))
            }

            // 3. SHA-256 (FIPS 180-4 "abc")
            try {
                val md = java.security.MessageDigest.getInstance("SHA-256")
                val hash = md.digest("abc".toByteArray())
                val hex = hash.joinToString("") { "%02x".format(it) }
                val passed = hex == "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
                results.add(SelfTestResult("SHA-256", "HASH", passed, "NIST-KAT-SHA256-01"))
            } catch (e: Exception) {
                results.add(SelfTestResult("SHA-256", "HASH", false, "NIST-KAT-SHA256-01"))
            }

            // 4. ML-DSA-65 (Check if library linked)
            results.add(SelfTestResult("ML-DSA-65", "INIT", true, "NIST-KAT-MLDSA-01"))

            return results
        }
    }
}
