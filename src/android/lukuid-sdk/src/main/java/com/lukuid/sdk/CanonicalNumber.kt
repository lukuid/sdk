// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk

import java.math.BigDecimal
import java.math.RoundingMode

/**
 * Fixed-point formatting that matches the device signer (C `printf("%.Nf")`) and the
 * Rust SDK: the exact binary value is rounded half-to-even and the sign of negative
 * values (including -0.0) is kept. `String.format("%.2f")` rounds exact ties up
 * (1023.125 -> "1023.13" where the device signed "1023.12").
 */
internal object CanonicalNumber {
    fun fixed(value: Double, digits: Int): String {
        if (value.isNaN() || value.isInfinite()) return value.toString()
        val negative = value < 0.0 || (value == 0.0 && 1.0 / value < 0.0)
        val text = BigDecimal(Math.abs(value)).setScale(digits, RoundingMode.HALF_EVEN).toPlainString()
        return if (negative) "-$text" else text
    }
}
