const db = require('../config/database');

class Printer {
  static async findAll() {
    return db.query('SELECT * FROM printers ORDER BY last_seen DESC');
  }

  static async findById(id) {
    return db.queryOne('SELECT * FROM printers WHERE id = ?', [id]);
  }

  static async findBySerial(serial) {
    return db.queryOne('SELECT * FROM printers WHERE serial_number = ?', [serial]);
  }

  static async findByIp(ip) {
    return db.queryOne('SELECT * FROM printers WHERE ip_address = ?', [ip]);
  }

  static async upsert(data) {
    const { serial_number, ip_address, hostname, name, brand, model, description, location } = data;
    const existing = await this.findBySerial(serial_number);
    if (existing) {
      await db.query(`UPDATE printers SET ip_address=?, hostname=?, name=?, brand=?, model=?,
        description=?, location=?, last_seen=NOW(), is_online=1 WHERE serial_number=?`,
        [ip_address, hostname || null, name || null, brand || null, model || null, description || null, location || null, serial_number]);
      return this.findBySerial(serial_number);
    }
    const id = await db.insert(`INSERT INTO printers
      (serial_number, ip_address, hostname, name, brand, model, description, location, is_online)
      VALUES (?,?,?,?,?,?,?,?,1)`,
      [serial_number, ip_address, hostname || null, name || null, brand || null, model || null, description || null, location || null]);
    return this.findById(id);
  }

  static async markOffline(id) {
    await db.query('UPDATE printers SET is_online=0 WHERE id=?', [id]);
  }

  static async bulkUpsert(printers) {
    const results = [];
    for (const p of printers) {
      const printer = await this.upsert({
        serial_number: p.serialNumber, ip_address: p.ip, hostname: p.hostname, name: p.name,
        brand: p.brand, model: p.model ? p.model.substring(0, 255) : null,
        description: p.description ? p.description.substring(0, 500) : null, location: p.location,
      });
      results.push(printer);
    }
    return results;
  }

  static async delete(id) {
    await db.query('DELETE FROM printers WHERE id=?', [id]);
  }

  static async getCount() {
    const r = await db.queryOne('SELECT COUNT(*) as count FROM printers');
    return r.count;
  }

  static async getOnlineCount() {
    const r = await db.queryOne('SELECT COUNT(*) as count FROM printers WHERE is_online=1');
    return r.count;
  }

  static async findByMultipleIds(ids) {
    if (!ids || ids.length === 0) return [];
    const placeholders = ids.map(() => '?').join(',');
    return db.query(`SELECT * FROM printers WHERE id IN (${placeholders})`, ids);
  }

  static async search(q) {
    const like = `%${q}%`;
    return db.query('SELECT * FROM printers WHERE serial_number LIKE ? OR ip_address LIKE ? OR brand LIKE ? OR model LIKE ? ORDER BY last_seen DESC',
      [like, like, like, like]);
  }
}

module.exports = Printer;
