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

  const onHover = (enter: boolean) => {
    gsap.to(cardRef.current, {
      y: enter ? -5 : 0,
      scale: enter ? 1.02 : 1,
      boxShadow: enter ? '0 10px 30px -10px rgba(6,182,212,0.2)' : 'none',
      borderColor: enter ? 'var(--color-accent-cyan)' : 'rgba(255,255,255,0.1)',
      duration: 0.3
    });
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className="nft-card bg-space-panel/40 border border-ui-border rounded-xl overflow-hidden cursor-pointer group relative flex flex-col h-80"
    >
      {/* Visual Header (Waveform Art) */}
      <div className="h-40 bg-black/50 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />

        {/* Generated Abstract Waveform */}
        <div className="flex items-center justify-center gap-1 h-20 w-full px-8">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className={`w-2 bg-accent-${['cyan', 'purple', 'phosphor'][i % 3]} rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300`}
              style={{
                height: `${30 + Math.random() * 70}%`, // Static random for now, could be seeded
                animation: `pulse 2s infinite ${i * 0.1}s`
              }}
            />
          ))}
        </div>

        {/* Tags */}
        <div className="absolute top-3 left-3 flex gap-2">
          {nft.isListed && (
            <div className="bg-accent-orange/10 border border-accent-orange/30 px-2 py-0.5 rounded text-[9px] font-mono text-accent-orange flex items-center gap-1">
              <DollarSign size={8} /> LISTED
            </div>
          )}
        </div>
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-white/10 px-2 py-1 rounded-full backdrop-blur-md">
            <Eye size={12} className="text-white" />
          </div>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-display font-bold text-white text-lg truncate pr-2">{nft.metadata.name}</h3>
          <span className="font-mono text-[10px] text-ui-dim bg-white/5 px-1.5 py-0.5 rounded">#{nft.tokenId}</span>
        </div>

        <p className="font-mono text-[10px] text-ui-dim line-clamp-2 mb-4 flex-1">
          {nft.metadata.description}
        </p>

        {/* Footer Metadata */}
        <div className="border-t border-ui-border/50 pt-3 flex justify-between items-center mt-auto">
          <div className="flex flex-col">
            <span className="text-[9px] font-mono text-ui-dim">CREATED</span>
            <div className="flex items-center gap-1 text-[10px] text-white">
              <Calendar size={10} className="text-accent-cyan" />
              {new Date(nft.createdAt).toLocaleDateString()}
            </div>
          </div>
          {nft.price && (
            <div className="text-right">
              <span className="text-[9px] font-mono text-ui-dim">PRICE</span>
              <div className="font-bold font-display text-accent-orange text-sm">{nft.price} MNT</div>
            </div>
          )}
        </div>
      </div>

      {/* Hover Glint */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shine_1s_ease-out_forwards]" />
    </div>
  );
};