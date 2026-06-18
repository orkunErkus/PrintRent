const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');

let pool = null;

function getPool() {
  if (!pool) throw new Error('Database not initialized. Call initializeDatabase() first.');
  return pool;
}

function buildConfig(database) {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    charset: 'utf8mb4',
    timezone: '+00:00',
    connectTimeout: 10000,
  };

  if (database) config.database = database;

  if (process.env.DB_SSL === 'true') {
    config.ssl = { rejectUnauthorized: false };
  }

  return config;
}

async function initializeDatabase() {
  const dbName = process.env.DB_NAME || 'printrent';

  try {
    pool = mysql.createPool({
      ...buildConfig(dbName),
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    });

    const conn = await pool.getConnection();
    conn.release();
  } catch (err) {
    if (err.code === 'ER_BAD_DB_ERROR') {
      const initConn = await mysql.createConnection(buildConfig());
      await initConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      await initConn.end();

      pool = mysql.createPool({
        ...buildConfig(dbName),
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
      });
    } else {
      throw err;
    }
  }

  await createTables();
  return pool;
}

async function createIndexIfNotExists(conn, table, indexName, columns) {
  try {
    await conn.query(`CREATE INDEX \`${indexName}\` ON \`${table}\` (${columns})`);
  } catch (err) {
    if (err.errno !== 1061) throw err;
  }
}

async function createTables() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS printers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        serial_number VARCHAR(255) NOT NULL UNIQUE,
        ip_address VARCHAR(45) NOT NULL,
        hostname VARCHAR(255) DEFAULT NULL,
        brand VARCHAR(100) DEFAULT NULL,
        model VARCHAR(255) DEFAULT NULL,
        description TEXT DEFAULT NULL,
        location VARCHAR(255) DEFAULT NULL,
        first_discovered DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        is_online TINYINT(1) DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS scan_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        printer_id INT NOT NULL,
        scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        total_pages INT DEFAULT 0,
        bw_pages INT DEFAULT 0,
        color_pages INT DEFAULT 0,
        toner_black INT DEFAULT NULL,
        toner_cyan INT DEFAULT NULL,
        toner_magenta INT DEFAULT NULL,
        toner_yellow INT DEFAULT NULL,
        toner_waste INT DEFAULT NULL,
        is_online TINYINT(1) DEFAULT 0,
        raw_data JSON DEFAULT NULL,
        FOREIGN KEY (printer_id) REFERENCES printers(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await createIndexIfNotExists(conn, 'scan_history', 'idx_scan_history_printer_id', 'printer_id');
    await createIndexIfNotExists(conn, 'scan_history', 'idx_scan_history_scanned_at', 'scanned_at');
    await createIndexIfNotExists(conn, 'printers', 'idx_printers_serial', 'serial_number');
    await createIndexIfNotExists(conn, 'printers', 'idx_printers_ip', 'ip_address');
  } finally {
    conn.release();
  }
}

async function query(sql, params = []) {
  const p = getPool();
  const [rows] = await p.query(sql, params);
  return rows;
}

async function getRow(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0];
}

async function execute(sql, params = []) {
  const p = getPool();
  const [result] = await p.execute(sql, params);
  return result;
}

async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = { initializeDatabase, getPool, query, getRow, execute, closeDatabase };
