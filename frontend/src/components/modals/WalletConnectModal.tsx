import React from 'react';
import { X, Wallet, ArrowRight } from 'lucide-react';

interface WalletConnectModalProps {
    onClose: () => void;
    onConfirm: () => void;
}

export const WalletConnectModal: React.FC<WalletConnectModalProps> = ({ onClose, onConfirm }) => {
    return (
        <div className="w-full max-w-sm bg-space-navy border border-ui-border rounded-xl shadow-2xl overflow-hidden relative">
            <button onClick={onClose} className="absolute top-3 right-3 text-ui-dim hover:text-white"><X size={18} /></button>

            <div className="p-8 text-center border-b border-ui-border">
                <div className="w-12 h-12 bg-accent-cyan/10 rounded-full flex items-center justify-center mx-auto mb-4 text-accent-cyan">
                    <Wallet size={24} />
                </div>
                <h2 className="font-display font-bold text-xl text-white mb-1">CONNECT</h2>
                <p className="font-mono text-xs text-ui-dim">Select provider to authenticate</p>
            </div>

            <div className="p-4 space-y-2">
                {['MetaMask', 'WalletConnect', 'Coinbase'].map((name) => (
                    <button
                        key={name}
                        onClick={onConfirm}
                        className="w-full flex items-center justify-between p-4 rounded bg-space-black border border-ui-border hover:border-accent-cyan/50 hover:bg-space-panel transition-all group"
                    >
                        <span className="font-mono text-sm text-ui-text group-hover:text-white">{name}</span>
                        <ArrowRight size={14} className="text-ui-dim group-hover:text-accent-cyan group-hover:translate-x-1 transition-all" />
                    </button>
                ))}
            </div>
        </div>
    );
};
