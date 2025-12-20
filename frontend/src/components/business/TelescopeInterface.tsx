import React, { useEffect, useRef, useState } from 'react';
import { Signal } from '@/types';
import { Play, Square, SkipForward, SkipBack, DollarSign, Share2, Mic, Activity, Radio as RadioIcon, List } from 'lucide-react';
import { gsap } from 'gsap';

import { useRadioStore } from '@/store/useRadioStore';
import { useWalletGate } from '@/components/WalletGate';

interface TelescopeInterfaceProps {
  onToggleQueue?: () => void;
}

export const TelescopeInterface: React.FC<TelescopeInterfaceProps> = ({
  onToggleQueue
}) => {
  const {
    currentSignal,
    signals,
    isPlaying,
    setIsPlaying,
    setModal,
    setCurrentSignal
  } = useRadioStore();

  const { requireWallet } = useWalletGate();

  const onPlayPause = () => requireWallet(() => setIsPlaying(!isPlaying));
  const onRecordStart = () => requireWallet(() => setModal('RECORD'));
  const onTip = () => requireWallet(() => setModal('TIP'));
  const onEcho = () => requireWallet(() => setModal('ECHO'));

  const onNext = () => {
    if (!currentSignal || signals.length === 0) return;
    const currentIndex = signals.findIndex(s => s.id === currentSignal.id);
    const nextIndex = (currentIndex + 1) % signals.length;
    setCurrentSignal(signals[nextIndex]);
    setIsPlaying(true);
  };

  const onPrev = () => {
    if (!currentSignal || signals.length === 0) return;
    const currentIndex = signals.findIndex(s => s.id === currentSignal.id);
    const prevIndex = (currentIndex - 1 + signals.length) % signals.length;
    setCurrentSignal(signals[prevIndex]);
    setIsPlaying(true);
  };
  const containerRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const [isTuning, setIsTuning] = useState(false);

  // Entrance & Transition Animation
  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(containerRef.current,
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.8, ease: "power3.out" }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Handle Signal Changes (Tuning Effect)
  useEffect(() => {
    if (!currentSignal) return;
    // Trigger tuning noise briefly on signal change
    setIsTuning(true);
    const timer = setTimeout(() => setIsTuning(false), 800);
    return () => clearTimeout(timer);
  }, [currentSignal?.id]);

  return (
    <div className="relative w-full h-full flex items-center justify-center p-4">
      {/* Main Glass HUD 
          Using aspect-[4/5] on mobile for height, aspect-video on desktop.
          Added min-h to prevent crushing on very wide/short desktop viewports.
      */}
      <div ref={containerRef} className="w-full max-w-3xl aspect-[4/5] md:aspect-video md:min-h-[500px] bg-space-navy/30 backdrop-blur-xl rounded-2xl border border-ui-border relative overflow-hidden flex flex-col shadow-2xl">

        {/* Mobile List Toggle Button */}
        {onToggleQueue && (
          <button
            onClick={onToggleQueue}
            className="absolute top-4 left-4 z-40 md:hidden w-8 h-8 flex items-center justify-center rounded bg-white/10 border border-ui-border text-ui-dim hover:text-white"
          >
            <List size={16} />
          </button>
        )}

        {/* Static Noise Overlay */}
        <StaticNoise active={isTuning} />

        {/* Background Grid */}
        <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
        <div className="scan-bar" />

        {/* Decorative Corners */}
        <CornerDecor />

        {/* Dynamic Content Area */}
        {currentSignal ? (
          <ActiveState
            signal={currentSignal}
            isPlaying={isPlaying}
            onPlayPause={onPlayPause}
            onTip={onTip}
            onEcho={onEcho}
            onNext={onNext}
            onPrev={onPrev}
            infoRef={infoRef}
            isTuning={isTuning}
          />
        ) : (
          <IdleState onRecord={onRecordStart} />
        )}
      </div>
    </div>
  );
};

// --- Sub Components ---

const StaticNoise: React.FC<{ active: boolean }> = ({ active }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 300;
      canvas.height = canvas.parentElement?.clientHeight || 300;
    };
    resize();

    let animationId: number;
    const loop = () => {
      const w = canvas.width;
      const h = canvas.height;

      if (w > 0 && h > 0) {
        const idata = ctx.createImageData(w, h);
        const buffer32 = new Uint32Array(idata.data.buffer);
        const len = buffer32.length;

        for (let i = 0; i < len; i++) {
          if (Math.random() < 0.5) {
            buffer32[i] = 0xffffffff;
          } else {
            buffer32[i] = 0xff000000;
          }
        }

        ctx.putImageData(idata, 0, 0);
      }
      animationId = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(animationId);
  }, []);

  useEffect(() => {
    gsap.to(containerRef.current, {
      opacity: active ? 0.3 : 0.03, // Always a tiny bit of static, more when tuning
      duration: 0.5,
      ease: "power2.inOut"
    });
  }, [active]);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-20 mix-blend-overlay opacity-0">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};

const DecodedText: React.FC<{ text: string, className?: string }> = ({ text, className }) => {
  const [display, setDisplay] = useState(text);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&";

  useEffect(() => {
    let iterations = 0;
    const interval = setInterval(() => {
      setDisplay(text.split("").map((letter, index) => {
        if (index < iterations) return text[index];
        return chars[Math.floor(Math.random() * chars.length)];
      }).join(""));

      if (iterations >= text.length) clearInterval(interval);
      iterations += 1 / 2; // Speed of decoding
    }, 30);
    return () => clearInterval(interval);
  }, [text]);

  return <span className={className}>{display}</span>;
};

const CornerDecor = () => {
  const decorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(decorRef.current!.children, {
        scale: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "back.out(1.7)",
        delay: 0.5
      });
    }, decorRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={decorRef} className="pointer-events-none z-10">
      <div className="absolute top-0 left-0 w-6 h-6 md:w-8 md:h-8 border-t border-l border-accent-cyan/50 rounded-tl-lg m-3 md:m-4" />
      <div className="absolute top-0 right-0 w-6 h-6 md:w-8 md:h-8 border-t border-r border-accent-cyan/50 rounded-tr-lg m-3 md:m-4" />
      <div className="absolute bottom-0 left-0 w-6 h-6 md:w-8 md:h-8 border-b border-l border-accent-cyan/50 rounded-bl-lg m-3 md:m-4" />
      <div className="absolute bottom-0 right-0 w-6 h-6 md:w-8 md:h-8 border-b border-r border-accent-cyan/50 rounded-br-lg m-3 md:m-4" />
    </div>
  );
};

// --- Idle State ---
const IdleState: React.FC<{ onRecord: () => void }> = ({ onRecord }) => {
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleHover = (enter: boolean) => {
    gsap.to(btnRef.current, { scale: enter ? 1.05 : 1, duration: 0.3 });
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative z-10">
      <button
        ref={btnRef}
        onClick={onRecord}
        onMouseEnter={() => handleHover(true)}
        onMouseLeave={() => handleHover(false)}
        className="group relative w-40 h-40 md:w-48 md:h-48 flex items-center justify-center focus:outline-none"
      >
        <div className="absolute inset-0 rounded-full border border-ui-border group-hover:border-accent-phosphor/30 transition-colors duration-500" />
        <div className="absolute inset-2 rounded-full border border-dashed border-ui-border group-hover:animate-spin-slow transition-all duration-500" />

        <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-space-black border border-ui-border flex flex-col items-center justify-center relative overflow-hidden shadow-glow">
          <div className="absolute inset-0 bg-accent-phosphor/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Mic size={28} className="text-ui-dim group-hover:text-accent-phosphor transition-colors duration-300 mb-2" />
          <span className="font-display font-bold text-[10px] md:text-xs tracking-widest text-white">TRANSMIT</span>
        </div>
      </button>

      <div className="mt-8 text-center space-y-2">
        <h2 className="font-display font-bold text-xl md:text-2xl text-white tracking-[0.2em] animate-pulse">WAITING FOR SIGNAL</h2>
        <p className="font-mono text-[10px] md:text-xs text-ui-dim">SCANNING FREQUENCY 432.8 MHz</p>
      </div>
    </div>
  );
};

// --- Active State ---
const ActiveState: React.FC<{
  signal: Signal;
  isPlaying: boolean;
  onPlayPause: () => void;
  onTip: () => void;
  onEcho: () => void;
  onNext: () => void;
  onPrev: () => void;
  infoRef: React.RefObject<HTMLDivElement>;
  isTuning: boolean;
}> = ({ signal, isPlaying, onPlayPause, onTip, onEcho, onNext, onPrev, infoRef, isTuning }) => {

  const moodColor = getMoodColor(signal.mood);
  const visualizerRef = useRef<HTMLDivElement>(null);
  const playBtnRef = useRef<HTMLButtonElement>(null);

  // Get playback time from store for countdown
  const { playbackCurrentTime, playbackDuration } = useRadioStore();

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate remaining time when playing
  const getDisplayTime = (): string => {
    if (isPlaying && playbackDuration > 0) {
      const remaining = Math.max(0, playbackDuration - playbackCurrentTime);
      return formatTime(remaining);
    }
    // When paused, show the signal's total duration
    return signal.duration || '00:00';
  };

  // Radar/Circular Visualizer Logic
  useEffect(() => {
    if (!visualizerRef.current) return;

    // Create bars if not present (simple diffing by length)
    // We want a circle, so we place them absolutely
    const ctx = gsap.context(() => {
      const bars = visualizerRef.current!.children;
      const radius = window.innerWidth < 768 ? 50 : 60; // Responsive radius
      const total = bars.length;

      // Initial placement in circle
      Array.from(bars).forEach((bar, i) => {
        const angle = (i / total) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        gsap.set(bar as Element, {
          x: x,
          y: y,
          rotation: (angle * 180 / Math.PI) + 90,
          transformOrigin: "center bottom"
        });
      });

      // Animation Loop
      if (isPlaying && !isTuning) {
        Array.from(bars).forEach((bar) => {
          gsap.to(bar as Element, {
            scaleY: "random(1, 4)", // Scale height outwards
            opacity: "random(0.5, 1)",
            duration: "random(0.1, 0.3)",
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
          });
        });
      } else {
        // Idle / Tuning state
        gsap.to(bars, {
          scaleY: 1,
          opacity: 0.3,
          duration: 0.5,
          ease: "power2.out"
        });
      }
    }, visualizerRef);

    return () => ctx.revert();
  }, [isPlaying, isTuning, signal.id]);

  const handlePlayHover = (enter: boolean) => {
    gsap.to(playBtnRef.current, {
      scale: enter ? 1.1 : 1,
      boxShadow: enter ? `0 0 40px var(--color-accent-${moodColor})` : 'none',
      duration: 0.3
    });
  };

  return (
    <div className={`flex-1 flex flex-col relative z-10 transition-all duration-300 ${isTuning ? 'blur-sm scale-[0.98]' : 'blur-0 scale-100'}`}>
      {/* Top Bar Info */}
      <div ref={infoRef} className="flex justify-between items-start pt-6 px-6 pb-2 md:pt-10 md:px-8 md:pb-6 w-full shrink-0">
        <div className="flex-1 min-w-0 mr-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 shrink-0 rounded-full bg-accent-${moodColor} shadow-[0_0_10px_currentColor] animate-pulse`} />
            <span className={`font-mono text-[10px] md:text-xs text-accent-${moodColor} tracking-widest uppercase whitespace-nowrap`}>
              {isPlaying ? 'Live Transmission' : 'Signal Archive'}
            </span>
          </div>

          <h2 className="font-display font-bold text-3xl md:text-5xl text-white tracking-tight truncate leading-tight">
            <DecodedText text={`SIGNAL #${signal.id.substring(0, 4)}`} />
          </h2>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 font-mono text-[10px] md:text-xs text-ui-dim uppercase">
            <span className="text-white bg-white/10 px-1 rounded flex items-center gap-1">
              <Activity size={10} className="text-accent-cyan" /> {signal.source || 'UNKNOWN SECTOR'}
            </span>
            <span>•</span>
            <span className="text-accent-phosphor/80">{signal.mood}</span>
            <span>•</span>
            <span>{signal.timestamp}</span>
          </div>
        </div>

        <div className="text-right shrink-0 flex flex-col items-end gap-2">
          <div className="bg-space-black/50 border border-ui-border px-3 py-1.5 rounded flex items-center gap-2 backdrop-blur-md">
            <Share2 size={12} className="text-accent-purple" />
            <span className="font-mono text-[10px] md:text-xs text-white bold">{signal.echoes}</span>
          </div>
          {signal.tips > 0 && (
            <div className="bg-space-black/50 border border-ui-border px-3 py-1.5 rounded flex items-center gap-2 backdrop-blur-md">
              <DollarSign size={12} className="text-accent-orange" />
              <span className="font-mono text-[10px] md:text-xs text-white bold">{signal.tips}</span>
            </div>
          )}
        </div>
      </div>

      {/* Circular Radar Centerpiece - Removed fixed heights so it flexes properly */}
      <div className="flex-1 min-h-0 flex items-center justify-center relative py-2">

        {/* Center Rings */}
        <div className="absolute w-40 h-40 md:w-48 md:h-48 border border-ui-border/30 rounded-full" />
        <div className="absolute w-56 h-56 md:w-64 md:h-64 border border-dashed border-ui-border/20 rounded-full animate-[spin_20s_linear_infinite]" />

        {/* Visualizer Container - removed fixed h-56/h-64 to avoid pushing controls off screen */}
        <div className="relative w-full h-full flex items-center justify-center">
          <div ref={visualizerRef} className="absolute inset-0 flex items-center justify-center">
            {Array.from({ length: 48 }).map((_, i) => (
              <div
                key={i}
                className={`absolute w-1 h-3 bg-accent-${moodColor} rounded-full`}
                style={{ height: '12px' }} // Base height
              />
            ))}
          </div>

          {/* Timer Overlay */}
          <div className="absolute flex flex-col items-center justify-center pointer-events-none z-20">
            <span className="text-phosphor font-mono text-4xl md:text-5xl font-bold text-white drop-shadow-md tabular-nums tracking-wider">
              {getDisplayTime()}
            </span>
            <div className="mt-2 text-[9px] md:text-[10px] font-mono text-accent-cyan bg-accent-cyan/10 px-2 rounded">
              {signal.frequency} MHz
            </div>
          </div>
        </div>
      </div>

      {/* Frequency Tuner Controls - Elevated z-index to ensure visibility */}
      <div className="p-4 md:p-6 flex flex-col gap-3 md:gap-6 bg-gradient-to-t from-space-black/80 to-transparent shrink-0 relative z-20">

        {/* Custom Frequency Slider (Visual Representation of Next/Prev) */}
        <div className="flex items-center gap-3 md:gap-4 px-2 md:px-4">
          <span className="font-mono text-[9px] text-ui-dim">88.0</span>
          <div className="relative flex-1 h-6 md:h-8 bg-black/40 border-y border-ui-border overflow-hidden flex items-center group cursor-ew-resize">
            {/* Scale ticks */}
            <div className="absolute inset-0 flex justify-between px-2">
              {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} className={`w-px ${i % 5 === 0 ? 'h-4 bg-ui-dim' : 'h-2 bg-ui-dim/30'}`} />
              ))}
            </div>
            {/* Needle */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-accent-red shadow-[0_0_10px_rgba(255,42,42,0.8)] z-10" />

            {/* Slider Input overlay for interaction */}
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="50"
              className="absolute inset-0 opacity-0 cursor-ew-resize z-20"
              onInput={() => {
                // In a real app, this would change frequency granularly. 
              }}
              onMouseUp={(e) => {
                const val = parseInt((e.target as HTMLInputElement).value);
                if (val > 60) onNext();
                if (val < 40) onPrev();
                (e.target as HTMLInputElement).value = "50";
              }}
            />
          </div>
          <span className="font-mono text-[9px] text-ui-dim">108.0</span>
        </div>

        {/* Playback Controls - Scaled */}
        <div className="flex items-center justify-center gap-6 md:gap-10">
          <button
            onClick={onPrev}
            className="text-ui-dim hover:text-white transition-colors hover:scale-110 transform duration-200 flex flex-col items-center"
          >
            <SkipBack size={20} className="md:w-6 md:h-6" />
          </button>

          {/* GIANT PLAY BUTTON - Responsive Size */}
          <button
            ref={playBtnRef}
            onClick={onPlayPause}
            onMouseEnter={() => handlePlayHover(true)}
            onMouseLeave={() => handlePlayHover(false)}
            className={`w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center border-2 transition-colors duration-300 shadow-2xl ${isPlaying ? `border-accent-${moodColor} bg-accent-${moodColor}/20 text-accent-${moodColor} shadow-[0_0_30px_rgba(6,182,212,0.3)]` : 'border-white text-white bg-white/5 hover:bg-white/10'}`}
          >
            {isPlaying ? <Square size={20} className="md:w-7 md:h-7" fill="currentColor" /> : <Play size={24} className="ml-1 md:w-8 md:h-8" fill="currentColor" />}
          </button>

          <button
            onClick={onNext}
            className="text-ui-dim hover:text-white transition-colors hover:scale-110 transform duration-200 flex flex-col items-center"
          >
            <SkipForward size={20} className="md:w-6 md:h-6" />
          </button>

          <div className="w-px h-8 md:h-10 bg-ui-border mx-1 md:mx-2" />

          <ActionBtn icon={DollarSign} label="TIP" onClick={onTip} color="orange" />
          <ActionBtn icon={Share2} label="ECHO" onClick={onEcho} color="purple" />
        </div>
      </div>
    </div>
  );
};

const ActionBtn = ({ icon: Icon, label, onClick, color }: any) => {
  const btnRef = useRef<HTMLButtonElement>(null);
  const handleHover = (enter: boolean) => {
    gsap.to(btnRef.current, { y: enter ? -5 : 0, duration: 0.2 });
  }

  return (
    <button
      ref={btnRef}
      onClick={onClick}
      onMouseEnter={() => handleHover(true)}
      onMouseLeave={() => handleHover(false)}
      className="group flex flex-col items-center gap-1 md:gap-1.5"
    >
      <div className={`p-2.5 md:p-3 rounded-full border border-ui-border bg-space-black group-hover:border-accent-${color} group-hover:text-accent-${color} transition-colors duration-300 shadow-lg`}>
        <Icon size={16} className="md:w-[18px] md:h-[18px]" />
      </div>
      <span className="font-mono text-[8px] md:text-[9px] text-ui-dim group-hover:text-white tracking-wider">{label}</span>
    </button>
  );
};

const getMoodColor = (mood: string) => {
  switch (mood) {
    case 'CALM': return 'cyan';
    case 'EXCITED': return 'orange';
    case 'MYSTERIOUS': return 'purple';
    case 'URGENT': return 'red';
    default: return 'phosphor';
  }
};