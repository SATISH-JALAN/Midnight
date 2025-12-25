import React, { useState, useMemo } from 'react';
import { X, Zap, Check, AlertTriangle } from 'lucide-react';
import { useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { parseEther } from 'viem';
import { TIPPING_POOL_ABI, getTippingPoolAddress } from '@/lib/contracts';
import { getChainConfig } from '@/lib/chains';

interface TipModalProps {
    onClose: () => void;
    tokenId?: number;
    broadcaster?: string;
}

export const TipModal: React.FC<TipModalProps> = ({ onClose, tokenId = 0, broadcaster }) => {
    const [tipAmount, setTipAmount] = useState<number | null>(null);
    const [customTip, setCustomTip] = useState('');
    const chainId = useChainId();
    const chainConfig = useMemo(() => getChainConfig(chainId), [chainId]);
    const tippingAddress = useMemo(() => getTippingPoolAddress(chainId), [chainId]);

    // Real blockchain transaction
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const handleConfirm = async () => {
        const amount = tipAmount || parseFloat(customTip);
        if (!amount || amount <= 0) return;

        if (!broadcaster) {
            console.error('[Tip] No broadcaster address provided');
            return;
        }

        try {
            // @ts-ignore - wagmi types are strict about chain/account which come from config
            writeContract({
                address: tippingAddress,
                abi: TIPPING_POOL_ABI,
                functionName: 'tip',
                args: [BigInt(tokenId), broadcaster as `0x${string}`],
                value: parseEther(amount.toString()),
            });
        } catch (err) {
            console.error('[Tip] Transaction failed:', err);
        }
    };

    // Auto close on success
    React.useEffect(() => {
        if (isSuccess) {
            const timer = setTimeout(() => {
                onClose();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isSuccess, onClose]);

    const isProcessing = isPending || isConfirming;

    return (
        <div className="w-full max-w-sm bg-space-navy border border-ui-border rounded-xl p-8 text-center relative overflow-hidden">
            {!isProcessing && !isSuccess && (
                <button onClick={onClose} className="absolute top-3 right-3 text-ui-dim hover:text-white p-2 md:p-1 min-w-[44px] min-h-[44px] flex items-center justify-center">
                    <X size={20} className="md:w-[18px] md:h-[18px]" />
                </button>
            )}

            <h2 className="font-display font-bold text-xl text-white mb-2 flex items-center justify-center gap-2">
                <Zap size={20} className="text-accent-orange fill-accent-orange" /> SEND TIP
            </h2>
            <p className="font-mono text-xs text-ui-dim mb-4">Support this broadcast ({chainConfig.nativeCurrency.symbol})</p>

            {error && (
                <div className="mb-4 p-2 bg-red-500/20 border border-red-500/50 rounded flex items-center gap-2 text-xs text-red-400">
                    <AlertTriangle size={14} />
                    <span className="truncate">{error.message.slice(0, 50)}...</span>
                </div>
            )}

            {!isProcessing && !isSuccess ? (
                <>
                    {/* Presets */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        {[0.01, 0.05, 0.1].map(amt => (
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
                            step="0.001"
                            min="0.001"
                            className="w-full bg-space-black border border-ui-border rounded p-3 text-center font-mono text-white placeholder-ui-dim focus:border-accent-orange outline-none transition-colors"
                        />
                        <span className="absolute right-3 top-3.5 text-ui-dim text-xs pointer-events-none">MNT</span>
                    </div>

                    <button
                        onClick={handleConfirm}
                        disabled={(!tipAmount && !customTip) || !broadcaster}
                        className="w-full py-3 bg-accent-orange text-black font-bold font-display tracking-wider rounded hover:bg-white transition-all shadow-glow hover:scale-[1.02] disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {broadcaster ? 'CONFIRM TRANSACTION' : 'NO BROADCASTER SET'}
                    </button>
                </>
            ) : isProcessing ? (
                <div className="py-8 flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-ui-border border-t-accent-orange rounded-full animate-spin mb-6" />
                    <h3 className="font-display font-bold text-white mb-2">
                        {isPending ? 'CONFIRM IN WALLET' : 'PROCESSING'}
                    </h3>
                    <p className="font-mono text-xs text-ui-dim animate-pulse">
                        {isPending ? 'Approve transaction in MetaMask...' : 'Waiting for block confirmation...'}
                    </p>
                </div>
            ) : (
                <div className="py-6 flex flex-col items-center">
                    <div className="w-16 h-16 bg-accent-phosphor/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
                        <Check size={32} className="text-accent-phosphor" />
                    </div>
                    <h3 className="font-display font-bold text-white mb-2 text-xl">SUCCESS</h3>
                    <p className="font-mono text-xs text-ui-dim">Tip sent! 60% to broadcaster, 40% to platform</p>
                    {hash && (
                        <a
                            href={`https://sepolia.mantlescan.xyz/tx/${hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 font-mono text-[10px] text-accent-cyan hover:underline"
                        >
                            View on Explorer →
                        </a>
                    )}
                </div>
            )}
        </div>
    );
};
