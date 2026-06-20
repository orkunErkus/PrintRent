const mysql = require('mysql2/promise');

let pool = null;

async function getPool() {
  if (pool) return pool;
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'printrent',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
  return pool;
}

async function initializeSchema() {
  const p = await getPool();
  await p.execute(`CREATE TABLE IF NOT EXISTS printers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    serial_number VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45) NOT NULL,
    hostname VARCHAR(255),
    brand VARCHAR(100),
    model VARCHAR(255),
    description TEXT,
    location VARCHAR(255),
    first_discovered DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_online TINYINT DEFAULT 0,
    INDEX idx_serial (serial_number),
    INDEX idx_ip (ip_address)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await p.execute(`CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user','admin') DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await p.execute(`CREATE TABLE IF NOT EXISTS user_printers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    printer_id INT NOT NULL,
    UNIQUE KEY uq_user_printer (user_id, printer_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (printer_id) REFERENCES printers(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await p.execute(`CREATE TABLE IF NOT EXISTS scan_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    printer_id INT NOT NULL,
    scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_pages INT DEFAULT 0,
    bw_pages INT DEFAULT 0,
    color_pages INT DEFAULT 0,
    toner_black INT,
    toner_cyan INT,
    toner_magenta INT,
    toner_yellow INT,
    toner_waste INT,
    is_online TINYINT DEFAULT 0,
    raw_data JSON,
    FOREIGN KEY (printer_id) REFERENCES printers(id) ON DELETE CASCADE,
    INDEX idx_printer_id (printer_id),
    INDEX idx_scanned_at (scanned_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}

async function query(sql, params = []) {
  const p = await getPool();
  const [rows] = await p.execute(sql, params);
  return rows;
}

async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

async function insert(sql, params = []) {
  const p = await getPool();
  const [result] = await p.execute(sql, params);
  return result.insertId;
}

async function initialize() {
  await getPool();
  await initializeSchema();
  console.log('  MySQL baglantisi basarili');
}

async function closeDatabase() {
  if (pool) { await pool.end(); pool = null; }
}

module.exports = { query, queryOne, insert, initialize, closeDatabase, getPool };
