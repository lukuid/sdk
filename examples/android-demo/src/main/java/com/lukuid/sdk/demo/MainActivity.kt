// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk.demo

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.text.method.ScrollingMovementMethod
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.lukuid.sdk.Device
import com.lukuid.sdk.DeviceLifecycleEvent
import com.lukuid.sdk.LukuSdk
import com.lukuid.sdk.RequestDeviceOptions
import com.lukuid.sdk.TransportType
import java.io.Closeable
import java.util.LinkedHashMap
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    private lateinit var sdk: LukuSdk
    private var deviceSubscription: Closeable? = null
    private var errorSubscription: Closeable? = null
    private val devices = LinkedHashMap<String, Device>()

    private lateinit var statusView: TextView
    private lateinit var devicesView: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        statusView = findViewById(R.id.text_status)
        devicesView = findViewById(R.id.text_devices)
        devicesView.movementMethod = ScrollingMovementMethod()

        sdk = LukuSdk(applicationContext)

        deviceSubscription = sdk.onDevice { event ->
            when (event.type) {
                DeviceLifecycleEvent.Type.Added -> devices[event.device.info.id] = event.device
                DeviceLifecycleEvent.Type.Removed -> devices.remove(event.device.info.id)
            }
            updateDevices()
        }
        errorSubscription = sdk.onError { err ->
            setStatus("SDK error from ${err.where}: ${err.error.message}")
        }

        findViewById<Button>(R.id.button_start_watch).setOnClickListener {
            ensurePermissions()
            sdk.startWatching()
            setStatus("Watching for BLE devices…")
            lifecycleScope.launch {
                val snapshot = sdk.getConnectedDevices()
                snapshot.forEach { devices[it.info.id] = it }
                updateDevices()
            }
        }

        findViewById<Button>(R.id.button_stop_watch).setOnClickListener {
            sdk.stopWatching()
            setStatus("Watcher stopped")
        }

        findViewById<Button>(R.id.button_request_device).setOnClickListener {
            ensurePermissions()
            lifecycleScope.launch {
                try {
                    setStatus("Requesting device…")
                    val device = sdk.requestDevice(
                        RequestDeviceOptions(transports = listOf(TransportType.BLE))
                    )
                    devices[device.info.id] = device
                    updateDevices()
                    setStatus("Connected ${device.info.id}")
                    val infoResponse = device.cmd("INFO") as? Map<*, *>
                    appendDeviceLog("INFO => $infoResponse")
                } catch (t: Throwable) {
                    setStatus("Request failed: ${t.message}")
                }
            }
        }
    }

    private fun appendDeviceLog(line: String) {
        runOnUiThread {
            devicesView.append("\n$line")
        }
    }

    private fun updateDevices() {
        val text = buildString {
            append("Devices (" + devices.size + ")\n")
            devices.values.forEach { device ->
                append("• ${device.info.id} via ${device.info.transport}\n")
            }
        }
        runOnUiThread {
            devicesView.text = text
        }
    }

    private fun setStatus(text: String) {
        runOnUiThread { statusView.text = text }
    }

    private fun ensurePermissions() {
        val required = PERMISSIONS.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (required.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, required.toTypedArray(), REQUEST_CODE)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        deviceSubscription?.close()
        errorSubscription?.close()
        sdk.close()
    }

    companion object {
        private const val REQUEST_CODE = 42
        private val PERMISSIONS = arrayOf(
            Manifest.permission.BLUETOOTH_SCAN,
            Manifest.permission.BLUETOOTH_CONNECT,
            Manifest.permission.ACCESS_FINE_LOCATION
        )
    }
}
