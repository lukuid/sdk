// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk

class DeviceTrustException(
    val id: String,
    val reason: String,
    val attemptedKeyIds: List<String>
) : Exception("Device $id failed attestation: $reason") {
    val code: String = "DEVICE_UNTRUSTED"
}
