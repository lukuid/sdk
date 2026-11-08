// SPDX-License-Identifier: Apache-2.0
import XCTest
@testable import LukuIDSDK

/// Apps identify themselves through extra headers the SDK adds to every LukuID request.
final class ExtraHeadersTests: XCTestCase {
    func testAppliesValidHeadersAndSkipsUnsafeOnes() {
        let options = LukuIDClientOptions(extraHeaders: [
            "X-LukuID-App": "ios",
            "X-LukuID-App-Version": "1.0.400",
            "Bad Header": "x",
            "X-Bad-Value": "line\nbreak",
        ])
        var request = URLRequest(url: URL(string: "https://api.lukuid.com/heartbeat")!)
        request.applyExtraHeaders(options)
        XCTAssertEqual(request.value(forHTTPHeaderField: "X-LukuID-App"), "ios")
        XCTAssertEqual(request.value(forHTTPHeaderField: "X-LukuID-App-Version"), "1.0.400")
        XCTAssertNil(request.value(forHTTPHeaderField: "Bad Header"))
        XCTAssertNil(request.value(forHTTPHeaderField: "X-Bad-Value"))
    }
}
