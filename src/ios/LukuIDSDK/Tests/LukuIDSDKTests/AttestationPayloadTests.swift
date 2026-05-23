// SPDX-License-Identifier: Apache-2.0
import XCTest
@testable import LukuIDSDK

final class AttestationPayloadTests: XCTestCase {
    func testBuildRecordAttestationPayload() {
        XCTAssertEqual(
            buildRecordAttestationPayload(
                id: "GC-2005-EU",
                key: "base64_device_public_key",
                ctr: 42,
                recordID: "env-123"
            ),
            "attestation:GC-2005-EU:base64_device_public_key:42:env-123"
        )
    }

    func testBuildRecordHeartbeatPayload() {
        XCTAssertEqual(
            buildRecordHeartbeatPayload(
                id: "GC-2005-EU",
                lastSyncUtc: 1770800000,
                ctr: 42,
                recordID: "env-123"
            ),
            "heartbeat:GC-2005-EU:1770800000:42:env-123"
        )
    }
}
