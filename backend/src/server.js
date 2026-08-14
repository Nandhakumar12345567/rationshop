const app = require('./app');
const initDb = require('./db/initDb');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log('[Smart Ration Server] Initializing Database...');
    await initDb();

    app.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(` 🌾 SMART RATION REST API SERVER IS RUNNING`);
      console.log(` 🚀 Listening on: http://localhost:${PORT}`);
      console.log(` 📡 Health check: http://localhost:${PORT}/api/health`);
      console.log(`==================================================`);
    });
  } catch (error) {
    console.error('[Smart Ration Server Error] Failed to start:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = startServer;
