/**
 * Multi-Chain Configuration for Midnight Radio
 * 
 * Central configuration for all supported blockchain networks.
 * Contract addresses are stored here and accessed dynamically based on connected chain.
 */

export interface ChainConfig {
  id: number;
  name: string;
  shortName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpc: string;
  explorer: string;
  explorerApi: string;
  contracts: {
    voiceNoteNFT: `0x${string}`;
    tippingPool: `0x${string}`;
    echoRegistry: `0x${string}`;
  };
  color: string;
  isTestnet: boolean;
}

/**
 * Supported chain configurations
 * Add new chains here as they are deployed
 */
export const CHAIN_CONFIGS: Record<number, ChainConfig> = {
  // Mantle Sepolia Testnet
  5003: {
    id: 5003,
    name: 'Mantle Sepolia',
    shortName: 'MNT',
    nativeCurrency: { name: 'MNT', symbol: 'MNT', decimals: 18 },
    rpc: 'https://rpc.sepolia.mantle.xyz',
    explorer: 'https://sepolia.mantlescan.xyz',
    explorerApi: 'https://api-sepolia.mantlescan.xyz/api',
    contracts: {
      voiceNoteNFT: '0x0b118a0F67D6F2329ad993A844549aED4cEa0E15',
      tippingPool: '0x3543243e2dD9027d8f7Ad53373f31d155ffc410F',
      echoRegistry: '0x4e958ca11AF6bF47366A9a0629205FA6822Bae54',
    },
    color: '#00D2FF',
    isTestnet: true,
  },

  // Arbitrum Sepolia Testnet
  421614: {
    id: 421614,
    name: 'Arbitrum Sepolia',
    shortName: 'ARB',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    rpc: 'https://sepolia-rollup.arbitrum.io/rpc',
    explorer: 'https://sepolia.arbiscan.io',
    explorerApi: 'https://api-sepolia.arbiscan.io/api',
    contracts: {
      voiceNoteNFT: '0xA3505e375C6d8CB1f0b3C934b30b93EF8f3211c5',
      tippingPool: '0x46806F2A15153B48d3Ef81315a99ecB9185a5CAB',
      echoRegistry: '0x75240874908ccE7648ed68966Ea766579CB4E2BA',
    },
    color: '#2D374B',
    isTestnet: true,
  },

  // Mantle Mainnet (for future)
  5000: {
    id: 5000,
    name: 'Mantle',
    shortName: 'MNT',
    nativeCurrency: { name: 'MNT', symbol: 'MNT', decimals: 18 },
    rpc: 'https://rpc.mantle.xyz',
    explorer: 'https://mantlescan.xyz',
    explorerApi: 'https://api.mantlescan.xyz/api',
    contracts: {
      voiceNoteNFT: '0x0000000000000000000000000000000000000000',
      tippingPool: '0x0000000000000000000000000000000000000000',
      echoRegistry: '0x0000000000000000000000000000000000000000',
    },
    color: '#00D2FF',
    isTestnet: false,
  },
};

// Supported testnet chain IDs (for development)
export const SUPPORTED_TESTNET_IDS = [5003, 421614] as const;

// All supported chain IDs
export const SUPPORTED_CHAIN_IDS = Object.keys(CHAIN_CONFIGS).map(Number);

// Default chain (Mantle Sepolia)
export const DEFAULT_CHAIN_ID = 5003;

/**
 * Get chain configuration by ID
 * Falls back to default chain if not found
 */
export function getChainConfig(chainId: number | undefined): ChainConfig {
  if (!chainId) return CHAIN_CONFIGS[DEFAULT_CHAIN_ID];
  return CHAIN_CONFIGS[chainId] || CHAIN_CONFIGS[DEFAULT_CHAIN_ID];
}

/**
 * Get contract address for a specific chain
 */
export function getContractAddress(
  chainId: number | undefined, 
  contract: keyof ChainConfig['contracts']
): `0x${string}` {
  const config = getChainConfig(chainId);
  return config.contracts[contract];
}

/**
 * Check if a chain is supported
 */
export function isChainSupported(chainId: number): boolean {
  return chainId in CHAIN_CONFIGS;
}

/**
 * Get explorer URL for a transaction
 */
export function getExplorerTxUrl(chainId: number | undefined, txHash: string): string {
  const config = getChainConfig(chainId);
  return `${config.explorer}/tx/${txHash}`;
}

/**
 * Get explorer URL for an address
 */
export function getExplorerAddressUrl(chainId: number | undefined, address: string): string {
  const config = getChainConfig(chainId);
  return `${config.explorer}/address/${address}`;
}
