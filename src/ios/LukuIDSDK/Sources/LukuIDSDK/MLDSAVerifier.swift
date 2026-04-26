// SPDX-License-Identifier: Apache-2.0
import Foundation
import MLDSANative

protocol MLDSAVerifier {
    func verify(signature: Data, message: Data, publicKey: Data) -> Bool
}

class MLDSANativeVerifier: MLDSAVerifier {
    func verify(signature: Data, message: Data, publicKey: Data) -> Bool {
        // ML-DSA-65 signatures are 3309 bytes.
        // ML-DSA-65 public keys are 1952 bytes.
        guard signature.count == 3309, publicKey.count >= 1952 else {
            return false
        }
        
        // If the public key is in SPKI format, we might need to skip the header.
        // Standard ML-DSA-65 raw public key is 1952 bytes.
        let pubKeyRaw = publicKey.suffix(1952)
        
        var sigBytes = [UInt8](signature)
        var msgBytes = [UInt8](message)
        var pubBytes = [UInt8](pubKeyRaw)
        
        let result = sigBytes.withUnsafeBufferPointer { sigPtr in
            msgBytes.withUnsafeBufferPointer { msgPtr in
                pubBytes.withUnsafeBufferPointer { pubPtr in
                    PQCP_MLDSA_NATIVE_MLDSA65_verify(
                        sigPtr.baseAddress, signature.count,
                        msgPtr.baseAddress, message.count,
                        nil, 0, // context
                        pubPtr.baseAddress
                    )
                }
            }
        }
        
        return result == 0
    }
}
