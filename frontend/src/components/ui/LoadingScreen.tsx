import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

interface LoadingScreenProps {
    onComplete: () => void;
}

const HEX_CHARS = "0123456789ABCDEF";
const BOOT_LOGS = [
    "SYSTEM_WAKE::TRUE",
    "DECRYPTING_SIGNAL...",
    "ESTABLISHING_UPLINK [MANTLE]...",
    "SYNC_ARBITRUM_RELAY...",
    "AUDIO_CORE::INITIALIZED",
    "HANDSHAKE_COMPLETE"
];

export const LoadingScreen: React.FC<LoadingScreenProps> = React.memo(({ onComplete }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLHeadingElement>(null);
    const subRef = useRef<HTMLDivElement>(null);
    const percentRef = useRef<HTMLSpanElement>(null);
    const logsRef = useRef<HTMLDivElement>(null); // Ref for direct DOM logs
    const barsRef = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({
                onComplete: () => {
                    // Cinematic Exit: CRT Power Off
                    gsap.to(containerRef.current, {
                        scaleY: 0.005,
                        scaleX: 1,
                        duration: 0.2,
                        ease: "power2.in"
                    });
                    gsap.to(containerRef.current, {
                        scaleX: 0,
                        duration: 0.2,
                        delay: 0.2,
                        ease: "power2.out",
                        onComplete: onComplete
                    });
                }
            });

            // 0. Initial States
            gsap.set(textRef.current, { opacity: 0, scale: 1.1 });
            gsap.set(subRef.current, { opacity: 0, letterSpacing: "1em" });

            // 1. Audio Visualizer Wake Up
            tl.to(barsRef.current, {
                height: "random(10, 100)%",
                duration: 0.8,
                stagger: {
                    amount: 0.5,
                    from: "center",
                    grid: "auto"
                },
                ease: "elastic.out(1, 0.3)"
            });

            // Start infinite idle animation for bars
            barsRef.current.forEach(bar => {
                if (!bar) return;
                gsap.to(bar, {
                    height: "random(10, 80)%",
                    duration: "random(0.2, 0.5)",
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut"
                });
            });

            // 2. Main Title Hex Scramble
            const targetText = "MIDNIGHT";
            tl.to(textRef.current, {
                opacity: 1,
                scale: 1,
                duration: 1.2,
                ease: "power4.out",
                onUpdate: function () {
                    const progress = this.progress();

                    // Chromatic Aberration / Skew Jitter
                    const skew = (Math.random() - 0.5) * 10 * (1 - progress);
                    gsap.set(textRef.current, { skewX: skew });

                    // Hex Scramble
                    if (progress < 1 && textRef.current) {
                        textRef.current.innerText = targetText.split("").map((char, i) => {
                            return Math.random() > progress ? HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)] : char;
                        }).join("");
                    } else if (textRef.current) {
                        textRef.current.innerText = targetText;
                    }
                }
            }, "-=0.5");

            // 3. Subtext Cinematic Reveal
            tl.to(subRef.current, {
                opacity: 1,
                letterSpacing: "0.5em",
                duration: 1.5,
                ease: "power3.out"
            }, "-=0.8");

            // 4. Progress Simulation (Smoother)
            const proxy = { val: 0 };
            tl.to(proxy, {
                val: 100,
                duration: 4.5,
                ease: "power2.inOut",
                onUpdate: () => {
                    const p = Math.floor(proxy.val);
                    // Pad with zeros for aesthetic (001, 050, 100)
                    if (percentRef.current) percentRef.current.innerText = p.toString().padStart(3, '0');

                    // Log reveal logic (Direct DOM Manipulation)
                    if (logsRef.current) {
                        const logIndex = Math.floor((p / 100) * BOOT_LOGS.length);
                        const currentLogs = BOOT_LOGS.slice(0, logIndex + 1);
                        // Rebuild HTML string
                        logsRef.current.innerHTML = currentLogs
                            .map(log => `<span class="animate-pulse">&gt; ${log}</span>`)
                            .join("") + '<span class="animate-pulse opacity-50">_</span>';
                    }

                    // Intensify visualizer near completion
                    if (p > 90) {
                        gsap.to(barsRef.current, {
                            backgroundColor: "#fff",
                            boxShadow: "0 0 25px #fff",
                            overwrite: "auto",
                            duration: 0.1
                        });
                    }
                }
            }, "-=1");

        }, containerRef);
        return () => ctx.revert();
    }, [onComplete]);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-[9999] bg-space-black flex flex-col items-center justify-center overflow-hidden"
        >
            {/* 1. CRT Scanline Overlay */}
            <div className="absolute inset-0 z-50 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] bg-repeat" />
            <div className="absolute inset-0 z-50 pointer-events-none animate-[scanline_8s_linear_infinite] bg-gradient-to-b from-transparent via-white/5 to-transparent h-[100px] opacity-20" />

            {/* 2. Visualizer (The 'Voice' of the Void) */}
            <div className="flex items-end gap-1 h-24 mb-6 z-10 opacity-90">
                {[...Array(16)].map((_, i) => (
                    <div
                        key={i}
                        ref={el => { if (el) barsRef.current[i] = el; }}
                        className="w-1.5 md:w-3 bg-accent-cyan shadow-[0_0_15px_rgba(0,240,255,0.6)] rounded-t-sm"
                        style={{ height: '2px' }}
                    />
                ))}
            </div>

            {/* 3. Main Text */}
            <div className="relative z-10 flex flex-col items-center gap-4">
                <h1
                    ref={textRef}
                    className="font-logo text-7xl md:text-9xl text-white tracking-widest relative z-10 mix-blend-screen"
                    style={{ textShadow: "4px 0px 0px rgba(255,0,0,0.5), -4px 0px 0px rgba(0,240,255,0.5)" }}
                >
                    {/* Text injected by GSAP */}
                </h1>

                <div ref={subRef} className="opacity-0">
                    <span className="font-mono text-xs md:text-sm text-ui-dim tracking-[1em] uppercase">
                        EPHEMERA
                    </span>
                </div>
            </div>

            {/* 4. Progress & Logs */}
            <div className="absolute bottom-12 left-8 md:left-12 right-0 flex justify-between items-end pr-12 z-10">
                {/* Terminal Logs */}
                <div
                    ref={logsRef}
                    className="flex flex-col font-mono text-[10px] md:text-xs text-accent-cyan/60 gap-1 min-h-[100px] justify-end"
                >
                    {/* Logs injected by GSAP */}
                </div>

                {/* Big Percent - FIXED VISIBILITY */}
                <div className="text-right flex flex-col items-end">
                    {/* Loading Label */}
                    <span className="font-mono text-[10px] text-accent-cyan/80 tracking-widest mb-1">SYSTEM_LOAD</span>

                    {/* Percentage Number */}
                    <div className="flex items-baseline">
                        <span ref={percentRef} className="font-display font-bold text-6xl md:text-8xl text-white/10 stroke-white/50 tracking-tighter" style={{ WebkitTextStroke: "1px rgba(255,255,255,0.2)" }}>000</span>
                        <span className="text-xl md:text-2xl text-accent-cyan align-top ml-2 opacity-50">%</span>
                    </div>
                </div>
            </div>
        </div>
    );
});
