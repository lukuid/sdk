// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk

import org.json.JSONObject
import org.json.JSONArray
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.nio.file.Path
import java.util.Base64

class ArchiveSealsTest {
    @Test fun selfSealVerifiesAndCorruptionFails() {
        val manifest = "{\"type\":\"LukuArchive\"}".toByteArray()
        val raw = ArchiveSeals.create(manifest, 1791051600)
        val root = JSONObject(raw)
        assertEquals("self", root.getJSONArray("seals").getJSONObject(0).getString("type"))
        assertTrue(ArchiveSeals.verify(raw, manifest).none { it.criticality == Criticality.CRITICAL })
        val seal = root.getJSONArray("seals").getJSONObject(0)
        seal.put("signature", "AA==")
        assertTrue(ArchiveSeals.verify(root.toString(), manifest).any { it.code == "ARCHIVE_SELF_SEAL_INVALID" })
        assertTrue(ArchiveSeals.verify(null, manifest).any { it.code == "ARCHIVE_SEALS_MISSING" })
    }

    @Test fun invalidAndroidChainFailsButUnsupportedPlatformIsReported() {
        val manifest = "{\"type\":\"LukuArchive\"}".toByteArray()
        val root = JSONObject(ArchiveSeals.create(manifest, 1791051600))
        val platform = JSONObject()
            .put("type", "platform")
            .put("platform", "android")
            .put("alg", "ES256")
            .put("created_at_utc", 1791051600)
            .put("key_id", "00".repeat(32))
            .put("public_key", "AA==")
            .put("certificate_chain", JSONArray().put("AA==").put("AA=="))
            .put("metadata", JSONObject().put("security_level", "strongbox"))
            .put("signature", "AA==")
        root.getJSONArray("seals").put(platform)
        assertTrue(ArchiveSeals.verify(root.toString(), manifest).any { it.code == "ARCHIVE_PLATFORM_SEAL_INVALID" })
        platform.put("platform", "future-platform")
        assertTrue(ArchiveSeals.verify(root.toString(), manifest).any { it.code == "ARCHIVE_PLATFORM_SEAL_UNSUPPORTED" })
    }

    @Test fun sharedSelfOnlyFixtureVerifies() {
        var current: Path? = Path.of(System.getProperty("user.dir")).toAbsolutePath()
        var fixture: Path? = null
        while (current != null && fixture == null) {
            val candidate = current.resolve("samples/dotluku/sealed-self-only.luku")
            if (candidate.toFile().exists()) fixture = candidate
            current = current.parent
        }
        val archive = LukuArchive.open(requireNotNull(fixture).toFile())
        assertTrue(archive.verify().none { it.code.startsWith("ARCHIVE_") })
    }

    @Test fun platformProviderFailureDoesNotFailExport() {
        val manifest = "{\"type\":\"LukuArchive\"}".toByteArray()
        val raw = ArchiveSeals.createWithPlatform(manifest, 1791051600) { _, _, _ ->
            throw IllegalStateException("hardware unavailable")
        }
        assertEquals(1, JSONObject(raw).getJSONArray("seals").length())
        assertTrue(ArchiveSeals.verify(raw, manifest).none { it.criticality == Criticality.CRITICAL })
    }

    @Test fun strongBoxIsPreferredAndTeeIsFallback() {
        val strongBox = JSONObject().put("metadata", JSONObject().put("security_level", "strongbox"))
        val tee = JSONObject().put("metadata", JSONObject().put("security_level", "tee"))
        assertEquals(strongBox, AndroidPlatformSeal.chooseCandidate({ strongBox }, { tee }))
        assertEquals(tee, AndroidPlatformSeal.chooseCandidate({ null }, { tee }))
        assertEquals(null, AndroidPlatformSeal.chooseCandidate({ null }, { null }))
    }

    @Test fun signedAndroidAttestationChainIsVerifiedOffline() {
        var current: Path? = Path.of(System.getProperty("user.dir")).toAbsolutePath()
        var path: Path? = null
        while (current != null && path == null) {
            val candidate = current.resolve("src/rust/lukuid-sdk/tests/android-platform-seal-test.json")
            if (candidate.toFile().exists()) path = candidate
            current = current.parent
        }
        val fixture = JSONObject(requireNotNull(path).toFile().readText())
        val seal = fixture.getJSONObject("seal")
        val hash = fixture.getString("manifest_hash")
        val digest = hash.chunked(2).map { it.toInt(16).toByte() }.toByteArray()
        val payload = "LUKUID-ARCHIVE-SEAL-V1\nmanifest_hash_alg=SHA-256\nmanifest_hash=$hash\ncreated_at_utc=${seal.getLong("created_at_utc")}".toByteArray()
        val roots = setOf(fixture.getString("test_root_sha256"))
        assertTrue(AndroidPlatformSeal.verifyWithRoots(seal, digest, payload, roots))
        assertTrue(!AndroidPlatformSeal.verify(seal, digest, payload))
        val altered = JSONObject(seal.toString()).put("signature", Base64.getEncoder().encodeToString(ByteArray(64)))
        assertTrue(!AndroidPlatformSeal.verifyWithRoots(altered, digest, payload, roots))
        val chain = JSONObject(seal.toString()).put("certificate_chain", JSONArray().put(seal.getJSONArray("certificate_chain").getString(0)).put(seal.getJSONArray("certificate_chain").getString(0)))
        assertTrue(!AndroidPlatformSeal.verifyWithRoots(chain, digest, payload, roots))
        val claim = JSONObject(seal.toString()).put("metadata", JSONObject().put("security_level", "tee"))
        assertTrue(!AndroidPlatformSeal.verifyWithRoots(claim, digest, payload, roots))
    }
}
