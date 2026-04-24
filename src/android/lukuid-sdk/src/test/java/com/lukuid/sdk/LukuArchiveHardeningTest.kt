// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk

import org.json.JSONObject
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test
import java.io.ByteArrayOutputStream
import java.nio.charset.StandardCharsets
import java.security.KeyPairGenerator
import java.security.PrivateKey
import java.security.Signature
import java.util.Base64
import java.util.zip.CRC32
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

class LukuArchiveHardeningTest {
    private data class TestSigner(
        val privateKey: PrivateKey,
        val publicKeyBase64: String
    )

    private fun createTestSigner(): TestSigner {
        val keyPair = KeyPairGenerator.getInstance("Ed25519").generateKeyPair()
        val raw = keyPair.public.encoded.copyOfRange(keyPair.public.encoded.size - 32, keyPair.public.encoded.size)
        return TestSigner(
            privateKey = keyPair.private,
            publicKeyBase64 = Base64.getEncoder().encodeToString(raw)
        )
    }

    private fun signCanonical(privateKey: PrivateKey, canonical: String): String {
        val signature = Signature.getInstance("Ed25519")
        signature.initSign(privateKey)
        signature.update(canonical.toByteArray(StandardCharsets.UTF_8))
        return Base64.getEncoder().encodeToString(signature.sign())
    }

    private fun buildArchiveBytes(manifest: JSONObject, extraEntries: List<Pair<String, ByteArray>> = emptyList()): ByteArray {
        val out = ByteArrayOutputStream()
        ZipOutputStream(out).use { zip ->
            val mimetypeBytes = LUKU_MIMETYPE.toByteArray(StandardCharsets.UTF_8)
            zip.putNextEntry(
                ZipEntry("mimetype").apply {
                    method = ZipEntry.STORED
                    size = mimetypeBytes.size.toLong()
                    compressedSize = size
                    crc = CRC32().apply { update(mimetypeBytes) }.value
                }
            )
            zip.write(mimetypeBytes)
            zip.closeEntry()

            zip.putNextEntry(ZipEntry("manifest.json"))
            zip.write(manifest.toString().toByteArray(StandardCharsets.UTF_8))
            zip.closeEntry()

            zip.putNextEntry(ZipEntry("blocks.jsonl"))
            zip.write(ByteArray(0))
            zip.closeEntry()

            for ((name, payload) in extraEntries) {
                zip.putNextEntry(ZipEntry(name))
                zip.write(payload)
                zip.closeEntry()
            }
        }
        return out.toByteArray()
    }

    private fun verifyOptions(): LukuVerifyOptions = LukuVerifyOptions(
        allowUntrustedRoots = true,
        skipCertificateTemporalChecks = true,
        trustProfile = "dev"
    )

    private fun createValidExport(deviceId: String): LukuArchive {
        val signer = createTestSigner()
        val archive = LukuArchive.exportWithIdentity(
            records = listOf(
                JSONObject()
                    .put("type", "scan")
                    .put("signature", signCanonical(signer.privateKey, "scan-can"))
                    .put("previous_signature", "genesis_fake")
                    .put("canonical_string", "scan-can")
                    .put(
                        "payload",
                        JSONObject()
                            .put("ctr", 1)
                            .put("timestamp_utc", 1)
                            .put("genesis_hash", "genesis_fake")
                    )
            ),
            device = LukuDeviceIdentity(deviceId, signer.publicKeyBase64),
            attachments = emptyMap(),
            signer = LukuSigner(signer.privateKey, signer.publicKeyBase64)
        )
        return LukuArchive.open(archive.saveToBytes())
    }

    @Test
    fun rejectsUnsafeZipEntryPaths() {
        val manifest = JSONObject()
            .put("type", "LukuArchive")
            .put("version", "1.0.0")
            .put("created_at_utc", 1)
            .put("description", "test")
            .put("blocks_hash", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")

        try {
            LukuArchive.open(buildArchiveBytes(manifest, listOf("attachments/../../evil" to "boom".toByteArray())))
            fail("Expected unsafe ZIP entry path to be rejected")
        } catch (error: IllegalArgumentException) {
            assertTrue(error.message?.contains("unsafe ZIP entry path") == true)
        }
    }

    @Test
    fun flagsUnsupportedManifestVersions() {
        val manifest = JSONObject()
            .put("type", "LukuArchive")
            .put("version", "9.9.9")
            .put("created_at_utc", 1)
            .put("description", "test")
            .put("blocks_hash", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")

        val archive = LukuArchive.open(buildArchiveBytes(manifest))
        val issues = archive.verify(verifyOptions())
        assertTrue(issues.any { it.code == "MANIFEST_VERSION_UNSUPPORTED" })
    }

    @Test
    fun rejectsExternalIdentityOnUnsupportedRecordTypes() {
        val archive = createValidExport("LUK-ANDROID-HARDEN")
        archive.blocks[0].batch[0].put("external_identity", JSONObject().put("endorser_id", "ext-1"))
        val issues = archive.verify(verifyOptions())
        assertTrue(issues.any { it.code == "EXTERNAL_IDENTITY_UNSUPPORTED_RECORD_TYPE" })
    }
}
