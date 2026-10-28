// SPDX-License-Identifier: Apache-2.0
import Foundation
import CryptoKit


public class RevocationManager {
    private let options: LukuIDClientOptions
    private var revokedFingerprints: Set<String> = []
    private var lastSyncTime: Date = .distantPast
    private var snapshot: [String: Any]?
    private var generatedAt: Date = .distantPast
    private var refreshTimer: Timer?
    private let queue = DispatchQueue(label: "com.lukuid.sdk.revocation")

    public init(options: LukuIDClientOptions) {
        self.options = options
        loadFromCache()
        startAutoRefresh()
    }

    private func getCacheFileURL() -> URL? {
        if options.crlMemoryOnly { return nil }
        
        let fileManager = FileManager.default
        let folderURL: URL
        if let customPath = options.crlCachePath {
            folderURL = URL(fileURLWithPath: customPath)
        } else {
            guard let appSupport = fileManager.urls(for: .applicationSupportDirectory, in: .userDomainMask).first else {
                return nil
            }
            folderURL = appSupport.appendingPathComponent("LukuID", isDirectory: true)
        }

        if !fileManager.fileExists(atPath: folderURL.path) {
            try? fileManager.createDirectory(at: folderURL, withIntermediateDirectories: true, attributes: nil)
        }
        
        return folderURL.appendingPathComponent("lukuid_crl.json")
    }

    private func loadFromCache() {
        guard let url = getCacheFileURL(), FileManager.default.fileExists(atPath: url.path) else { return }
        
        do {
            let data = try Data(contentsOf: url)
            if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] {
                guard let envelope = json["snapshot"] as? [String: Any] else { return }
                try applySnapshot(envelope)
                let checkedAt = Date(timeIntervalSince1970: json["checked_at"] as? TimeInterval ?? 0)
                lastSyncTime = checkedAt <= Date().addingTimeInterval(300) ? checkedAt : .distantPast
            }
        } catch {
            debugLog("Failed to load CRL cache: \(error)")
        }
    }

    private func saveToCache() {
        guard let url = getCacheFileURL() else { return }
        
        do {
            let json: [String: Any] = [
                "checked_at": lastSyncTime.timeIntervalSince1970,
                "snapshot": snapshot ?? [:]
            ]
            let data = try JSONSerialization.data(withJSONObject: json, options: [])
            try data.write(to: url)
        } catch {
            debugLog("Failed to save CRL cache: \(error)")
        }
    }

    private func startAutoRefresh() {
        guard options.crlRefreshIntervalHours > 0 else { return }
        
        let interval = TimeInterval(options.crlRefreshIntervalHours * 3600)
        refreshTimer = Timer.scheduledTimer(withTimeInterval: interval, repeats: true) { [weak self] _ in
            Task {
                await self?.sync()
            }
        }
        
        // Initial sync
        Task {
            await sync()
        }
    }

    func sync() async {
        guard !options.disableExternalCalls else { return }
        let interval = TimeInterval(options.crlRefreshIntervalHours * 3600)
        if interval > 0 && Date().timeIntervalSince(lastSyncTime) < interval { return }
        let apiUrl = options.apiUrl.trimmingCharacters(in: .init(charactersIn: "/"))
        let urlString = "\(apiUrl)/crl"
        
        guard let url = URL(string: urlString) else { return }
        
        do {
            let (data, response) = try await URLSession.shared.data(from: url)
            guard let httpResponse = response as? HTTPURLResponse else { return }
            
            if httpResponse.statusCode == 200 {
                if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] {
                    try applySnapshot(json)
                    lastSyncTime = Date()
                    saveToCache()
                    debugLog("CRL synced successfully: \(revokedFingerprints.count) items")
                }
            } else if httpResponse.statusCode != 304 {
                debugLog("CRL sync failed with status: \(httpResponse.statusCode)")
            }
        } catch {
            debugLog("CRL sync error: \(error)")
        }
    }

    private func applySnapshot(_ envelope: [String: Any]) throws {
        guard let chain = envelope["certificate_chain"] as? String,
              let payloadBase64 = envelope["payload"] as? String,
              let signatureBase64 = envelope["signature"] as? String,
              let payload = Data(base64Encoded: payloadBase64),
              let signature = Data(base64Encoded: signatureBase64),
              let body = try JSONSerialization.jsonObject(with: payload) as? [String: Any],
              let version = body["version"] as? Int, version == 1,
              let timestamp = body["generated_at"] as? String,
              let generated = ISO8601DateFormatter().date(from: timestamp),
              generated <= Date().addingTimeInterval(300), generated >= Date().addingTimeInterval(-86400),
              let fingerprints = body["revoked_fingerprints"] as? [String],
              fingerprints.allSatisfy({ $0.range(of: "^[a-f0-9]{64}$", options: .regularExpression) != nil }) else {
            throw NSError(domain: "LukuID.CRL", code: 1, userInfo: [NSLocalizedDescriptionKey: "Malformed signed CRL"])
        }
        let validated = validateCertificateChain(chain, created: Int64(generated.timeIntervalSince1970), trustProfile: options.trustProfile)
        guard validated.ok,
              let pem = chain.range(of: "-----BEGIN CERTIFICATE-----[\\s\\S]*?-----END CERTIFICATE-----", options: .regularExpression),
              let leafBytes = Data(base64Encoded: chain[pem].replacingOccurrences(of: "-----BEGIN CERTIFICATE-----", with: "").replacingOccurrences(of: "-----END CERTIFICATE-----", with: "").components(separatedBy: .whitespacesAndNewlines).joined()),
              let leaf = SecCertificateCreateWithData(nil, leafBytes as CFData),
              let key = SecCertificateCopyKey(leaf) else {
            throw NSError(domain: "LukuID.CRL", code: 2, userInfo: [NSLocalizedDescriptionKey: "CRL signing chain rejected"])
        }
        var error: Unmanaged<CFError>?
        guard SecKeyVerifySignature(key, .ecdsaSignatureMessageX962SHA256, payload as CFData, signature as CFData, &error) else {
            throw NSError(domain: "LukuID.CRL", code: 3, userInfo: [NSLocalizedDescriptionKey: "CRL signature rejected"])
        }
        queue.sync { revokedFingerprints = Set(fingerprints); snapshot = envelope; generatedAt = generated }
    }

    func isRevoked(certificate: SecCertificate) -> Bool {
        let fingerprint = getFingerprint(certificate)
        return queue.sync { fingerprint.isEmpty || revokedFingerprints.contains(fingerprint.lowercased()) }
    }

    func hasVerifiedSnapshot() -> Bool { queue.sync { snapshot != nil && generatedAt >= Date().addingTimeInterval(-86400) } }

    private func getFingerprint(_ certificate: SecCertificate) -> String {
        // We use extractRawPublicKey which we already have in DeviceAttestation
        // For consistency, I'll use the same logic
        if let keyData = extractRawPublicKey(from: certificate) {
            return calculateSha256Hex(keyData)
        }
        
        return ""
    }

    private func calculateSha256Hex(_ data: Data) -> String {
        return SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
    }
    
    func close() {
        refreshTimer?.invalidate()
        refreshTimer = nil
    }
}

extension RevocationManager: @unchecked Sendable {}

// Utility function to match Android's debugLog
private func debugLog(_ message: String) {
    print("[RevocationManager] \(message)")
}
