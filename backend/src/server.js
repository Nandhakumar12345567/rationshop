const http = require('http');
const app = require('./app');
const initDb = require('./db/initDb');
const socketService = require('./services/socketService');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log('[Smart Ration Server] Initializing Database...');
    await initDb();

    const server = http.createServer(app);
    socketService.init(server);

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ [PORT CONFLICT] Port ${PORT} is ALREADY IN USE!`);
        console.error(`👉 The backend server is ALREADY RUNNING in another terminal tab.`);
        console.error(`👉 To start the web frontend, run: npm run web (in Terminal 2)\n`);
      } else {
        console.error('[Smart Ration Server Error] Failed to start:', err);
      }
      process.exit(1);
    });

    server.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(` 🌾 SMART RATION REST API SERVER IS RUNNING`);
      console.log(` 🚀 Listening on: http://localhost:${PORT}`);
      console.log(` 📡 Health check: http://localhost:${PORT}/api/health`);
      console.log(` ⚡ Socket.IO Ready on port: ${PORT}`);
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
