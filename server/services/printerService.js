const Printer = require('../models/Printer');
const ScanHistory = require('../models/ScanHistory');
const { scanNetwork, scanSingleHost } = require('./networkScanner');
const { collectAllPrinterData } = require('./snmpCollector');

const SCAN_STATE = {
  isScanning: false,
  progress: { current: 0, total: 0, status: 'idle' },
  listeners: [],
};

function onScanProgress(cb) {
  SCAN_STATE.listeners.push(cb);
  return () => { SCAN_STATE.listeners = SCAN_STATE.listeners.filter(l => l !== cb); };
}

function notify() {
  for (const l of SCAN_STATE.listeners) l({ ...SCAN_STATE.progress });
}

async function scanNetworkRange(range) {
  if (SCAN_STATE.isScanning) throw new Error('A scan is already in progress');

  SCAN_STATE.isScanning = true;
  SCAN_STATE.progress = { current: 0, total: 0, status: 'scanning_network' };
  notify();

  try {
    SCAN_STATE.progress.status = 'scanning_network';
    notify();

    const devices = await scanNetwork(range);
    const candidates = devices.filter(d => d.isPrinter).map(d => d.ip);

    SCAN_STATE.progress.total = candidates.length;
    SCAN_STATE.progress.status = 'collecting_data';
    notify();

    const results = [];
    for (const ip of candidates) {
      SCAN_STATE.progress.current++;
      notify();

      try {
        const data = await collectAllPrinterData(ip);
        if (data.isAlive && data.serialNumber) {
          const printer = await Printer.upsert({
            serial_number: data.serialNumber, ip_address: data.ip,
            hostname: data.hostname, name: data.name, brand: data.brand,
            model: data.model ? data.model.substring(0, 255) : null,
            description: data.description ? data.description.substring(0, 500) : null,
            location: data.location,
          });

          await ScanHistory.create({
            printer_id: printer.id,
            total_pages: data.totalPages, bw_pages: data.bwPages, color_pages: data.colorPages,
            toner_black: data.tonerLevels?.black, toner_cyan: data.tonerLevels?.cyan,
            toner_magenta: data.tonerLevels?.magenta, toner_yellow: data.tonerLevels?.yellow,
            toner_waste: data.wasteLevel, is_online: true, raw_data: data.rawData,
          });

          results.push({ ip, success: true, serialNumber: data.serialNumber, brand: data.brand, model: data.model });
        } else if (data.isAlive && !data.serialNumber) {
          results.push({ ip, success: false, error: 'SNMP yanit verdi ama seri numarasi bulunamadi' });
        } else {
          results.push({ ip, success: false, error: data.error || 'SNMP not available' });
        }
      } catch (err) {
        results.push({ ip, success: false, error: err.message });
      }
    }

    SCAN_STATE.progress.status = 'completed';
    notify();
    return { totalFound: results.filter(r => r.success).length, totalFailed: results.filter(r => !r.success).length, results };
  } catch (err) {
    SCAN_STATE.progress.status = 'error';
    SCAN_STATE.progress.error = err.message;
    notify();
    throw err;
  } finally {
    SCAN_STATE.isScanning = false;
    setTimeout(() => { SCAN_STATE.progress = { current: 0, total: 0, status: 'idle' }; notify(); }, 3000);
  }
}

async function scanSinglePrinter(ip) {
  try {
    const data = await collectAllPrinterData(ip);
    if (data.isAlive && data.serialNumber) {
      const printer = await Printer.upsert({
        serial_number: data.serialNumber, ip_address: data.ip,
        hostname: data.hostname, name: data.name, brand: data.brand,
        model: data.model ? data.model.substring(0, 255) : null,
        description: data.description ? data.description.substring(0, 500) : null,
        location: data.location,
      });

      await ScanHistory.create({
        printer_id: printer.id,
        total_pages: data.totalPages, bw_pages: data.bwPages, color_pages: data.colorPages,
        toner_black: data.tonerLevels?.black, toner_cyan: data.tonerLevels?.cyan,
        toner_magenta: data.tonerLevels?.magenta, toner_yellow: data.tonerLevels?.yellow,
        toner_waste: data.wasteLevel, is_online: true, raw_data: data.rawData,
      });

      return { success: true, printer, data };
    }
    return { success: false, error: data.error || 'SNMP not available', data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function getAllPrintersWithLatestData() {
  const printers = await Printer.findAll();
  const result = [];
  for (const p of printers) {
    const latest = await ScanHistory.getLatestByPrinterId(p.id);
    result.push({ ...p, latestScan: latest || null });
  }
  return result;
}

async function getPrinterDetail(id) {
  const printer = await Printer.findById(id);
  if (!printer) return null;
  const [history, chartData] = await Promise.all([
    ScanHistory.findByPrinterId(id, 100),
    ScanHistory.getHistoryForChart(id, 90),
  ]);
  return { ...printer, history, chartData };
}

function getScanProgress() {
  return { ...SCAN_STATE.progress, isScanning: SCAN_STATE.isScanning };
}

module.exports = { scanNetworkRange, scanSinglePrinter, getAllPrintersWithLatestData, getPrinterDetail, getScanProgress, onScanProgress };
