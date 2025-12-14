import React, { useState, useRef, useEffect } from 'react';
import { Wallet, Radio, Activity, Settings, Power, Volume2, Signal, Wifi } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { gsap } from 'gsap';

interface HeaderProps {
  listenerCount: number;
}

export const Header: React.FC<HeaderProps> = ({ listenerCount }) => {
  const [time, setTime] = useState<string>('');
  const headerRef = useRef<HTMLDivElement>(null);
  const morseRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toISOString().split('T')[1].split('.')[0] + ' UTC');
    };
    const timer = setInterval(updateTime, 1000);
    updateTime();
    return () => clearInterval(timer);
  }, []);

  // Entrance Animation & Morse Code Easter Egg
  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Entrance
      gsap.from(headerRef.current!.children, {
        y: -30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out"
      });

      // 2. Morse Code: "MR" (Midnight Radio)
      // M: --  | R: .-.
      // Dot: 0.15s, Dash: 0.45s, Gap: 0.15s, LetterGap: 0.45s, LoopGap: 2s
      if (morseRef.current) {
        const tl = gsap.timeline({ repeat: -1, repeatDelay: 3 });
        const dot = 0.15;
        const dash = 0.45;
        const gap = 0.15;
        const letterGap = 0.45;
        const offOpacity = 0.3;
        const onOpacity = 1;

        // Start Low
        tl.set(morseRef.current, { opacity: offOpacity });

        // 'M' (--): Dash, Gap, Dash
        tl.to(morseRef.current, { opacity: onOpacity, duration: 0.05 }) // On
          .to(morseRef.current, { opacity: onOpacity, duration: dash }) // Hold Dash
          .to(morseRef.current, { opacity: offOpacity, duration: 0.05 }) // Off
          .to(morseRef.current, { opacity: offOpacity, duration: gap }) // Gap
          .to(morseRef.current, { opacity: onOpacity, duration: 0.05 }) // On
          .to(morseRef.current, { opacity: onOpacity, duration: dash }) // Hold Dash
          .to(morseRef.current, { opacity: offOpacity, duration: 0.05 }); // Off

        // Letter Gap
        tl.to(morseRef.current, { opacity: offOpacity, duration: letterGap });

        // 'R' (.-.): Dot, Gap, Dash, Gap, Dot
        tl.to(morseRef.current, { opacity: onOpacity, duration: 0.05 }) // On
          .to(morseRef.current, { opacity: onOpacity, duration: dot }) // Hold Dot
          .to(morseRef.current, { opacity: offOpacity, duration: 0.05 }) // Off
          .to(morseRef.current, { opacity: offOpacity, duration: gap }) // Gap
          .to(morseRef.current, { opacity: onOpacity, duration: 0.05 }) // On
          .to(morseRef.current, { opacity: onOpacity, duration: dash }) // Hold Dash
          .to(morseRef.current, { opacity: offOpacity, duration: 0.05 }) // Off
          .to(morseRef.current, { opacity: offOpacity, duration: gap }) // Gap
          .to(morseRef.current, { opacity: onOpacity, duration: 0.05 }) // On
          .to(morseRef.current, { opacity: onOpacity, duration: dot }) // Hold Dot
          .to(morseRef.current, { opacity: offOpacity, duration: 0.05 }); // Off
      }

    }, headerRef);
    return () => ctx.revert();
  }, []);

  const handleWalletHover = (e: React.MouseEvent, entering: boolean) => {
    gsap.to(e.currentTarget, {
      scale: entering ? 1.02 : 1,
      duration: 0.3,
      ease: "power2.out"
    });
  };

  return (
    <header ref={headerRef} className="h-[70px] w-full flex items-center justify-between px-4 md:px-8 relative z-50 shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-4 cursor-default group">
        <div className="w-10 h-10 rounded border border-ui-border bg-space-panel flex items-center justify-center group-hover:border-accent-phosphor/50 transition-colors relative overflow-hidden">
          <Radio ref={morseRef} className="text-accent-phosphor relative z-10" size={18} />
          <div className="absolute inset-0 bg-accent-phosphor/10 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </div>
        <div>
          {/* UPDATED LOGO FONT - Megrim */}
          <h1 className="font-logo font-bold text-3xl md:text-4xl text-white tracking-wider group-hover:text-accent-phosphor transition-colors glitch-text drop-shadow-[0_0_10px_rgba(0,0,0,0.8)] stroke-black">MIDNIGHT</h1>
          <div className="flex items-center gap-2 -mt-1">
            <div className="w-1.5 h-1.5 bg-accent-cyan rounded-full animate-pulse" />
            <span className="font-mono text-[10px] text-ui-dim tracking-widest uppercase">Deep Space Relay</span>
          </div>
        </div>
      </div>

      {/* Center HUD Data */}
      <div className="hidden md:flex items-center gap-8 px-6 py-2 rounded-full border border-ui-border bg-space-panel/50 backdrop-blur-sm shadow-lg">
        <div className="flex items-center gap-3">
          <Wifi size={14} className="text-ui-dim" />
          <span className="font-mono text-xs text-ui-dim">{time}</span>
        </div>
        <div className="w-px h-4 bg-ui-border" />
        <div className="flex items-center gap-3">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className={`w-0.5 h-3 ${i < 3 ? 'bg-accent-phosphor' : 'bg-ui-dim/20'}`} />
            ))}
          </div>
          <span className="font-mono text-xs text-accent-phosphor text-glow">{listenerCount} RECEIVING</span>
        </div>
      </div>

      {/* Wallet Button - ENHANCED UI using RainbowKit */}
      <div className="relative z-50">
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            authenticationStatus,
            mounted,
          }) => {
            const ready = mounted && authenticationStatus !== 'loading';
            const connected =
              ready &&
              account &&
              chain &&
              (!authenticationStatus ||
                authenticationStatus === 'authenticated');

            return (
              <div
                {...(!ready && {
                  'aria-hidden': true,
                  'style': {
                    opacity: 0,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  },
                })}
              >
                {(() => {
                  if (!connected) {
                    return (
                      <button
                        onClick={openConnectModal}
                        onMouseEnter={(e) => handleWalletHover(e, true)}
                        onMouseLeave={(e) => handleWalletHover(e, false)}
                        className="group relative flex items-center gap-4 px-6 py-2 transition-all duration-300 outline-none"
                      >
                        <div className="absolute inset-0 skew-x-[-12deg] border border-accent-cyan/60 bg-accent-cyan/5 shadow-[0_0_10px_rgba(0,240,255,0.1)] group-hover:bg-accent-cyan/15 group-hover:shadow-[0_0_25px_rgba(0,240,255,0.3)] group-hover:border-accent-cyan backdrop-blur-md transition-all duration-300">
                          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-accent-cyan opacity-80" />
                          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-accent-cyan opacity-80" />
                          <div className="absolute inset-0 overflow-hidden rounded-sm">
                            <div className="absolute top-0 bottom-0 left-[-100%] w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_1s_infinite]" />
                          </div>
                        </div>
                        <div className="relative flex items-center gap-3 z-10">
                          <span className="font-display font-bold text-xs tracking-widest uppercase text-accent-cyan group-hover:text-white transition-colors">CONNECT WALLET</span>
                          <Wallet size={16} className="text-accent-cyan group-hover:text-white transition-colors" />
                          <div className="w-1.5 h-1.5 rounded-full bg-ui-dim group-hover:bg-accent-cyan" />
                        </div>
                      </button>
                    );
                  }

                  if (chain.unsupported) {
                    return (
                      <button
                        onClick={openChainModal}
                        className="group relative flex items-center gap-4 px-6 py-2 transition-all duration-300 outline-none"
                      >
                        <div className="absolute inset-0 skew-x-[-12deg] border border-red-500/60 bg-red-500/10 backdrop-blur-md transition-all duration-300" />
                        <span className="relative z-10 font-display font-bold text-xs tracking-widest uppercase text-red-500">WRONG NETWORK</span>
                      </button>
                    );
                  }

                  return (
                    <button
                      onClick={openAccountModal}
                      onMouseEnter={(e) => handleWalletHover(e, true)}
                      onMouseLeave={(e) => handleWalletHover(e, false)}
                      className="group relative flex items-center gap-4 px-6 py-2 transition-all duration-300 outline-none"
                    >
                      <div className="absolute inset-0 skew-x-[-12deg] border border-accent-phosphor/60 bg-accent-phosphor/10 shadow-[0_0_15px_rgba(0,255,65,0.2)] backdrop-blur-md transition-all duration-300">
                        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-accent-phosphor opacity-80" />
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-accent-phosphor opacity-80" />
                      </div>
                      <div className="relative flex items-center gap-3 z-10">
                        <span className="font-display font-bold text-xs tracking-widest uppercase text-accent-phosphor drop-shadow-[0_0_5px_rgba(0,255,65,0.8)]">
                          {account.displayName}
                        </span>
                        <Wallet size={16} className="text-accent-phosphor" />
                        <div className="w-1.5 h-1.5 rounded-full bg-accent-phosphor shadow-[0_0_8px_currentColor]" />
                      </div>
                    </button>
                  );
                })()}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>
    </header>
  );
};

interface ControlBarProps {
  onDisconnect: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({ onDisconnect, activeTab, onTabChange }) => {
  const [volumes, setVolumes] = useState({ atmos: 40, interference: 10, void: 60 });
  const barRef = useRef<HTMLDivElement>(null);
  const eqRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Entrance Animation & Idle Jitter
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Entrance
      gsap.from(barRef.current!.children, {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
        delay: 0.2
      });

      // Idle Random Movement for EQ Bars
      eqRefs.current.forEach((bar) => {
        if (!bar) return;
        gsap.to(bar, {
          height: "random(20, 100)%", // Small jitter in height
          duration: "random(0.5, 2)",
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
      });

    }, barRef);
    return () => ctx.revert();
  }, []);

  const handleVolumeChange = (type: keyof typeof volumes, val: number) => {
    setVolumes(prev => ({ ...prev, [type]: val }));
  };

  const handleVolBarHover = (e: React.MouseEvent, entering: boolean) => {
    gsap.to(e.currentTarget, {
      scaleY: entering ? 1.5 : 1,
      duration: 0.2,
      ease: "back.out(2)"
    });
  };

  return (
    <div ref={barRef} className="h-[80px] w-full px-4 md:px-8 pb-4 flex items-end justify-between relative z-50 shrink-0 bg-gradient-to-t from-space-black via-space-black/80 to-transparent">

      {/* Left Controls: Ambient Mixer */}
      <div className="hidden md:flex items-center gap-6 w-1/4">
        {['atmos', 'interference', 'void'].map((type, typeIdx) => (
          <div key={type} className="flex flex-col gap-2 group">
            <span className="font-mono text-[9px] text-ui-dim uppercase tracking-widest group-hover:text-accent-cyan transition-colors cursor-default">
              {type}
            </span>
            <div className="flex gap-1 h-4 items-end cursor-pointer">
              {[1, 2, 3, 4, 5].map((level, i) => {
                const active = (volumes as any)[type] >= level * 20;
                return (
                  <div
                    key={level}
                    // Store ref for animation, but only if it's active to avoid animating inactive bars aggressively
                    ref={el => { if (active) eqRefs.current.push(el); }}
                    onClick={() => handleVolumeChange(type as any, level * 20)}
                    onMouseEnter={(e) => handleVolBarHover(e, true)}
                    onMouseLeave={(e) => handleVolBarHover(e, false)}
                    className={`w-3 rounded-sm transition-colors duration-300 origin-bottom ${active ? 'bg-accent-cyan h-3 shadow-[0_0_5px_rgba(0,240,255,0.5)]' : 'bg-ui-border h-1.5'}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Center Nav */}
      <div className="flex-1 flex justify-center">
        <div className="flex items-center p-1 bg-space-panel rounded-lg border border-ui-border backdrop-blur-md shadow-2xl relative overflow-hidden">
          {[
            { id: 'LIVE', icon: Signal, label: 'TRANSMIT' },
            { id: 'MY', icon: Activity, label: 'ARCHIVE' },
            { id: 'LOG', icon: Volume2, label: 'LOGS' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                   relative px-4 md:px-6 py-2 rounded-md flex items-center gap-2 transition-colors duration-300 z-10
                   ${activeTab === tab.id ? 'text-white' : 'text-ui-dim hover:text-white'}
                `}
            >
              <tab.icon size={14} />
              <span className="font-display text-xs font-bold tracking-wider">{tab.label}</span>
              {activeTab === tab.id && (
                <span className="absolute inset-0 bg-white/10 rounded-md -z-10 animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Right Controls */}
      <div className="hidden md:flex w-1/4 justify-end gap-2">
        <button className="p-2 text-ui-dim hover:text-white transition-colors border border-transparent hover:border-ui-border rounded hover:scale-110 transform duration-200"><Settings size={16} /></button>
        <button onClick={onDisconnect} className="p-2 text-red-500/70 hover:text-red-500 transition-colors border border-transparent hover:border-red-900/50 rounded hover:scale-110 transform duration-200"><Power size={16} /></button>
      </div>

      {/* Mobile Right Spacer (to balance Nav) */}
      <div className="md:hidden w-8" />
    </div>
  );
};