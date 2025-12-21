import React, { useEffect, useRef } from 'react';
import { ModalType, MintingStatus, Signal } from '@/types';
import { gsap } from 'gsap';
import { WalletConnectModal } from '@/components/modals/WalletConnectModal';
import { TipModal } from '@/components/modals/TipModal';
import { EchoModal } from '@/components/modals/EchoModal';
import { NFTDetailModal } from '@/components/modals/NFTDetailModal';

interface ModalsProps {
   type: ModalType;
   onClose: () => void;
   onWalletConfirm: () => void;
   isRecording: boolean;
   recordingTime: number;
   audioUrl: string | null;
   onRecordStart: () => void;
   onRecordStop: () => void;
   onMint: () => void;
   mintingStatus: MintingStatus;
   currentSignal: Signal | null;
   modalProps?: any;
}

export const Modals: React.FC<ModalsProps> = ({
   type,
   onClose,
   onWalletConfirm,
   isRecording,
   recordingTime,
   audioUrl,
   onRecordStart,
   onRecordStop,
   onMint,
   mintingStatus,
   currentSignal,
   modalProps
}) => {
   const overlayRef = useRef<HTMLDivElement>(null);
   const contentRef = useRef<HTMLDivElement>(null);

   // Entrance Animation
   useEffect(() => {
      if (type === 'NONE') return;

      const ctx = gsap.context(() => {
         // Overlay Fade
         gsap.fromTo(overlayRef.current,
            { opacity: 0 },
            { opacity: 1, duration: 0.3 }
         );

         // Content Pop
         if (contentRef.current) {
            gsap.fromTo(contentRef.current,
               { scale: 0.95, opacity: 0, y: 10 },
               { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: "power2.out", delay: 0.05 }
            );
         }
      });

      return () => ctx.revert();
   }, [type]);

   if (type === 'NONE') return null;

   return (
      <div ref={overlayRef} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
         <div ref={contentRef} className="contents">
            {type === 'WALLET' && (
               <WalletConnectModal onClose={onClose} onConfirm={onWalletConfirm} />
            )}

            {type === 'TIP' && (
               <TipModal
                  onClose={onClose}
                  tokenId={modalProps?.tokenId}
                  broadcaster={modalProps?.broadcaster}
               />
            )}

            {type === 'ECHO' && (
               <EchoModal
                  onClose={onClose}
                  isRecording={isRecording}
                  recordingTime={recordingTime}
                  audioUrl={audioUrl}
                  onRecordStart={onRecordStart}
                  onRecordStop={onRecordStop}
                  onMint={onMint}
                  mintingStatus={mintingStatus}
                  currentSignal={currentSignal}
               />
            )}

            {type === 'NFT_DETAIL' && (
               <NFTDetailModal onClose={onClose} nft={modalProps?.nft} />
            )}

            {type === 'RECORD' && (
               <EchoModal
                  onClose={onClose}
                  isRecording={isRecording}
                  recordingTime={recordingTime}
                  audioUrl={audioUrl}
                  onRecordStart={onRecordStart}
                  onRecordStop={onRecordStop}
                  onMint={onMint}
                  mintingStatus={mintingStatus}
                  currentSignal={currentSignal}
               />
            )}
         </div>
      </div>
   );
};