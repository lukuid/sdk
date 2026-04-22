#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
import lukuid from '@lukuid/sdk';

const args = process.argv.slice(2);
const options = {
  action: args[0] ?? 'scan',
  verbose: args.includes('--verbose')
};

(async () => {
  console.log('lukuid node cli');
  
  if (options.action === 'scan') {
    console.log('Scanning for devices...');
    const devices = await lukuid.getConnectedDevices();
    
    if (devices.length === 0) {
      console.log('No devices found.');
      return;
    }

    for (const device of devices) {
      console.log(`- ${device.info.id} [${device.info.transport}] (Verified: ${device.info.verified})`);
    }
  } else if (options.action === 'watch') {
    console.log('Watching for devices (Ctrl+C to stop)...');
    lukuid.on('device', ({ kind, device }) => {
       console.log(`Device ${kind}: ${device.info.id} [${device.info.transport}]`);
    });
    await lukuid.startWatching();
  }
})();
