import React from 'react';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { Wallet, Lock, Sparkles } from 'lucide-react';

interface WalletGateProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    message?: string;
}

/**
 * WalletGate - Shows connect wallet prompt if user is not connected
 * Otherwise renders children normally
 */
export const WalletGate: React.FC<WalletGateProps> = ({
    children,
    fallback,
    message = "Connect your wallet to access this feature"
}) => {
    const { isConnected } = useAccount();
    const { openConnectModal } = useConnectModal();

    if (isConnected) {
        return <>{children}</>;
    }

    // Custom fallback or default UI
    if (fallback) {
        return <>{fallback}</>;
    }

    // Default connect wallet UI
    return (
        <div className="flex-1 h-full flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Effect */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-purple/10 rounded-full blur-[120px]" />
            </div>

            {/* Content */}
            <div className="relative z-10 text-center px-8 max-w-md">
                {/* Icon */}
                <div className="relative inline-flex mb-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent-purple/20 to-accent-cyan/20 flex items-center justify-center border border-ui-border/50">
                        <Wallet size={40} className="text-accent-cyan" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent-orange/20 flex items-center justify-center border border-accent-orange/30">
                        <Lock size={14} className="text-accent-orange" />
                    </div>
                </div>

                {/* Title */}
                <h2 className="font-display text-2xl font-bold text-white mb-3">
                    Wallet Required
                </h2>

                {/* Message */}
                <p className="text-ui-dim text-sm mb-8 leading-relaxed">
                    {message}
                </p>

                {/* Connect Button */}
                <button
                    onClick={openConnectModal}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-accent-cyan to-accent-purple text-white font-bold font-display tracking-wider rounded-xl hover:from-accent-purple hover:to-accent-cyan transition-all shadow-lg shadow-purple-900/30 hover:scale-105"
                >
                    <Sparkles size={18} />
                    CONNECT WALLET
                </button>

                {/* Features Preview */}
                <div className="mt-10 pt-8 border-t border-ui-border/30">
                    <p className="text-[10px] font-mono text-ui-dim/60 uppercase tracking-wider mb-4">
                        Features Available After Connecting
                    </p>
                    <div className="flex justify-center gap-6 text-xs text-ui-dim">
                        <span>🎙️ Broadcast</span>
                        <span>📡 Listen</span>
                        <span>💎 Collect</span>
                        <span>💰 Tip</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * Hook to check if wallet is connected and prompt to connect
 */
export const useWalletGate = () => {
    const { isConnected, address } = useAccount();
    const { openConnectModal } = useConnectModal();

    const requireWallet = (callback: () => void) => {
        if (isConnected) {
            callback();
        } else {
            openConnectModal?.();
        }
    };

    return {
        isConnected,
        address,
        requireWallet,
        openConnectModal
    };
};
