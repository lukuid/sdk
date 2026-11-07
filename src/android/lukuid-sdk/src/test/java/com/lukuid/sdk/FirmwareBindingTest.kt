// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk

import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File
import java.nio.file.Path

/**
 * Every device-signed record binds the firmware that signed it (dotluku "Firmware Binding").
 * The samples are real exports from the test-PKI Environment card and Animal Reader.
 */
class FirmwareBindingTest {
    private val samples = listOf("firmware-bound-environment.luku", "firmware-bound-reader.luku")

    /** Index of `firmware` in each type's canonical string, and whether it lives in `payload`. */
    private val slot = mapOf(
        "scan" to (9 to true),
        "environment" to (7 to true),
        "attachment" to (7 to false),
        "custody" to (7 to false),
        "location" to (6 to false)
    )

    private fun sampleFile(name: String): File {
        var current: Path? = Path.of(System.getProperty("user.dir")).toAbsolutePath()
        while (current != null) {
            val candidate = current.resolve("samples/dotluku/test/1.1.0/$name")
            if (candidate.toFile().exists()) return candidate.toFile()
            current = current.parent
        }
        throw java.io.FileNotFoundException("Missing sample archive $name")
    }

    private fun open(name: String): LukuArchive = LukuArchive.open(sampleFile(name).readBytes())

    private fun criticalCodes(archive: LukuArchive): List<String> =
        archive.verify(LukuVerifyOptions(allowUntrustedRoots = false, skipCertificateTemporalChecks = true, trustProfile = "test"))
            .filter { it.criticality == Criticality.CRITICAL }
            .map { it.code }

    private fun holder(record: JSONObject): JSONObject =
        if (slot.getValue(record.getString("type")).second) record.getJSONObject("payload") else record

    private fun setSlot(record: JSONObject, value: String?) {
        val parts = record.getString("canonical_string").split(":").toMutableList()
        val index = slot.getValue(record.getString("type")).first
        if (value == null) parts.removeAt(index) else parts[index] = value
        record.put("canonical_string", parts.joinToString(":"))
    }

    private fun tampered(name: String, index: Int, edit: (JSONObject) -> Unit): List<String> {
        val archive = open(name)
        edit(archive.blocks[0].batch[index])
        return criticalCodes(archive)
    }

    @Test
    fun firmwareBoundSamplesVerify() {
        for (name in samples) assertEquals(name, emptyList<String>(), criticalCodes(open(name)))
    }

    @Test
    fun everyRecordSignsItsFirmwareInThePrefix() {
        val seen = mutableListOf<String>()
        for (name in samples) {
            for (record in open(name).blocks[0].batch) {
                val type = record.getString("type")
                assertEquals("$name $type", "v1.0.0", holder(record).getString("firmware"))
                assertEquals("$name $type", "v1.0.0", record.getString("canonical_string").split(":")[slot.getValue(type).first])
                seen.add(type)
            }
        }
        assertEquals(listOf("attachment", "attachment", "custody", "custody", "environment", "location", "location", "scan"), seen.sorted())
    }

    @Test
    fun aChangedOrRemovedFirmwareFieldIsACanonicalMismatch() {
        for (name in samples) {
            for (index in 0 until 4) {
                var codes = tampered(name, index) { holder(it).put("firmware", "v9.9.9") }
                assertTrue("$name[$index] $codes", "RECORD_CANONICAL_MISMATCH" in codes)
                assertFalse("$name[$index] $codes", "RECORD_SIGNATURE_INVALID" in codes)
                codes = tampered(name, index) { holder(it).remove("firmware") }
                assertTrue("$name[$index] removed $codes", "RECORD_CANONICAL_MISMATCH" in codes)
            }
        }
    }

    @Test
    fun aFirmwareChangedInTheSignedStringFailsTheSignature() {
        for (name in samples) {
            for (index in 0 until 4) {
                val codes = tampered(name, index) { holder(it).put("firmware", "v9.9.9"); setSlot(it, "v9.9.9") }
                assertTrue("$name[$index] $codes", "RECORD_SIGNATURE_INVALID" in codes)
                assertFalse("$name[$index] $codes", "RECORD_CANONICAL_MISMATCH" in codes)
            }
        }
    }

    @Test
    fun aFirmwareBoundRecordCannotPassAsOneFromBeforeTheRule() {
        for (name in samples) {
            for (index in 0 until 4) {
                if (open(name).blocks[0].batch[index].getString("type") == "scan") continue // scan has always had the slot
                val codes = tampered(name, index) { holder(it).remove("firmware"); setSlot(it, null) }
                assertTrue("$name[$index] $codes", "RECORD_SIGNATURE_INVALID" in codes)
                assertFalse("$name[$index] $codes", "RECORD_CANONICAL_MISMATCH" in codes)
            }
        }
    }
}
