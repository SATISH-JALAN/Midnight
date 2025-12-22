import React, { useEffect, useState } from 'react';
import { useRadioStore } from '@/store/useRadioStore';
import { Gallery } from '@/components/business/Gallery';
import { VoiceNoteNFT } from '@/types';
import { fetchCollection, CollectionNFT } from '@/services/api';
import { useAccount, useChainId } from 'wagmi';
import { WalletGate } from '@/components/WalletGate';
import { Zap, Radio, ExternalLink } from 'lucide-react';

interface Tip {
    tokenId: string;
    tipper: string;
    broadcaster: string;
    tipAmount: string;
    platformFee: string;
    broadcasterAmount: string;
    txHash: string;
    blockNumber: number;
    timestamp?: number;
}

export const CollectionPage: React.FC = () => {
    const { address, isConnected } = useAccount();
    const chainId = useChainId();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'signals' | 'tips'>('signals');
    const [tips, setTips] = useState<Tip[]>([]);
    const [tipsLoading, setTipsLoading] = useState(false);

    const {
        userNFTs,
        setUserNFTs,
        setModal
    } = useRadioStore();

    // Fetch real collection data
    useEffect(() => {
        const loadCollection = async () => {
            if (!isConnected || !address) {
                setUserNFTs([]);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const response = await fetchCollection(address, chainId);

                if (response.success && response.data) {
                    // Transform backend NFT format to frontend VoiceNoteNFT format
                    const nfts: VoiceNoteNFT[] = response.data.nfts.map((nft: CollectionNFT) => ({
                        tokenId: nft.tokenId,
                        creator: nft.creator,
                        owner: nft.owner,
                        tokenURI: nft.tokenURI,
                        metadata: {
                            name: nft.metadata.name,
                            description: nft.metadata.description,
                            image: nft.metadata.image || 'https://placehold.co/400',
                            attributes: nft.metadata.attributes,
                        },
                        isListed: nft.isListed,
                        price: nft.price,
                        createdAt: nft.createdAt,
                        // Extra data for audio playback
                        audioUrl: nft.audioUrl,
                        duration: nft.metadata.duration,
                        moodColor: nft.metadata.moodColor,
                        waveform: nft.metadata.waveform,
                        tips: nft.tips,
                        echoes: nft.echoes,
                    }));

                    setUserNFTs(nfts);
                } else {
                    setError(response.error || 'Failed to load collection');
                }
            } catch (err: any) {
                console.error('[Collection] Error:', err);
                setError(err.message || 'Failed to load collection');
            } finally {
                setLoading(false);
            }
        };

        loadCollection();
    }, [address, isConnected, setUserNFTs, chainId]);

    // Fetch tips when tab changes
    useEffect(() => {
        const loadTips = async () => {
            if (!isConnected || !address || activeTab !== 'tips') return;

            setTipsLoading(true);
            try {
                const res = await fetch(`http://localhost:3001/api/tips/${address}`);
                const data = await res.json();
                if (data.success && data.data?.tips) {
                    setTips(data.data.tips);
                }
            } catch (err) {
                console.error('[Tips] Failed to fetch:', err);
            } finally {
                setTipsLoading(false);
            }
        };

        loadTips();
    }, [address, isConnected, activeTab]);

    const handleSelect = (nft: VoiceNoteNFT) => {
        useRadioStore.getState().setModal('NFT_DETAIL', { nft });
    };

    // Not connected state - use WalletGate for consistent UI
    if (!isConnected) {
        return (
            <WalletGate message="Connect your wallet to view your NFT collection and transmissions" />
        );
    }

    // Loading state
    if (loading && activeTab === 'signals') {
        return (
            <div className="flex-1 h-full min-h-0 relative flex flex-col items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-accent-phosphor border-t-transparent rounded-full" />
                <div className="font-mono text-ui-dim text-xs mt-4">LOADING COLLECTION...</div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex-1 h-full min-h-0 relative flex flex-col items-center justify-center">
                <div className="text-accent-red font-mono text-sm">{error}</div>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 border border-ui-border rounded text-xs hover:border-white transition-colors"
                >
                    RETRY
                </button>
            </div>
        );
    }

    return (
        <div className="flex-1 h-full min-h-0 relative flex flex-col">
            {/* Tabs */}
            <div className="px-6 py-4 border-b border-ui-border/30 flex gap-4">
                <button
                    onClick={() => setActiveTab('signals')}
                    className={`font-mono text-xs uppercase flex items-center gap-2 pb-2 border-b-2 transition-colors ${activeTab === 'signals'
                        ? 'text-accent-cyan border-accent-cyan'
                        : 'text-ui-dim border-transparent hover:text-white'
                        }`}
                >
                    <Radio size={14} /> MY SIGNALS ({userNFTs.length})
                </button>
                <button
                    onClick={() => setActiveTab('tips')}
                    className={`font-mono text-xs uppercase flex items-center gap-2 pb-2 border-b-2 transition-colors ${activeTab === 'tips'
                        ? 'text-accent-orange border-accent-orange'
                        : 'text-ui-dim border-transparent hover:text-white'
                        }`}
                >
                    <Zap size={14} /> MY TIPS ({tips.length})
                </button>
            </div>

            {/* Content */}
            {activeTab === 'signals' ? (
                userNFTs.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="text-center p-8">
                            <div className="text-6xl opacity-20 mb-4">🎙️</div>
                            <div className="font-mono text-ui-dim text-sm mb-2">
                                NO TRANSMISSIONS YET
                            </div>
                            <p className="text-ui-dim/60 text-xs mb-6">
                                Record your first voice note to start your collection
                            </p>
                            <button
                                onClick={() => useRadioStore.getState().setActiveView('BROADCAST')}
                                className="px-6 py-3 bg-accent-phosphor text-black font-bold font-display rounded hover:bg-green-400 transition-colors"
                            >
                                START BROADCASTING
                            </button>
                        </div>
                    </div>
                ) : (
                    <Gallery nfts={userNFTs} onSelect={handleSelect} />
                )
            ) : (
                <div className="flex-1 overflow-y-auto p-6">
                    {tipsLoading ? (
                        <div className="flex items-center justify-center h-40">
                            <div className="animate-spin w-6 h-6 border-2 border-accent-orange border-t-transparent rounded-full" />
                        </div>
                    ) : tips.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-center">
                            <Zap size={40} className="text-ui-dim/30 mb-4" />
                            <div className="font-mono text-ui-dim text-sm">NO TIPS SENT YET</div>
                            <p className="text-ui-dim/60 text-xs mt-2">
                                Tip a broadcaster to show your support!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {tips.map((tip, i) => (
                                <div
                                    key={tip.txHash || i}
                                    className="bg-space-panel/40 border border-ui-border/30 rounded-lg p-4 hover:border-accent-orange/50 transition-colors"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <Zap size={16} className="text-accent-orange" />
                                            <span className="font-mono text-accent-orange font-bold">
                                                {tip.tipAmount} MNT
                                            </span>
                                        </div>
                                        <a
                                            href={`https://sepolia.mantlescan.xyz/tx/${tip.txHash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-[10px] text-accent-cyan hover:underline"
                                        >
                                            View TX <ExternalLink size={10} />
                                        </a>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-mono text-ui-dim">
                                        <div>
                                            <span className="text-white/50">To:</span>{' '}
                                            {tip.broadcaster.substring(0, 10)}...
                                        </div>
                                        <div>
                                            <span className="text-white/50">Block:</span>{' '}
                                            {tip.blockNumber}
                                        </div>
                                    </div>
                                    {tip.timestamp && (
                                        <div className="mt-2 text-[9px] text-ui-dim/50">
                                            {new Date(tip.timestamp * 1000).toLocaleString()}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

