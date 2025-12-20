import React, { useEffect, useRef, useState } from 'react';
import { useRadioStore } from '@/store/useRadioStore';
import { Mic, Radio, Signal, Wifi, Lock, Cpu, Globe, Zap, Sparkles, Activity, Users } from 'lucide-react';
import { gsap } from 'gsap';
import { cn } from '@/lib/utils';
import { useAccount } from 'wagmi';

export const BroadcastPage: React.FC = () => {
    const {
        isRecording,
        recordingTime,
        mintingStatus,
        setModal,
        listenerCount
    } = useRadioStore();

    const { isConnected } = useAccount();

    const [accessGranted, setAccessGranted] = useState(false);
    const [signalStrength, setSignalStrength] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const pulseRef = useRef<HTMLDivElement>(null);

    // Initial permission "check" simulation
    useEffect(() => {
        const timer = setTimeout(() => setAccessGranted(true), 1500);
        return () => clearTimeout(timer);
    }, []);

    // Simulate signal strength
    useEffect(() => {
        const interval = setInterval(() => {
            setSignalStrength(Math.floor(Math.random() * 30) + 70);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    const handleAction = () => {
        if (!isRecording && mintingStatus === 'IDLE') {
            setModal('RECORD');
        }
    };

    // Visualizer Animation
    useEffect(() => {
        if (!pulseRef.current) return;

        let ctx = gsap.context(() => {
            if (isRecording) {
                gsap.to(".pulse-ring", {
                    scale: "random(1.2, 2.0)",
                    opacity: 0,
                    duration: 1.2,
                    stagger: 0.15,
                    repeat: -1,
                    ease: "power2.out"
                });
            } else {
                gsap.killTweensOf(".pulse-ring");
                gsap.to(".pulse-ring", { scale: 1, opacity: 0.2, duration: 0.5 });
            }
        }, pulseRef);

        return () => ctx.revert();
    }, [isRecording]);


    return (
        <div ref={containerRef} className="flex-1 h-full flex flex-col items-center relative overflow-hidden bg-space-black">

            {/* Dynamic Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-purple/20 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-cyan/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent-red/10 rounded-full blur-[200px]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
            </div>

            {/* Status HUD - Top */}
            <div className="w-full max-w-5xl flex justify-between px-6 py-4 font-mono text-xs z-20">
                <div className="flex gap-3 items-center">
                    <div className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all",
                        accessGranted
                            ? "border-accent-phosphor/50 bg-accent-phosphor/10 text-accent-phosphor"
                            : "border-red-500/50 bg-red-500/10 text-red-400 animate-pulse"
                    )}>
                        <div className={cn("w-2 h-2 rounded-full", accessGranted ? "bg-accent-phosphor" : "bg-red-500")} />
                        <Wifi size={12} />
                        <span>{accessGranted ? "SECURE" : "CONNECTING..."}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-ui-border/50 bg-space-panel/50 text-ui-dim">
                        <Globe size={12} className="text-accent-cyan" />
                        <span>ASIA_01</span>
                    </div>
                </div>
                <div className="flex gap-3 items-center">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-ui-border/50 bg-space-panel/50 text-ui-dim">
                        <Lock size={12} className="text-accent-purple" />
                        <span>AES-256</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-ui-border/50 bg-space-panel/50">
                        <Activity size={12} className="text-accent-orange" />
                        <span className="text-white font-bold">{signalStrength}%</span>
                    </div>
                </div>
            </div>

            {/* Central Area - Flex grow to push content to center */}
            <div className="flex-1 flex flex-col items-center justify-center z-10 pb-32">

                {/* Orbital Ring Visual */}
                <div ref={pulseRef} className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center mb-6">

                    {/* Animated Pulse Rings */}
                    <div className="pulse-ring absolute inset-0 rounded-full border-2 border-accent-red/40" />
                    <div className="pulse-ring absolute inset-4 rounded-full border border-accent-red/30" />
                    <div className="pulse-ring absolute inset-8 rounded-full border border-accent-cyan/20" />

                    {/* Core Button */}
                    <div
                        className={cn(
                            "relative w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center transition-all duration-500 cursor-pointer group",
                            isRecording
                                ? "bg-gradient-to-br from-accent-red to-red-700 shadow-[0_0_50px_rgba(239,68,68,0.6)]"
                                : "bg-gradient-to-br from-space-panel to-space-navy border-2 border-accent-cyan/30 hover:border-accent-cyan hover:scale-105 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]"
                        )}
                        onClick={handleAction}
                    >
                        {isRecording ? (
                            <div className="flex flex-col items-center">
                                <div className="flex gap-0.5 items-end h-6 mb-2">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="w-1.5 bg-white rounded-full animate-waveform" style={{ animationDelay: `${i * 0.1}s`, minHeight: '6px' }} />
                                    ))}
                                </div>
                                <span className="font-mono text-white text-lg font-bold tracking-wider">{formatTime(recordingTime)}</span>
                                <span className="font-mono text-red-200 text-[8px] tracking-widest animate-pulse">● REC</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <Mic size={36} className="text-white group-hover:scale-110 transition-transform" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Title & Status */}
                <div className="text-center space-y-2">
                    <h1 className="font-display text-3xl md:text-4xl font-bold tracking-wide">
                        <span className={cn(
                            "bg-clip-text text-transparent bg-gradient-to-r",
                            isRecording
                                ? "from-red-400 via-accent-red to-orange-400"
                                : "from-white via-accent-cyan to-accent-purple"
                        )}>
                            {isRecording ? "TRANSMITTING" : "SIGNAL UPLINK"}
                        </span>
                    </h1>
                    <p className={cn(
                        "font-mono text-xs tracking-[0.15em] uppercase",
                        isRecording ? "text-red-400 animate-pulse" : "text-ui-dim"
                    )}>
                        {isRecording ? "🔴 LIVE BROADCAST" : "TAP TO INITIALIZE"}
                    </p>
                    {!isConnected && (
                        <p className="font-mono text-[10px] text-accent-orange animate-pulse mt-2">
                            ⚠ CONNECT WALLET TO MINT ON-CHAIN
                        </p>
                    )}
                </div>
            </div>

            {/* Bottom Stats Panel */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-ui-border/50 bg-gradient-to-t from-space-black to-transparent backdrop-blur-sm z-10">
                <div className="max-w-2xl mx-auto py-4 px-6">
                    <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                            <div className="flex items-center justify-center gap-1.5">
                                <Users size={12} className="text-accent-cyan" />
                                <span className="text-xl font-bold text-white">{listenerCount}</span>
                            </div>
                            <div className="text-[9px] font-mono text-ui-dim uppercase">Listeners</div>
                        </div>
                        <div>
                            <div className="flex items-center justify-center gap-1.5">
                                <Signal size={12} className="text-accent-phosphor" />
                                <span className="text-xl font-bold text-white">{signalStrength}%</span>
                            </div>
                            <div className="text-[9px] font-mono text-ui-dim uppercase">Signal</div>
                        </div>
                        <div>
                            <div className="flex items-center justify-center gap-1.5">
                                <Zap size={12} className="text-accent-orange" />
                                <span className="text-xl font-bold text-accent-phosphor">●</span>
                            </div>
                            <div className="text-[9px] font-mono text-ui-dim uppercase">Status</div>
                        </div>
                        <div>
                            <div className="flex items-center justify-center gap-1.5">
                                <Radio size={12} className="text-accent-purple" />
                                <span className="text-xl font-bold text-white">432</span>
                                <span className="text-[9px] text-ui-dim">MHz</span>
                            </div>
                            <div className="text-[9px] font-mono text-ui-dim uppercase">Freq</div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};
