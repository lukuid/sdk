use reqwest::Url;

pub(crate) fn is_external_call_allowed(target_url: &str, disable_external_calls: bool) -> bool {
    if !disable_external_calls {
        return true;
    }

    if let Ok(parsed) = Url::parse(target_url) {
        if let Some(host) = parsed.host_str() {
            let host_lower = host.to_lowercase();
            return !(host_lower == "lukuid.com" || host_lower.ends_with(".lukuid.com"));
        }
    }

    // If we can't parse it or it doesn't have a host, we'll allow it and let the HTTP client fail later,
    // or we might block it if we are strictly restrictive. We will allow it since it's not provably lukuid.com.
    true
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_external_call_allowed() {
        // Disabled = false (Allow all)
        assert_eq!(
            is_external_call_allowed("https://api.lukuid.com", false),
            true
        );
        assert_eq!(
            is_external_call_allowed("https://custom.endpoint.com", false),
            true
        );

        // Disabled = true (Block lukuid.com)
        assert_eq!(
            is_external_call_allowed("https://api.lukuid.com", true),
            false
        );
        assert_eq!(is_external_call_allowed("http://lukuid.com", true), false);
        assert_eq!(
            is_external_call_allowed("https://sub.api.lukuid.com/path", true),
            false
        );
        assert_eq!(is_external_call_allowed("https://LUKUID.COM", true), false);

        // Disabled = true (Allow others)
        assert_eq!(
            is_external_call_allowed("https://custom.endpoint.com", true),
            true
        );
        assert_eq!(
            is_external_call_allowed("https://notlukuid.com", true),
            true
        );
        assert_eq!(
            is_external_call_allowed("http://localhost:8080", true),
            true
        );
        assert_eq!(
            is_external_call_allowed("https://lukuid.com.br", true),
            true
        ); // Careful: ends_with(".lukuid.com") doesn't match this. wait, host="lukuid.com.br" doesn't end with ".lukuid.com" so it returns true, which is correct.
    }
}
