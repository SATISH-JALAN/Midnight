import React from 'react';
import { X, ExternalLink, Play, Clock, Share2, Tag } from 'lucide-react';
import { VoiceNoteNFT } from '@/types';

interface NFTDetailModalProps {
    onClose: () => void;
    nft?: VoiceNoteNFT | null;
}

export const NFTDetailModal: React.FC<NFTDetailModalProps> = ({ onClose, nft }) => {
    if (!nft) return null;

    // Helper to extract attributes safely
    const getAttr = (key: string) => nft.metadata.attributes?.find(a => a.trait_type === key)?.value || 'Unknown';

    return (
        <div className="w-full max-w-2xl bg-space-navy border border-ui-border rounded-xl overflow-hidden relative flex flex-col md:flex-row h-[500px] shadow-2xl">
            <button onClick={onClose} className="absolute top-4 right-4 z-10 text-white bg-black/40 p-1.5 rounded-full hover:bg-white/20 transition-colors backdrop-blur"><X size={18} /></button>

            {/* Left: Visual */}
            <div className="w-full md:w-1/2 bg-black/40 relative flex items-center justify-center p-8 bg-[url('https://images.unsplash.com/photo-1614726365723-49fa5389a37a?q=80&w=2574')] bg-cover bg-center">
                <div className="absolute inset-0 bg-space-navy/60 backdrop-blur-sm" />

                <div className="relative z-10 text-center">
                    <button className="w-20 h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:scale-110 transition-transform mb-6 backdrop-blur-md shadow-[0_0_30px_rgba(6,182,212,0.3)] group">
                        <Play fill="white" className="ml-1 md:w-8 md:h-8 group-hover:text-accent-cyan transition-colors" />
                    </button>
                    <div className="font-mono text-xs text-accent-cyan tracking-widest bg-black/40 px-3 py-1 rounded-full border border-accent-cyan/30 inline-block">
                        SIGNAL #{nft.tokenId}
                    </div>
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
                    {nft.price && (
                        <div className="flex justify-between items-center pt-1">
                            <span className="text-ui-dim">Price</span>
                            <span className="font-display font-bold text-accent-orange text-lg">{nft.price} MNT</span>
                        </div>
                    )}
                </div>

                <a
                    href="#" // Mock explorer link
                    className="w-full py-3 mt-6 border border-ui-border text-ui-dim hover:text-white hover:border-accent-cyan hover:bg-accent-cyan/5 rounded flex items-center justify-center gap-2 text-xs font-mono font-bold tracking-wider transition-all"
                >
                    VIEW ON MANTLE EXPLORER <ExternalLink size={12} />
                </a>
            </div>
        </div>
    );
};
