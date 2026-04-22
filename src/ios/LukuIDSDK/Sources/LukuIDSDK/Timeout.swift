// SPDX-License-Identifier: Apache-2.0
import Foundation

func withTimeout<T>(seconds: TimeInterval, operation: @escaping () async throws -> T) async throws -> T {
    try await withThrowingTaskGroup(of: T.self) { group in
        group.addTask {
            try await operation()
        }
        group.addTask {
            try await Task.sleep(nanoseconds: UInt64(seconds * 1_000_000_000))
            throw NSError(domain: "lukuid", code: -100, userInfo: [NSLocalizedDescriptionKey: "Timed out after \(seconds)s"])
        }
        guard let result = try await group.next() else {
            throw NSError(domain: "lukuid", code: -101, userInfo: [NSLocalizedDescriptionKey: "Timeout"])
        }
        group.cancelAll()
        return result
    }
}
