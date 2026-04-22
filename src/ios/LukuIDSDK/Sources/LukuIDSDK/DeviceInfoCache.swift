// SPDX-License-Identifier: Apache-2.0
import Foundation

actor DeviceInfoCache {
    private var cache: [String: DeviceInfo] = [:]

    func get(transport: TransportType, transportId: String) -> DeviceInfo? {
        cache[key(for: transport, id: transportId)]
    }

    func set(_ info: DeviceInfo) {
        cache[key(for: info.transport, id: info.transportId)] = info
    }

    private func key(for transport: TransportType, id: String) -> String {
        "\(transport.rawValue):\(id)"
    }
}
