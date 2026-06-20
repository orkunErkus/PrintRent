const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const app = require('./app');
const { initialize, closeDatabase, queryOne, insert } = require('./config/database');

try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) process.env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
      }
    }
  }
} catch {}

const PORT = process.env.PORT || 3000;

initialize()
  .then(async () => {
    const adminUser = await queryOne('SELECT id FROM users WHERE username = ?', ['admin']);
    if (!adminUser) {
      const hashed = await bcrypt.hash('admin123', 10);
      await insert('INSERT INTO users (username, password, role) VALUES (?,?,?)', ['admin', hashed, 'admin']);
      console.log('  Varsayilan admin kullanici olusturuldu (admin / admin123)');
    }
    app.listen(PORT, () => {
      console.log(`\n  🖨️  PrintRent Server (Hostinger)`);
      console.log(`  ─────────────────────────────`);
      console.log(`  URL:  http://localhost:${PORT}`);
      console.log(`  Mode: ${process.env.NODE_ENV || 'production'}\n`);
    });
  })
  .catch(err => {
    console.error('Failed to start:', err);
    process.exit(1);
  });

process.on('SIGINT', () => { closeDatabase(); process.exit(0); });
process.on('SIGTERM', () => { closeDatabase(); process.exit(0); });
