import React, { useEffect, useState } from 'react';
import { useRadioStore } from '@/store/useRadioStore';
import { Gallery } from '@/components/business/Gallery';
import { VoiceNoteNFT } from '@/types';
import { fetchCollection, CollectionNFT } from '@/services/api';
import { useAccount } from 'wagmi';
import { WalletGate } from '@/components/WalletGate';

export const CollectionPage: React.FC = () => {
    const { address, isConnected } = useAccount();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                const response = await fetchCollection(address);

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
    }, [address, isConnected, setUserNFTs]);

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
    if (loading) {
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

    // Empty state
    if (userNFTs.length === 0) {
        return (
            <div className="flex-1 h-full min-h-0 relative flex flex-col items-center justify-center">
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
        );
    }

    return (
        <div className="flex-1 h-full min-h-0 relative flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-ui-border/30">
                <div className="font-mono text-xs text-ui-dim">
                    YOUR TRANSMISSIONS • {userNFTs.length} SIGNAL{userNFTs.length !== 1 ? 'S' : ''}
                </div>
            </div>

            <Gallery
                nfts={userNFTs}
                onSelect={handleSelect}
            />
        </div>
    );
};
