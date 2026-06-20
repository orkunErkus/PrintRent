const Printer = require('../models/Printer');
const ScanHistory = require('../models/ScanHistory');

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

module.exports = { getAllPrintersWithLatestData, getPrinterDetail };
