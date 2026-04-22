// SPDX-License-Identifier: Apache-2.0
import Foundation

public struct DeviceTrustError: Error {
    public let code = "DEVICE_UNTRUSTED"
    public let id: String
    public let reason: String
    public let attemptedKeyIds: [String]

    public init(id: String, reason: String, attemptedKeyIds: [String]) {
        self.id = id
        self.reason = reason
        self.attemptedKeyIds = attemptedKeyIds
    }
}
