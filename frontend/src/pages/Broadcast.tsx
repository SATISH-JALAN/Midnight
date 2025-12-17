import React, { useEffect, useRef, useState } from 'react';
import { useRadioStore } from '@/store/useRadioStore';
import { Mic, Radio, Signal, Wifi, Lock, Cpu, Globe, UploadCloud, CheckCircle2 } from 'lucide-react';
import { gsap } from 'gsap';
import { cn } from '@/lib/utils';

export const BroadcastPage: React.FC = () => {
    const {
        isRecording,
        recordingTime,
        mintingStatus,
        setModal,
        setIsRecording,
        setMintingStatus,
        addToast
    } = useRadioStore();

    const [accessGranted, setAccessGranted] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const pulseRef = useRef<HTMLDivElement>(null);

    // Initial permission "check" simulation
    useEffect(() => {
        const timer = setTimeout(() => {
            setAccessGranted(true);
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    const handleAction = () => {
        if (!isRecording && mintingStatus === 'IDLE') {
            // Start Flow
            setModal('RECORD');
        }
    };

    // Visualizer Loop
    useEffect(() => {
        if (!pulseRef.current) return;

        let ctx = gsap.context(() => {
            if (isRecording) {
                gsap.to(".pulse-ring", {
                    scale: "random(1.2, 2.5)",
                    opacity: 0,
                    duration: 1.5,
                    stagger: 0.2,
                    repeat: -1,
                    ease: "power2.out"
                });
            } else {
                gsap.killTweensOf(".pulse-ring");
                gsap.to(".pulse-ring", { scale: 1, opacity: 0.3, duration: 0.5 });
            }
        }, pulseRef);

        return () => ctx.revert();
    }, [isRecording]);


    return (
        <div ref={containerRef} className="flex-1 h-full flex flex-col items-center justify-center relative overflow-hidden bg-space-black">

            {/* Background Texture */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-space-panel/30 via-space-black to-space-black z-0 pointer-events-none" />

            {/* Status HUD - Top */}
            <div className="absolute top-8 w-full max-w-4xl flex justify-between px-8 font-mono text-xs text-ui-dim z-20">
                <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                        <Wifi size={14} className={cn(accessGranted ? "text-accent-phosphor" : "text-red-500 animate-pulse")} />
                        <span>RELAY_LINK: {accessGranted ? "SECURE" : "SEARCHING..."}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Globe size={14} className="text-accent-cyan" />
                        <span>NODE: ASIA_01</span>
                    </div>
                </div>
                <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                        <Lock size={14} className="text-accent-purple" />
                        <span>ENCRYPTION: AES-256</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Cpu size={14} className="text-white" />
                        <span>FREQ: 432.00 MHz</span>
                    </div>
                </div>
            </div>

            {/* Central Transmitter Core */}
            <div className="relative z-10 flex flex-col items-center">

                {/* Visualizer Ring */}
                <div ref={pulseRef} className="relative w-64 h-64 md:w-96 md:h-96 flex items-center justify-center mb-12">
                    {/* Animated Rings */}
                    <div className="pulse-ring absolute inset-0 rounded-full border border-accent-red/30" />
                    <div className="pulse-ring absolute inset-4 rounded-full border border-accent-red/20" />
                    <div className="pulse-ring absolute inset-8 rounded-full border border-accent-red/10" />

                    {/* Core Button Area */}
                    <div
                        className={cn(
                            "relative w-32 h-32 md:w-48 md:h-48 rounded-full flex items-center justify-center transition-all duration-500 cursor-pointer group hover:scale-105",
                            isRecording ? "bg-accent-red shadow-[0_0_50px_rgba(239,68,68,0.6)]" : "bg-space-panel border-2 border-accent-red/50 hover:border-accent-red hover:shadow-[0_0_30px_rgba(239,68,68,0.4)]"
                        )}
                        onClick={handleAction}
                    >
                        {isRecording ? (
                            <div className="flex flex-col items-center">
                                <div className="w-16 flex gap-1 items-end h-8 mb-2">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="w-2 bg-white animate-waveform" style={{ animationDelay: `${i * 0.1}s` }} />
                                    ))}
                                </div>
                                <span className="font-mono text-white text-xl font-bold tracking-widest">{formatTime(recordingTime)}</span>
                            </div>
                        ) : (
                            <Mic size={48} className="text-white group-hover:animate-bounce" />
                        )}
                    </div>
                </div>

                {/* Primary Action Text */}
                <div className="text-center space-y-4">
                    <h1 className="font-logo text-4xl md:text-5xl tracking-[0.2em] text-white">
                        {isRecording ? "TRANSMITTING..." : "SIGNAL UPLINK"}
                    </h1>
                    <p className="font-mono text-accent-red text-sm tracking-widest uppercase">
                        {isRecording ? "LIVE BROADCAST ACTIVE" : "READY FOR INITIALIZATION"}
                    </p>
                </div>

            </div>

            {/* Bottom Panel - History or Recent Logs Placeholder */}
            <div className="absolute bottom-0 w-full h-32 border-t border-ui-border bg-space-black/80 backdrop-blur flex items-center justify-center z-10">
                <div className="flex gap-12 opacity-50">
                    <div className="text-center">
                        <div className="text-2xl font-bold font-display text-white">0</div>
                        <div className="text-[10px] font-mono text-ui-dim uppercase">Active Signals</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold font-display text-white">---</div>
                        <div className="text-[10px] font-mono text-ui-dim uppercase">Last Range</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold font-display text-white">0.00</div>
                        <div className="text-[10px] font-mono text-ui-dim uppercase">Total MNT Earned</div>
                    </div>
                </div>
            </div>

        </div>
    );
};
