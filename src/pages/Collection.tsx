import React from 'react';
import { useRadioStore } from '@/store/useRadioStore';
import { Gallery } from '@/components/business/Gallery';

export const CollectionPage: React.FC = () => {
    const {
        signals,
        setCurrentSignal,
        setIsPlaying
    } = useRadioStore();

    const handlePlay = (signal: any) => {
        setCurrentSignal(signal);
        setIsPlaying(true);
    };

    return (
        <div className="flex-1 h-full min-h-0 relative">
            <Gallery
                signals={signals}
                onPlay={handlePlay}
            />
        </div>
    );
};
