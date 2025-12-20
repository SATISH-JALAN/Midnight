/**
 * API Service for Midnight Radio Backend
 */

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

export interface UploadResponse {
  success: boolean;
  data?: {
    noteId: string;
    audioUrl: string;
    metadataUrl: string;
    duration: number;
    moodColor: string;
    expiresAt: number;
    sector: string;
  };
  error?: string;
}

export interface StreamResponse {
  success: boolean;
  data?: {
    notes: StreamNote[];
    totalListeners: number;
    activeNotes: number;
    serverTime: number;
  };
  error?: string;
}

export interface StreamNote {
  noteId: string;
  tokenId: number;
  audioUrl: string;
  metadataUrl: string;
  duration: number;
  moodColor: string;
  waveform: number[];
  timestamp: number;
  expiresAt: number;
  broadcaster: string;
  sector: string;
  tips: number;
  echoes: number;
}

/**
 * Upload audio to backend
 */
export async function uploadAudio(
  audioBlob: Blob, 
  walletAddress: string
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  formData.append('walletAddress', walletAddress);

  const response = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  return response.json();
}

/**
 * Fetch active stream/notes
 */
export async function fetchStream(): Promise<StreamResponse> {
  const response = await fetch(`${API_BASE}/api/stream`);
  return response.json();
}

/**
 * Fetch a specific note
 */
export async function fetchNote(noteId: string): Promise<{ success: boolean; data?: StreamNote; error?: string }> {
  const response = await fetch(`${API_BASE}/api/stream/${noteId}`);
  return response.json();
}

/**
 * Get audio URL for a note
 */
export function getAudioUrl(noteId: string): string {
  return `${API_BASE}/api/audio/${noteId}`;
}

/**
 * Health check
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
}

/**
 * Collection NFT item interface
 */
export interface CollectionNFT {
  tokenId: string;
  noteId: string;
  creator: string;
  owner: string;
  tokenURI: string;
  audioUrl: string;
  metadata: {
    name: string;
    description: string;
    image: string;
    audioUrl: string;
    duration: number;
    moodColor: string;
    waveform: number[];
    attributes: { trait_type: string; value: string | number }[];
  };
  isListed: boolean;
  price?: string;
  createdAt: string;
  expiresAt: string;
  tips: number;
  echoes: number;
}

export interface CollectionResponse {
  success: boolean;
  data?: {
    address?: string;
    nfts: CollectionNFT[];
    totalCount: number;
  };
  error?: string;
}

/**
 * Fetch user's NFT collection
 */
export async function fetchCollection(walletAddress: string): Promise<CollectionResponse> {
  try {
    const response = await fetch(`${API_BASE}/api/collection/${walletAddress}`);
    return response.json();
  } catch (err) {
    console.error('[API] Failed to fetch collection:', err);
    return { success: false, error: 'Failed to fetch collection' };
  }
}

/**
 * Fetch all NFTs (for explore)
 */
export async function fetchAllNFTs(): Promise<CollectionResponse> {
  try {
    const response = await fetch(`${API_BASE}/api/collection`);
    return response.json();
  } catch (err) {
    console.error('[API] Failed to fetch all NFTs:', err);
    return { success: false, error: 'Failed to fetch NFTs' };
  }
}
