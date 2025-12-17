import React, { useState } from 'react';
import { useRadioStore } from '@/store/useRadioStore';
import { User, Settings as SettingsIcon, Wallet, Bell, Shield, Save, LogOut } from 'lucide-react';
import { UserProfile } from '@/types';

type SettingsTab = 'PROFILE' | 'APP' | 'WALLET';

export const SettingsPage: React.FC = () => {
    const {
        userProfile,
        setUserProfile,
        prefs,
        setPrefs,
        wallet,
        addToast
    } = useRadioStore();

    const [activeTab, setActiveTab] = useState<SettingsTab>('PROFILE');

    // Local state for form
    const [formData, setFormData] = useState<Partial<UserProfile>>(userProfile || {
        address: wallet.address || '0x000...000',
        displayName: 'Anon User',
        bio: 'Listening to the void...',
        avatarUrl: '',
        joinedAt: new Date().toISOString()
    });

    const handleSaveProfile = () => {
        setUserProfile({
            ...userProfile,
            ...formData,
            address: wallet.address || '0x000...000',
            joinedAt: userProfile?.joinedAt || new Date().toISOString()
        } as UserProfile);
        addToast('Profile updated successfully', 'SUCCESS');
    };

    const handleSavePrefs = (key: keyof typeof prefs, val: any) => {
        setPrefs({ [key]: val });
    };

    return (
        <div className="flex h-full min-h-0 bg-space-black/50">
            {/* Sidebar */}
            <aside className="w-16 md:w-64 border-r border-ui-border flex flex-col bg-space-panel/30">
                <div className="p-4 md:p-6 border-b border-ui-border/50 hidden md:block">
                    <h2 className="font-display font-bold text-xl text-white tracking-wide">SETTINGS</h2>
                </div>

                <nav className="flex-1 p-2 md:p-4 space-y-2">
                    <TabButton
                        active={activeTab === 'PROFILE'}
                        onClick={() => setActiveTab('PROFILE')}
                        icon={User}
                        label="PROFILE"
                    />
                    <TabButton
                        active={activeTab === 'APP'}
                        onClick={() => setActiveTab('APP')}
                        icon={SettingsIcon}
                        label="PREFERENCES"
                    />
                    <TabButton
                        active={activeTab === 'WALLET'}
                        onClick={() => setActiveTab('WALLET')}
                        icon={Wallet}
                        label="WALLET"
                    />
                </nav>

                <div className="p-4 border-t border-ui-border/50">
                    <div className="md:flex items-center gap-3 hidden opacity-50">
                        <Shield size={16} />
                        <span className="text-[10px] font-mono text-ui-dim">V 1.0.4-ALPHA</span>
                    </div>
                </div>
            </aside>

            {/* Content Area */}
            <main className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10">
                <div className="max-w-2xl mx-auto">

                    {/* Profile Section */}
                    {activeTab === 'PROFILE' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-1">Public Profile</h3>
                                <p className="text-sm text-ui-dim">Manage how you appear to other signals.</p>
                            </div>

                            <div className="flex items-start gap-6">
                                <div className="w-24 h-24 rounded-full bg-space-navy border-2 border-dashed border-ui-border flex items-center justify-center shrink-0 overflow-hidden relative group cursor-pointer">
                                    {formData.avatarUrl ? (
                                        <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={32} className="text-ui-dim" />
                                    )}
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[10px] text-white font-bold">CHANGE</span>
                                    </div>
                                </div>
                                <div className="space-y-4 flex-1">
                                    <InputGroup
                                        label="DISPLAY NAME"
                                        value={formData.displayName || ''}
                                        onChange={v => setFormData({ ...formData, displayName: v })}
                                    />
                                    <InputGroup
                                        label="BIO"
                                        value={formData.bio || ''}
                                        onChange={v => setFormData({ ...formData, bio: v })}
                                        multiline
                                    />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-ui-border">
                                <button
                                    onClick={handleSaveProfile}
                                    className="px-6 py-2 bg-accent-cyan text-black font-bold rounded hover:bg-white transition-colors flex items-center gap-2"
                                >
                                    <Save size={16} /> SAVE CHANGES
                                </button>
                            </div>
                        </div>
                    )}

                    {/* App Settings */}
                    {activeTab === 'APP' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-1">Application</h3>
                                <p className="text-sm text-ui-dim">Customize your Midnight Radio experience.</p>
                            </div>

                            <div className="space-y-6">
                                <ToggleRow
                                    label="Notifications"
                                    desc="Receive alerts for echoes and tips."
                                    active={prefs.notifications}
                                    onToggle={() => handleSavePrefs('notifications', !prefs.notifications)}
                                    icon={Bell}
                                />
                                <ToggleRow
                                    label="Low Data Mode"
                                    desc="Reduce visual effects and audio quality."
                                    active={prefs.lowDataMode}
                                    onToggle={() => handleSavePrefs('lowDataMode', !prefs.lowDataMode)}
                                    icon={Shield}
                                />
                                <ToggleRow
                                    label="Auto-Play Next"
                                    desc="Automatically tune to the next signal."
                                    active={prefs.autoPlayNext}
                                    onToggle={() => handleSavePrefs('autoPlayNext', !prefs.autoPlayNext)}
                                    icon={User} // Reuse icon or add Play icon
                                />
                            </div>
                        </div>
                    )}

                    {/* Wallet Settings */}
                    {activeTab === 'WALLET' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-1">Wallet Connection</h3>
                                <p className="text-sm text-ui-dim">Manage your connected Mantle wallet.</p>
                            </div>

                            <div className="bg-space-panel/50 border border-ui-border rounded-xl p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="bg-accent-phosphor/20 p-3 rounded-full">
                                        <Wallet className="text-accent-phosphor" size={24} />
                                    </div>
                                    <div>
                                        <div className="text-sm text-ui-dim font-mono mb-1">STATUS</div>
                                        <div className="text-white font-bold flex items-center gap-2">
                                            {wallet.isConnected ? 'CONNECTED' : 'DISCONNECTED'}
                                            {wallet.isConnected && <span className="w-2 h-2 bg-accent-phosphor rounded-full animate-pulse" />}
                                        </div>
                                    </div>
                                </div>

                                {wallet.isConnected && (
                                    <div className="text-right">
                                        <div className="text-sm text-ui-dim font-mono mb-1">BALANCE</div>
                                        <div className="text-xl text-white font-display font-bold">{wallet.balance} MNT</div>
                                    </div>
                                )}
                            </div>

                            {wallet.isConnected && (
                                <div className="pt-4">
                                    <p className="font-mono text-xs text-ui-dim mb-2">CONNECTED ADDRESS</p>
                                    <div className="bg-black p-3 rounded border border-ui-border font-mono text-sm text-white break-all">
                                        {wallet.address}
                                    </div>
                                </div>
                            )}

                            <div className="pt-6">
                                <p className="text-xs text-ui-dim mb-4">
                                    To disconnect or switch wallets, please use your wallet provider interface.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

// --- Sub Components ---

const TabButton: React.FC<{ active: boolean, onClick: () => void, icon: any, label: string }> = ({ active, onClick, icon: Icon, label }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded transition-all duration-300 md:justify-start justify-center ${active ? 'bg-accent-cyan text-black shadow-glow' : 'text-ui-dim hover:text-white hover:bg-white/5'}`}
    >
        <Icon size={18} />
        <span className="font-mono text-xs font-bold tracking-wider hidden md:block">{label}</span>
    </button>
);

const InputGroup: React.FC<{ label: string, value: string, onChange: (v: string) => void, multiline?: boolean }> = ({ label, value, onChange, multiline }) => (
    <div className="space-y-1.5">
        <label className="font-mono text-[10px] text-ui-dim uppercase tracking-wider">{label}</label>
        {multiline ? (
            <textarea
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full bg-space-black border border-ui-border rounded p-3 text-sm text-white focus:border-accent-cyan outline-none transition-colors min-h-[100px]"
            />
        ) : (
            <input
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full bg-space-black border border-ui-border rounded p-3 text-sm text-white focus:border-accent-cyan outline-none transition-colors"
            />
        )}
    </div>
);

const ToggleRow: React.FC<{ label: string, desc: string, active: boolean, onToggle: () => void, icon?: any }> = ({ label, desc, active, onToggle, icon: Icon }) => (
    <div className="flex items-center justify-between p-4 bg-space-panel/30 border border-ui-border rounded-lg group hover:border-ui-dim transition-colors">
        <div className="flex items-center gap-4">
            {Icon && <Icon size={20} className="text-ui-dim group-hover:text-white transition-colors" />}
            <div>
                <div className="text-white font-bold text-sm">{label}</div>
                <div className="text-[10px] text-ui-dim font-mono">{desc}</div>
            </div>
        </div>
        <button
            onClick={onToggle}
            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${active ? 'bg-accent-cyan' : 'bg-ui-border'}`}
        >
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${active ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
    </div>
);
