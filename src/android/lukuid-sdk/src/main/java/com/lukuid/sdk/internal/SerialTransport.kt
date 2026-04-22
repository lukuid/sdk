// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk.internal

import android.content.Context
import android.hardware.usb.UsbManager
import android.util.Base64
import com.hoho.android.usbserial.driver.UsbSerialProber
import com.hoho.android.usbserial.driver.UsbSerialPort
import com.lukuid.sdk.DiscoveredDevice
import com.hoho.android.usbserial.util.SerialInputOutputManager
import com.lukuid.sdk.Device
import com.lukuid.sdk.DeviceEventPayload
import com.lukuid.sdk.DeviceInfo
import com.lukuid.sdk.RequestDeviceOptions
import com.lukuid.sdk.SdkError
import com.lukuid.sdk.TransportType
import java.io.Closeable
import java.io.IOException
import java.util.concurrent.ConcurrentHashMap
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withTimeout
import java.util.concurrent.CopyOnWriteArraySet
import java.util.concurrent.atomic.AtomicInteger
import android.hardware.usb.UsbDeviceConnection

private const val USB_OPEN_LOCK_WAIT_MS = 5_000L
private const val USB_OPEN_RETRY_WINDOW_MS = 2_500L
private const val USB_OPEN_RETRY_INTERVAL_MS = 75L

private object UsbSerialOpenCoordinator {
    private val locks = ConcurrentHashMap<String, Mutex>()

    fun lockFor(transportId: String): Mutex = locks.getOrPut(transportId) { Mutex() }
}

private fun serialInfoFieldAsBase64(value: Any?): String? = when (value) {
    is String -> value
    is ByteArray -> Base64.encodeToString(value, Base64.NO_WRAP)
    else -> null
}

private fun serialInfoFieldAsPemChain(value: Any?): String? = when (value) {
    is String -> if (value.contains("-----BEGIN CERTIFICATE-----")) value else null
    is ByteArray -> {
        val decoded = value.toString(Charsets.UTF_8)
        if (decoded.contains("-----BEGIN CERTIFICATE-----")) decoded else null
    }
    else -> null
}

private fun serialPemFromInfoField(value: Any?): String? {
    val encoded = serialInfoFieldAsBase64(value) ?: return null
    val normalized = encoded.trim()
    if (normalized.isEmpty()) {
        return null
    }
    val wrapped = normalized.chunked(64).joinToString("\n")
    return "-----BEGIN CERTIFICATE-----\n$wrapped\n-----END CERTIFICATE-----\n"
}

private fun serialAssembleInfoCertificateChain(fields: Map<String, Any?>): String? {
    val parts = listOf(
        serialPemFromInfoField(fields["attestation_dac_der"]),
        serialPemFromInfoField(fields["attestation_manufacturer_der"]),
        serialPemFromInfoField(fields["attestation_intermediate_der"])
    ).filterNotNull()
    return if (parts.isEmpty()) null else parts.joinToString("")
}

internal class SerialTransport(
    context: Context,
    private val scope: CoroutineScope,
    private val infoCache: DeviceInfoCache,
    private val sdkOptions: com.lukuid.sdk.LukuSdkOptions,
    private val errorSink: (SdkError) -> Unit
) : Closeable {

    private val appContext = context.applicationContext
    private val usbManager = appContext.getSystemService(Context.USB_SERVICE) as UsbManager
    private val sessions = ConcurrentHashMap<String, SerialDeviceSession>()

    suspend fun enumerateConnected(): List<Device> {
        val drivers = UsbSerialProber.getDefaultProber().findAllDrivers(usbManager)
        debugLog(sdkOptions, "USB serial enumerateConnected started", mapOf("drivers" to drivers.size))
        val result = mutableListOf<Device>()
        
        for (driver in drivers) {
            val device = driver.device
            if (usbManager.hasPermission(device)) {
                for (port in driver.ports) {
                    val transportId = "${device.deviceName}:${port.portNumber}"
                    try {
                        val session = sessions.getOrPut(transportId) {
                            SerialDeviceSession(usbManager, port, transportId, infoCache, sdkOptions, errorSink)
                        }
                        debugLog(sdkOptions, "Ensuring USB serial session", mapOf("transportId" to transportId))
                        session.ensureConnected()
                        result.add(session)
                    } catch (e: Exception) {
                        errorSink(SdkError("serial.enumerate", e))
                    }
                }
            } else {
                debugLog(
                    sdkOptions,
                    "Skipping USB device without permission",
                    mapOf("deviceName" to device.deviceName, "productName" to device.productName)
                )
            }
        }

        debugLog(sdkOptions, "USB serial enumerateConnected finished", mapOf("count" to result.size))
        return result
    }

    suspend fun enumerateDiscovered(): List<DiscoveredDevice> {
        val drivers = UsbSerialProber.getDefaultProber().findAllDrivers(usbManager)
        debugLog(sdkOptions, "USB serial enumerateDiscovered started", mapOf("drivers" to drivers.size))
        val result = mutableListOf<DiscoveredDevice>()

        for (driver in drivers) {
            val device = driver.device
            if (!usbManager.hasPermission(device)) {
                debugLog(
                    sdkOptions,
                    "Skipping USB device without permission during discovery",
                    mapOf("deviceName" to device.deviceName, "productName" to device.productName)
                )
                continue
            }

            for (port in driver.ports) {
                val transportId = "${device.deviceName}:${port.portNumber}"
                debugLog(sdkOptions, "Inspecting USB serial port", mapOf("transportId" to transportId))
                val info = inspectPort(port, transportId)
                result += DiscoveredDevice(
                    id = transportId,
                    label = device.productName ?: device.deviceName,
                    transport = TransportType.USB,
                    info = info
                )
            }
        }

        debugLog(sdkOptions, "USB serial enumerateDiscovered finished", mapOf("count" to result.size))
        return result
    }

    suspend fun requestDevice(options: RequestDeviceOptions): Device {
        debugLog(
            sdkOptions,
            "USB serial requestDevice started",
            mapOf("timeoutMillis" to options.timeoutMillis)
        )
        val connected = enumerateConnected()
        if (connected.isNotEmpty()) return connected[0]
        throw UnsupportedOperationException("Serial requestDevice requires interactive permission handling")
    }

    suspend fun connect(deviceId: String): Device {
        debugLog(sdkOptions, "USB serial connect requested", mapOf("deviceId" to deviceId))
        val drivers = UsbSerialProber.getDefaultProber().findAllDrivers(usbManager)
        for (driver in drivers) {
            val device = driver.device
            if (!usbManager.hasPermission(device)) {
                debugLog(
                    sdkOptions,
                    "Skipping USB device without permission during connect",
                    mapOf("deviceName" to device.deviceName, "productName" to device.productName)
                )
                continue
            }
            for (port in driver.ports) {
                val transportId = "${device.deviceName}:${port.portNumber}"
                if (transportId != deviceId) {
                    continue
                }
                val session = sessions.getOrPut(transportId) {
                    SerialDeviceSession(usbManager, port, transportId, infoCache, sdkOptions, errorSink)
                }
                session.ensureConnected()
                return session
            }
        }
        throw IOException("USB device not found: $deviceId")
    }

    override fun close() {
        sessions.values.forEach { it.closeSession() }
        sessions.clear()
    }

    private suspend fun inspectPort(port: UsbSerialPort, transportId: String): DeviceInfo? {
        debugLog(sdkOptions, "Opening USB serial port for inspection", mapOf("transportId" to transportId))
        val lock = UsbSerialOpenCoordinator.lockFor(transportId)

        return withTimeout(USB_OPEN_LOCK_WAIT_MS) {
            lock.withLock {
                val opened = openUsbPortWithRetry(usbManager, port, transportId, sdkOptions)
                if (opened == null) {
                    debugLog(sdkOptions, "Failed to open USB device for inspection", mapOf("transportId" to transportId))
                    return@withLock null
                }

                val connection = opened
                var infoResponse: Map<String, Any?>? = null
                val inspectCodec = LukuCodec(
                    onMessage = { message ->
                        if ((message["action"] as? String) == "info") {
                            infoResponse = message
                        }
                    },
                    onError = { errorSink(SdkError("serial.inspect", it)) }
                )

                try {
                    val payload = LukuCodec.encode(
                        mapOf(
                            "action" to "info",
                            "id" to "probe",
                            "opts" to emptyMap<String, Any?>()
                        )
                    )
                    port.write(payload, 1000)

                    val buffer = ByteArray(1024)
                    val deadline = System.currentTimeMillis() + 1500L
                    while (infoResponse == null && System.currentTimeMillis() < deadline) {
                        val read = try {
                            port.read(buffer, 200)
                        } catch (_: IOException) {
                            0
                        }
                        if (read > 0) {
                            inspectCodec.feed(buffer.copyOf(read))
                        }
                    }

                    infoResponse?.let { response ->
                        val info = parseDiscoveredInfo(response, transportId)
                        infoCache.put(TransportType.USB, transportId, info)
                        debugLog(
                            sdkOptions,
                            "USB serial inspection succeeded",
                            mapOf("transportId" to transportId, "deviceId" to info.id, "firmware" to info.firmware)
                        )
                        info
                    }
                } catch (e: Exception) {
                    errorSink(SdkError("serial.inspect", e))
                    debugLog(sdkOptions, "USB serial inspection failed", mapOf("transportId" to transportId, "error" to e.message))
                    null
                } finally {
                    try {
                        port.close()
                    } catch (_: IOException) {
                    }
                    connection.close()
                }
            }
        }
    }

    private fun parseDiscoveredInfo(response: Map<String, Any?>, transportId: String): DeviceInfo {
        val id = response["id"]?.toString() ?: throw IllegalStateException("INFO missing id")
        val key = response["key"]?.toString() ?: throw IllegalStateException("INFO missing key")

        return DeviceInfo(
            transportId = transportId,
            transport = TransportType.USB,
            name = response["name"] as? String,
            id = id,
            key = key,
            firmware = response["firmware"] as? String,
            model = response["model"] as? String,
            signature = serialInfoFieldAsBase64(response["signature"]),
            customHeartbeatUrl = response["custom_heartbeat_url"] as? String,
            attestationDacDer = serialInfoFieldAsBase64(response["attestation_dac_der"]),
            attestationManufacturerDer = serialInfoFieldAsBase64(response["attestation_manufacturer_der"]),
            attestationIntermediateDer = serialInfoFieldAsBase64(response["attestation_intermediate_der"]),
            attestationRootFingerprint = response["attestation_root_fingerprint"] as? String,
            heartbeatSlacDer = serialInfoFieldAsBase64(response["heartbeat_slac_der"]),
            heartbeatDer = serialInfoFieldAsBase64(response["heartbeat_der"]),
            heartbeatIntermediateDer = serialInfoFieldAsBase64(response["heartbeat_intermediate_der"]),
            heartbeatRootFingerprint = response["heartbeat_root_fingerprint"] as? String,
            verified = false,
            lastSync = (response["last_sync"] as? Number)?.toLong(),
            counter = (response["counter"] as? Number)?.toLong() ?: 0L,
            syncRequired = response["sync_required"] as? Boolean ?: false
        )
    }
}

internal class SerialDeviceSession(
    private val usbManager: UsbManager,
    private val port: com.hoho.android.usbserial.driver.UsbSerialPort,
    val transportId: String,
    private val infoCache: DeviceInfoCache,
    private val sdkOptions: com.lukuid.sdk.LukuSdkOptions,
    private val errorSink: (SdkError) -> Unit
) : Device, SerialInputOutputManager.Listener {
    private data class PendingCall(
        val action: String,
        val deferred: CompletableDeferred<Map<String, Any?>>
    )

    private val eventCallbacks = CopyOnWriteArraySet<(DeviceEventPayload) -> Unit>()
    private val messageCallbacks = CopyOnWriteArraySet<(Map<String, Any?>) -> Unit>()
    private var ioManager: SerialInputOutputManager? = null
    private val pendingCalls = ConcurrentHashMap<String, PendingCall>()
    private val callIdCounter = AtomicInteger(0)
    private val sessionLock = UsbSerialOpenCoordinator.lockFor(transportId)
    private var sessionLockHeld = false
    private var usbConnection: UsbDeviceConnection? = null

    override var info: DeviceInfo
        get() = infoInternal ?: throw IllegalStateException("Serial device not validated")
        private set(value) { infoInternal = value }

    private var infoInternal: DeviceInfo? = null
    private val codec = LukuCodec(
        onMessage = { handleMessage(it) },
        onError = { errorSink(SdkError("serial.codec", it)) }
    )

    suspend fun ensureConnected() {
        if (ioManager != null) return
        debugLog(sdkOptions, "Opening USB serial session", mapOf("transportId" to transportId))

        withTimeout(USB_OPEN_LOCK_WAIT_MS) {
            if (!sessionLockHeld) {
                sessionLock.lock()
                sessionLockHeld = true
            }
        }

        try {
            val opened = openUsbPortWithRetry(usbManager, port, transportId, sdkOptions)
                ?: throw IOException("Failed to open USB device")
            usbConnection = opened

            ioManager = SerialInputOutputManager(port, this)
            ioManager?.start()

            // Perform initial INFO
            val infoResponse = call("info", emptyMap()) as Map<String, Any?>

            val id = infoResponse["id"] as String
            val key = serialInfoFieldAsBase64(infoResponse["key"])
                ?: throw IllegalStateException("INFO missing key")

            val inputs = com.lukuid.sdk.internal.DeviceAttestationInput(
                id = id,
                key = key,
                attestationSig = serialInfoFieldAsBase64(infoResponse["signature"])
                    ?: throw IllegalStateException("INFO missing attestation signature"),
                certificateChain = serialAssembleInfoCertificateChain(infoResponse),
                attestationAlg = null,
                attestationPayloadVersion = null
            )

            val verification = com.lukuid.sdk.internal.verifyDeviceAttestation(inputs)
            debugLog(
                sdkOptions,
                "USB serial INFO validation result",
                mapOf("transportId" to transportId, "deviceId" to id, "verified" to verification.ok, "reason" to verification.reason)
            )

            if (!verification.ok && !sdkOptions.allowUnverifiedDevices) {
                closeSession()
                throw com.lukuid.sdk.DeviceTrustException(id, verification.reason ?: "Signature rejected", emptyList())
            }

            info = DeviceInfo(
                transportId = transportId,
                transport = TransportType.USB,
                name = infoResponse["name"] as? String,
                id = id,
                key = key,
                firmware = infoResponse["firmware"] as? String,
                model = infoResponse["model"] as? String,
                signature = serialInfoFieldAsBase64(infoResponse["signature"]),
                customHeartbeatUrl = infoResponse["custom_heartbeat_url"] as? String,
                attestationDacDer = serialInfoFieldAsBase64(infoResponse["attestation_dac_der"]),
                attestationManufacturerDer = serialInfoFieldAsBase64(infoResponse["attestation_manufacturer_der"]),
                attestationIntermediateDer = serialInfoFieldAsBase64(infoResponse["attestation_intermediate_der"]),
                attestationRootFingerprint = infoResponse["attestation_root_fingerprint"] as? String,
                heartbeatSlacDer = serialInfoFieldAsBase64(infoResponse["heartbeat_slac_der"]),
                heartbeatDer = serialInfoFieldAsBase64(infoResponse["heartbeat_der"]),
                heartbeatIntermediateDer = serialInfoFieldAsBase64(infoResponse["heartbeat_intermediate_der"]),
                heartbeatRootFingerprint = infoResponse["heartbeat_root_fingerprint"] as? String,
                verified = verification.ok,
                lastSync = (infoResponse["last_sync"] as? Number)?.toLong(),
                counter = (infoResponse["counter"] as? Number)?.toLong() ?: 0L,
                syncRequired = infoResponse["sync_required"] as? Boolean ?: false
            )
        } catch (e: Exception) {
            closeSession()
            throw e
        }
    }

    private fun handleMessage(message: Map<String, Any?>) {
        val action = message["action"] as? String ?: return
        val id = message["id"] as? String
        var handled = false

        if (id != null) {
            val pending = pendingCalls.remove(id)
            if (pending != null) {
                pending.deferred.complete(message)
                handled = true
            }
        }

        if (!handled) {
            val entry = pendingCalls.entries.find { it.value.action == action }
            if (entry != null) {
                pendingCalls.remove(entry.key)?.deferred?.complete(message)
                handled = true
            }
        }

        if (!handled) {
            val payload = DeviceEventPayload(
                key = action,
                data = (message["data"] as? Map<String, Any?>)
                    ?: message.filterKeys { it != "action" && it != "ok" && it != "success" }
            )
            eventCallbacks.forEach { it(payload) }
        }

        messageCallbacks.forEach { it(message) }
    }

    override fun onNewData(data: ByteArray) {
        codec.feed(data)
    }

    override fun onRunError(e: Exception) {
        errorSink(SdkError("serial.io", e))
        closeSession()
    }

    override suspend fun action(key: String, opts: Map<String, Any?>) {
        val payload = mapOf(
            "action" to key,
            "opts" to opts
        )
        sendFrame(payload)
    }

    override suspend fun call(key: String, opts: Map<String, Any?>, timeoutMillis: Long): Any? {
        val id = callIdCounter.incrementAndGet().toString()
        val deferred = CompletableDeferred<Map<String, Any?>>()
        pendingCalls[id] = PendingCall(action = key, deferred = deferred)

        val payload = mapOf(
            "action" to key,
            "id" to id,
            "opts" to opts
        )
        
        sendFrame(payload)

        return kotlinx.coroutines.withTimeout(timeoutMillis) {
            val response = deferred.await()
            if (response["ok"] == true) {
                JsonUtils.fromJsonValue(response["data"] ?: response)
            } else {
                throw Exception(
                    response["message"] as? String
                        ?: response["error"] as? String
                        ?: (response["err"] as? Map<*, *>)?.get("msg")?.toString()
                        ?: "Command failed"
                )
            }
        }
    }

    override suspend fun send(data: ByteArray) {
        try {
            port.write(data, 5000)
        } catch (e: IOException) {
            throw e
        }
    }

    private suspend fun sendFrame(payload: Map<String, Any?>) {
        send(LukuCodec.encode(payload))
    }

    override fun onEvent(listener: (DeviceEventPayload) -> Unit): Closeable {
        eventCallbacks += listener
        return Closeable { eventCallbacks -= listener }
    }

    override fun onMessage(listener: (Map<String, Any?>) -> Unit): Closeable {
        messageCallbacks += listener
        return Closeable { messageCallbacks -= listener }
    }

    fun closeSession() {
        ioManager?.stop()
        ioManager = null
        try {
            port.close()
        } catch (e: IOException) {
            // ignore
        }
        usbConnection?.close()
        usbConnection = null
        if (sessionLockHeld) {
            sessionLockHeld = false
            sessionLock.unlock()
        }
        pendingCalls.values.forEach { it.deferred.cancel() }
        pendingCalls.clear()
    }

    override suspend fun close() {
        closeSession()
    }
}

private suspend fun openUsbPortWithRetry(
    usbManager: UsbManager,
    port: UsbSerialPort,
    transportId: String,
    sdkOptions: com.lukuid.sdk.LukuSdkOptions,
): UsbDeviceConnection? {
    val startedAt = System.currentTimeMillis()
    var attempt = 0

    while (System.currentTimeMillis() - startedAt <= USB_OPEN_RETRY_WINDOW_MS) {
        attempt += 1
        val connection = usbManager.openDevice(port.driver.device)
        if (connection == null) {
            debugLog(
                sdkOptions,
                "USB serial open returned null device connection; retrying",
                mapOf("transportId" to transportId, "attempt" to attempt)
            )
            delay(USB_OPEN_RETRY_INTERVAL_MS)
            continue
        }

        try {
            port.open(connection)
            port.setParameters(
                115200,
                8,
                UsbSerialPort.STOPBITS_1,
                UsbSerialPort.PARITY_NONE
            )
            return connection
        } catch (e: Exception) {
            try {
                port.close()
            } catch (_: IOException) {
            }
            connection.close()

            val retryable = isRetryableUsbOpenError(e)
            if (!retryable || System.currentTimeMillis() - startedAt > USB_OPEN_RETRY_WINDOW_MS) {
                throw e
            }

            debugLog(
                sdkOptions,
                "USB serial open failed but will retry",
                mapOf("transportId" to transportId, "attempt" to attempt, "error" to e.message)
            )
            delay(USB_OPEN_RETRY_INTERVAL_MS)
        }
    }

    return null
}

private fun isRetryableUsbOpenError(error: Exception): Boolean {
    val message = error.message?.lowercase() ?: return false
    return message.contains("busy") ||
        message.contains("in use") ||
        message.contains("locked") ||
        message.contains("temporarily unavailable") ||
        message.contains("resource")
}
