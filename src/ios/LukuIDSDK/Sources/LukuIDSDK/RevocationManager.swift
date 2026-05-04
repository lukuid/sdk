// SPDX-License-Identifier: Apache-2.0
import Foundation
import CryptoKit


internal class RevocationManager {
    private let options: LukuIDClientOptions
    private var revokedFingerprints: Set<String> = []
    private var lastSyncDate: String?
    private var refreshTimer: Timer?
    private let queue = DispatchQueue(label: "com.lukuid.sdk.revocation")

    init(options: LukuIDClientOptions) {
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
                lastSyncDate = json["last_sync"] as? String
                if let fingerprints = json["fingerprints"] as? [String] {
                    revokedFingerprints = Set(fingerprints.map { $0.lowercased() })
                }
            }
        } catch {
            debugLog("Failed to load CRL cache: \(error)")
        }
    }

    private func saveToCache() {
        guard let url = getCacheFileURL() else { return }
        
        do {
            let json: [String: Any] = [
                "last_sync": lastSyncDate as Any,
                "fingerprints": Array(revokedFingerprints)
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
        
        let apiUrl = options.apiUrl.trimmingCharacters(in: .init(charactersIn: "/"))
        var urlString = "\(apiUrl)/revocations"
        if let lastSync = lastSyncDate {
            urlString += "?from=\(lastSync)"
        }
        
        guard let url = URL(string: urlString) else { return }
        
        do {
            let (data, response) = try await URLSession.shared.data(from: url)
            guard let httpResponse = response as? HTTPURLResponse else { return }
            
            if httpResponse.statusCode == 200 {
                if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let revocations = json["revocations"] as? [[String: Any]] {
                    
                    queue.sync {
                        for item in revocations {
                            if let fingerprint = item["identifier"] as? String {
                                revokedFingerprints.insert(fingerprint.lowercased())
                            }
                        }
                    }
                    
                    let formatter = ISO8601DateFormatter()
                    lastSyncDate = formatter.string(from: Date())
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

    func isRevoked(certificate: SecCertificate) -> Bool {
        let fingerprint = getFingerprint(certificate)
        return queue.sync { revokedFingerprints.contains(fingerprint.lowercased()) }
    }

    private func getFingerprint(_ certificate: SecCertificate) -> String {
        // We use extractRawPublicKey which we already have in DeviceAttestation
        // For consistency, I'll use the same logic
        if let keyData = extractRawPublicKey(from: certificate) {
            return calculateSha256Hex(keyData)
        }
        
        // Fallback to full cert DER if public key extraction fails
        if let data = SecCertificateCopyData(certificate) as Data? {
            return calculateSha256Hex(data)
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

// Utility function to match Android's debugLog
private func debugLog(_ message: String) {
    print("[RevocationManager] \(message)")
}
