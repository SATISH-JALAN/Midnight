import React, { useState, useRef, useEffect } from 'react';
import { X, Mic, Radio, Square, Play, Pause, Waves, Sparkles, Zap } from 'lucide-react';
import { MintingStatus, Signal } from '@/types';
import { cn } from '@/lib/utils';

interface EchoModalProps {
    onClose: () => void;
    isRecording: boolean;
    recordingTime: number;
    audioUrl: string | null;
    onRecordStart: () => void;
    onRecordStop: () => void;
    onMint: () => void;
    mintingStatus: MintingStatus;
    currentSignal: Signal | null;
}

export const EchoModal: React.FC<EchoModalProps> = ({
    onClose, isRecording, recordingTime, audioUrl, onRecordStart, onRecordStop, onMint, mintingStatus, currentSignal
}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const isMinting = mintingStatus !== 'IDLE';
    const hasRecording = audioUrl !== null && !isRecording;

    // Debug logging
    useEffect(() => {
        console.log('[EchoModal] State:', { isRecording, recordingTime, hasRecording, audioUrl: audioUrl?.substring(0, 30) });
    }, [isRecording, recordingTime, hasRecording, audioUrl]);

    const togglePlayback = () => {
        if (!audioUrl) return;
        if (!audioRef.current) {
            audioRef.current = new Audio(audioUrl);
            audioRef.current.onended = () => setIsPlaying(false);
        }
        if (isPlaying) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const handleReRecord = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setIsPlaying(false);
        onRecordStart();
    };

    return (
        <div className="w-full max-w-lg bg-gradient-to-b from-space-navy via-space-panel to-space-navy border border-ui-border/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center relative">

            {/* Decorative Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-accent-red/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-accent-cyan/10 rounded-full blur-[80px]" />
            </div>

            {/* Close Button */}
            {!isMinting && (
                <button onClick={onClose} className="absolute top-4 right-4 z-20 text-ui-dim hover:text-white bg-black/20 hover:bg-black/40 p-2 rounded-full transition-all">
                    <X size={18} />
                </button>
            )}

            {/* Header */}
            <div className="relative z-10 pt-6 pb-4 text-center">
                <div className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-mono uppercase tracking-wider transition-all",
                    isRecording
                        ? "bg-accent-red/20 text-accent-red border border-accent-red/30 animate-pulse"
                        : "bg-accent-purple/20 text-accent-purple border border-accent-purple/30"
                )}>
                    <Radio size={14} className={isRecording ? 'animate-spin' : ''} />
                    🔊 ECHO REPLY
                </div>
                {currentSignal && (
                    <div className="mt-3 text-center">
                        <p className="font-mono text-[10px] text-ui-dim">REPLYING TO</p>
                        <p className="font-display text-sm text-white mt-1">
                            Signal #{currentSignal.id?.substring(0, 6) || 'Unknown'}
                        </p>
                        <p className="font-mono text-[9px] text-ui-dim mt-1">
                            {currentSignal.source} • {currentSignal.broadcaster?.substring(0, 8)}...
                        </p>
                    </div>
                )}
            </div>

            {/* MINTING PROGRESS STATE */}
            {isMinting ? (
                <div className="relative z-10 w-full flex flex-col items-center py-8 px-8">
                    <div className="relative w-28 h-28 flex items-center justify-center mb-6">
                        <div className="absolute inset-0 border-4 border-ui-border/30 rounded-full" />
                        <div className="absolute inset-0 border-4 border-t-accent-phosphor border-r-accent-phosphor border-b-transparent border-l-transparent rounded-full animate-spin" />
                        <Zap size={32} className="text-accent-phosphor animate-pulse" />
                    </div>

                    <div className="space-y-3 w-full max-w-xs">
                        {(['COMPRESSING', 'IPFS_UPLOAD', 'AWAITING_SIGNATURE', 'MINTING'] as const).map((step, index) => {
                            const steps = ['COMPRESSING', 'IPFS_UPLOAD', 'AWAITING_SIGNATURE', 'MINTING'];
                            const currentIndex = steps.indexOf(mintingStatus);
                            const isComplete = index < currentIndex || mintingStatus === 'SUCCESS';
                            const isCurrent = step === mintingStatus;
                            const stepLabels: Record<string, string> = {
                                'COMPRESSING': 'Preparing audio...',
                                'IPFS_UPLOAD': 'Uploading to IPFS',
                                'AWAITING_SIGNATURE': 'Confirm in wallet',
                                'MINTING': 'Minting NFT',
                            };

                            return (
                                <div key={step} className={cn(
                                    "flex items-center gap-3 font-mono text-xs transition-all",
                                    isComplete ? 'text-accent-phosphor' : isCurrent ? 'text-white' : 'text-ui-dim/50'
                                )}>
                                    <div className={cn(
                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                        isComplete ? 'border-accent-phosphor bg-accent-phosphor' : isCurrent ? 'border-white' : 'border-ui-dim/30'
                                    )}>
                                        {isComplete && <span className="text-[10px] text-black font-bold">✓</span>}
                                        {isCurrent && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                                    </div>
                                    <span className={isCurrent ? 'font-medium' : ''}>{stepLabels[step]}</span>
                                </div>
                            );
                        })}
                    </div>

                    {mintingStatus === 'SUCCESS' && (
                        <div className="mt-6 flex flex-col items-center gap-2">
                            <Sparkles size={24} className="text-accent-phosphor animate-bounce" />
                            <span className="text-accent-phosphor font-display font-bold text-lg">TRANSMISSION COMPLETE!</span>
                        </div>
                    )}
                </div>
            ) : (
                /* RECORDING / REVIEW STATE */
                <div className="relative z-10 w-full flex flex-col items-center px-8 pb-8">

                    {/* Visualization Circle */}
                    <div className={cn(
                        "relative w-40 h-40 rounded-full flex items-center justify-center mb-6 transition-all duration-500",
                        isRecording
                            ? "bg-gradient-to-br from-accent-red/20 to-transparent border-2 border-accent-red shadow-[0_0_40px_rgba(255,42,42,0.4)]"
                            : hasRecording
                                ? "bg-gradient-to-br from-accent-phosphor/10 to-transparent border-2 border-accent-phosphor/50"
                                : "bg-gradient-to-br from-ui-border/10 to-transparent border-2 border-dashed border-ui-border/50"
                    )}>

                        {/* Recording Pulse */}
                        {isRecording && (
                            <>
                                <div className="absolute inset-0 bg-accent-red/20 rounded-full animate-ping" />
                                <div className="absolute inset-2 border border-accent-red/30 rounded-full animate-pulse" />
                            </>
                        )}

                        <div className="text-center relative z-10">
                            {isRecording ? (
                                <div className="flex flex-col items-center">
                                    {/* Waveform Animation */}
                                    <div className="flex gap-1 items-center h-8 mb-2">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className="w-1 bg-white rounded-full animate-waveform" style={{ animationDelay: `${i * 0.1}s`, minHeight: '6px' }} />
                                        ))}
                                    </div>
                                    <span className="font-mono text-3xl font-bold text-white tabular-nums">
                                        00:{recordingTime.toString().padStart(2, '0')}
                                    </span>
                                    <span className="font-mono text-[9px] text-accent-red mt-1 tracking-widest">● RECORDING</span>
                                </div>
                            ) : hasRecording ? (
                                <button onClick={togglePlayback} className="group flex flex-col items-center gap-2">
                                    <div className={cn(
                                        "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300",
                                        isPlaying
                                            ? "bg-accent-phosphor text-black"
                                            : "bg-white/10 text-white group-hover:bg-accent-phosphor group-hover:text-black"
                                    )}>
                                        {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                                    </div>
                                    <span className="font-mono text-[10px] text-ui-dim">{isPlaying ? 'PLAYING' : 'TAP TO PREVIEW'}</span>
                                </button>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2">
                                        <Mic size={24} className="text-ui-dim" />
                                    </div>
                                    <span className="font-mono text-[10px] text-ui-dim uppercase">Ready to record</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="w-full max-w-xs space-y-3">
                        {/* Start Recording */}
                        {!isRecording && !hasRecording && (
                            <button
                                onClick={onRecordStart}
                                className="w-full h-14 bg-gradient-to-r from-accent-red to-red-600 text-white font-bold font-display tracking-wider rounded-xl flex items-center justify-center gap-3 hover:from-red-600 hover:to-red-500 transition-all shadow-lg shadow-red-900/30 hover:scale-[1.02]"
                            >
                                <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                                START RECORDING
                            </button>
                        )}

                        {/* Stop Recording */}
                        {isRecording && (
                            <button
                                onClick={onRecordStop}
                                className="w-full h-14 bg-white/10 border-2 border-accent-red text-white font-bold font-display tracking-wider rounded-xl flex items-center justify-center gap-2 hover:bg-accent-red/10 transition-all"
                            >
                                <Square size={16} fill="currentColor" />
                                STOP RECORDING
                            </button>
                        )}

                        {/* Transmit / Re-record */}
                        {hasRecording && (
                            <>
                                <button
                                    onClick={onMint}
                                    className="w-full h-14 bg-gradient-to-r from-accent-phosphor to-green-400 text-black font-bold font-display tracking-wider rounded-xl flex items-center justify-center gap-2 hover:from-green-400 hover:to-accent-phosphor transition-all shadow-lg shadow-green-900/30 hover:scale-[1.02]"
                                >
                                    <Waves size={18} />
                                    TRANSMIT ECHO
                                </button>
                                <button
                                    onClick={handleReRecord}
                                    className="w-full h-10 text-xs font-mono text-ui-dim hover:text-white transition-colors"
                                >
                                    ↻ RE-RECORD
                                </button>
                            </>
                        )}
                    </div>

                    {/* Footer Info */}
                    {!isRecording && !hasRecording && (
                        <div className="mt-6 flex items-center gap-4 text-[10px] font-mono text-ui-dim/60">
                            <span>⏱ MAX 30 SEC</span>
                            <span className="w-1 h-1 rounded-full bg-ui-dim/30" />
                            <span>🔗 STORED ON IPFS</span>
                            <span className="w-1 h-1 rounded-full bg-ui-dim/30" />
                            <span>⛓ MANTLE NFT</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
