// SPDX-License-Identifier: Apache-2.0
import Foundation

public enum TransportType: String, Sendable {
    case ble
}

public struct DeviceInfo: @unchecked Sendable {
    public let transportId: String
    public let transport: TransportType
    public let name: String?
    public let meta: [String: Any]
    public let id: String
    public let key: String
    public let capabilities: [String]
    public let firmware: String?
    public let model: String?
    public let signature: String?
    public let customHeartbeatURL: String?
    public let attestationDacDer: String?
    public let attestationManufacturerDer: String?
    public let attestationIntermediateDer: String?
    public let attestationRootFingerprint: String?
    public let heartbeatSlacDer: String?
    public let heartbeatDer: String?
    public let heartbeatIntermediateDer: String?
    public let heartbeatRootFingerprint: String?
    public let verified: Bool
    public let telemetry: Bool
    public let lastSync: UInt64?
    public let counter: UInt64
    public let syncRequired: Bool
    
        public init(transportId: String,
                    transport: TransportType,
                    name: String?,
                    meta: [String: Any],
                    id: String,
                    key: String,
                    capabilities: [String],
                    firmware: String?,
                    model: String?,
                    signature: String? = nil,
                    customHeartbeatURL: String? = nil,
                    attestationDacDer: String? = nil,
                    attestationManufacturerDer: String? = nil,
                    attestationIntermediateDer: String? = nil,
                    attestationRootFingerprint: String? = nil,
                    heartbeatSlacDer: String? = nil,
                    heartbeatDer: String? = nil,
                    heartbeatIntermediateDer: String? = nil,
                    heartbeatRootFingerprint: String? = nil,
                    verified: Bool,
                    telemetry: Bool = false,
                    lastSync: UInt64? = nil,
                    counter: UInt64 = 0,
                    syncRequired: Bool = false) {
            self.transportId = transportId
            self.transport = transport
            self.name = name
            self.meta = meta
            self.id = id
            self.key = key
            self.capabilities = capabilities
            self.firmware = firmware
            self.model = model
            self.signature = signature
            self.customHeartbeatURL = customHeartbeatURL
            self.attestationDacDer = attestationDacDer
            self.attestationManufacturerDer = attestationManufacturerDer
            self.attestationIntermediateDer = attestationIntermediateDer
            self.attestationRootFingerprint = attestationRootFingerprint
            self.heartbeatSlacDer = heartbeatSlacDer
            self.heartbeatDer = heartbeatDer
            self.heartbeatIntermediateDer = heartbeatIntermediateDer
            self.heartbeatRootFingerprint = heartbeatRootFingerprint
            self.verified = verified
            self.telemetry = telemetry
            self.lastSync = lastSync
            self.counter = counter
            self.syncRequired = syncRequired
        }
    }
    

public struct DeviceEventPayload {
    public let key: String
    public let data: [String: Any]
}

public struct DeviceLifecycleEvent {
    public enum EventType {
        case added
        case removed
    }

    public let type: EventType
    public let device: LukuDevice
}

public struct SdkError: Error {
    public let whereHint: String
    public let underlying: Error
}

public struct EnumerateOptions: Sendable {
    public let transports: [TransportType]

    public init(transports: [TransportType] = [.ble]) {
        self.transports = transports
    }
}

public struct WatchOptions: Sendable {
    public let transports: [TransportType]

    public init(transports: [TransportType] = [.ble]) {
        self.transports = transports
    }
}

public struct RequestDeviceOptions: Sendable {
    public let transports: [TransportType]
    public let timeout: TimeInterval
    public let selector: DeviceSelector?

    public init(
        transports: [TransportType] = [.ble],
        timeout: TimeInterval = 20,
        selector: DeviceSelector? = nil
    ) {
        self.transports = transports
        self.timeout = timeout
        self.selector = selector
    }
}

public struct LukuIDClientOptions: Sendable {
    /**
     * If true, emit verbose discovery and validation diagnostics to stdout.
     * Default is `false`.
     */
    public let debugLogging: Bool
    /**
     * If true, devices that fail cryptographic attestation will still be exposed
     * but will have `verified = false`. Default is `false`.
     */
    public let allowUnverifiedDevices: Bool
    
    /**
     * Base URL for the LukuID API. Defaults to https://api.lukuid.com.
     */
    public let apiUrl: String

    public init(
        debugLogging: Bool = false,
        allowUnverifiedDevices: Bool = false,
        apiUrl: String = "https://api.lukuid.com"
    ) {
        self.debugLogging = debugLogging
        self.allowUnverifiedDevices = allowUnverifiedDevices
        self.apiUrl = apiUrl
    }
}

/** Item for Level 2 Cloud Attestation. */
public struct AttestationItem: Codable, Sendable {
    public let type: String
    public let data: [String: AnyCodable]
    public let signature: String
    
    public init(type: String, data: [String: AnyCodable], signature: String) {
        self.type = type
        self.data = data
        self.signature = signature
    }
}

/** Result of Level 2 Cloud Attestation. */
public struct CheckResult: Codable, Sendable {
    public let status: String
    public let attestations: [AttestationResult]
}

/** Individual attestation result. */
public struct AttestationResult: Codable, Sendable {
    public let type: String
    public let verified: Bool
    public let status: String
    // Other dynamic fields can be accessed via a dictionary if needed, 
    // but for now we'll stick to the core fields.
}

/** Helper for Any JSON in Codable. */
public struct AnyCodable: Codable, @unchecked Sendable {
    public let value: Any
    
    public init(_ value: Any) {
        self.value = value
    }
    
    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let x = try? container.decode(Bool.self) { self.value = x }
        else if let x = try? container.decode(Int.self) { self.value = x }
        else if let x = try? container.decode(Double.self) { self.value = x }
        else if let x = try? container.decode(String.self) { self.value = x }
        else if let x = try? container.decode([String: AnyCodable].self) { self.value = x.mapValues { $0.value } }
        else if let x = try? container.decode([AnyCodable].self) { self.value = x.map { $0.value } }
        else { throw DecodingError.typeMismatch(AnyCodable.self, .init(codingPath: decoder.codingPath, debugDescription: "Not codable")) }
    }
    
    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        if let x = value as? Bool { try container.encode(x) }
        else if let x = value as? Int { try container.encode(x) }
        else if let x = value as? Double { try container.encode(x) }
        else if let x = value as? String { try container.encode(x) }
        else if let x = value as? [String: Any] { try container.encode(x.mapValues { AnyCodable($0) }) }
        else if let x = value as? [Any] { try container.encode(x.map { AnyCodable($0) }) }
        else { throw EncodingError.invalidValue(value, .init(codingPath: encoder.codingPath, debugDescription: "Not encodable")) }
    }
}

public struct DiscoveredDevice: Sendable {
    public let id: String
    public let label: String?
    public let transport: TransportType
    public let info: DeviceInfo?

    public init(id: String, label: String?, transport: TransportType, info: DeviceInfo? = nil) {
        self.id = id
        self.label = label
        self.transport = transport
        self.info = info
    }
}

public typealias DeviceSelector = @Sendable ([DiscoveredDevice]) async -> DiscoveredDevice?

public protocol LukuDevice: AnyObject {
    var info: DeviceInfo { get }
    func action(key: String, opts: [String: Any]) async throws
    func call(key: String, opts: [String: Any], timeout: TimeInterval) async throws -> Any
    func send(data: Data) async throws
    func onEvent(_ handler: @escaping (DeviceEventPayload) -> Void) -> CallbackToken
    func onMessage(_ handler: @escaping ([String: Any]) -> Void) -> CallbackToken
    func close() async
}

public extension LukuDevice {
    func action(key: String, opts: [String: Any] = [:]) async throws {
        try await action(key: key, opts: opts)
    }

    func call(key: String, opts: [String: Any] = [:], timeout: TimeInterval = 30) async throws -> Any {
        try await call(key: key, opts: opts, timeout: timeout)
    }
}

public typealias LukuCancellable = CallbackToken

public final class CallbackToken {
    private let cancelClosure: () -> Void
    private var cancelled = false

    init(cancel: @escaping () -> Void) {
        self.cancelClosure = cancel
    }

    public func cancel() {
        guard !cancelled else { return }
        cancelled = true
        cancelClosure()
    }

    deinit {
        cancel()
    }
}
