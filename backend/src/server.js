import app from './app.js';
import { connectDB } from './config/db.js';
import { seedInitialAdmin } from './services/seedService.js';
import { logger } from './utils/logger.js';
import { initSocket } from './socket.js';

import { initializeFirebaseAdmin } from './config/firebaseAdmin.js';

const PORT = process.env.PORT || 5001;

// Initialize database connection and initial admin bootstrap
const startServer = async () => {
  initializeFirebaseAdmin();
  await connectDB();
  await seedInitialAdmin();
};

startServer();

// Start HTTP server
const server = app.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Server running on port ${PORT}`);
  } else {
    logger.info(`Server is running in production mode on port ${PORT}`);
  }
});

// Initialize Socket.IO
initSocket(server);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

export default server;
