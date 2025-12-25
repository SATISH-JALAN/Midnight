import { Context, Next } from 'hono';

interface RateLimitConfig {
  windowMs: number;
  limit: number;
}

const defaultConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per windowMs
};

const hits = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple in-memory rate limiter middleware
 */
export const rateLimiter = (config: RateLimitConfig = defaultConfig) => {
  return async (c: Context, next: Next) => {
    // Get client IP (fallback to unknown if not found)
    const ip = c.req.header('x-forwarded-for') || 'unknown';
    const now = Date.now();

    const record = hits.get(ip);

    if (!record || now > record.resetTime) {
      // New window or expired
      hits.set(ip, {
        count: 1,
        resetTime: now + config.windowMs,
      });
    } else {
      // Existing window
      record.count++;
      
      if (record.count > config.limit) {
        return c.json({
          success: false,
          error: 'Too many requests, please try again later.',
        }, 429);
      }
    }

    // Clean up expired entries periodically (simplistic cleanup)
    if (hits.size > 1000) {
      const now = Date.now();
      for (const [key, value] of hits.entries()) {
        if (now > value.resetTime) {
          hits.delete(key);
        }
      }
    }

    await next();
  };
};
