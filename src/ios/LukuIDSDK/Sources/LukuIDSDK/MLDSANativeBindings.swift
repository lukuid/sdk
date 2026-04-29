// SPDX-License-Identifier: Apache-2.0
import Foundation

let mldsaSeedBytes = 32
let mldsa65Bytes = 3309
let mldsa65PublicKeyBytes = 1952
let mldsa65SecretKeyBytes = 4032

@_silgen_name("PQCP_MLDSA_NATIVE_MLDSA65_keypair_internal")
private func pqcpMLDSA65KeypairInternal(
    _ publicKey: UnsafeMutablePointer<UInt8>?,
    _ secretKey: UnsafeMutablePointer<UInt8>?,
    _ seed: UnsafePointer<UInt8>?
) -> Int32

@_silgen_name("PQCP_MLDSA_NATIVE_MLDSA65_signature")
private func pqcpMLDSA65Signature(
    _ signature: UnsafeMutablePointer<UInt8>?,
    _ signatureLength: UnsafeMutablePointer<Int>?,
    _ message: UnsafePointer<UInt8>?,
    _ messageLength: Int,
    _ context: UnsafePointer<UInt8>?,
    _ contextLength: Int,
    _ secretKey: UnsafePointer<UInt8>?
) -> Int32

@_silgen_name("PQCP_MLDSA_NATIVE_MLDSA65_verify")
private func pqcpMLDSA65Verify(
    _ signature: UnsafePointer<UInt8>?,
    _ signatureLength: Int,
    _ message: UnsafePointer<UInt8>?,
    _ messageLength: Int,
    _ context: UnsafePointer<UInt8>?,
    _ contextLength: Int,
    _ publicKey: UnsafePointer<UInt8>?
) -> Int32

func mldsa65KeypairInternal(publicKey: inout [UInt8], secretKey: inout [UInt8], seed: inout [UInt8]) -> Int32 {
    pqcpMLDSA65KeypairInternal(&publicKey, &secretKey, &seed)
}

func mldsa65Signature(signature: inout [UInt8], signatureLength: inout Int, message: [UInt8], secretKey: inout [UInt8]) -> Int32 {
    message.withUnsafeBufferPointer { messagePtr in
        pqcpMLDSA65Signature(
            &signature,
            &signatureLength,
            messagePtr.baseAddress,
            message.count,
            nil,
            0,
            &secretKey
        )
    }
}

func mldsa65Verify(signature: [UInt8], message: [UInt8], publicKey: [UInt8]) -> Int32 {
    signature.withUnsafeBufferPointer { signaturePtr in
        message.withUnsafeBufferPointer { messagePtr in
            publicKey.withUnsafeBufferPointer { publicKeyPtr in
                pqcpMLDSA65Verify(
                    signaturePtr.baseAddress,
                    signature.count,
                    messagePtr.baseAddress,
                    message.count,
                    nil,
                    0,
                    publicKeyPtr.baseAddress
                )
            }
        }
    }
}
