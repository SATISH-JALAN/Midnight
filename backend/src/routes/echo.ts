import { Hono } from 'hono';
import { audioProcessor } from '../services/AudioProcessor.js';
import { ipfsService } from '../services/IPFSService.js';
import { queueManager } from '../services/QueueManager.js';
import { wsManager } from '../services/WebSocketManager.js';
import { blockchainService } from '../services/BlockchainService.js';
import { logger } from '../config/logger.js';
import type { Note } from '../types/index.js';

export const echoRoutes = new Hono();

/**
 * POST /api/echo/:parentNoteId
 * Upload an echo reply to a parent note
 */
echoRoutes.post('/:parentNoteId', async (c) => {
  try {
    const parentNoteId = c.req.param('parentNoteId');
    
    // 1. Parse form data
    const formData = await c.req.formData();
    const audioFile = formData.get('audio') as File | null;
    const walletAddress = formData.get('walletAddress') as string | null;

    // 2. Validate required fields
    if (!audioFile) {
      return c.json({ success: false, error: 'Audio file is required' }, 400);
    }
    if (!walletAddress) {
      return c.json({ success: false, error: 'Wallet address is required' }, 400);
    }

    // 3. Find parent note
    const parentNote = queueManager.getNote(parentNoteId);
    if (!parentNote) {
      return c.json({ success: false, error: 'Parent note not found' }, 404);
    }

    logger.info({ 
      parentNoteId, 
      walletAddress, 
      fileName: audioFile.name, 
      size: audioFile.size 
    }, 'Echo upload started');

    // 4. Process audio (30 second max for echoes)
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    const processResult = await audioProcessor.process(audioBuffer, audioFile.name);

    // Validate echo duration (max 30 seconds)
    if (processResult.duration > 30) {
      return c.json({ 
        success: false, 
        error: 'Echo must be 30 seconds or less' 
      }, 400);
    }

    logger.info({ 
      echoNoteId: processResult.noteId, 
      duration: processResult.duration 
    }, 'Echo audio processed');

    // 5. Upload to IPFS
    const ipfsResult = await ipfsService.upload(processResult.outputPath, {
      noteId: processResult.noteId,
      duration: processResult.duration,
      moodColor: '#A855F7', // Purple for echoes
      waveform: processResult.waveform,
      broadcaster: walletAddress,
      timestamp: Date.now(),
      isEcho: true,
      parentNoteId: parentNoteId,
    });

    logger.info({ 
      echoNoteId: processResult.noteId,
      audioHash: ipfsResult.audioHash 
    }, 'Echo uploaded to IPFS');

    // 6. Register echo on blockchain
    let txHash = '';
    try {
      const result = await blockchainService.registerEcho(
        parentNoteId,
        processResult.noteId,
        parentNote.broadcaster,
        walletAddress
      );
      txHash = result.txHash;
    } catch (err) {
      logger.warn({ err }, 'Blockchain echo registration failed, continuing without');
    }

    // 7. Create echo note object
    const echoNote: Note = {
      noteId: processResult.noteId,
      tokenId: 0,
      audioUrl: ipfsResult.audioUrl,
      metadataUrl: ipfsResult.metadataUrl,
      duration: processResult.duration,
      moodColor: '#A855F7',
      waveform: processResult.waveform,
      timestamp: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      broadcaster: walletAddress,
      sector: parentNote.sector,
      tips: 0,
      echoes: 0,
      isEcho: true,
      parentNoteId: parentNoteId,
    };

    // 8. Add echo to queue
    queueManager.addNote(echoNote);

    // 9. Increment parent's echo count
    queueManager.addEcho(parentNoteId);

    // 10. Broadcast echo event via WebSocket
    wsManager.broadcastEchoAdded({
      echoNoteId: echoNote.noteId,
      parentNoteId: parentNoteId,
      broadcaster: walletAddress,
      audioUrl: echoNote.audioUrl,
      duration: echoNote.duration,
    });

    // 11. Return success
    return c.json({
      success: true,
      data: {
        echoNoteId: echoNote.noteId,
        parentNoteId: parentNoteId,
        audioUrl: echoNote.audioUrl,
        metadataUrl: echoNote.metadataUrl,
        duration: echoNote.duration,
        txHash: txHash || null,
      },
    });

  } catch (err: any) {
    logger.error({ err }, 'Echo upload failed');
    return c.json({ 
      success: false, 
      error: err.message || 'Echo upload failed' 
    }, 500);
  }
});

/**
 * GET /api/echo/:parentNoteId
 * Get all echoes for a parent note
 */
echoRoutes.get('/:parentNoteId', async (c) => {
  try {
    const parentNoteId = c.req.param('parentNoteId');
    
    // Get echoes from queue manager
    const echoes = queueManager.getEchoes(parentNoteId);
    
    return c.json({
      success: true,
      data: {
        parentNoteId,
        echoes,
        count: echoes.length,
      },
    });

  } catch (err: any) {
    logger.error({ err }, 'Failed to get echoes');
    return c.json({ 
      success: false, 
      error: err.message || 'Failed to get echoes' 
    }, 500);
  }
});

/**
 * GET /api/echo/fee
 * Get the current echo fee
 */
echoRoutes.get('/fee', async (c) => {
  try {
    const fee = await blockchainService.getEchoFee();
    return c.json({
      success: true,
      data: { fee, currency: 'MNT' },
    });
  } catch (err: any) {
    return c.json({ 
      success: false, 
      error: 'Failed to get echo fee' 
    }, 500);
  }
});
