/**
 * ChainSwitcher Component
 * 
 * Dropdown to switch between supported blockchain networks.
 * Shows current chain with indicator, allows switching via wallet.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useChainId, useSwitchChain, useAccount } from 'wagmi';
import { CHAIN_CONFIGS, SUPPORTED_TESTNET_IDS, getChainConfig } from '@/lib/chains';
import { ChevronDown, Check, Loader2 } from 'lucide-react';
import { gsap } from 'gsap';

export const ChainSwitcher: React.FC = () => {
    const chainId = useChainId();
    const { isConnected } = useAccount();
    const { switchChain, isPending } = useSwitchChain();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentChain = getChainConfig(chainId);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Animate dropdown
    useEffect(() => {
        if (dropdownRef.current) {
            const dropdown = dropdownRef.current.querySelector('.chain-dropdown');
            if (dropdown) {
                gsap.to(dropdown, {
                    opacity: isOpen ? 1 : 0,
                    y: isOpen ? 0 : -10,
                    duration: 0.2,
                    ease: 'power2.out',
                    display: isOpen ? 'block' : 'none',
                });
            }
        }
    }, [isOpen]);

    const handleSwitch = async (newChainId: number) => {
        if (newChainId === chainId) {
            setIsOpen(false);
            return;
        }

        try {
            await switchChain({ chainId: newChainId });
            setIsOpen(false);
        } catch (error) {
            console.error('Failed to switch chain:', error);
        }
    };

    // Don't render if not connected
    if (!isConnected) return null;

    return (
        <div ref={dropdownRef} className="relative z-50">
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isPending}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-ui-border bg-space-panel/50 hover:bg-white/5 hover:border-ui-border/80 transition-all duration-200 backdrop-blur-sm group"
            >
                {/* Chain Color Indicator */}
                <div
                    className="w-2 h-2 rounded-full shadow-[0_0_6px_currentColor]"
                    style={{ backgroundColor: currentChain.color, boxShadow: `0 0 8px ${currentChain.color}` }}
                />

                {/* Chain Name */}
                <span className="font-mono text-[11px] text-white/90 tracking-wide">
                    {isPending ? 'Switching...' : currentChain.shortName}
                </span>

                {/* Loading or Chevron */}
                {isPending ? (
                    <Loader2 size={12} className="text-ui-dim animate-spin" />
                ) : (
                    <ChevronDown
                        size={12}
                        className={`text-ui-dim transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                )}
            </button>

            {/* Dropdown Menu */}
            <div
                className="chain-dropdown absolute top-full mt-2 right-0 w-56 bg-space-navy/95 border border-ui-border rounded-lg shadow-2xl backdrop-blur-xl overflow-hidden"
                style={{ display: 'none', opacity: 0 }}
            >
                {/* Header */}
                <div className="px-3 py-2 border-b border-ui-border/50">
                    <span className="text-[10px] font-mono text-ui-dim uppercase tracking-widest">
                        Select Network
                    </span>
                </div>

                {/* Chain Options */}
                <div className="py-1">
                    {SUPPORTED_TESTNET_IDS.map((id) => {
                        const chain = CHAIN_CONFIGS[id];
                        const isActive = id === chainId;

                        return (
                            <button
                                key={id}
                                onClick={() => handleSwitch(id)}
                                disabled={isPending}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors ${isActive ? 'bg-white/5' : ''
                                    } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {/* Chain Color */}
                                <div
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{
                                        backgroundColor: chain.color,
                                        boxShadow: isActive ? `0 0 10px ${chain.color}` : 'none'
                                    }}
                                />

                                {/* Chain Info */}
                                <div className="flex-1 text-left">
                                    <div className="text-sm text-white font-medium">{chain.name}</div>
                                    <div className="text-[10px] text-ui-dim mt-0.5">
                                        Gas: {chain.nativeCurrency.symbol} • {chain.isTestnet ? 'Testnet' : 'Mainnet'}
                                    </div>
                                </div>

                                {/* Active Check */}
                                {isActive && (
                                    <Check size={14} className="text-accent-phosphor flex-shrink-0" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Footer Hint */}
                <div className="px-3 py-2 border-t border-ui-border/50 bg-black/20">
                    <span className="text-[9px] font-mono text-ui-dim">
                        Data is separate per network
                    </span>
                </div>
            </div>
        </div>
    );
};
