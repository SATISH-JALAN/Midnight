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
    chainId: number | null;
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
 * Fetch active stream/notes for a specific chain
 */
export async function fetchStream(chainId?: number): Promise<StreamResponse> {
  const url = chainId 
    ? `${API_BASE}/api/stream?chainId=${chainId}` 
    : `${API_BASE}/api/stream`;
  const response = await fetch(url);
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
export async function fetchCollection(walletAddress: string, chainId?: number): Promise<CollectionResponse> {
  try {
    const params = chainId ? `?chainId=${chainId}` : '';
    const response = await fetch(`${API_BASE}/api/collection/${walletAddress}${params}`);
    return response.json();
  } catch (err) {
    console.error('[API] Failed to fetch collection:', err);
    return { success: false, error: 'Failed to fetch collection' };
  }
}

/**
 * Fetch all NFTs (for explore)
 */
export async function fetchAllNFTs(chainId?: number): Promise<CollectionResponse> {
  try {
    const params = chainId ? `?chainId=${chainId}` : '';
    const response = await fetch(`${API_BASE}/api/collection${params}`);
    return response.json();
  } catch (err) {
    console.error('[API] Failed to fetch all NFTs:', err);
    return { success: false, error: 'Failed to fetch NFTs' };
  }
}

// ============= ECHO API =============

export interface EchoResponse {
  success: boolean;
  data?: {
    echoNoteId: string;
    parentNoteId: string;
    audioUrl: string;
    metadataUrl: string;
    duration: number;
    txHash: string | null;
  };
  error?: string;
}

export interface EchoListResponse {
  success: boolean;
  data?: {
    parentNoteId: string;
    echoes: StreamNote[];
    count: number;
  };
  error?: string;
}

/**
 * Upload an echo reply to a parent note
 */
export async function uploadEcho(
  parentNoteId: string,
  audioBlob: Blob,
  walletAddress: string,
  chainId?: number
): Promise<EchoResponse> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'echo.webm');
  formData.append('walletAddress', walletAddress);
  if (chainId) {
    formData.append('chainId', chainId.toString());
  }

  try {
    const response = await fetch(`${API_BASE}/api/echo/${parentNoteId}`, {
      method: 'POST',
      body: formData,
    });
    return response.json();
  } catch (err) {
    console.error('[API] Failed to upload echo:', err);
    return { success: false, error: 'Failed to upload echo' };
  }
}

/**
 * Fetch echoes for a parent note
 */
export async function fetchEchoes(parentNoteId: string): Promise<EchoListResponse> {
  try {
    const response = await fetch(`${API_BASE}/api/echo/${parentNoteId}`);
    return response.json();
  } catch (err) {
    console.error('[API] Failed to fetch echoes:', err);
    return { success: false, error: 'Failed to fetch echoes' };
  }
}

/**
 * Get echo fee
 */
export async function getEchoFee(): Promise<{ success: boolean; data?: { fee: string; currency: string }; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/api/echo/fee`);
    return response.json();
  } catch (err) {
    console.error('[API] Failed to get echo fee:', err);
    return { success: false, error: 'Failed to get echo fee' };
  }
}
