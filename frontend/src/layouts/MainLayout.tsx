import React, { useState, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Header } from '@/components/business/Controls';
import { Footer } from '@/components/layout/Footer';
import { Modals } from '@/components/business/Modals';
import { ToastContainer } from '@/components/business/Toast';
import { ParticleField, ChannelSwitchOverlay } from '@/components/ui/Effects';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useRadioStore } from '@/store/useRadioStore';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useNFTMint } from '@/hooks/useNFTMint';
import { useWebSocket } from '@/services/useWebSocket';
import { uploadAudio } from '@/services/api';
import { useAccount } from 'wagmi';

export const MainLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [transitionTrigger, setTransitionTrigger] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const { openConnectModal } = useConnectModal();
    const recorder = useAudioRecorder();
    const { isConnected: wsConnected } = useWebSocket();
    const { address, isConnected: walletConnected, chain } = useAccount();
    const chainId = chain?.id;

    // NFT Minting hook
    const nftMint = useNFTMint(address);

    const {
        wallet,
        modal,
        toasts,
        mintingStatus,
        currentSignal,
        isRecording,
        recordingTime,
        listenerCount,
        command,
        triggerCommand,
        setWallet,
        setModal,
        setActiveView,
        removeToast,
        setMintingStatus,
        setIsRecording,
        setRecordingTime,
        addToast,
        activeView,
        modalProps
    } = useRadioStore();

    // Sync Recorder State with Store & Handle Commands
    React.useEffect(() => {
        setIsRecording(recorder.isRecording);
        setRecordingTime(recorder.recordingTime);

        // Max Duration Enforcement (30s)
        if (recorder.isRecording && recorder.recordingTime >= 30) {
            recorder.stopRecording();
            addToast("Max Duration Reached (30s)", "INFO");
        }

        // Remote Command Handling
        if (command === 'STOP_RECORDING' && recorder.isRecording) {
            recorder.stopRecording();
            triggerCommand('NONE');
        }
    }, [recorder.isRecording, recorder.recordingTime, setIsRecording, setRecordingTime, command, triggerCommand, recorder.stopRecording]);

    // Handle View Navigation side-effects
    React.useEffect(() => {
        if (activeView === 'LIVE') navigate('/');
        if (activeView === 'MY') navigate('/collection');
        if (activeView === 'BROADCAST') navigate('/broadcast');
        if (activeView === 'EXPLORE') navigate('/explore');
        if (activeView === 'SETTINGS') navigate('/settings');
    }, [activeView, navigate]);

    // Sync wallet connection state
    React.useEffect(() => {
        if (walletConnected && address) {
            setWallet({ isConnected: true, address, balance: '0' });
        }
    }, [walletConnected, address, setWallet]);

    const handleConnectWallet = () => {
        if (openConnectModal) {
            openConnectModal();
        } else {
            setModal('WALLET');
        }
    };

    const handleWalletConfirm = () => {
        if (modal === 'WALLET') {
            setWallet({ isConnected: true, address: '0x123...abc', balance: '10.5' });
            setModal('NONE');
            addToast('Uplink Established', 'SUCCESS');
        }
    };

    // Handle Upload and Mint with client-side transaction signing
    const handleMint = async () => {
        if (!recorder.audioBlob) {
            addToast('No recording to upload', 'ERROR');
            return;
        }

        // Check wallet connection
        if (!address || !walletConnected) {
            addToast('Please connect your wallet first', 'ERROR');
            if (openConnectModal) {
                openConnectModal();
            }
            return;
        }

        // Check if this is an echo (reply to a signal)
        const isEcho = modal === 'ECHO' && currentSignal?.id;

        try {
            // Step 1: Validate wallet is on a supported chain
            const supportedChains = [5003, 421614]; // Mantle Sepolia, Arbitrum Sepolia
            const chainNames: Record<number, string> = {
                5003: 'Mantle Sepolia',
                421614: 'Arbitrum Sepolia'
            };

            if (!chainId || !supportedChains.includes(chainId)) {
                const currentChainName = chainId ? `Chain ${chainId}` : 'Unknown chain';
                addToast(`Please switch to Mantle Sepolia or Arbitrum Sepolia. Currently on: ${currentChainName}`, 'ERROR');
                return;
            }


            addToast(`Broadcasting on ${chainNames[chainId]}...`, 'INFO');

            // Step 2: Upload audio to IPFS via backend
            setMintingStatus('IPFS_UPLOAD');


            let uploadResponse;
            if (isEcho && currentSignal?.id) {
                // Upload as echo reply
                const { uploadEcho } = await import('@/services/api');
                uploadResponse = await uploadEcho(currentSignal.id, recorder.audioBlob, address);
            } else {
                // Standard broadcast upload
                uploadResponse = await uploadAudio(recorder.audioBlob, address);
            }

            if (!uploadResponse.success) {
                throw new Error(uploadResponse.error || 'Upload failed');
            }

            // For echoes, the backend handles blockchain registration
            if (isEcho) {
                const echoData = uploadResponse.data;


                // Update the signal's echo count in the store
                const { signals, setSignals, currentSignal } = useRadioStore.getState();
                if (currentSignal) {
                    const updatedSignals = signals.map(s =>
                        s.id === currentSignal.id
                            ? { ...s, echoes: (s.echoes || 0) + 1 }
                            : s
                    );
                    setSignals(updatedSignals);
                }

                setMintingStatus('SUCCESS');
                addToast(`🔊 Echo sent to Signal #${currentSignal?.id?.substring(0, 6)}!`, 'SUCCESS');

                // Reset after success
                setTimeout(() => {
                    setMintingStatus('IDLE');
                    setModal('NONE');
                    recorder.resetRecording();
                }, 2000);
                return;
            }

            // Standard mint flow for non-echo broadcasts
            const { noteId, metadataUrl } = uploadResponse.data;


            // Step 3: Prompt user to sign transaction
            setMintingStatus('AWAITING_SIGNATURE');
            addToast('Please confirm transaction in MetaMask...', 'INFO');

            // Step 4: Mint NFT on-chain
            setMintingStatus('MINTING');
            const mintResult = await nftMint.mint(noteId, metadataUrl);

            if (!mintResult.success) {
                throw new Error(mintResult.error || 'Minting failed');
            }

            console.log('[Mint] NFT minted! TX:', mintResult.txHash);

            // Step 5: Confirm mint with backend to add to stream
            // This ensures the note only appears after on-chain confirmation
            try {
                const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';
                const confirmRes = await fetch(`${API_BASE}/api/mint/confirm`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        txHash: mintResult.txHash,
                        noteId,
                        audioUrl: uploadResponse.data.audioUrl,
                        metadataUrl,
                        broadcaster: address,
                        duration: uploadResponse.data.duration,
                        moodColor: uploadResponse.data.moodColor,
                        waveform: uploadResponse.data.waveform,
                        expiresAt: uploadResponse.data.expiresAt,
                        sector: uploadResponse.data.sector,
                        chainId: nftMint.chainId,
                    }),
                });
                const confirmData = await confirmRes.json();
                if (!confirmData.success) {
                    console.warn('[Mint] Confirm API failed:', confirmData.error);
                    // Don't fail the whole flow, NFT is already minted
                }

            } catch (confirmErr) {
                console.warn('[Mint] Failed to confirm with backend:', confirmErr);
                // NFT is already minted, stream add is non-critical
            }

            // Step 6: Success!
            setMintingStatus('SUCCESS');
            addToast(`Transmission broadcast! TX: ${mintResult.txHash.slice(0, 10)}...`, 'SUCCESS');

            // Reset after success
            setTimeout(() => {
                setMintingStatus('IDLE');
                setModal('NONE');
                recorder.resetRecording();
            }, 2000);

        } catch (err: any) {
            console.error('[Mint] Error:', err);
            addToast(err.message || 'Minting failed', 'ERROR');
            setMintingStatus('IDLE');
        }
    };

    // Memoize completion handler to prevent LoadingScreen re-renders/looping
    const handleLoadingComplete = useCallback(() => {
        setIsLoading(false);
    }, []);

    return (
        <div className="relative w-screen h-screen bg-space-black text-white font-sans overflow-hidden flex flex-col selection:bg-accent-cyan selection:text-black">
            {/* Loading Screen Overlay */}
            {isLoading && (
                <LoadingScreen onComplete={handleLoadingComplete} />
            )}

            {/* Ambient Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=2672&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-screen" />
                <ParticleField />
                <div className="absolute inset-0 z-0 bg-vignette pointer-events-none" />
            </div>

            <ChannelSwitchOverlay trigger={transitionTrigger} />

            {/* Main Container */}
            <div className="relative z-10 flex flex-col h-full max-w-[1600px] mx-auto w-full">
                <Header
                    listenerCount={listenerCount}
                />

                <main className="flex-1 flex flex-col md:flex-row min-h-0 relative">
                    <Outlet />
                </main>

                <Footer />
            </div>

            <Modals
                type={modal}
                onClose={() => setModal('NONE')}
                onWalletConfirm={handleWalletConfirm}
                isRecording={recorder.isRecording}
                recordingTime={recorder.recordingTime}
                audioUrl={recorder.audioUrl}
                onRecordStart={recorder.startRecording}
                onRecordStop={recorder.stopRecording}
                onMint={handleMint}
                mintingStatus={mintingStatus}
                currentSignal={currentSignal}
                modalProps={modalProps}
            />

            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </div>
    );
};
