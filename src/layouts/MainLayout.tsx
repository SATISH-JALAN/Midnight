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

export const MainLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [transitionTrigger, setTransitionTrigger] = useState(0);
    const { openConnectModal } = useConnectModal();
    const recorder = useAudioRecorder();

    const {
        wallet,
        modal,
        toasts,
        mintingStatus,
        currentSignal,
        isRecording,
        recordingTime,
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

    // Sync Recorder State with Store
    React.useEffect(() => {
        setIsRecording(recorder.isRecording);
        setRecordingTime(recorder.recordingTime);
    }, [recorder.isRecording, recorder.recordingTime, setIsRecording, setRecordingTime]);

    // Handle View Navigation side-effects
    React.useEffect(() => {
        if (activeView === 'LIVE') navigate('/');
        if (activeView === 'MY') navigate('/collection');
        if (activeView === 'BROADCAST') navigate('/broadcast');
        if (activeView === 'EXPLORE') navigate('/explore');
        if (activeView === 'SETTINGS') navigate('/settings');
    }, [activeView, navigate]);

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
                    listenerCount={42}
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
                onRecordStart={recorder.startRecording}
                onRecordStop={recorder.stopRecording}
                onMint={() => { }}
                mintingStatus={mintingStatus}
                currentSignal={currentSignal}
                modalProps={modalProps}
            />

            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </div>
    );
};
