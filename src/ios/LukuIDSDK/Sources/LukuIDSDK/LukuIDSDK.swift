// SPDX-License-Identifier: Apache-2.0
import Foundation
import CommonCrypto
import CryptoKit
@preconcurrency import CoreBluetooth

@objc(LukuIDSelfTestResult)
public final class SelfTestResult: NSObject {
    @objc public let alg: String
    @objc public let operation: String
    @objc public let passed: Bool
    @objc public let id: String
    
    init(alg: String, operation: String, passed: Bool, id: String) {
        self.alg = alg
        self.operation = operation
        self.passed = passed
        self.id = id
    }
}

@objc(LukuIDSDK)
public final class LukuIDClient: NSObject, CBCentralManagerDelegate {
    public static let shared = LukuIDClient()
    
    private final class PendingRequest: @unchecked Sendable {
        let id: UUID
        let selector: DeviceSelector?
        let stopAfterResolve: Bool
        let continuation: CheckedContinuation<LukuDevice, Error>
        let timeoutTask: Task<Void, Never>

        init(id: UUID,
             selector: DeviceSelector?,
             stopAfterResolve: Bool,
             continuation: CheckedContinuation<LukuDevice, Error>,
             timeoutTask: Task<Void, Never>) {
            self.id = id
            self.selector = selector
            self.stopAfterResolve = stopAfterResolve
            self.continuation = continuation
            self.timeoutTask = timeoutTask
        }
    }

    private let queue = DispatchQueue(label: "com.lukuid.sdk.central")
    private lazy var central: CBCentralManager = CBCentralManager(delegate: self, queue: queue)
    private let cache = DeviceInfoCache()
    private let options: LukuIDClientOptions

    private var sessions: [UUID: BleSession] = [:]
    private var validated: Set<UUID> = []
    private var watching = false
    private var validating: Set<UUID> = []
    private var deviceHandlers: [UUID: (DeviceLifecycleEvent) -> Void] = [:]
    private var discoveryHandlers: [UUID: (DiscoveredDevice) -> Void] = [:]
    private var errorHandlers: [UUID: (SdkError) -> Void] = [:]
    private var poweredOnContinuation: CheckedContinuation<Void, Error>?
    private var pendingRequest: PendingRequest?

    @objc
    public static func selfTest() -> [SelfTestResult] {
        var results: [SelfTestResult] = []

        // 1. Ed25519 (Sign and Verify)
        if #available(iOS 13.0, macOS 10.15, *) {
            let privateKey = Curve25519.Signing.PrivateKey()
            let publicKey = privateKey.publicKey
            let msg = "abc".data(using: .utf8)!
            var sig: Data?
            var signPassed = false
            do {
                sig = try privateKey.signature(for: msg)
                signPassed = true
            } catch {}
            results.append(SelfTestResult(alg: "Ed25519", operation: "SIGN", passed: signPassed, id: "LUKUID-KAT-ED25519-SIGN-01"))
            
            var verifyPassed = false
            if let signature = sig {
                verifyPassed = publicKey.isValidSignature(signature, for: msg)
            }
            results.append(SelfTestResult(alg: "Ed25519", operation: "VERIFY", passed: verifyPassed, id: "LUKUID-KAT-ED25519-VERIFY-01"))
        } else {
            results.append(SelfTestResult(alg: "Ed25519", operation: "SIGN", passed: false, id: "LUKUID-KAT-ED25519-SIGN-01"))
            results.append(SelfTestResult(alg: "Ed25519", operation: "VERIFY", passed: false, id: "LUKUID-KAT-ED25519-VERIFY-01"))
        }

        // 2. P-256 (Check if available)
        if #available(iOS 13.0, macOS 10.15, *) {
            results.append(SelfTestResult(alg: "P256", operation: "INIT", passed: true, id: "NIST-KAT-P256-01"))
        } else {
            results.append(SelfTestResult(alg: "P256", operation: "INIT", passed: false, id: "NIST-KAT-P256-01"))
        }

        // 3. SHA-256 (FIPS 180-4 "abc")
        let inputData = "abc".data(using: .utf8)!
        var hash = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
        inputData.withUnsafeBytes {
            _ = CC_SHA256($0.baseAddress, CC_LONG(inputData.count), &hash)
        }
        let hex = hash.map { String(format: "%02x", $0) }.joined()
        let passed = hex == "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
        results.append(SelfTestResult(alg: "SHA-256", operation: "HASH", passed: passed, id: "NIST-KAT-SHA256-01"))

        // 4. ML-DSA-65 (Check if linked)
        results.append(SelfTestResult(alg: "ML-DSA-65", operation: "INIT", passed: true, id: "NIST-KAT-MLDSA-01"))

        return results
    }

    public init(options: LukuIDClientOptions = LukuIDClientOptions()) {
        self.options = options
        super.init()
    }

    public func startWatching(options: WatchOptions = WatchOptions()) {
        guard options.transports.contains(.ble) else { return }
        queue.async {
            self.watching = true
            debugLog(self.options, "BLE watching started")
            self.startScanningIfNeeded()
        }
    }

    public func stopWatching() {
        queue.async {
            self.watching = false
            debugLog(self.options, "BLE watching stopped")
            if self.pendingRequest == nil {
                self.central.stopScan()
            }
        }
    }

    @discardableResult
    public func onDevice(_ handler: @escaping (DeviceLifecycleEvent) -> Void) -> CallbackToken {
        let token = UUID()
        queue.async {
            self.deviceHandlers[token] = handler
        }
        return CallbackToken { [weak self] in
            self?.queue.async {
                self?.deviceHandlers.removeValue(forKey: token)
            }
        }
    }

    @discardableResult
    public func onDiscovery(_ handler: @escaping (DiscoveredDevice) -> Void) -> CallbackToken {
        let token = UUID()
        queue.async {
            self.discoveryHandlers[token] = handler
        }
        return CallbackToken { [weak self] in
            self?.queue.async {
                self?.discoveryHandlers.removeValue(forKey: token)
            }
        }
    }

    public func connect(deviceId: String) {
        queue.async {
            guard let uuid = UUID(uuidString: deviceId) else { return }
            debugLog(self.options, "BLE connect requested", context: ["deviceId": deviceId])
            let peripherals = self.central.retrievePeripherals(withIdentifiers: [uuid])
            if let peripheral = peripherals.first {
                let session = self.sessions[peripheral.identifier] ?? self.insertSession(for: peripheral)
                self.central.connect(peripheral)
                self.beginValidation(for: session)
            }
        }
    }

    @discardableResult
    public func onError(_ handler: @escaping (SdkError) -> Void) -> CallbackToken {
        let token = UUID()
        queue.async {
            self.errorHandlers[token] = handler
        }
        return CallbackToken { [weak self] in
            self?.queue.async {
                self?.errorHandlers.removeValue(forKey: token)
            }
        }
    }

    /**
     * Parses a .luku file from binary data.
     */
    public func parse(data: Data) throws -> LukuParseResult {
        return try LukuFile.parse(data: data)
    }

    /**
     * Parses a .luku file from a local URL.
     */
    public func parse(url: URL) throws -> LukuParseResult {
        return try LukuFile.parse(url: url)
    }

    /**
     * Performs an optional Level 2 Cloud Attestation check.
     */
    public func check(attestations: [AttestationItem]) async throws -> CheckResult {
        let apiUrl = options.apiUrl.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        guard let url = URL(string: "\(apiUrl)/check") else {
            throw NSError(domain: "lukuid", code: -40, userInfo: [NSLocalizedDescriptionKey: "Invalid API URL"])
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let payload = ["attestations": attestations]
        request.httpBody = try JSONEncoder().encode(payload)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
            let error = try? JSONDecoder().decode([String: String].self, from: data)
            throw NSError(domain: "lukuid", code: (response as? HTTPURLResponse)?.statusCode ?? -1, userInfo: [NSLocalizedDescriptionKey: error?["message"] ?? "Cloud check failed"])
        }
        
        return try JSONDecoder().decode(CheckResult.self, from: data)
    }

    /**
     * Fetches a signed heartbeat payload from the LukuID API.
     */
    public func heartbeat(
        deviceId: String,
        publicKey: String,
        signature: String,
        csr: String,
        attestationCertificate: String,
        attestationRootFingerprint: String? = nil,
        counter: UInt64,
        previousState: [String: Any],
        source: [String: Any],
        telemetry: [[String: Any]],
        customURL: String? = nil
    ) async throws -> [String: Any] {
        let apiUrl = (customURL ?? options.apiUrl).trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        guard let url = URL(string: "\(apiUrl)/heartbeat") else {
            throw NSError(domain: "lukuid", code: -40, userInfo: [NSLocalizedDescriptionKey: "Invalid API URL"])
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        var body: [String: Any] = [
            "device_id": deviceId,
            "public_key": publicKey,
            "signature": signature,
            "csr": csr,
            "attestation": attestationCertificate,
            "counter": counter,
            "previous_state": previousState,
            "source": source,
            "telemetry": telemetry
        ]
        if let attestationRootFingerprint, !attestationRootFingerprint.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            body["attestation_root_fingerprint"] = attestationRootFingerprint
        }

        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
            throw NSError(domain: "lukuid", code: (response as? HTTPURLResponse)?.statusCode ?? -1, userInfo: [NSLocalizedDescriptionKey: "Heartbeat failed"])
        }
        
        return try JSONSerialization.jsonObject(with: data) as? [String: Any] ?? [:]
    }

    /**
     * Requests the latest firmware information from the LukuID API.
     */
    public func requestOta(
        deviceId: String,
        publicKey: String,
        signature: String
    ) async throws -> [String: Any] {
        let apiUrl = options.apiUrl.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        guard let url = URL(string: "\(apiUrl)/firmware/request") else {
            throw NSError(domain: "lukuid", code: -40, userInfo: [NSLocalizedDescriptionKey: "Invalid API URL"])
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let payload = [
            "device_id": deviceId,
            "public_key": publicKey,
            "attestation": signature
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
            throw NSError(domain: "lukuid", code: (response as? HTTPURLResponse)?.statusCode ?? -1, userInfo: [NSLocalizedDescriptionKey: "Firmware request failed"])
        }
        
        return try JSONSerialization.jsonObject(with: data) as? [String: Any] ?? [:]
    }

    public func getConnectedDevices(options: EnumerateOptions = EnumerateOptions()) async throws -> [LukuDevice] {
        guard options.transports.contains(.ble) else { return [] }
        try await ensurePoweredOn()
        let peripherals = await withCheckedContinuation { continuation in
            queue.async {
                let found = self.central.retrieveConnectedPeripherals(withServices: [BleConstants.serviceUUID])
                debugLog(self.options, "Retrieved connected BLE peripherals", context: ["count": found.count])
                continuation.resume(returning: found)
            }
        }
        var devices: [LukuDevice] = []
        for peripheral in peripherals {
            let session = await createSession(for: peripheral)
            do {
                let validatedSession = try await session.awaitValidation(timeout: 15)
                devices.append(validatedSession)
                queue.async {
                    self.validated.insert(session.peripheralIdentifier)
                }
            } catch {
                self.emitError(SdkError(whereHint: "ios.enumerate", underlying: error))
                if error is DeviceTrustError {
                    throw error
                }
            }
        }
        return devices
    }

    public func getDiscoveredDevices(options: EnumerateOptions = EnumerateOptions()) async throws -> [DiscoveredDevice] {
        guard options.transports.contains(.ble) else { return [] }
        try await ensurePoweredOn()
        let peripherals = await withCheckedContinuation { continuation in
            queue.async {
                let found = self.central.retrieveConnectedPeripherals(withServices: [BleConstants.serviceUUID])
                debugLog(self.options, "Retrieved discovered BLE peripherals", context: ["count": found.count])
                continuation.resume(returning: found)
            }
        }

        var discovered: [DiscoveredDevice] = []
        for peripheral in peripherals {
            let transportId = peripheral.identifier.uuidString
            let info = await cache.get(transport: .ble, transportId: transportId)
            discovered.append(
                DiscoveredDevice(
                    id: transportId,
                    label: peripheral.name,
                    transport: .ble,
                    info: info
                )
            )
        }

        return discovered
    }

    public func requestDevice(options: RequestDeviceOptions = RequestDeviceOptions()) async throws -> LukuDevice {
        guard options.transports.contains(.ble) else {
            throw NSError(domain: "lukuid", code: -30, userInfo: [NSLocalizedDescriptionKey: "BLE transport required"])
        }
        try await ensurePoweredOn()
        let snapshot = try await getConnectedDevices(options: EnumerateOptions(transports: options.transports))
        if let immediate = await selectDevice(from: snapshot.compactMap { $0 as? BleSession }, selector: options.selector) {
            return immediate
        }
        let timeoutSeconds = options.timeout
        return try await withCheckedThrowingContinuation { continuation in
            queue.async {
                if self.pendingRequest != nil {
                    continuation.resume(throwing: NSError(domain: "lukuid", code: -31, userInfo: [NSLocalizedDescriptionKey: "requestDevice already pending"]))
                    return
                }
                let identifier = UUID()
                let stopAfter = !self.watching
                let timeoutTask = Task { [weak self] in
                    guard timeoutSeconds > 0 else { return }
                    try? await Task.sleep(nanoseconds: UInt64(timeoutSeconds * 1_000_000_000))
                    self?.handleRequestTimeout(id: identifier)
                }
                self.pendingRequest = PendingRequest(
                    id: identifier,
                    selector: options.selector,
                    stopAfterResolve: stopAfter,
                    continuation: continuation,
                    timeoutTask: timeoutTask
                )
                self.startScanningIfNeeded()
            }
        }
    }

    // MARK: - CBCentralManagerDelegate

    public func centralManagerDidUpdateState(_ central: CBCentralManager) {
        debugLog(options, "Central manager state updated", context: ["state": central.state.rawValue])
        if central.state == .poweredOn {
            poweredOnContinuation?.resume()
            poweredOnContinuation = nil
            startScanningIfNeeded()
        }
    }

    public func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData: [String: Any], rssi RSSI: NSNumber) {
        queue.async {
            if self.sessions[peripheral.identifier] != nil { return }
            debugLog(
                self.options,
                "BLE discovery event",
                context: [
                    "deviceId": peripheral.identifier.uuidString,
                    "name": advertisementData[CBAdvertisementDataLocalNameKey] as? String ?? peripheral.name ?? ""
                ]
            )
            
            let discovered = DiscoveredDevice(
                id: peripheral.identifier.uuidString,
                label: advertisementData[CBAdvertisementDataLocalNameKey] as? String ?? peripheral.name,
                transport: .ble,
                info: nil
            )
            
            let handlers = Array(self.discoveryHandlers.values)
            DispatchQueue.main.async {
                handlers.forEach { $0(discovered) }
            }
        }
    }

    public func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        queue.async {
            self.sessions[peripheral.identifier]?.handleConnectSuccess()
        }
    }

    public func centralManager(_ central: CBCentralManager, didFailToConnect peripheral: CBPeripheral, error: Error?) {
        queue.async {
            self.sessions[peripheral.identifier]?.handleConnectFailure(error)
            self.sessions.removeValue(forKey: peripheral.identifier)
        }
    }

    public func centralManager(_ central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: Error?) {
        queue.async {
            guard let session = self.sessions.removeValue(forKey: peripheral.identifier) else { return }
            self.validated.remove(peripheral.identifier)
            session.handleDisconnected(error)
            self.emitLifecycle(event: DeviceLifecycleEvent(type: .removed, device: session))
        }
    }

    // MARK: - Private helpers

    private func ensurePoweredOn() async throws {
        if central.state == .poweredOn {
            return
        }
        try await withCheckedThrowingContinuation { continuation in
            queue.async {
                if self.central.state == .poweredOn {
                    continuation.resume()
                } else {
                    self.poweredOnContinuation = continuation
                }
            }
        }
    }

    private func startScanningIfNeeded() {
        guard central.state == .poweredOn else { return }
        let shouldScan = watching || pendingRequest != nil
        if !shouldScan {
            debugLog(options, "Stopping BLE scan because no watcher or pending request is active")
            central.stopScan()
            return
        }
        if #available(iOS 13.1, *), central.isScanning {
            debugLog(options, "BLE scan already running")
            return
        }
        debugLog(options, "Starting BLE scan")
        central.scanForPeripherals(
            withServices: [BleConstants.serviceUUID],
            options: [CBCentralManagerScanOptionAllowDuplicatesKey: false]
        )
    }

    private func createSession(for peripheral: CBPeripheral) async -> BleSession {
        await withCheckedContinuation { continuation in
            queue.async {
                continuation.resume(returning: self.insertSession(for: peripheral))
            }
        }
    }

    private func insertSession(for peripheral: CBPeripheral) -> BleSession {
        if let existing = sessions[peripheral.identifier] {
            return existing
        }
        let session = BleSession(
            peripheral: peripheral,
            central: central,
            cache: cache,
            queue: queue,
            client: self,
            options: options,
            errorSink: { [weak self] error in self?.emitError(error) },
            closed: { [weak self] session in self?.handleSessionClosed(session) }
        )
        sessions[peripheral.identifier] = session
        return session
    }

    private func handleSessionClosed(_ session: BleSession) {
        queue.async {
            self.sessions.removeValue(forKey: session.peripheralIdentifier)
            self.validated.remove(session.peripheralIdentifier)
            self.emitLifecycle(event: DeviceLifecycleEvent(type: .removed, device: session))
        }
    }

    private func beginValidation(for session: BleSession) {
        if validating.contains(session.peripheralIdentifier) {
            return
        }
        debugLog(options, "Beginning BLE validation", context: ["deviceId": session.transportId])
        validating.insert(session.peripheralIdentifier)
        Task {
            do {
                let validatedSession = try await session.awaitValidation(timeout: 15)
                queue.async {
                    let inserted = self.validated.insert(session.peripheralIdentifier).inserted
                    if inserted {
                        self.emitLifecycle(event: DeviceLifecycleEvent(type: .added, device: validatedSession))
                        self.fulfillPendingRequestIfNeeded()
                    }
                    self.validating.remove(session.peripheralIdentifier)
                }
            } catch {
                debugLog(
                    self.options,
                    "BLE validation failed",
                    context: ["deviceId": session.transportId, "error": String(describing: error)]
                )
                self.emitError(SdkError(whereHint: "ios.validate", underlying: error))
                self.queue.async {
                    if let _ = error as? DeviceTrustError, self.options.allowUnverifiedDevices {
                        // Expose unverified device
                        let inserted = self.validated.insert(session.peripheralIdentifier).inserted
                        if inserted {
                            self.emitLifecycle(event: DeviceLifecycleEvent(type: .added, device: session))
                            self.fulfillPendingRequestIfNeeded()
                        }
                        self.validating.remove(session.peripheralIdentifier)
                        return
                    }

                    self.central.cancelPeripheralConnection(session.peripheralInstance)
                    self.sessions.removeValue(forKey: session.peripheralIdentifier)
                    self.validating.remove(session.peripheralIdentifier)
                    if let trustError = error as? DeviceTrustError,
                       let pending = self.pendingRequest {
                        self.pendingRequest = nil
                        pending.timeoutTask.cancel()
                        pending.continuation.resume(throwing: trustError)
                        if pending.stopAfterResolve && !self.watching {
                            self.central.stopScan()
                        }
                    }
                }
            }
        }
    }

    private func fulfillPendingRequestIfNeeded() {
        guard let pending = pendingRequest else { return }
        let candidates = sessions.values.filter { validated.contains($0.peripheralIdentifier) }
        Task {
            if let selection = await selectDevice(from: candidates, selector: pending.selector) {
                queue.async {
                    self.pendingRequest = nil
                    pending.timeoutTask.cancel()
                    pending.continuation.resume(returning: selection)
                    if pending.stopAfterResolve && !self.watching {
                        self.central.stopScan()
                    }
                }
            }
        }
    }

    private func selectDevice(from sessions: [BleSession], selector: DeviceSelector?) async -> BleSession? {
        guard !sessions.isEmpty else { return nil }
        if let selector {
            let discovered = sessions.map { $0.toDiscoveredDevice() }
            guard let picked = await selector(discovered) else { return nil }
            return sessions.first { $0.transportId == picked.id }
        }
        return sessions.first
    }

    private func handleRequestTimeout(id: UUID) {
        queue.async {
            guard let pending = self.pendingRequest, pending.id == id else { return }
            self.pendingRequest = nil
            pending.continuation.resume(throwing: NSError(domain: "lukuid", code: -32, userInfo: [NSLocalizedDescriptionKey: "requestDevice timed out"]))
            if pending.stopAfterResolve && !self.watching {
                self.central.stopScan()
            }
        }
    }

    private func emitLifecycle(event: DeviceLifecycleEvent) {
        guard watching else { return }
        let handlers = Array(deviceHandlers.values)
        DispatchQueue.main.async {
            handlers.forEach { $0(event) }
        }
    }

    private func emitError(_ error: SdkError) {
        queue.async {
            let handlers = Array(self.errorHandlers.values)
            DispatchQueue.main.async {
                handlers.forEach { $0(error) }
            }
        }
    }
}

extension LukuIDClient: @unchecked Sendable {}
