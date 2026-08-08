// Entry point for the PackMate Express backend application
// Manages database connection, process-level exception handling, and HTTP server startup

import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';
import logger from './utils/logger.js';

// Global process exception safety handlers
process.on('uncaughtException', (err) => {
  logger.error('CRITICAL: Uncaught Exception detected!', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('CRITICAL: Unhandled Rejection detected!', reason);
  process.exit(1);
});

// Connect to database
connectDB();

// Enforce critical environment variables before starting server
if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
  throw new Error("Missing JWT environment variables");
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
});
