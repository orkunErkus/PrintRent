const { query, getRow, execute } = require('../config/database');

class ScanHistory {
  static async create(data) {
    const result = await execute(`
      INSERT INTO scan_history
        (printer_id, total_pages, bw_pages, color_pages,
         toner_black, toner_cyan, toner_magenta, toner_yellow, toner_waste,
         is_online, raw_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.printer_id, data.total_pages || 0, data.bw_pages || 0, data.color_pages || 0,
      data.toner_black, data.toner_cyan, data.toner_magenta, data.toner_yellow, data.toner_waste,
      data.is_online ? 1 : 0, data.raw_data ? JSON.stringify(data.raw_data) : null,
    ]);
    return result.insertId;
  }

  static async findByPrinterId(printerId, limit = 50) {
    return query(`
      SELECT * FROM scan_history
      WHERE printer_id = ?
      ORDER BY scanned_at DESC
      LIMIT ?
    `, [printerId, limit]);
  }

  static async getLatestByPrinterId(printerId) {
    return getRow(`
      SELECT * FROM scan_history
      WHERE printer_id = ?
      ORDER BY scanned_at DESC
      LIMIT 1
    `, [printerId]);
  }

  static async getHistoryForChart(printerId, days = 30) {
    return query(`
      SELECT scanned_at, total_pages, bw_pages, color_pages,
             toner_black, toner_cyan, toner_magenta, toner_yellow
      FROM scan_history
      WHERE printer_id = ? AND scanned_at >= NOW() - INTERVAL ? DAY
      ORDER BY scanned_at ASC
    `, [printerId, days]);
  }

  static async deleteOlderThan(days) {
    const result = await execute(
      'DELETE FROM scan_history WHERE scanned_at < NOW() - INTERVAL ? DAY',
      [days]
    );
    return result.affectedRows;
  }

  static async getLatestForAllPrinters() {
    return query(`
      SELECT sh.*, p.serial_number, p.ip_address, p.brand, p.model, p.hostname, p.is_online as printer_online
      FROM scan_history sh
      INNER JOIN (
        SELECT printer_id, MAX(scanned_at) as max_scanned
        FROM scan_history
        GROUP BY printer_id
      ) latest ON sh.printer_id = latest.printer_id AND sh.scanned_at = latest.max_scanned
      JOIN printers p ON sh.printer_id = p.id
      ORDER BY p.last_seen DESC
    `);
  }
}

module.exports = ScanHistory;
