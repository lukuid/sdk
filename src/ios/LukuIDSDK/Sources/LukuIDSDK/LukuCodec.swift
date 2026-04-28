// SPDX-License-Identifier: Apache-2.0
import Foundation
import SwiftProtobuf

final class LukuCodec {
    private var buffer = Data()
    private let onMessage: ([String: Any]) -> Void
    private let onError: (Error) -> Void
    private let magic = Data([0x4C, 0x55, 0x4B, 0x55, 0x49, 0x44, 0x01, 0x7E]) // "LUKUID\x01~"

    init(onMessage: @escaping ([String: Any]) -> Void, onError: @escaping (Error) -> Void) {
        self.onMessage = onMessage
        self.onError = onError
    }

    func feed(_ chunk: Data) {
        buffer.append(chunk)
        scan()
    }

    private func scan() {
        var consumed = 0
        let magicSize = magic.count
        
        while true {
            // Check if we have enough data for magic
            if buffer.count - consumed < magicSize {
                break
            }
            
            // Scan for Magic
            let searchRange = consumed..<(buffer.count)
            guard let range = buffer.range(of: magic, in: searchRange) else {
                consumed = max(consumed, buffer.count - (magicSize - 1))
                break
            }
            
            let startIdx = range.lowerBound
            consumed = startIdx
            
            if buffer.count - consumed < magicSize + 4 {
                break
            }
            
            // Read LEN (Little Endian UInt32)
            let lenBytes = buffer.subdata(in: (consumed + magicSize)..<(consumed + magicSize + 4))
            let rawLen = lenBytes.withUnsafeBytes { $0.load(as: UInt32.self) }
            let len = UInt32(littleEndian: rawLen)
            
            if len > 10 * 1024 * 1024 { // Sanity check
                consumed += 1
                continue
            }
            
            let payloadLen = Int(len)
            let totalSize = magicSize + 4 + payloadLen + magicSize
            
            if buffer.count - consumed < totalSize {
                break
            }
            
            // Check trailing magic
            let trailingStart = consumed + magicSize + 4 + payloadLen
            if buffer.subdata(in: trailingStart..<(trailingStart + magicSize)) != magic {
                consumed += 1
                continue
            }
            
            // Parse Payload
            let payloadData = buffer.subdata(in: (consumed + magicSize + 4)..<(consumed + magicSize + 4 + payloadLen))
            decodePayload(payloadData)
            
            consumed += totalSize
        }
        
        if consumed > 0 {
            if consumed >= buffer.count {
                buffer.removeAll(keepingCapacity: true)
            } else {
                buffer.removeSubrange(0..<consumed)
            }
        }
    }

    private func decodePayload(_ data: Data) {
        guard looksLikeCommandResponsePayload(data) else {
            return
        }
        do {
            let response = try LukuIDCommandResponse(serializedBytes: data)
            let dict = mapResponseToDictionary(response)
            onMessage(dict)
        } catch {
            onError(error)
        }
    }

    private func looksLikeCommandResponsePayload(_ data: Data) -> Bool {
        var offset = 0
        var sawStatus = false
        var sawSuccess = false

        while offset < data.count {
            guard let key = readVarint(in: data, offset: &offset) else {
                return false
            }

            let field = key >> 3
            let wireType = Int(key & 0x07)
            if field == 2 {
                sawStatus = true
            } else if field == 3 {
                sawSuccess = true
            }

            guard skipField(in: data, offset: &offset, wireType: wireType) else {
                return false
            }
        }

        return sawStatus || sawSuccess
    }

    private func readVarint(in data: Data, offset: inout Int) -> UInt64? {
        var shift: UInt64 = 0
        var value: UInt64 = 0

        while offset < data.count && shift < 70 {
            let byte = UInt64(data[offset])
            offset += 1
            value |= (byte & 0x7F) << shift
            if (byte & 0x80) == 0 {
                return value
            }
            shift += 7
        }

        return nil
    }

    private func skipField(in data: Data, offset: inout Int, wireType: Int) -> Bool {
        switch wireType {
        case 0:
            return readVarint(in: data, offset: &offset) != nil
        case 1:
            guard offset + 8 <= data.count else { return false }
            offset += 8
            return true
        case 2:
            guard let length = readVarint(in: data, offset: &offset) else { return false }
            let intLength = Int(length)
            guard intLength >= 0, offset + intLength <= data.count else { return false }
            offset += intLength
            return true
        case 5:
            guard offset + 4 <= data.count else { return false }
            offset += 4
            return true
        default:
            return false
        }
    }

    static func encode(_ dict: [String: Any]) throws -> Data {
        var request = LukuIDCommandRequest()
        let action = dict["action"] as? String ?? ""
        request.action = action

        let opts = dict["opts"] as? [String: Any]
        let source = opts ?? dict

        func asString(_ key: String) -> String? { return source[key] as? String }
        func asUInt32(_ key: String) -> UInt32? { return (source[key] as? NSNumber)?.uint32Value }
        func asInt64(_ key: String) -> Int64? { return (source[key] as? NSNumber)?.int64Value }
        func asDouble(_ key: String) -> Double? { return (source[key] as? NSNumber)?.doubleValue }
        func asBool(_ key: String) -> Bool? { return source[key] as? Bool }
        func asData(_ key: String) -> Data? {
            if let d = source[key] as? Data { return d }
            if let s = source[key] as? String {
                if s.hasPrefix("-----BEGIN") {
                    return s.data(using: .utf8)
                }
                if let decoded = Data(base64Encoded: s, options: [.ignoreUnknownCharacters]) {
                    return decoded
                }
                return s.data(using: .utf8)
            }
            return nil
        }

        switch action {
        case "fetch", "history":
            var fetch = LukuIDFetchRequest()
            fetch.query = asString("query") ?? asString("id") ?? asString("device_id") ?? ""
            if let v = asUInt32("offset") { fetch.offset = v }
            if let v = asUInt32("limit") { fetch.limit = v }
            if let v = asBool("fetch_full") { fetch.fetchFull = v }
            if let v = asInt64("starts") { fetch.starts = v }
            if let v = asInt64("ends") { fetch.ends = v }
            if let value = source["window"] {
                if let number = value as? NSNumber, let window = LukuIDFetchWindow(rawValue: number.intValue) {
                    fetch.window = window
                } else if let name = value as? String, let window = fetchWindow(name) {
                    fetch.window = window
                }
            }
            request.fetch = fetch
        case "get":
            var get = LukuIDGetRecordRequest()
            get.recordID = asString("record_id") ?? asString("id") ?? asString("device_id") ?? ""
            request.get = get
        case "attest":
            var attest = LukuIDAttestRequest()
            attest.parentRecordID = asString("parent_record_id") ?? asString("record_id") ?? asString("id") ?? ""
            if let v = asData("signature") { attest.signature = v }
            if let v = asString("checksum") { attest.checksum = v }
            if let v = asString("mime") { attest.mime = v }
            if let v = asString("type") { attest.type = v }
            if let v = asString("title") { attest.title = v }
            if let v = asDouble("lat") { attest.lat = v }
            if let v = asDouble("lng") { attest.lng = v }
            if let v = asString("content") { attest.content = v }
            if let v = asString("merkle_root") { attest.merkleRoot = v }
            if let v = asString("custody_id") { attest.custodyID = v }
            if let v = asString("event") { attest.event = v }
            if let v = asString("status") { attest.status = v }
            if let v = asString("context_ref") { attest.contextRef = v }
            request.attest = attest
        case "config", "configure":
            var config = LukuIDConfigRequest()
            if let v = asString("name") { config.name = v }
            if let v = asString("wifi_ssid") { config.wifiSsid = v }
            if let v = asString("wifi_password") { config.wifiPassword = v }
            if let v = asString("mqtt_broker_url") { config.mqttBrokerURL = v }
            if let v = asUInt32("mqtt_port") { config.mqttPort = v }
            if let v = asString("mqtt_topic") { config.mqttTopic = v }
            if let v = asUInt32("mqtt_broadcast_frequency_seconds") { config.mqttBroadcastFrequencySeconds = v }
            if let v = asString("mqtt_username") { config.mqttUsername = v }
            if let v = asString("mqtt_password") { config.mqttPassword = v }
            if let v = asData("mqtt_certificate_der") { config.mqttCertificateDer = v }
            if let v = asData("mqtt_ca_der") { config.mqttCaDer = v }
            if let v = asBool("mqtt_broadcast_enabled") { config.mqttBroadcastEnabled = v }
            if let v = asString("custom_heartbeat_url") { config.customHeartbeatURL = v }
            if let v = asBool("telemetry_enabled") { config.telemetryEnabled = v }
            request.config = config
        case "ota_begin":
            var ota = LukuIDOtaBeginRequest()
            if let v = asUInt32("size") { ota.size = v }
            if let v = asData("public_key") { ota.publicKey = v }
            if let v = asBool("binary_mode") { ota.binaryMode = v }
            request.otaBegin = ota
        case "ota_data":
            var ota = LukuIDOtaDataRequest()
            if let v = asData("data") { ota.data = v }
            if let v = asUInt32("offset") { ota.offset = v }
            request.otaData = ota
        case "ota_end":
            var ota = LukuIDOtaEndRequest()
            if let v = asData("signature") { ota.signature = v }
            request.otaDataV2 = ota
        case "set_attestation":
            var sa = LukuIDSetAttestationRequest()
            if let v = asData("dac_der") { sa.dacDer = v }
            if let v = asData("manufacturer_der") { sa.manufacturerDer = v }
            if let v = asData("intermediate_der") { sa.intermediateDer = v }
            if let v = asData("signature") { sa.signature = v }
            if let v = asInt64("counter") { sa.counter = UInt64(v) }
            if let v = asString("nonce") { sa.nonce = v }
            request.setAttestation = sa
        case "set_heartbeat":
            var sh = LukuIDSetHeartbeatRequest()
            if let v = asData("slac_der") { sh.slacDer = v }
            if let v = asData("heartbeat_der") { sh.heartbeatDer = v }
            if let v = asData("signature") { sh.signature = v }
            if let v = asInt64("timestamp") { sh.timestamp = v }
            if let v = asData("intermediate_der") { sh.intermediateDer = v }
            request.setHeartbeat = sh
        case "scan_enable":
            var se = LukuIDScanEnableRequest()
            if let v = asBool("enabled") { se.enabled = v }
            request.scanEnable = se
        case "generate_heartbeat":
            request.generateHeartbeat = LukuIDGenerateHeartbeatRequest()
        case "fetch_telemetry":
            request.fetchTelemetry = LukuIDFetchTelemetryRequest()
        default:
            break
        }
        
        return frame(try request.serializedData())
    }

    private func mapResponseToDictionary(_ response: LukuIDCommandResponse) -> [String: Any] {
        var dict: [String: Any] = [:]
        dict["action"] = response.action
        dict["status"] = statusName(response.status)
        dict["success"] = response.success
        dict["ok"] = response.success
        
        if !response.errorCode.isEmpty {
            dict["error_code"] = response.errorCode
        }
        
        if !response.message.isEmpty {
            dict["message"] = response.message
            dict["error"] = response.message
        }

        if !response.success {
            dict["err"] = [
                "code": response.errorCode.isEmpty ? "DEVICE_ERROR" : response.errorCode,
                "msg": response.message.isEmpty ? "Command failed" : response.message
            ]
        }

        switch response.payload {
        case .deviceInfo(let info):
            dict["handshake"] = info.handshake
            dict["uptime_ms"] = info.uptimeMs
            dict["token"] = info.token
            dict["battery"] = info.battery
            dict["voltage"] = info.voltage
            dict["vbus"] = info.vbus
            dict["counter"] = info.counter
            dict["sync_required"] = info.syncRequired
            dict["name"] = info.name
            dict["id"] = info.id
            dict["product"] = info.product
            dict["model"] = info.model
            dict["firmware"] = info.firmware
            dict["revision"] = info.revision
            dict["pairing"] = info.pairing
            dict["custom_heartbeat_url"] = info.customHeartbeatURL
            dict["telemetry"] = info.telemetry
            dict["managed_by"] = info.managedBy
            dict["attestation_dac_der"] = info.attestationDacDer
            dict["attestation_manufacturer_der"] = info.attestationManufacturerDer
            dict["attestation_intermediate_der"] = info.attestationIntermediateDer
            dict["attestation_root_fingerprint"] = info.attestationRootFingerprint
            dict["heartbeat_slac_der"] = info.heartbeatSlacDer
            dict["heartbeat_der"] = info.heartbeatDer
            dict["heartbeat_intermediate_der"] = info.heartbeatIntermediateDer
            dict["heartbeat_root_fingerprint"] = info.heartbeatRootFingerprint
            dict["signature"] = info.signature
            dict["key"] = info.key
        case .networkConfig(let config):
            dict["wifi_ssid"] = config.wifiSsid
            dict["wifi_password_set"] = config.wifiPasswordSet
            dict["mqtt_broker_url"] = config.mqttBrokerURL
            dict["mqtt_port"] = config.mqttPort
            dict["mqtt_topic"] = config.mqttTopic
            dict["mqtt_broadcast_frequency_seconds"] = config.mqttBroadcastFrequencySeconds
            dict["mqtt_username"] = config.mqttUsername
            dict["mqtt_password_set"] = config.mqttPasswordSet
            dict["mqtt_broadcast_enabled"] = config.mqttBroadcastEnabled
            dict["csr"] = config.csr
            dict["mqtt_certificate_der"] = config.mqttCertificateDer
            dict["mqtt_ca_der"] = config.mqttCaDer
        case .scanRecord(let record):
            dict["scan_record"] = mapScanRecord(record)
        case .envRecord(let record):
            dict["env_record"] = mapEnvRecord(record)
        case .fetchResponse(let fetch):
            dict["data"] = fetch.data.map { mapDataEntry($0) }
        case .fullRecordResponse(let full):
            dict["full_record"] = mapFullRecord(full)
        case .recordBatches(let batches):
            dict["record_batches"] = mapRecordBatches(batches)
        case .heartbeatInit(let heartbeat):
            if !heartbeat.signatureB64.isEmpty { dict["signature"] = heartbeat.signatureB64 }
            if !heartbeat.csrPem.isEmpty { dict["csr"] = heartbeat.csrPem }
            if !heartbeat.attestationB64.isEmpty { dict["attestation"] = heartbeat.attestationB64 }
            dict["counter"] = heartbeat.counter
            dict["last_sync_bucket"] = heartbeat.lastSyncBucket
            dict["latest_timestamp"] = heartbeat.latestTimestamp
            dict["current_timestamp"] = heartbeat.currentTimestamp
            if !heartbeat.lastIntermediateSerial.isEmpty { dict["last_intermediate_serial"] = heartbeat.lastIntermediateSerial }
            if !heartbeat.lastSlacSerial.isEmpty { dict["last_slac_serial"] = heartbeat.lastSlacSerial }
        case .fetchTelemetry(let telemetry):
            dict["data"] = telemetry.rows.map { row in
                row.values.map { mapTelemetryValue($0) }
            }
            if telemetry.hasSignature {
                dict["signature"] = telemetry.signature.base64EncodedString()
            }
            if telemetry.hasCanonicalString {
                dict["canonical_string"] = telemetry.canonicalString
            }
        case .statusResponse(let status):
            dict["id"] = status.id
            dict["name"] = status.name
            dict["public_key"] = status.publicKey
            dict["battery_health"] = status.batteryHealth
            dict["timestamp"] = status.timestamp
            dict["has_attestation"] = status.hasAttestation_p
            dict["has_heartbeat"] = status.hasHeartbeat_p
            dict["needs_sync"] = status.needsSync
        case .none:
            break
        }
        
        return dict
    }

    private func mapTelemetryValue(_ v: LukuIDTelemetryValue) -> Any? {
        switch v.kind {
        case .fval(let f): return f
        case .sval(let s): return s
        case .ival(let i): return i
        case .bval(let b): return b
        case .none: return nil
        }
    }

    private static func frame(_ payload: Data) -> Data {
        var data = Data()
        data.append(Data([0x4C, 0x55, 0x4B, 0x55, 0x49, 0x44, 0x01, 0x7E]))
        var length = UInt32(payload.count).littleEndian
        withUnsafeBytes(of: &length) { raw in
            data.append(contentsOf: raw)
        }
        data.append(payload)
        data.append(Data([0x4C, 0x55, 0x4B, 0x55, 0x49, 0x44, 0x01, 0x7E]))
        return data
    }

    private static func fetchWindow(_ value: String) -> LukuIDFetchWindow? {
        switch value.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() {
        case "none", "fetch_window_none":
            return LukuIDFetchWindow.none
        case "hourly", "fetch_window_hourly":
            return .hourly
        case "daily", "fetch_window_daily":
            return .daily
        case "weekly", "fetch_window_weekly":
            return .weekly
        case "monthly", "fetch_window_monthly":
            return .monthly
        default:
            return nil
        }
    }

    private func statusName(_ status: LukuIDStatus) -> String {
        switch status {
        case .unknown:
            return "STATUS_UNKNOWN"
        case .ok:
            return "STATUS_OK"
        case .error:
            return "STATUS_ERROR"
        case .ready:
            return "STATUS_READY"
        case .UNRECOGNIZED(let raw):
            return "STATUS_\(raw)"
        }
    }

    private func mapMetricValue(_ metric: LukuIDMetricValue) -> Any? {
        switch metric.kind {
        case .value(let value):
            return value
        case .stats(let stats):
            return [
                "avg": stats.avg,
                "min": stats.min,
                "max": stats.max,
                "variance": stats.variance,
                "count": stats.count
            ]
        default:
            return nil
        }
    }

    private func mapDataEntry(_ entry: LukuIDDataEntry) -> [String: Any] {
        switch entry.minRecord {
        case .scanMin(let scanMin):
            return [
                "view": "animalreader_list",
                "type": "scan_min",
                "record": [
                    "version": scanMin.version,
                    "record_id": scanMin.recordID,
                    "timestamp_utc": scanMin.timestampUtc,
                    "tag_id": scanMin.tagID,
                    "score_bio": scanMin.scoreBio,
                    "score_auth": scanMin.scoreAuth,
                    "score_env": scanMin.scoreEnv
                ]
            ]
        case .environmentMin(let envMin):
            return [
                "view": "guardcard_list",
                "type": "environment_min",
                "record": [
                    "version": envMin.version,
                    "record_id": envMin.recordID,
                    "timestamp_utc": envMin.timestampUtc,
                    "lux": mapMetricValue(envMin.lux) as Any,
                    "temp_c": mapMetricValue(envMin.tempC) as Any,
                    "humidity_pct": mapMetricValue(envMin.humidityPct) as Any,
                    "voc_index": mapMetricValue(envMin.vocIndex) as Any,
                    "tamper": envMin.tamper,
                    "wake_event": envMin.wakeEvent,
                    "vbus_present": envMin.vbusPresent
                ]
            ]
        default:
            return ["type": "unknown"]
        }
    }

    private func mapRecordBatches(_ recordBatches: LukuIDRecordBatches) -> [String: Any] {
        return [
            "batches": recordBatches.batches.map { mapRecordBatch($0) }
        ]
    }

    private func mapRecordBatch(_ batch: LukuIDRecordBatch) -> [String: Any] {
        var dict: [String: Any] = [:]
        dict["attestation_dac_der"] = batch.attestationDacDer
        dict["attestation_manufacturer_der"] = batch.attestationManufacturerDer
        dict["attestation_intermediate_der"] = batch.attestationIntermediateDer
        dict["heartbeat_slac_der"] = batch.heartbeatSlacDer
        dict["heartbeat_der"] = batch.heartbeatDer
        dict["heartbeat_intermediate_der"] = batch.heartbeatIntermediateDer
        if batch.hasDevice {
            dict["device"] = mapDeviceInfo(batch.device)
        }
        dict["environment_records"] = batch.environmentRecords.map { mapEnvRecord($0) }
        dict["scan_records"] = batch.scanRecords.map { mapScanRecord($0) }
        return dict
    }

    private func mapFullRecord(_ full: LukuIDFullRecordResponse) -> [String: Any] {
        var dict: [String: Any] = ["record_id": full.recordID]
        switch full.fullRecord {
        case .scanFull(let scan):
            dict["view"] = "animalreader_detail"
            dict["scan_record"] = mapScanRecord(scan)
        case .environmentFull(let env):
            dict["view"] = "guardcard_detail"
            dict["env_record"] = mapEnvRecord(env)
        default:
            dict["view"] = "unknown"
        }
        return dict
    }

    private func mapScanRecord(_ record: LukuIDScanRecord) -> [String: Any] {
        var dict: [String: Any] = [:]
        dict["version"] = record.version
        dict["scan_id"] = record.scanID
        dict["signature"] = record.signature
        dict["previous_signature"] = record.previousSignature
        dict["payload"] = mapScanPayload(record.payload)
        dict["device"] = mapDeviceInfo(record.device)
        dict["manufacturer"] = mapManufacturerInfo(record.manufacturer)
        dict["attachments"] = record.attachments.map { mapAttachment($0) }
        dict["identity"] = mapIdentity(record.identity)
        return dict
    }

    private func mapScanPayload(_ payload: LukuIDScanPayload) -> [String: Any] {
        var dict: [String: Any] = [:]
        dict["ctr"] = payload.ctr
        dict["id"] = payload.id
        dict["timestamp_utc"] = payload.timestampUtc
        dict["uptime_us"] = payload.uptimeUs
        dict["temperature_c"] = payload.temperatureC
        dict["nonce"] = payload.nonce
        dict["firmware"] = payload.firmware
        dict["tmp"] = payload.tmp
        dict["hum"] = payload.hum
        dict["rssi"] = payload.rssi
        dict["jit"] = payload.jit
        dict["lat"] = payload.lat
        dict["dur"] = payload.dur
        dict["v_sag"] = payload.vSag
        dict["v_avg"] = payload.vAvg
        dict["p_cnt"] = payload.pCnt
        dict["avg_dur"] = payload.avgDur
        dict["sc_sync"] = payload.scSync
        dict["up_time_m"] = payload.upTimeM
        dict["v_drop"] = payload.vDrop
        dict["rssi_std"] = payload.rssiStd
        dict["vbus"] = payload.vbus
        dict["clk_var"] = payload.clkVar
        dict["drift"] = payload.drift
        dict["hdx_histo_csv"] = payload.hdxHistoCsv
        dict["score_bio"] = payload.scoreBio
        dict["score_auth"] = payload.scoreAuth
        dict["score_env"] = payload.scoreEnv
        dict["metrics_keys"] = payload.metricsKeys
        dict["scan_version"] = payload.scanVersion
        return dict
    }

    private func mapDeviceInfo(_ info: LukuIDDeviceInfo) -> [String: Any] {
        return [
            "device_id": info.deviceID,
            "public_key": info.publicKey
        ]
    }

    private func mapManufacturerInfo(_ info: LukuIDManufacturerInfo) -> [String: Any] {
        return [
            "signature": info.signature,
            "public_key": info.publicKey
        ]
    }

    private func mapAttachment(_ attachment: LukuIDAttachment) -> [String: Any] {
        var dict: [String: Any] = [
            "signature": attachment.signature,
            "checksum": attachment.checksum,
            "timestamp_utc": attachment.timestampUtc,
            "mime": attachment.mime
        ]
        if attachment.hasExternalIdentity {
            dict["external_identity"] = mapExternalIdentity(attachment.externalIdentity)
        }
        return dict
    }

    private func mapExternalIdentity(_ identity: LukuIDExternalIdentity) -> [String: Any] {
        return [
            "endorser_id": identity.endorserID,
            "root_fingerprint": identity.rootFingerprint,
            "cert_chain_der": identity.certChainDer,
            "signature": identity.signature
        ]
    }

    private func mapIdentity(_ identity: LukuIDIdentity) -> [String: Any] {
        return [
            "dac_serial": identity.dacSerial,
            "slac_serial": identity.slacSerial,
            "last_sync_utc": identity.lastSyncUtc,
            "signature": identity.signature,
            "dac_der": identity.dacDer,
            "slac_der": identity.slacDer
        ]
    }

    private func mapEnvRecord(_ record: LukuIDEnvironmentRecord) -> [String: Any] {
        var dict: [String: Any] = [:]
        dict["version"] = record.version
        dict["event_id"] = record.eventID
        dict["signature"] = record.signature
        dict["previous_signature"] = record.previousSignature
        dict["payload"] = mapEnvPayload(record.payload)
        dict["device"] = mapDeviceInfo(record.device)
        dict["attachments"] = record.attachments.map { mapAttachment($0) }
        dict["identity"] = mapIdentity(record.identity)
        return dict
    }

    private func mapEnvPayload(_ payload: LukuIDEnvironmentPayload) -> [String: Any] {
        var dict: [String: Any] = [:]
        dict["ctr"] = payload.ctr
        dict["timestamp_utc"] = payload.timestampUtc
        dict["uptime_us"] = payload.uptimeUs
        dict["nonce"] = payload.nonce
        dict["firmware"] = payload.firmware
        dict["lux"] = payload.lux
        dict["temp_c"] = payload.tempC
        dict["humidity_pct"] = payload.humidityPct
        dict["pressure_hpa"] = payload.pressureHpa
        dict["voc_index"] = payload.vocIndex
        dict["tamper"] = payload.tamper
        dict["wake_event"] = payload.wakeEvent
        dict["vbus_present"] = payload.vbusPresent
        if payload.hasAccelG {
            dict["accel_g"] = [
                "x": payload.accelG.x,
                "y": payload.accelG.y,
                "z": payload.accelG.z
            ]
        }
        return dict
    }
}
