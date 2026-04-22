// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk.internal

import com.lukuid.sdk.DeviceInfo
import com.lukuid.sdk.TransportType
import java.util.concurrent.ConcurrentHashMap

internal class DeviceInfoCache {
    private val cache = ConcurrentHashMap<String, DeviceInfo>()

    fun get(transport: TransportType, transportId: String): DeviceInfo? = cache[key(transport, transportId)]

    fun put(transport: TransportType, transportId: String, info: DeviceInfo) {
        cache[key(transport, transportId)] = info
    }

    private fun key(transport: TransportType, transportId: String) =
        "${transport.wireName}:$transportId"
}
