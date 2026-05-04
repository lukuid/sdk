import XCTest
@testable import LukuIDSDK

final class UrlUtilsTests: XCTestCase {

    func testIsExternalCallAllowed() throws {
        // Disabled = false
        XCTAssertTrue(isExternalCallAllowed(targetUrl: "https://api.lukuid.com", disableExternalCalls: false))
        XCTAssertTrue(isExternalCallAllowed(targetUrl: "https://custom.endpoint.com", disableExternalCalls: false))

        // Disabled = true, block lukuid.com
        XCTAssertFalse(isExternalCallAllowed(targetUrl: "https://api.lukuid.com", disableExternalCalls: true))
        XCTAssertFalse(isExternalCallAllowed(targetUrl: "http://lukuid.com", disableExternalCalls: true))
        XCTAssertFalse(isExternalCallAllowed(targetUrl: "https://sub.api.lukuid.com/path", disableExternalCalls: true))
        XCTAssertFalse(isExternalCallAllowed(targetUrl: "https://LUKUID.COM", disableExternalCalls: true))

        // Disabled = true, allow custom endpoints
        XCTAssertTrue(isExternalCallAllowed(targetUrl: "https://custom.endpoint.com", disableExternalCalls: true))
        XCTAssertTrue(isExternalCallAllowed(targetUrl: "https://notlukuid.com", disableExternalCalls: true))
        XCTAssertTrue(isExternalCallAllowed(targetUrl: "http://localhost:8080", disableExternalCalls: true))
        XCTAssertTrue(isExternalCallAllowed(targetUrl: "https://lukuid.com.br", disableExternalCalls: true))
    }
}
