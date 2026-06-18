require('dotenv').config();
const app = require('./app');
const { initializeDatabase, closeDatabase } = require('./config/database');

const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

async function main() {
  try {
    await initializeDatabase();
    console.log(`[DB] MySQL connected: ${process.env.DB_HOST || 'localhost'}/${process.env.DB_NAME || 'printrent'}`);

    const server = app.listen(PORT, () => {
      const mode = isProduction ? 'production' : 'development';
      console.log(`\n  🖨️  PrintRent Server`);
      console.log(`  ─────────────────────`);
      console.log(`  API:     http://0.0.0.0:${PORT}/api`);
      console.log(`  Mode:    ${mode}`);
      console.log(`  CORS:    ${process.env.CORS_ORIGIN || 'http://localhost:5173'}\n`);
    });

    const shutdown = async () => {
      console.log('\nShutting down gracefully...');
      await closeDatabase();
      server.close(() => {
        console.log('Server closed.');
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 5000);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (err) {
    console.error('[FATAL] Failed to start server:', err);
    process.exit(1);
  }
}

main();
