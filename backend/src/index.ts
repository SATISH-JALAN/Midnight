import { Hono } from 'hono';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { corsMiddleware } from './middleware/cors.js';
import { errorHandler } from './middleware/errorHandler.js';
import { healthRoutes } from './routes/health.js';

// Create Hono app
const app = new Hono();

// Global middleware
app.use('*', corsMiddleware);
app.onError(errorHandler);

// Routes
app.route('/health', healthRoutes);

// Root endpoint
app.get('/', (c) => {
  return c.json({
    name: 'Midnight Radio API',
    version: '1.0.0',
    status: 'running',
  });
});

// Start Bun server
const port = parseInt(env.PORT);

logger.info(`🚀 Starting Midnight Radio Backend...`);
logger.info(`📡 Environment: ${env.NODE_ENV}`);
logger.info(`🌐 Frontend URL: ${env.FRONTEND_URL}`);

const server = Bun.serve({
  port,
  fetch: app.fetch,
});

logger.info(`✅ Server running on http://localhost:${server.port}`);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down...');
  server.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down...');
  server.stop();
  process.exit(0);
});
