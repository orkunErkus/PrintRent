const { query, getRow, execute } = require('../config/database');

class Printer {
  static async findAll() {
    return query('SELECT * FROM printers ORDER BY last_seen DESC');
  }

  static async findById(id) {
    return getRow('SELECT * FROM printers WHERE id = ?', [id]);
  }

  static async findBySerial(serial) {
    return getRow('SELECT * FROM printers WHERE serial_number = ?', [serial]);
  }

  static async findByIp(ip) {
    return getRow('SELECT * FROM printers WHERE ip_address = ?', [ip]);
  }

  static async upsert(printerData) {
    const { serial_number, ip_address, hostname, brand, model, description, location } = printerData;

    const result = await execute(`
      INSERT INTO printers (serial_number, ip_address, hostname, brand, model, description, location, is_online)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      ON DUPLICATE KEY UPDATE
        ip_address = VALUES(ip_address),
        hostname = VALUES(hostname),
        brand = VALUES(brand),
        model = VALUES(model),
        description = VALUES(description),
        location = VALUES(location),
        last_seen = CURRENT_TIMESTAMP,
        is_online = 1
    `, [serial_number, ip_address, hostname || null, brand || null, model || null,
        description || null, location || null]);

    if (result.insertId) {
      return this.findById(result.insertId);
    }
    return this.findBySerial(serial_number);
  }

  static async markOffline(id) {
    await execute('UPDATE printers SET is_online = 0 WHERE id = ?', [id]);
  }

  static async markOnline(id) {
    await execute('UPDATE printers SET is_online = 1, last_seen = CURRENT_TIMESTAMP WHERE id = ?', [id]);
  }

  static async delete(id) {
    await execute('DELETE FROM printers WHERE id = ?', [id]);
  }

  static async getCount() {
    const row = await getRow('SELECT COUNT(*) as count FROM printers');
    return row || { count: 0 };
  }

  static async getOnlineCount() {
    const row = await getRow('SELECT COUNT(*) as count FROM printers WHERE is_online = 1');
    return row || { count: 0 };
  }

  static async search(queryStr) {
    const like = `%${queryStr}%`;
    return query(`
      SELECT * FROM printers
      WHERE serial_number LIKE ? OR ip_address LIKE ? OR brand LIKE ? OR model LIKE ?
      ORDER BY last_seen DESC
    `, [like, like, like, like]);
  }
}

module.exports = Printer;
