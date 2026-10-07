/**
 * Standardized logger utility for backend logging
 */
export const logger = {
  info: (message, meta) => {
    if (process.env.NODE_ENV !== 'production') return;
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta || '');
  },
  warn: (message, meta) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta || '');
  },
  error: (message, meta) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, meta || '');
  },
};
