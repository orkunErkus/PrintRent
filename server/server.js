const app = require('./app');
const { initialize, closeDatabase } = require('./config/database');

const PORT = process.env.PORT || 3000;

initialize()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n  🖨️  PrintRent Server`);
      console.log(`  ────────────────`);
      console.log(`  Port: ${PORT}`);
      console.log(`  Mode: ${process.env.NODE_ENV || 'production'}\n`);
    });
  })
  .catch(err => {
    console.error('Failed to start:', err);
    process.exit(1);
  });

process.on('SIGINT', () => { closeDatabase(); process.exit(0); });
process.on('SIGTERM', () => { closeDatabase(); process.exit(0); });
