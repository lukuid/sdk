// SPDX-License-Identifier: Apache-2.0
use async_trait::async_trait;
use serde_json::json;
use serialport::{SerialPortInfo, SerialPortType};
use std::collections::{HashMap, HashSet};
use std::io::{Read, Write};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex, OnceLock};
use std::time::Duration;
use tokio::sync::{mpsc, OwnedSemaphorePermit, Semaphore};
use tokio::time::timeout;

use crate::framing::LukuDecoder;
use crate::models::{DiscoveredDevice, LukuidSdkOptions, TransportType};
use crate::transport::{Connection, Transport};

const SERIAL_BAUD_RATE: u32 = 115_200;
const SERIAL_OPEN_STABILIZATION_MS: u64 = 100;
const SERIAL_OPEN_RETRY_INTERVAL_MS: u64 = 75;
const SERIAL_DISCOVERY_LOCK_WAIT_MS: u64 = 10_000;
const SERIAL_CONNECTION_LOCK_WAIT_MS: u64 = 10_000;
const SERIAL_OPEN_RETRY_WINDOW_MS: u64 = 10_000;

pub struct SerialTransport {
    options: LukuidSdkOptions,
}

pub struct SerialProbeResult {
    pub device: DiscoveredDevice,
    pub info: serde_json::Value,
    pub port_info: SerialPortInfo,
}

impl SerialTransport {
    pub fn new() -> Self {
        Self::with_options(LukuidSdkOptions::default())
    }

    pub fn with_options(options: LukuidSdkOptions) -> Self {
        Self { options }
    }

    pub async fn list_connected_with_info(&self) -> Vec<SerialProbeResult> {
        let ports = match serialport::available_ports() {
            Ok(p) => {
                if self.options.debug_logging {
                    eprintln!(
                        "[lukuid-sdk] Serial discovery saw {} candidate ports",
                        p.len()
                    );
                }
                p
            }
            Err(error) => {
                if self.options.debug_logging {
                    eprintln!(
                        "[lukuid-sdk] Serial discovery failed to enumerate ports: {}",
                        error
                    );
                }
                return Vec::new();
            }
        };

        let candidates = select_probe_candidates(ports, self.options.debug_logging);

        let mut tasks = Vec::new();
        for port_info in candidates {
            let port_name = port_info.port_name.clone();
            let debug_logging = self.options.debug_logging;
            let label = format!("{:?}", port_info.port_type);

            tasks.push(tokio::task::spawn(async move {
                let permit = match acquire_serial_path_permit(
                    &port_name,
                    Duration::from_millis(SERIAL_DISCOVERY_LOCK_WAIT_MS),
                    debug_logging,
                )
                .await
                {
                    Ok(permit) => permit,
                    Err(error) => {
                        if debug_logging {
                            eprintln!(
                                "[lukuid-sdk] Skipping serial probe for {}: {}",
                                port_name, error
                            );
                        }
                        return None;
                    }
                };

                tokio::task::spawn_blocking(move || {
                    let _permit = permit;
                    let info = probe_port(&port_name, debug_logging)?;
                    Some(SerialProbeResult {
                        device: DiscoveredDevice {
                            id: port_name,
                            label: Some(label),
                            transport: TransportType::Serial,
                        },
                        info,
                        port_info,
                    })
                })
                .await
                .unwrap_or(None)
            }));
        }

        let mut devices = Vec::new();
        for task in tasks {
            if let Ok(Some(device)) = task.await {
                devices.push(device);
            }
        }

        if self.options.debug_logging {
            eprintln!(
                "[lukuid-sdk] Serial discovery finished with {} recognized Luku device(s)",
                devices.len()
            );
        }

        devices
    }
}

#[async_trait]
impl Transport for SerialTransport {
    fn name(&self) -> &'static str {
        "serial"
    }

    fn transport_type(&self) -> TransportType {
        TransportType::Serial
    }

    async fn is_supported(&self) -> bool {
        true
    }

    async fn list_connected(&self) -> Vec<DiscoveredDevice> {
        self.list_connected_with_info()
            .await
            .into_iter()
            .map(|result| result.device)
            .collect()
    }

    async fn open(
        &self,
        device_id: &str,
        incoming: mpsc::Sender<Vec<u8>>,
    ) -> Result<Box<dyn Connection>, String> {
        let port_name = device_id.to_string();
        if self.options.debug_logging {
            eprintln!("[lukuid-sdk] Opening serial connection to {}", port_name);
        }

        let path_permit = acquire_serial_path_permit(
            &port_name,
            Duration::from_millis(SERIAL_CONNECTION_LOCK_WAIT_MS),
            self.options.debug_logging,
        )
        .await?;

        let port = open_serial_port(
            &port_name,
            Duration::from_millis(100),
            Duration::from_millis(SERIAL_OPEN_RETRY_WINDOW_MS),
            self.options.debug_logging,
        )
        .map_err(|e| e.to_string())?;

        let mut read_port = port.try_clone().map_err(|e| e.to_string())?;
        let stop = std::sync::Arc::new(AtomicBool::new(false));
        let read_stop = stop.clone();

        let reader_thread = std::thread::spawn(move || {
            let mut buf = [0u8; 1024];
            loop {
                if read_stop.load(Ordering::Relaxed) {
                    break;
                }
                match read_port.read(&mut buf) {
                    Ok(n) if n > 0 => {
                        let data = buf[..n].to_vec();
                        if incoming.blocking_send(data).is_err() {
                            break;
                        }
                    }
                    Ok(_) => {}
                    Err(ref e) if e.kind() == std::io::ErrorKind::TimedOut => continue,
                    Err(_) => break,
                }
            }
        });

        Ok(Box::new(SerialConnection {
            port: std::sync::Arc::new(std::sync::Mutex::new(Some(port))),
            stop,
            reader_thread: std::sync::Mutex::new(Some(reader_thread)),
            path_permit: std::sync::Mutex::new(Some(path_permit)),
        }))
    }
}

fn probe_port(port_name: &str, debug_logging: bool) -> Option<serde_json::Value> {
    if debug_logging {
        eprintln!("[lukuid-sdk] Probing serial port {}", port_name);
    }

    let mut port = match open_serial_port(
        port_name,
        Duration::from_millis(500),
        Duration::from_millis(SERIAL_OPEN_RETRY_WINDOW_MS),
        debug_logging,
    ) {
        Ok(p) => p,
        Err(error) => {
            if debug_logging {
                eprintln!(
                    "[lukuid-sdk] Failed to open serial port {}: {}",
                    port_name, error
                );
            }
            return None;
        }
    };

    // Send INFO command to check if it's a Luku device
    let frame = json!({
        "action": "info",
        "id": "probe",
        "opts": {}
    });
    let payload = LukuDecoder::encode(&frame);

    if let Err(error) = port.write_all(&payload) {
        if debug_logging {
            eprintln!(
                "[lukuid-sdk] Failed to write probe to {}: {}",
                port_name, error
            );
        }
        return None;
    }
    if let Err(error) = port.flush() {
        if debug_logging {
            eprintln!(
                "[lukuid-sdk] Failed to flush probe to {}: {}",
                port_name, error
            );
        }
        return None;
    }

    let mut decoder = LukuDecoder::new();
    let mut buf = [0u8; 256];
    let start = std::time::Instant::now();

    while start.elapsed() < Duration::from_millis(7500) {
        match port.read(&mut buf) {
            Ok(n) if n > 0 => {
                let frames = decoder.feed(&buf[..n]);
                if let Some(frame) = frames.into_iter().find(|frame| {
                    frame.get("action").and_then(|value| value.as_str()) == Some("info")
                }) {
                    if debug_logging {
                        let device_id = frame
                            .get("id")
                            .and_then(|value| value.as_str())
                            .unwrap_or("<missing>");
                        eprintln!(
                            "[lukuid-sdk] Probe succeeded on {} with device id {}",
                            port_name, device_id
                        );
                    }
                    return Some(frame);
                }
            }
            Ok(_) => {}
            Err(ref e) if e.kind() == std::io::ErrorKind::TimedOut => continue,
            Err(error) => {
                if debug_logging {
                    eprintln!(
                        "[lukuid-sdk] Read error while probing {}: {}",
                        port_name, error
                    );
                }
                break;
            }
        }
    }

    if debug_logging {
        eprintln!(
            "[lukuid-sdk] Probe timed out waiting for INFO from {}",
            port_name
        );
    }

    None
}

fn serial_path_semaphores() -> &'static Mutex<HashMap<String, Arc<Semaphore>>> {
    static SERIAL_PATH_SEMAPHORES: OnceLock<Mutex<HashMap<String, Arc<Semaphore>>>> =
        OnceLock::new();
    SERIAL_PATH_SEMAPHORES.get_or_init(|| Mutex::new(HashMap::new()))
}

fn serial_path_semaphore(port_name: &str) -> Arc<Semaphore> {
    let mut guard = serial_path_semaphores().lock().unwrap();
    guard
        .entry(port_name.to_string())
        .or_insert_with(|| Arc::new(Semaphore::new(1)))
        .clone()
}

async fn acquire_serial_path_permit(
    port_name: &str,
    wait_timeout: Duration,
    debug_logging: bool,
) -> Result<OwnedSemaphorePermit, String> {
    if debug_logging {
        eprintln!(
            "[lukuid-sdk] Waiting up to {} ms for serial path permit on {}",
            wait_timeout.as_millis(),
            port_name
        );
    }

    let semaphore = serial_path_semaphore(port_name);
    match timeout(wait_timeout, semaphore.acquire_owned()).await {
        Ok(Ok(permit)) => Ok(permit),
        Ok(Err(_)) => Err(format!(
            "serial path coordination for {} was closed unexpectedly",
            port_name
        )),
        Err(_) => Err(format!(
            "timed out waiting {} ms for serial path {} to become available",
            wait_timeout.as_millis(),
            port_name
        )),
    }
}

fn open_serial_port(
    port_name: &str,
    timeout: Duration,
    open_retry_window: Duration,
    debug_logging: bool,
) -> Result<Box<dyn serialport::SerialPort>, serialport::Error> {
    let open_started = std::time::Instant::now();
    let mut open_attempt = 0u32;
    let mut port = loop {
        open_attempt += 1;

        match serialport::new(port_name, SERIAL_BAUD_RATE)
            .timeout(timeout)
            .open()
        {
            Ok(port) => break port,
            Err(error)
                if is_retryable_serial_open_error(&error)
                    && open_started.elapsed() < open_retry_window =>
            {
                if debug_logging {
                    eprintln!(
                        "[lukuid-sdk] Serial port {} is not openable yet (attempt {}): {}. Retrying...",
                        port_name,
                        open_attempt,
                        error
                    );
                }
                std::thread::sleep(Duration::from_millis(SERIAL_OPEN_RETRY_INTERVAL_MS));
            }
            Err(error) => return Err(error),
        }
    };

    // macOS/Linux can reset ESP32-S3 CDC when host control lines change.
    // Hold both lines low and allow a short settle period after every open,
    // not only during INFO probing.
    if let Err(error) = port.write_data_terminal_ready(false) {
        if debug_logging {
            eprintln!(
                "[lukuid-sdk] Failed to clear DTR on {}: {}",
                port_name, error
            );
        }
    }
    if let Err(error) = port.write_request_to_send(false) {
        if debug_logging {
            eprintln!(
                "[lukuid-sdk] Failed to clear RTS on {}: {}",
                port_name, error
            );
        }
    }

    std::thread::sleep(Duration::from_millis(SERIAL_OPEN_STABILIZATION_MS));
    Ok(port)
}

fn is_retryable_serial_open_error(error: &serialport::Error) -> bool {
    let message = error.to_string().to_lowercase();
    message.contains("exclusive lock")
        || message.contains("resource busy")
        || message.contains("permission denied")
        || message.contains("temporarily unavailable")
        || message.contains("operation would block")
        || message.contains("no such file")
}

fn select_probe_candidates(ports: Vec<SerialPortInfo>, debug_logging: bool) -> Vec<SerialPortInfo> {
    let mut preferred = Vec::new();
    let mut others = Vec::new();

    let preferred_callout_suffixes: HashSet<String> = ports
        .iter()
        .filter_map(|port| {
            #[cfg(target_os = "macos")]
            if let Some(suffix) = port.port_name.strip_prefix("/dev/cu.") {
                return Some(suffix.to_string());
            }
            None
        })
        .collect();

    for port in ports {
        let name = port.port_name.clone();

        if is_system_or_bt_port(&name) {
            if debug_logging {
                eprintln!("[lukuid-sdk] Skipping system/BT port {}", name);
            }
            continue;
        }

        #[cfg(target_os = "macos")]
        if let Some(suffix) = name.strip_prefix("/dev/tty.") {
            if preferred_callout_suffixes.contains(suffix) {
                if debug_logging {
                    eprintln!(
                        "[lukuid-sdk] Skipping macOS dial-in twin {} in favor of /dev/cu.{}",
                        name, suffix
                    );
                }
                continue;
            }
        }

        match &port.port_type {
            SerialPortType::UsbPort(info) => {
                let is_lukuid = info.manufacturer.as_deref() == Some("LukuID")
                    || info
                        .product
                        .as_deref()
                        .map(|p| p.contains("LukuID"))
                        .unwrap_or(false);

                if is_lukuid {
                    if debug_logging {
                        eprintln!(
                            "[lukuid-sdk] Found high-probability candidate: {} ({:?})",
                            name, info.product
                        );
                    }
                    preferred.push(port);
                } else {
                    others.push(port);
                }
            }
            _ => others.push(port),
        }
    }

    if debug_logging {
        eprintln!(
            "[lukuid-sdk] Serial discovery identified {} high-probability and {} other candidate port(s)",
            preferred.len(),
            others.len()
        );
    }

    // Prioritize LukuID devices, but still allow probing others if none found
    let mut candidates = preferred;
    candidates.extend(others);
    candidates
}

fn is_system_or_bt_port(port_name: &str) -> bool {
    let name_lower = port_name.to_lowercase();
    matches!(
        port_name,
        "/dev/cu.Bluetooth-Incoming-Port"
            | "/dev/tty.Bluetooth-Incoming-Port"
            | "/dev/cu.debug-console"
            | "/dev/tty.debug-console"
    ) || name_lower.contains("bluetooth")
        || name_lower.contains("beats")
        || name_lower.contains("airpods")
}

struct SerialConnection {
    port: std::sync::Arc<std::sync::Mutex<Option<Box<dyn serialport::SerialPort>>>>,
    stop: std::sync::Arc<AtomicBool>,
    reader_thread: std::sync::Mutex<Option<std::thread::JoinHandle<()>>>,
    path_permit: std::sync::Mutex<Option<OwnedSemaphorePermit>>,
}

#[async_trait]
impl Connection for SerialConnection {
    async fn write(&self, data: &[u8]) -> Result<(), String> {
        let port = self.port.clone();
        let data = data.to_vec();

        tokio::task::spawn_blocking(move || {
            let mut guard = port.lock().unwrap();
            let p = guard
                .as_mut()
                .ok_or_else(|| "Serial port is already closed".to_string())?;
            p.write_all(&data).map_err(|e| e.to_string())?;
            p.flush().map_err(|e| e.to_string())
        })
        .await
        .map_err(|e| e.to_string())?
    }

    async fn close(&self) -> Result<(), String> {
        self.stop.store(true, Ordering::Relaxed);
        {
            let mut guard = self.port.lock().unwrap();
            let _ = guard.take();
        }

        let reader_thread = {
            let mut guard = self.reader_thread.lock().unwrap();
            guard.take()
        };

        if let Some(reader_thread) = reader_thread {
            tokio::task::spawn_blocking(move || {
                reader_thread
                    .join()
                    .map_err(|_| "Serial reader thread panicked".to_string())
            })
            .await
            .map_err(|e| e.to_string())??;
        }

        {
            let mut guard = self.path_permit.lock().unwrap();
            let _ = guard.take();
        }

        Ok(())
    }
}
