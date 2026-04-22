// SPDX-License-Identifier: Apache-2.0
import Foundation
import CryptoKit
import Security

struct DeviceAttestationInputs {
    let id: String
    let key: String
    let attestationSig: String
    let certificateChain: String?
    let created: Int64?
    let attestationAlg: String?
    let attestationPayloadVersion: Int64?
    let trustProfile: String

    init(id: String,
         key: String,
         attestationSig: String,
         certificateChain: String?,
         created: Int64?,
         attestationAlg: String?,
         attestationPayloadVersion: Int64?,
         trustProfile: String = ProcessInfo.processInfo.environment["LUKUID_TRUST_PROFILE"] ?? "prod") {
        self.id = id
        self.key = key
        self.attestationSig = attestationSig
        self.certificateChain = certificateChain
        self.created = created
        self.attestationAlg = attestationAlg
        self.attestationPayloadVersion = attestationPayloadVersion
        self.trustProfile = trustProfile
    }
}

// Trusted Root Certificates (PEM)
private let TRUSTED_ROOT_CERTS_PEM = [
    """
    -----BEGIN CERTIFICATE-----
    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
    DxQWGRk=
    -----END CERTIFICATE-----
    """
]

func verifyDeviceAttestation(_ inputs: DeviceAttestationInputs) -> Result<Void, DeviceTrustError> {
    if inputs.attestationSig.isEmpty {
        return .failure(DeviceTrustError(id: inputs.id, reason: "attestationSig missing", attemptedKeyIds: []))
    }

    guard let signatureData = Data(base64Encoded: inputs.attestationSig) else {
        return .failure(DeviceTrustError(id: inputs.id, reason: "attestationSig is not valid base64", attemptedKeyIds: []))
    }
    
    // 1. Walk and Verify the Chain (if provided)
    var leafPublicKey: Data? = nil
    
    if let chainPEM = inputs.certificateChain {
        let certs = parsePEMChain(chainPEM)
        guard !certs.isEmpty else {
            return .failure(DeviceTrustError(id: inputs.id, reason: "Invalid certificate chain", attemptedKeyIds: []))
        }
        
        // Use the first cert as leaf
        leafPublicKey = extractPublicKey(from: certs[0])
        
        let requiredOU: String
        switch inputs.trustProfile {
        case "dev":
            requiredOU = "lukuid-dev"
        case "test":
            requiredOU = "lukuid-test"
        default:
            requiredOU = "lukuid-production"
        }

        let hasValidProfile = certs.dropFirst().contains { certificate in
            certificateSubjectValues(certificate).contains(requiredOU)
        }
        if !hasValidProfile {
            return .failure(DeviceTrustError(
                id: inputs.id,
                reason: "Certificate chain does not match the requested trust profile: \(inputs.trustProfile)",
                attemptedKeyIds: []
            ))
        }

        // Verify chain back to any trusted root (current Rust/Android stub behavior).
        let chainVerified = verifyChain(certs, against: TRUSTED_ROOT_CERTS_PEM)
        if !chainVerified {
            return .failure(DeviceTrustError(id: inputs.id, reason: "Certificate chain not trusted by any root", attemptedKeyIds: []))
        }

        // 1.1 MANDATORY: Temporal Birth Check
        if let createdTs = inputs.created {
            for cert in certs {
                if !verifyTemporalBirth(cert, created: createdTs) {
                    let range = certificateValidity(cert)
                    return .failure(DeviceTrustError(
                        id: inputs.id,
                        reason: "Temporal birth check failed: created (\(createdTs)) is outside cert window [\(range.validFrom) - \(range.validTo)]",
                        attemptedKeyIds: []
                    ))
                }
            }
        }
    }

    // 2. Prepare Payload
    let payloadString = "\(inputs.id):\(inputs.key)"
    guard let payload = payloadString.data(using: .utf8) else {
         return .failure(DeviceTrustError(id: inputs.id, reason: "Failed to encode payload", attemptedKeyIds: []))
    }

    // 3. Verify Signature against Leaf Public Key (if chain provided) or Legacy Roots
    if let leafPub = leafPublicKey {
        do {
            let publicKey = try Curve25519.Signing.PublicKey(rawRepresentation: leafPub)
            if publicKey.isValidSignature(signatureData, for: payload) {
                return .success(())
            }
        } catch {
            return .failure(DeviceTrustError(id: inputs.id, reason: "Signature verification failed against leaf: \(error.localizedDescription)", attemptedKeyIds: []))
        }
    } else {
        // Fallback to legacy behavior (verify against raw root keys directly)
        // Note: For simplicity in this transition, we'll extract raw keys from root certs
        for rootPEM in TRUSTED_ROOT_CERTS_PEM {
            guard let rootKeyData = extractRawPublicKeyFromCert(rootPEM) else { continue }
            do {
                let publicKey = try Curve25519.Signing.PublicKey(rawRepresentation: rootKeyData)
                if publicKey.isValidSignature(signatureData, for: payload) {
                    return .success(())
                }
            } catch { continue }
        }
    }

    return .failure(DeviceTrustError(id: inputs.id, reason: "Attestation verification failed", attemptedKeyIds: []))
}

// MARK: - Helper Functions (Simplified for attestation)

private func parsePEMChain(_ pem: String) -> [SecCertificate] {
    let pattern = "-----BEGIN CERTIFICATE-----([^-]+)-----END CERTIFICATE-----"
    let regex = try? NSRegularExpression(pattern: pattern, options: [])
    let nsString = pem as NSString
    let matches = regex?.matches(in: pem, options: [], range: NSRange(location: 0, length: nsString.length)) ?? []
    
    return matches.compactMap { match in
        let base64 = nsString.substring(with: match.range(at: 1))
            .replacingOccurrences(of: "\n", with: "")
            .replacingOccurrences(of: "\r", with: "")
        guard let data = Data(base64Encoded: base64) else { return nil }
        return SecCertificateCreateWithData(nil, data as CFData)
    }
}

private func verifyChain(_ chain: [SecCertificate], against rootPEMs: [String]) -> Bool {
    !chain.isEmpty && rootPEMs.contains { !parsePEMChain($0).isEmpty }
}

private func verifyTemporalBirth(_ cert: SecCertificate, created: Int64) -> Bool {
    let range = certificateValidity(cert)
    return created >= range.validFrom && created <= range.validTo
}

private func extractPublicKey(from cert: SecCertificate) -> Data? {
    var trust: SecTrust?
    SecTrustCreateWithCertificates(cert, SecPolicyCreateBasicX509(), &trust)
    return SecTrustCopyKey(trust!)?.keyData
}

private func extractRawPublicKeyFromCert(_ pem: String) -> Data? {
    guard let cert = parsePEMChain(pem).first else { return nil }
    return extractPublicKey(from: cert)
}

extension SecKey {
    var keyData: Data? {
        var error: Unmanaged<CFError>?
        return SecKeyCopyExternalRepresentation(self, &error) as Data?
    }
}

private func certificateValues(_ cert: SecCertificate, keys: [CFString]) -> [CFString: Any] {
    (SecCertificateCopyValues(cert, keys as CFArray, nil) as? [CFString: Any]) ?? [:]
}

private func certificateSubjectValues(_ cert: SecCertificate) -> [String] {
    let values = certificateValues(cert, keys: [kSecOIDX509V1SubjectName])
    guard
        let subject = values[kSecOIDX509V1SubjectName] as? [CFString: Any],
        let entries = subject[kSecPropertyKeyValue] as? [[CFString: Any]]
    else {
        return []
    }

    return entries.compactMap { entry in
        entry[kSecPropertyKeyValue] as? String
    }
}

private func certificateValidity(_ cert: SecCertificate) -> (validFrom: Int64, validTo: Int64) {
    let values = certificateValues(cert, keys: [kSecOIDX509V1ValidityNotBefore, kSecOIDX509V1ValidityNotAfter])
    let validFrom = (values[kSecOIDX509V1ValidityNotBefore] as? [CFString: Any])
        .flatMap { $0[kSecPropertyKeyValue] as? NSNumber }
        .map(\.int64Value) ?? Int64.min
    let validTo = (values[kSecOIDX509V1ValidityNotAfter] as? [CFString: Any])
        .flatMap { $0[kSecPropertyKeyValue] as? NSNumber }
        .map(\.int64Value) ?? Int64.max
    return (validFrom, validTo)
}
