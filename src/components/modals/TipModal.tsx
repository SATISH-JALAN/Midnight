import React, { useState } from 'react';
import { X, Zap, Check } from 'lucide-react';

interface TipModalProps {
    onClose: () => void;
}

export const TipModal: React.FC<TipModalProps> = ({ onClose }) => {
    const [tipAmount, setTipAmount] = useState<number | null>(null);
    const [customTip, setCustomTip] = useState('');
    const [tipStatus, setTipStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS'>('IDLE');

    const handleConfirm = () => {
        if (!tipAmount && !customTip) return;
        setTipStatus('PROCESSING');
        // Mock API call
        setTimeout(() => {
            setTipStatus('SUCCESS');
            setTimeout(() => {
                onClose();
            }, 1500);
        }, 2000);
    };

    return (
        <div className="w-full max-w-sm bg-space-navy border border-ui-border rounded-xl p-8 text-center relative overflow-hidden">
            {tipStatus !== 'PROCESSING' && tipStatus !== 'SUCCESS' && (
                <button onClick={onClose} className="absolute top-3 right-3 text-ui-dim hover:text-white">
                    <X size={18} />
                </button>
            )}

            <h2 className="font-display font-bold text-xl text-white mb-2 flex items-center justify-center gap-2">
                <Zap size={20} className="text-accent-orange fill-accent-orange" /> SEND TIP
            </h2>
            <p className="font-mono text-xs text-ui-dim mb-6">Support this broadcast (MNT)</p>

            {tipStatus === 'IDLE' ? (
                <>
                    {/* Presets */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        {[0.5, 1, 5].map(amt => (
                            <button
                                key={amt}
                                onClick={() => { setTipAmount(amt); setCustomTip(''); }}
                                className={`
                                py-3 border rounded transition-all font-mono text-lg hover:scale-105
                                ${tipAmount === amt
                                        ? 'border-accent-orange text-accent-orange bg-accent-orange/10 shadow-glow'
                                        : 'border-ui-border text-white hover:border-accent-orange/50 hover:bg-white/5'
                                    }
                            `}
                            >
                                {amt}
                            </button>
                        ))}
                    </div>

                    {/* Custom Input */}
                    <div className="mb-6 relative">
                        <input
                            type="number"
                            placeholder="CUSTOM AMOUNT"
                            value={customTip}
                            onChange={(e) => { setCustomTip(e.target.value); setTipAmount(null); }}
                            className="w-full bg-space-black border border-ui-border rounded p-3 text-center font-mono text-white placeholder-ui-dim focus:border-accent-orange outline-none transition-colors"
                        />
                        <span className="absolute right-3 top-3.5 text-ui-dim text-xs pointer-events-none">MNT</span>
                    </div>

                    <button
                        onClick={handleConfirm}
                        disabled={!tipAmount && !customTip}
                        className="w-full py-3 bg-accent-orange text-black font-bold font-display tracking-wider rounded hover:bg-white transition-all shadow-glow hover:scale-[1.02] disabled:opacity-50 disabled:pointer-events-none"
                    >
                        CONFIRM TRANSACTION
                    </button>
                </>
            ) : tipStatus === 'PROCESSING' ? (
                <div className="py-8 flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-ui-border border-t-accent-orange rounded-full animate-spin mb-6" />
                    <h3 className="font-display font-bold text-white mb-2">PROCESSING</h3>
                    <p className="font-mono text-xs text-ui-dim animate-pulse">Verifying block confirmation...</p>
                </div>
            ) : (
                <div className="py-6 flex flex-col items-center">
                    <div className="w-16 h-16 bg-accent-phosphor/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
                        <Check size={32} className="text-accent-phosphor" />
                    </div>
                    <h3 className="font-display font-bold text-white mb-2 text-xl">SUCCESS</h3>
                    <p className="font-mono text-xs text-ui-dim">Transaction confirmed on Mantle Network</p>
                </div>
            )}
        </div>
    );
};
