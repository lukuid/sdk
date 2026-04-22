// SPDX-License-Identifier: Apache-2.0
import lukuid from '@lukuid/sdk';

const app = document.querySelector('#app');

if (app) {
  app.innerHTML = `
    <h1>LukuID Web Demo</h1>
    <p>Click connect to request WebUSB or WebBluetooth permissions.</p>
    <div style="display: flex; gap: 8px">
      <button id="connect">Connect</button>
      <button id="scan-dialog">Scan via Dialog</button>
    </div>
    <pre id="log"></pre>
  `;

  const logEl = app.querySelector('#log');
  const button = app.querySelector('#connect');
  const dialogBtn = app.querySelector('#scan-dialog');

  button?.addEventListener('click', async () => {
    logEl!.textContent = 'Requesting device...';
    try {
      const device = await lukuid.requestDevice({
        preferredTransports: ['webusb', 'webble']
      });
      logEl!.textContent = `Connected: ${device.info.id}\nVerified: ${device.info.verified}`;
      
      const info = await device.cmd('INFO');
      logEl!.textContent += `\nINFO Response: ${JSON.stringify(info, null, 2)}`;
    } catch (error) {
      logEl!.textContent = `Failed: ${error}`;
    }
  });

  dialogBtn?.addEventListener('click', async () => {
    logEl!.textContent = 'Opening dialog...';
    const result = await lukuid.showScanDialog();
    if (result) {
      logEl!.textContent = `Scanned: ${JSON.stringify(result.data)}`;
    } else {
      logEl!.textContent = 'Dialog closed';
    }
  });
}
