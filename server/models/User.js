const db = require('../config/database');

class User {
  static async findAll() {
    return db.query('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC');
  }

  static async findById(id) {
    return db.queryOne('SELECT id, username, role, created_at FROM users WHERE id = ?', [id]);
  }

  static async findByUsername(username) {
    return db.queryOne('SELECT * FROM users WHERE username = ?', [username]);
  }

  static async create({ username, password, role = 'user' }) {
    const id = await db.insert(
      'INSERT INTO users (username, password, role) VALUES (?,?,?)',
      [username, password, role]
    );
    return this.findById(id);
  }

  static async getAssignedPrinterIds(userId) {
    const rows = await db.query('SELECT printer_id FROM user_printers WHERE user_id = ?', [userId]);
    return rows.map(r => r.printer_id);
  }

  static async assignPrinters(userId, printerIds) {
    await db.query('DELETE FROM user_printers WHERE user_id = ?', [userId]);
    for (const pid of printerIds) {
      await db.insert('INSERT INTO user_printers (user_id, printer_id) VALUES (?,?)', [userId, pid]);
    }
  }

  static async addPrinterToUser(userId, printerId) {
    const existing = await db.queryOne(
      'SELECT id FROM user_printers WHERE user_id = ? AND printer_id = ?',
      [userId, printerId]
    );
    if (!existing) {
      await db.insert('INSERT INTO user_printers (user_id, printer_id) VALUES (?,?)', [userId, printerId]);
    }
  }
}

module.exports = User;
