import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http, defineChain } from 'viem';

// Define Mantle Sepolia Testnet
export const mantleSepolia = defineChain({
  id: 5003,
  name: 'Mantle Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'MNT',
    symbol: 'MNT',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.sepolia.mantle.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Mantle Sepolia Explorer',
      url: 'https://sepolia.mantlescan.xyz',
    },
  },
  testnet: true,
});

// Define Mantle Mainnet
export const mantleMainnet = defineChain({
  id: 5000,
  name: 'Mantle',
  nativeCurrency: {
    decimals: 18,
    name: 'MNT',
    symbol: 'MNT',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.mantle.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Mantle Explorer',
      url: 'https://mantlescan.xyz',
    },
  },
  testnet: false,
});

// Chain configuration
const appChains = [mantleSepolia, mantleMainnet] as const;

export const config = getDefaultConfig({
  appName: 'Midnight Radio',
  projectId: 'midnight-radio', // Replace with WalletConnect Project ID for production
  chains: appChains,
  transports: {
    [mantleSepolia.id]: http(),
    [mantleMainnet.id]: http(),
  },
  ssr: false,
});

// Export chains for use elsewhere
export { appChains as chains };
