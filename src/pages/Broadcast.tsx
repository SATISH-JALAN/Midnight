import React, { useEffect, useState } from 'react';
import { useRadioStore } from '@/store/useRadioStore';
import { Modals } from '@/components/business/Modals';
import { Mic, Radio, Signal } from 'lucide-react';

export const BroadcastPage: React.FC = () => {
    const {
        setModal,
        setIsRecording,
        isRecording,
        recordingTime,
        mintingStatus,
        currentSignal
    } = useRadioStore();

    // Auto-open recording modal on mount for this specific route
    useEffect(() => {
        setModal('RECORD');
        // Cleanup: Stop recording if navigating away? 
        // For now, we leave it to the user or global store to manage persistence.
    }, [setModal]);

    // Handle re-opening if closed but on this page
    const handleOpenRecorder = () => {
        setModal('RECORD');
    };

    return (
        <div className="flex-1 h-full flex items-center justify-center relative relative flex-col">

            {/* Background elements specific to Broadcast can go here */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                <Radio size={400} className="text-accent-red animate-pulse" />
            </div>

            <div className="z-10 text-center space-y-6">
                <h2 className="font-logo text-5xl md:text-7xl text-white tracking-widest glitch-text">
                    SIGNAL <span className="text-accent-red">UPLINK</span>
                </h2>

                <p className="font-mono text-ui-dim max-w-md mx-auto">
                    Secure channel initialization sequence... <br />
                    Broadcast your frequency to the network.
                </p>

                <button
                    onClick={handleOpenRecorder}
                    className="mt-8 px-8 py-4 bg-accent-red/20 border border-accent-red hover:bg-accent-red hover:text-white text-accent-red font-display font-bold tracking-widest text-xl transition-all duration-300 rounded flex items-center gap-3 mx-auto group"
                >
                    <Mic className="group-hover:animate-bounce" />
                    INITIALIZE TRANSMITTER
                </button>
            </div>
        </div>
    );
};
