import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/db.js';
import { seedInitialAdmin } from '../services/seedService.js';
import { logger } from '../utils/logger.js';

dotenv.config();

const runSeedScript = async () => {
  logger.info('Executing database seed script...');
  try {
    await connectDB();
    await seedInitialAdmin();
    await disconnectDB();
    logger.info('Database seed script finished.');
    process.exit(0);
  } catch (error) {
    logger.error(`Seed script failed: ${error.message}`);
    await disconnectDB();
    process.exit(1);
  }
};

runSeedScript();
