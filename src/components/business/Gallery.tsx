import React, { useState, useEffect, useRef } from 'react';
import { VoiceNoteNFT } from '@/types';
import { Search, Filter, SortDesc, Box, Eye, Calendar, DollarSign, Activity, Ghost } from 'lucide-react';
import { gsap } from 'gsap';
import { useRadioStore } from '@/store/useRadioStore';

interface GalleryProps {
  nfts: VoiceNoteNFT[];
  onSelect: (nft: VoiceNoteNFT) => void;
}

type FilterType = 'ALL' | 'LISTED' | 'ARCHIVED';
type SortType = 'NEWEST' | 'OLDEST' | 'PRICE_HIGH';

export const Gallery: React.FC<GalleryProps> = ({ nfts, onSelect }) => {
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [sort, setSort] = useState<SortType>('NEWEST');
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredNFTs = React.useMemo(() => {
    let result = [...nfts];

    // Filter
    if (filter === 'LISTED') result = result.filter(n => n.isListed);
    // 'ARCHIVED' could mean unlisted or old. For now, let's say unlisted.
    if (filter === 'ARCHIVED') result = result.filter(n => !n.isListed);

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n =>
        n.metadata.name.toLowerCase().includes(q) ||
        n.metadata.description.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sort === 'NEWEST') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sort === 'OLDEST') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sort === 'PRICE_HIGH') return (Number(b.price) || 0) - (Number(a.price) || 0);
      return 0;
    });

    return result;
  }, [nfts, filter, sort, searchQuery]);

  // Entrance Animation
  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".nft-card",
        { y: 20, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.4, stagger: 0.05, ease: "power2.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [filter, sort]);

  return (
    <div ref={containerRef} className="w-full h-full p-4 md:p-8 overflow-y-auto custom-scrollbar flex flex-col">
      {/* Header Controls */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 border-b border-ui-border pb-6">
        <div>
          <h2 className="font-display font-bold text-3xl text-white tracking-tight mb-2 flex items-center gap-3">
            <Box className="text-accent-cyan" />
            MY COLLECTION
          </h2>
          <p className="font-mono text-xs text-ui-dim tracking-widest uppercase">
            {filteredNFTs.length} ARTIFACTS SECURED
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="flex-1 md:w-64 bg-space-black border border-ui-border rounded px-3 py-2 flex items-center gap-2 focus-within:border-accent-cyan transition-colors">
            <Search size={14} className="text-ui-dim" />
            <input
              type="text"
              placeholder="SEARCH_ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none font-mono text-xs text-white placeholder-ui-dim/50 w-full"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1 bg-space-black p-1 rounded border border-ui-border">
            {(['ALL', 'LISTED', 'ARCHIVED'] as FilterType[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded text-[9px] font-mono font-bold transition-all ${filter === f ? 'bg-accent-cyan text-black' : 'text-ui-dim hover:text-white'}`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-2 bg-space-black border border-ui-border rounded text-xs font-mono text-ui-dim hover:text-white hover:border-ui-dim transition-colors">
              <SortDesc size={14} />
              <span>SORT</span>
            </button>
            {/* Dropdown (Simple implementation) */}
            <div className="absolute right-0 top-full mt-2 w-32 bg-space-black border border-ui-border rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
              {(['NEWEST', 'OLDEST', 'PRICE_HIGH'] as SortType[]).map(s => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className="w-full text-left px-3 py-2 text-[9px] font-mono text-ui-dim hover:bg-white/10 hover:text-accent-cyan"
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
        {filteredNFTs.map(nft => (
          <NFTCard key={nft.tokenId} nft={nft} onClick={() => onSelect(nft)} />
        ))}
      </div>
    </div>
  );
};

// --- Sub Components ---

const NFTCard: React.FC<{ nft: VoiceNoteNFT, onClick: () => void }> = ({ nft, onClick }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const borderRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const onHover = (enter: boolean) => {
    if (enter) {
      // 1. Scale Up
      gsap.to(cardRef.current, { scale: 1.02, duration: 0.3, ease: "back.out(1.5)" });

      // 2. Border Surge
      gsap.to(borderRef.current, { opacity: 1, duration: 0.1 });

      // 3. Content 'Unfocus' Momentarily (Chromatic Aberration sim)
      gsap.fromTo(contentRef.current,
        { filter: "brightness(1.5) contrast(1.2)" },
        { filter: "brightness(1) contrast(1)", duration: 0.5 }
      );

    } else {
      gsap.to(cardRef.current, { scale: 1, duration: 0.3 });
      gsap.to(borderRef.current, { opacity: 0, duration: 0.3 });
    }
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className="nft-card relative h-80 rounded-xl cursor-pointer group perspective-1000"
    >
      {/* 1. Animated Border Layer (The "Crazy" scanning part) */}
      <div ref={borderRef} className="absolute -inset-[2px] rounded-xl opacity-0 transition-opacity bg-gradient-to-br from-accent-cyan via-accent-purple to-accent-phosphor bg-[length:300%_300%] animate-gradient-fast blur-sm pointer-events-none" />

      {/* 2. Main Content Container */}
      <div ref={contentRef} className="relative h-full w-full bg-space-panel border border-ui-border rounded-xl overflow-hidden flex flex-col z-10 transition-all duration-300 group-hover:border-transparent">

        {/* Visual Header */}
        <div className="h-40 bg-space-black relative overflow-hidden flex items-center justify-center">
          {/* Grid Pattern moving on hover */}
          <div className="absolute inset-0 bg-grid-pattern opacity-20 group-hover:opacity-40 transition-opacity duration-500 group-hover:scale-110 transform origin-center" />

          {/* Glitch Overlay (Hidden by default, flashes on hover via CSS Scanline logic could go here, but keeping it simpler) */}
          <div className="absolute inset-0 bg-accent-cyan/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out pointer-events-none mix-blend-overlay" />

          {/* Generated Abstract Waveform - Now more frantic on hover */}
          <div className="flex items-center justify-center gap-1 h-20 w-full px-8 relative z-10">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className={`w-2 rounded-full transition-all duration-300 group-hover:shadow-[0_0_10px_currentColor] group-hover:brightness-150 ${['bg-accent-cyan', 'bg-accent-purple', 'bg-accent-phosphor'][i % 3]
                  }`}
                style={{
                  height: `${30 + Math.random() * 60}%`,
                  animation: `pulse ${0.5 + Math.random()}s infinite alternate`
                }}
              />
            ))}
          </div>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {nft.isListed && (
              <div className="bg-space-black/80 border border-accent-orange/50 px-2 py-1 rounded text-[9px] font-mono text-accent-orange flex items-center gap-1 shadow-[0_0_10px_rgba(249,115,22,0.2)]">
                <DollarSign size={10} /> LISTED
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-4 flex-1 flex flex-col bg-gradient-to-b from-space-panel to-space-black/90 group-hover:from-space-panel/80 group-hover:to-space-black transition-colors">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-display font-bold text-white text-lg truncate pr-2 group-hover:text-accent-cyan transition-colors">{nft.metadata.name}</h3>
            <span className="font-mono text-[10px] text-ui-dim bg-white/5 px-1.5 py-0.5 rounded group-hover:bg-accent-cyan/20 group-hover:text-accent-cyan transition-colors">#{nft.tokenId}</span>
          </div>

          <p className="font-mono text-[10px] text-ui-dim line-clamp-2 mb-4 flex-1 group-hover:text-ui-text transition-colors">
            {nft.metadata.description}
          </p>

          {/* Tech Footer */}
          <div className="border-t border-ui-border/50 pt-3 flex justify-between items-center mt-auto group-hover:border-accent-cyan/30 transition-colors">
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-ui-dim">CREATED</span>
              <div className="flex items-center gap-1 text-[10px] text-white">
                <Calendar size={10} className="text-ui-dim group-hover:text-accent-cyan transition-colors" />
                {new Date(nft.createdAt).toLocaleDateString()}
              </div>
            </div>
            {nft.price && (
              <div className="text-right">
                <span className="text-[9px] font-mono text-ui-dim">VALUE</span>
                <div className="font-bold font-display text-accent-orange text-sm drop-shadow-[0_0_5px_rgba(249,115,22,0.5)]">{nft.price} MNT</div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};