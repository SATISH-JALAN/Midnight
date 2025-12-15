import React, { useEffect } from 'react';
import { useRadioStore } from '@/store/useRadioStore';
import { Gallery } from '@/components/business/Gallery';
import { VoiceNoteNFT } from '@/types';

export const CollectionPage: React.FC = () => {
    const {
        userNFTs,
        setUserNFTs,
        setModal
    } = useRadioStore();

    // Mock Data Population for Collection
    useEffect(() => {
        if (userNFTs.length === 0) {
            const activeMocks: VoiceNoteNFT[] = Array.from({ length: 6 }).map((_, i) => ({
                tokenId: `100${i}`,
                creator: '0x123...abc',
                owner: '0xMe...Def',
                tokenURI: 'ipfs://...',
                metadata: {
                    name: `Signal #${4000 + i}`,
                    description: 'Encrypted voice note from Sector 7G.',
                    image: 'https://placehold.co/400',
                    attributes: [
                        { trait_type: 'Mood', value: ['CALM', 'EXCITED', 'URGENT'][i % 3] },
                        { trait_type: 'Sector', value: '7G' },
                        { trait_type: 'Durtion', value: '01:24' }
                    ]
                },
                isListed: i % 2 === 0,
                price: i % 2 === 0 ? '0.5' : undefined,
                createdAt: new Date().toISOString()
            }));
            setUserNFTs(activeMocks);
        }
    }, []);

    const handleSelect = (nft: VoiceNoteNFT) => {
        // In a real app, this would open the detailed view (Modal)
        // We'll implement the store action to set active NFT first if needed, 
        // but for now let's assume the Modal will handle it or we pass it via store.
        // The store currently has `setCurrentSignal` but not `setActiveNFT`. 
        // We might want to add `activeNFT` to store or just pass it to the Modal triggering function if we modify setModal to take props.
        // Actually, we added `modalProps` to store!
        useRadioStore.getState().setModal('NFT_DETAIL', { nft });
    };

    return (
        <div className="flex-1 h-full min-h-0 relative flex flex-col">
            <Gallery
                nfts={userNFTs}
                onSelect={handleSelect}
            />
        </div>
    );
};
