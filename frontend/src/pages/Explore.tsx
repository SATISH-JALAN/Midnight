import React, { useEffect, useRef, useState } from 'react';
import { useRadioStore } from '@/store/useRadioStore';
import { Signal, LeaderboardEntry } from '@/types';
import { Play, TrendingUp, Trophy, Zap, Share2, Activity, Star } from 'lucide-react';
import { gsap } from 'gsap';
import { fetchStream, getAudioUrl } from '@/services/api';

export const ExplorePage: React.FC = () => {
    const {
        trendingSignals,
        leaderboard,
        setCurrentSignal,
        setIsPlaying
    } = useRadioStore();

    const [isLoading, setIsLoading] = useState(true);

    // Fetch real data from backend
    useEffect(() => {
        const loadExploreData = async () => {
            try {
                setIsLoading(true);
                const response = await fetchStream();

                if (response.success && response.data?.notes) {
                    // Convert backend notes to Signal format
                    const signals: Signal[] = response.data.notes.map((note, index) => ({
                        id: note.noteId,
                        source: note.sector,
                        frequency: 880 + index * 20,
                        duration: `${Math.floor(note.duration / 60)}:${(note.duration % 60).toString().padStart(2, '0')}`,
                        timestamp: new Date(note.timestamp).toISOString(),
                        mood: getMoodFromColor(note.moodColor),
                        tips: note.tips,
                        echoes: note.echoes,
                        hasAudio: true,
                        noteId: note.noteId,
                        audioUrl: getAudioUrl(note.noteId),
                        broadcaster: note.broadcaster,
                        listenerCount: response.data?.totalListeners || 0,
                    }));

                    // Create leaderboard from signals sorted by tips/echoes
                    const topTipped: LeaderboardEntry[] = [...signals]
                        .sort((a, b) => (b.tips || 0) - (a.tips || 0))
                        .slice(0, 5)
                        .map((s, i) => ({
                            rank: i + 1,
                            signalId: s.id,
                            sector: s.source,
                            value: s.tips || 0,
                            trend: i === 0 ? 'up' : 'neutral',
                        }));

                    const mostEchoed: LeaderboardEntry[] = [...signals]
                        .sort((a, b) => (b.echoes || 0) - (a.echoes || 0))
                        .slice(0, 5)
                        .map((s, i) => ({
                            rank: i + 1,
                            signalId: s.id,
                            sector: s.source,
                            value: s.echoes || 0,
                            trend: i === 0 ? 'up' : 'neutral',
                        }));

                    useRadioStore.setState({
                        trendingSignals: signals,
                        leaderboard: { topTipped, mostEchoed }
                    });
                } else {
                    // Fallback to mock if no data
                    loadMockData();
                }
            } catch (err) {
                console.error('Failed to fetch explore data:', err);
                loadMockData();
            } finally {
                setIsLoading(false);
            }
        };

        loadExploreData();
    }, []);

    // Fallback mock data
    const loadMockData = () => {
        const mocks: Signal[] = Array.from({ length: 5 }).map((_, i) => ({
            id: `trend-${i}`,
            source: `Sector ${['9X', 'Alpha', 'Void', 'Deep'][i % 4]}`,
            frequency: 880 + i * 20,
            duration: "03:22",
            timestamp: new Date().toISOString(),
            mood: ['EXCITED', 'URGENT', 'MYSTERIOUS'][i % 3] as any,
            tips: 42 + i * 10,
            echoes: 15 + i * 5,
            hasAudio: false
        }));

        const entries: LeaderboardEntry[] = Array.from({ length: 5 }).map((_, i) => ({
            rank: i + 1,
            signalId: `sig-${i}`,
            sector: `Sector ${['A', 'B', 'C'][i % 3]}`,
            value: 1000 - i * 50,
            trend: i === 0 ? 'up' : i === 4 ? 'down' : 'neutral'
        }));

        useRadioStore.setState({
            trendingSignals: mocks,
            leaderboard: { topTipped: entries, mostEchoed: entries }
        });
    };

    const handlePlay = (signal: Signal) => {
        setCurrentSignal(signal);
        setIsPlaying(true);
    };

    // Helper to convert color to mood
    const getMoodFromColor = (color: string): 'CALM' | 'EXCITED' | 'MYSTERIOUS' | 'URGENT' | 'VOID' => {
        switch (color) {
            case '#0EA5E9': return 'CALM';
            case '#F97316': return 'EXCITED';
            case '#A855F7': return 'MYSTERIOUS';
            case '#EF4444': return 'URGENT';
            default: return 'CALM';
        }
    };

    return (
        <div className="h-full w-full overflow-y-auto custom-scrollbar p-6 pb-20">
            <header className="mb-8">
                <h1 className="font-display font-bold text-4xl text-white mb-2 flex items-center gap-3">
                    <TrendingUp className="text-accent-cyan" /> EXPLORE
                </h1>
                <p className="font-mono text-xs text-ui-dim tracking-widest uppercase">DISCOVER HIGH FREQUENCY TRANSMISSIONS</p>
            </header>

            {/* Featured Carousel */}
            <section className="mb-12">
                <h2 className="font-display font-bold text-lg text-white mb-4 flex items-center gap-2">
                    <Star size={16} className="text-accent-orange" /> FEATURED SIGNALS
                </h2>
                <TrendingCarousel signals={trendingSignals} onPlay={handlePlay} />
            </section>

            {/* Leaderboards Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <LeaderboardCard
                    title="TOP TIPPED"
                    icon={Zap}
                    entries={leaderboard.topTipped}
                    color="orange"
                    metric="MNT"
                />
                <LeaderboardCard
                    title="MOST ECHOED"
                    icon={Share2}
                    entries={leaderboard.mostEchoed}
                    color="purple"
                    metric="Echoes"
                />
            </section>

            {/* Live Feed Banner */}
            <section className="bg-space-panel/50 border border-ui-border rounded-xl p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-pattern opacity-10" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-accent-phosphor/20 flex items-center justify-center border border-accent-phosphor/50 shadow-[0_0_15px_rgba(34,197,94,0.3)] animate-pulse">
                            <Activity className="text-accent-phosphor" />
                        </div>
                        <div>
                            <h3 className="font-display font-bold text-xl text-white">LIVE ACTIVITY</h3>
                            <p className="font-mono text-xs text-ui-dim">Network traffic is increasing in Sector 9F.</p>
                        </div>
                    </div>
                    <div className="flex -space-x-2">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full bg-gray-800 border-2 border-space-black" />
                        ))}
                        <div className="w-8 h-8 rounded-full bg-ui-dim text-space-black flex items-center justify-center font-bold text-xs ring-2 ring-space-black z-10">
                            +42
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

// --- Sub Components ---

const TrendingCarousel: React.FC<{ signals: Signal[], onPlay: (s: Signal) => void }> = ({ signals, onPlay }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Simple horizontal scroll for now, can be upgraded to 3D carousel
    return (
        <div ref={scrollRef} className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar snap-x">
            {signals.map((signal, i) => (
                <div
                    key={signal.id}
                    className="snap-center shrink-0 w-[300px] md:w-[400px] h-64 bg-space-black border border-ui-border rounded-2xl overflow-hidden relative group hover:border-accent-cyan transition-colors duration-300"
                >
                    {/* Background & Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-space-navy/50 to-black" />
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-accent-${getMoodColor(signal.mood)}/20 blur-[50px] rounded-full -mr-10 -mt-10 transition-opacity duration-300 group-hover:opacity-100 opacity-60`} />

                    <div className="p-6 relative z-10 h-full flex flex-col">
                        <div className="flex justify-between items-start mb-auto">
                            <span className="bg-white/10 backdrop-blur px-2 py-1 rounded text-[10px] font-mono font-bold text-white border border-white/10">
                                TRENDING #{i + 1}
                            </span>
                            <div className="flex gap-2">
                                {signal.tips > 50 && <Zap size={14} className="text-accent-orange" />}
                                {signal.echoes > 20 && <Share2 size={14} className="text-accent-purple" />}
                            </div>
                        </div>

                        <div className="mt-4">
                            <h3 className="font-display font-bold text-2xl text-white mb-1 group-hover:text-accent-cyan transition-colors">{signal.source}</h3>
                            <div className="flex items-center gap-2 font-mono text-[10px] text-ui-dim mb-4">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent-phosphor animate-pulse" />
                                LIVE NOW • {signal.listenerCount || 420} LISTENING
                            </div>

                            <button
                                onClick={() => onPlay(signal)}
                                className="w-full py-3 bg-white/5 border border-ui-border rounded-lg flex items-center justify-center gap-2 hover:bg-accent-cyan hover:text-black hover:border-transparent transition-all font-bold tracking-wider text-xs"
                            >
                                <Play size={12} fill="currentColor" /> TUNE IN
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const LeaderboardCard: React.FC<{
    title: string,
    icon: any,
    entries: LeaderboardEntry[],
    color: string,
    metric: string
}> = ({ title, icon: Icon, entries, color, metric }) => {
    return (
        <div className="bg-space-panel/30 border border-ui-border rounded-xl p-6 hover:bg-space-panel/50 transition-colors">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-bold text-white flex items-center gap-2">
                    <Icon size={18} className={`text-accent-${color}`} /> {title}
                </h3>
                <Trophy size={14} className="text-ui-dim" />
            </div>

            <div className="space-y-3">
                {entries.map((entry, i) => (
                    <div key={i} className="flex items-center gap-4 p-2 rounded hover:bg-white/5 transition-colors group cursor-pointer">
                        <div className={`font-mono font-bold text-lg w-6 text-center ${i < 3 ? `text-accent-${color}` : 'text-ui-dim'}`}>
                            {entry.rank}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-bold text-white text-sm truncate group-hover:text-accent-cyan transition-colors">
                                Signal {entry.signalId}
                            </div>
                            <div className="font-mono text-[10px] text-ui-dim">
                                {entry.sector}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-mono font-bold text-white text-sm">{entry.value}</div>
                            <div className="font-mono text-[9px] text-ui-dim">{metric}</div>
                        </div>
                    </div>
                ))}
            </div>

            <button className="w-full mt-6 py-2 border-t border-ui-border/50 text-xs font-mono text-ui-dim hover:text-white transition-colors">
                VIEW FULL RANKINGS
            </button>
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
