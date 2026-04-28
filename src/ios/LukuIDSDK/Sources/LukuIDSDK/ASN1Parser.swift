// SPDX-License-Identifier: Apache-2.0
import Foundation

enum ASN1Error: Error {
    case invalidDER
    case unexpectedTag
    case outOfBounds
}

struct ASN1Element {
    let tag: UInt8
    let length: Int
    let headerLength: Int
    let data: Data
    
    var totalLength: Int {
        return headerLength + length
    }
}

class ASN1Parser {
    static func parseElement(_ data: Data, at offset: Int) throws -> ASN1Element {
        guard offset < data.count else { throw ASN1Error.outOfBounds }
        
        let tag = data[offset]
        var current = offset + 1
        
        guard current < data.count else { throw ASN1Error.outOfBounds }
        
        let lengthByte = data[current]
        current += 1
        
        var length: Int = 0
        if lengthByte & 0x80 == 0 {
            length = Int(lengthByte)
        } else {
            let numBytes = Int(lengthByte & 0x7F)
            guard current + numBytes <= data.count else { throw ASN1Error.outOfBounds }
            for _ in 0..<numBytes {
                length = (length << 8) | Int(data[current])
                current += 1
            }
        }
        
        guard current + length <= data.count else { throw ASN1Error.outOfBounds }
        
        return ASN1Element(
            tag: tag,
            length: length,
            headerLength: current - offset,
            data: data.subdata(in: current..<(current + length))
        )
    }
    
    static func extractCertificateFields(_ certData: Data) throws -> (tbs: Data, algorithm: Data, signature: Data) {
        // Certificate is a SEQUENCE
        let root = try parseElement(certData, at: 0)
        guard root.tag == 0x30 else { throw ASN1Error.unexpectedTag }
        
        var offset = 0
        let tbs = try parseElement(root.data, at: offset)
        offset += tbs.totalLength
        
        let algorithm = try parseElement(root.data, at: offset)
        offset += algorithm.totalLength
        
        let sigBitString = try parseElement(root.data, at: offset)
        // BIT STRING starts with 1 byte for unused bits
        guard sigBitString.tag == 0x03 else { throw ASN1Error.unexpectedTag }
        let signature = sigBitString.data.dropFirst()
        
        // TBS is the whole DER element including tag and length
        let tbsFull = certData.subdata(in: root.headerLength..<(root.headerLength + tbs.totalLength))
        
        return (tbs: tbsFull, algorithm: algorithm.data, signature: signature)
    }
    
    static func extractPublicKey(_ certData: Data) throws -> Data {
        let root = try parseElement(certData, at: 0)
        let tbs = try parseElement(root.data, at: 0)
        
        // TBSCertificate SEQUENCE {
        //   version [0] EXPLICIT Version DEFAULT v1,
        //   serialNumber CertificateSerialNumber,
        //   signature AlgorithmIdentifier,
        //   issuer Name,
        //   validity Validity,
        //   subject Name,
        //   subjectPublicKeyInfo SubjectPublicKeyInfo,
        //   ...
        // }
        
        var offset = 0
        let version = try parseElement(tbs.data, at: offset)
        if version.tag == 0xA0 { // version is optional but usually present as [0]
            offset += version.totalLength
        }
        
        let serial = try parseElement(tbs.data, at: offset)
        offset += serial.totalLength
        
        let sigAlg = try parseElement(tbs.data, at: offset)
        offset += sigAlg.totalLength
        
        let issuer = try parseElement(tbs.data, at: offset)
        offset += issuer.totalLength
        
        let validity = try parseElement(tbs.data, at: offset)
        offset += validity.totalLength
        
        let subject = try parseElement(tbs.data, at: offset)
        offset += subject.totalLength
        
        let spki = try parseElement(tbs.data, at: offset)
        
        // SubjectPublicKeyInfo SEQUENCE {
        //   algorithm AlgorithmIdentifier,
        //   subjectPublicKey BIT STRING
        // }
        let spkiOffset = 0
        let alg = try parseElement(spki.data, at: spkiOffset)
        let pubKeyBitString = try parseElement(spki.data, at: spkiOffset + alg.totalLength)
        
        guard pubKeyBitString.tag == 0x03 else { throw ASN1Error.unexpectedTag }
        return pubKeyBitString.data.dropFirst()
    }
}
