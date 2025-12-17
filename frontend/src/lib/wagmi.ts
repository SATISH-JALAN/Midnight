import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mantle } from 'wagmi/chains';
import { http } from 'wagmi';

export const config = getDefaultConfig({
  appName: 'Midnight Radio',
  projectId: 'YOUR_PROJECT_ID', // TODO: Get from env or user
  chains: [mantle],
  transports: {
    [mantle.id]: http(),
  },
  ssr: false, // Vite is CSR
});
