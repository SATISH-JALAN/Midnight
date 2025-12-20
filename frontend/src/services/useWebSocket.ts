/**
 * WebSocket hook for real-time updates
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useRadioStore } from '@/store/useRadioStore';
import type { StreamNote } from './api';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';

interface WSMessage {
  type: 'connected' | 'listenerCount' | 'newNote' | 'tipReceived' | 'noteExpired' | 'pong';
  data?: any;
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const { 
    setSignals, 
    signals,
    addToast 
  } = useRadioStore();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WS] Connected');
        setIsConnected(true);
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

      ws.onclose = () => {
        console.log('[WS] Disconnected');
        setIsConnected(false);
        wsRef.current = null;
        
        // Reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('[WS] Reconnecting...');
          connect();
        }, 3000);
      };

      ws.onerror = (err) => {
        console.error('[WS] Error:', err);
      };
    } catch (err) {
      console.error('[WS] Failed to connect:', err);
    }
  }, []);

  const handleMessage = useCallback((msg: WSMessage) => {
    const store = useRadioStore.getState();
    
    switch (msg.type) {
      case 'connected':
        console.log('[WS] Welcome:', msg.data);
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
            mood: getMoodFromColor(newNote.moodColor),
            tips: newNote.tips,
            echoes: newNote.echoes,
            hasAudio: true,
            // Custom fields
            noteId: newNote.noteId,
            audioUrl: newNote.audioUrl,
            broadcaster: newNote.broadcaster,
            expiresAt: newNote.expiresAt,
            moodColor: newNote.moodColor,
            waveform: newNote.waveform,
          },
          ...store.signals.slice(0, 99), // Keep max 100
        ];
        useRadioStore.setState({ signals: updatedSignals });
        store.addToast('New transmission received!', 'info');
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

  // Connect on mount
  useEffect(() => {
    connect();

    // Heartbeat every 30 seconds
    const heartbeat = setInterval(sendPing, 30000);

    return () => {
      clearInterval(heartbeat);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
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
