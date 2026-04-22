# iOS Demo Snippet

SwiftUI snippet using the Swift package.

```swift
import SwiftUI
import LukuIDSDK

struct ContentView: View {
    @State private var log: [String] = []
    private let sdk = LukuIDClient()

    var body: some View {
        VStack {
            Button("Start Watching") {
                sdk.startWatching()
            }
            Button("Stop Watching") {
                sdk.stopWatching()
            }
            Button("Request Device") {
                Task {
                    do {
                        let device = try await sdk.requestDevice()
                        log.append("Connected \(device.info.id)")
                        let response = try await device.cmd(key: "INFO")
                        log.append("INFO => \(response)")
                    } catch {
                        log.append("Error: \(error.localizedDescription)")
                    }
                }
            }
            List(log, id: \.self) { line in
                Text(line)
            }
        }
        .onAppear {
            _ = sdk.onDevice { event in
                log.append("Device \(event.type == .added ? "added" : "removed") \(event.device.info.id)")
            }
            _ = sdk.onError { err in
                log.append("SDK error: \(err.whereHint)")
            }
        }
    }
}
```

Add `https://github.com/.../src/ios/LukuIDSDK` as a Swift Package dependency

 in Xcode (File → Add Packages) and select the `LukuIDSDK` product.
