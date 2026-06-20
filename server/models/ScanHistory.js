const db = require('../config/database');

class ScanHistory {
  static async create(data) {
    return db.insert(`INSERT INTO scan_history
      (printer_id, total_pages, bw_pages, color_pages,
       toner_black, toner_cyan, toner_magenta, toner_yellow, toner_waste, is_online, raw_data)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [data.printer_id, data.total_pages || 0, data.bw_pages || 0, data.color_pages || 0,
       data.toner_black, data.toner_cyan, data.toner_magenta, data.toner_yellow, data.toner_waste,
       data.is_online ? 1 : 0, data.raw_data ? JSON.stringify(data.raw_data) : null]);
  }

  static async bulkCreate(records) {
    const results = [];
    for (const r of records) {
      const id = await this.create(r);
      results.push(id);
    }
    return results;
  }

  static async findByPrinterId(printerId, limit = 50) {
    return db.query('SELECT * FROM scan_history WHERE printer_id=? ORDER BY scanned_at DESC LIMIT ?', [printerId, limit]);
  }

  static async getLatestByPrinterId(printerId) {
    return db.queryOne('SELECT * FROM scan_history WHERE printer_id=? ORDER BY scanned_at DESC LIMIT 1', [printerId]);
  }

  static async getHistoryForChart(printerId, days = 30) {
    return db.query(`SELECT scanned_at, total_pages, bw_pages, color_pages,
      toner_black, toner_cyan, toner_magenta, toner_yellow
      FROM scan_history WHERE printer_id=? AND scanned_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      ORDER BY scanned_at ASC`, [printerId, days]);
  }

  static async deleteOlderThan(days) {
    return db.query("DELETE FROM scan_history WHERE scanned_at < DATE_SUB(NOW(), INTERVAL ? DAY)", [days]);
  }

  static async getLatestForAllPrinters() {
    return db.query(`SELECT sh.*, p.serial_number, p.ip_address, p.brand, p.model,
      p.hostname, p.is_online as printer_online
      FROM scan_history sh
      INNER JOIN (
        SELECT printer_id, MAX(scanned_at) as max_scanned
        FROM scan_history GROUP BY printer_id
      ) latest ON sh.printer_id = latest.printer_id AND sh.scanned_at = latest.max_scanned
      JOIN printers p ON sh.printer_id = p.id
      ORDER BY p.last_seen DESC`);
  }
}

module.exports = ScanHistory;
