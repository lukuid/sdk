// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk

import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test
import java.io.ByteArrayOutputStream
import java.io.File
import java.nio.file.Path
import java.nio.file.Files
import java.nio.charset.StandardCharsets
import java.security.KeyFactory
import java.security.KeyPairGenerator
import java.security.PrivateKey
import java.security.Signature
import java.security.spec.X509EncodedKeySpec
import java.util.Base64
import java.util.zip.CRC32
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

class LukuArchiveTest {
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

    private fun testOptions(): LukuVerifyOptions = LukuVerifyOptions(
        allowUntrustedRoots = true,
        skipCertificateTemporalChecks = true,
        trustProfile = "dev"
    )

    private fun currentSampleOptions(allowUntrustedRoots: Boolean = true, trustProfile: String = "test"): LukuVerifyOptions = LukuVerifyOptions(
        allowUntrustedRoots = allowUntrustedRoots,
        skipCertificateTemporalChecks = true,
        trustProfile = trustProfile
    )

    /** Signs the record over the canonical string recomputed from its own fields (LUKU.md Field Order rule). */
    private fun signInPlace(signer: TestSigner, record: JSONObject, deviceId: String): String {
        val canonical = LukuArchive.recomputeRecordCanonicalString(
            record, record.optJSONObject("payload"), deviceId, signer.publicKeyBase64, record.optString("previous_signature")
        ) ?: error("unknown record type")
        val signature = signCanonical(signer.privateKey, canonical)
        record.put("canonical_string", canonical).put("signature", signature)
        return signature
    }

    private fun animalScan(id: String, deviceId: String, publicKey: String, ctr: Int, timestampUtc: Long, previousSignature: String): JSONObject {
        val payload = JSONObject().put("ctr", ctr).put("timestamp_utc", timestampUtc).put("uptime_us", 1000000)
            .put("profile", "animal").put("firmware", "v1.0.0").put("protocol", "FDX-B").put("scan_version", "1.0").put("tag_id", "999000000000001")
        if (previousSignature == "genesis_fake") payload.put("genesis_hash", "genesis_fake")
        return JSONObject().put("type", "scan").put("vendor", "LUKUID").put("id", id).put("device_id", deviceId).put("public_key", publicKey)
            .put("previous_signature", previousSignature).put("payload", payload)
    }

    /** Current-format real exports under the test PKI (samples/dotluku/test/1.1.0/README.md). */
    private fun currentSampleFile(name: String): File {
        var current: Path? = Path.of(System.getProperty("user.dir")).toAbsolutePath()
        while (current != null) {
            val candidate = current.resolve("samples/dotluku/test/1.1.0/$name")
            if (candidate.toFile().exists()) return candidate.toFile()
            current = current.parent
        }
        throw java.io.FileNotFoundException("Missing current sample archive $name")
    }

    private fun hasIssue(issues: List<VerificationIssue>, vararg codes: String): Boolean =
        issues.any { it.code in codes }

    private fun sampleFile(name: String): File =
        resolveSampleFile(name).toFile()

    private fun resolveSampleFile(name: String): Path {
        val start = Path.of(System.getProperty("user.dir")).toAbsolutePath()
        val searchRoots = buildList {
            var current: Path? = start
            while (current != null) {
                add(current)
                current = current.parent
            }
        }

        for (root in searchRoots) {
            for (version in listOf("1.0.0", "1.0")) {
                val candidate = root.resolve("samples/dotluku/dev/$version/$name")
                if (candidate.toFile().exists()) {
                    return candidate
                }
            }
        }

        throw java.io.FileNotFoundException("Missing sample archive $name under ${start.normalize()}")
    }

    private fun externalIdentityFixture(): JSONObject {
        val start = Path.of(System.getProperty("user.dir")).toAbsolutePath()
        val searchRoots = buildList {
            var current: Path? = start
            while (current != null) {
                add(current)
                current = current.parent
            }
        }

        for (root in searchRoots) {
            val candidate = root.resolve("samples/external_identity/dev/self_signed_ed25519.json")
            if (candidate.toFile().exists()) {
                return JSONObject(String(Files.readAllBytes(candidate), StandardCharsets.UTF_8))
            }
        }

        throw java.io.FileNotFoundException("Missing external identity fixture under ${start.normalize()}")
    }

    private fun createValidExport(deviceId: String): Pair<LukuArchive, TestSigner> {
        val signer = createTestSigner()
        val identity = LukuDeviceIdentity(deviceId, signer.publicKeyBase64, "LUKUID")

        val records = mutableListOf<JSONObject>()
        var previous = "genesis_fake"
        for ((index, timestamp) in listOf(1000L, 1005L, 1010L).withIndex()) {
            val record = animalScan("SCAN-VALID-${index + 1}", deviceId, signer.publicKeyBase64, index + 1, timestamp, previous)
            previous = signInPlace(signer, record, deviceId)
            records += record
        }

        val archive = LukuArchive.exportWithIdentity(
            records = records,
            device = identity,
            attachments = emptyMap(),
            signer = LukuSigner(signer.privateKey, signer.publicKeyBase64)
        )

        return LukuArchive.open(archive.saveToBytes()) to signer
    }

    @Test
    fun exportsAndReopensArchives() {
        val signer = createTestSigner()
        val exported = LukuArchive.export(
            records = listOf(
                JSONObject().put("type", "scan").put("vendor", "LUKUID").put("signature", signCanonical(signer.privateKey, "can1")).put("previous_signature", "genesis_fake").put("canonical_string", "can1").put(
                    "payload",
                    JSONObject().put("ctr", 1).put("timestamp_utc", 1000)
                )
            ),
            device = LukuDeviceIdentity("LUK-TEST", signer.publicKeyBase64, "LUKUID"),
            attachments = emptyMap(),
            signer = LukuSigner(signer.privateKey, signer.publicKeyBase64)
        )
        val reopened = LukuArchive.open(exported.saveToBytes())
        assertEquals("1.0.0", reopened.manifest.version)
        assertEquals(1, reopened.blocks.size)
        assertEquals(1, reopened.blocks[0].batch.size)
    }

    @Test
    fun testPreservesTemporalContinuityManifestMetadata() {
        val signer = createTestSigner()
        val identity = LukuDeviceIdentity("LUK-META", signer.publicKeyBase64, "LUKUID")
        val canonical = "manifest-extra-scan"

        val block = LukuArchive.buildBlockFromRecords(
            blockId = 0,
            timestampUtc = 1000,
            previousBlockHash = null,
            defaultDevice = identity,
            batch = listOf(
                JSONObject()
                    .put("type", "scan").put("vendor", "LUKUID")
                    .put("signature", signCanonical(signer.privateKey, canonical))
                    .put("previous_signature", "genesis_fake")
                    .put("canonical_string", canonical)
                    .put(
                        "payload",
                        JSONObject()
                            .put("ctr", 1)
                            .put("timestamp_utc", 1000)
                            .put("genesis_hash", "genesis_fake")
                    )
            ),
            commonCerts = null
        )

        val exported = LukuArchive.exportBlocksWithManifest(
            blocks = listOf(block),
            attachments = emptyMap(),
            description = "Manifest extra parity",
            manifestExtra = linkedMapOf(
                "native_continuity_gap_seconds" to 600,
                "lukuid_block_reasons" to org.json.JSONArray().put(
                    JSONObject()
                        .put("block_id", 0)
                        .put("code", "archive_start")
                        .put("label", "Block start")
                        .put("detail_code", JSONObject.NULL)
                        .put("detail_label", JSONObject.NULL)
                )
            ),
            signer = LukuSigner(signer.privateKey, signer.publicKeyBase64)
        )

        val reopened = LukuArchive.open(exported.saveToBytes())
        assertEquals(600L, reopened.manifest.nativeContinuityGapSeconds)
        val reasons = reopened.manifest.extra["lukuid_block_reasons"] as? org.json.JSONArray
        assertEquals(1, reasons?.length())
        val reason = reasons?.getJSONObject(0)
        assertEquals("archive_start", reason?.optString("code"))
        assertEquals("Block start", reason?.optString("label"))
    }

    @Test
    fun buildsBlockFallbackCertFields() {
        val block = LukuArchive.buildBlockFromRecords(
            blockId = 0,
            timestampUtc = 1000,
            previousBlockHash = null,
            defaultDevice = LukuDeviceIdentity("LUK-TEST", Base64.getEncoder().encodeToString(ByteArray(32)), "LUKUID"),
            batch = listOf(
                JSONObject().put("type", "scan").put("vendor", "LUKUID").put("signature", "sig1").put("canonical_string", "can1").put(
                    "payload",
                    JSONObject().put("ctr", 1).put("timestamp_utc", 1000)
                )
            ),
            commonCerts = mapOf("dac_der" to "mock_dac_der", "attestation_root_fingerprint" to "mock_fingerprint")
        )
        assertEquals("mock_dac_der", block.attestationDacDer)
        assertEquals("mock_fingerprint", block.attestationRootFingerprint)
    }

    @Test
    fun verifiesAValidArchive() {
        val (archive, _) = createValidExport("LUK-VALID")
        assertTrue(archive.verify(testOptions()).none { it.criticality == Criticality.CRITICAL })
    }

    @Test
    fun testEnforcesRequestedNativeContinuityChecks() {
        val signer = createTestSigner()
        val archive = LukuArchive.exportWithIdentity(
            records = listOf(
                JSONObject().put("type", "environment").put("vendor", "LUKUID").put("signature", signCanonical(signer.privateKey, "env-1")).put("previous_signature", "genesis_fake").put("canonical_string", "env-1").put(
                    "payload",
                    JSONObject().put("ctr", 1).put("timestamp_utc", 1000).put("genesis_hash", "genesis_fake")
                ),
                JSONObject().put("type", "environment").put("vendor", "LUKUID").put("signature", signCanonical(signer.privateKey, "env-2")).put("previous_signature", signCanonical(signer.privateKey, "env-1")).put("canonical_string", "env-2").put(
                    "payload",
                    JSONObject().put("ctr", 2).put("timestamp_utc", 2000).put("genesis_hash", "genesis_fake")
                )
            ),
            device = LukuDeviceIdentity("LUK-CONT", signer.publicKeyBase64, "LUKUID"),
            attachments = emptyMap(),
            signer = LukuSigner(signer.privateKey, signer.publicKeyBase64),
            options = LukuExportOptions(policy = LukuPolicy(name = "environment", nativeContinuityGapSeconds = 600))
        )
        val issues = archive.verify(testOptions().copy(requireContinuity = true))
        assertTrue(hasIssue(issues, "CONTINUITY_GAP_EXCEEDED"))
    }

    @Test
    fun rejectsUntrustedExternalIdentityEndorsements() {
        val fixture = externalIdentityFixture()
        val signer = createTestSigner()
        val checksum = fixture.getString("checksum")
        val archive = LukuArchive.exportWithIdentity(
            records = listOf(
                JSONObject()
                    .put("type", "attachment").put("vendor", "LUKUID")
                    .put("id", "ATT-EXT-1")
                    .put("signature", signCanonical(signer.privateKey, "attachment-ext"))
                    .put("previous_signature", "")
                    .put("canonical_string", "attachment-ext")
                    .put("checksum", checksum)
                    .put(
                        "external_identity",
                        JSONObject()
                            .put("endorser_id", fixture.getString("endorser_id"))
                            .put("root_fingerprint", fixture.getString("root_fingerprint"))
                            .put("cert_chain_der", fixture.getJSONArray("cert_chain_der"))
                            .put("signature", fixture.getString("signature"))
                    )
            ),
            device = LukuDeviceIdentity("LUK-EXT", signer.publicKeyBase64, "LUKUID"),
            attachments = mapOf(checksum to fixture.getString("attachment_utf8").toByteArray(StandardCharsets.UTF_8)),
            signer = LukuSigner(signer.privateKey, signer.publicKeyBase64)
        )

        val trusted = archive.verify(testOptions().copy(
            trustedExternalFingerprints = listOf(fixture.getString("root_fingerprint"))
        ))
        assertFalse(hasIssue(trusted, "EXTERNAL_IDENTITY_VERIFICATION_FAILED"))

        val untrusted = archive.verify(testOptions())
        assertTrue(hasIssue(untrusted, "EXTERNAL_IDENTITY_VERIFICATION_FAILED"))
    }

    @Test
    fun detectsRecordDeletion() {
        val (archive, _) = createValidExport("LUK-DEL")
        archive.blocks[0].batch.removeAt(1)
        assertTrue(hasIssue(archive.verify(testOptions()), "RECORD_CHAIN_BROKEN"))
    }

    @Test
    fun detectsRecordInjection() {
        val (archive, _) = createValidExport("LUK-INJ")
        archive.blocks[0].batch.add(
            1,
            JSONObject().put("type", "scan").put("vendor", "LUKUID").put("signature", "fake_sig").put("previous_signature", "doesnt_matter").put(
                "payload",
                JSONObject().put("ctr", 2).put("timestamp_utc", 1002)
            )
        )
        assertTrue(hasIssue(archive.verify(testOptions()), "RECORD_CHAIN_BROKEN", "RECORD_SIGNATURE_INVALID"))
    }

    @Test
    fun detectsTimeRegression() {
        val (archive, _) = createValidExport("LUK-TIME")
        archive.blocks[0].batch[1].getJSONObject("payload").put("timestamp_utc", 999)
        assertTrue(hasIssue(archive.verify(testOptions()), "TIME_REGRESSION"))
    }

    @Test
    fun detectsCounterRegression() {
        val (archive, _) = createValidExport("LUK-CTR")
        archive.blocks[0].batch[1].getJSONObject("payload").put("ctr", 1)
        assertTrue(hasIssue(archive.verify(testOptions()), "COUNTER_REGRESSION"))
    }

    @Test
    fun detectsExportTampering() {
        val (archive, _) = createValidExport("LUK-EXP")
        archive.blocks[0].blockId = 999
        val reopened = LukuArchive.open(archive.saveToBytes())
        assertTrue(hasIssue(reopened.verify(testOptions()), "BLOCKS_HASH_MISMATCH"))
    }

    @Test
    fun detectsAttachmentCorruption() {
        val (archive, _) = createValidExport("LUK-ATT")
        val checksum = archive.addAttachment("valid_data".toByteArray(StandardCharsets.UTF_8))
        archive.blocks[0].batch += JSONObject().put("type", "attachment").put("vendor", "LUKUID").put("checksum", checksum).put("payload", JSONObject().put("ctr", 3))
        archive.attachments[checksum] = "tampered_data".toByteArray(StandardCharsets.UTF_8)
        assertTrue(hasIssue(archive.verify(testOptions()), "ATTACHMENT_CORRUPT"))
    }

    @Test
    fun keepsAttestedAttachmentsOutOfTheNativeChain() {
        val signer = createTestSigner()
        val deviceId = "LUK-ATTEST"
        val attachmentBytes = "desktop-added-attachment".toByteArray(StandardCharsets.UTF_8)
        val checksum = java.security.MessageDigest.getInstance("SHA-256").digest(attachmentBytes).joinToString("") { "%02x".format(it) }
        val pk = signer.publicKeyBase64
        val scan = animalScan("SCAN-ATTEST-1", deviceId, pk, 1, 1000, "genesis_fake")
        val scanSig = signInPlace(signer, scan, deviceId)
        val attachment = JSONObject().put("type", "attachment").put("vendor", "LUKUID").put("id", "ATT-ATTEST-1").put("parent_record_id", "SCAN-ATTEST-1").put("parent_id", "SCAN-ATTEST-1")
            .put("device_id", deviceId).put("public_key", pk).put("parent_signature", scanSig).put("timestamp_utc", 1001).put("checksum", checksum).put("mime", "text/plain").put("title", "Desktop Note")
        signInPlace(signer, attachment, deviceId)
        val environment = JSONObject().put("type", "environment").put("vendor", "LUKUID").put("id", "ENV-ATTEST-1").put("device_id", deviceId).put("public_key", pk)
            .put("previous_signature", scanSig).put("payload", JSONObject().put("ctr", 2).put("timestamp_utc", 1002))
        signInPlace(signer, environment, deviceId)

        val block = LukuArchive.buildBlockFromRecords(
            blockId = 0,
            timestampUtc = 1003,
            previousBlockHash = null,
            defaultDevice = LukuDeviceIdentity(deviceId, pk, "LUKUID"),
            batch = listOf(scan, attachment, environment),
            commonCerts = null
        )

        val exported = LukuArchive.exportBlocksWithManifest(
            blocks = listOf(block),
            attachments = mapOf(checksum to attachmentBytes),
            description = "Attested attachment export",
            manifestExtra = linkedMapOf(),
            signer = LukuSigner(signer.privateKey, signer.publicKeyBase64)
        )
        val reopened = LukuArchive.open(exported.saveToBytes())
        val issues = reopened.verify(testOptions())
        assertTrue(issues.none { it.criticality == Criticality.CRITICAL })
        assertFalse(hasIssue(issues, "RECORD_CHAIN_BROKEN"))
    }

    @Test
    fun keepsAttestedCustodyRecordsOutOfTheNativeChain() {
        val signer = createTestSigner()
        val deviceId = "LUK-CUSTODY"
        val pk = signer.publicKeyBase64
        val scan = animalScan("SCAN-CUSTODY-1", deviceId, pk, 1, 1000, "genesis_fake")
        val scanSig = signInPlace(signer, scan, deviceId)
        val custody = JSONObject().put("type", "custody").put("vendor", "LUKUID").put("id", "CUSTODY-1").put("parent_record_id", "SCAN-CUSTODY-1").put("parent_id", "SCAN-CUSTODY-1")
            .put("device_id", deviceId).put("public_key", pk).put("parent_signature", scanSig).put("timestamp_utc", 1001)
            .put("payload", JSONObject().put("event", "handoff").put("status", "received").put("context_ref", "shipment-123"))
        signInPlace(signer, custody, deviceId)
        val environment = JSONObject().put("type", "environment").put("vendor", "LUKUID").put("id", "ENV-CUSTODY-1").put("device_id", deviceId).put("public_key", pk)
            .put("previous_signature", scanSig).put("payload", JSONObject().put("ctr", 2).put("timestamp_utc", 1002))
        signInPlace(signer, environment, deviceId)

        val block = LukuArchive.buildBlockFromRecords(
            blockId = 0,
            timestampUtc = 1003,
            previousBlockHash = null,
            defaultDevice = LukuDeviceIdentity(deviceId, pk, "LUKUID"),
            batch = listOf(scan, custody, environment),
            commonCerts = null
        )

        val exported = LukuArchive.exportBlocksWithManifest(
            blocks = listOf(block),
            attachments = emptyMap(),
            description = "Attested custody export",
            manifestExtra = linkedMapOf(),
            signer = LukuSigner(signer.privateKey, signer.publicKeyBase64)
        )
        val reopened = LukuArchive.open(exported.saveToBytes())
        val issues = reopened.verify(testOptions())
        assertTrue(issues.none { it.criticality == Criticality.CRITICAL })
        assertFalse(hasIssue(issues, "RECORD_CHAIN_BROKEN"))
    }

    @Test
    fun failsStrictAttestationWhenTheChainIsFake() {
        val (archive, _) = createValidExport("LUK-STRICT")
        archive.blocks[0].attestationDacDer = Base64.getEncoder().encodeToString("fake_der_data".toByteArray(StandardCharsets.UTF_8))
        val issues = archive.verify(
            LukuVerifyOptions(
                allowUntrustedRoots = false,
                skipCertificateTemporalChecks = true,
                trustProfile = "dev"
            )
        )
        assertTrue(hasIssue(issues, "ATTESTATION_FAILED", "ATTESTATION_CHAIN_MISSING"))
    }

    @Test
    fun rejectsStructurallyInvalidArchives() {
        try {
            LukuArchive.open("just random garbage bytes".toByteArray(StandardCharsets.UTF_8))
            fail("Expected invalid zip to fail")
        } catch (_: Throwable) {
        }

        val wrongMime = ByteArrayOutputStream()
        ZipOutputStream(wrongMime).use { zip ->
            zip.putNextEntry(ZipEntry("mimetype").apply {
                method = ZipEntry.STORED
                size = "application/pdf".toByteArray().size.toLong()
                compressedSize = size
                crc = crc32("application/pdf".toByteArray())
            })
            zip.write("application/pdf".toByteArray(StandardCharsets.UTF_8))
            zip.closeEntry()
        }
        try {
            LukuArchive.open(wrongMime.toByteArray())
            fail("Expected invalid mimetype to fail")
        } catch (error: Throwable) {
            assertTrue(error.message?.contains("Invalid mimetype") == true)
        }

        val missingManifest = ByteArrayOutputStream()
        ZipOutputStream(missingManifest).use { zip ->
            zip.putNextEntry(ZipEntry("mimetype").apply {
                method = ZipEntry.STORED
                size = LUKU_MIMETYPE.toByteArray().size.toLong()
                compressedSize = size
                crc = crc32(LUKU_MIMETYPE.toByteArray())
            })
            zip.write(LUKU_MIMETYPE.toByteArray(StandardCharsets.UTF_8))
            zip.closeEntry()
        }
        try {
            LukuArchive.open(missingManifest.toByteArray())
            fail("Expected missing manifest to fail")
        } catch (error: Throwable) {
            assertTrue(error.message?.contains("manifest.json missing") == true)
        }
    }

    @Test
    fun mutatesRealSampleArchivesInMemory() {
        val sampleBytes = currentSampleFile("first-passable-verification-sample.luku").readBytes()
        val original = LukuArchive.open(sampleBytes)
        assertTrue(original.verify(currentSampleOptions()).none { it.criticality == Criticality.CRITICAL })

        val invalidSignature = LukuArchive.open(sampleBytes)
        invalidSignature.blocks[0].batch[0].put("signature", "not_base64_data!!!")
        assertTrue(hasIssue(invalidSignature.verify(currentSampleOptions()), "RECORD_SIGNATURE_INVALID", "ATTESTATION_FAILED"))

        val mutatedCanonical = LukuArchive.open(sampleBytes)
        mutatedCanonical.blocks[0].batch[0].put("canonical_string", mutatedCanonical.blocks[0].batch[0].optString("canonical_string") + "X")
        assertTrue(hasIssue(mutatedCanonical.verify(currentSampleOptions()), "RECORD_SIGNATURE_INVALID"))

        if (original.blocks[0].batch.size > 1) {
            val brokenChain = LukuArchive.open(sampleBytes)
            brokenChain.blocks[0].batch[1].put("previous_signature", "broken_link")
            assertTrue(hasIssue(brokenChain.verify(currentSampleOptions()), "RECORD_CHAIN_BROKEN"))
        }

        if (original.blocks.size > 1) {
            val floatingAnchor = LukuArchive.open(sampleBytes)
            floatingAnchor.blocks[1].batch[0].put("previous_signature", "floating_anchor_test")
            assertFalse(hasIssue(floatingAnchor.verify(currentSampleOptions()), "RECORD_CHAIN_BROKEN"))
        }

        if (original.blocks[0].batch.size > 1) {
            val regressedCounter = LukuArchive.open(sampleBytes)
            regressedCounter.blocks[0].batch[1].getJSONObject("payload").put("ctr", 0)
            assertTrue(hasIssue(regressedCounter.verify(currentSampleOptions()), "COUNTER_REGRESSION"))
        }
    }

    @Test
    fun verifiesTheShippedSampleDirectory() {
        val passable = LukuArchive.open(currentSampleFile("first-passable-verification-sample.luku"))
        assertTrue(passable.verify(currentSampleOptions()).none { it.criticality == Criticality.CRITICAL })

        val mismatch = LukuArchive.open(currentSampleFile("signature-mismatch.luku"))
        val mismatchIssues = mismatch.verify(
            currentSampleOptions(allowUntrustedRoots = false)
        )
        assertTrue(hasIssue(mismatchIssues, "ATTESTATION_FAILED", "RECORD_SIGNATURE_INVALID", "ATTESTATION_CHAIN_MISSING"))

        val invalidChain = LukuArchive.open(currentSampleFile("invalid-chain.luku"))
        assertTrue(hasIssue(invalidChain.verify(currentSampleOptions()), "RECORD_CHAIN_BROKEN", "BLOCK_HASH_INVALID", "ATTESTATION_FAILED"))

        // A test-PKI sample passes its own profile and is rejected by dev and prod.
        val testIssues = passable.verify(currentSampleOptions(allowUntrustedRoots = false, trustProfile = "test"))
        assertFalse(testIssues.any { it.code == "ATTESTATION_FAILED" && it.message.contains("trust profile") })

        val devIssues = passable.verify(currentSampleOptions(allowUntrustedRoots = false, trustProfile = "dev"))
        assertTrue(devIssues.any { it.code == "ATTESTATION_FAILED" && it.message.contains("trust profile") })

        val prodIssues = passable.verify(
            LukuVerifyOptions(
                allowUntrustedRoots = false,
                skipCertificateTemporalChecks = true,
                trustProfile = "prod"
            )
        )
        assertTrue(prodIssues.any { it.code == "ATTESTATION_FAILED" && it.message.contains("trust profile") })
    }

    private fun crc32(bytes: ByteArray): Long {
        val crc = CRC32()
        crc.update(bytes)
        return crc.value
    }
    @Test
    fun testSelfTest() {
        val results = LukuSdk.selfTest()
        assertTrue(results.size >= 4)
        for (result in results) {
            println("${result.alg} ${result.operation}\t${if (result.passed) "PASS" else "FAIL"}\t${result.id}")
            assertTrue("Self-test failed for ${result.alg} ${result.operation}", result.passed)
        }
    }
}
