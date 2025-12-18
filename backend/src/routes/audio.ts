import { Hono } from 'hono';
import { stat } from 'fs/promises';
import path from 'path';
import { queueManager } from '../services/QueueManager.js';
import { logger } from '../config/logger.js';

export const audioRoutes = new Hono();

const UPLOADS_DIR = './uploads/notes';

/**
 * GET /api/audio/:noteId
 * Stream audio file with range request support (for seeking)
 */
audioRoutes.get('/:noteId', async (c) => {
  const { noteId } = c.req.param();
  const filePath = path.join(UPLOADS_DIR, `${noteId}.mp3`);

  try {
    // Check if file exists
    const stats = await stat(filePath);
    const fileSize = stats.size;

    // Get range header for partial content
    const rangeHeader = c.req.header('range');

    if (rangeHeader) {
      // Parse range header: "bytes=start-end"
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + 1024 * 1024, fileSize - 1);

      // Validate range
      if (start >= fileSize || end >= fileSize) {
        return c.text('Range Not Satisfiable', 416);
      }

      const chunkSize = end - start + 1;
      const file = Bun.file(filePath);
      const chunk = file.slice(start, end + 1);

      logger.debug({ noteId, start, end, chunkSize }, 'Serving audio range');

      return new Response(chunk, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(chunkSize),
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // No range header - serve entire file
    const file = Bun.file(filePath);
    
    logger.debug({ noteId, fileSize }, 'Serving full audio file');

    return new Response(file, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(fileSize),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (err: any) {
    if (err.code === 'ENOENT') {
      logger.warn({ noteId }, 'Audio file not found');
      return c.json({ success: false, error: 'Audio not found' }, 404);
    }
    
    logger.error({ err, noteId }, 'Error serving audio');
    return c.json({ success: false, error: 'Failed to serve audio' }, 500);
  }
});
