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

  // Blockchain - Mantle (Primary)
  RPC_URL: z.string().default('https://rpc.sepolia.mantle.xyz'),
  PRIVATE_KEY: z.string().min(1, 'PRIVATE_KEY is required'),
  NFT_CONTRACT_ADDRESS: z.string().min(1, 'NFT_CONTRACT_ADDRESS is required'),
  TIPPING_CONTRACT_ADDRESS: z.string().min(1, 'TIPPING_CONTRACT_ADDRESS is required'),
  ECHO_CONTRACT_ADDRESS: z.string().min(1, 'ECHO_CONTRACT_ADDRESS is required'),

  // Blockchain - Arbitrum (Optional - for multi-chain)
  ARBITRUM_RPC_URL: z.string().default('https://sepolia-rollup.arbitrum.io/rpc'),
  ARBITRUM_NFT_CONTRACT_ADDRESS: z.string().optional(),
  ARBITRUM_TIPPING_CONTRACT_ADDRESS: z.string().optional(),
  ARBITRUM_ECHO_CONTRACT_ADDRESS: z.string().optional(),
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
  // Mantle
  RPC_URL: process.env.RPC_URL || 'https://rpc.sepolia.mantle.xyz',
  PRIVATE_KEY: process.env.PRIVATE_KEY || '',
  NFT_CONTRACT_ADDRESS: process.env.NFT_CONTRACT_ADDRESS || '',
  TIPPING_CONTRACT_ADDRESS: process.env.TIPPING_CONTRACT_ADDRESS || '',
  ECHO_CONTRACT_ADDRESS: process.env.ECHO_CONTRACT_ADDRESS || '',
  // Arbitrum
  ARBITRUM_RPC_URL: process.env.ARBITRUM_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc',
  ARBITRUM_NFT_CONTRACT_ADDRESS: process.env.ARBITRUM_NFT_CONTRACT_ADDRESS,
  ARBITRUM_TIPPING_CONTRACT_ADDRESS: process.env.ARBITRUM_TIPPING_CONTRACT_ADDRESS,
  ARBITRUM_ECHO_CONTRACT_ADDRESS: process.env.ARBITRUM_ECHO_CONTRACT_ADDRESS,
};

// Chain configuration type
export interface ChainEnvConfig {
  rpc: string;
  nft: string;
  tipping: string;
  echo: string;
}

// Get chain-specific config
export function getChainEnvConfig(chainId: number): ChainEnvConfig | null {
  switch (chainId) {
    case 5003: // Mantle Sepolia
      return {
        rpc: env.RPC_URL,
        nft: env.NFT_CONTRACT_ADDRESS,
        tipping: env.TIPPING_CONTRACT_ADDRESS,
        echo: env.ECHO_CONTRACT_ADDRESS,
      };
    case 421614: // Arbitrum Sepolia
      if (!env.ARBITRUM_NFT_CONTRACT_ADDRESS) return null;
      return {
        rpc: env.ARBITRUM_RPC_URL,
        nft: env.ARBITRUM_NFT_CONTRACT_ADDRESS,
        tipping: env.ARBITRUM_TIPPING_CONTRACT_ADDRESS || '',
        echo: env.ARBITRUM_ECHO_CONTRACT_ADDRESS || '',
      };
    default:
      return null;
  }
}

// Supported chain IDs
export const SUPPORTED_CHAIN_IDS = [5003, 421614];
export const DEFAULT_CHAIN_ID = 5003;
