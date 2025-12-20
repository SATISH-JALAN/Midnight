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
      console.log('[AudioRecorder] Using MIME type:', type);
      return type;
    }
  }
  
  console.log('[AudioRecorder] Fallback to audio/wav');
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
    console.log('[AudioRecorder] Starting recording...');
    setError(null);
    setAudioBlob(null);
    
    // Revoke previous URL if exists
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    try {
      // Request microphone access
      console.log('[AudioRecorder] Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      });
      
      console.log('[AudioRecorder] Microphone access granted');
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
      
      console.log('[AudioRecorder] Recording started');
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
    console.log('[AudioRecorder] Stop recording called, isRecording:', isRecording);
    
    // Clear timer first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!recorderRef.current) {
      console.log('[AudioRecorder] No recorder ref found');
      setIsRecording(false);
      return;
    }

    // Set recording state to false immediately for UI responsiveness
    setIsRecording(false);

    recorderRef.current.stopRecording(() => {
      console.log('[AudioRecorder] Recording stopped callback');
      
      if (recorderRef.current) {
        const blob = recorderRef.current.getBlob();
        console.log('[AudioRecorder] Got blob:', blob.size, 'bytes, type:', blob.type);
        
        setAudioBlob(blob);
        
        // Create URL for playback
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        console.log('[AudioRecorder] Created audio URL:', url);
      }
      
      // Stop stream tracks to release mic
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('[AudioRecorder] Stopped track:', track.label);
        });
        streamRef.current = null;
      }
      
      // Clean up recorder
      recorderRef.current = null;
    });
  }, [isRecording]);

  const resetRecording = useCallback(() => {
    console.log('[AudioRecorder] Resetting recording');
    
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
