import { create } from 'zustand';
import { Signal, WalletState, ModalType, MintingStatus, Toast } from '@/types';

interface RadioState {
  // Data
  signals: Signal[];
  currentSignal: Signal | null;
  activeView: string; // 'LIVE' | 'MY' | 'LOG'
  listenerCount: number;

  // Wallet
  wallet: WalletState;
  
  // UI State
  modal: ModalType;
  mintingStatus: MintingStatus;
  isRecording: boolean;
  isPlaying: boolean;
  recordingTime: number;
  toasts: Toast[];

  // Actions
  setSignals: (signals: Signal[]) => void;
  setCurrentSignal: (signal: Signal | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setActiveView: (view: string) => void;
  setWallet: (wallet: WalletState) => void;
  setModal: (modal: ModalType) => void;
  setMintingStatus: (status: MintingStatus) => void;
  setIsRecording: (isRecording: boolean) => void;
  setRecordingTime: (time: number) => void;
  addToast: (message: string, type: Toast['type']) => void;
  removeToast: (id: string) => void;
}

export const useRadioStore = create<RadioState>((set) => ({
  // Initial State
  signals: [],
  currentSignal: null,
  activeView: 'LIVE',
  listenerCount: 42,
  
  wallet: {
    isConnected: false,
    address: null,
    balance: '0',
  },

  modal: 'NONE',
  mintingStatus: 'IDLE',
  isRecording: false,
  isPlaying: false,
  recordingTime: 0,
  toasts: [],

  // Actions
  setSignals: (signals) => set({ signals }),
  setCurrentSignal: (currentSignal) => set({ currentSignal }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setActiveView: (activeView) => set({ activeView }),
  setWallet: (wallet) => set({ wallet }),
  setModal: (modal) => set({ modal }),
  setMintingStatus: (mintingStatus) => set({ mintingStatus }),
  setIsRecording: (isRecording) => set({ isRecording }),
  setRecordingTime: (recordingTime) => set({ recordingTime }),
  
  addToast: (message, type) => set((state) => ({
    toasts: [...state.toasts, { id: Math.random().toString(36).substr(2, 9), message, type }]
  })),
  
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  })),
}));
