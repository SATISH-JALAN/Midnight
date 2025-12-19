import { Hono } from 'hono';
import { queueManager } from '../services/QueueManager.js';
import { wsManager } from '../services/WebSocketManager.js';

export const streamRoutes = new Hono();

/**
 * GET /api/stream
 * Returns the list of active (non-expired) voice notes
 */
streamRoutes.get('/', (c) => {
  const notes = queueManager.getActiveQueue();
  const stats = queueManager.getStats();

  return c.json({
    success: true,
    data: {
      notes,
      totalListeners: wsManager.getClientCount(),
      activeNotes: stats.active,
      serverTime: Date.now(),
    },
  });
});

/**
 * GET /api/stream/:noteId
 * Get a specific note by ID
 */
streamRoutes.get('/:noteId', (c) => {
  const { noteId } = c.req.param();
  const note = queueManager.getNote(noteId);

  if (!note) {
    return c.json({ success: false, error: 'Note not found' }, 404);
  }

  // Check if expired
  if (note.expiresAt < Date.now()) {
    return c.json({ success: false, error: 'Note has expired' }, 410);
  }

  return c.json({
    success: true,
    data: note,
  });
});
