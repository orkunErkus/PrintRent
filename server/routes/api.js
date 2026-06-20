const express = require('express');
const router = express.Router();
const printerService = require('../services/printerService');
const Printer = require('../models/Printer');
const ScanHistory = require('../models/ScanHistory');
const User = require('../models/User');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.use('/printers', authMiddleware);
router.use('/stats', authMiddleware);

router.get('/status', (req, res) => {
  res.json({ success: true, timestamp: new Date().toISOString(), service: 'PrintRent API', version: '1.0.0' });
});

router.get('/printers', async (req, res) => {
  try {
    let data;
    if (req.query.search) {
      data = await Printer.search(req.query.search);
    } else {
      data = await printerService.getAllPrintersWithLatestData();
    }
    if (req.user.role !== 'admin') {
      const myIds = await User.getAssignedPrinterIds(req.user.id);
      data = data.filter(p => myIds.includes(p.id));
    }
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/printers/:id', async (req, res) => {
  try {
    const detail = await printerService.getPrinterDetail(parseInt(req.params.id));
    if (!detail) return res.status(404).json({ success: false, error: 'Printer not found' });
    if (req.user.role !== 'admin') {
      const myIds = await User.getAssignedPrinterIds(req.user.id);
      if (!myIds.includes(detail.id)) {
        return res.status(403).json({ success: false, error: 'Bu yaziciya erisim yetkiniz yok' });
      }
    }
    res.json({ success: true, data: detail });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/printers', async (req, res) => {
  try {
    const { serial_number, ip_address, hostname, brand, model, description, location,
            total_pages, bw_pages, color_pages,
            toner_black, toner_cyan, toner_magenta, toner_yellow } = req.body;
    if (!serial_number || !ip_address) return res.status(400).json({ success: false, error: 'Serial number and IP required' });
    if (await Printer.findBySerial(serial_number)) return res.status(409).json({ success: false, error: 'Serial number already exists' });

    const printer = await Printer.upsert({ serial_number, ip_address, hostname, brand, model, description, location });
    await ScanHistory.create({ printer_id: printer.id, total_pages: total_pages || 0, bw_pages: bw_pages || 0, color_pages: color_pages || 0, toner_black, toner_cyan, toner_magenta, toner_yellow, is_online: true });

    if (req.user.role !== 'admin') {
      await User.addPrinterToUser(req.user.id, printer.id);
    }

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
        hostname: p.hostname, brand: p.brand,
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
      if (req.user.role !== 'admin') {
        await User.addPrinterToUser(req.user.id, printer.id);
      }
      created.push(printer);
    }

    res.status(201).json({ success: true, message: `${created.length} printers synced`, data: created });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/printers/:id', async (req, res) => {
  try {
    const printer = await Printer.findById(parseInt(req.params.id));
    if (!printer) return res.status(404).json({ success: false, error: 'Printer not found' });

    if (req.user.role !== 'admin') {
      const myIds = await User.getAssignedPrinterIds(req.user.id);
      if (!myIds.includes(printer.id)) {
        return res.status(403).json({ success: false, error: 'Bu yaziciya erisim yetkiniz yok' });
      }
    }

    const { serial_number, ip_address, hostname, brand, model, description, location,
            total_pages, bw_pages, color_pages,
            toner_black, toner_cyan, toner_magenta, toner_yellow, is_online } = req.body;

    await Printer.upsert({
      serial_number: serial_number || printer.serial_number,
      ip_address: ip_address || printer.ip_address,
      hostname: hostname || printer.hostname,
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
  try {
    if (req.user.role !== 'admin') {
      const myIds = await User.getAssignedPrinterIds(req.user.id);
      if (!myIds.includes(parseInt(req.params.id))) {
        return res.status(403).json({ success: false, error: 'Bu yaziciya erisim yetkiniz yok' });
      }
    }
    await Printer.delete(parseInt(req.params.id));
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/printers/:id/history', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      const myIds = await User.getAssignedPrinterIds(req.user.id);
      if (!myIds.includes(parseInt(req.params.id))) {
        return res.status(403).json({ success: false, error: 'Bu yaziciya erisim yetkiniz yok' });
      }
    }
    const data = await ScanHistory.findByPrinterId(parseInt(req.params.id), parseInt(req.query.limit) || 50);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/stats', async (req, res) => {
  try {
    let printerIds = null;
    if (req.user.role !== 'admin') {
      printerIds = await User.getAssignedPrinterIds(req.user.id);
    }
    const totalCount = printerIds ? printerIds.length : await Printer.getCount();
    const onlineCount = printerIds
      ? (await Printer.findByMultipleIds(printerIds)).filter(p => p.is_online).length
      : await Printer.getOnlineCount();
    const scans = await ScanHistory.getLatestForAllPrinters();
    const filteredScans = printerIds ? scans.filter(s => printerIds.includes(s.printer_id)) : scans;
    const totalPages = filteredScans.reduce((s, r) => s + (r.total_pages || 0), 0);
    const totalBW = filteredScans.reduce((s, r) => s + (r.bw_pages || 0), 0);
    const totalColor = filteredScans.reduce((s, r) => s + (r.color_pages || 0), 0);
    res.json({ success: true, data: {
      totalPrinters: totalCount, onlinePrinters: onlineCount,
      offlinePrinters: totalCount - onlineCount, totalPages, totalBW, totalColor,
    }});
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/admin/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const users = await User.findAll();
    res.json({ success: true, data: users });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/admin/printers/all', authMiddleware, adminOnly, async (req, res) => {
  try {
    const data = req.query.search
      ? await Printer.search(req.query.search)
      : await printerService.getAllPrintersWithLatestData();
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
