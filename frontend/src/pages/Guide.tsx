import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { BookOpen, Radio, Mic, Wallet, DollarSign, Share2, Volume2, Zap, Signal } from 'lucide-react';

export const GuidePage: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const sectionsRef = useRef<HTMLDivElement>(null);

    // Entrance Animations
    useEffect(() => {
        if (!containerRef.current) return;

        const ctx = gsap.context(() => {
            // Header animation
            if (headerRef.current) {
                gsap.fromTo(headerRef.current.children,
                    { y: -30, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: "power3.out" }
                );
            }

            // Sections staggered entrance
            if (sectionsRef.current) {
                gsap.fromTo(".guide-section",
                    { y: 50, opacity: 0, scale: 0.95 },
                    {
                        y: 0,
                        opacity: 1,
                        scale: 1,
                        duration: 0.7,
                        stagger: 0.12,
                        ease: "power2.out",
                        delay: 0.4
                    }
                );
            }

            // Network cards animation
            gsap.fromTo(".network-card",
                { x: -20, opacity: 0 },
                {
                    x: 0,
                    opacity: 1,
                    duration: 0.5,
                    stagger: 0.1,
                    ease: "back.out(1.2)",
                    delay: 1.2
                }
            );

            // Floating glow effect on header badge
            gsap.to(".header-badge", {
                boxShadow: "0 0 30px rgba(6, 182, 212, 0.4)",
                duration: 2,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });

        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className="w-full h-full overflow-y-auto custom-scrollbar">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-20 left-10 w-96 h-96 bg-accent-cyan/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-40 right-20 w-80 h-80 bg-accent-purple/5 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 p-6 md:p-10 pb-32">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <header ref={headerRef} className="mb-16 text-center">
                        <div className="header-badge inline-flex items-center gap-3 mb-6 px-5 py-2.5 bg-gradient-to-r from-accent-cyan/20 to-accent-purple/20 border border-accent-cyan/40 rounded-full backdrop-blur-sm">
                            <Signal size={18} className="text-accent-cyan animate-pulse" />
                            <span className="font-mono text-xs text-accent-cyan uppercase tracking-[0.3em]">User Guide</span>
                        </div>
                        <h1 className="font-display font-bold text-4xl md:text-6xl text-white mb-6 tracking-tight leading-tight">
                            <span className="bg-gradient-to-r from-white via-accent-cyan to-white bg-clip-text text-transparent bg-[length:200%_100%] animate-shimmer">
                                How to Use Midnight Radio
                            </span>
                        </h1>
                        <p className="font-mono text-sm md:text-base text-ui-dim max-w-2xl mx-auto leading-relaxed">
                            A decentralized voice note broadcasting platform where your messages become NFTs on the blockchain.
                        </p>
                        <div className="flex justify-center gap-4 mt-8">
                            <div className="flex items-center gap-2 text-xs font-mono text-ui-dim">
                                <div className="w-2 h-2 rounded-full bg-accent-phosphor animate-pulse" />
                                <span>Decentralized</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-mono text-ui-dim">
                                <div className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse" />
                                <span>On-Chain</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-mono text-ui-dim">
                                <div className="w-2 h-2 rounded-full bg-accent-purple animate-pulse" />
                                <span>Ephemeral</span>
                            </div>
                        </div>
                    </header>

                    {/* Sections */}
                    <div ref={sectionsRef} className="space-y-8">

                        {/* Getting Started */}
                        <GuideSection
                            icon={<Wallet size={22} />}
                            title="Getting Started"
                            color="cyan"
                            index={1}
                        >
                            <StepList steps={[
                                "Connect your wallet using the button in the top-right corner",
                                "Ensure you have some ETH or MNT for gas fees on your chosen network",
                                "Switch between Arbitrum Sepolia and Mantle networks using the chain selector",
                                "Your connected wallet address will be displayed once connected"
                            ]} />
                        </GuideSection>

                        {/* Live Stream */}
                        <GuideSection
                            icon={<Radio size={22} />}
                            title="Live Stream"
                            color="phosphor"
                            index={2}
                        >
                            <p className="text-ui-dim font-mono text-sm mb-5 leading-relaxed border-l-2 border-accent-phosphor/30 pl-4">
                                The main hub where you can listen to broadcasts from other users around the world.
                            </p>
                            <StepList steps={[
                                "Browse the signal queue on the left to see available broadcasts",
                                "Click on any signal to load it into the player",
                                "Use the play button to start listening to the audio",
                                "Use the frequency dial to skip between signals",
                                "View stats and leaderboard on the right panel (tap the stats icon on mobile)"
                            ]} />
                        </GuideSection>

                        {/* Transmit / Broadcast */}
                        <GuideSection
                            icon={<Mic size={22} />}
                            title="Transmit Your Voice"
                            color="red"
                            index={3}
                        >
                            <p className="text-ui-dim font-mono text-sm mb-5 leading-relaxed border-l-2 border-accent-red/30 pl-4">
                                Record your voice and broadcast it to the network as an NFT.
                            </p>
                            <StepList steps={[
                                "Navigate to the Transmit tab using the bottom navigation",
                                "Click the microphone button to start recording",
                                "Speak your message (recordings can be up to 60 seconds)",
                                "Stop the recording when finished",
                                "Preview your recording before minting",
                                "Confirm the transaction in your wallet to mint your voice note as an NFT",
                                "Your broadcast will appear in the Live Stream once confirmed on-chain"
                            ]} />
                        </GuideSection>

                        {/* Tipping */}
                        <GuideSection
                            icon={<DollarSign size={22} />}
                            title="Tipping Broadcasters"
                            color="orange"
                            index={4}
                        >
                            <p className="text-ui-dim font-mono text-sm mb-5 leading-relaxed border-l-2 border-accent-orange/30 pl-4">
                                Support your favorite broadcasters by sending them tips.
                            </p>
                            <StepList steps={[
                                "While listening to a broadcast, click the TIP button",
                                "Select a preset amount or enter a custom tip",
                                "Confirm the transaction in your wallet",
                                "60% goes directly to the broadcaster, 40% to the platform"
                            ]} />
                        </GuideSection>

                        {/* Echo / Reply */}
                        <GuideSection
                            icon={<Share2 size={22} />}
                            title="Echo Replies"
                            color="purple"
                            index={5}
                        >
                            <p className="text-ui-dim font-mono text-sm mb-5 leading-relaxed border-l-2 border-accent-purple/30 pl-4">
                                Respond to broadcasts with your own voice note, creating threaded conversations.
                            </p>
                            <StepList steps={[
                                "While listening to a broadcast, click the ECHO button",
                                "Record your reply message",
                                "Preview and confirm to mint your echo as an NFT",
                                "Your echo will be linked to the original broadcast"
                            ]} />
                        </GuideSection>

                        {/* Collection */}
                        <GuideSection
                            icon={<Volume2 size={22} />}
                            title="Your Collection"
                            color="cyan"
                            index={6}
                        >
                            <p className="text-ui-dim font-mono text-sm mb-5 leading-relaxed border-l-2 border-accent-cyan/30 pl-4">
                                View and manage all the voice note NFTs you have created.
                            </p>
                            <StepList steps={[
                                "Navigate to the Collection tab to see your minted voice notes",
                                "Click on any NFT to view details and playback",
                                "View transaction history and tips received",
                                "Access the blockchain explorer for verification"
                            ]} />
                        </GuideSection>

                        {/* Network Info */}
                        <div className="guide-section bg-gradient-to-br from-space-panel/80 to-space-black/80 border border-ui-border/50 rounded-2xl p-8 mt-16 backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-lg bg-accent-cyan/20 flex items-center justify-center border border-accent-cyan/30">
                                    <Zap size={20} className="text-accent-cyan" />
                                </div>
                                <h3 className="font-display font-bold text-xl text-white">Supported Networks</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <NetworkCard
                                    name="Arbitrum Sepolia"
                                    type="Testnet"
                                    chainId="421614"
                                />
                                <NetworkCard
                                    name="Mantle Sepolia"
                                    type="Testnet"
                                    chainId="5003"
                                />
                            </div>
                            <p className="font-mono text-xs text-ui-dim mt-6 text-center">
                                Get testnet tokens from faucets to start broadcasting.
                            </p>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Sub Components ---

interface GuideSectionProps {
    icon: React.ReactNode;
    title: string;
    color: 'cyan' | 'phosphor' | 'red' | 'orange' | 'purple';
    children: React.ReactNode;
    index: number;
}

const GuideSection: React.FC<GuideSectionProps> = ({ icon, title, color, children, index }) => {
    const sectionRef = useRef<HTMLElement>(null);

    const colorConfig = {
        cyan: {
            border: 'border-accent-cyan/30',
            bg: 'from-accent-cyan/10 to-transparent',
            glow: 'shadow-accent-cyan/20',
            text: 'text-accent-cyan',
            iconBg: 'bg-accent-cyan/20',
        },
        phosphor: {
            border: 'border-accent-phosphor/30',
            bg: 'from-accent-phosphor/10 to-transparent',
            glow: 'shadow-accent-phosphor/20',
            text: 'text-accent-phosphor',
            iconBg: 'bg-accent-phosphor/20',
        },
        red: {
            border: 'border-accent-red/30',
            bg: 'from-accent-red/10 to-transparent',
            glow: 'shadow-accent-red/20',
            text: 'text-accent-red',
            iconBg: 'bg-accent-red/20',
        },
        orange: {
            border: 'border-accent-orange/30',
            bg: 'from-accent-orange/10 to-transparent',
            glow: 'shadow-accent-orange/20',
            text: 'text-accent-orange',
            iconBg: 'bg-accent-orange/20',
        },
        purple: {
            border: 'border-accent-purple/30',
            bg: 'from-accent-purple/10 to-transparent',
            glow: 'shadow-accent-purple/20',
            text: 'text-accent-purple',
            iconBg: 'bg-accent-purple/20',
        },
    };

    const cfg = colorConfig[color];

    const handleHover = (enter: boolean) => {
        if (!sectionRef.current) return;
        gsap.to(sectionRef.current, {
            scale: enter ? 1.01 : 1,
            y: enter ? -4 : 0,
            boxShadow: enter ? `0 20px 40px -20px var(--tw-shadow-color)` : 'none',
            duration: 0.3,
            ease: "power2.out"
        });
    };

    return (
        <section
            ref={sectionRef}
            className={`guide-section relative border ${cfg.border} rounded-2xl p-6 md:p-8 bg-gradient-to-br ${cfg.bg} backdrop-blur-sm hover:${cfg.border.replace('/30', '/50')} transition-colors cursor-default`}
            style={{ '--tw-shadow-color': `var(--color-${color === 'phosphor' ? 'accent-phosphor' : `accent-${color}`})` } as React.CSSProperties}
            onMouseEnter={() => handleHover(true)}
            onMouseLeave={() => handleHover(false)}
        >
            {/* Section Number */}
            <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-space-black border border-ui-border flex items-center justify-center font-mono text-xs text-ui-dim">
                {String(index).padStart(2, '0')}
            </div>

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <div className={`w-12 h-12 rounded-xl ${cfg.iconBg} flex items-center justify-center border ${cfg.border} ${cfg.text}`}>
                    {icon}
                </div>
                <h2 className="font-display font-bold text-2xl text-white tracking-tight">{title}</h2>
            </div>

            {children}
        </section>
    );
};

const StepList: React.FC<{ steps: string[] }> = ({ steps }) => {
    return (
        <ol className="space-y-4">
            {steps.map((step, index) => (
                <li key={index} className="step-item flex items-start gap-4 group">
                    <span className="shrink-0 w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs font-mono text-accent-cyan group-hover:bg-accent-cyan/20 group-hover:border-accent-cyan/30 transition-colors">
                        {index + 1}
                    </span>
                    <span className="font-mono text-sm text-ui-text leading-relaxed pt-0.5 group-hover:text-white transition-colors">{step}</span>
                </li>
            ))}
        </ol>
    );
};

const NetworkCard: React.FC<{ name: string; type: string; chainId: string }> = ({ name, type, chainId }) => {
    const cardRef = useRef<HTMLDivElement>(null);

    const handleHover = (enter: boolean) => {
        if (!cardRef.current) return;
        gsap.to(cardRef.current, {
            scale: enter ? 1.02 : 1,
            y: enter ? -2 : 0,
            duration: 0.2,
            ease: "power2.out"
        });
    };

    return (
        <div
            ref={cardRef}
            className="network-card bg-space-black/70 border border-ui-border/50 rounded-xl p-5 hover:border-accent-cyan/40 transition-colors cursor-default"
            onMouseEnter={() => handleHover(true)}
            onMouseLeave={() => handleHover(false)}
        >
            <div className="flex items-center justify-between mb-3">
                <span className="font-display font-bold text-white">{name}</span>
                <span className="font-mono text-[10px] text-accent-cyan bg-accent-cyan/20 px-2.5 py-1 rounded-full border border-accent-cyan/30">{type}</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent-phosphor animate-pulse" />
                <span className="font-mono text-xs text-ui-dim">Chain ID: {chainId}</span>
            </div>
        </div>
    );
};
