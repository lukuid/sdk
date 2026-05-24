// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk.internal

import org.junit.Assert.assertEquals
import org.junit.Test

class DeviceAttestationPayloadTest {
    @Test
    fun `builds record attestation payload`() {
        assertEquals(
            "attestation:GC-2005-EU:base64_device_public_key:42:LUKUID:env-123",
            buildRecordAttestationPayload("GC-2005-EU", "base64_device_public_key", 42, "LUKUID", "env-123")
        )
    }

    @Test
    fun `builds record heartbeat payload`() {
        assertEquals(
            "heartbeat:GC-2005-EU:1770800000:42:env-123",
            buildRecordHeartbeatPayload("GC-2005-EU", 1770800000, 42, "env-123")
        )
    }
}
