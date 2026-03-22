import dotenv from 'dotenv'
dotenv.config()
import http from 'http';
import app from './app.js';
import connectDB from './src/config/db.js';
import { initSocket } from './src/socket/socket.js';
import { startQueueResetCron } from './src/utils/cron.js';

const server = http.createServer(app);

console.log("CLIENT_URL from env:", process.env.CLIENT_URL);

// Attach Socket.io to the same HTTP server
initSocket(server);

const start = async () => {
  // 1. Connect to MongoDB first — nothing works without it
  await connectDB();

  // 2. Start the server
  server.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT} [${process.env.NODE_ENV}]`);
  });

  // 3. Start cron jobs
  startQueueResetCron();
};

start();

// ── Graceful shutdown ─────────────────────────────────────────────────────────
const shutdown = (signal) => {
  console.log(`${signal} received — shutting down gracefully`);
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// Catch unhandled promise rejections — log and exit
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err.message);
  server.close(() => process.exit(1));
});