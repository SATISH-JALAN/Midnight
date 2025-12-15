import { create } from 'zustand';
import { 
  Signal, 
  WalletState, 
  ModalType, 
  MintingStatus, 
  Toast, 
  VoiceNoteNFT, 
  UserProfile, 
  LeaderboardEntry,
  AmbientPreferences,
  AppPreferences 
} from '@/types';

interface RadioState {
  // Data
  signals: Signal[]; // Live queue
  userNFTs: VoiceNoteNFT[]; // My Collection
  trendingSignals: Signal[]; // Explore page
  leaderboard: {
    topTipped: LeaderboardEntry[];
    mostEchoed: LeaderboardEntry[];
  };
  
  currentSignal: Signal | null;
  activeView: string; 
  listenerCount: number;

  // Wallet & User
  wallet: WalletState;
  userProfile: UserProfile | null;
  
  // Preferences
  ambient: AmbientPreferences;
  prefs: AppPreferences;

  // UI State
  modal: ModalType;
  modalProps: any; // Flexible props for modals (e.g. current NFT ID)
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
  
  setModal: (modal: ModalType, props?: any) => void;
  
  setMintingStatus: (status: MintingStatus) => void;
  setIsRecording: (isRecording: boolean) => void;
  setRecordingTime: (time: number) => void;
  
  // New Actions
  setUserNFTs: (nfts: VoiceNoteNFT[]) => void;
  setUserProfile: (profile: UserProfile) => void;
  setAmbient: (prefs: Partial<AmbientPreferences>) => void;
  setPrefs: (prefs: Partial<AppPreferences>) => void;
  
  addToast: (message: string, type: Toast['type']) => void;
  removeToast: (id: string) => void;
}

export const useRadioStore = create<RadioState>((set) => ({
  // Initial State
  signals: [],
  userNFTs: [], 
  trendingSignals: [],
  leaderboard: { topTipped: [], mostEchoed: [] },
  
  currentSignal: null,
  activeView: 'LIVE',
  listenerCount: 42,
  
  wallet: { isConnected: false, address: null, balance: '0' },
  userProfile: null,
  
  ambient: { rainVolume: 0, cityVolume: 0, voidVolume: 0, isEnabled: false },
  prefs: { theme: 'dark', lowDataMode: false, notifications: true, autoPlayNext: true },

  modal: 'NONE',
  modalProps: {},
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
  
  setModal: (modal, props = {}) => set({ modal, modalProps: props }),
  
  setMintingStatus: (mintingStatus) => set({ mintingStatus }),
  setIsRecording: (isRecording) => set({ isRecording }),
  setRecordingTime: (recordingTime) => set({ recordingTime }),
  
  setUserNFTs: (userNFTs) => set({ userNFTs }),
  setUserProfile: (userProfile) => set({ userProfile }),
  setAmbient: (newAmbient) => set((state) => ({ ambient: { ...state.ambient, ...newAmbient } })),
  setPrefs: (newPrefs) => set((state) => ({ prefs: { ...state.prefs, ...newPrefs } })),
  
  addToast: (message, type) => set((state) => ({
    toasts: [...state.toasts, { id: Math.random().toString(36).substr(2, 9), message, type }]
  })),
  
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  })),
}));
