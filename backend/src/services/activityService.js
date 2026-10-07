import ActivityLog from '../models/ActivityLog.js';
import { logger } from '../utils/logger.js';

/**
 * Sanitizes metadata to strictly remove any security-sensitive fields
 */
const sanitizeMetadata = (meta) => {
  if (!meta || typeof meta !== 'object') return {};
  const clean = { ...meta };
  const sensitiveKeys = ['password', 'token', 'secret', 'hash', 'authorization', 'bearer'];

  for (const key of Object.keys(clean)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
      delete clean[key];
    }
  }

  return clean;
};

/**
 * Log an organizational action in the Activity Audit Log
 */
export const logActivity = async ({
  actor,
  action,
  entityType,
  entityId,
  description,
  metadata = {},
}) => {
  try {
    if (!actor || !action || !entityType || !entityId || !description) {
      logger.warn('Incomplete parameters provided for activity logging');
      return null;
    }

    const cleanMeta = sanitizeMetadata(metadata);

    const logEntry = await ActivityLog.create({
      actor: actor._id || actor,
      action: action.toUpperCase(),
      entityType,
      entityId,
      description: description.trim(),
      metadata: cleanMeta,
    });

    return logEntry;
  } catch (error) {
    logger.error(`Failed to record activity log: ${error.message}`);
    return null;
  }
};

export default {
  logActivity,
};
