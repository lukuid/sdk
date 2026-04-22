// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk

import java.io.Closeable

/** Supported transports. */
enum class TransportType(val wireName: String) {
    BLE("ble"),
    USB("usb")
}

/** Device identity populated by INFO. */
data class DeviceInfo(
    val transportId: String,
    val transport: TransportType,
    val name: String? = null,
    val meta: Map<String, Any?> = emptyMap(),
    val id: String,
    val key: String,
    val capabilities: List<String> = emptyList(),
    val firmware: String? = null,
    val model: String? = null,
    val signature: String? = null,
    val customHeartbeatUrl: String? = null,
    val attestationDacDer: String? = null,
    val attestationManufacturerDer: String? = null,
    val attestationIntermediateDer: String? = null,
    val attestationRootFingerprint: String? = null,
    val heartbeatSlacDer: String? = null,
    val heartbeatDer: String? = null,
    val heartbeatIntermediateDer: String? = null,
    val heartbeatRootFingerprint: String? = null,
    val verified: Boolean,
    val lastSync: Long? = null,
    val counter: Long = 0,
    val syncRequired: Boolean = false
)

/** Wire level event payload. */
data class DeviceEventPayload(
    val key: String,
    val data: Map<String, Any?>
)

/** Lifecycle signalling used by onDevice(). */
data class DeviceLifecycleEvent(
    val type: Type,
    val device: Device
) {
    enum class Type { Added, Removed }
}

/** SDK level error wrapper emitted via onError(). */
data class SdkError(
    val where: String,
    val error: Throwable
)

/** Snapshot options for getConnectedDevices(). */
data class EnumerateOptions(
    val transports: List<TransportType> = listOf(TransportType.BLE)
)

/** Scanning/watch options. */
data class WatchOptions(
    val transports: List<TransportType> = listOf(TransportType.BLE)
)

/** Device selection options. */
data class RequestDeviceOptions(
    val transports: List<TransportType> = listOf(TransportType.BLE),
    val timeoutMillis: Long = 20_000L,
    val selector: DeviceSelector? = null
)

/** Lightweight descriptor used when presenting pickers. */
data class DiscoveredDevice(
    val id: String,
    val label: String?,
    val transport: TransportType,
    val info: DeviceInfo? = null
)

typealias DeviceSelector = suspend (List<DiscoveredDevice>) -> DiscoveredDevice?

/** SDK level configuration. */
data class LukuSdkOptions(
    /**
     * If true, emit verbose discovery and validation diagnostics through Logcat.
     * Default is `false`.
     */
    val debugLogging: Boolean = false,
    /**
     * If true, devices that fail cryptographic attestation will still be exposed
     * but will have `verified = false`. Default is `false`.
     */
    val allowUnverifiedDevices: Boolean = false,
    /**
     * Base URL for the LukuID API. Defaults to https://api.lukuid.com.
     */
    val apiUrl: String = "https://api.lukuid.com"
)

/** Item for Level 2 Cloud Attestation. */
data class AttestationItem(
    val type: String,
    val data: Map<String, Any?>,
    val signature: String
)

/** Result of Level 2 Cloud Attestation. */
data class CheckResult(
    val status: String,
    val attestations: List<AttestationResult>
)

/** Individual attestation result. */
data class AttestationResult(
    val type: String,
    val verified: Boolean,
    val status: String,
    val meta: Map<String, Any?> = emptyMap()
)

/** Base device contract shared by transports. */
interface Device {
    val info: DeviceInfo

    suspend fun action(
        key: String,
        opts: Map<String, Any?> = emptyMap()
    )

    suspend fun call(
        key: String,
        opts: Map<String, Any?> = emptyMap(),
        timeoutMillis: Long = DEFAULT_CALL_TIMEOUT
    ): Any?

    /**
     * Sends raw binary data to the device (e.g. for OTA updates).
     */
    suspend fun send(data: ByteArray)

    fun onEvent(listener: (DeviceEventPayload) -> Unit): Closeable

    fun onMessage(listener: (Map<String, Any?>) -> Unit): Closeable

    suspend fun close()

    companion object {
        const val DEFAULT_CALL_TIMEOUT = 30_000L
        const val DEFAULT_RPC_TIMEOUT = 5_000L
    }
}
