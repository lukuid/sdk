// SPDX-License-Identifier: Apache-2.0
import Foundation
@preconcurrency import CoreBluetooth

private func infoFieldBase64(_ value: Any?) -> String? {
    if let string = value as? String {
        return string
    }
    if let data = value as? Data {
        return data.base64EncodedString()
    }
    return nil
}

private func infoFieldPemChain(_ value: Any?) -> String? {
    if let string = value as? String, string.contains("-----BEGIN CERTIFICATE-----") {
        return string
    }
    if let data = value as? Data,
       let string = String(data: data, encoding: .utf8),
       string.contains("-----BEGIN CERTIFICATE-----") {
        return string
    }
    return nil
}

private func infoFieldPemCertificate(_ value: Any?) -> String? {
    guard let encoded = infoFieldBase64(value)?.trimmingCharacters(in: .whitespacesAndNewlines),
          !encoded.isEmpty else {
        return nil
    }
    let wrapped = stride(from: 0, to: encoded.count, by: 64).map { start -> String in
        let from = encoded.index(encoded.startIndex, offsetBy: start)
        let to = encoded.index(from, offsetBy: min(64, encoded.distance(from: from, to: encoded.endIndex)), limitedBy: encoded.endIndex) ?? encoded.endIndex
        return String(encoded[from..<to])
    }.joined(separator: "\n")
    return "-----BEGIN CERTIFICATE-----\n\(wrapped)\n-----END CERTIFICATE-----\n"
}

private func assembleInfoCertificateChain(_ map: [String: Any]) -> String? {
    let parts = [
        infoFieldPemCertificate(map["attestation_dac_der"]),
        infoFieldPemCertificate(map["attestation_manufacturer_der"]),
        infoFieldPemCertificate(map["attestation_intermediate_der"])
    ].compactMap { $0 }
    return parts.isEmpty ? nil : parts.joined()
}

private func assembleInfoCertificateChain(_ info: DeviceInfo) -> String? {
    let parts = [
        infoFieldPemCertificate(info.attestationDacDer),
        infoFieldPemCertificate(info.attestationManufacturerDer),
        infoFieldPemCertificate(info.attestationIntermediateDer)
    ].compactMap { $0 }
    return parts.isEmpty ? nil : parts.joined()
}

final class BleSession: NSObject, CBPeripheralDelegate, LukuDevice {
    private let bleWriteChunkSize = 180
    private let peripheral: CBPeripheral
    private unowned let central: CBCentralManager
    private let cache: DeviceInfoCache
    private let queue: DispatchQueue
    private unowned let client: LukuIDClient
    private let options: LukuIDClientOptions
    private let errorSink: (SdkError) -> Void
    private let closedCallback: (BleSession) -> Void

    private lazy var codec = LukuCodec(
        onMessage: { [weak self] in self?.handleMessage($0) },
        onError: { [weak self] error in
            self?.errorSink(SdkError(whereHint: "ble.codec", underlying: error))
        }
    )

    private struct PendingRequest {
        let action: String
        let continuation: CheckedContinuation<Any, Error>
    }

    private var txCharacteristic: CBCharacteristic?
    private var rxCharacteristic: CBCharacteristic?
    private var pendingRequests: [String: PendingRequest] = [:]
    private var pendingWrite: CheckedContinuation<Void, Error>?
    private var eventHandlers: [UUID: (DeviceEventPayload) -> Void] = [:]
    private var messageHandlers: [UUID: ([String: Any]) -> Void] = [:]
    private var connectContinuation: CheckedContinuation<Void, Error>?
    private var readyContinuation: CheckedContinuation<Void, Error>?
    private var infoStorage: DeviceInfo?
    private var notificationsReady = false
    private var isClosed = false

    let transportId: String
    let peripheralIdentifier: UUID

    init(
        peripheral: CBPeripheral,
        central: CBCentralManager,
        cache: DeviceInfoCache,
        queue: DispatchQueue,
        client: LukuIDClient,
        options: LukuIDClientOptions,
        errorSink: @escaping (SdkError) -> Void,
        closed: @escaping (BleSession) -> Void
    ) {
        self.peripheral = peripheral
        self.central = central
        self.cache = cache
        self.queue = queue
        self.client = client
        self.options = options
        self.errorSink = errorSink
        self.closedCallback = closed
        self.transportId = peripheral.identifier.uuidString
        self.peripheralIdentifier = peripheral.identifier
        super.init()
        self.peripheral.delegate = self
    }

    var info: DeviceInfo {
        guard let infoStorage else {
            fatalError("Device not validated yet")
        }
        return infoStorage
    }

    func awaitValidation(timeout: TimeInterval) async throws -> BleSession {
        try await withTimeout(seconds: timeout) { [self] in
            try await self.ensureConnected()
            try await self.waitForReady()
            _ = try await self.ensureInfo()
            return self
        }
    }

    func toDiscoveredDevice() -> DiscoveredDevice {
        DiscoveredDevice(id: transportId, label: peripheral.name, transport: .ble)
    }

    var peripheralInstance: CBPeripheral {
        peripheral
    }

    func action(key: String, opts: [String: Any]) async throws {
        try await waitForReady()
        let requestId = UUID().uuidString
        try await self.send(frame: [
            "action": key,
            "id": requestId,
            "opts": opts
        ])
    }

    func call(key: String, opts: [String: Any], timeout: TimeInterval) async throws -> Any {
        try await waitForReady()
        return try await withTimeout(seconds: timeout) { [self] in
            try await withCheckedThrowingContinuation { continuation in
                self.queue.async { [weak self] in
                    guard let self else { return }
                    let requestId = UUID().uuidString
                    self.pendingRequests[requestId] = PendingRequest(action: key, continuation: continuation)
                    Task {
                        do {
                            try await self.send(frame: [
                                "action": key,
                                "id": requestId,
                                "opts": opts
                            ])
                        } catch {
                            self.queue.async {
                                self.pendingRequests.removeValue(forKey: requestId)
                                continuation.resume(throwing: error)
                            }
                        }
                    }
                }
            }
        }
    }

    func send(data: Data) async throws {
        try await sendRaw(data: data)
    }

    func onEvent(_ handler: @escaping (DeviceEventPayload) -> Void) -> CallbackToken {
        let token = UUID()
        queue.async { [weak self] in
            self?.eventHandlers[token] = handler
        }
        return CallbackToken { [weak self] in
            self?.queue.async {
                self?.eventHandlers.removeValue(forKey: token)
            }
        }
    }

    func onMessage(_ handler: @escaping ([String: Any]) -> Void) -> CallbackToken {
        let token = UUID()
        queue.async { [weak self] in
            self?.messageHandlers[token] = handler
        }
        return CallbackToken { [weak self] in
            self?.queue.async {
                self?.messageHandlers.removeValue(forKey: token)
            }
        }
    }

    func close() async {
        await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
            queue.async { [weak self] in
                guard let self, !self.isClosed else {
                    continuation.resume()
                    return
                }
                self.isClosed = true
                self.pendingRequests.values.forEach { request in
                    request.continuation.resume(throwing: NSError(domain: "lukuid", code: -1, userInfo: [NSLocalizedDescriptionKey: "Device closed"]))
                }
                self.pendingRequests.removeAll()
                self.pendingWrite?.resume(throwing: NSError(domain: "lukuid", code: -1, userInfo: [NSLocalizedDescriptionKey: "Device closed"]))
                self.pendingWrite = nil
                self.central.cancelPeripheralConnection(self.peripheral)
                self.closedCallback(self)
                continuation.resume()
            }
        }
    }


    private func ensureConnected() async throws {
        if peripheral.state == .connected {
            return
        }
        try await withCheckedThrowingContinuation { continuation in
            queue.async { [weak self] in
                guard let self else { return }
                if self.peripheral.state == .connected {
                    continuation.resume()
                    return
                }
                self.connectContinuation = continuation
                self.central.connect(self.peripheral)
            }
        }
    }

    private func waitForReady() async throws {
        if notificationsReady {
            return
        }
        try await withCheckedThrowingContinuation { continuation in
            queue.async { [weak self] in
                guard let self else { return }
                if self.notificationsReady {
                    continuation.resume()
                    return
                }
                self.readyContinuation = continuation
                self.peripheral.discoverServices([BleConstants.serviceUUID])
            }
        }
    }

    private func ensureInfo() async throws -> DeviceInfo {
        if let infoStorage {
            return infoStorage
        }
        if let cached = await cache.get(transport: .ble, transportId: transportId) {
            debugLog(options, "Using cached BLE device info", context: ["transportId": transportId, "deviceId": cached.id])
            infoStorage = cached
            return cached
        }
        debugLog(options, "Requesting BLE INFO", context: ["transportId": transportId])
        guard let infoMap = try await call(key: "info", opts: [:], timeout: 30) as? [String: Any] else {
            throw NSError(domain: "lukuid", code: -4, userInfo: [NSLocalizedDescriptionKey: "Invalid INFO response"])
        }
        let parsed = try parseInfo(infoMap)
        
        let verification = verifyDeviceAttestation(parsed.attestation)
        let verificationOk: Bool
        if case .success = verification {
            verificationOk = true
        } else {
            verificationOk = false
        }
        debugLog(
            options,
            "BLE INFO validation result",
            context: [
                "transportId": transportId,
                "deviceId": parsed.info.id,
                "verified": verificationOk,
                "allowUnverified": options.allowUnverifiedDevices
            ]
        )
        switch verification {
        case .success:
            break
        case .failure(let error):
            if !options.allowUnverifiedDevices {
                throw error
            }
        }
        
        let isVerified = verificationOk

        let finalInfo = DeviceInfo(
            transportId: parsed.info.transportId,
            transport: parsed.info.transport,
            name: parsed.info.name,
            meta: parsed.info.meta,
            id: parsed.info.id,
            key: parsed.info.key,
            capabilities: parsed.info.capabilities,
            firmware: parsed.info.firmware,
            model: parsed.info.model,
            signature: parsed.info.signature,
            attestationDacDer: parsed.info.attestationDacDer,
            attestationManufacturerDer: parsed.info.attestationManufacturerDer,
            attestationIntermediateDer: parsed.info.attestationIntermediateDer,
            attestationRootFingerprint: parsed.info.attestationRootFingerprint,
            heartbeatSlacDer: parsed.info.heartbeatSlacDer,
            heartbeatDer: parsed.info.heartbeatDer,
            heartbeatIntermediateDer: parsed.info.heartbeatIntermediateDer,
            heartbeatRootFingerprint: parsed.info.heartbeatRootFingerprint,
            verified: isVerified,
            lastSync: parsed.info.lastSync,
            counter: parsed.info.counter,
            syncRequired: parsed.info.syncRequired
        )
        
        // Automatic Heartbeat if verified
        if isVerified {
            let now = UInt64(Date().timeIntervalSince1970)
            let lastSync = finalInfo.lastSync ?? 0
            if now - lastSync > 24 * 3600 || finalInfo.syncRequired {
                Task {
                    do {
                        // 1. Fetch Telemetry if needed (either for public API or custom heartbeat)
                        var telemetry: [[String: Any]] = []
                        var telemetrySignature: String?
                        var telemetryCanonical: String?

                        if finalInfo.telemetry || finalInfo.customHeartbeatURL != nil {
                            let telemetryResult = (try? await call(key: "fetch_telemetry", opts: [:], timeout: 10) as? [String: Any])
                            telemetry = telemetryResult?["data"] as? [[String: Any]] ?? []
                            telemetrySignature = telemetryResult?["signature"] as? String
                            telemetryCanonical = telemetryResult?["canonical_string"] as? String
                        }

                        // 2. Push Telemetry to public API if enabled
                        if finalInfo.telemetry && !telemetry.isEmpty {
                            _ = try? await client.telemetry(
                                deviceId: finalInfo.id,
                                data: telemetry,
                                signature: telemetrySignature,
                                canonicalString: telemetryCanonical,
                                customURL: nil // Always to api.lukuid.com
                            )
                        }

                        // 3. Generate Heartbeat
                        if let hbInit = try await call(key: "generate_heartbeat", opts: [:], timeout: 10) as? [String: Any],
                           let signature = hbInit["signature"] as? String,
                           let csr = hbInit["csr"] as? String,
                           let counter = hbInit["counter"] as? UInt64 {
                            let attestationCert = assembleInfoCertificateChain(finalInfo) ?? (hbInit["attestation"] as? String ?? "")
                            
                            let previousState: [String: Any] = [
                                "last_sync_bucket": hbInit["last_sync_bucket"] as? Int64 ?? 0,
                                "last_timestamp": hbInit["latest_timestamp"] as? Int64 ?? 0,
                                "current_timestamp": hbInit["current_timestamp"] as? Int64 ?? 0,
                                "last_intermediate_serial": hbInit["last_intermediate_serial"] as? String ?? "",
                                "last_slac_serial": hbInit["last_slac_serial"] as? String ?? ""
                            ]

                            let source: [String: Any] = [
                                "platform": "ios",
                                "version": "1.0.0",
                                "bundle_id": Bundle.main.bundleIdentifier ?? "unknown",
                                "integration": "native-sdk"
                            ]

                            // Heartbeat: only include telemetry if it's a custom URL
                            let hbResp = try await client.heartbeat(
                                deviceId: finalInfo.id,
                                publicKey: finalInfo.key,
                                signature: signature,
                                csr: csr,
                                attestationCertificate: attestationCert,
                                attestationRootFingerprint: finalInfo.attestationRootFingerprint,
                                counter: counter,
                                previousState: previousState,
                                source: source,
                                telemetry: finalInfo.customHeartbeatURL != nil ? telemetry : nil,
                                telemetrySignature: finalInfo.customHeartbeatURL != nil ? telemetrySignature : nil,
                                telemetryCanonicalString: finalInfo.customHeartbeatURL != nil ? telemetryCanonical : nil,
                                customURL: finalInfo.customHeartbeatURL
                            )
                            let payload: [String: Any] = [
                                "slac_der": hbResp["slac_der"] as? String ?? "",
                                "heartbeat_der": hbResp["heartbeat_der"] as? String ?? "",
                                "intermediate_der": hbResp["intermediate_der"] as? String ?? "",
                                "signature": hbResp["signature"] as? String ?? "",
                                "timestamp": hbResp["timestamp"] as? Int64 ?? 0
                            ]
                            _ = try await call(key: "set_heartbeat", opts: payload, timeout: 10)
                        }
                    } catch {
                        errorSink(SdkError(whereHint: "ios.heartbeat", underlying: error))
                    }
                }
            }
        }
        
        infoStorage = finalInfo
        await cache.set(finalInfo)
        return finalInfo
    }

    private func parseInfo(_ map: [String: Any]) throws -> ParsedInfo {
        guard let id = map["id"] as? String,
              let key = infoFieldBase64(map["key"]) else {
            throw NSError(domain: "lukuid", code: -5, userInfo: [NSLocalizedDescriptionKey: "Missing identity fields"])
        }
        let capabilities = map["capabilities"] as? [String] ?? []
        let name = map["name"] as? String
        let firmware = map["firmware"] as? String
        let model = map["model"] as? String
        let meta = map["meta"] as? [String: Any] ?? [:]
        
        let slac = map["slac"] as? [String: Any]
        let lastSync = slac?["valid_from"] as? UInt64
        let counter = (map["counter"] as? NSNumber)?.uint64Value ?? 0
        let syncRequired = (map["sync_required"] as? Bool) ?? false

        let info = DeviceInfo(
            transportId: transportId,
            transport: .ble,
            name: name,
            meta: meta,
            id: id,
            key: key,
            capabilities: capabilities,
            firmware: firmware,
            model: model,
            signature: infoFieldBase64(map["signature"]),
            customHeartbeatURL: map["custom_heartbeat_url"] as? String,
            attestationDacDer: infoFieldBase64(map["attestation_dac_der"]),
            attestationManufacturerDer: infoFieldBase64(map["attestation_manufacturer_der"]),
            attestationIntermediateDer: infoFieldBase64(map["attestation_intermediate_der"]),
            attestationRootFingerprint: map["attestation_root_fingerprint"] as? String,
            heartbeatSlacDer: infoFieldBase64(map["heartbeat_slac_der"]),
            heartbeatDer: infoFieldBase64(map["heartbeat_der"]),
            heartbeatIntermediateDer: infoFieldBase64(map["heartbeat_intermediate_der"]),
            heartbeatRootFingerprint: map["heartbeat_root_fingerprint"] as? String,
            verified: false,
            telemetry: map["telemetry"] as? Bool ?? false,
            lastSync: lastSync,
            counter: counter,
            syncRequired: syncRequired
        )

        guard let attestationSig = infoFieldBase64(map["signature"]) else {
            throw NSError(domain: "lukuid", code: -33, userInfo: [NSLocalizedDescriptionKey: "Missing attestation signature"])
        }
        let attestationAlg = map["attestationAlg"] as? String ?? "ed25519"
        let attestationPayloadVersion = 1

        let attestation = DeviceAttestationInputs(
            id: id,
            key: key,
            attestationSig: attestationSig,
            certificateChain: assembleInfoCertificateChain(map),
            created: nil,
            attestationAlg: attestationAlg,
            attestationPayloadVersion: Int64(attestationPayloadVersion)
        )

        return ParsedInfo(info: info, attestation: attestation)
    }

    private struct ParsedInfo {
        let info: DeviceInfo
        let attestation: DeviceAttestationInputs
    }

    private func send(frame: [String: Any]) async throws {
        let payload = try LukuCodec.encode(frame)
        try await sendRaw(data: payload)
    }

    private func sendRaw(data: Data) async throws {
        let maxWriteSize = max(20, min(bleWriteChunkSize, peripheral.maximumWriteValueLength(for: .withResponse)))
        var offset = 0
        while offset < data.count {
            let end = min(offset + maxWriteSize, data.count)
            let chunk = data.subdata(in: offset..<end)
            try await sendChunk(data: chunk)
            offset = end
        }
    }

    private func sendChunk(data: Data) async throws {
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            queue.async { [weak self] in
                guard let self else { return }
                guard let rx = self.rxCharacteristic else {
                    continuation.resume(throwing: NSError(domain: "lukuid", code: -6, userInfo: [NSLocalizedDescriptionKey: "RX characteristic missing"]))
                    return
                }
                if self.pendingWrite != nil {
                    continuation.resume(throwing: NSError(domain: "lukuid", code: -7, userInfo: [NSLocalizedDescriptionKey: "Write pending"]))
                    return
                }
                self.pendingWrite = continuation
                self.peripheral.writeValue(data, for: rx, type: .withResponse)
            }
        }
    }

    private func handleMessage(_ message: [String: Any]) {
        messageHandlers.values.forEach { $0(message) }
        guard let action = message["action"] as? String else { return }
        
        var isResponse = message["ok"] != nil || message["success"] != nil || message["error"] != nil || message["err"] != nil
        if !isResponse {
            isResponse = pendingRequests.values.contains(where: { $0.action == action })
        }

        if isResponse {
            handleResponse(message, action: action)
        } else {
            handleEvent(message, action: action)
        }
    }

    private func handleResponse(_ message: [String: Any], action: String) {
        let ok = (message["ok"] as? Bool) ?? true
        let data = JsonCodec.normalize(message["data"] ?? message)
        let errorText = (message["message"] as? String)
            ?? (message["error"] as? String)
            ?? ((message["err"] as? [String: Any])?["msg"] as? String)
            ?? "Command failed"
        
        var request: PendingRequest?
        
        // 1. Try by ID
        if let identifier = message["id"] as? String {
            request = pendingRequests.removeValue(forKey: identifier)
        }
        
        // 2. Try by action
        if request == nil {
            if let pair = pendingRequests.first(where: { $0.value.action == action }) {
                request = pendingRequests.removeValue(forKey: pair.key)
            }
        }

        if let request {
            if ok {
                request.continuation.resume(returning: data)
            } else {
                request.continuation.resume(throwing: NSError(domain: "lukuid", code: -8, userInfo: [NSLocalizedDescriptionKey: errorText]))
            }
        }
    }

    private func handleEvent(_ message: [String: Any], action: String) {
        let payload = DeviceEventPayload(key: action, data: (message["data"] as? [String: Any]) ?? [:])
        eventHandlers.values.forEach { $0(payload) }
    }

    // Called by central delegate
    func handleConnectSuccess() {
        queue.async { [weak self] in
            guard let self else { return }
            self.connectContinuation?.resume()
            self.connectContinuation = nil
        }
    }

    func handleConnectFailure(_ error: Error?) {
        queue.async { [weak self] in
            guard let self else { return }
            self.connectContinuation?.resume(throwing: error ?? NSError(domain: "lukuid", code: -2, userInfo: [NSLocalizedDescriptionKey: "Connection failed"]))
            self.connectContinuation = nil
        }
    }

    func handleDisconnected(_ error: Error?) {
        queue.async { [weak self] in
            guard let self else { return }
            if let error {
                self.errorSink(SdkError(whereHint: "ble.disconnect", underlying: error))
            }
            self.pendingRequests.values.forEach { request in
                request.continuation.resume(throwing: NSError(domain: "lukuid", code: -3, userInfo: [NSLocalizedDescriptionKey: "Disconnected"]))
            }
            self.pendingRequests.removeAll()
            self.pendingWrite?.resume(throwing: NSError(domain: "lukuid", code: -3, userInfo: [NSLocalizedDescriptionKey: "Disconnected"]))
            self.pendingWrite = nil
            self.notificationsReady = false
            self.closedCallback(self)
        }
    }

    // MARK: - CBPeripheralDelegate

    func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
        if let error {
            readyContinuation?.resume(throwing: error)
            readyContinuation = nil
            return
        }
        guard let service = peripheral.services?.first(where: { $0.uuid == BleConstants.serviceUUID }) else {
            readyContinuation?.resume(throwing: NSError(domain: "lukuid", code: -9, userInfo: [NSLocalizedDescriptionKey: "Service missing"]))
            readyContinuation = nil
            return
        }
        peripheral.discoverCharacteristics([BleConstants.rxCharacteristicUUID, BleConstants.txCharacteristicUUID], for: service)
    }

    func peripheral(_ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?) {
        if let error {
            readyContinuation?.resume(throwing: error)
            readyContinuation = nil
            return
        }
        service.characteristics?.forEach { characteristic in
            switch characteristic.uuid {
            case BleConstants.txCharacteristicUUID:
                txCharacteristic = characteristic
                peripheral.setNotifyValue(true, for: characteristic)
            case BleConstants.rxCharacteristicUUID:
                rxCharacteristic = characteristic
            default:
                break
            }
        }
        if rxCharacteristic == nil {
            readyContinuation?.resume(throwing: NSError(domain: "lukuid", code: -10, userInfo: [NSLocalizedDescriptionKey: "RX characteristic missing"]))
            readyContinuation = nil
        }
    }

    func peripheral(_ peripheral: CBPeripheral, didUpdateNotificationStateFor characteristic: CBCharacteristic, error: Error?) {
        guard characteristic.uuid == BleConstants.txCharacteristicUUID else { return }
        if let error {
            readyContinuation?.resume(throwing: error)
            readyContinuation = nil
            return
        }
        notificationsReady = characteristic.isNotifying
        if notificationsReady {
            readyContinuation?.resume()
            readyContinuation = nil
        }
    }

    func peripheral(_ peripheral: CBPeripheral, didUpdateValueFor characteristic: CBCharacteristic, error: Error?) {
        if let error {
            errorSink(SdkError(whereHint: "ble.rx", underlying: error))
            return
        }
        guard characteristic.uuid == BleConstants.txCharacteristicUUID, let value = characteristic.value else { return }
        codec.feed(value)
    }

    func peripheral(_ peripheral: CBPeripheral, didWriteValueFor characteristic: CBCharacteristic, error: Error?) {
        guard characteristic.uuid == BleConstants.rxCharacteristicUUID else { return }
        if let continuation = pendingWrite {
            pendingWrite = nil
            if let error {
                continuation.resume(throwing: error)
            } else {
                continuation.resume(returning: ())
            }
        }
    }
}

extension BleSession: @unchecked Sendable {}
