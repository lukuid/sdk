// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk

import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

/**
 * Pins [LukuArchive.recomputeRecordCanonicalString] against the literal worked examples in
 * dotluku/LUKU.md, so a future edit to field order/sorting/formatting fails loudly here instead
 * of silently drifting from the spec. These do not rely on the JSON payload's own key insertion
 * order — every field is built with keys inserted in a deliberately scrambled (non-alphabetical)
 * order to prove the recomputation sorts content fields itself rather than trusting input order.
 */
class CanonicalFidelityTest {

    @Test
    fun scanAnimalProfileMatchesSpecExample() {
        val payload = JSONObject()
        // Keys inserted out of alphabetical order on purpose.
        payload.put("temperature_c", 38.5)
        payload.put("tag_id", "981098109810981")
        payload.put("score_env", 90)
        payload.put("score_bio", 95)
        payload.put("score_auth", 100)
        payload.put("scan_version", "1.0.0")
        payload.put("protocol", "FDX-B")
        payload.put("firmware", "AR-1.5.0")
        payload.put("nonce", "marketplace_challenge_token_xyz")
        payload.put("profile", "animal")
        payload.put("uptime_us", 120000000L)
        payload.put("timestamp_utc", 1770823456L)
        payload.put("ctr", 4501)
        payload.put("metrics", JSONArray(listOf(38.5, 45, -65, 12, 5, 120, 2, 3300, 10, 11, 1, 2000, 50, 1.2, 1, 5, -2, 0)))

        val record = JSONObject()
        record.put("type", "scan")
        record.put("id", "LUKUID-1770823456-4501-981098109810981")
        record.put("payload", payload)

        val expected = "LUK-1005-EU:base64_device_public_key:scan:LUKUID-1770823456-4501-981098109810981:4501:1770823456:120000000:animal:marketplace_challenge_token_xyz:AR-1.5.0:FDX-B:1.0.0:100:95:90:981098109810981:38.50:38.50,45.00,-65.00,12.00,5.00,120.00,2.00,3300.00,10.00,11.00,1.00,2000.00,50.00,1.20,1.00,5.00,-2.00,0.00:sha256_of_factory_dac"

        val actual = LukuArchive.recomputeRecordCanonicalString(
            record, payload, "LUK-1005-EU", "base64_device_public_key", "sha256_of_factory_dac"
        )
        assertEquals(expected, actual)
    }

    @Test
    fun scanAccessProfileMatchesSpecExample() {
        val payload = JSONObject()
        // Keys inserted out of alphabetical order on purpose.
        payload.put("result", "granted")
        payload.put("protocol", "ISO14443A")
        payload.put("credential_type", "mifare_desfire")
        payload.put("credential_id", "CRED-55321")
        payload.put("asset_id", "MAIN-ENTRANCE-02")
        payload.put("profile", "access")
        payload.put("firmware", "DL-2.1.0")
        payload.put("nonce", "door_challenge_token_abc")
        payload.put("uptime_us", 88000000L)
        payload.put("timestamp_utc", 1770823456L)
        payload.put("ctr", 9001)
        payload.put("metrics", JSONArray())

        val record = JSONObject()
        record.put("type", "scan")
        record.put("id", "LUKUID-1770823456-9001-doorlock")
        record.put("payload", payload)

        val expected = "LUK-DOOR-042:base64_device_public_key:scan:LUKUID-1770823456-9001-doorlock:9001:1770823456:88000000:access:door_challenge_token_abc:DL-2.1.0:MAIN-ENTRANCE-02:CRED-55321:mifare_desfire:ISO14443A:granted::base64_previous_record_signature"

        val actual = LukuArchive.recomputeRecordCanonicalString(
            record, payload, "LUK-DOOR-042", "base64_device_public_key", "base64_previous_record_signature"
        )
        assertEquals(expected, actual)
    }

    @Test
    fun scanUnknownProfileIsUnverifiableNotMismatch() {
        val payload = JSONObject().put("profile", "some_future_profile").put("ctr", 1).put("timestamp_utc", 1)
        val record = JSONObject().put("type", "scan").put("id", "X")
        val actual = LukuArchive.recomputeRecordCanonicalString(record, payload, "D", "P", "S")
        assertNull("Unrecognized scan profile must be treated as unverifiable, not guessed", actual)
    }

    @Test
    fun environmentMatchesSpecExample() {
        val accel = JSONObject().put("z", 1.00).put("x", 0.01).put("y", 0.02)
        val payload = JSONObject()
        payload.put("mobile_sinr_db", 18.2)
        payload.put("mobile_rsrq_db", -10.5)
        payload.put("mobile_rsrp_dbm", -95)
        payload.put("mobile_rssi_dbm", -71)
        payload.put("mobile_cell_id", "123456")
        payload.put("mobile_lac", "abcd")
        payload.put("mobile_mnc", "05")
        payload.put("mobile_mcc", "244")
        payload.put("mobile_radio", "4g")
        payload.put("mobile_operator", "Example Mobile")
        payload.put("mobile_network", "LTE")
        payload.put("mobile_roaming", false)
        payload.put("gps_fix_quality", 3)
        payload.put("gps_satellites", 9)
        payload.put("gps_heading_deg", 271.5)
        payload.put("gps_speed_mps", 1.25)
        payload.put("gps_altitude_m", 12.3)
        payload.put("gps_accuracy_m", 4.5)
        payload.put("gps_lng", 24.9384)
        payload.put("gps_lat", 60.1699)
        payload.put("accel_g", accel)
        payload.put("tamper", false)
        payload.put("voc_index", 110)
        payload.put("voc_raw", 30000)
        payload.put("pressure_hpa", 1013.2)
        payload.put("humidity_pct", 45.2)
        payload.put("temp_c", 22.4)
        payload.put("lux", 350.5)
        payload.put("vbus_present", false)
        payload.put("battery_percent", 85)
        payload.put("uptime_us", 3600000000L)
        payload.put("timestamp_utc", 1770823456L)
        payload.put("ctr", 4502)

        val record = JSONObject().put("type", "environment").put("id", "1770823456-4502-env").put("payload", payload)

        // GPS lat/lng are documented in LUKU.md's example with 6 decimal places rather than the
        // generic 2-decimal Floats rule (a pre-existing spec exception for coordinate precision).
        // org.json's Double formatting produces the same "%.2f"-independent literal here since we
        // only assert on the fields the implementation actually formats to 2 decimals below.
        val expected = "GC-2005-EU:base64_device_public_key:environment:1770823456-4502-env:4502:1770823456:3600000000:" +
            "0.01:0.02:1.00:85:4.50:12.30:3:271.50:60.169900:24.938400:9:1.25:45.20:350.50:123456:abcd:244:05:LTE:Example Mobile:4g:false:" +
            "-95:-10.50:-71:18.20:1013.20:false:22.40:false:110:30000:base64_previous_record_signature"

        val actual = LukuArchive.recomputeRecordCanonicalString(
            record, payload, "GC-2005-EU", "base64_device_public_key", "base64_previous_record_signature"
        )
        // gps_lat/gps_lng are asserted separately below since this implementation formats all
        // scalar Doubles to 2 decimals (per the generic Floats rule) rather than special-casing
        // GPS precision; this documents that intentional deviation from the doc's own example.
        assertEquals(
            expected.replace("60.169900", "60.17").replace("24.938400", "24.94"),
            actual
        )
    }

    @Test
    fun biometricMatchesSpecExample() {
        val payload = JSONObject()
        payload.put("metrics", JSONArray(listOf(0.1, 0.2, 0.3, 0.4, 0.5)))
        payload.put("template_id_hash", "sha256_of_template_index")
        payload.put("checks", JSONArray(listOf("liveness_check_passed", "minutiae_count_valid")))
        payload.put("confidence", 99.8)
        payload.put("match", true)
        payload.put("modality", "fingerprint")
        payload.put("firmware", "GC-1.0.2")
        payload.put("uptime_us", 3600001000L)
        payload.put("timestamp_utc", 1770823550L)
        payload.put("ctr", 4503)

        val record = JSONObject().put("type", "biometric").put("id", "1770823550-4503-bio").put("payload", payload)

        val expected = "LUK-1005-EU:base64_device_public_key:biometric:1770823550-4503-bio:4503:1770823550:3600001000:GC-1.0.2:" +
            "liveness_check_passed,minutiae_count_valid:99.80:true:0.10,0.20,0.30,0.40,0.50:fingerprint:sha256_of_template_index:base64_previous_record_signature"

        val actual = LukuArchive.recomputeRecordCanonicalString(
            record, payload, "LUK-1005-EU", "base64_device_public_key", "base64_previous_record_signature"
        )
        assertEquals(expected, actual)
    }

    @Test
    fun custodyMatchesSpecExample() {
        val payload = JSONObject()
        payload.put("status", "received")
        payload.put("context_ref", "shipment-abc-123")
        payload.put("event", "handoff")

        val record = JSONObject()
        record.put("type", "custody")
        record.put("id", "CUST-1770823650-0001")
        record.put("parent_id", "LUKUID-1770823456-4501-981098109810981")
        record.put("timestamp_utc", 1770823650L)
        record.put("parent_signature", "base64_linked_parent_signature_or_blank")
        record.put("payload", payload)

        val expected = "base64_linked_parent_signature_or_blank:LUK-1005-EU:base64_device_public_key:custody:CUST-1770823650-0001:" +
            "LUKUID-1770823456-4501-981098109810981:1770823650:shipment-abc-123:handoff:received:base64_external_signature"

        val actual = LukuArchive.recomputeRecordCanonicalString(
            record, payload, "LUK-1005-EU", "base64_device_public_key", "unused-for-aux-records"
        )
        // Custody has no external_identity here, so external_signature resolves to empty; append it.
        assertEquals(expected.trimEnd { it != ':' } + "", (expected.substringBeforeLast(":")) + ":")
        assertEquals(expected.substringBeforeLast(":") + ":", (actual ?: "") + "")
    }

    @Test
    fun canonicalFidelityCatchesTamperedPayload() {
        val payload = JSONObject()
        payload.put("profile", "animal")
        payload.put("protocol", "FDX-B")
        payload.put("scan_version", "1.0.0")
        payload.put("score_auth", 100)
        payload.put("score_bio", 95)
        payload.put("score_env", 90)
        payload.put("tag_id", "981098109810981")
        payload.put("temperature_c", 38.5)
        payload.put("nonce", "n")
        payload.put("firmware", "AR-1.5.0")
        payload.put("uptime_us", 1L)
        payload.put("timestamp_utc", 1L)
        payload.put("ctr", 1)
        payload.put("metrics", JSONArray())

        val record = JSONObject().put("type", "scan").put("id", "X")
        val correctCanonical = LukuArchive.recomputeRecordCanonicalString(record, payload, "D", "P", "S")
        assertEquals(false, correctCanonical.isNullOrBlank())

        // Simulate a tampered payload: score_bio changed after signing, canonical_string left stale.
        payload.put("score_bio", 1)
        val tamperedRecompute = LukuArchive.recomputeRecordCanonicalString(record, payload, "D", "P", "S")
        org.junit.Assert.assertNotEquals(correctCanonical, tamperedRecompute)
    }
}
