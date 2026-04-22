// SPDX-License-Identifier: Apache-2.0
import Foundation

enum JsonCodec {
    static func encode(dictionary: [String: Any]) throws -> Data {
        try JSONSerialization.data(withJSONObject: dictionary, options: [])
    }

    static func normalize(_ value: Any) -> Any {
        if let dict = value as? [String: Any] {
            var next: [String: Any] = [:]
            dict.forEach { key, nested in
                next[key] = normalize(nested)
            }
            return next
        } else if let nsDict = value as? NSDictionary {
            var next: [String: Any] = [:]
            for (key, nested) in nsDict {
                next[String(describing: key)] = normalize(nested)
            }
            return next
        } else if let array = value as? [Any] {
            return array.map { normalize($0) }
        } else if let nsArray = value as? NSArray {
            return nsArray.map { normalize($0) }
        } else if value is NSNull {
            return NSNull()
        }
        return value
    }
}
