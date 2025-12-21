import { Hono } from 'hono';
import { blockchainService } from '../services/BlockchainService.js';
import { logger } from '../config/logger.js';

export const tipsRoutes = new Hono();

/**
 * GET /api/tips/:address
 * Get all tips made by a user
 */
tipsRoutes.get('/:address', async (c) => {
  try {
    const address = c.req.param('address');
    
    if (!address || !address.startsWith('0x')) {
      return c.json({ success: false, error: 'Invalid address' }, 400);
    }
    
    logger.info({ address }, 'Fetching tips for user');
    
    const tips = await blockchainService.getTipsByUser(address);
    
    return c.json({
      success: true,
      data: {
        address,
        tips,
        count: tips.length,
      },
    });
  } catch (err: any) {
    logger.error({ err }, 'Failed to fetch tips');
    return c.json({ 
      success: false, 
      error: err.message || 'Failed to fetch tips' 
    }, 500);
  }
});
