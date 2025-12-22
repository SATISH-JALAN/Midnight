import { Context, Next } from 'hono';
import { env } from '../config/env.js';

/**
 * CORS middleware - allows requests from frontend URL
 */
export const corsMiddleware = async (c: Context, next: Next) => {
  const origin = c.req.header('origin');
  const allowedOrigins = [env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173'];

  // Determine if origin is allowed
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);

  // Handle preflight requests (OPTIONS)
  if (c.req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': isAllowedOrigin ? origin! : '',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // For regular requests, set CORS headers
  if (isAllowedOrigin) {
    c.header('Access-Control-Allow-Origin', origin!);
  }
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  c.header('Access-Control-Allow-Credentials', 'true');
  c.header('Access-Control-Max-Age', '86400');

  await next();
};
