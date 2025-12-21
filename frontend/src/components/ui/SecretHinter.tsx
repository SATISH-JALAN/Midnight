import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Terminal, Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';

const HINTS = [
    "SYSTEM MESSAGE: LOGO INTEGRITY CHECK REQUIRES [3] DIRECT IMPACTS",
    "ANOMALY DETECTED: EXPLORE NODE UNSTABLE... APPLY [5] CLICK PULSES",
    "LEGACY PROTOCOL FOUND: ↑ ↑ ↓ ↓ ← → ← → B A",
    "DECRYPTING: CLICK [LOGO] 3x TO TOGGLE VISUAL REALITY",
    "SEARCHING FOR SIGNAL... TRY EXPLORING THE VOID [5x]"
];

export const SecretHinter: React.FC = () => {
    const [hintIndex, setHintIndex] = useState(0);
    const [displayText, setDisplayText] = useState("");
    const [decryptProgress, setDecryptProgress] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);

    // Glitch / Typewriter Effect
    useEffect(() => {
        let isCancelled = false;
        const targetText = HINTS[hintIndex];
        let currentIter = 0;
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";

        // Reset Progress
        setDecryptProgress(0);

        // Progress Timer
        const progressInterval = setInterval(() => {
            setDecryptProgress(prev => {
                if (prev >= 100) {
                    clearInterval(progressInterval);
                    return 100;
                }
                return prev + Math.random() * 2;
            });
        }, 100);

        // Glitch in (decoding effect)
        const scrambleInterval = setInterval(() => {
            if (isCancelled) return;

            setDisplayText(prev => {
                if (currentIter >= targetText.length) {
                    clearInterval(scrambleInterval);
                    return targetText;
                }

                return targetText.split("").map((char, index) => {
                    if (index < currentIter) return char;
                    return chars[Math.floor(Math.random() * chars.length)];
                }).join("");
            });

            currentIter += 1 / 2; // Speed

        }, 30);

        // Next hint timer
        const nextTimer = setTimeout(() => {
            // Glitch out
            gsap.to(textRef.current, {
                opacity: 0,
                duration: 0.2,
                onComplete: () => {
                    setHintIndex(prev => (prev + 1) % HINTS.length);
                    gsap.set(textRef.current, { opacity: 1 });
                }
            });
        }, 8000); // Change hint every 8s

        return () => {
            isCancelled = true;
            clearInterval(scrambleInterval);
            clearInterval(progressInterval);
            clearTimeout(nextTimer);
        };
    }, [hintIndex]);

    // Random styling glitches
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.to(containerRef.current, {
                x: "random(-2, 2)",
                opacity: "random(0.8, 1)",
                duration: 0.1,
                repeat: -1,
                repeatRefresh: true,
                repeatDelay: 3
            });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    return (
        <div
            ref={containerRef}
            className="group relative h-full flex flex-col justify-center px-6 w-[320px] overflow-hidden bg-black/40 border border-ui-border/30 rounded-sm"
        >
            {/* --- Decorative Corners --- */}
            <CornerBracket className="top-0 left-0 rotate-0" />
            <CornerBracket className="top-0 right-0 rotate-90" />
            <CornerBracket className="bottom-0 right-0 rotate-180" />
            <CornerBracket className="bottom-0 left-0 -rotate-90" />

            {/* --- Header --- */}
            <div className="flex items-center gap-3 mb-2 opacity-70">
                <Terminal size={12} className="text-accent-cyan" />
                <span className="text-[9px] font-mono text-accent-cyan tracking-[0.2em] uppercase">
                    SYSTEM_LOGS
                </span>
                <div className="flex gap-1 ml-auto">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={cn("w-1 h-1 rounded-full", decryptProgress > i * 30 ? "bg-accent-cyan" : "bg-ui-dim/20")} />
                    ))}
                </div>
            </div>

            {/* --- Hint Display --- */}
            <div ref={textRef} className="relative z-10 font-mono text-[10px] text-white/90 leading-relaxed break-words min-h-[3em] drop-shadow-md">
                <span className="text-accent-cyan mr-2 font-bold">{">"}</span>
                {displayText}
                <span className="animate-pulse ml-1 inline-block w-1.5 h-3 bg-accent-cyan/80 align-middle"></span>
            </div>

            {/* --- Progress Bar --- */}
            <div className="absolute bottom-2 left-6 right-6 h-[2px] bg-ui-dim/20 mt-2 rounded-full overflow-hidden">
                <div
                    className="h-full bg-accent-cyan/80 shadow-[0_0_8px_rgba(6,182,212,0.8)] transition-all duration-300 ease-out"
                    style={{ width: `${decryptProgress}%` }}
                />
            </div>

            {/* --- Scanner Line --- */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent-cyan/5 to-transparent h-[20%] w-full animate-scan pointer-events-none" />

            {/* --- Background Hex Grid (Subtle) --- */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, #06b6d4 1px, transparent 1px)', backgroundSize: '10px 10px' }}
            />

            {/* --- Glitch Border (Left) --- */}
            <div className="absolute top-2 bottom-2 left-0 w-[2px] bg-gradient-to-b from-transparent via-accent-cyan/50 to-transparent group-hover:animate-pulse" />
        </div>
    );
};

const CornerBracket: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        className={cn("absolute w-3 h-3 text-accent-cyan/60 pointer-events-none transition-all duration-300 group-hover:text-accent-cyan", className)}
        viewBox="0 0 10 10"
        fill="none"
    >
        <path d="M1 9V1H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
);
