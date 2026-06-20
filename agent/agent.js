const fs = require('fs');
const path = require('path');
const os = require('os');
const express = require('express');
const cors = require('cors');
const { scanNetwork, validateIPRange } = require('./services/networkScanner');
const { collect } = require('./services/snmpCollector');

try {
  const env = path.join(__dirname, '.env');
  if (fs.existsSync(env)) {
    for (const line of fs.readFileSync(env, 'utf8').split('\n')) {
      const t = line.trim();
      if (t && !t.startsWith('#')) { const i = t.indexOf('='); if (i > 0) process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim(); }
    }
  }
} catch {}

const app = express();
const PORT = process.env.AGENT_PORT || 3001;
const HOSTINGER_URL = process.env.HOSTINGER_URL || 'http://localhost:3000';
const localIP = (() => { const i = os.networkInterfaces(); for (const n of Object.keys(i)) for (const a of i[n]) if (a.family === 'IPv4' && !a.internal) return a.address; return '127.0.0.1'; })();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const scanState = { running: false, current: 0, total: 0, status: 'idle' };

app.get('/api/status', (_, res) => res.json({ success: true, service: 'PrintRent Agent', version: '1.0.0', ip: localIP, hostingerUrl: HOSTINGER_URL }));

app.get('/api/scan/progress', (_, res) => res.json({ success: true, ...scanState, running: scanState.running }));

app.post('/api/scan', async (req, res) => {
  if (scanState.running) return res.status(409).json({ success: false, error: 'Zaten tarama yapiliyor' });
  const { range } = req.body;
  if (!range) return res.status(400).json({ success: false, error: 'IP araligi gerekli' });
  if (!validateIPRange(range)) return res.status(400).json({ success: false, error: 'Gecersiz IP araligi' });

  scanState.running = true; scanState.current = 0; scanState.total = 0; scanState.status = 'scanning_network';
  try {
    const devices = await scanNetwork(range);
    const ips = devices.filter(d => d.isPrinter).map(d => d.ip);
    scanState.total = ips.length; scanState.status = 'collecting_data';
    const results = [];
    for (const ip of ips) {
      scanState.current++;
      const data = await collect(ip);
      if (data.isAlive && data.serialNumber) results.push({ success: true, data });
      else results.push({ success: false, ip, error: data.error || 'Seri no bulunamadi' });
    }
    const ok = results.filter(r => r.success).map(r => r.data);
    if (ok.length > 0) {
      try { await fetch(`${HOSTINGER_URL}/api/printers/bulk`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ printers: ok }) }); } catch (e) { console.error('Sync error:', e.message); }
    }
    scanState.status = 'completed';
    res.json({ success: true, totalFound: ok.length, totalFailed: results.length - ok.length, results });
  } catch (e) {
    scanState.status = 'error';
    res.status(500).json({ success: false, error: e.message });
  } finally {
    scanState.running = false;
    setTimeout(() => { scanState.current = 0; scanState.total = 0; scanState.status = 'idle'; }, 3000);
  }
});

app.get('*', (_, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  PrintRent Agent`);
  console.log(`  Local: http://localhost:${PORT}`);
  console.log(`  Network: http://${localIP}:${PORT}`);
  console.log(`  Sync to: ${HOSTINGER_URL}\n`);
});
