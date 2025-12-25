/**
 * WebSocket hook for real-time updates
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useRadioStore } from '@/store/useRadioStore';
import type { StreamNote } from './api';

const WS_URL = (import.meta as any).env?.VITE_WS_URL || 'ws://localhost:3001/ws';

interface WSMessage {
  type: 'connected' | 'listenerCount' | 'newNote' | 'tipReceived' | 'noteExpired' | 'pong';
  data?: any;
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const { 
    setSignals, 
    signals,
    addToast 
  } = useRadioStore();

  const connect = useCallback(() => {
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    if (wsRef.current?.readyState === WebSocket.CONNECTING) return;

    // Clean up any existing connection
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      if (wsRef.current.readyState !== WebSocket.CLOSED) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }

    isConnectingRef.current = true;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {

        setIsConnected(true);
        isConnectingRef.current = false;
        // Clear any pending reconnect
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);
          handleMessage(msg);
        } catch (err) {
          console.error('[WS] Parse error:', err);
        }
      };

      ws.onclose = (event) => {
        console.log('[WS] Disconnected', event.code);
        setIsConnected(false);
        isConnectingRef.current = false;
        wsRef.current = null;
        
        // Only reconnect if not a normal closure
        if (event.code !== 1000) {
          reconnectTimeoutRef.current = setTimeout(() => {

            connect();
          }, 3000);
        }
      };

      ws.onerror = () => {
        // Error is logged but onclose will handle reconnection
        isConnectingRef.current = false;
      };
    } catch (err) {
      console.error('[WS] Failed to connect:', err);
      isConnectingRef.current = false;
    }
  }, []);

  const handleMessage = useCallback((msg: WSMessage) => {
    const store = useRadioStore.getState();
    
    switch (msg.type) {
      case 'connected':

        // Update listener count from server
        if (msg.data?.listenerCount !== undefined) {
          useRadioStore.setState({ listenerCount: msg.data.listenerCount });
        }
        break;

      case 'listenerCount':
        useRadioStore.setState({ listenerCount: msg.data.count });
        break;

      case 'newNote':
        // Add new note to beginning of signals array
        const newNote = msg.data as StreamNote;
        const updatedSignals = [
          {
            id: newNote.noteId,
            source: newNote.sector,
            frequency: 880,
            duration: `${Math.floor(newNote.duration / 60)}:${(newNote.duration % 60).toString().padStart(2, '0')}`,
            timestamp: new Date(newNote.timestamp).toISOString(),
            mood: getMoodFromColor(newNote.moodColor) as any,
            tips: newNote.tips,
            echoes: newNote.echoes,
            hasAudio: true,
            // Custom fields
            noteId: newNote.noteId,
            audioUrl: newNote.audioUrl,
            broadcaster: newNote.broadcaster,
            expiresAt: new Date(newNote.expiresAt).toISOString(),
            moodColor: newNote.moodColor,
            waveform: newNote.waveform,
          },
          ...store.signals.slice(0, 99), // Keep max 100
        ];
        useRadioStore.setState({ signals: updatedSignals });
        store.addToast('New transmission received!', 'INFO');
        break;

      case 'tipReceived':
        // Update tip count for the note
        const { tokenId, amount } = msg.data;
        const tippedSignals = store.signals.map((s: any) => 
          s.tokenId === tokenId ? { ...s, tips: s.tips + parseFloat(amount) } : s
        );
        useRadioStore.setState({ signals: tippedSignals });
        break;

      case 'noteExpired':
        // Remove expired note
        const expiredSignals = store.signals.filter((s: any) => s.noteId !== msg.data.noteId);
        useRadioStore.setState({ signals: expiredSignals });
        break;

      case 'pong':
        // Heartbeat response
        break;
    }
  }, []);

  const sendPing = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'ping' }));
    }
  }, []);

  // Connect on mount with delay to prevent React StrictMode issues
  useEffect(() => {
    let mounted = true;
    
    // Small delay to prevent immediate close from StrictMode double-mount
    const connectTimeout = setTimeout(() => {
      if (mounted) {
        connect();
      }
    }, 100);

    // Heartbeat every 30 seconds
    const heartbeat = setInterval(sendPing, 30000);

    return () => {
      mounted = false;
      clearTimeout(connectTimeout);
      clearInterval(heartbeat);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      // Clean close
      if (wsRef.current) {
        wsRef.current.onclose = null; // Prevent reconnection on cleanup
        wsRef.current.close(1000, 'Component unmounted');
        wsRef.current = null;
      }
      isConnectingRef.current = false;
    };
  }, [connect, sendPing]);

  return { isConnected, connect };
}

// Helper to convert color to mood
function getMoodFromColor(color: string): string {
  switch (color) {
    case '#0EA5E9': return 'CALM';
    case '#F97316': return 'EXCITED';
    case '#A855F7': return 'MYSTERIOUS';
    case '#EF4444': return 'URGENT';
    default: return 'CALM';
  }
}
