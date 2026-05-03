// SPDX-License-Identifier: Apache-2.0
import Foundation
#if canImport(CryptoKit)
import CryptoKit
#endif

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

#if canImport(CryptoKit)
@available(iOS 26.0, macOS 26.0, *)
class CryptoKitMLDSAVerifier: MLDSAVerifier {
    func verify(signature: Data, message: Data, publicKey: Data) -> Bool {
        guard signature.count == mldsa65Bytes, publicKey.count >= mldsa65PublicKeyBytes else {
            return false
        }
        
        let pubKeyRaw = publicKey.suffix(mldsa65PublicKeyBytes)
        
        do {
            let mldsaPublicKey = try MLDSA65.PublicKey(rawRepresentation: pubKeyRaw)
            return mldsaPublicKey.isValidSignature(signature, for: message)
        } catch {
            return false
        }
    }
}
#endif
