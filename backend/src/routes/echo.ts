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
    const chainIdStr = formData.get('chainId') as string | null;
    const chainId = chainIdStr ? parseInt(chainIdStr, 10) : undefined;

    // Validate file size (max 10MB)
    if (audioFile && audioFile.size > 10 * 1024 * 1024) {
      return c.json({ success: false, error: 'File too large (max 10MB)' }, 400);
    }

    // 2. Validate required fields
    if (!audioFile) {
      return c.json({ success: false, error: 'Audio file is required' }, 400);
    }
    if (!walletAddress) {
      return c.json({ success: false, error: 'Wallet address is required' }, 400);
    }

    // 3. Find parent note (check in-memory queue first, then blockchain)
    let parentNote = queueManager.getNote(parentNoteId);
    let parentBroadcaster = parentNote?.broadcaster;
    let parentSector = parentNote?.sector || 'Sector-8';
    
    // If not in queue, try to find on blockchain
    if (!parentNote) {
      logger.info({ parentNoteId }, 'Parent not in queue, checking blockchain');
      
      // Search blockchain for this noteId
      const blockchainNfts = await blockchainService.getAllNFTs(50);
      const blockchainParent = blockchainNfts.find(nft => nft.noteId === parentNoteId);
      
      if (blockchainParent) {
        parentBroadcaster = blockchainParent.owner;
        parentSector = blockchainParent.sector || 'Sector-8';
        logger.info({ parentNoteId, owner: parentBroadcaster }, 'Found parent on blockchain');
      } else {
        return c.json({ success: false, error: 'Parent note not found' }, 404);
      }
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

    // 6. Delete local file now that it's safely on IPFS
    await audioProcessor.deleteAudio(processResult.noteId);
    logger.info({ noteId: processResult.noteId }, 'Local file cleaned up');

    // NOTE: Blockchain registration is now done by the USER on the frontend
    // The backend only handles IPFS upload and returns the data for the contract call

    // Return success with data needed for frontend contract call
    return c.json({
      success: true,
      data: {
        echoNoteId: processResult.noteId,
        parentNoteId: parentNoteId,
        audioUrl: ipfsResult.audioUrl,
        metadataUrl: ipfsResult.metadataUrl,
        duration: processResult.duration,
        parentBroadcaster: parentBroadcaster,
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
 * Get all echoes for a parent note (from blockchain for persistence)
 */
echoRoutes.get('/:parentNoteId', async (c) => {
  try {
    const parentNoteId = c.req.param('parentNoteId');
    
    // Get echoes from blockchain (persistent)
    const blockchainEchoes = await blockchainService.getEchoesFromBlockchain(parentNoteId);
    
    // Also check in-memory queue for any echoes not yet on chain
    const queueEchoes = queueManager.getEchoes(parentNoteId);
    
    // Convert blockchain echoes to frontend format with audio URLs
    const formattedEchoes = await Promise.all(
      blockchainEchoes.map(async (echo) => {
        // Fetch metadata from IPFS to get audio URL
        let audioUrl = '';
        let duration = 0;
        
        try {
          if (echo.metadataUrl) {
            // Convert IPFS URL to gateway URL if needed
            const gatewayUrl = echo.metadataUrl.startsWith('ipfs://')
              ? echo.metadataUrl.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
              : echo.metadataUrl;
            
            const response = await fetch(gatewayUrl);
            if (response.ok) {
              const metadata = await response.json();
              audioUrl = metadata.animation_url || metadata.audio || '';
              // Convert audio IPFS URL to gateway
              if (audioUrl.startsWith('ipfs://')) {
                audioUrl = audioUrl.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
              }
              duration = metadata.properties?.duration || 0;
            }
          }
        } catch (err) {
          logger.warn({ err, echoNoteId: echo.echoNoteId }, 'Failed to fetch echo metadata');
        }
        
        return {
          noteId: echo.echoNoteId,
          audioUrl,
          duration,
          broadcaster: echo.echoBroadcaster,
          timestamp: echo.timestamp * 1000, // Convert to ms
          isEcho: true,
          parentNoteId: echo.parentNoteId,
        };
      })
    );
    
    // Merge with queue echoes (for any not yet on chain), avoiding duplicates
    const blockchainNoteIds = new Set(formattedEchoes.map(e => e.noteId));
    const mergedEchoes = [
      ...formattedEchoes,
      ...queueEchoes.filter(e => !blockchainNoteIds.has(e.noteId)).map(e => ({
        noteId: e.noteId,
        audioUrl: e.audioUrl,
        duration: e.duration,
        broadcaster: e.broadcaster,
        timestamp: e.timestamp,
        isEcho: true,
        parentNoteId: e.parentNoteId,
      })),
    ];
    
    return c.json({
      success: true,
      data: {
        parentNoteId,
        echoes: mergedEchoes,
        count: mergedEchoes.length,
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
