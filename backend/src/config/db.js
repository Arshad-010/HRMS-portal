import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

let memoryServerInstance = null;

/**
 * Connect to MongoDB using Mongoose
 * Connects to configured MONGODB_URI, falling back to In-Memory MongoDB in development
 */
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms_portal';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    logger.info(`MongoDB Connected to host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.warn(`Primary MongoDB connection failed (${error.message}).`);

    // In development or test, initialize in-memory fallback if available
    if (process.env.NODE_ENV !== 'production') {
      try {
        logger.info('Starting In-Memory MongoDB instance for local development...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memoryServerInstance = await MongoMemoryServer.create({
          instance: { dbName: 'hrms_portal' },
        });
        const memoryUri = memoryServerInstance.getUri();
        const conn = await mongoose.connect(memoryUri);
        logger.info(`Connected to In-Memory MongoDB: ${memoryUri}`);
        return conn;
      } catch (memError) {
        logger.error(`Failed to start In-Memory MongoDB: ${memError.message}`);
      }
    }

    logger.warn('Server will continue running in offline database mode. Check MongoDB service status.');
  }

  // Connection event listeners
  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB connection lost. Reconnecting...');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected successfully.');
  });
};

/**
 * Helper to check current database connection status
 */
export const getDatabaseStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState] || 'unknown';
};

/**
 * Graceful database disconnect
 */
export const disconnectDB = async () => {
  await mongoose.disconnect();
  if (memoryServerInstance) {
    await memoryServerInstance.stop();
  }
};
