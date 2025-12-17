import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  // Server
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),

  // Pinata (IPFS)
  PINATA_JWT: z.string().min(1, 'PINATA_JWT is required'),
  PINATA_GATEWAY: z.string().default('https://gateway.pinata.cloud'),

  // Blockchain
  RPC_URL: z.string().default('https://rpc.mantle.xyz'),
  PRIVATE_KEY: z.string().min(1, 'PRIVATE_KEY is required'),
  NFT_CONTRACT_ADDRESS: z.string().min(1, 'NFT_CONTRACT_ADDRESS is required'),
  TIPPING_CONTRACT_ADDRESS: z.string().min(1, 'TIPPING_CONTRACT_ADDRESS is required'),
});

// Parse and validate environment variables
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.format());
  // Don't exit in development - use defaults where possible
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

export const env = parsed.success ? parsed.data : {
  PORT: process.env.PORT || '3001',
  NODE_ENV: 'development' as const,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  PINATA_JWT: process.env.PINATA_JWT || '',
  PINATA_GATEWAY: process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud',
  RPC_URL: process.env.RPC_URL || 'https://rpc.mantle.xyz',
  PRIVATE_KEY: process.env.PRIVATE_KEY || '',
  NFT_CONTRACT_ADDRESS: process.env.NFT_CONTRACT_ADDRESS || '',
  TIPPING_CONTRACT_ADDRESS: process.env.TIPPING_CONTRACT_ADDRESS || '',
};
