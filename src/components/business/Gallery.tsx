import React, { useState, useEffect, useRef } from 'react';
import { Signal } from '@/types';
import { Play, Ghost, Hash, Calendar, Search, Terminal } from 'lucide-react';
import { gsap } from 'gsap';

interface GalleryProps {
  signals: Signal[];
  onPlay: (signal: Signal) => void;
}

export const Gallery: React.FC<GalleryProps> = ({ signals, onPlay }) => {
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED' | 'TIPPED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate mock expired signals mixed with active ones for the demo
  const allSignals = React.useMemo(() => [
    ...signals,
    { ...signals[0], id: 'expired-1', mood: 'VOID', isExpired: true, timestamp: new Date(Date.now() - 86400000 * 2) },
    { ...signals[1], id: 'expired-2', mood: 'VOID', isExpired: true, timestamp: new Date(Date.now() - 86400000 * 3) },
    { ...signals[2], id: 'high-tip', tips: 12.5, mood: 'EXCITED', timestamp: new Date() },
  ], [signals]);

  const filteredSignals = allSignals.filter(s => {
    // Search logic
    if (searchQuery && !s.sector.toLowerCase().includes(searchQuery.toLowerCase()) && !s.id.includes(searchQuery)) {
      return false;
    }
    // Filter logic
    if (filter === 'ACTIVE') return !s.isExpired;
    if (filter === 'EXPIRED') return s.isExpired;
    if (filter === 'TIPPED') return s.tips > 5;
    return true;
  });

  // Entrance Animation
  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // Reset state for re-animation
      gsap.set(".gallery-card", { y: 30, opacity: 0 });

      gsap.to(".gallery-card", {
        y: 0,
        opacity: 1,
        duration: 0.5,
        stagger: {
          amount: 0.3,
          grid: "auto",
          from: "start"
        },
        ease: "back.out(1.2)",
        overwrite: "auto"
      });
    }, containerRef);

    return () => ctx.revert();
  }, [filter, searchQuery]); // Re-animate on search too

  // Hover Animations
  const onHoverEnter = (e: React.MouseEvent<HTMLDivElement>, color: string) => {
    gsap.to(e.currentTarget, {
      scale: 1.02,
      borderColor: `var(--color-accent-${color})`,
      boxShadow: `0 0 20px rgba(0, 240, 255, 0.2)`,
      duration: 0.3,
      ease: "power2.out"
    });

    // Animate inner visual bars
    gsap.to(e.currentTarget.querySelectorAll('.visual-bar'), {
      height: "random(40, 100)%",
      opacity: 1,
      duration: 0.4,
      stagger: 0.02,
      ease: "back.out(1.7)"
    });
  };

  const onHoverLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, {
      scale: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      boxShadow: 'none',
      duration: 0.3,
      ease: "power2.out"
    });

    // Reset inner visual bars
    gsap.to(e.currentTarget.querySelectorAll('.visual-bar'), {
      height: "random(10, 40)%",
      opacity: 0.4,
      duration: 0.4,
      stagger: 0.01,
      ease: "power2.in"
    });
  };

  return (
    <div ref={containerRef} className="w-full h-full p-8 overflow-y-auto custom-scrollbar flex flex-col">
      <div className="max-w-7xl mx-auto w-full">

        {/* Header / Search Protocol */}
        <header className="mb-8 border-b border-ui-border pb-6 flex flex-col gap-6">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-display font-bold text-white mb-1 tracking-wider glitch-text">ARCHIVE</h2>
              <p className="font-mono text-xs text-ui-dim tracking-widest uppercase">PERSONAL DATA FRAGMENTS</p>
            </div>
            {/* Stats */}
            <div className="text-right hidden md:block">
              <div className="font-mono text-xl text-accent-cyan font-bold">{allSignals.length}</div>
              <div className="font-mono text-[9px] text-ui-dim">TOTAL RECORDS</div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-space-navy/40 p-1.5 rounded-lg border border-ui-border/50">

            {/* Search Input */}
            <div className="flex-1 w-full md:w-auto flex items-center gap-3 px-3 py-2 bg-space-black/50 rounded border border-ui-border focus-within:border-accent-cyan/50 transition-colors">
              <Terminal size={14} className="text-accent-cyan shrink-0" />
              <input
                type="text"
                placeholder="SEARCH PROTOCOL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none font-mono text-xs text-white w-full placeholder-ui-dim/50 uppercase tracking-widest"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto p-1">
              {[
                { id: 'ALL', label: 'ALL_DATA' },
                { id: 'ACTIVE', label: 'LIVE' },
                { id: 'EXPIRED', label: 'LOST' },
                { id: 'TIPPED', label: 'HIGH_VALUE' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id as any)}
                  className={`
                        px-4 py-2 rounded text-[10px] font-mono font-bold tracking-wider transition-all whitespace-nowrap
                        ${filter === tab.id
                      ? 'bg-accent-cyan text-black shadow-glow'
                      : 'text-ui-dim hover:text-white hover:bg-white/5'
                    }
                        `}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
          {filteredSignals.map((signal) => {
            const moodColor = getMoodColor(signal.mood as any);

            return (
              <div
                key={signal.id}
                onMouseEnter={(e) => !signal.isExpired && onHoverEnter(e, moodColor)}
                onMouseLeave={(e) => !signal.isExpired && onHoverLeave(e)}
                className={`
                  gallery-card group relative h-[260px] rounded-xl border transition-colors duration-300 flex flex-col overflow-hidden cursor-default
                  ${signal.isExpired
                    ? 'border-ui-border bg-space-navy/20 opacity-60 grayscale'
                    : 'border-ui-border bg-space-panel'
                  }
                `}
              >
                {/* Scanner Line Effect */}
                {!signal.isExpired && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-cyan to-transparent opacity-0 group-hover:opacity-50 animate-[scan_2s_linear_infinite] pointer-events-none z-10" />
                )}

                <div className="absolute top-0 right-0 p-3 opacity-30 z-10">
                  {signal.isExpired ? <Ghost size={16} /> : <Hash size={16} />}
                </div>

                <div className="p-5 flex-1 flex flex-col relative">
                  <div className="font-mono text-[10px] text-ui-dim mb-3 flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${signal.isExpired ? 'bg-ui-dim' : `bg-accent-${moodColor}`}`} />
                    {signal.isExpired ? 'SIGNAL_LOST' : 'TRANSMISSION_ACTIVE'}
                  </div>

                  <h3 className="font-display font-bold text-xl text-white mb-1 tracking-wide">{signal.sector}</h3>
                  <div className="font-mono text-[9px] text-accent-cyan/80 mb-3 bg-accent-cyan/5 inline-block px-1.5 py-0.5 rounded border border-accent-cyan/10">
                    FREQ: {signal.frequency}MHz
                  </div>
                  <p className="font-mono text-xs text-ui-dim mb-4 line-clamp-2 leading-relaxed">
                    Sector analysis confirmed. Duration {signal.duration}s. Encrypted via IPFS protocol layer 4.
                  </p>

                  {/* Visual Bar */}
                  <div className="mt-auto flex gap-0.5 h-16 items-end border-b border-ui-border/30 pb-1">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div
                        key={i}
                        className={`visual-bar flex-1 bg-accent-${moodColor} rounded-t-sm opacity-40`}
                        style={{ height: `${10 + Math.random() * 30}%` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-3 bg-black/40 border-t border-ui-border flex justify-between items-center relative z-10 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-ui-dim">
                    <Calendar size={10} />
                    <span>{signal.timestamp.toLocaleDateString()}</span>
                  </div>

                  {!signal.isExpired && (
                    <button
                      onClick={() => onPlay(signal as any)}
                      className="h-7 px-3 rounded bg-white/5 border border-ui-border hover:border-accent-cyan hover:bg-accent-cyan/10 hover:text-white flex items-center justify-center text-ui-dim transition-all group/btn"
                    >
                      <span className="text-[9px] font-bold mr-2 tracking-wider">DECODE</span>
                      <Play size={10} fill="currentColor" className="group-hover/btn:text-accent-cyan" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const getMoodColor = (mood: string) => {
  if (mood === 'VOID') return 'ui-dim';
  switch (mood) {
    case 'CALM': return 'cyan';
    case 'EXCITED': return 'orange';
    case 'MYSTERIOUS': return 'purple';
    case 'URGENT': return 'red';
    default: return 'phosphor';
  }
};