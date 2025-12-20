/**
 * Hook for playing stream audio
 * Listens to isPlaying and currentSignal from store
 * Tracks playback time for countdown display
 */

import { useEffect, useRef } from 'react';
import { useRadioStore } from '@/store/useRadioStore';

export function useStreamAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { 
    currentSignal, 
    isPlaying, 
    setIsPlaying, 
    addToast,
    setPlaybackTime 
  } = useRadioStore();

  // Handle audio playback
  useEffect(() => {
    // Get audio URL from current signal
    const audioUrl = currentSignal?.audioUrl;

    // Stop if no audio or not playing
    if (!audioUrl || !isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      // Reset time when stopped
      setPlaybackTime(0, 0);
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
        setPlaybackTime(0, 0);
      };

      audioRef.current.onerror = (e) => {
        console.error('[StreamAudio] Error playing audio:', e);
        addToast('Failed to play audio', 'error');
        setIsPlaying(false);
        setPlaybackTime(0, 0);
      };

      audioRef.current.onloadedmetadata = () => {
        const duration = audioRef.current?.duration || 0;
        console.log('[StreamAudio] Audio loaded, duration:', duration);
        setPlaybackTime(0, duration);
      };

      // Update time as audio plays
      audioRef.current.ontimeupdate = () => {
        if (audioRef.current) {
          setPlaybackTime(
            audioRef.current.currentTime,
            audioRef.current.duration
          );
        }
      };
    }

    // Play audio
    console.log('[StreamAudio] Playing:', audioUrl);
    audioRef.current.play().catch((err) => {
      console.error('[StreamAudio] Play failed:', err);
      if (err.name !== 'AbortError') {
        addToast('Failed to play audio', 'error');
      }
      setIsPlaying(false);
      setPlaybackTime(0, 0);
    });

    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [isPlaying, currentSignal?.audioUrl, currentSignal?.id]);

  return {
    audioRef,
  };
}
