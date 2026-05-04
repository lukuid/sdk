export function isExternalCallAllowed(targetUrl: string, disableExternalCalls: boolean): boolean {
    if (!disableExternalCalls) {
        return true;
    }
    
    try {
        const parsed = new URL(targetUrl);
        const hostLower = parsed.hostname.toLowerCase();
        return !(hostLower === 'lukuid.com' || hostLower.endsWith('.lukuid.com'));
    } catch (e) {
        // If we can't parse it, we allow it to proceed and let the fetch failure handle it.
        return true;
    }
}
