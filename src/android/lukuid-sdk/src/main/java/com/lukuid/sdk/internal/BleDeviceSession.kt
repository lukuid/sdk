// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk.internal

import android.annotation.SuppressLint
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCallback
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattDescriptor
import android.bluetooth.BluetoothProfile
import android.bluetooth.BluetoothStatusCodes
import android.content.Context
import android.os.Build
import android.util.Base64
import org.json.JSONArray
import org.json.JSONObject
import com.lukuid.sdk.Device
import com.lukuid.sdk.DeviceEventPayload
import com.lukuid.sdk.DeviceInfo
import com.lukuid.sdk.DeviceTrustException
import com.lukuid.sdk.DiscoveredDevice
import com.lukuid.sdk.SdkError
import com.lukuid.sdk.TransportType
import com.lukuid.sdk.internal.DeviceAttestationInput
import com.lukuid.sdk.internal.verifyDeviceAttestation
import java.io.Closeable
import java.io.IOException
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CopyOnWriteArraySet
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicReference
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeout

private fun infoFieldAsBase64(value: Any?): String? = when (value) {
    is String -> value
    is ByteArray -> Base64.encodeToString(value, Base64.NO_WRAP)
    else -> null
}

private fun infoFieldAsPemChain(value: Any?): String? = when (value) {
    is String -> if (value.contains("-----BEGIN CERTIFICATE-----")) value else null
    is ByteArray -> {
        val decoded = value.toString(Charsets.UTF_8)
        if (decoded.contains("-----BEGIN CERTIFICATE-----")) decoded else null
    }
    else -> null
}

private fun pemFromInfoField(value: Any?): String? {
    val encoded = infoFieldAsBase64(value) ?: return null
    val normalized = encoded.trim()
    if (normalized.isEmpty()) {
        return null
    }
    val wrapped = normalized.chunked(64).joinToString("\n")
    return "-----BEGIN CERTIFICATE-----\n$wrapped\n-----END CERTIFICATE-----\n"
}

private fun assembleInfoCertificateChain(fields: Map<String, Any?>): String? {
    val parts = listOf(
        pemFromInfoField(fields["attestation_dac_der"]),
        pemFromInfoField(fields["attestation_manufacturer_der"]),
        pemFromInfoField(fields["attestation_intermediate_der"])
    ).filterNotNull()
    return if (parts.isEmpty()) null else parts.joinToString("")
}

private fun assembleInfoCertificateChain(info: DeviceInfo): String? {
    val parts = listOf(
        pemFromInfoField(info.attestationDacDer),
        pemFromInfoField(info.attestationManufacturerDer),
        pemFromInfoField(info.attestationIntermediateDer)
    ).filterNotNull()
    return if (parts.isEmpty()) null else parts.joinToString("")
}

internal class BleDeviceSession(
    private val context: Context,
    private val bluetoothDevice: BluetoothDevice,
    private val infoCache: DeviceInfoCache,
    private val sdkOptions: com.lukuid.sdk.LukuSdkOptions,
    private val errorSink: (SdkError) -> Unit,
    private val sdkProvider: () -> com.lukuid.sdk.LukuSdk,
    private val onClosed: (BleDeviceSession) -> Unit
) : Device {

    private val readySignal = CompletableDeferred<Unit>()
    private val closed = AtomicBoolean(false)
    private val gattRef = AtomicReference<BluetoothGatt?>()
    private val rxCharacteristicRef = AtomicReference<BluetoothGattCharacteristic?>()
    private val txCharacteristicRef = AtomicReference<BluetoothGattCharacteristic?>()
    
    private data class PendingRequest(val action: String, val deferred: CompletableDeferred<Any?>)
    private val pendingRequests = ConcurrentHashMap<String, PendingRequest>()
    
    private val eventCallbacks = CopyOnWriteArraySet<(DeviceEventPayload) -> Unit>()
    private val messageCallbacks = CopyOnWriteArraySet<(Map<String, Any?>) -> Unit>()
    private val pendingWrite = Mutex()
    private val writeAck = AtomicReference<CompletableDeferred<Unit>?>(null)

    @Volatile
    private var infoInternal: DeviceInfo? = null

    val transportId: String = bluetoothDevice.address ?: UUID.randomUUID().toString()

    private val codec = LukuCodec(::handleIncoming, ::handleDecodeError)

    init {
        connect()
    }

    override val info: DeviceInfo
        get() = infoInternal ?: throw IllegalStateException("Device not validated yet")

    suspend fun awaitValid(timeoutMillis: Long): Device {
        return withTimeout(timeoutMillis) {
            ensureReady()
            ensureInfo()
            this@BleDeviceSession
        }
    }

    fun toDiscoveredDevice(info: DeviceInfo? = infoInternal): DiscoveredDevice =
        DiscoveredDevice(transportId, bluetoothDevice.name, TransportType.BLE, info)

    fun isOpen(): Boolean = !closed.get()

    override suspend fun action(
        key: String,
        opts: Map<String, Any?>
    ) {
        ensureReady()
        val requestId = UUID.randomUUID().toString()
        val frame = mutableMapOf<String, Any?>(
            "action" to key,
            "id" to requestId,
            "opts" to opts
        )
        writeFrame(frame)
    }

    override suspend fun call(
        key: String,
        opts: Map<String, Any?>,
        timeoutMillis: Long
    ): Any? {
        ensureReady()
        val requestId = UUID.randomUUID().toString()
        val deferred = CompletableDeferred<Any?>()
        pendingRequests[requestId] = PendingRequest(key, deferred)
        val frame = mutableMapOf<String, Any?>(
            "action" to key,
            "id" to requestId,
            "opts" to opts
        )
        try {
            writeFrame(frame)
        } catch (t: Throwable) {
            pendingRequests.remove(requestId)
            deferred.completeExceptionally(t)
            throw t
        }
        return withTimeout(timeoutMillis) {
            deferred.await()
        }
    }

    override suspend fun send(data: ByteArray) {
        writeRaw(data)
    }

    override fun onEvent(listener: (DeviceEventPayload) -> Unit): Closeable {
        eventCallbacks += listener
        return Closeable { eventCallbacks -= listener }
    }

    override fun onMessage(listener: (Map<String, Any?>) -> Unit): Closeable {
        messageCallbacks += listener
        return Closeable { messageCallbacks -= listener }
    }

    override suspend fun close() {
        if (!closed.compareAndSet(false, true)) return
        pendingRequests.values.forEach { it.deferred.completeExceptionally(IOException("Device closed")) }
        pendingRequests.clear()
        writeAck.getAndSet(null)?.completeExceptionally(IOException("Device closed"))
        readySignal.cancel()
        val gatt = gattRef.getAndSet(null)
        withContext(Dispatchers.IO) {
            gatt?.disconnect()
            gatt?.close()
        }
        onClosed(this)
    }

    private suspend fun ensureReady() {
        readySignal.await()
    }

    private val infoMutex = Mutex()

    private suspend fun ensureInfo(): DeviceInfo {
        infoInternal?.let { return it }
        return infoMutex.withLock {
            infoInternal?.let { return@withLock it }
            val cached = infoCache.get(TransportType.BLE, transportId)
            if (cached != null) {
                debugLog(sdkOptions, "Using cached BLE device info", mapOf("transportId" to transportId, "deviceId" to cached.id))
                infoInternal = cached
                return@withLock cached
            }
            debugLog(sdkOptions, "Requesting BLE INFO", mapOf("transportId" to transportId))
            val infoData = call("info", emptyMap(), Device.DEFAULT_CALL_TIMEOUT)
            val parsed = parseInfo(infoData)
            val verification = verifyDeviceAttestation(parsed.attestation)
            debugLog(
                sdkOptions,
                "BLE INFO validation result",
                mapOf("transportId" to transportId, "deviceId" to parsed.info.id, "verified" to verification.ok, "reason" to verification.reason)
            )
            
            if (!verification.ok && !sdkOptions.allowUnverifiedDevices) {
                throw DeviceTrustException(
                    parsed.attestation.id,
                    verification.reason ?: "Signature rejected",
                    emptyList()
                )
            }
            
            val info = parsed.info.copy(verified = verification.ok)
            
            // Automatic Heartbeat if verified
            if (info.verified) {
                val now = System.currentTimeMillis() / 1000
                val lastSync = info.lastSync ?: 0L
                if (now - lastSync > 24 * 3600 || info.syncRequired) {
                    try {
                        // 1. Fetch Telemetry
                        val telemetryData = try {
                            val resp = call("fetch_telemetry", emptyMap())
                            if (resp is List<*>) JSONArray(resp) else JSONArray()
                        } catch (e: Exception) {
                            JSONArray()
                        }

                        // 2. Generate Heartbeat
                        val hbInit = call("generate_heartbeat", emptyMap()) as? Map<*, *>
                        val signature = hbInit?.get("signature")?.toString() ?: ""
                        val csr = hbInit?.get("csr")?.toString() ?: ""
                        val attestationCert = assembleInfoCertificateChain(info) ?: (hbInit?.get("attestation")?.toString() ?: "")
                        val counter = (hbInit?.get("counter") as? Number)?.toLong() ?: 0L

                        if (signature.isNotEmpty()) {
                            val previousState = JSONObject()
                            previousState.put("last_sync_bucket", hbInit?.get("last_sync_bucket"))
                            previousState.put("last_timestamp", hbInit?.get("latest_timestamp"))
                            previousState.put("current_timestamp", hbInit?.get("current_timestamp"))
                            previousState.put("last_intermediate_serial", hbInit?.get("last_intermediate_serial"))
                            previousState.put("last_slac_serial", hbInit?.get("last_slac_serial"))

                            val source = JSONObject()
                            source.put("platform", "android")
                            source.put("version", "1.0.0")
                            source.put("bundle_id", context.packageName)
                            source.put("integration", "native-sdk")

                            val hbResp = sdkProvider().heartbeat(
                                info.id,
                                info.key,
                                signature,
                                csr,
                                attestationCert,
                                info.attestationRootFingerprint,
                                counter,
                                previousState,
                                source,
                                telemetryData,
                                info.customHeartbeatUrl
                            )
                            val payload = mutableMapOf<String, Any>()
                            payload["slac_der"] = hbResp.getString("slac_der")
                            payload["heartbeat_der"] = hbResp.getString("heartbeat_der")
                            payload["intermediate_der"] = hbResp.getString("intermediate_der")
                            payload["signature"] = hbResp.getString("signature")
                            payload["timestamp"] = hbResp.getLong("timestamp")
                            call("set_heartbeat", payload)
                        }

                    } catch (e: Exception) {
                        errorSink(SdkError("ble.heartbeat", e))
                    }
                }
            }

            infoCache.put(TransportType.BLE, transportId, info)
            infoInternal = info
            info
        }
    }

    private fun parseInfo(data: Any?): ParsedInfo {
        val map = data as? Map<*, *> ?: throw IllegalStateException("INFO response missing body")
        val normalized = map.entries.associate { (k, v) -> k.toString() to JsonUtils.fromJsonValue(v) }
        val id = normalized["id"]?.toString() ?: throw IllegalStateException("INFO missing id")
        val key = infoFieldAsBase64(normalized["key"]) ?: throw IllegalStateException("INFO missing key")
        val capabilities = (normalized["capabilities"] as? List<*>)?.mapNotNull { it?.toString() } ?: emptyList()
        val firmware = normalized["firmware"]?.toString()
        val model = normalized["model"]?.toString()
        val name = normalized["name"]?.toString()
        val meta = (normalized["meta"] as? Map<*, *>)
            ?.entries
            ?.associate { (k, v) -> k.toString() to v }
            ?: emptyMap()
        
        val lastSync = (normalized["slac"] as? Map<*, *>)?.get("valid_from")?.toString()?.toLongOrNull()
        val counter = normalized["counter"]?.toString()?.toLongOrNull() ?: 0L
        val syncRequired = normalized["sync_required"] as? Boolean ?: false

        val info = DeviceInfo(
            transportId = transportId,
            transport = TransportType.BLE,
            name = name,
            meta = meta,
            id = id,
            key = key,
            capabilities = capabilities,
            firmware = firmware,
            model = model,
            signature = infoFieldAsBase64(normalized["signature"]),
            customHeartbeatUrl = normalized["custom_heartbeat_url"]?.toString(),
            attestationDacDer = infoFieldAsBase64(normalized["attestation_dac_der"]),
            attestationManufacturerDer = infoFieldAsBase64(normalized["attestation_manufacturer_der"]),
            attestationIntermediateDer = infoFieldAsBase64(normalized["attestation_intermediate_der"]),
            attestationRootFingerprint = normalized["attestation_root_fingerprint"]?.toString(),
            heartbeatSlacDer = infoFieldAsBase64(normalized["heartbeat_slac_der"]),
            heartbeatDer = infoFieldAsBase64(normalized["heartbeat_der"]),
            heartbeatIntermediateDer = infoFieldAsBase64(normalized["heartbeat_intermediate_der"]),
            heartbeatRootFingerprint = normalized["heartbeat_root_fingerprint"]?.toString(),
            verified = false,
            lastSync = lastSync,
            counter = counter,
            syncRequired = syncRequired
        )

        val attestationSig = infoFieldAsBase64(normalized["signature"])
            ?: throw IllegalStateException("INFO missing attestation signature")
        val attestationAlg = normalized["attestationAlg"]?.toString() ?: "ed25519"
        val attestationPayloadVersion = 1
        val certificateChain = assembleInfoCertificateChain(normalized)

        val attestation = DeviceAttestationInput(
            id = id,
            key = key,
            attestationSig = attestationSig,
            certificateChain = certificateChain,
            attestationAlg = attestationAlg,
            attestationPayloadVersion = attestationPayloadVersion
        )

        return ParsedInfo(info, attestation)
    }

    private data class ParsedInfo(val info: DeviceInfo, val attestation: DeviceAttestationInput)

    private fun handleIncoming(message: Map<String, Any?>) {
        messageCallbacks.forEach { it.invoke(message) }
        val action = message["action"]?.toString() ?: return
        
        var isResponse = message.containsKey("ok") ||
            message.containsKey("success") ||
            message.containsKey("error") ||
            message.containsKey("err")
        if (!isResponse) {
            isResponse = pendingRequests.values.any { it.action == action }
        }

        if (isResponse) {
            handleResponse(message, action)
        } else {
            handleEvent(message, action)
        }
    }

    private fun handleResponse(message: Map<String, Any?>, action: String) {
        val id = message["id"] as? String
        val ok = message["ok"] as? Boolean ?: true
        val data = message["data"] ?: message
        val error = message["message"]?.toString()
            ?: message["error"]?.toString()
            ?: (message["err"] as? Map<*, *>)?.get("msg")?.toString()
        
        var deferred: CompletableDeferred<Any?>? = null
        
        // 1. Try by ID
        if (id != null) {
            deferred = pendingRequests.remove(id)?.deferred
        }
        
        // 2. Try by action
        if (deferred == null) {
            val entry = pendingRequests.entries.find { it.value.action == action }
            if (entry != null) {
                deferred = pendingRequests.remove(entry.key)?.deferred
            }
        }

        if (deferred != null) {
            if (ok) {
                deferred.complete(JsonUtils.fromJsonValue(data))
            } else {
                deferred.completeExceptionally(IOException(error ?: "Command failed"))
            }
        }
    }

    private fun handleEvent(message: Map<String, Any?>, action: String) {
        val dataValue = message["data"]
        val data = if (dataValue is Map<*, *>) {
            dataValue.entries.associate { (k, v) -> k.toString() to v }
        } else {
            emptyMap()
        }
        val payload = DeviceEventPayload(action, data)
        eventCallbacks.forEach { it.invoke(payload) }
    }

    private fun handleDecodeError(t: Throwable) {
        errorSink(SdkError("ble.codec", t))
    }

    @SuppressLint("MissingPermission")
    private fun connect() {
        val gatt = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            bluetoothDevice.connectGatt(context, false, gattCallback, BluetoothDevice.TRANSPORT_LE)
        } else {
            bluetoothDevice.connectGatt(context, false, gattCallback)
        }
        gattRef.set(gatt)
        if (gatt == null) {
            readySignal.completeExceptionally(IllegalStateException("Unable to connect GATT"))
        }
    }

    private fun enableNotifications(gatt: BluetoothGatt, characteristic: BluetoothGattCharacteristic) {
        gatt.setCharacteristicNotification(characteristic, true)
        val descriptor = characteristic.getDescriptor(BleConstants.CLIENT_CHARACTERISTIC_CONFIG_UUID)
        if (descriptor == null) {
            readySignal.completeExceptionally(IllegalStateException("Missing notification descriptor"))
            return
        }
        descriptor.value = BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE
        if (!gatt.writeDescriptor(descriptor)) {
            readySignal.completeExceptionally(IOException("Unable to enable notifications"))
        }
    }

    private suspend fun writeFrame(frame: Map<String, Any?>) {
        val payload = LukuCodec.encode(frame)
        writeRaw(payload)
    }

    private suspend fun writeRaw(payload: ByteArray) {
        val chunkSize = 180
        var offset = 0
        while (offset < payload.size) {
            val end = minOf(offset + chunkSize, payload.size)
            writeChunk(payload.copyOfRange(offset, end))
            offset = end
        }
    }

    private suspend fun writeChunk(payload: ByteArray) {
        pendingWrite.withLock {
            val gatt = gattRef.get() ?: throw IOException("Gatt not ready")
            val rxCharacteristic = rxCharacteristicRef.get() ?: throw IOException("RX characteristic missing")
            val ack = CompletableDeferred<Unit>()
            writeAck.set(ack)
            val status = if (Build.VERSION.SDK_INT >= 33) {
                gatt.writeCharacteristic(
                    rxCharacteristic,
                    payload,
                    BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT
                )
            } else {
                rxCharacteristic.writeType = BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT
                rxCharacteristic.value = payload
                if (gatt.writeCharacteristic(rxCharacteristic)) BluetoothGatt.GATT_SUCCESS else BluetoothGatt.GATT_FAILURE
            }
            if (status != BluetoothGatt.GATT_SUCCESS && status != BluetoothStatusCodes.SUCCESS) {
                writeAck.set(null)
                throw IOException("Write failed: $status")
            }
            withTimeout(5_000L) {
                ack.await()
            }
        }
    }

    private fun closeInternal(status: Int) {
        if (!closed.compareAndSet(false, true)) return
        pendingRequests.values.forEach { it.deferred.completeExceptionally(IOException("Connection lost")) }
        pendingRequests.clear()
        writeAck.getAndSet(null)?.completeExceptionally(IOException("Connection lost"))
        readySignal.cancel()
        gattRef.getAndSet(null)?.close()
        onClosed(this)
        if (status != BluetoothGatt.GATT_SUCCESS) {
            errorSink(SdkError("ble.connection", IOException("Gatt status $status")))
        }
    }

    private val gattCallback = object : BluetoothGattCallback() {
        override fun onConnectionStateChange(gatt: BluetoothGatt, status: Int, newState: Int) {
            if (newState == BluetoothProfile.STATE_CONNECTED) {
                gatt.discoverServices()
            } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                closeInternal(status)
            }
        }

        override fun onServicesDiscovered(gatt: BluetoothGatt, status: Int) {
            if (status != BluetoothGatt.GATT_SUCCESS) {
                readySignal.completeExceptionally(IOException("Service discovery failed: $status"))
                return
            }
            val service = gatt.getService(BleConstants.SERVICE_UUID)
            if (service == null) {
                readySignal.completeExceptionally(IllegalStateException("Service missing"))
                return
            }
            val rx = service.getCharacteristic(BleConstants.RX_CHARACTERISTIC_UUID)
            val tx = service.getCharacteristic(BleConstants.TX_CHARACTERISTIC_UUID)
            if (rx == null || tx == null) {
                readySignal.completeExceptionally(IllegalStateException("Characteristics missing"))
                return
            }
            rxCharacteristicRef.set(rx)
            txCharacteristicRef.set(tx)
            enableNotifications(gatt, tx)
        }

        override fun onDescriptorWrite(
            gatt: BluetoothGatt,
            descriptor: BluetoothGattDescriptor,
            status: Int
        ) {
            if (descriptor.uuid == BleConstants.CLIENT_CHARACTERISTIC_CONFIG_UUID) {
                if (status == BluetoothGatt.GATT_SUCCESS) {
                    if (!readySignal.isCompleted) {
                        readySignal.complete(Unit)
                    }
                } else {
                    readySignal.completeExceptionally(IOException("Descriptor write failed: $status"))
                }
            }
        }

        override fun onCharacteristicChanged(
            gatt: BluetoothGatt,
            characteristic: BluetoothGattCharacteristic
        ) {
            if (characteristic.uuid == BleConstants.TX_CHARACTERISTIC_UUID) {
                characteristic.value?.let { codec.feed(it) }
            }
        }

        override fun onCharacteristicWrite(
            gatt: BluetoothGatt,
            characteristic: BluetoothGattCharacteristic,
            status: Int
        ) {
            if (characteristic.uuid == BleConstants.RX_CHARACTERISTIC_UUID) {
                writeAck.getAndSet(null)?.let { deferred ->
                    if (status == BluetoothGatt.GATT_SUCCESS || status == BluetoothStatusCodes.SUCCESS) {
                        deferred.complete(Unit)
                    } else {
                        deferred.completeExceptionally(IOException("Write failed: $status"))
                    }
                }
            }
        }
    }
}
