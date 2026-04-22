// SPDX-License-Identifier: Apache-2.0
use crate::models::{DiscoveredDevice, TransportType};
use async_trait::async_trait;
use tokio::sync::mpsc;

#[cfg(feature = "transport-ble")]
pub mod ble;
#[cfg(feature = "transport-serial")]
pub mod serial;

#[async_trait]
pub trait Transport: Send + Sync {
    fn name(&self) -> &'static str;
    fn transport_type(&self) -> TransportType;
    async fn is_supported(&self) -> bool;
    async fn list_connected(&self) -> Vec<DiscoveredDevice>;
    // Opens a connection. Incoming data will be sent to `incoming`.
    async fn open(
        &self,
        device_id: &str,
        incoming: mpsc::Sender<Vec<u8>>,
    ) -> Result<Box<dyn Connection>, String>;
}

#[async_trait]
pub trait Connection: Send + Sync {
    async fn write(&self, data: &[u8]) -> Result<(), String>;
    async fn close(&self) -> Result<(), String>;
}
