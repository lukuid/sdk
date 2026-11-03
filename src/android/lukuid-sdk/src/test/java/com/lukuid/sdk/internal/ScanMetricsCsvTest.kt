// SPDX-License-Identifier: Apache-2.0
// Animal Reader scans send `metrics` as the signed text (ScanPayload.metrics_csv,
// field 38); LUKU.md carries it as a numeric array.
package com.lukuid.sdk.internal

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class ScanMetricsCsvTest {
    private val signed = "38.50,45.00,-65.00,12.00,5.00,120.00,2.00,3300.00,10.00,11.00,1.00,2000.00,50.00,1.20,1.00,5.00,-2.00,0.00"

    @Test
    fun parsesSignedMetricsIntoNumbers() {
        assertEquals(
            listOf(38.5, 45.0, -65.0, 12.0, 5.0, 120.0, 2.0, 3300.0, 10.0, 11.0, 1.0, 2000.0, 50.0, 1.2, 1.0, 5.0, -2.0, 0.0),
            scanMetricsFromCsv(signed)
        )
    }

    @Test
    fun metricsFormatBackToTheSignedText() {
        val text = scanMetricsFromCsv(signed)!!.joinToString(",") { String.format(java.util.Locale.ROOT, "%.2f", it) }
        assertEquals(signed, text)
    }

    @Test
    fun rejectsUnparsableMetricsInsteadOfGuessing() {
        assertNull(scanMetricsFromCsv("1.00,abc,3.00"))
        assertNull(scanMetricsFromCsv("1.00,NaN"))
        assertNull(scanMetricsFromCsv(""))
    }
}
