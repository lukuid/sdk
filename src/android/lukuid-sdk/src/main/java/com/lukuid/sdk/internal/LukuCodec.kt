// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk.internal

import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.Base64
import com.lukuid.sdk.proto.LukuIDProto

internal class LukuCodec(
    private val onMessage: (Map<String, Any?>) -> Unit,
    private val onError: (Throwable) -> Unit
) {
    private var buffer = ByteArray(0)
    private val MAGIC = byteArrayOf(0x4C, 0x55, 0x4B, 0x55, 0x49, 0x44, 0x01, 0x7E) // "LUKUID\x01~"

    fun feed(chunk: ByteArray) {
        buffer += chunk
        scan()
    }

    private fun scan() {
        var consumed = 0
        val magicSize = MAGIC.size
        
        while (true) {
            val currentSize = buffer.size
            if (currentSize - consumed < magicSize) break

            // Scan for MAGIC
            var magicIdx = -1
            for (i in consumed..currentSize - magicSize) {
                if (isMagic(buffer, i)) {
                    magicIdx = i
                    break
                }
            }

            if (magicIdx == -1) {
                consumed = maxOf(consumed, currentSize - (magicSize - 1))
                break
            }

            if (currentSize - magicIdx < magicSize + 4) {
                consumed = magicIdx
                break
            }

            val len = ByteBuffer.wrap(buffer).order(ByteOrder.LITTLE_ENDIAN).getInt(magicIdx + magicSize)
            
            if (len < 0 || len > 10 * 1024 * 1024) { // 10MB sanity limit
                 consumed = magicIdx + 1
                 continue
            }

            val totalFrameSize = magicSize + 4 + len + magicSize
            if (currentSize - magicIdx < totalFrameSize) {
                consumed = magicIdx
                break
            }

            // Verify trailing MAGIC
            if (!isMagic(buffer, magicIdx + magicSize + 4 + len)) {
                consumed = magicIdx + 1
                continue
            }

            // Parse Payload
            try {
                val payloadBytes = buffer.copyOfRange(magicIdx + magicSize + 4, magicIdx + magicSize + 4 + len)
                if (!looksLikeCommandResponsePayload(payloadBytes)) {
                    consumed = magicIdx + totalFrameSize
                    continue
                }
                val response = LukuIDProto.CommandResponse.parseFrom(payloadBytes)
                onMessage(responseToMap(response))
            } catch (t: Throwable) {
                onError(t)
            }

            consumed = magicIdx + totalFrameSize
        }

        if (consumed > 0) {
            buffer = if (consumed >= buffer.size) {
                ByteArray(0)
            } else {
                buffer.copyOfRange(consumed, buffer.size)
            }
        }
    }

    private fun isMagic(data: ByteArray, offset: Int): Boolean {
        if (offset + MAGIC.size > data.size) return false
        return MAGIC.indices.all { index -> data[offset + index] == MAGIC[index] }
    }
    
    private fun maxOf(a: Int, b: Int): Int {
        return if (a >= b) a else b
    }

    private fun looksLikeCommandResponsePayload(payload: ByteArray): Boolean {
        var offset = 0
        var sawStatus = false
        var sawSuccess = false

        while (offset < payload.size) {
            val key = readVarint(payload, offset) ?: return false
            offset = key.nextOffset
            val field = key.value ushr 3
            val wireType = key.value and 0x07

            if (field == 2) {
                sawStatus = true
            } else if (field == 3) {
                sawSuccess = true
            }

            offset = skipField(payload, offset, wireType) ?: return false
        }

        return sawStatus || sawSuccess
    }

    private data class VarintRead(val value: Int, val nextOffset: Int)

    private fun readVarint(payload: ByteArray, start: Int): VarintRead? {
        var shift = 0
        var value = 0
        var offset = start

        while (offset < payload.size && shift < 35) {
            val byte = payload[offset].toInt() and 0xFF
            value = value or ((byte and 0x7F) shl shift)
            offset += 1
            if ((byte and 0x80) == 0) {
                return VarintRead(value, offset)
            }
            shift += 7
        }

        return null
    }

    private fun skipField(payload: ByteArray, start: Int, wireType: Int): Int? {
        return when (wireType) {
            0 -> readVarint(payload, start)?.nextOffset
            1 -> if (start + 8 <= payload.size) start + 8 else null
            2 -> {
                val length = readVarint(payload, start) ?: return null
                val end = length.nextOffset + length.value
                if (end <= payload.size) end else null
            }
            5 -> if (start + 4 <= payload.size) start + 4 else null
            else -> null
        }
    }

    private fun responseToMap(response: LukuIDProto.CommandResponse): Map<String, Any?> {
        val map = mutableMapOf<String, Any?>()
        map["action"] = response.action
        map["status"] = response.status.name
        map["success"] = response.success
        map["ok"] = response.success // Maintain legacy API support
        
        if (response.errorCode.isNotEmpty()) map["error_code"] = response.errorCode
        if (response.message.isNotEmpty()) {
            map["message"] = response.message
            map["error"] = response.message // Maintain legacy API support
        }
        if (!response.success) {
            map["err"] = mapOf(
                "code" to (if (response.errorCode.isNotEmpty()) response.errorCode else "DEVICE_ERROR"),
                "msg" to (if (response.message.isNotEmpty()) response.message else "Command failed")
            )
        }
        
        when (response.payloadCase) {
            LukuIDProto.CommandResponse.PayloadCase.DEVICE_INFO -> {
                val info = response.deviceInfo
                if (info.handshake.isNotEmpty()) map["handshake"] = info.handshake
                map["uptime_ms"] = info.uptimeMs
                if (!info.token.isEmpty) map["token"] = info.token.toByteArray()
                map["battery"] = info.battery
                map["voltage"] = info.voltage
                map["vbus"] = info.vbus
                map["counter"] = info.counter
                map["sync_required"] = info.syncRequired
                if (info.name.isNotEmpty()) map["name"] = info.name
                if (info.id.isNotEmpty()) map["id"] = info.id
                if (info.product.isNotEmpty()) map["product"] = info.product
                if (info.model.isNotEmpty()) map["model"] = info.model
                if (info.firmware.isNotEmpty()) map["firmware"] = info.firmware
                if (info.revision.isNotEmpty()) map["revision"] = info.revision
                map["pairing"] = info.pairing
                if (info.customHeartbeatUrl.isNotEmpty()) map["custom_heartbeat_url"] = info.customHeartbeatUrl
                map["telemetry"] = info.telemetry
                if (info.managedBy.isNotEmpty()) map["managed_by"] = info.managedBy
                if (!info.attestationDacDer.isEmpty) map["attestation_dac_der"] = info.attestationDacDer.toByteArray()
                if (!info.attestationManufacturerDer.isEmpty) map["attestation_manufacturer_der"] = info.attestationManufacturerDer.toByteArray()
                if (!info.attestationIntermediateDer.isEmpty) map["attestation_intermediate_der"] = info.attestationIntermediateDer.toByteArray()
                if (info.attestationRootFingerprint.isNotEmpty()) map["attestation_root_fingerprint"] = info.attestationRootFingerprint
                if (!info.heartbeatSlacDer.isEmpty) map["heartbeat_slac_der"] = info.heartbeatSlacDer.toByteArray()
                if (!info.heartbeatDer.isEmpty) map["heartbeat_der"] = info.heartbeatDer.toByteArray()
                if (!info.heartbeatIntermediateDer.isEmpty) map["heartbeat_intermediate_der"] = info.heartbeatIntermediateDer.toByteArray()
                if (info.heartbeatRootFingerprint.isNotEmpty()) map["heartbeat_root_fingerprint"] = info.heartbeatRootFingerprint
                if (!info.signature.isEmpty) map["signature"] = info.signature.toByteArray()
                if (!info.key.isEmpty) map["key"] = info.key.toByteArray()
            }
            LukuIDProto.CommandResponse.PayloadCase.NETWORK_CONFIG -> {
                val config = response.networkConfig
                if (config.wifiSsid.isNotEmpty()) map["wifi_ssid"] = config.wifiSsid
                map["wifi_password_set"] = config.wifiPasswordSet
                if (config.mqttBrokerUrl.isNotEmpty()) map["mqtt_broker_url"] = config.mqttBrokerUrl
                map["mqtt_port"] = config.mqttPort
                if (config.mqttTopic.isNotEmpty()) map["mqtt_topic"] = config.mqttTopic
                map["mqtt_broadcast_frequency_seconds"] = config.mqttBroadcastFrequencySeconds
                if (config.mqttUsername.isNotEmpty()) map["mqtt_username"] = config.mqttUsername
                map["mqtt_password_set"] = config.mqttPasswordSet
                map["mqtt_broadcast_enabled"] = config.mqttBroadcastEnabled
                if (!config.csr.isEmpty) map["csr"] = config.csr.toByteArray()
                if (!config.mqttCertificateDer.isEmpty) map["mqtt_certificate_der"] = config.mqttCertificateDer.toByteArray()
                if (!config.mqttCaDer.isEmpty) map["mqtt_ca_der"] = config.mqttCaDer.toByteArray()
            }
            LukuIDProto.CommandResponse.PayloadCase.SCAN_RECORD -> {
                map["scan_record"] = scanRecordToMap(response.scanRecord)
            }
            LukuIDProto.CommandResponse.PayloadCase.ENV_RECORD -> {
                map["env_record"] = envRecordToMap(response.envRecord)
            }
            LukuIDProto.CommandResponse.PayloadCase.FETCH_RESPONSE -> {
                map["data"] = response.fetchResponse.dataList.map { dataEntryToMap(it) }
            }
            LukuIDProto.CommandResponse.PayloadCase.FULL_RECORD_RESPONSE -> {
                map["full_record"] = fullRecordToMap(response.fullRecordResponse)
            }
            LukuIDProto.CommandResponse.PayloadCase.HEARTBEAT_INIT -> {
                val heartbeat = response.heartbeatInit
                if (heartbeat.signatureB64.isNotEmpty()) map["signature"] = heartbeat.signatureB64
                if (heartbeat.csrPem.isNotEmpty()) map["csr"] = heartbeat.csrPem
                if (heartbeat.attestationB64.isNotEmpty()) map["attestation"] = heartbeat.attestationB64
                map["counter"] = heartbeat.counter
                map["last_sync_bucket"] = heartbeat.lastSyncBucket
                map["latest_timestamp"] = heartbeat.latestTimestamp
                map["current_timestamp"] = heartbeat.currentTimestamp
                if (heartbeat.lastIntermediateSerial.isNotEmpty()) map["last_intermediate_serial"] = heartbeat.lastIntermediateSerial
                if (heartbeat.lastSlacSerial.isNotEmpty()) map["last_slac_serial"] = heartbeat.lastSlacSerial
            }
            LukuIDProto.CommandResponse.PayloadCase.FETCH_TELEMETRY -> {
                val telemetry = response.fetchTelemetry
                map["data"] = telemetry.rowsList.map { row ->
                    row.valuesList.map { telemetryValueToValue(it) }
                }
                if (telemetry.hasSignature()) {
                    map["signature"] = telemetry.signature.toByteArray()
                }
                if (telemetry.hasCanonicalString()) {
                    map["canonical_string"] = telemetry.canonicalString
                }
            }
            else -> {}
        }
        return map
    }

    private fun telemetryValueToValue(v: LukuIDProto.TelemetryValue): Any? {
        return when (v.kindCase) {
            LukuIDProto.TelemetryValue.KindCase.FVAL -> v.fval
            LukuIDProto.TelemetryValue.KindCase.SVAL -> v.sval
            LukuIDProto.TelemetryValue.KindCase.IVAL -> v.ival
            LukuIDProto.TelemetryValue.KindCase.BVAL -> v.bval
            else -> null
        }
    }

    private fun metricValueToMap(metric: LukuIDProto.MetricValue): Any? {
        return when (metric.kindCase) {
            LukuIDProto.MetricValue.KindCase.VALUE -> metric.value
            LukuIDProto.MetricValue.KindCase.STATS -> mapOf(
                "avg" to metric.stats.avg,
                "min" to metric.stats.min,
                "max" to metric.stats.max,
                "variance" to metric.stats.variance,
                "count" to metric.stats.count
            )
            else -> null
        }
    }

    private fun dataEntryToMap(entry: LukuIDProto.DataEntry): Map<String, Any?> {
        return when (entry.minRecordCase) {
            LukuIDProto.DataEntry.MinRecordCase.SCAN_MIN -> mapOf(
                "view" to "animalreader_list",
                "type" to "scan_min",
                "record" to mapOf(
                    "version" to entry.scanMin.version,
                    "record_id" to entry.scanMin.recordId,
                    "timestamp_utc" to entry.scanMin.timestampUtc,
                    "tag_id" to entry.scanMin.tagId,
                    "score_bio" to entry.scanMin.scoreBio,
                    "score_auth" to entry.scanMin.scoreAuth,
                    "score_env" to entry.scanMin.scoreEnv
                )
            )
            LukuIDProto.DataEntry.MinRecordCase.ENVIRONMENT_MIN -> mapOf(
                "view" to "guardcard_list",
                "type" to "environment_min",
                "record" to mapOf(
                    "version" to entry.environmentMin.version,
                    "record_id" to entry.environmentMin.recordId,
                    "timestamp_utc" to entry.environmentMin.timestampUtc,
                    "lux" to metricValueToMap(entry.environmentMin.lux),
                    "temp_c" to metricValueToMap(entry.environmentMin.tempC),
                    "humidity_pct" to metricValueToMap(entry.environmentMin.humidityPct),
                    "voc_index" to metricValueToMap(entry.environmentMin.vocIndex),
                    "tamper" to entry.environmentMin.tamper,
                    "wake_event" to entry.environmentMin.wakeEvent
                )
            )
            else -> mapOf("type" to "unknown")
        }
    }

    private fun fullRecordToMap(full: LukuIDProto.FullRecordResponse): Map<String, Any?> {
        val out = mutableMapOf<String, Any?>()
        out["record_id"] = full.recordId
        when (full.fullRecordCase) {
            LukuIDProto.FullRecordResponse.FullRecordCase.SCAN_FULL -> {
                out["view"] = "animalreader_detail"
                out["scan_record"] = scanRecordToMap(full.scanFull)
            }
            LukuIDProto.FullRecordResponse.FullRecordCase.ENVIRONMENT_FULL -> {
                out["view"] = "guardcard_detail"
                out["env_record"] = envRecordToMap(full.environmentFull)
            }
            else -> out["view"] = "unknown"
        }
        return out
    }

    private fun scanRecordToMap(record: LukuIDProto.ScanRecord): Map<String, Any?> {
        val map = mutableMapOf<String, Any?>()
        map["version"] = record.version
        map["scan_id"] = record.scanId
        map["signature"] = record.signature
        map["previous_signature"] = record.previousSignature
        if (record.hasPayload()) {
            val p = record.payload
            map["payload"] = mutableMapOf<String, Any?>().apply {
                put("ctr", p.ctr)
                put("id", p.id)
                put("timestamp_utc", p.timestampUtc)
                put("uptime_us", p.uptimeUs)
                put("temperature_c", p.temperatureC)
                put("nonce", p.nonce)
                put("firmware", p.firmware)
                put("tmp", p.tmp)
                put("hum", p.hum)
                put("rssi", p.rssi)
                put("jit", p.jit)
                put("lat", p.lat)
                put("dur", p.dur)
                put("v_sag", p.vSag)
                put("v_avg", p.vAvg)
                put("p_cnt", p.pCnt)
            }
        }
        if (record.hasIdentity()) {
            map["identity"] = identityToMap(record.identity)
        }
        return map
    }

    private fun envRecordToMap(record: LukuIDProto.EnvironmentRecord): Map<String, Any?> {
        val map = mutableMapOf<String, Any?>()
        map["version"] = record.version
        map["event_id"] = record.eventId
        map["signature"] = record.signature
        map["previous_signature"] = record.previousSignature
        if (record.hasPayload()) {
            val p = record.payload
            map["payload"] = mapOf(
                "ctr" to p.ctr,
                "timestamp_utc" to p.timestampUtc,
                "uptime_us" to p.uptimeUs,
                "nonce" to p.nonce
            )
        }
        if (record.hasIdentity()) {
            map["identity"] = identityToMap(record.identity)
        }
        return map
    }

    private fun identityToMap(identity: LukuIDProto.Identity): Map<String, Any?> {
        return mapOf(
            "identity_version" to identity.identityVersion,
            "dac_serial" to identity.dacSerial,
            "slac_serial" to identity.slacSerial,
            "last_sync_utc" to identity.lastSyncUtc,
            "signature" to identity.signature,
            "attestation_dac_der" to identity.dacDer.toByteArray(),
            "slac_der" to identity.slacDer.toByteArray()
        )
    }

    companion object {
        fun encode(map: Map<String, Any?>): ByteArray {
            val builder = LukuIDProto.CommandRequest.newBuilder()
            val action = map["action"] as? String ?: ""
            builder.action = action

            val opts = map["opts"] as? Map<String, Any?>
            val source = opts ?: map

            fun asString(key: String): String? = source[key] as? String
            fun asInt(key: String): Int? = (source[key] as? Number)?.toInt()
            fun asLong(key: String): Long? = (source[key] as? Number)?.toLong()
            fun asDouble(key: String): Double? = (source[key] as? Number)?.toDouble()
            fun asBool(key: String): Boolean? = source[key] as? Boolean
            fun asBytes(key: String): com.google.protobuf.ByteString? {
                return when (val v = source[key]) {
                    is ByteArray -> com.google.protobuf.ByteString.copyFrom(v)
                    is String -> {
                        if (v.startsWith("-----BEGIN")) {
                            com.google.protobuf.ByteString.copyFromUtf8(v)
                        } else {
                            try {
                                com.google.protobuf.ByteString.copyFrom(Base64.getDecoder().decode(v))
                            } catch (_: IllegalArgumentException) {
                                com.google.protobuf.ByteString.copyFromUtf8(v)
                            }
                        }
                    }
                    else -> null
                }
            }

            when (action) {
                "fetch", "history" -> {
                    val fetch = LukuIDProto.FetchRequest.newBuilder()
                    (asString("query") ?: asString("id") ?: asString("device_id"))?.let { fetch.query = it }
                    asInt("offset")?.let { fetch.offset = it }
                    asInt("limit")?.let { fetch.limit = it }
                    asBool("fetch_full")?.let { fetch.fetchFull = it }
                    asLong("starts")?.let { fetch.starts = it }
                    asLong("ends")?.let { fetch.ends = it }
                    when (val window = source["window"]) {
                        is Number -> fetch.window = LukuIDProto.FetchWindow.forNumber(window.toInt()) ?: fetch.window
                        is String -> mapFetchWindow(window)?.let { fetch.window = it }
                    }
                    builder.fetch = fetch.build()
                }
                "get" -> {
                    val get = LukuIDProto.GetRecordRequest.newBuilder()
                    (asString("record_id") ?: asString("id") ?: asString("device_id"))?.let { get.recordId = it }
                    builder.get = get.build()
                }
                "attest" -> {
                    val attest = LukuIDProto.AttestRequest.newBuilder()
                    (asString("parent_record_id") ?: asString("record_id") ?: asString("id"))?.let {
                        attest.parentRecordId = it
                    }
                    asBytes("signature")?.let { attest.signature = it }
                    asString("checksum")?.let { attest.checksum = it }
                    asString("mime")?.let { attest.mime = it }
                    asString("type")?.let { attest.type = it }
                    asString("title")?.let { attest.title = it }
                    asDouble("lat")?.let { attest.lat = it }
                    asDouble("lng")?.let { attest.lng = it }
                    asString("content")?.let { attest.content = it }
                    asString("merkle_root")?.let { attest.merkleRoot = it }
                    asString("custody_id")?.let { attest.custodyId = it }
                    asString("event")?.let { attest.event = it }
                    asString("status")?.let { attest.status = it }
                    asString("context_ref")?.let { attest.contextRef = it }
                    builder.attest = attest.build()
                }
                "config", "configure" -> {
                    val config = LukuIDProto.ConfigRequest.newBuilder()
                    asString("name")?.let { config.name = it }
                    asString("wifi_ssid")?.let { config.wifiSsid = it }
                    asString("wifi_password")?.let { config.wifiPassword = it }
                    asString("mqtt_broker_url")?.let { config.mqttBrokerUrl = it }
                    asInt("mqtt_port")?.let { config.mqttPort = it }
                    asString("mqtt_topic")?.let { config.mqttTopic = it }
                    asInt("mqtt_broadcast_frequency_seconds")?.let { config.mqttBroadcastFrequencySeconds = it }
                    asString("mqtt_username")?.let { config.mqttUsername = it }
                    asString("mqtt_password")?.let { config.mqttPassword = it }
                    asBytes("mqtt_certificate_der")?.let { config.mqttCertificateDer = it }
                    asBytes("mqtt_ca_der")?.let { config.mqttCaDer = it }
                    asBool("mqtt_broadcast_enabled")?.let { config.mqttBroadcastEnabled = it }
                    asString("custom_heartbeat_url")?.let { config.customHeartbeatUrl = it }
                    asBool("telemetry_enabled")?.let { config.telemetryEnabled = it }
                    builder.config = config.build()
                }
                "ota_begin" -> {
                    val ota = LukuIDProto.OtaBeginRequest.newBuilder()
                    asInt("size")?.let { ota.size = it }
                    asBytes("public_key")?.let { ota.publicKey = it }
                    asBool("binary_mode")?.let { ota.binaryMode = it }
                    builder.otaBegin = ota.build()
                }
                "ota_data" -> {
                    val ota = LukuIDProto.OtaDataRequest.newBuilder()
                    asBytes("data")?.let { ota.data = it }
                    asInt("offset")?.let { ota.offset = it }
                    builder.otaData = ota.build()
                }
                "ota_end" -> {
                    val ota = LukuIDProto.OtaEndRequest.newBuilder()
                    asBytes("signature")?.let { ota.signature = it }
                    builder.otaDataV2 = ota.build()
                }
                "set_attestation" -> {
                    val sa = LukuIDProto.SetAttestationRequest.newBuilder()
                    asBytes("dac_der")?.let { sa.dacDer = it }
                    asBytes("manufacturer_der")?.let { sa.manufacturerDer = it }
                    asBytes("intermediate_der")?.let { sa.intermediateDer = it }
                    asBytes("signature")?.let { sa.signature = it }
                    asLong("counter")?.let { sa.counter = it }
                    asString("nonce")?.let { sa.nonce = it }
                    builder.setAttestation = sa.build()
                }
                "set_heartbeat" -> {
                    val sh = LukuIDProto.SetHeartbeatRequest.newBuilder()
                    asBytes("slac_der")?.let { sh.slacDer = it }
                    asBytes("heartbeat_der")?.let { sh.heartbeatDer = it }
                    asBytes("signature")?.let { sh.signature = it }
                    asLong("timestamp")?.let { sh.timestamp = it }
                    asBytes("intermediate_der")?.let { sh.intermediateDer = it }
                    builder.setHeartbeat = sh.build()
                }
                "scan_enable" -> {
                    val se = LukuIDProto.ScanEnableRequest.newBuilder()
                    asBool("enabled")?.let { se.enabled = it }
                    builder.scanEnable = se.build()
                }
                "generate_heartbeat" -> {
                    builder.generateHeartbeat = LukuIDProto.GenerateHeartbeatRequest.getDefaultInstance()
                }
                "fetch_telemetry" -> {
                    builder.fetchTelemetry = LukuIDProto.FetchTelemetryRequest.getDefaultInstance()
                }
            }

            return framePayload(builder.build().toByteArray())
        }

        private fun mapFetchWindow(value: String): LukuIDProto.FetchWindow? {
            return when (value.trim().lowercase()) {
                "none", "fetch_window_none" -> LukuIDProto.FetchWindow.FETCH_WINDOW_NONE
                "hourly", "fetch_window_hourly" -> LukuIDProto.FetchWindow.FETCH_WINDOW_HOURLY
                "daily", "fetch_window_daily" -> LukuIDProto.FetchWindow.FETCH_WINDOW_DAILY
                "weekly", "fetch_window_weekly" -> LukuIDProto.FetchWindow.FETCH_WINDOW_WEEKLY
                "monthly", "fetch_window_monthly" -> LukuIDProto.FetchWindow.FETCH_WINDOW_MONTHLY
                else -> null
            }
        }

        private fun framePayload(payload: ByteArray): ByteArray {
            val framed = ByteBuffer.allocate(MAGIC_BYTES.size + 4 + payload.size + MAGIC_BYTES.size)
                .order(ByteOrder.LITTLE_ENDIAN)
            framed.put(MAGIC_BYTES)
            framed.putInt(payload.size)
            framed.put(payload)
            framed.put(MAGIC_BYTES)
            return framed.array()
        }

        private val MAGIC_BYTES = byteArrayOf(0x4C, 0x55, 0x4B, 0x55, 0x49, 0x44, 0x01, 0x7E)
    }
}
