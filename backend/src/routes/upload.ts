import { Hono } from 'hono';
import { audioProcessor } from '../services/AudioProcessor.js';
import { ipfsService } from '../services/IPFSService.js';
import { logger } from '../config/logger.js';

export const uploadRoutes = new Hono();

/**
 * POST /api/upload
 * Upload audio file, process it, store to IPFS, add to queue
 */
uploadRoutes.post('/', async (c) => {
  try {
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

    logger.info({ walletAddress, fileName: audioFile.name, size: audioFile.size }, 'Upload started');

    // 3. Process audio (convert to MP3, get duration, generate waveform)
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    const processResult = await audioProcessor.process(audioBuffer, audioFile.name);

    logger.info({ 
      noteId: processResult.noteId, 
      duration: processResult.duration 
    }, 'Audio processed');

    // 4. Upload to IPFS (audio + metadata)
    const ipfsResult = await ipfsService.upload(processResult.outputPath, {
      noteId: processResult.noteId,
      duration: processResult.duration,
      moodColor: '#0EA5E9', // Default blue (sentiment analysis in later phase)
      waveform: processResult.waveform,
      broadcaster: walletAddress,
      timestamp: Date.now(),
    });

    logger.info({ 
      noteId: processResult.noteId,
      audioHash: ipfsResult.audioHash 
    }, 'Uploaded to IPFS');

    // NOTE: We do NOT add to queue here anymore.
    // The note is only added after the NFT mint confirms on-chain.
    // See /api/mint/confirm endpoint.

    // Return success response with IPFS data for frontend to use in minting
    return c.json({
      success: true,
      data: {
        noteId: processResult.noteId,
        audioUrl: ipfsResult.audioUrl,
        metadataUrl: ipfsResult.metadataUrl,
        duration: processResult.duration,
        moodColor: '#0EA5E9',
        waveform: processResult.waveform,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        sector: `Sector-${Math.floor(Math.random() * 9) + 1}`,
        broadcaster: walletAddress,
      },
    });

  } catch (err: any) {
    logger.error({ err }, 'Upload failed');
    return c.json({ 
      success: false, 
      error: err.message || 'Upload failed' 
    }, 500);
  }
});
