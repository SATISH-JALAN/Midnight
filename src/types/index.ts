export type SignalMood = 'CALM' | 'EXCITED' | 'MYSTERIOUS' | 'URGENT' | 'VOID';

export interface Signal {
  id: string;
  sector: string; // e.g., "7G-Delta"
  frequency: number; // e.g., 432.45
  duration: number; // in seconds
  timestamp: Date;
  mood: SignalMood;
  tips: number; // in MNT
  echoes: number; // reply count
  isPlaying?: boolean;
  isExpired?: boolean;
}

export interface User {
  address: string | null;
  balance: number;
}

// Added 'ECHO' to ModalType
export type ModalType = 'NONE' | 'RECORD' | 'WALLET' | 'TIP' | 'ECHO';
export type MintingStatus = 'IDLE' | 'COMPRESSING' | 'IPFS_UPLOAD' | 'AWAITING_SIGNATURE' | 'MINTING' | 'SUCCESS';

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string;
}

export interface Toast {
  id: string;
  message: string;
  type: 'SUCCESS' | 'INFO' | 'WARNING';
}

export interface AppState {
  signals: Signal[];
  currentSignalId: string | null;
  isPlaying: boolean;
  wallet: WalletState;
  modal: ModalType;
  recordingTime: number;
  isRecording: boolean;
  mintingStatus: MintingStatus;
}