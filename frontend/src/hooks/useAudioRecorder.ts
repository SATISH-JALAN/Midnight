import { useState, useRef, useEffect, useCallback } from 'react';
import RecordRTC, { StereoAudioRecorder } from 'recordrtc';

interface UseAudioRecorderReturn {
  isRecording: boolean;
  recordingTime: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  resetRecording: () => void;
  hasPermission: boolean;
  error: string | null;
}

// Get best supported MIME type
const getSupportedMimeType = (): string => {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/wav',
    'audio/mp4',
  ];
  
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      
      return type;
    }
  }
  
  // Fallback to wav
  return 'audio/wav';
};

export const useAudioRecorder = (): UseAudioRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<RecordRTC | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = useCallback(async () => {

    setError(null);
    setAudioBlob(null);
    
    // Revoke previous URL if exists
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    try {
      // Request microphone access

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      });
      

      streamRef.current = stream;
      setHasPermission(true);

      const mimeType = getSupportedMimeType();

      // Configure RecordRTC
      const recorder = new RecordRTC(stream, {
        type: 'audio',
        mimeType: mimeType as any,
        recorderType: StereoAudioRecorder,
        numberOfAudioChannels: 1,
        desiredSampRate: 44100,
        disableLogs: false,
      });

      recorderRef.current = recorder;
      recorder.startRecording();
      

      setIsRecording(true);
      
      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error('[AudioRecorder] Failed to start recording:', err);
      setError(err.message || 'Microphone access denied');
      setIsRecording(false);
    }
  }, [audioUrl]);

  const stopRecording = useCallback(() => {

    
    // Clear timer first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Set recording state to false immediately for UI responsiveness
    setIsRecording(false);

    const recorder = recorderRef.current;
    if (!recorder) {
      console.log('[AudioRecorder] No recorder ref found');
      return;
    }

    // Check recorder state before stopping
    const state = recorder.getState?.() || recorder.state;

    
    if (state === 'recording') {
      recorder.stopRecording(() => {

        
        if (recorderRef.current) {
          const blob = recorderRef.current.getBlob();

          
          setAudioBlob(blob);
          
          // Create URL for playback
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);

        }
        
        // Stop stream tracks to release mic
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => {
            track.stop();

          });
          streamRef.current = null;
        }
        
        // Clean up recorder
        recorderRef.current = null;
      });
    } else {
      console.log('[AudioRecorder] Recorder not in recording state, forcing stop');
      // Force cleanup even if not in recording state
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      recorderRef.current = null;
    }
  }, []);

  const resetRecording = useCallback(() => {

    
    // Revoke URL
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setError(null);
    setIsRecording(false);
    
    // Clean up any lingering resources
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    recorderRef.current = null;
  }, [audioUrl]);

  return {
    isRecording,
    recordingTime,
    audioBlob,
    audioUrl,
    startRecording,
    stopRecording,
    resetRecording,
    hasPermission,
    error
  };
};
