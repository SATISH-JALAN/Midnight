import { Hono } from 'hono';
import { queueManager } from '../services/QueueManager.js';
import { wsManager } from '../services/WebSocketManager.js';
import { blockchainService } from '../services/BlockchainService.js';
import { logger } from '../config/logger.js';
import type { Note } from '../types/index.js';

export const streamRoutes = new Hono();

/**
 * GET /api/stream
 * Returns the list of active voice notes
 * Merges in-memory queue with blockchain NFTs for persistence
 */
streamRoutes.get('/', async (c) => {
  try {
    // Get notes from in-memory queue (recent uploads, not yet on chain)
    const queueNotes = queueManager.getActiveQueue().filter(note => !note.isEcho);
    const queueNoteIds = new Set(queueNotes.map(n => n.noteId));

    // Also fetch NFTs from blockchain for persistence across restarts
    const blockchainNfts = await blockchainService.getAllNFTs(20);
    
    // Convert blockchain NFTs to Note format and merge
    const blockchainNotes: Note[] = await Promise.all(
      blockchainNfts
        .filter(nft => !queueNoteIds.has(nft.noteId)) // Avoid duplicates
        .map(async (nft) => {
          // Fetch echo count from blockchain
          const echoCount = await blockchainService.getEchoCount(nft.noteId);
          
          return {
            noteId: nft.noteId,
            tokenId: parseInt(nft.tokenId) || 0,
            audioUrl: nft.audioUrl || '',
            metadataUrl: nft.tokenURI || '',
            duration: nft.duration || 0,
            moodColor: nft.moodColor || '#0EA5E9',
            waveform: nft.waveform || [],
            timestamp: nft.createdAt ? new Date(nft.createdAt).getTime() : Date.now(),
            expiresAt: nft.expiresAt ? new Date(nft.expiresAt).getTime() : Date.now() + 86400000,
            broadcaster: nft.owner || '',
            sector: nft.sector || 'Unknown Sector',
            tips: nft.tips || 0,
            echoes: echoCount, // Get from blockchain
          };
        })
    );

    // Also update echo counts for queue notes from blockchain
    const queueNotesWithEchoes = await Promise.all(
      queueNotes.map(async (note) => {
        const echoCount = await blockchainService.getEchoCount(note.noteId);
        return { ...note, echoes: echoCount };
      })
    );

    // Merge: in-memory first (freshest), then blockchain
    const allNotes = [...queueNotesWithEchoes, ...blockchainNotes];

    return c.json({
      success: true,
      data: {
        notes: allNotes,
        totalListeners: wsManager.getClientCount(),
        activeNotes: allNotes.length,
        serverTime: Date.now(),
      },
    });
  } catch (err) {
    logger.error({ err }, 'Failed to fetch stream');
    // Fallback to queue only
    const notes = queueManager.getActiveQueue().filter(note => !note.isEcho);
    return c.json({
      success: true,
      data: {
        notes,
        totalListeners: wsManager.getClientCount(),
        activeNotes: notes.length,
        serverTime: Date.now(),
      },
    });
  }
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
