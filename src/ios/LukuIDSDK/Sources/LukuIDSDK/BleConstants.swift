// SPDX-License-Identifier: Apache-2.0
import CoreBluetooth

enum BleConstants {
    static let serviceUUID = CBUUID(string: "7b7e4f7a-2f0d-4b5a-9d3d-3f0a7e0b9f7c")
    static let rxCharacteristicUUID = CBUUID(string: "7b7e4f7a-2f0d-4b5a-9d3d-3f0a7e0b9f7d")
    static let txCharacteristicUUID = CBUUID(string: "7b7e4f7a-2f0d-4b5a-9d3d-3f0a7e0b9f7e")
}
