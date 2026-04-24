// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk

import org.junit.Assert.assertTrue
import org.junit.Test

class LukuSdkSelfTestTest {
    @Test
    fun includesRealP256Operations() {
        val results = LukuSdk.selfTest()
        assertTrue(results.any { it.alg == "P256" && it.operation == "SIGN" && it.passed })
        assertTrue(results.any { it.alg == "P256" && it.operation == "VERIFY" && it.passed })
        assertTrue(results.any { it.alg == "P256" && it.operation == "REJECT" && it.passed })
    }
}
