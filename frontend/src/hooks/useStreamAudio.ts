/**
 * Hook for playing stream audio
 * Listens to isPlaying and currentSignal from store
 */

import { useEffect, useRef } from 'react';
import { useRadioStore } from '@/store/useRadioStore';

export function useStreamAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { currentSignal, isPlaying, setIsPlaying, addToast } = useRadioStore();

  // Handle audio playback
  useEffect(() => {
    // Get audio URL from current signal
    const audioUrl = currentSignal?.audioUrl;

    // Stop if no audio or not playing
    if (!audioUrl || !isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      return;
    }

    // Create new audio element if needed or URL changed
    if (!audioRef.current || audioRef.current.src !== audioUrl) {
      // Clean up existing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }

      audioRef.current = new Audio(audioUrl);
      
      // Set up event listeners
      audioRef.current.onended = () => {
        console.log('[StreamAudio] Track ended');
        setIsPlaying(false);
        // Could auto-play next track here
      };

      audioRef.current.onerror = (e) => {
        console.error('[StreamAudio] Error playing audio:', e);
        addToast('Failed to play audio', 'error');
        setIsPlaying(false);
      };

      audioRef.current.onloadeddata = () => {
        console.log('[StreamAudio] Audio loaded:', audioUrl);
      };
    }

    // Play audio
    console.log('[StreamAudio] Playing:', audioUrl);
    audioRef.current.play().catch((err) => {
      console.error('[StreamAudio] Play failed:', err);
      // Don't show toast for abort errors (happens when quickly switching)
      if (err.name !== 'AbortError') {
        addToast('Failed to play audio', 'error');
      }
      setIsPlaying(false);
    });

    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [isPlaying, currentSignal?.audioUrl, currentSignal?.id]);

  // Pause when signal changes
  useEffect(() => {
    if (audioRef.current && currentSignal) {
      // New signal selected - audio URL will be different
      // The above effect will handle creating new audio
    }
  }, [currentSignal?.id]);

  return {
    audioRef,
  };
}
