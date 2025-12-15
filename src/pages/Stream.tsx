import React, { useState } from 'react';
import { useRadioStore } from '@/store/useRadioStore';
import { TelescopeInterface } from '@/components/business/TelescopeInterface';
import { SignalQueue, StatsPanel } from '@/components/business/DashboardPanels';
import { Signal } from '@/types';

// Mock signals for now, until we fetch from store initialized state
// Actually store is empty initially in useRadioStore, we might need to seed it or fetch it.
// For now, let's generate them here or in a useEffect that populates store.

export const StreamPage: React.FC = () => {
    const {
        signals,
        currentSignal,
        isPlaying,
    } = useRadioStore();

    const [showMobileQueue, setShowMobileQueue] = useState(false);

    const setCurrentSignal = useRadioStore(state => state.setCurrentSignal);

    // Initialize signals (Simulated hook)
    React.useEffect(() => {
        if (signals.length === 0) {
            // Generate mock
            const SECTORS = ['7G-Delta', '2A-Echo', '9F-Whisper', '4X-Void'];
            const MOODS = ['CALM', 'EXCITED', 'MYSTERIOUS', 'URGENT', 'VOID'] as const;
            const mocks: Signal[] = Array.from({ length: 8 }).map((_, i) => ({
                id: Math.floor(Math.random() * 10000 + 1000).toString(),
                source: SECTORS[Math.floor(Math.random() * SECTORS.length)],
                frequency: 432.0 + i,
                duration: `0${Math.floor(1 + i / 2)}:${(30 + i * 5) % 60}`, // "01:30" format
                timestamp: new Date().toISOString(),
                mood: MOODS[i % MOODS.length],
                tips: 0,
                echoes: 0,
                broadcasterAddress: '0x123...abc'
            }));
            useRadioStore.getState().setSignals(mocks);
            useRadioStore.getState().setCurrentSignal(mocks[0]);
        }
    }, []);

    return (
        <>
            {/* Left Panel (Signal Queue) */}
            <div className={`
             ${showMobileQueue
                    ? 'absolute inset-0 z-40 bg-space-black/95 backdrop-blur-xl md:static md:bg-transparent md:z-auto block'
                    : 'hidden md:block'} 
             w-full md:w-[250px] lg:w-[320px] h-full transition-all duration-300
          `}>
                <SignalQueue
                    onCloseMobile={() => setShowMobileQueue(false)}
                />
            </div>

            {/* Center Stage */}
            <div className="flex-1 h-full z-10 min-w-0 transition-all duration-500 relative">
                <TelescopeInterface
                    onToggleQueue={() => setShowMobileQueue(true)}
                />
            </div>

            {/* Right Panel */}
            <div className={`hidden md:block w-full md:w-[250px] lg:w-[320px] h-full relative z-20`}>
                <StatsPanel />
            </div>
        </>
    );
};
