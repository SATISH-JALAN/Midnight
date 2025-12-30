import { Hono } from 'hono';
import { queueManager } from '../services/QueueManager.js';
import { wsManager } from '../services/WebSocketManager.js';
import { logger } from '../config/logger.js';
import type { Note } from '../types/index.js';

export const confirmRoutes = new Hono();

/**
 * POST /api/mint/confirm
 * Called by frontend after NFT mint succeeds on-chain.
 * Adds the note to the queue and broadcasts to all WebSocket clients.
 * 
 * This ensures notes only appear in the stream after successful on-chain minting.
 */
confirmRoutes.post('/confirm', async (c) => {
  try {
    const body = await c.req.json();
    const { 
      txHash, 
      noteId, 
      audioUrl, 
      metadataUrl, 
      broadcaster, 
      duration,
      moodColor,
      waveform,
      expiresAt,
      sector,
      chainId
    } = body;

    // Validate required fields
    if (!txHash || !noteId || !audioUrl || !metadataUrl || !broadcaster) {
      return c.json({ 
        success: false, 
        error: 'Missing required fields: txHash, noteId, audioUrl, metadataUrl, broadcaster' 
      }, 400);
    }

    logger.info({ 
      txHash: txHash.substring(0, 20) + '...', 
      noteId, 
      broadcaster,
      chainId 
    }, 'Mint confirmation received');

    // Create note object
    const note: Note = {
      noteId,
      tokenId: 0, // Could extract from tx receipt if needed
      audioUrl,
      metadataUrl,
      duration: duration || 0,
      moodColor: moodColor || '#0EA5E9',
      waveform: waveform || [],
      timestamp: Date.now(),
      expiresAt: expiresAt || Date.now() + 24 * 60 * 60 * 1000,
      broadcaster,
      sector: sector || `Sector-${Math.floor(Math.random() * 9) + 1}`,
      tips: 0,
      echoes: 0,
      chainId: chainId || undefined, // Store the chain where this note was minted
    };

    // NOW add to queue (after mint confirmed)
    queueManager.addNote(note);

    // Broadcast new note to all WebSocket clients
    wsManager.broadcastNewNote(note);

    logger.info({ noteId, txHash: txHash.substring(0, 20) + '...' }, 'Note added to stream after mint confirmation');

    return c.json({
      success: true,
      data: {
        noteId,
        txHash,
        addedToStream: true,
      },
    });

  } catch (err: any) {
    logger.error({ err }, 'Mint confirmation failed');
    return c.json({ 
      success: false, 
      error: err.message || 'Confirmation failed' 
    }, 500);
  }
});
