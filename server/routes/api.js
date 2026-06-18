const express = require('express');
const router = express.Router();
const printerService = require('../services/printerService');
const Printer = require('../models/Printer');
const ScanHistory = require('../models/ScanHistory');
const { validateIPRange, scanSingleHost } = require('../services/networkScanner');
const { collectAllPrinterData } = require('../services/snmpCollector');

router.get('/status', (req, res) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    service: 'PrintRent API',
    version: '1.0.0',
  });
});

router.get('/printers', async (req, res) => {
  try {
    const { search } = req.query;
    const printers = search
      ? await Printer.search(search)
      : await printerService.getAllPrintersWithLatestData();
    res.json({ success: true, data: printers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/printers/:id', async (req, res) => {
  try {
    const detail = await printerService.getPrinterDetail(parseInt(req.params.id));
    if (!detail) {
      return res.status(404).json({ success: false, error: 'Printer not found' });
    }
    res.json({ success: true, data: detail });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/printers/:id', async (req, res) => {
  try {
    await Printer.delete(parseInt(req.params.id));
    res.json({ success: true, message: 'Printer deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/printers/:id/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const history = await ScanHistory.findByPrinterId(parseInt(req.params.id), limit);
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/scan', async (req, res) => {
  try {
    const { range } = req.body;

    if (!range) {
      return res.status(400).json({ success: false, error: 'Network range is required (e.g., 192.168.1.0/24)' });
    }

    if (!validateIPRange(range)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid IP range format. Use: 192.168.1.1, 192.168.1.0/24, or 192.168.1.1-192.168.1.254',
      });
    }

    const result = await printerService.scanNetworkRange(range);
    res.json({ success: true, ...result });
  } catch (error) {
    if (error.message === 'A scan is already in progress') {
      return res.status(409).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/scan/single', async (req, res) => {
  try {
    const { ip } = req.body;
    if (!ip) {
      return res.status(400).json({ success: false, error: 'IP address is required' });
    }
    const result = await printerService.scanSinglePrinter(ip);
    res.json({ success: result.success, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/scan/progress', (req, res) => {
  const progress = printerService.getScanProgress();
  res.json({ success: true, ...progress });
});

router.post('/test-connection', async (req, res) => {
  try {
    const { ip } = req.body;
    if (!ip) {
      return res.status(400).json({ success: false, error: 'IP address is required' });
    }

    const hostCheck = await scanSingleHost(ip);
    let snmpData = null;

    if (hostCheck.isAlive && hostCheck.ports.includes(161)) {
      snmpData = await collectAllPrinterData(ip);
    }

    res.json({ success: true, data: { hostCheck, snmp: snmpData } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const [totalPrinters, onlinePrinters, latestScans] = await Promise.all([
      Printer.getCount(),
      Printer.getOnlineCount(),
      ScanHistory.getLatestForAllPrinters(),
    ]);

    const totalPages = latestScans.reduce((sum, s) => sum + (s.total_pages || 0), 0);
    const totalBW = latestScans.reduce((sum, s) => sum + (s.bw_pages || 0), 0);
    const totalColor = latestScans.reduce((sum, s) => sum + (s.color_pages || 0), 0);

    res.json({
      success: true,
      data: {
        totalPrinters: totalPrinters.count,
        onlinePrinters: onlinePrinters.count,
        offlinePrinters: totalPrinters.count - onlinePrinters.count,
        totalPages,
        totalBW,
        totalColor,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
