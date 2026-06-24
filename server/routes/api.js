const express = require('express');
const router = express.Router();
const printerService = require('../services/printerService');
const Printer = require('../models/Printer');
const ScanHistory = require('../models/ScanHistory');
const { validateIPRange, scanSingleHost } = require('../services/networkScanner');
const { collectAllPrinterData } = require('../services/snmpCollector');

router.get('/status', (req, res) => {
  res.json({ success: true, timestamp: new Date().toISOString(), service: 'PrintRent API', version: '1.0.0' });
});

router.get('/printers', async (req, res) => {
  try {
    const data = req.query.search
      ? await Printer.search(req.query.search)
      : await printerService.getAllPrintersWithLatestData();
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/printers/:id', async (req, res) => {
  try {
    const detail = await printerService.getPrinterDetail(parseInt(req.params.id));
    if (!detail) return res.status(404).json({ success: false, error: 'Printer not found' });
    res.json({ success: true, data: detail });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/printers', async (req, res) => {
  try {
    const { serial_number, ip_address, hostname, name, brand, model, description, location,
            total_pages, bw_pages, color_pages,
            toner_black, toner_cyan, toner_magenta, toner_yellow } = req.body;
    if (!serial_number || !ip_address) return res.status(400).json({ success: false, error: 'Serial number and IP required' });
    if (await Printer.findBySerial(serial_number)) return res.status(409).json({ success: false, error: 'Serial number already exists' });

    const printer = await Printer.upsert({ serial_number, ip_address, hostname, name, brand, model, description, location });
    await ScanHistory.create({ printer_id: printer.id, total_pages: total_pages || 0, bw_pages: bw_pages || 0, color_pages: color_pages || 0, toner_black, toner_cyan, toner_magenta, toner_yellow, is_online: true });
    res.status(201).json({ success: true, data: printer });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/printers/bulk', async (req, res) => {
  try {
    const { printers } = req.body;
    if (!printers || !Array.isArray(printers) || printers.length === 0)
      return res.status(400).json({ success: false, error: 'Printers array required' });

    const created = [];
    for (const p of printers) {
      const printer = await Printer.upsert({
        serial_number: p.serialNumber, ip_address: p.ip,
        hostname: p.hostname, name: p.name, brand: p.brand,
        model: p.model ? p.model.substring(0, 255) : null,
        description: p.description ? p.description.substring(0, 500) : null,
        location: p.location,
      });
      await ScanHistory.create({
        printer_id: printer.id, total_pages: p.totalPages || 0,
        bw_pages: p.bwPages || 0, color_pages: p.colorPages || 0,
        toner_black: p.tonerLevels?.black, toner_cyan: p.tonerLevels?.cyan,
        toner_magenta: p.tonerLevels?.magenta, toner_yellow: p.tonerLevels?.yellow,
        toner_waste: p.wasteLevel, is_online: true, raw_data: p,
      });
      created.push(printer);
    }
    res.status(201).json({ success: true, message: `${created.length} printers synced`, data: created });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/printers/:id', async (req, res) => {
  try {
    const printer = await Printer.findById(parseInt(req.params.id));
    if (!printer) return res.status(404).json({ success: false, error: 'Printer not found' });
    const { serial_number, ip_address, hostname, name, brand, model, description, location } = req.body;
    await Printer.upsert({
      serial_number: serial_number || printer.serial_number,
      ip_address: ip_address || printer.ip_address,
      hostname: hostname || printer.hostname,
      name: name !== undefined ? name : printer.name,
      brand: brand || printer.brand,
      model: model || printer.model,
      description: description !== undefined ? description : printer.description,
      location: location !== undefined ? location : printer.location,
    });
    const detail = await printerService.getPrinterDetail(printer.id);
    res.json({ success: true, data: detail });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/printers/:id', async (req, res) => {
  try { await Printer.delete(parseInt(req.params.id)); res.json({ success: true, message: 'Deleted' }); }
  catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/printers/:id/history', async (req, res) => {
  try {
    const data = await ScanHistory.findByPrinterId(parseInt(req.params.id), parseInt(req.query.limit) || 50);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/scan', async (req, res) => {
  try {
    const { range } = req.body;
    if (!range) return res.status(400).json({ success: false, error: 'Network range required' });
    if (!validateIPRange(range)) return res.status(400).json({ success: false, error: 'Invalid IP range format' });
    const result = await printerService.scanNetworkRange(range);
    res.json({ success: true, ...result });
  } catch (err) {
    if (err.message === 'A scan is already in progress') return res.status(409).json({ success: false, error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/scan/single', async (req, res) => {
  try {
    const { ip } = req.body;
    if (!ip) return res.status(400).json({ success: false, error: 'IP required' });
    const result = await printerService.scanSinglePrinter(ip);
    res.json({ success: result.success, data: result });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/scan/progress', (req, res) => {
  res.json({ success: true, ...printerService.getScanProgress() });
});

router.post('/test-connection', async (req, res) => {
  try {
    const { ip } = req.body;
    if (!ip) return res.status(400).json({ success: false, error: 'IP required' });
    const hostCheck = await scanSingleHost(ip);
    let snmpData = null;
    if (hostCheck.isAlive && hostCheck.ports.includes(161)) snmpData = await collectAllPrinterData(ip);
    res.json({ success: true, data: { hostCheck, snmp: snmpData } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/discover-serial', async (req, res) => {
  try {
    const { ip } = req.body;
    if (!ip) return res.status(400).json({ success: false, error: 'IP required' });
    const snmp = require('net-snmp');
    const session = snmp.createSession(ip, 'public', { port: 161, retries: 1, timeout: 3000, backoff: 1.0, version: snmp.Version2c });
    const walkOID = (oid) => new Promise((resolve) => {
      const r = [];
      session.walk(oid, 50, (e, v) => { if (!e) v.forEach(x => { if (!snmp.isVarbindError(x)) r.push({ oid: x.oid, value: x.value?.toString() || null }); }); }, (e) => { resolve(r); });
    });
    const trees = [
      '1.3.6.1.2.1.43.5.1.1',    // Printer MIB serial
      '1.3.6.1.2.1.47.1.1.1.1',  // entPhysical table
      '1.3.6.1.4.1.253.8',        // Xerox
      '1.3.6.1.2.1.1',            // System
    ];
    const all = {};
    for (const tree of trees) {
      try {
        const entries = await walkOID(tree);
        if (entries.length > 0) {
          const key = tree;
          all[key] = entries;
        }
      } catch {}
    }
    session.close();
    res.json({ success: true, data: all });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/stats', async (req, res) => {
  try {
    const totalCount = await Printer.getCount();
    const onlineCount = await Printer.getOnlineCount();
    const scans = await ScanHistory.getLatestForAllPrinters();
    const totalPages = scans.reduce((s, r) => s + (r.total_pages || 0), 0);
    const totalBW = scans.reduce((s, r) => s + (r.bw_pages || 0), 0);
    const totalColor = scans.reduce((s, r) => s + (r.color_pages || 0), 0);
    res.json({ success: true, data: {
      totalPrinters: totalCount, onlinePrinters: onlineCount,
      offlinePrinters: totalCount - onlineCount, totalPages, totalBW, totalColor,
    }});
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
