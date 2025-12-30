import { Hono } from 'hono';
import { queueManager } from '../services/QueueManager.js';
import { wsManager } from '../services/WebSocketManager.js';
import { blockchainService } from '../services/BlockchainService.js';
import { logger } from '../config/logger.js';
import type { Note } from '../types/index.js';

export const streamRoutes = new Hono();

/**
 * GET /api/stream
 * Returns the list of active voice notes for a specific chain
 * Merges in-memory queue with blockchain NFTs for persistence
 * 
 * Query params:
 *   - chainId: Filter by chain ID (required for chain-specific results)
 */
streamRoutes.get('/', async (c) => {
  try {
    // Get chainId from query params
    const chainIdParam = c.req.query('chainId');
    const chainId = chainIdParam ? parseInt(chainIdParam, 10) : undefined;

    // Get notes from in-memory queue (recent uploads, not yet on chain)
    let queueNotes = queueManager.getActiveQueue().filter(note => !note.isEcho);
    
    // Filter by chainId if provided
    if (chainId) {
      queueNotes = queueNotes.filter(note => note.chainId === chainId);
    }
    
    const queueNoteIds = new Set(queueNotes.map(n => n.noteId));

    // Also fetch NFTs from blockchain for persistence across restarts
    // Pass chainId to get chain-specific NFTs
    const blockchainNfts = await blockchainService.getAllNFTs(20, chainId);
    
    // Convert blockchain NFTs to Note format (no per-note blockchain calls for speed)
    const blockchainNotes: Note[] = blockchainNfts
      .filter(nft => !queueNoteIds.has(nft.noteId)) // Avoid duplicates
      .map((nft) => ({
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
        echoes: nft.echoes || 0,
        chainId: nft.chainId || chainId, // Preserve chain info
      }));

    // Merge: in-memory first (freshest), then blockchain
    const allNotes = [...queueNotes, ...blockchainNotes];

    return c.json({
      success: true,
      data: {
        notes: allNotes,
        totalListeners: wsManager.getClientCount(),
        activeNotes: allNotes.length,
        serverTime: Date.now(),
        chainId: chainId || null, // Echo back which chain was queried
      },
    });
  } catch (err) {
    logger.error({ err }, 'Failed to fetch stream');
    // Fallback to queue only
    const chainIdParam = c.req.query('chainId');
    const chainId = chainIdParam ? parseInt(chainIdParam, 10) : undefined;
    
    let notes = queueManager.getActiveQueue().filter(note => !note.isEcho);
    if (chainId) {
      notes = notes.filter(note => note.chainId === chainId);
    }
    
    return c.json({
      success: true,
      data: {
        notes,
        totalListeners: wsManager.getClientCount(),
        activeNotes: notes.length,
        serverTime: Date.now(),
        chainId: chainId || null,
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
