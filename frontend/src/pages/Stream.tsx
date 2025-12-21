import React, { useState, useEffect } from 'react';
import { useRadioStore } from '@/store/useRadioStore';
import { TelescopeInterface } from '@/components/business/TelescopeInterface';
import { SignalQueue, StatsPanel } from '@/components/business/DashboardPanels';
import { Signal } from '@/types';
import { fetchStream } from '@/services/api';
import { useAccount } from 'wagmi';
import { WalletGate } from '@/components/WalletGate';
import { useStreamAudio } from '@/hooks/useStreamAudio';

export const StreamPage: React.FC = () => {
    const {
        signals,
        currentSignal,
        isPlaying,
        listenerCount,
        setSignals,
        setCurrentSignal,
        addToast,
    } = useRadioStore();

    const [showMobileQueue, setShowMobileQueue] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Enable audio playback for current signal
    useStreamAudio();

    // Fetch real stream data from backend
    useEffect(() => {
        const loadStream = async () => {
            try {
                setIsLoading(true);
                const response = await fetchStream();

                if (response.success && response.data) {
                    // Convert backend notes to frontend Signal format
                    const convertedSignals: Signal[] = response.data.notes.map((note) => ({
                        id: note.noteId,
                        source: note.sector,
                        frequency: 432.0 + Math.random() * 100,
                        duration: `${Math.floor(note.duration / 60)}:${(note.duration % 60).toString().padStart(2, '0')}`,
                        timestamp: new Date(note.timestamp).toISOString(),
                        mood: getMoodFromColor(note.moodColor),
                        tips: note.tips,
                        echoes: note.echoes,
                        hasAudio: true,
                        // Custom fields for playback
                        noteId: note.noteId,
                        audioUrl: note.audioUrl,
                        broadcaster: note.broadcaster,
                        expiresAt: note.expiresAt?.toString(),
                        moodColor: note.moodColor,
                        waveform: note.waveform,
                    }));

                    setSignals(convertedSignals);

                    // Set first signal as current if none selected
                    if (convertedSignals.length > 0 && !currentSignal) {
                        setCurrentSignal(convertedSignals[0]);
                    }

                    // Update listener count from server
                    if (response.data.totalListeners !== undefined) {
                        useRadioStore.setState({ listenerCount: response.data.totalListeners });
                    }
                }
            } catch (err) {
                console.error('Failed to fetch stream:', err);
                // Only use mock data if we have no signals at all
                if (useRadioStore.getState().signals.length === 0) {
                    loadMockData();
                } else {
                    useRadioStore.getState().addToast("Connection lost - Showing cached data", "WARNING");
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadStream();

        // Refresh every 30 seconds
        const interval = setInterval(loadStream, 30000);
        return () => clearInterval(interval);
    }, []);

    // Fallback mock data
    const loadMockData = () => {
        const SECTORS = ['7G-Delta', '2A-Echo', '9F-Whisper', '4X-Void'];
        const MOODS = ['CALM', 'EXCITED', 'MYSTERIOUS', 'URGENT', 'VOID'] as const;
        // Generate STABLE mock IDs for easier debugging
        const mocks: Signal[] = Array.from({ length: 4 }).map((_, i) => ({
            id: `mock-${1000 + i}`,
            source: SECTORS[Math.floor(Math.random() * SECTORS.length)],
            frequency: 432.0 + i,
            duration: `0${Math.floor(1 + i / 2)}:${(30 + i * 5) % 60}`,
            timestamp: new Date().toISOString(),
            mood: MOODS[i % MOODS.length],
            tips: 0,
            echoes: 0,
            broadcasterAddress: '0x123...abc'
        }));
        setSignals(mocks);
        if (mocks.length > 0) {
            setCurrentSignal(mocks[0]);
        }
    };

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

// Helper to convert color to mood
function getMoodFromColor(color: string): 'CALM' | 'EXCITED' | 'MYSTERIOUS' | 'URGENT' | 'VOID' {
    switch (color) {
        case '#0EA5E9': return 'CALM';
        case '#F97316': return 'EXCITED';
        case '#A855F7': return 'MYSTERIOUS';
        case '#EF4444': return 'URGENT';
        default: return 'CALM';
    }
}
