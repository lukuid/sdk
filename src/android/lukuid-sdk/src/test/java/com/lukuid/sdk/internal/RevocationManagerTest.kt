// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk.internal

import android.content.Context
import com.lukuid.sdk.LukuSdkOptions
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import org.bouncycastle.asn1.x509.SubjectPublicKeyInfo
import org.bouncycastle.jce.provider.BouncyCastleProvider
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import java.security.KeyPairGenerator
import java.security.Security
import java.security.cert.X509Certificate
import java.security.MessageDigest

class RevocationManagerTest {
    private lateinit var context: Context
    private lateinit var options: LukuSdkOptions
    private lateinit var scope: CoroutineScope
    private lateinit var manager: RevocationManager

    @Before
    fun setup() {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(BouncyCastleProvider())
        }
        context = mockk(relaxed = true)
        every { context.filesDir } returns java.io.File("/tmp")
        options = LukuSdkOptions(crlMemoryOnly = true)
        scope = CoroutineScope(Dispatchers.Unconfined)
        manager = RevocationManager(context, options, scope)
    }

    private fun generateCert(publicKey: java.security.PublicKey): X509Certificate {
        val cert = mockk<X509Certificate>()
        every { cert.publicKey } returns publicKey
        return cert
    }

    private fun getFingerprint(publicKey: java.security.PublicKey): String {
        val spki = SubjectPublicKeyInfo.getInstance(publicKey.encoded)
        val raw = spki.publicKeyData.bytes
        val digest = MessageDigest.getInstance("SHA-256").digest(raw)
        return digest.joinToString("") { "%02x".format(it) }.lowercase()
    }

    @Test
    fun `isRevoked returns true for revoked certificate`() {
        val kpg = KeyPairGenerator.getInstance("Ed25519", "BC")
        val pair = kpg.generateKeyPair()
        val cert = generateCert(pair.public)
        val fingerprint = getFingerprint(pair.public)

        assertFalse(manager.isRevoked(cert))
        
        manager.addRevocation(fingerprint)
        assertTrue(manager.isRevoked(cert))
    }

    @Test
    fun `isRevoked returns true for P-256 revoked certificate`() {
        val kpg = KeyPairGenerator.getInstance("EC", "BC")
        kpg.initialize(java.security.spec.ECGenParameterSpec("secp256r1"))
        val pair = kpg.generateKeyPair()
        val cert = generateCert(pair.public)
        val fingerprint = getFingerprint(pair.public)

        assertFalse(manager.isRevoked(cert))
        
        manager.addRevocation(fingerprint)
        assertTrue(manager.isRevoked(cert))
    }
}
