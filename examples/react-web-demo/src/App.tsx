// SPDX-License-Identifier: Apache-2.0
import { useState, useEffect, useCallback } from 'react';
import lukuid from '@lukuid/sdk';
import type { Device } from '@lukuid/sdk';

function App() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [activeDevice, setActiveDevice] = useState<Device | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isWatching, setIsWatching] = useState(false);

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  }, []);

  useEffect(() => {
    // Initial fetch of authorized devices
    lukuid.getConnectedDevices().then((connected) => {
      setDevices(connected);
      if (connected.length > 0) {
        addLog(`Found ${connected.length} authorized devices`);
      }
    });

    // Listen for SDK-level device events
    const off = lukuid.on('device', ({ kind, device }) => {
      if (kind === 'added') {
        setDevices((prev) => [...prev.filter(d => d.info.id !== device.info.id), device]);
        addLog(`Device added: ${device.info.id}`);
      } else {
        setDevices((prev) => prev.filter((d) => d.info.id !== device.info.id));
        if (activeDevice?.info.id === device.info.id) {
          setActiveDevice(null);
        }
        addLog(`Device removed: ${device.info.id}`);
      }
    });

    return () => off();
  }, [activeDevice, addLog]);

  const handleToggleWatch = async () => {
    if (isWatching) {
      await lukuid.stopWatching();
      setIsWatching(false);
      addLog('Stopped watching for devices');
    } else {
      await lukuid.startWatching();
      setIsWatching(true);
      addLog('Started watching for devices');
    }
  };

  const handleRequestDevice = async () => {
    try {
      addLog('Opening browser device picker...');
      const device = await lukuid.requestDevice({
        preferredTransports: ['webusb', 'webble']
      });
      addLog(`Connected to: ${device.info.id} (Verified: ${device.info.verified})`);
      setActiveDevice(device);
    } catch (err: any) {
      if (err.code === 'NO_CANDIDATES') {
        addLog('Connection cancelled by user');
      } else {
        addLog(`Connection failed: ${err.message}`);
      }
    }
  };

  const handlePing = async (device: Device) => {
    try {
      addLog(`Sending PING to ${device.info.id}...`);
      const response = await device.call('PING', { ts: Date.now() });
      addLog(`PING Response: ${JSON.stringify(response)}`);
    } catch (err: any) {
      addLog(`PING failed: ${err.message}`);
    }
  };

  const handleShowDialog = async () => {
    addLog('Opening scan dialog...');
    const result = await lukuid.showScanDialog();
    if (result) {
      addLog(`SUCCESS: Scanned from ${result.device.info.id}: ${JSON.stringify(result.data)}`);
    } else {
      addLog('Scan dialog closed without result');
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 600, letterSpacing: '-0.5px' }}>LukuID React SDK Demo</h1>
        <p style={{ color: '#86868b' }}>A modern, unified interface for LukuID compatible hardware.</p>
      </header>

      <section style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={handleRequestDevice}
            style={buttonStyle(true)}
          >
            Connect New Device
          </button>
          <button 
            onClick={handleShowDialog}
            style={buttonStyle(true)}
          >
            Scan using Dialog
          </button>
          <button 
            onClick={handleToggleWatch}
            style={buttonStyle(false)}
          >
            {isWatching ? 'Stop Watching' : 'Start Background Watch'}
          </button>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        <section>
          <h2 style={sectionHeaderStyle}>Connected Devices</h2>
          {devices.length === 0 ? (
            <p style={{ color: '#86868b', fontSize: '14px' }}>No devices currently connected or authorized.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {devices.map((device) => (
                <div 
                  key={device.info.id}
                  style={cardStyle(activeDevice?.info.id === device.info.id)}
                  onClick={() => setActiveDevice(device)}
                >
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>{device.info.id}</div>
                  <div style={{ fontSize: '12px', color: '#86868b' }}>
                    {device.info.transport.toUpperCase()} • {device.info.verified ? 'Verified' : 'Unverified'}
                  </div>
                  {activeDevice?.info.id === device.info.id && (
                    <div style={{ marginTop: '12px' }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handlePing(device); }}
                        style={smallButtonStyle}
                      >
                        Ping Device (RPC Call)
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 style={sectionHeaderStyle}>Activity Log</h2>
          <div style={logContainerStyle}>
            {logs.length === 0 ? (
              <span style={{ color: '#86868b' }}>Idle</span>
            ) : (
              logs.map((log, i) => (
                <div key={i} style={{ marginBottom: '4px' }}>{log}</div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

const sectionHeaderStyle = {
  fontSize: '18px',
  fontWeight: 600,
  marginBottom: '16px'
};

const buttonStyle = (primary: boolean) => ({
  padding: '12px 24px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: primary ? '#0071e3' : '#e8e8ed',
  color: primary ? '#fff' : '#1d1d1f',
  fontWeight: 500,
  fontSize: '14px',
  cursor: 'pointer',
  transition: 'all 0.2s ease'
});

const smallButtonStyle = {
  padding: '6px 12px',
  borderRadius: '6px',
  border: '1px solid #0071e3',
  backgroundColor: 'transparent',
  color: '#0071e3',
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer'
};

const cardStyle = (active: boolean) => ({
  padding: '16px',
  borderRadius: '12px',
  backgroundColor: '#fff',
  border: `2px solid ${active ? '#0071e3' : 'transparent'}`,
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  cursor: 'pointer',
  transition: 'all 0.2s ease'
});

const logContainerStyle = {
  backgroundColor: '#1d1d1f',
  color: '#00ff00',
  padding: '16px',
  borderRadius: '12px',
  fontSize: '12px',
  fontFamily: 'monospace',
  height: '400px',
  overflowY: 'auto' as const,
  whiteSpace: 'pre-wrap' as const
};

export default App;
