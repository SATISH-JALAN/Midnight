import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Header } from '@/components/business/Controls';
import { Footer } from '@/components/layout/Footer';
import { Modals } from '@/components/business/Modals';
import { ToastContainer } from '@/components/business/Toast';
import { ParticleField, ChannelSwitchOverlay } from '@/components/ui/Effects';
import { useRadioStore } from '@/store/useRadioStore';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useNFTMint } from '@/hooks/useNFTMint';
import { useWebSocket } from '@/services/useWebSocket';
import { uploadAudio } from '@/services/api';
import { useAccount, useSwitchChain } from 'wagmi';
import { MANTLE_SEPOLIA_CHAIN_ID } from '@/lib/contracts';

export const MainLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [transitionTrigger, setTransitionTrigger] = useState(0);
    const { openConnectModal } = useConnectModal();
    const recorder = useAudioRecorder();
    const { isConnected: wsConnected } = useWebSocket();
    const { address, isConnected: walletConnected, chainId } = useAccount();
    const { switchChainAsync } = useSwitchChain();

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

        try {
            // Step 1: Check and switch to Mantle Sepolia if needed
            if (chainId !== MANTLE_SEPOLIA_CHAIN_ID) {
                setMintingStatus('COMPRESSING'); // Use as "switching network" state
                addToast('Switching to Mantle Sepolia...', 'INFO');
                try {
                    await switchChainAsync({ chainId: MANTLE_SEPOLIA_CHAIN_ID });
                } catch (switchErr: any) {
                    throw new Error('Please switch to Mantle Sepolia network');
                }
            }

            // Step 2: Upload audio to IPFS via backend
            setMintingStatus('IPFS_UPLOAD');
            console.log('[Mint] Uploading to IPFS...');

            const uploadResponse = await uploadAudio(recorder.audioBlob, address);
            if (!uploadResponse.success) {
                throw new Error(uploadResponse.error || 'Upload failed');
            }

            const { noteId, metadataUrl } = uploadResponse.data;
            console.log('[Mint] IPFS upload complete:', { noteId, metadataUrl });

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

            // Step 5: Success!
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

    return (
        <div className="relative w-screen h-screen bg-space-black text-ui-text font-sans overflow-hidden flex flex-col selection:bg-accent-phosphor selection:text-black">
            <ChannelSwitchOverlay trigger={transitionTrigger} />

            {/* Background Layers */}
            <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=2672&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-screen" />
            <ParticleField />
            <div className="absolute inset-0 z-0 bg-vignette pointer-events-none" />

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
