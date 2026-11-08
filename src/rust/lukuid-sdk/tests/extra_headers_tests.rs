// SPDX-License-Identifier: Apache-2.0
// Apps identify themselves (and state a firmware channel preference) through extra
// headers that the SDK sends with every request to LukuID.
use lukuid_sdk::revocation::RevocationManager;
use lukuid_sdk::LukuidSdkOptions;
use tokio::io::{AsyncReadExt, AsyncWriteExt};

#[test]
fn invalid_header_entries_are_skipped() {
    let mut options = LukuidSdkOptions::default();
    options.extra_headers = vec![
        ("X-LukuID-App".into(), "desktop".into()),
        ("X-LukuID-App-Version".into(), "1.0.400".into()),
        ("bad header".into(), "x".into()),
        ("X-Bad-Value".into(), "line\nbreak".into()),
    ];
    let map = options.header_map();
    assert_eq!(map.len(), 2);
    assert_eq!(map["x-lukuid-app"], "desktop");
    assert_eq!(map["x-lukuid-app-version"], "1.0.400");
}

#[tokio::test]
async fn crl_requests_carry_the_extra_headers() {
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap();
    let server = tokio::spawn(async move {
        let (mut socket, _) = listener.accept().await.unwrap();
        let mut buf = vec![0u8; 8192];
        let n = socket.read(&mut buf).await.unwrap();
        let request = String::from_utf8_lossy(&buf[..n]).to_lowercase();
        let _ = socket.write_all(b"HTTP/1.1 500 Internal Server Error\r\ncontent-length: 0\r\n\r\n").await;
        request
    });

    let mut options = LukuidSdkOptions::default();
    options.api_url = format!("http://{addr}");
    options.disable_external_calls = false;
    options.crl_memory_only = true;
    options.crl_refresh_interval_hours = 0;
    options.extra_headers = vec![
        ("X-LukuID-App".into(), "android".into()),
        ("X-LukuID-App-Version".into(), "2.1.7".into()),
    ];
    let manager = RevocationManager::new(options);
    let _ = manager.sync().await; // the 500 makes the sync fail; only the request matters
    let request = server.await.unwrap();
    assert!(request.starts_with("get /crl "), "{request}");
    assert!(request.contains("x-lukuid-app: android"), "{request}");
    assert!(request.contains("x-lukuid-app-version: 2.1.7"), "{request}");
}
