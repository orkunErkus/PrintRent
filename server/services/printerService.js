const Printer = require('../models/Printer');
const ScanHistory = require('../models/ScanHistory');
const { scanNetwork, scanSingleHost } = require('./networkScanner');
const { collectAllPrinterData } = require('./snmpCollector');

const SCAN_STATE = {
  isScanning: false,
  progress: { current: 0, total: 0, status: 'idle' },
  listeners: [],
};

function onScanProgress(callback) {
  SCAN_STATE.listeners.push(callback);
  return () => {
    SCAN_STATE.listeners = SCAN_STATE.listeners.filter(l => l !== callback);
  };
}

function notifyListeners() {
  for (const listener of SCAN_STATE.listeners) {
    listener({ ...SCAN_STATE.progress });
  }
}

async function scanNetworkRange(range) {
  if (SCAN_STATE.isScanning) {
    throw new Error('A scan is already in progress');
  }

  SCAN_STATE.isScanning = true;
  SCAN_STATE.progress = { current: 0, total: 0, status: 'scanning_network' };
  notifyListeners();

  try {
    SCAN_STATE.progress.status = 'scanning_network';
    notifyListeners();

    const devices = await scanNetwork(range);
    const printerCandidates = devices.filter(d => d.isPrinter).map(d => d.ip);

    SCAN_STATE.progress.total = printerCandidates.length;
    SCAN_STATE.progress.status = 'collecting_data';
    notifyListeners();

    const results = [];
    for (const ip of printerCandidates) {
      SCAN_STATE.progress.current++;
      SCAN_STATE.progress.status = 'collecting_data';
      notifyListeners();

      try {
        const data = await collectAllPrinterData(ip);
        if (data.isAlive && data.serialNumber) {
          const printer = await Printer.upsert({
            serial_number: data.serialNumber,
            ip_address: data.ip,
            hostname: data.hostname,
            brand: data.brand,
            model: data.model ? data.model.substring(0, 255) : null,
            description: data.description ? data.description.substring(0, 500) : null,
            location: data.location,
          });

          await ScanHistory.create({
            printer_id: printer.id,
            total_pages: data.totalPages,
            bw_pages: data.bwPages,
            color_pages: data.colorPages,
            toner_black: data.tonerLevels ? data.tonerLevels.black : null,
            toner_cyan: data.tonerLevels ? data.tonerLevels.cyan : null,
            toner_magenta: data.tonerLevels ? data.tonerLevels.magenta : null,
            toner_yellow: data.tonerLevels ? data.tonerLevels.yellow : null,
            toner_waste: data.wasteLevel,
            is_online: true,
            raw_data: data.rawData,
          });

          results.push({ ip, success: true, serialNumber: data.serialNumber, brand: data.brand, model: data.model });
        } else if (data.isAlive && !data.serialNumber) {
          results.push({ ip, success: false, error: 'SNMP available but no serial number found', detail: data });
        } else {
          results.push({ ip, success: false, error: data.error || 'SNMP not available' });
        }
      } catch (err) {
        results.push({ ip, success: false, error: err.message });
      }
    }

    SCAN_STATE.progress.status = 'completed';
    notifyListeners();

    return {
      totalFound: results.filter(r => r.success).length,
      totalFailed: results.filter(r => !r.success).length,
      results,
    };
  } catch (error) {
    SCAN_STATE.progress.status = 'error';
    SCAN_STATE.progress.error = error.message;
    notifyListeners();
    throw error;
  } finally {
    SCAN_STATE.isScanning = false;
    setTimeout(() => {
      SCAN_STATE.progress = { current: 0, total: 0, status: 'idle' };
      notifyListeners();
    }, 3000);
  }
}

async function scanSinglePrinter(ip) {
  try {
    const data = await collectAllPrinterData(ip);
    if (data.isAlive && data.serialNumber) {
      const printer = await Printer.upsert({
        serial_number: data.serialNumber,
        ip_address: data.ip,
        hostname: data.hostname,
        brand: data.brand,
        model: data.model ? data.model.substring(0, 255) : null,
        description: data.description ? data.description.substring(0, 500) : null,
        location: data.location,
      });

      await ScanHistory.create({
        printer_id: printer.id,
        total_pages: data.totalPages,
        bw_pages: data.bwPages,
        color_pages: data.colorPages,
        toner_black: data.tonerLevels ? data.tonerLevels.black : null,
        toner_cyan: data.tonerLevels ? data.tonerLevels.cyan : null,
        toner_magenta: data.tonerLevels ? data.tonerLevels.magenta : null,
        toner_yellow: data.tonerLevels ? data.tonerLevels.yellow : null,
        toner_waste: data.wasteLevel,
        is_online: true,
        raw_data: data.rawData,
      });

      return { success: true, printer, data };
    }
    return { success: false, error: data.error || 'SNMP not available', data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getAllPrintersWithLatestData() {
  const printers = await Printer.findAll();

  const result = [];
  for (const printer of printers) {
    const latestHistory = await ScanHistory.getLatestByPrinterId(printer.id);
    result.push({
      ...printer,
      latestScan: latestHistory || null,
    });
  }

  return result;
}

async function getPrinterDetail(printerId) {
  const printer = await Printer.findById(printerId);
  if (!printer) return null;

  const history = await ScanHistory.findByPrinterId(printerId, 100);
  const chartData = await ScanHistory.getHistoryForChart(printerId, 90);

  return {
    ...printer,
    history,
    chartData,
  };
}

function getScanProgress() {
  return { ...SCAN_STATE.progress, isScanning: SCAN_STATE.isScanning };
}

module.exports = {
  scanNetworkRange,
  scanSinglePrinter,
  getAllPrintersWithLatestData,
  getPrinterDetail,
  getScanProgress,
  onScanProgress,
};
