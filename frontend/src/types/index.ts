export type SignalMood = 'CALM' | 'EXCITED' | 'MYSTERIOUS' | 'URGENT' | 'VOID';

export interface Signal {
  id: string;
  source: string; // e.g., "Sector 7G-Delta"
  frequency: number; // e.g., 432.45
  duration: string; // "01:32" (Changed from number to string to match usage)
  timestamp: string; // ISO String
  mood: SignalMood;
  tips: number; // in MNT
  echoes: number; // reply count
  isPlaying?: boolean;
  isExpired?: boolean;
  // New Metadata
  broadcasterAddress?: string;
  hasAudio?: boolean;
}

// Full NFT Interface for Collection/Details
export interface VoiceNoteNFT {
  tokenId: string;
  creator: string;
  owner: string;
  tokenURI: string;
  metadata: {
    name: string;
    description: string;
    image: string;
    attributes: { trait_type: string; value: string | number }[];
  };
  isListed: boolean;
  price?: string;
  createdAt: string;
}

export interface UserProfile {
  address: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string; // Custom or gradient
  joinedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  signalId: string;
  sector: string;
  value: number; // Tips or Echoes count
  trend: 'up' | 'down' | 'neutral';
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string;
  networkId?: number;
}

export type ModalType = 'NONE' | 'RECORD' | 'WALLET' | 'TIP' | 'ECHO' | 'NFT_DETAIL' | 'BROADCAST_SUCCESS';
export type MintingStatus = 'IDLE' | 'RECORDING' | 'ANALYZING' | 'COMPRESSING' | 'IPFS_UPLOAD' | 'UPLOADING' | 'MINTING' | 'SUCCESS' | 'ERROR';

export type ViewType = 'LIVE' | 'MY' | 'EXPLORE' | 'BROADCAST' | 'SETTINGS';

export interface Toast {
  id: string;
  message: string;
  type: 'SUCCESS' | 'ERROR' | 'INFO' | 'WARNING';
}

export interface AmbientPreferences {
  rainVolume: number; // 0-100
  cityVolume: number;
  voidVolume: number;
  isEnabled: boolean;
}

export interface AppPreferences {
  theme: 'dark' | 'light' | 'system';
  lowDataMode: boolean;
  notifications: boolean;
  autoPlayNext: boolean;
}