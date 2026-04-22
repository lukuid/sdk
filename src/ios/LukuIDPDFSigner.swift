// SPDX-License-Identifier: Apache-2.0
import Foundation
import LocalAuthentication
import Security

@objc(LukuIDPDFSigner)
public class LukuIDPDFSigner: NSObject {

    enum SignatureError: Error {
        case keyNotFound
        case authenticationFailed
        case signingFailed
    }

    @objc
    public func signHash(_ hash: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard let dataToSign = Data(hexString: hash) else {
            reject("invalid_hash", "Hash must be a valid hex string", nil)
            return
        }

        // 1. Access Secure Enclave Key
        let tag = "com.lukuid.signingKey".data(using: .utf8)!
        let query: [String: Any] = [
            kSecClass as String: kSecClassKey,
            kSecAttrApplicationTag as String: tag,
            kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
            kSecReturnRef as String: true
        ]

        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        
        guard status == errSecSuccess else {
            // Key generation logic would go here if not found
            reject("key_not_found", "Signing key not found in Secure Enclave", nil)
            return
        }
        
        let privateKey = item as! SecKey

        // 2. Sign
        var error: Unmanaged<CFError>?
        guard let signature = SecKeyCreateSignature(privateKey, .ecdsaSignatureMessageX962SHA256, dataToSign as CFData, &error) as Data? else {
            reject("signing_failed", "Failed to sign data: \(error!.takeRetainedValue() as Error)", nil)
            return
        }

        resolve(signature.hexString)
    }
}

extension Data {
    init?(hexString: String) {
        let len = hexString.count / 2
        var data = Data(capacity: len)
        var i = hexString.startIndex
        for _ in 0..<len {
            let j = hexString.index(i, offsetBy: 2)
            let bytes = hexString[i..<j]
            if let num = UInt8(bytes, radix: 16) {
                data.append(num)
            } else {
                return nil
            }
            i = j
        }
        self = data
    }
    
    var hexString: String {
        return map { String(format: "%02x", $0) }.joined()
    }
}
