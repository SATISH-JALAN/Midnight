import React, { useState } from 'react';
import { X, Mic, Radio, Square, Play, Check } from 'lucide-react';
import { MintingStatus, Signal } from '@/types';

interface EchoModalProps {
    onClose: () => void;
    isRecording: boolean;
    recordingTime: number;
    onRecordStart: () => void;
    onRecordStop: () => void;
    onMint: () => void;
    mintingStatus: MintingStatus;
    currentSignal: Signal | null;
}

export const EchoModal: React.FC<EchoModalProps> = ({
    onClose, isRecording, recordingTime, onRecordStart, onRecordStop, onMint, mintingStatus, currentSignal
}) => {
    const [isReviewing, setIsReviewing] = useState(false);
    const isMinting = mintingStatus !== 'IDLE';

    return (
        <div className="w-full max-w-xl bg-space-navy border border-ui-border rounded-2xl shadow-2xl overflow-hidden flex flex-col items-center p-8 md:p-12 relative transition-all">

            {!isMinting && <button onClick={onClose} className="absolute top-4 right-4 text-ui-dim hover:text-white"><X size={18} /></button>}

            {/* Header */}
            <div className="font-mono text-[10px] text-accent-red uppercase tracking-widest mb-8 border border-accent-red/20 px-3 py-1 rounded bg-accent-red/5 flex items-center gap-2">
                <Radio size={12} className={isRecording ? 'animate-pulse' : ''} />
                REPLYING TO SIGNAL #{currentSignal?.id?.substring(0, 6)}
            </div>

            {/* MINTING PROGRESS STATE */}
            {isMinting ? (
                <div className="w-full flex flex-col items-center py-8">
                    <div className="relative w-32 h-32 flex items-center justify-center mb-8">
                        <div className="absolute inset-0 border-4 border-ui-border rounded-full" />
                        <div className="absolute inset-0 border-4 border-t-accent-phosphor border-r-accent-phosphor border-b-transparent border-l-transparent rounded-full animate-spin" />
                        <div className="font-mono text-2xl font-bold text-accent-phosphor animate-pulse">
                            {mintingStatus === 'SUCCESS' ? '100%' : '...'}
                        </div>
                    </div>

                    <div className="space-y-4 w-full max-w-xs">
                        {['COMPRESSING', 'IPFS_UPLOAD', 'AWAITING_SIGNATURE', 'MINTING'].map((step, i) => (
                            <div key={step} className={`flex items-center gap-3 font-mono text-xs text-ui-dim`}>
                                <div className={`w-4 h-4 rounded-full border border-ui-dim`}></div>
                                <span>{step}</span>
                            </div>
                        ))}
                    </div>

                    {mintingStatus === 'SUCCESS' && (
                        <div className="mt-8 text-accent-phosphor font-display font-bold text-lg animate-bounce">
                            TRANSMISSION COMPLETE
                        </div>
                    )}
                </div>
            ) : (
                /* RECORDING / REVIEW STATE */
                <>
                    {/* Visualization Circle */}
                    <div className={`relative w-48 h-48 rounded-full border-2 flex items-center justify-center mb-8 transition-all ${isRecording ? 'border-accent-red shadow-[0_0_30px_rgba(255,42,42,0.3)]' : 'border-ui-border border-dashed'}`}>

                        {/* Recording Ping */}
                        {isRecording && <div className="absolute inset-0 bg-accent-red/10 rounded-full animate-ping" />}

                        <div className="text-center relative z-10">
                            {/* Timer */}
                            {isRecording ? (
                                <>
                                    <div className="font-mono text-4xl font-bold text-white tabular-nums animate-pulse">00:{recordingTime.toString().padStart(2, '0')}</div>
                                    <div className="font-mono text-[9px] text-accent-red mt-2 uppercase tracking-widest">RECORDING...</div>
                                </>
                            ) : recordingTime > 0 ? (
                                /* Review Controls */
                                <button
                                    onClick={() => setIsReviewing(!isReviewing)}
                                    className="group flex flex-col items-center gap-2"
                                >
                                    <div className="w-16 h-16 rounded-full bg-white/10 group-hover:bg-accent-phosphor group-hover:text-black flex items-center justify-center transition-all duration-300">
                                        {isReviewing ? <Square size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                                    </div>
                                    <div className="font-mono text-[10px] text-ui-dim group-hover:text-white uppercase tracking-wider">
                                        {isReviewing ? 'STOP REVIEW' : 'PREVIEW'}
                                    </div>
                                </button>
                            ) : (
                                /* Initial State */
                                <div className="flex flex-col items-center text-ui-dim">
                                    <Mic size={32} className="mb-2" />
                                    <span className="font-mono text-[9px] uppercase">Ready</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 w-full justify-center">
                        {/* 1. Start Recording */}
                        {!isRecording && recordingTime === 0 && (
                            <button onClick={onRecordStart} className="h-12 px-8 bg-accent-red text-white font-bold font-display tracking-wider rounded hover:bg-red-600 transition-colors shadow-lg shadow-red-900/20 flex items-center gap-2 hover:scale-105 transform duration-200">
                                <div className="w-2 h-2 rounded-full bg-white animate-pulse" /> REC
                            </button>
                        )}

                        {/* 2. Stop Recording */}
                        {isRecording && (
                            <button onClick={onRecordStop} className="h-12 px-8 border-2 border-accent-red text-accent-red font-bold font-display tracking-wider rounded hover:bg-accent-red/10 transition-colors">
                                STOP RECORDING
                            </button>
                        )}

                        {/* 3. Broadcast / Discard */}
                        {recordingTime > 0 && !isRecording && (
                            <div className="flex flex-col gap-3 w-full max-w-xs">
                                <button
                                    onClick={onMint}
                                    className="h-14 w-full bg-accent-phosphor text-black font-bold font-display tracking-wider rounded flex items-center justify-center gap-2 hover:bg-green-400 transition-all shadow-[0_0_20px_rgba(0,255,65,0.4)] hover:scale-105"
                                >
                                    <Radio size={18} className="animate-pulse" />
                                    TRANSMIT ECHO
                                </button>

                                <button onClick={() => { onRecordStart(); setIsReviewing(false); }} className="h-10 w-full text-xs font-mono text-ui-dim hover:text-white underline decoration-dotted">
                                    RE-RECORD
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Footer Info */}
                    {!isRecording && recordingTime === 0 && (
                        <div className="mt-8 text-center">
                            <p className="font-mono text-[10px] text-ui-dim">MAX DURATION: 30 SECONDS</p>
                            <p className="font-mono text-[10px] text-ui-dim mt-1">STORED PERMANENTLY ON MANTLE</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
