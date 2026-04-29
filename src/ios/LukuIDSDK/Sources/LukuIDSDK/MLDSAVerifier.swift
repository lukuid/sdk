// SPDX-License-Identifier: Apache-2.0
import Foundation

protocol MLDSAVerifier {
    func verify(signature: Data, message: Data, publicKey: Data) -> Bool
}

class MLDSANativeVerifier: MLDSAVerifier {
    func verify(signature: Data, message: Data, publicKey: Data) -> Bool {
        // ML-DSA-65 signatures are 3309 bytes.
        // ML-DSA-65 public keys are 1952 bytes.
        guard signature.count == mldsa65Bytes, publicKey.count >= mldsa65PublicKeyBytes else {
            return false
        }
        
        // If the public key is in SPKI format, we might need to skip the header.
        // Standard ML-DSA-65 raw public key is 1952 bytes.
        let pubKeyRaw = publicKey.suffix(mldsa65PublicKeyBytes)
        
        let result = mldsa65Verify(
            signature: [UInt8](signature),
            message: [UInt8](message),
            publicKey: [UInt8](pubKeyRaw)
        )
        return result == 0
    }
}
