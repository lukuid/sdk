// SPDX-License-Identifier: Apache-2.0
import XCTest
@testable import LukuIDSDK

final class MLDSAVerifierTests: XCTestCase {

    func testNativeCImplementation() {
        // Generate keys and signature using the C implementation
        var pk = [UInt8](repeating: 0, count: mldsa65PublicKeyBytes)
        var sk = [UInt8](repeating: 0, count: mldsa65SecretKeyBytes)
        var seed = [UInt8](repeating: 0, count: mldsaSeedBytes)
        seed[0] = 1 // Fixed seed for reproducible keys in test
        
        let keyGenResult = mldsa65KeypairInternal(publicKey: &pk, secretKey: &sk, seed: &seed)
        XCTAssertEqual(keyGenResult, 0, "Key generation should succeed")
        
        let msg = [UInt8]("test message".utf8)
        let badMsg = [UInt8]("bad message".utf8)
        var sig = [UInt8](repeating: 0, count: mldsa65Bytes)
        var sigLen: Int = 0
        
        let signResult = mldsa65Signature(signature: &sig, signatureLength: &sigLen, message: msg, secretKey: &sk)
        XCTAssertEqual(signResult, 0, "Signing should succeed")
        
        let verifier = MLDSANativeVerifier()
        
        let isValid = verifier.verify(signature: Data(sig), message: Data(msg), publicKey: Data(pk))
        XCTAssertTrue(isValid, "Native C Verifier should validate correct signature")
        
        let isInvalid = verifier.verify(signature: Data(sig), message: Data(badMsg), publicKey: Data(pk))
        XCTAssertFalse(isInvalid, "Native C Verifier should reject incorrect signature")
    }

    func testCryptoKitImplementationIfAvailable() {
#if canImport(CryptoKit)
        if #available(iOS 26.0, macOS 26.0, *) {
            // Generate keys and signature using the C implementation
            var pk = [UInt8](repeating: 0, count: mldsa65PublicKeyBytes)
            var sk = [UInt8](repeating: 0, count: mldsa65SecretKeyBytes)
            var seed = [UInt8](repeating: 0, count: mldsaSeedBytes)
            seed[0] = 2 // Different fixed seed
            
            let keyGenResult = mldsa65KeypairInternal(publicKey: &pk, secretKey: &sk, seed: &seed)
            XCTAssertEqual(keyGenResult, 0, "Key generation should succeed")
            
            let msg = [UInt8]("test message native".utf8)
            let badMsg = [UInt8]("bad message native".utf8)
            var sig = [UInt8](repeating: 0, count: mldsa65Bytes)
            var sigLen: Int = 0
            
            let signResult = mldsa65Signature(signature: &sig, signatureLength: &sigLen, message: msg, secretKey: &sk)
            XCTAssertEqual(signResult, 0, "Signing should succeed")
            
            let verifier = CryptoKitMLDSAVerifier()
            
            let isValid = verifier.verify(signature: Data(sig), message: Data(msg), publicKey: Data(pk))
            XCTAssertTrue(isValid, "CryptoKit Verifier should validate correct signature from C implementation")
            
            let isInvalid = verifier.verify(signature: Data(sig), message: Data(badMsg), publicKey: Data(pk))
            XCTAssertFalse(isInvalid, "CryptoKit Verifier should reject incorrect signature")
        } else {
            print("Skipping CryptoKit test as the OS version is too low.")
        }
#else
        print("Skipping CryptoKit test as CryptoKit cannot be imported.")
#endif
    }
}
