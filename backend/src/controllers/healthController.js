import { getDatabaseStatus } from '../config/db.js';

/**
 * Health check controller
 * @route   GET /api/health
 * @desc    Returns server health, uptime, timestamp, and database connectivity status
 * @access  Public
 */
export const getHealth = (req, res) => {
  const dbStatus = getDatabaseStatus();

  res.status(200).json({
    status: 'ok',
    message: 'HRMS Portal API is operational',
    timestamp: new Date().toISOString(),
    uptime: `${process.uptime().toFixed(2)}s`,
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus,
  });
};
