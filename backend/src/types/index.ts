/**
 * Note - A voice note in the queue
 */
export interface Note {
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
 * UploadRequest - Expected fields in upload form data
 */
export interface UploadRequest {
  audio: File;
  walletAddress: string;
}

/**
 * StreamResponse - Response from GET /api/stream
 */
export interface StreamResponse {
  notes: Note[];
  totalListeners: number;
  serverTime: number;
}

/**
 * UploadResponse - Response from POST /api/upload
 */
export interface UploadResponse {
  noteId: string;
  tokenId: number;
  audioUrl: string;
  duration: number;
  moodColor: string;
  expiresAt: number;
  txHash: string;
}

/**
 * WebSocket message types
 */
export type WSMessageType = 
  | 'connected'
  | 'listenerCount'
  | 'newNote'
  | 'tipReceived'
  | 'noteExpired'
  | 'ping'
  | 'pong';

export interface WSMessage<T = unknown> {
  type: WSMessageType;
  data?: T;
}
