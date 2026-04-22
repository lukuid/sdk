// SPDX-License-Identifier: Apache-2.0
use async_trait::async_trait;
use btleplug::api::{Central, Manager as _, Peripheral as _, ScanFilter, WriteType};
use btleplug::platform::{Adapter, Manager, Peripheral};
use futures::stream::StreamExt;
use std::str::FromStr;
use std::time::Duration;
use tokio::sync::mpsc;
use tokio::time;
use uuid::Uuid;

use crate::models::{DiscoveredDevice, TransportType};
use crate::transport::{Connection, Transport};

const SERVICE_UUID: &str = "7b7e4f7a-2f0d-4b5a-9d3d-3f0a7e0b9f7c";
const RX_UUID: &str = "7b7e4f7a-2f0d-4b5a-9d3d-3f0a7e0b9f7d";
const TX_UUID: &str = "7b7e4f7a-2f0d-4b5a-9d3d-3f0a7e0b9f7e";
const DISCOVERY_SCAN_WINDOW: Duration = Duration::from_secs(2);

pub struct BleTransport {
    manager: Manager,
}

impl BleTransport {
    pub async fn new() -> Result<Self, String> {
        let manager = Manager::new().await.map_err(|e| e.to_string())?;
        Ok(Self { manager })
    }

    async fn get_central(&self) -> Result<Adapter, String> {
        let adapters = self.manager.adapters().await.map_err(|e| e.to_string())?;
        adapters
            .into_iter()
            .next()
            .ok_or_else(|| "No Bluetooth adapter found".to_string())
    }
}

#[async_trait]
impl Transport for BleTransport {
    fn name(&self) -> &'static str {
        "ble"
    }

    fn transport_type(&self) -> TransportType {
        TransportType::Ble
    }

    async fn is_supported(&self) -> bool {
        self.get_central().await.is_ok()
    }

    async fn list_connected(&self) -> Vec<DiscoveredDevice> {
        let central = match self.get_central().await {
            Ok(central) => central,
            Err(_) => return Vec::new(),
        };

        let service_uuid = Uuid::from_str(SERVICE_UUID).unwrap();
        let filter = ScanFilter {
            services: vec![service_uuid],
        };

        let _ = central.start_scan(filter).await;
        time::sleep(DISCOVERY_SCAN_WINDOW).await;

        let peripherals = match central.peripherals().await {
            Ok(peripherals) => peripherals,
            Err(_) => {
                let _ = central.stop_scan().await;
                return Vec::new();
            }
        };

        let mut discovered = Vec::new();
        for peripheral in peripherals {
            let id = peripheral.id().to_string();
            let properties = match peripheral.properties().await {
                Ok(properties) => properties,
                Err(_) => None,
            };

            let local_name = properties
                .as_ref()
                .and_then(|props| props.local_name.clone());
            let advertises_lukuid_service = properties
                .as_ref()
                .map(|props| props.services.iter().any(|uuid| *uuid == service_uuid))
                .unwrap_or(false);
            let name_looks_lukuid = local_name
                .as_deref()
                .map(|name| name.to_ascii_lowercase().contains("lukuid"))
                .unwrap_or(false);

            if !advertises_lukuid_service && !name_looks_lukuid {
                continue;
            }

            discovered.push(DiscoveredDevice {
                id,
                label: local_name.or_else(|| Some("LukuID BLE Reader".to_string())),
                transport: TransportType::Ble,
            });
        }

        let _ = central.stop_scan().await;
        discovered
    }

    async fn open(
        &self,
        device_id: &str,
        incoming: mpsc::Sender<Vec<u8>>,
    ) -> Result<Box<dyn Connection>, String> {
        let central = self.get_central().await?;

        // device_id here is expected to be the peripheral ID string (e.g. MAC address or UUID)
        // We need to find the peripheral with this ID.
        // Since we might not have scanned yet, we should probably scan briefly if not found?
        // Or assume the user called a discover method before (which we don't have in Transport trait yet, oops).
        // The `Transport` trait I defined has `list_connected`.
        // I should probably add `scan` or similar to the trait or just scan inside `open` if needed.
        // For robustness: Try to find in cache. If not, scan for 2 seconds.

        let find_peripheral = async {
            for _ in 0..5 {
                let peripherals = central.peripherals().await.map_err(|e| e.to_string())?;
                if let Some(p) = peripherals
                    .into_iter()
                    .find(|p| p.id().to_string() == device_id)
                {
                    return Ok(p);
                }
                time::sleep(Duration::from_millis(200)).await;
            }
            Err(format!("Device {} not found", device_id))
        };

        let peripheral = match find_peripheral.await {
            Ok(p) => p,
            Err(_) => {
                // Try scanning
                central
                    .start_scan(ScanFilter::default())
                    .await
                    .map_err(|e| e.to_string())?;
                time::sleep(Duration::from_secs(2)).await;
                // Try finding again
                let peripherals = central.peripherals().await.map_err(|e| e.to_string())?;
                peripherals
                    .into_iter()
                    .find(|p| p.id().to_string() == device_id)
                    .ok_or_else(|| format!("Device {} not found after scan", device_id))?
            }
        };

        if !peripheral.is_connected().await.map_err(|e| e.to_string())? {
            peripheral.connect().await.map_err(|e| e.to_string())?;
        }

        peripheral
            .discover_services()
            .await
            .map_err(|e| e.to_string())?;

        let rx_uuid = Uuid::from_str(RX_UUID).unwrap();
        let tx_uuid = Uuid::from_str(TX_UUID).unwrap();

        let chars = peripheral.characteristics();
        let rx_char = chars
            .iter()
            .find(|c| c.uuid == rx_uuid)
            .ok_or("RX characteristic not found")?
            .clone();
        let tx_char = chars
            .iter()
            .find(|c| c.uuid == tx_uuid)
            .ok_or("TX characteristic not found")?
            .clone();

        peripheral
            .subscribe(&tx_char)
            .await
            .map_err(|e| e.to_string())?;

        let mut notification_stream = peripheral
            .notifications()
            .await
            .map_err(|e| e.to_string())?;

        tokio::spawn(async move {
            while let Some(data) = notification_stream.next().await {
                if data.uuid == tx_uuid {
                    if incoming.send(data.value).await.is_err() {
                        break;
                    }
                }
            }
        });

        Ok(Box::new(BleConnection {
            peripheral,
            write_char: rx_char,
        }))
    }
}

struct BleConnection {
    peripheral: Peripheral,
    write_char: btleplug::api::Characteristic,
}

#[async_trait]
impl Connection for BleConnection {
    async fn write(&self, data: &[u8]) -> Result<(), String> {
        self.peripheral
            .write(&self.write_char, data, WriteType::WithResponse)
            .await
            .map_err(|e| e.to_string())
    }

    async fn close(&self) -> Result<(), String> {
        self.peripheral
            .disconnect()
            .await
            .map_err(|e| e.to_string())
    }
}
