// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk.internal

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothProfile
import android.bluetooth.le.BluetoothLeScanner
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanFilter
import android.bluetooth.le.ScanResult
import android.bluetooth.le.ScanSettings
import android.content.Context
import android.os.ParcelUuid
import com.lukuid.sdk.Device
import com.lukuid.sdk.DeviceLifecycleEvent
import com.lukuid.sdk.DeviceTrustException
import com.lukuid.sdk.DeviceSelector
import com.lukuid.sdk.DiscoveredDevice
import com.lukuid.sdk.RequestDeviceOptions
import com.lukuid.sdk.SdkError
import com.lukuid.sdk.TransportType
import java.io.Closeable
import java.io.IOException
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CopyOnWriteArraySet
import java.util.concurrent.atomic.AtomicBoolean
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeout

internal class BleTransport(
    context: Context,
    private val scope: CoroutineScope,
    private val infoCache: DeviceInfoCache,
    private val sdkOptions: com.lukuid.sdk.LukuSdkOptions,
    private val errorSink: (SdkError) -> Unit,
    private val sdkProvider: () -> com.lukuid.sdk.LukuSdk
) : Closeable {

    private val appContext = context.applicationContext
    private val bluetoothManager: BluetoothManager? =
        appContext.getSystemService(BluetoothManager::class.java)
    private val adapter: BluetoothAdapter? = bluetoothManager?.adapter
    private val scanner: BluetoothLeScanner?
        get() = adapter?.bluetoothLeScanner

    private val scanning = AtomicBoolean(false)
    private val lifecycleListeners = CopyOnWriteArraySet<(BleTransportEvent) -> Unit>()
    private val discoveryListeners = CopyOnWriteArraySet<(DiscoveredDevice) -> Unit>()
    private val sessions = ConcurrentHashMap<String, BleDeviceSession>()
    private val connecting = CopyOnWriteArraySet<String>()

    private val scanCallback = object : ScanCallback() {
        override fun onScanResult(callbackType: Int, result: ScanResult) {
            result.device?.let { handleDiscovery(it) }
        }

        override fun onBatchScanResults(results: MutableList<ScanResult>) {
            results.forEach { it.device?.let(::handleDiscovery) }
        }

        override fun onScanFailed(errorCode: Int) {
            errorSink(SdkError("ble.scan", IOException("Scan failed: $errorCode")))
        }
    }

    fun onLifecycle(listener: (BleTransportEvent) -> Unit): Closeable {
        lifecycleListeners += listener
        return Closeable { lifecycleListeners -= listener }
    }

    fun onDiscovery(listener: (DiscoveredDevice) -> Unit): Closeable {
        discoveryListeners += listener
        return Closeable { discoveryListeners -= listener }
    }

    fun startWatching() {
        if (adapter?.isEnabled != true || !scanning.compareAndSet(false, true)) return
        debugLog(sdkOptions, "BLE watching started")
        startScan()
    }

    fun stopWatching() {
        if (!scanning.compareAndSet(true, false)) return
        debugLog(sdkOptions, "BLE watching stopped")
        stopScan()
    }

    suspend fun connect(deviceId: String): Device {
        debugLog(sdkOptions, "BLE connect requested", mapOf("deviceId" to deviceId))
        val device = adapter?.getRemoteDevice(deviceId) ?: throw IOException("Device not found")
        return ensureSession(device, propagateTrustFailure = true) ?: throw IOException("Failed to connect")
    }

    suspend fun enumerateDiscovered(): List<DiscoveredDevice> {
        val result = mutableListOf<DiscoveredDevice>()
        val connected = bluetoothManager?.getConnectedDevices(BluetoothProfile.GATT).orEmpty()
        debugLog(sdkOptions, "BLE enumerateDiscovered snapshot", mapOf("connectedGattDevices" to connected.size))

        connected.forEach { device ->
            val address = device.address ?: return@forEach
            result += DiscoveredDevice(
                id = address,
                label = device.name,
                transport = TransportType.BLE,
                info = infoCache.get(TransportType.BLE, address)
            )
        }

        sessions.values.forEach { session ->
            if (result.none { it.id == session.transportId }) {
                result += session.toDiscoveredDevice(infoCache.get(TransportType.BLE, session.transportId))
            }
        }

        return result
    }

    suspend fun enumerateConnected(): List<Device> {
        val result = mutableListOf<Device>()
        val connected = bluetoothManager?.getConnectedDevices(BluetoothProfile.GATT).orEmpty()
        debugLog(sdkOptions, "BLE enumerateConnected snapshot", mapOf("connectedGattDevices" to connected.size))
        connected.forEach { device ->
            ensureSession(device, propagateTrustFailure = true)?.let { result += it }
        }
        sessions.values.filter { it.isOpen() }.forEach { session ->
            if (result.none { (it as? BleDeviceSession)?.transportId == session.transportId }) {
                result += session
            }
        }
        return result
    }

    suspend fun requestDevice(options: RequestDeviceOptions): Device {
        require(options.transports.contains(TransportType.BLE)) { "BLE transport required" }
        val snapshot = enumerateSessions(propagateTrustFailure = true)
        selectFromSnapshot(snapshot, options.selector)?.let { return it }
        val deferred = CompletableDeferred<BleDeviceSession>()
        val listener = onLifecycle { event ->
            if (event.type == BleTransportEvent.Type.Added && !deferred.isCompleted) {
                scope.launch {
                    try {
                        val chosen = selectFromSnapshot(enumerateSessions(propagateTrustFailure = true), options.selector)
                            ?: if (options.selector == null) event.session else null
                        if (chosen != null && !deferred.isCompleted) {
                            deferred.complete(chosen)
                        }
                    } catch (t: Throwable) {
                        if (t is DeviceTrustException && !deferred.isCompleted) {
                            deferred.completeExceptionally(t)
                        }
                    }
                }
            }
        }
        startWatching()
        return try {
            withTimeout(options.timeoutMillis) {
                deferred.await()
            }
        } finally {
            listener.close()
        }
    }

    override fun close() {
        stopScan()
        sessions.values.forEach { scope.launch { it.close() } }
        sessions.clear()
        lifecycleListeners.clear()
        discoveryListeners.clear()
    }

    private suspend fun enumerateSessions(propagateTrustFailure: Boolean = false): List<BleDeviceSession> {
        val result = mutableListOf<BleDeviceSession>()
        val connected = bluetoothManager?.getConnectedDevices(BluetoothProfile.GATT).orEmpty()
        connected.forEach { device ->
            ensureSession(device, propagateTrustFailure)?.let { result += it }
        }
        result += sessions.values.filter { it.isOpen() }
        return result.distinctBy { it.transportId }
    }

    private suspend fun selectFromSnapshot(
        snapshot: List<BleDeviceSession>,
        selector: DeviceSelector?
    ): BleDeviceSession? {
        if (snapshot.isEmpty()) return null
        if (selector == null) return snapshot.first()
        val discovered = snapshot.map { it.toDiscoveredDevice() }
        val selection = selector.invoke(discovered) ?: return null
        return snapshot.firstOrNull { it.transportId == selection.id }
    }

    @SuppressLint("MissingPermission")
    private fun startScan() {
        debugLog(sdkOptions, "Starting BLE scan")
        val filters = listOf(
            ScanFilter.Builder().setServiceUuid(ParcelUuid(BleConstants.SERVICE_UUID)).build()
        )
        val settings = ScanSettings.Builder()
            .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
            .build()
        scanner?.startScan(filters, settings, scanCallback)
    }

    @SuppressLint("MissingPermission")
    private fun stopScan() {
        debugLog(sdkOptions, "Stopping BLE scan")
        scanner?.stopScan(scanCallback)
    }

    @SuppressLint("MissingPermission")
    private fun handleDiscovery(device: BluetoothDevice) {
        val address = device.address ?: return
        if (sessions.containsKey(address)) return
        debugLog(sdkOptions, "BLE discovery event", mapOf("deviceId" to address, "name" to device.name))
        
        val discovered = DiscoveredDevice(
            id = address,
            label = device.name,
            transport = TransportType.BLE,
            info = infoCache.get(TransportType.BLE, address)
        )
        emitDiscovery(discovered)
    }

    private suspend fun ensureSession(
        device: BluetoothDevice,
        propagateTrustFailure: Boolean = false
    ): BleDeviceSession? {
        val address = device.address ?: return null
        debugLog(sdkOptions, "Ensuring BLE session", mapOf("deviceId" to address, "name" to device.name))
        sessions[address]?.let { existing ->
            return if (existing.isOpen()) existing else null
        }
        val session = BleDeviceSession(
            appContext,
            device,
            infoCache,
            sdkOptions,
            errorSink,
            sdkProvider
        ) { removed ->
            sessions.remove(removed.transportId)
            emitLifecycle(BleTransportEvent(BleTransportEvent.Type.Removed, removed))
        }
        sessions[address] = session
        val validated = try {
            session.awaitValid(VALIDATION_TIMEOUT_MS)
            debugLog(sdkOptions, "BLE session validated", mapOf("deviceId" to address))
            true
        } catch (t: Throwable) {
            debugLog(
                sdkOptions,
                "BLE session validation failed",
                mapOf("deviceId" to address, "error" to t.message, "allowUnverified" to sdkOptions.allowUnverifiedDevices)
            )
            if (!sdkOptions.allowUnverifiedDevices || t !is DeviceTrustException) {
                sessions.remove(address)
                scope.launch { session.close() }
                errorSink(SdkError("ble.validate", t))
                if (propagateTrustFailure && t is DeviceTrustException) {
                    throw t
                }
                false
            } else {
                // Allowed through even if verification failed
                true
            }
        }
        return if (validated) {
            emitLifecycle(BleTransportEvent(BleTransportEvent.Type.Added, session))
            session
        } else {
            null
        }
    }

    private fun emitLifecycle(event: BleTransportEvent) {
        lifecycleListeners.forEach { it.invoke(event) }
    }

    private fun emitDiscovery(device: DiscoveredDevice) {
        discoveryListeners.forEach { it.invoke(device) }
    }

    companion object {
        private const val VALIDATION_TIMEOUT_MS = 15_000L
    }
}

internal data class BleTransportEvent(
    val type: Type,
    val session: BleDeviceSession
) {
    enum class Type { Added, Removed }
}
