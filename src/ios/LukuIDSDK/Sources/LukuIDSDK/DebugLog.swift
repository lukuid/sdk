// SPDX-License-Identifier: Apache-2.0
import Foundation

@inline(__always)
func debugLog(_ options: LukuIDClientOptions, _ message: String, context: [String: Any] = [:]) {
    guard options.debugLogging else {
        return
    }

    if context.isEmpty {
        print("[LukuIDSDK] \(message)")
        return
    }

    print("[LukuIDSDK] \(message) \(context)")
}
