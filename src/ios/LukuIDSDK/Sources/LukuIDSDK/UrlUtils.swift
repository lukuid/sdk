import Foundation

internal func isExternalCallAllowed(targetUrl: String, disableExternalCalls: Bool) -> Bool {
    if !disableExternalCalls {
        return true
    }
    
    guard let url = URL(string: targetUrl), let host = url.host?.lowercased() else {
        // If we can't parse it, we allow it to proceed and let the fetch failure handle it.
        return true
    }
    
    return !(host == "lukuid.com" || host.hasSuffix(".lukuid.com"))
}
