// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk.internal

import java.util.UUID

internal object BleConstants {
    val SERVICE_UUID: UUID = UUID.fromString("7b7e4f7a-2f0d-4b5a-9d3d-3f0a7e0b9f7c")
    val RX_CHARACTERISTIC_UUID: UUID = UUID.fromString("7b7e4f7a-2f0d-4b5a-9d3d-3f0a7e0b9f7d")
    val TX_CHARACTERISTIC_UUID: UUID = UUID.fromString("7b7e4f7a-2f0d-4b5a-9d3d-3f0a7e0b9f7e")
    val CLIENT_CHARACTERISTIC_CONFIG_UUID: UUID = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb")
}
