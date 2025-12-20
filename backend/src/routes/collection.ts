import { Hono } from 'hono';
import { blockchainService, type NFTData } from '../services/BlockchainService.js';
import { queueManager } from '../services/QueueManager.js';
import { logger } from '../config/logger.js';
import type { Note } from '../types/index.js';

export const collectionRoutes = new Hono();

/**
 * Transform NFTData from blockchain to frontend format
 */
function formatNFTForFrontend(nft: NFTData) {
  return {
    tokenId: nft.tokenId,
    noteId: nft.noteId,
    creator: nft.owner,
    owner: nft.owner,
    tokenURI: nft.tokenURI,
    audioUrl: nft.audioUrl || nft.metadata?.audioUrl || '',
    metadata: {
      name: nft.metadata?.name || `Signal #${nft.tokenId}`,
      description: nft.metadata?.description || 'Voice note from Midnight Radio',
      image: nft.metadata?.image || '',
      audioUrl: nft.audioUrl || nft.metadata?.audioUrl || '',
      duration: nft.duration || nft.metadata?.duration || 0,
      moodColor: nft.moodColor || nft.metadata?.moodColor || '#06B6D4',
      waveform: nft.waveform || nft.metadata?.waveform || [],
      attributes: nft.metadata?.attributes || [],
    },
    isListed: false,
    price: undefined,
    createdAt: nft.createdAt || new Date().toISOString(),
    expiresAt: nft.expiresAt || new Date(Date.now() + 86400000).toISOString(),
    tips: nft.tips || 0,
    echoes: nft.echoes || 0,
    isGhost: nft.isGhost || false,
  };
}

/**
 * Transform Note from in-memory queue to frontend format (fallback)
 */
function formatNoteForFrontend(note: Note) {
  return {
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
      ],
    },
    isListed: false,
    createdAt: new Date(note.timestamp).toISOString(),
    expiresAt: new Date(note.expiresAt).toISOString(),
    tips: note.tips,
    echoes: note.echoes,
  };
}

/**
 * GET /api/collection/:address
 * Get all NFTs owned by a specific wallet address
 * PRIMARY: Reads from blockchain (permanent)
 * FALLBACK: In-memory queue if blockchain fails
 */
collectionRoutes.get('/:address', async (c) => {
  const address = c.req.param('address');
  
  if (!address) {
    return c.json({ success: false, error: 'Wallet address required' }, 400);
  }

  logger.info({ address }, 'Fetching collection for address');

  try {
    // PRIMARY: Get NFTs from blockchain (permanent storage)
    const blockchainNfts = await blockchainService.getNFTsByOwner(address);
    
    if (blockchainNfts.length > 0) {
      const formattedNfts = blockchainNfts.map(formatNFTForFrontend);
      
      logger.info({ address, count: formattedNfts.length, source: 'blockchain' }, 'Collection fetched');
      
      return c.json({
        success: true,
        data: {
          address,
          nfts: formattedNfts,
          totalCount: formattedNfts.length,
          source: 'blockchain',
        },
      });
    }

    // FALLBACK: Check in-memory queue (for very recent mints not yet indexed)
    const allNotes = queueManager.getActiveQueue();
    const userNotes = allNotes.filter(
      (note: Note) => note.broadcaster.toLowerCase() === address.toLowerCase()
    );

    if (userNotes.length > 0) {
      const formattedNfts = userNotes.map(formatNoteForFrontend);
      
      logger.info({ address, count: formattedNfts.length, source: 'memory' }, 'Collection fetched from memory');
      
      return c.json({
        success: true,
        data: {
          address,
          nfts: formattedNfts,
          totalCount: formattedNfts.length,
          source: 'memory',
        },
      });
    }

    // No NFTs found in either source
    return c.json({
      success: true,
      data: {
        address,
        nfts: [],
        totalCount: 0,
      },
    });
  } catch (err: any) {
    logger.error({ err, address }, 'Failed to fetch collection');
    return c.json({ success: false, error: err.message }, 500);
  }
});

/**
 * GET /api/collection
 * Get all NFTs (for explore page)
 * PRIMARY: Reads from blockchain
 * FALLBACK: In-memory queue
 */
collectionRoutes.get('/', async (c) => {
  try {
    // PRIMARY: Get all NFTs from blockchain
    const blockchainNfts = await blockchainService.getAllNFTs(50);
    
    if (blockchainNfts.length > 0) {
      const formattedNfts = blockchainNfts.map(formatNFTForFrontend);
      
      return c.json({
        success: true,
        data: {
          nfts: formattedNfts,
          totalCount: formattedNfts.length,
          source: 'blockchain',
        },
      });
    }

    // FALLBACK: In-memory queue
    const allNotes = queueManager.getActiveQueue();
    const formattedNfts = allNotes.map(formatNoteForFrontend);

    return c.json({
      success: true,
      data: {
        nfts: formattedNfts,
        totalCount: formattedNfts.length,
        source: 'memory',
      },
    });
  } catch (err: any) {
    logger.error({ err }, 'Failed to fetch all NFTs');
    return c.json({ success: false, error: err.message }, 500);
  }
});
