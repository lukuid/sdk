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

    static func extractSubjectValues(_ certData: Data) throws -> [String] {
        let tbs = try extractTBSCertificate(certData)
        let subject = try extractSubjectElement(tbs.data)
        return try extractNameValues(subject.data)
    }

    static func extractValidityRange(_ certData: Data) throws -> (validFrom: Int64, validTo: Int64) {
        let tbs = try extractTBSCertificate(certData)
        let validity = try extractValidityElement(tbs.data)
        var offset = 0
        let notBefore = try parseElement(validity.data, at: offset)
        offset += notBefore.totalLength
        let notAfter = try parseElement(validity.data, at: offset)
        return (
            validFrom: try parseTime(notBefore),
            validTo: try parseTime(notAfter)
        )
    }

    private static func extractTBSCertificate(_ certData: Data) throws -> ASN1Element {
        let root = try parseElement(certData, at: 0)
        return try parseElement(root.data, at: 0)
    }

    private static func extractValidityElement(_ tbsData: Data) throws -> ASN1Element {
        var offset = 0
        let version = try parseElement(tbsData, at: offset)
        if version.tag == 0xA0 {
            offset += version.totalLength
        }

        let serial = try parseElement(tbsData, at: offset)
        offset += serial.totalLength

        let signature = try parseElement(tbsData, at: offset)
        offset += signature.totalLength

        let issuer = try parseElement(tbsData, at: offset)
        offset += issuer.totalLength

        return try parseElement(tbsData, at: offset)
    }

    private static func extractSubjectElement(_ tbsData: Data) throws -> ASN1Element {
        var offset = 0
        let version = try parseElement(tbsData, at: offset)
        if version.tag == 0xA0 {
            offset += version.totalLength
        }

        let serial = try parseElement(tbsData, at: offset)
        offset += serial.totalLength

        let signature = try parseElement(tbsData, at: offset)
        offset += signature.totalLength

        let issuer = try parseElement(tbsData, at: offset)
        offset += issuer.totalLength

        let validity = try parseElement(tbsData, at: offset)
        offset += validity.totalLength

        return try parseElement(tbsData, at: offset)
    }

    private static func extractNameValues(_ data: Data) throws -> [String] {
        var offset = 0
        var values: [String] = []

        while offset < data.count {
            let set = try parseElement(data, at: offset)
            offset += set.totalLength
            guard set.tag == 0x31 else { continue }

            var setOffset = 0
            while setOffset < set.data.count {
                let sequence = try parseElement(set.data, at: setOffset)
                setOffset += sequence.totalLength
                guard sequence.tag == 0x30 else { continue }

                let oid = try parseElement(sequence.data, at: 0)
                let valueOffset = oid.totalLength
                guard valueOffset < sequence.data.count else { continue }
                let value = try parseElement(sequence.data, at: valueOffset)
                if let stringValue = parseASN1String(value) {
                    values.append(stringValue)
                }
            }
        }

        return values
    }

    private static func parseASN1String(_ element: ASN1Element) -> String? {
        switch element.tag {
        case 0x0C, 0x13, 0x14, 0x16, 0x1E:
            return String(data: element.data, encoding: .utf8)
        default:
            return nil
        }
    }

    private static func parseTime(_ element: ASN1Element) throws -> Int64 {
        guard let raw = String(data: element.data, encoding: .ascii) else {
            throw ASN1Error.invalidDER
        }

        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(secondsFromGMT: 0)

        switch element.tag {
        case 0x17:
            formatter.dateFormat = "yyMMddHHmmss'Z'"
        case 0x18:
            formatter.dateFormat = "yyyyMMddHHmmss'Z'"
        default:
            throw ASN1Error.unexpectedTag
        }

        guard let date = formatter.date(from: raw) else {
            throw ASN1Error.invalidDER
        }
        return Int64(date.timeIntervalSince1970)
    }
}
