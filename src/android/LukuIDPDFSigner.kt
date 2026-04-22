// SPDX-License-Identifier: Apache-2.0
package com.lukuid.sdk

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import java.security.KeyStore
import java.security.Signature
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class LukuIDPDFSigner(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "LukuIDPDFSigner"
    }

    @ReactMethod
    fun signHash(hashHex: String, promise: Promise) {
        try {
            val keystore = KeyStore.getInstance("AndroidKeyStore")
            keystore.load(null)

            val alias = "com.lukuid.signingKey"
            
            //Check if key exists, if not generate (omitted for brevity)
            if (!keystore.containsAlias(alias)) {
                 promise.reject("key_not_found", "Signing key not found in AndroidKeyStore")
                 return
            }

            val entry = keystore.getEntry(alias, null) as? KeyStore.PrivateKeyEntry
            if (entry == null) {
                promise.reject("key_error", "Key entry is invalid")
                return
            }

            val signature = Signature.getInstance("SHA256withECDSA")
            signature.initSign(entry.privateKey)
            
            val dataToSign = hexStringToByteArray(hashHex)
            signature.update(dataToSign)
            
            val signatureBytes = signature.sign()
            promise.resolve(bytesToHex(signatureBytes))

        } catch (e: Exception) {
            promise.reject("signing_failed", e)
        }
    }

    private fun hexStringToByteArray(s: String): ByteArray {
        val len = s.length
        val data = ByteArray(len / 2)
        var i = 0
        while (i < len) {
            data[i / 2] = ((Character.digit(s[i], 16) shl 4) + Character.digit(s[i + 1], 16)).toByte()
            i += 2
        }
        return data
    }

    private fun bytesToHex(bytes: ByteArray): String {
        val hexArray = "0123456789ABCDEF".toCharArray()
        val hexChars = CharArray(bytes.size * 2)
        for (j in bytes.indices) {
            val v = bytes[j].toInt() and 0xFF
            hexChars[j * 2] = hexArray[v ushr 4]
            hexChars[j * 2 + 1] = hexArray[v and 0x0F]
        }
        return String(hexChars)
    }
}
