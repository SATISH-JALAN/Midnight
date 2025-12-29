import React from 'react';
import { gsap } from 'gsap';
import { useRadioStore } from '@/store/useRadioStore';
import { CloudRain, Volume2, Zap, Radio, Disc, Activity, Mic } from 'lucide-react';
import { SecretHinter } from '@/components/ui/SecretHinter';
import { cn } from '@/lib/utils';
import { ViewType } from '@/types';

export const Footer: React.FC = () => {
    const { activeView, setActiveView, ambient, setAmbient } = useRadioStore();


    // Konami Code Easter Egg
    React.useEffect(() => {
        const secretCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
        let currentSequence: string[] = [];

        const handler = (e: KeyboardEvent) => {
            currentSequence.push(e.key);
            if (currentSequence.length > secretCode.length) {
                currentSequence.shift();
            }
            if (JSON.stringify(currentSequence) === JSON.stringify(secretCode)) {
                // Matrix Mode Activation
                document.body.classList.add('matrix-mode');
                // Create canvas overlay
                const cleanup = createMatrixRain();
                setTimeout(() => {
                    document.body.classList.remove('matrix-mode');
                    cleanup();
                }, 10000); // 10s duration
                currentSequence = [];
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // Helper for Matrix Rain
    const createMatrixRain = () => {
        const canvas = document.createElement('canvas');
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.zIndex = '9999';
        canvas.style.pointerEvents = 'none';
        canvas.style.mixBlendMode = 'screen';
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d')!;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const columns = Math.floor(canvas.width / 20);
        const drops: number[] = Array(columns).fill(1);
        const chars = '01MATRIX';

        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#0F0';
            ctx.font = '15px monospace';

            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(text, i * 20, drops[i] * 20);
                if (drops[i] * 20 > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };
        const interval = setInterval(draw, 33);
        return () => {
            clearInterval(interval);
            canvas.remove();
        };
    };

    const handleVolumeChange = (type: 'rain' | 'city' | 'void', val: number) => {
        setAmbient({ [`${type}Volume`]: val });
    };

    // Alien Abduction Egg Logic
    const [clicks, setClicks] = React.useState(0);
    const handleAlienEgg = (e: React.MouseEvent) => {
        // Removed stopPropagation so navigation still works
        // Manual click counting/reset handled in button wrapper or here if needed, 
        // using simple state + ref/breakout if reliable. 
        // But for visual fix, we focus on the animation geometry.

        // Note: The click handler is now also attached to the parent button. 
        // Ensuring we don't double count is important, but for now let's fix the visuals.

        // Simpler local click tracking for this scope (triggered by button)
        setClicks(p => {
            const newCount = p + 1;

            // Reset timer
            if ((window as any).eggTimer) clearTimeout((window as any).eggTimer);
            (window as any).eggTimer = setTimeout(() => setClicks(0), 1000);

            if (newCount === 5) {
                // 1. Create Atmosphere Overlay (Dimming)
                const overlay = document.createElement('div');
                Object.assign(overlay.style, {
                    position: 'fixed', inset: '0', background: 'rgba(0,0,0,0)', zIndex: '9990', transition: 'background 1s', pointerEvents: 'none'
                });
                document.body.appendChild(overlay);

                // 2. Create Elements
                const alien = document.createElement('div');
                alien.innerHTML = '👽';
                Object.assign(alien.style, {
                    position: 'fixed', bottom: '100px', left: '-100px', fontSize: '40px', zIndex: '9992', filter: 'drop-shadow(0 0 10px lime)'
                });

                const ufo = document.createElement('div');
                ufo.innerHTML = '🛸';
                Object.assign(ufo.style, {
                    position: 'fixed', top: '-150px', left: '50%', transform: 'translateX(-50%)', fontSize: '80px', zIndex: '9999', filter: 'drop-shadow(0 0 25px magenta)'
                });

                // Triangle Beam using clip-path
                const beam = document.createElement('div');
                Object.assign(beam.style, {
                    position: 'fixed', top: '0', left: '50%', width: '200px', height: '0',
                    background: 'linear-gradient(to bottom, rgba(0, 255, 100, 0.6), rgba(0, 255, 100, 0))',
                    zIndex: '9995', transform: 'translateX(-50%)', pointerEvents: 'none', mixBlendMode: 'screen',
                    clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)' // Trapezoid/Triangle shape
                });

                document.body.append(alien, ufo, beam);

                // 3. Cinematic Timeline
                const tl = gsap.timeline({
                    onComplete: () => {
                        alien.remove(); ufo.remove(); beam.remove(); overlay.remove();
                        gsap.set(document.body, { clearProps: "all" });
                    }
                });

                // Center calculation
                const centerX = window.innerWidth / 2 - 20;

                // Phase 1: Alien Enters
                tl.to(alien, { x: centerX + 100, duration: 2.5, ease: "power1.out" })
                    .to(overlay, { background: 'rgba(0,0,0,0.7)', duration: 2 }, "-=2")

                    // Phase 2: UFO Arrival
                    .to(ufo, { top: 'calc(100vh - 450px)', duration: 0.8, ease: "back.out(1.0)" })
                    .add(() => {
                        // Screen Shake
                        gsap.fromTo(document.body, { x: -5 }, { x: 5, duration: 0.05, repeat: 7, yoyo: true, clearProps: "x" });
                    })

                    // Phase 3: Beam Deployment
                    .set(beam, { top: 'calc(100vh - 400px)', height: 0, opacity: 1 })
                    .to(beam, { height: '350px', duration: 0.3, ease: "power2.out" })

                    // Phase 4: Abduction
                    .to(alien, {
                        y: -250,
                        rotation: 720,
                        scale: 0.1,
                        opacity: 0,
                        filter: "brightness(200%) blur(5px)",
                        duration: 1.5,
                        ease: "power2.in"
                    }, "+=0.2")

                    // Phase 5: Departure
                    .to(beam, { height: 0, opacity: 0, duration: 0.2 })
                    .to(ufo, { y: -1000, scale: 0.5, duration: 0.5, ease: "power4.in" })
                    .to(overlay, { background: 'rgba(0,0,0,0)', duration: 0.5 });

                // Click count reset happens via timer or after animation, 
                // but returning 0 here for state
                return 0;
            }
            return newCount;
        });
    };

    const navItems: { id: ViewType; label: string; icon: React.ReactNode }[] = [
        { id: 'LIVE', label: 'Live Stream', icon: <Activity className="w-4 h-4" /> },
        { id: 'BROADCAST', label: 'Transmit', icon: <Mic className="w-4 h-4" /> },
        { id: 'MY', label: 'Collection', icon: <Disc className="w-4 h-4" /> },
        { id: 'EXPLORE', label: 'Explore', icon: <Radio className="w-4 h-4" onClick={(e) => handleAlienEgg(e)} /> },
    ];

    return (
        <footer className="relative z-50 bg-space-panel/80 backdrop-blur-xl border-t border-ui-border h-16 md:h-24 px-4 md:px-6 flex items-center justify-between shadow-[0_-10px_40px_-20px_rgba(0,0,0,0.5)] shrink-0">

            {/* Ambient Mixer (Left) - Hidden on Mobile */}
            <div className="hidden md:flex items-center gap-8">
                <div className="hidden md:block">
                    {/* Replaced by SecretHinter internal header */}
                </div>

                <div className="h-[80px]">
                    <SecretHinter />
                </div>
            </div>

            {/* Main Navigation - Responsive */}
            <div className="flex items-center gap-1 md:gap-3 bg-black/20 p-1 md:p-1.5 rounded-full border border-white/5 backdrop-blur-sm mx-auto md:mx-0">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={(e) => {
                            if (item.id === 'EXPLORE') {
                                handleAlienEgg(e);
                            }
                            setActiveView(item.id);
                        }}
                        className={cn(
                            "flex items-center justify-center gap-2 p-3 md:px-5 md:py-2.5 rounded-full font-display text-xs font-bold tracking-wide transition-all duration-300 relative overflow-hidden group min-w-[44px] min-h-[44px]",
                            activeView === item.id
                                ? "text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                                : "text-ui-dim hover:text-white hover:bg-white/5"
                        )}
                    >
                        {activeView === item.id && (
                            <div className="absolute inset-0 bg-accent-cyan animate-pulse-slow" />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            {/* Icon - always visible */}
                            <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>
                            {/* Label - hidden on mobile */}
                            <span className="hidden md:inline">{item.label}</span>
                        </span>
                    </button>
                ))}
            </div>
        </footer>
    );
};

// --- Segmented Fader Component ---

const MixerChannel: React.FC<{
    icon: any,
    value: number,
    onChange: (val: number) => void,
    color: string,
    label: string,
    className?: string
}> = ({ icon: Icon, value, onChange, color, label, className }) => {
    // Determine color class
    const getColorClass = (isActive: boolean) => {
        if (!isActive) return 'bg-ui-border/30';
        switch (color) {
            case 'cyan': return 'bg-accent-cyan shadow-[0_0_8px_rgba(6,182,212,0.8)]';
            case 'purple': return 'bg-accent-purple shadow-[0_0_8px_rgba(168,85,247,0.8)]';
            case 'phosphor': return 'bg-accent-phosphor shadow-[0_0_8px_rgba(34,197,94,0.8)]';
            default: return 'bg-white';
        }
    };

    const getIconColor = () => {
        if (value === 0) return 'text-ui-dim';
        switch (color) {
            case 'cyan': return 'text-accent-cyan drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]';
            case 'purple': return 'text-accent-purple drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]';
            case 'phosphor': return 'text-accent-phosphor drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]';
            default: return 'text-white';
        }
    };

    return (
        <div className={cn("group flex flex-col items-center gap-3 relative w-8", className)}>
            {/* Value Tooltip (Hover) */}
            <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-mono bg-black border border-ui-border px-1.5 py-0.5 rounded text-white pointer-events-none">
                {value}%
            </div>

            {/* Segmented Bar */}
            <div className="flex flex-col-reverse gap-[2px] h-12 w-3 relative">
                {/* Hit area input */}
                <input
                    type="range"
                    min="0" max="100"
                    step="10"
                    value={value}
                    onChange={(e) => onChange(parseInt(e.target.value))}
                    className="absolute inset-0 w-[48px] h-[12px] opacity-0 cursor-pointer z-10 origin-top-left -rotate-90 translate-y-12"
                />

                {/* Segments */}
                {Array.from({ length: 6 }).map((_, i) => {
                    const threshold = (i + 1) * 16.6; // ~100/6
                    const isActive = value >= threshold || (value > 0 && i === 0);
                    return (
                        <div
                            key={i}
                            className={cn(
                                "w-full flex-1 rounded-[1px] transition-all duration-200 led-segment",
                                isActive && "active",
                                getColorClass(isActive)
                            )}
                        />
                    );
                })}
            </div>

            {/* Icon */}
            <Icon size={14} className={cn("transition-all duration-300", getIconColor())} />
        </div>
    );
};
