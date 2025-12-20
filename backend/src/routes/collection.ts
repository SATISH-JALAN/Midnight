import { Hono } from 'hono';
import { queueManager } from '../services/QueueManager.js';
import { logger } from '../config/logger.js';
import type { Note } from '../types/index.js';

export const collectionRoutes = new Hono();

/**
 * GET /api/collection/:address
 * Get all notes/NFTs for a specific wallet address
 */
collectionRoutes.get('/:address', async (c) => {
  const address = c.req.param('address');
  
  if (!address) {
    return c.json({ success: false, error: 'Wallet address required' }, 400);
  }

  logger.info({ address }, 'Fetching collection for address');

  try {
    // Get all active notes from queue
    const allNotes = queueManager.getActiveQueue();
    
    // Filter notes by broadcaster address (case-insensitive)
    const userNotes = allNotes.filter(
      (note: Note) => note.broadcaster.toLowerCase() === address.toLowerCase()
    );

    // Transform to VoiceNoteNFT format for frontend
    const nfts = userNotes.map((note: Note) => ({
      tokenId: note.tokenId?.toString() || note.noteId,
      noteId: note.noteId,
      creator: note.broadcaster,
      owner: note.broadcaster,
      tokenURI: note.metadataUrl,
      audioUrl: note.audioUrl,
      metadata: {
        name: `Signal #${note.noteId.substring(0, 6)}`,
        description: `Voice note from ${note.sector}`,
        image: '', // Waveform visualization could go here
        audioUrl: note.audioUrl,
        duration: note.duration,
        moodColor: note.moodColor,
        waveform: note.waveform,
        attributes: [
          { trait_type: 'Sector', value: note.sector },
          { trait_type: 'Duration', value: `${note.duration}s` },
          { trait_type: 'Tips', value: note.tips },
          { trait_type: 'Echoes', value: note.echoes },
        ],
      },
      isListed: false,
      price: undefined,
      createdAt: new Date(note.timestamp).toISOString(),
      expiresAt: new Date(note.expiresAt).toISOString(),
      tips: note.tips,
      echoes: note.echoes,
    }));

    logger.info({ address, count: nfts.length }, 'Collection fetched');

    return c.json({
      success: true,
      data: {
        address,
        nfts,
        totalCount: nfts.length,
      },
    });
  } catch (err: any) {
    logger.error({ err, address }, 'Failed to fetch collection');
    return c.json({ success: false, error: err.message }, 500);
  }
});

/**
 * GET /api/collection
 * Get all notes (for explore/stream page)
 */
collectionRoutes.get('/', async (c) => {
  try {
    const allNotes = queueManager.getActiveQueue();

    const nfts = allNotes.map((note: Note) => ({
      tokenId: note.tokenId?.toString() || note.noteId,
      noteId: note.noteId,
      creator: note.broadcaster,
      owner: note.broadcaster,
      tokenURI: note.metadataUrl,
      audioUrl: note.audioUrl,
      metadata: {
        name: `Signal #${note.noteId.substring(0, 6)}`,
        description: `Voice note from ${note.sector}`,
        image: '',
        audioUrl: note.audioUrl,
        duration: note.duration,
        moodColor: note.moodColor,
        waveform: note.waveform,
        attributes: [
          { trait_type: 'Sector', value: note.sector },
          { trait_type: 'Duration', value: `${note.duration}s` },
          { trait_type: 'Tips', value: note.tips },
          { trait_type: 'Echoes', value: note.echoes },
        ],
      },
      isListed: false,
      createdAt: new Date(note.timestamp).toISOString(),
      expiresAt: new Date(note.expiresAt).toISOString(),
      tips: note.tips,
      echoes: note.echoes,
    }));

    return c.json({
      success: true,
      data: {
        nfts,
        totalCount: nfts.length,
      },
    });
  } catch (err: any) {
    logger.error({ err }, 'Failed to fetch all notes');
    return c.json({ success: false, error: err.message }, 500);
  }
});
