import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, ExternalLink, Play, Pause, Clock, Tag, Volume2 } from 'lucide-react';
import { VoiceNoteNFT } from '@/types';
import { getVoiceNoteNFTAddress } from '@/lib/contracts';
import { useChainId } from 'wagmi';
import { getChainConfig } from '@/lib/chains';

interface NFTDetailModalProps {
    onClose: () => void;
    nft?: VoiceNoteNFT | null;
}

// Extended NFT type with audio data from collection
interface ExtendedNFT extends VoiceNoteNFT {
    audioUrl?: string;
    duration?: number;
    moodColor?: string;
    waveform?: number[];
    tips?: number;
    echoes?: number;
}

export const NFTDetailModal: React.FC<NFTDetailModalProps> = ({ onClose, nft }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    if (!nft) return null;

    // Cast to extended type to access audio properties
    const extendedNft = nft as ExtendedNFT;

    // Helper to extract attributes safely
    const getAttr = (key: string) => nft.metadata.attributes?.find(a => a.trait_type === key)?.value || 'Unknown';

    // Get audio URL from metadata or extended properties
    const audioUrl = extendedNft.audioUrl || (nft.metadata as any)?.audioUrl;

    // Chain-aware explorer URL
    const chainId = useChainId();
    const chainConfig = useMemo(() => getChainConfig(chainId), [chainId]);
    const nftAddress = useMemo(() => getVoiceNoteNFTAddress(chainId), [chainId]);
    const tokenIdNum = parseInt(nft.tokenId);
    const explorerUrl = !isNaN(tokenIdNum) && tokenIdNum > 0
        ? `${chainConfig.explorer}/token/${nftAddress}?a=${tokenIdNum}`
        : `${chainConfig.explorer}/address/${nftAddress}`;

    // Audio playback handlers
    const togglePlayback = async () => {
        if (!audioUrl) {
            console.error('[NFTDetail] No audio URL available');
            return;
        }

        if (!audioRef.current) {
            audioRef.current = new Audio(audioUrl);
            audioRef.current.addEventListener('timeupdate', () => {
                setCurrentTime(audioRef.current?.currentTime || 0);
            });
            audioRef.current.addEventListener('loadedmetadata', () => {
                setDuration(audioRef.current?.duration || 0);
            });
            audioRef.current.addEventListener('ended', () => {
                setIsPlaying(false);
                setCurrentTime(0);
            });
            audioRef.current.addEventListener('error', (e) => {
                console.error('[NFTDetail] Audio error:', e);
                setIsPlaying(false);
            });
        }

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            try {
                await audioRef.current.play();
                setIsPlaying(true);
            } catch (err: any) {
                // Ignore AbortError - this happens when play is interrupted
                if (err.name !== 'AbortError') {
                    console.error('[NFTDetail] Failed to play:', err);
                }
            }
        }
    };

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    // Format time as MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Get duration from metadata or audio
    const displayDuration = extendedNft.duration || duration || getAttr('Duration');

    return (
        <div className="w-full max-w-2xl bg-space-navy border border-ui-border rounded-xl overflow-hidden relative flex flex-col md:flex-row h-[500px] shadow-2xl">
            <button onClick={onClose} className="absolute top-3 right-3 md:top-4 md:right-4 z-10 text-white bg-black/40 p-3 md:p-1.5 rounded-full hover:bg-white/20 transition-colors backdrop-blur min-w-[44px] min-h-[44px] flex items-center justify-center"><X size={20} className="md:w-[18px] md:h-[18px]" /></button>

            {/* Left: Visual & Player */}
            <div className="w-full md:w-1/2 bg-black/40 relative flex items-center justify-center p-8 bg-[url('https://images.unsplash.com/photo-1614726365723-49fa5389a37a?q=80&w=2574')] bg-cover bg-center">
                <div className="absolute inset-0 bg-space-navy/60 backdrop-blur-sm" />

                <div className="relative z-10 text-center">
                    {/* Play Button */}
                    <button
                        onClick={togglePlayback}
                        disabled={!audioUrl}
                        className={`w-20 h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:scale-110 transition-transform mb-4 backdrop-blur-md shadow-[0_0_30px_rgba(6,182,212,0.3)] group ${!audioUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isPlaying ? (
                            <Pause fill="white" className="w-8 h-8 text-white" />
                        ) : (
                            <Play fill="white" className="ml-1 w-8 h-8 group-hover:text-accent-cyan transition-colors" />
                        )}
                    </button>

                    {/* Playback Progress */}
                    {audioUrl && (
                        <div className="mb-4 w-full px-4">
                            <div className="flex items-center gap-2 text-[10px] font-mono text-ui-dim">
                                <span>{formatTime(currentTime)}</span>
                                <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-accent-cyan transition-all duration-200"
                                        style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
                                    />
                                </div>
                                <span>{typeof displayDuration === 'number' ? formatTime(displayDuration) : displayDuration}</span>
                            </div>
                        </div>
                    )}

                    {/* Signal ID Badge */}
                    <div className="font-mono text-xs text-accent-cyan tracking-widest bg-black/40 px-3 py-1 rounded-full border border-accent-cyan/30 inline-block">
                        SIGNAL #{nft.tokenId.substring(0, 6)}
                    </div>

                    {/* No Audio Warning */}
                    {!audioUrl && (
                        <div className="mt-4 text-[10px] text-ui-dim/60 font-mono">
                            <Volume2 size={12} className="inline mr-1" />
                            Audio not available
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Info */}
            <div className="w-full md:w-1/2 p-8 flex flex-col bg-space-panel/90">
                <div className="mb-6">
                    <h2 className="font-display font-bold text-2xl text-white mb-2 leading-tight">{nft.metadata.name}</h2>
                    <p className="text-ui-dim text-xs font-mono line-clamp-3 leading-relaxed">
                        {nft.metadata.description}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="p-3 bg-black/20 rounded border border-ui-border">
                        <div className="text-[10px] text-ui-dim uppercase mb-1 flex items-center gap-1"><Clock size={10} /> CREATED</div>
                        <div className="font-mono text-xs text-white truncate">{new Date(nft.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="p-3 bg-black/20 rounded border border-ui-border">
                        <div className="text-[10px] text-ui-dim uppercase mb-1 flex items-center gap-1"><Tag size={10} /> MOOD</div>
                        <div className="font-mono text-xs text-accent-phosphor">{getAttr('Mood')}</div>
                    </div>
                </div>

                <div className="space-y-4 mb-auto text-sm">
                    <div className="flex justify-between items-center border-b border-ui-border/30 pb-2">
                        <span className="text-ui-dim">Creator</span>
                        <span className="font-mono text-accent-cyan truncate w-32 text-right" title={nft.creator}>{nft.creator}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-ui-border/30 pb-2">
                        <span className="text-ui-dim">Sector</span>
                        <span className="font-mono text-white">{getAttr('Sector')}</span>
                    </div>
                    {extendedNft.tips !== undefined && extendedNft.tips > 0 && (
                        <div className="flex justify-between items-center border-b border-ui-border/30 pb-2">
                            <span className="text-ui-dim">Tips Received</span>
                            <span className="font-mono text-accent-orange">{extendedNft.tips} MNT</span>
                        </div>
                    )}
                    {nft.price && (
                        <div className="flex justify-between items-center pt-1">
                            <span className="text-ui-dim">Price</span>
                            <span className="font-display font-bold text-accent-orange text-lg">{nft.price} MNT</span>
                        </div>
                    )}
                </div>

                <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 mt-6 border border-ui-border text-ui-dim hover:text-white hover:border-accent-cyan hover:bg-accent-cyan/5 rounded flex items-center justify-center gap-2 text-xs font-mono font-bold tracking-wider transition-all"
                >
                    VIEW ON {chainConfig.name.toUpperCase()} <ExternalLink size={12} />
                </a>
            </div>
        </div>
    );
};
