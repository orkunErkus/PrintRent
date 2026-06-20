const fs = require('fs');
const path = require('path');
const os = require('os');
const express = require('express');
const cors = require('cors');

try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) process.env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
      }
    }
  }
} catch {}
const { scanNetwork, validateIPRange } = require('./services/networkScanner');
const { collectAllPrinterData } = require('./services/snmpCollector');

const app = express();
const PORT = process.env.AGENT_PORT || 3001;
const HOSTINGER_API_URL = process.env.HOSTINGER_URL || 'http://localhost:3000';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use(express.static(__dirname + '/public'));

function getLocalIP() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces))
    for (const iface of ifaces[name])
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
  return '127.0.0.1';
}

const SCAN_STATE = { isScanning: false, progress: { current: 0, total: 0, status: 'idle' } };

app.get('/api/status', (req, res) => {
  res.json({ success: true, service: 'PrintRent Agent', version: '1.0.0', ip: getLocalIP(), port: PORT, hostingerUrl: HOSTINGER_API_URL });
});

app.get('/api/scan/progress', (req, res) => {
  res.json({ success: true, ...SCAN_STATE.progress, isScanning: SCAN_STATE.isScanning });
});

app.post('/api/scan', async (req, res) => {
  if (SCAN_STATE.isScanning) return res.status(409).json({ success: false, error: 'Scan already in progress' });
  const { range } = req.body;
  if (!range) return res.status(400).json({ success: false, error: 'Network range required' });
  if (!validateIPRange(range)) return res.status(400).json({ success: false, error: 'Invalid IP range format' });

  SCAN_STATE.isScanning = true;
  SCAN_STATE.progress = { current: 0, total: 0, status: 'scanning_network' };

  try {
    const devices = await scanNetwork(range);
    const candidates = devices.filter(d => d.isPrinter).map(d => d.ip);

    SCAN_STATE.progress.total = candidates.length;
    SCAN_STATE.progress.status = 'collecting_data';

    const results = [];
    for (const ip of candidates) {
      SCAN_STATE.progress.current++;
      const data = await collectAllPrinterData(ip);
      if (data.isAlive && data.serialNumber) {
        results.push({ success: true, data });
      } else {
        results.push({ success: false, ip, error: data.error || 'No serial number' });
      }
    }

    const successful = results.filter(r => r.success).map(r => r.data);

    if (successful.length > 0) {
      try {
        const syncRes = await fetch(`${HOSTINGER_API_URL}/api/printers/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ printers: successful }),
        });
        if (!syncRes.ok) throw new Error(`Hostinger returned ${syncRes.status}`);
      } catch (syncErr) {
        console.error('Sync to Hostinger failed:', syncErr.message);
      }
    }

    SCAN_STATE.progress.status = 'completed';
    res.json({ success: true, totalFound: successful.length, totalFailed: results.length - successful.length, results });
  } catch (err) {
    SCAN_STATE.progress.status = 'error';
    SCAN_STATE.progress.error = err.message;
    res.status(500).json({ success: false, error: err.message });
  } finally {
    SCAN_STATE.isScanning = false;
    setTimeout(() => { SCAN_STATE.progress = { current: 0, total: 0, status: 'idle' }; }, 3000);
  }
});

app.get('*', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  🖨️  PrintRent Local Agent`);
  console.log(`  ─────────────────────────`);
  console.log(`  Local:    http://localhost:${PORT}`);
  console.log(`  Network:  http://${getLocalIP()}:${PORT}`);
  console.log(`  Sync to:  ${HOSTINGER_API_URL}`);
  console.log(`  ─────────────────────────`);
  console.log(`  Telefon:  http://${getLocalIP()}:${PORT}\n`);
});
