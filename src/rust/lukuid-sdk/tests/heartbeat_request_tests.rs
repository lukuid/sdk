// The device signs "device_id:public_key:counter:firmware" in generate_heartbeat and the
// API only appends the firmware to the verified string when the request carries it, so a
// heartbeat request without `firmware` always fails the possession proof.
use lukuid_sdk::{LukuidSdk, LukuidSdkOptions};
use serde_json::{json, Value};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;

// Accepts one HTTP request, answers {} and returns the JSON body it received.
async fn capture_one_request(listener: TcpListener) -> Value {
    let (mut socket, _) = listener.accept().await.unwrap();
    let mut buf = Vec::new();
    let mut chunk = [0u8; 4096];
    loop {
        let n = socket.read(&mut chunk).await.unwrap();
        buf.extend_from_slice(&chunk[..n]);
        let text = String::from_utf8_lossy(&buf).to_string();
        if let Some(split) = text.find("\r\n\r\n") {
            let length = text[..split]
                .lines()
                .find_map(|line| line.to_ascii_lowercase().strip_prefix("content-length:").map(|v| v.trim().parse::<usize>().unwrap()))
                .unwrap_or(0);
            if buf.len() >= split + 4 + length {
                let body = &buf[split + 4..split + 4 + length];
                socket
                    .write_all(b"HTTP/1.1 200 OK\r\ncontent-type: application/json\r\ncontent-length: 2\r\nconnection: close\r\n\r\n{}")
                    .await
                    .unwrap();
                return serde_json::from_slice(body).unwrap();
            }
        }
        if n == 0 {
            panic!("connection closed before the request body arrived");
        }
    }
}

async fn send_heartbeat(firmware: Option<&str>) -> Value {
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let api_url = format!("http://{}", listener.local_addr().unwrap());
    let server = tokio::spawn(capture_one_request(listener));
    let sdk = LukuidSdk::with_options(LukuidSdkOptions::default());
    sdk.heartbeat_with_api_url(
        &api_url,
        "DEV-1",
        "key",
        "sig",
        "csr",
        "",
        None,
        7,
        json!({}),
        json!({}),
        false,
        None,
        firmware,
    )
    .await
    .unwrap();
    server.await.unwrap()
}

#[tokio::test]
async fn heartbeat_request_carries_the_signed_firmware_version() {
    let body = send_heartbeat(Some("v1.0.0")).await;
    assert_eq!(body["firmware"], json!("v1.0.0"));
    assert_eq!(body["device_id"], json!("DEV-1"));
    assert_eq!(body["counter"], json!(7));
}

#[tokio::test]
async fn heartbeat_request_omits_an_unknown_firmware_version() {
    for firmware in [None, Some(""), Some("  ")] {
        let body = send_heartbeat(firmware).await;
        assert!(body.get("firmware").is_none(), "unexpected firmware for {:?}", firmware);
    }
}
