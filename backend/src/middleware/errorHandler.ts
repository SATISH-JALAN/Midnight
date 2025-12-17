import { Context } from 'hono';
import { logger } from '../config/logger.js';

/**
 * Global error handler middleware
 */
export const errorHandler = (err: Error, c: Context) => {
  logger.error({ err, path: c.req.path, method: c.req.method }, 'Request error');

  // Determine status code
  const status = (err as any).status || 500;

  return c.json(
    {
      success: false,
      error: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
    status
  );
};
