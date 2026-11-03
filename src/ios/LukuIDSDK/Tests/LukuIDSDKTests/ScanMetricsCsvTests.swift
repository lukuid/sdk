// SPDX-License-Identifier: Apache-2.0
// Animal Reader scans send `metrics` as the signed text (ScanPayload.metrics_csv,
// field 38); LUKU.md carries it as a numeric array.
import XCTest
@testable import LukuIDSDK

final class ScanMetricsCsvTests: XCTestCase {
    private let signed = "38.50,45.00,-65.00,12.00,5.00,120.00,2.00,3300.00,10.00,11.00,1.00,2000.00,50.00,1.20,1.00,5.00,-2.00,0.00"

    func testParsesSignedMetricsIntoNumbers() {
        XCTAssertEqual(LukuCodec.scanMetricsFromCsv(signed),
                       [38.5, 45, -65, 12, 5, 120, 2, 3300, 10, 11, 1, 2000, 50, 1.2, 1, 5, -2, 0])
    }

    func testMetricsFormatBackToTheSignedText() {
        let text = LukuCodec.scanMetricsFromCsv(signed)!.map { String(format: "%.2f", $0) }.joined(separator: ",")
        XCTAssertEqual(text, signed)
    }

    func testRejectsUnparsableMetricsInsteadOfGuessing() {
        XCTAssertNil(LukuCodec.scanMetricsFromCsv("1.00,abc,3.00"))
        XCTAssertNil(LukuCodec.scanMetricsFromCsv("1.00,nan"))
        XCTAssertNil(LukuCodec.scanMetricsFromCsv(""))
    }
}
