import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, Check, Share2, Wallet, ArrowRight, Play, Square, Loader, Radio, Zap } from 'lucide-react';
import { ModalType, Signal, MintingStatus } from '@/types';
import { gsap } from 'gsap';

interface ModalsProps {
   type: ModalType;
   onClose: () => void;
   onWalletConfirm: () => void;
   isRecording: boolean;
   recordingTime: number;
   onRecordStart: () => void;
   onRecordStop: () => void;
   onMint: () => void;
   mintingStatus: MintingStatus;
   currentSignal: Signal | null;
}

export const Modals: React.FC<ModalsProps> = ({
   type,
   onClose,
   onWalletConfirm,
   isRecording,
   recordingTime,
   onRecordStart,
   onRecordStop,
   onMint,
   mintingStatus,
   currentSignal
}) => {
   const [isReviewing, setIsReviewing] = useState(false);

   // Tip State
   const [tipAmount, setTipAmount] = useState<number | null>(null);
   const [customTip, setCustomTip] = useState('');
   const [tipStatus, setTipStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS'>('IDLE');

   const overlayRef = useRef<HTMLDivElement>(null);
   const contentRef = useRef<HTMLDivElement>(null);

   // Reset states
   useEffect(() => {
      if (type === 'NONE') {
         setIsReviewing(false);
         setTipStatus('IDLE');
         setTipAmount(null);
         setCustomTip('');
      }
   }, [type]);

   // Entrance Animation
   useEffect(() => {
      if (type === 'NONE') return;

      const ctx = gsap.context(() => {
         // Overlay Fade
         gsap.fromTo(overlayRef.current,
            { opacity: 0 },
            { opacity: 1, duration: 0.4 }
         );

         // Content Pop
         if (contentRef.current) {
            gsap.fromTo(contentRef.current,
               { scale: 0.9, opacity: 0, y: 20 },
               { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.5)", delay: 0.1 }
            );
         }
      });

      return () => ctx.revert();
   }, [type]);

   const handleTipConfirm = () => {
      if (!tipAmount && !customTip) return;
      setTipStatus('PROCESSING');
      setTimeout(() => {
         setTipStatus('SUCCESS');
         setTimeout(() => {
            onClose();
         }, 1500);
      }, 2000);
   };

   if (type === 'NONE') return null;

   const isMinting = mintingStatus !== 'IDLE';

   return (
      <div ref={overlayRef} className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
         {/* Wallet */}
         {type === 'WALLET' && (
            <div ref={contentRef} className="w-full max-w-sm bg-space-navy border border-ui-border rounded-xl shadow-2xl overflow-hidden relative">
               <button onClick={onClose} className="absolute top-3 right-3 text-ui-dim hover:text-white"><X size={18} /></button>

               <div className="p-8 text-center border-b border-ui-border">
                  <div className="w-12 h-12 bg-accent-cyan/10 rounded-full flex items-center justify-center mx-auto mb-4 text-accent-cyan">
                     <Wallet size={24} />
                  </div>
                  <h2 className="font-display font-bold text-xl text-white mb-1">CONNECT</h2>
                  <p className="font-mono text-xs text-ui-dim">Select provider to authenticate</p>
               </div>

               <div className="p-4 space-y-2">
                  {['MetaMask', 'WalletConnect', 'Coinbase'].map((name, i) => (
                     <button
                        key={name}
                        onClick={onWalletConfirm}
                        className="w-full flex items-center justify-between p-4 rounded bg-space-black border border-ui-border hover:border-accent-cyan/50 hover:bg-space-panel transition-all group"
                     >
                        <span className="font-mono text-sm text-ui-text group-hover:text-white">{name}</span>
                        <ArrowRight size={14} className="text-ui-dim group-hover:text-accent-cyan group-hover:translate-x-1 transition-all" />
                     </button>
                  ))}
               </div>
            </div>
         )}

         {/* Recording / Echo Interface */}
         {(type === 'RECORD' || type === 'ECHO') && (
            <div ref={contentRef} className="w-full max-w-xl bg-space-navy border border-ui-border rounded-2xl shadow-2xl overflow-hidden flex flex-col items-center p-8 md:p-12 relative transition-all">

               {!isMinting && <button onClick={onClose} className="absolute top-4 right-4 text-ui-dim hover:text-white"><X size={18} /></button>}

               {/* Header */}
               <div className="font-mono text-[10px] text-accent-red uppercase tracking-widest mb-8 border border-accent-red/20 px-3 py-1 rounded bg-accent-red/5 flex items-center gap-2">
                  <Radio size={12} className={isRecording ? 'animate-pulse' : ''} />
                  {type === 'ECHO' ? `REPLYING TO SIGNAL #${currentSignal?.id}` : 'LIVE BROADCAST UPLINK'}
               </div>

               {/* MINTING PROGRESS STATE */}
               {isMinting ? (
                  <div className="w-full flex flex-col items-center py-8">
                     <div className="relative w-32 h-32 flex items-center justify-center mb-8">
                        <div className="absolute inset-0 border-4 border-ui-border rounded-full" />
                        <div className="absolute inset-0 border-4 border-t-accent-phosphor border-r-accent-phosphor border-b-transparent border-l-transparent rounded-full animate-spin" />
                        <div className="font-mono text-2xl font-bold text-accent-phosphor animate-pulse">
                           {mintingStatus === 'SUCCESS' ? '100%' : '...'}
                        </div>
                     </div>

                     <div className="space-y-4 w-full max-w-xs">
                        <StepStatus status={mintingStatus} step="COMPRESSING" label="Compressing Audio Stream" />
                        <StepStatus status={mintingStatus} step="IPFS_UPLOAD" label="Uploading to Decentralized Storage" />
                        <StepStatus status={mintingStatus} step="AWAITING_SIGNATURE" label="Awaiting Wallet Signature" />
                        <StepStatus status={mintingStatus} step="MINTING" label="Minting Signal NFT on Mantle" />
                     </div>

                     {mintingStatus === 'SUCCESS' && (
                        <div className="mt-8 text-accent-phosphor font-display font-bold text-lg animate-bounce">
                           TRANSMISSION COMPLETE
                        </div>
                     )}
                  </div>
               ) : (
                  /* RECORDING / REVIEW STATE */
                  <>
                     {/* Visualization Circle */}
                     <div className={`relative w-48 h-48 rounded-full border-2 flex items-center justify-center mb-8 transition-all ${isRecording ? 'border-accent-red shadow-[0_0_30px_rgba(255,42,42,0.3)]' : 'border-ui-border border-dashed'}`}>

                        {/* Recording Ping */}
                        {isRecording && <div className="absolute inset-0 bg-accent-red/10 rounded-full animate-ping" />}

                        {/* Review Playback Spinner */}
                        {!isRecording && recordingTime > 0 && isReviewing && (
                           <div className="absolute inset-0 rounded-full border-2 border-accent-phosphor animate-spin-slow opacity-50 border-dashed" />
                        )}

                        <div className="text-center relative z-10">
                           {/* Timer */}
                           {isRecording ? (
                              <>
                                 <div className="font-mono text-4xl font-bold text-white tabular-nums animate-pulse">00:{recordingTime.toString().padStart(2, '0')}</div>
                                 <div className="font-mono text-[9px] text-accent-red mt-2 uppercase tracking-widest">RECORDING...</div>
                              </>
                           ) : recordingTime > 0 ? (
                              /* Review Controls */
                              <button
                                 onClick={() => setIsReviewing(!isReviewing)}
                                 className="group flex flex-col items-center gap-2"
                              >
                                 <div className="w-16 h-16 rounded-full bg-white/10 group-hover:bg-accent-phosphor group-hover:text-black flex items-center justify-center transition-all duration-300">
                                    {isReviewing ? <Square size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                                 </div>
                                 <div className="font-mono text-[10px] text-ui-dim group-hover:text-white uppercase tracking-wider">
                                    {isReviewing ? 'STOP REVIEW' : 'PREVIEW'}
                                 </div>
                              </button>
                           ) : (
                              /* Initial State */
                              <div className="flex flex-col items-center text-ui-dim">
                                 <Mic size={32} className="mb-2" />
                                 <span className="font-mono text-[9px] uppercase">Ready</span>
                              </div>
                           )}
                        </div>
                     </div>

                     {/* Action Buttons */}
                     <div className="flex gap-4 w-full justify-center">
                        {/* 1. Start Recording */}
                        {!isRecording && recordingTime === 0 && (
                           <button onClick={onRecordStart} className="h-12 px-8 bg-accent-red text-white font-bold font-display tracking-wider rounded hover:bg-red-600 transition-colors shadow-lg shadow-red-900/20 flex items-center gap-2 hover:scale-105 transform duration-200">
                              <div className="w-2 h-2 rounded-full bg-white animate-pulse" /> REC
                           </button>
                        )}

                        {/* 2. Stop Recording */}
                        {isRecording && (
                           <button onClick={onRecordStop} className="h-12 px-8 border-2 border-accent-red text-accent-red font-bold font-display tracking-wider rounded hover:bg-accent-red/10 transition-colors">
                              STOP RECORDING
                           </button>
                        )}

                        {/* 3. Broadcast / Discard */}
                        {recordingTime > 0 && !isRecording && (
                           <div className="flex flex-col gap-3 w-full max-w-xs">
                              <button
                                 onClick={onMint}
                                 className="h-14 w-full bg-accent-phosphor text-black font-bold font-display tracking-wider rounded flex items-center justify-center gap-2 hover:bg-green-400 transition-all shadow-[0_0_20px_rgba(0,255,65,0.4)] hover:scale-105"
                              >
                                 <Radio size={18} className="animate-pulse" />
                                 {type === 'ECHO' ? 'TRANSMIT ECHO' : 'BROADCAST SIGNAL'}
                              </button>

                              <button onClick={() => { onRecordStart(); setIsReviewing(false); }} className="h-10 w-full text-xs font-mono text-ui-dim hover:text-white underline decoration-dotted">
                                 RE-RECORD
                              </button>
                           </div>
                        )}
                     </div>

                     {/* Footer Info */}
                     {!isRecording && recordingTime === 0 && (
                        <div className="mt-8 text-center">
                           <p className="font-mono text-[10px] text-ui-dim">MAX DURATION: 90 SECONDS</p>
                           <p className="font-mono text-[10px] text-ui-dim mt-1">STORED PERMANENTLY ON MANTLE</p>
                        </div>
                     )}
                  </>
               )}
            </div>
         )}

         {/* Tip Modal */}
         {type === 'TIP' && (
            <div ref={contentRef} className="w-full max-w-sm bg-space-navy border border-ui-border rounded-xl p-8 text-center relative overflow-hidden">
               {tipStatus !== 'PROCESSING' && tipStatus !== 'SUCCESS' && <button onClick={onClose} className="absolute top-3 right-3 text-ui-dim hover:text-white"><X size={18} /></button>}

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
                        onClick={handleTipConfirm}
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
         )}
      </div>
   );
};

// Helper for Minting Steps
const StepStatus: React.FC<{ status: MintingStatus, step: string, label: string }> = ({ status, step, label }) => {
   const steps = ['IDLE', 'COMPRESSING', 'IPFS_UPLOAD', 'AWAITING_SIGNATURE', 'MINTING', 'SUCCESS'];
   const currentIndex = steps.indexOf(status);
   const stepIndex = steps.indexOf(step);

   const isComplete = currentIndex > stepIndex || status === 'SUCCESS';
   const isActive = status === step;

   return (
      <div className={`flex items-center gap-3 font-mono text-xs transition-all duration-300 ${isActive ? 'text-white scale-105' : isComplete ? 'text-accent-phosphor' : 'text-ui-dim'}`}>
         <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${isActive ? 'border-white animate-pulse' : isComplete ? 'border-accent-phosphor bg-accent-phosphor/20' : 'border-ui-dim'}`}>
            {isComplete && <Check size={10} />}
         </div>
         <span>{label}</span>
      </div>
   );
};