import { Hono } from 'hono';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { corsMiddleware } from './middleware/cors.js';
import { errorHandler } from './middleware/errorHandler.js';
import { healthRoutes } from './routes/health.js';
import { uploadRoutes } from './routes/upload.js';
import { streamRoutes } from './routes/stream.js';
import { audioRoutes } from './routes/audio.js';
import { collectionRoutes } from './routes/collection.js';
import { echoRoutes } from './routes/echo.js';
import { wsManager } from './services/WebSocketManager.js';

// Create Hono app
const app = new Hono();

// Global middleware
app.use('*', corsMiddleware);
app.onError(errorHandler);

// Routes
app.route('/health', healthRoutes);
app.route('/api/upload', uploadRoutes);
app.route('/api/stream', streamRoutes);
app.route('/api/audio', audioRoutes);
app.route('/api/collection', collectionRoutes);
app.route('/api/echo', echoRoutes);

// Root endpoint
app.get('/', (c) => {
  return c.json({
    name: 'Midnight Radio API',
    version: '1.0.0',
    status: 'running',
    websocket: 'ws://localhost:' + env.PORT + '/ws',
    endpoints: {
      health: 'GET /health',
      upload: 'POST /api/upload',
      stream: 'GET /api/stream',
      audio: 'GET /api/audio/:noteId',
      echo: 'POST /api/echo/:parentNoteId',
      ws: 'WS /ws',
    },
  });
});

// Start Bun server with WebSocket support
const port = parseInt(env.PORT);

logger.info(`🚀 Starting Midnight Radio Backend...`);
logger.info(`📡 Environment: ${env.NODE_ENV}`);
logger.info(`🌐 Frontend URL: ${env.FRONTEND_URL}`);

const server = Bun.serve({
  port,
  fetch(req, server) {
    const url = new URL(req.url);
    
    // Handle WebSocket upgrade for /ws path
    if (url.pathname === '/ws') {
      const upgraded = server.upgrade(req, {
        data: { clientId: '', connectedAt: Date.now() },
      });
      if (upgraded) {
        return undefined; // Upgrade successful
      }
      return new Response('WebSocket upgrade failed', { status: 400 });
    }
    
    // Handle HTTP requests with Hono
    return app.fetch(req, server);
  },
  websocket: wsManager.handlers,
});

logger.info(`✅ Server running on http://localhost:${server.port}`);
logger.info(`🔌 WebSocket available at ws://localhost:${server.port}/ws`);

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
