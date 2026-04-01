'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertModal, ConfirmModal } from '@/components/ui/Modal';
import { useWizard } from '@/context/WizardContext';
import { UltraModeToggle } from '@/components/ultra/UltraModeToggle';
import { isUltraUnlocked, lockUltra } from '@/lib/ultraLock';
import {
  getApiKeys,
  setApiKey,
  testReplicateKey,
  testOpenRouterKey,
  getSelectedModel,
  setSelectedModel,
  DEFAULT_LLM_MODEL,
} from '@/lib/apiKeyStore';

const OPENROUTER_MODELS = [
  // ── Paid: Best for Director AI (creative, structured output, long context) ──
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', free: false, tag: 'Best Overall' },
  { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', free: false, tag: 'Best Creative' },
  { id: 'minimax/minimax-m2.7', name: 'MiniMax M2.7', free: false, tag: 'Agentic' },
  { id: 'minimax/minimax-m2.5', name: 'MiniMax M2.5', free: false, tag: 'Productive' },
  { id: 'minimax/minimax-m2-her', name: 'MiniMax M2-Her', free: false, tag: 'Character AI' },
  { id: 'mistralai/mistral-small-creative', name: 'Mistral Small Creative', free: false, tag: 'Storytelling' },
  { id: 'reka/reka-edge', name: 'Reka Edge', free: false, tag: 'Vision' },
  // ── Free: Great for testing & low-budget shoots ──
  { id: 'minimax/minimax-m2.5:free', name: 'MiniMax M2.5 Free', free: true, tag: 'Free' },
  { id: 'meta-llama/llama-4-maverick:free', name: 'Llama 4 Maverick', free: true, tag: 'Free' },
  { id: 'deepseek/deepseek-chat-v3-0324:free', name: 'DeepSeek V3', free: true, tag: 'Free' },
  { id: 'qwen/qwen3-235b-a22b:free', name: 'Qwen3 235B', free: true, tag: 'Free' },
  { id: 'google/gemma-3-27b-it:free', name: 'Gemma 3 27B', free: true, tag: 'Free' },
];

type KeyStatus = 'idle' | 'testing' | 'connected' | 'invalid';

export default function SettingsPage() {
  useEffect(() => {
    document.title = 'Settings — DIRECTOR';
  }, []);

  const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'usage' | 'notifications' | 'api-keys' | 'team-access' | 'ultra-mode' | 'danger-zone'>('billing');
  const [ultraUnlocked, setUltraUnlocked] = useState(false);

  // Sync ultra unlock status on mount
  useEffect(() => {
    setUltraUnlocked(isUltraUnlocked());
  }, [activeTab]);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    avatar: '',
  });

  // Notifications state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: true,
  });

  // Usage state
  const [usageData] = useState({
    creditsUsed: 0,
    creditsTotal: 0,
    apiCalls: 0,
    storageUsed: 0,
    storageTotal: 0,
  });

  // API Key provider state
  const [replicateKey, setReplicateKey] = useState('');
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [replicateStatus, setReplicateStatus] = useState<KeyStatus>('idle');
  const [openrouterStatus, setOpenrouterStatus] = useState<KeyStatus>('idle');
  const [showReplicateKey, setShowReplicateKey] = useState(false);
  const [showOpenrouterKey, setShowOpenrouterKey] = useState(false);
  const [selectedORModel, setSelectedORModel] = useState(OPENROUTER_MODELS[0].id);

  // Load stored keys on mount
  useEffect(() => {
    const stored = getApiKeys();
    if (stored.replicate) { setReplicateKey(stored.replicate); setReplicateStatus('connected'); }
    if (stored.openrouter) { setOpenrouterKey(stored.openrouter); setOpenrouterStatus('connected'); }
    setSelectedORModel(getSelectedModel());
  }, []);

  const handleSaveKey = useCallback(async (
    provider: 'replicate' | 'openrouter',
    key: string,
    setStatus: (s: KeyStatus) => void,
  ) => {
    if (!key.trim()) {
      setStatus('idle');
      return;
    }
    setStatus('testing');
    const ok = provider === 'replicate'
      ? await testReplicateKey(key)
      : await testOpenRouterKey(key);

    if (ok) {
      setApiKey(provider, key);
      setStatus('connected');
      setAlertMsg({ open: true, title: 'API Key', message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} key saved and verified!` });
    } else {
      setStatus('invalid');
      setAlertMsg({ open: true, title: 'API Key', message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} key is invalid. Please check and try again.` });
    }
  }, []);

  const handleTestKey = useCallback(async (
    provider: 'replicate' | 'openrouter',
    key: string,
    setStatus: (s: KeyStatus) => void,
  ) => {
    if (!key.trim()) return;
    setStatus('testing');
    const ok = provider === 'replicate'
      ? await testReplicateKey(key)
      : await testOpenRouterKey(key);
    setStatus(ok ? 'connected' : 'invalid');
  }, []);

  // Team members state
  const [teamMembers] = useState<{ id: string; name: string; email: string; role: string }[]>([]);

  // Alert modal state
  const [alertMsg, setAlertMsg] = useState({ open: false, title: '', message: '' });

  // Hard reset
  const { hardReset, state: wizardState, update: updateWizard } = useWizard();
  const router = useRouter();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  const handleHardReset = useCallback(() => {
    hardReset();
    setResetComplete(true);
    setTimeout(() => router.push('/dashboard'), 1500);
  }, [hardReset, router]);

  const handleLockUltra = useCallback(() => {
    lockUltra();
    updateWizard({ ultraModeEnabled: false });
    setUltraUnlocked(false);
  }, [updateWizard]);

  return (
    <div className="max-w-6xl mx-auto px-8 py-12">
      <div className="flex flex-col md:flex-row gap-12">
        {/* Internal Tab Navigation */}
        <aside className="w-full md:w-48 flex-shrink-0">
          <nav className="space-y-6">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-4 font-bold">
                Workspace
              </p>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => setActiveTab('profile')}
                    aria-selected={activeTab === 'profile'}
                    className={`flex items-center gap-2 py-2 text-sm font-medium transition-colors w-full text-left focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-l-lg ${
                      activeTab === 'profile'
                        ? 'text-primary border-r-2 border-primary font-bold'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Profile
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('billing')}
                    className={`flex items-center gap-2 py-2 text-sm font-medium transition-colors w-full text-left focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-l-lg ${
                      activeTab === 'billing'
                        ? 'text-primary border-r-2 border-primary font-bold'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Billing
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('usage')}
                    className={`flex items-center gap-2 py-2 text-sm font-medium transition-colors w-full text-left focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-l-lg ${
                      activeTab === 'usage'
                        ? 'text-primary border-r-2 border-primary font-bold'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Usage
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className={`flex items-center gap-2 py-2 text-sm font-medium transition-colors w-full text-left focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-l-lg ${
                      activeTab === 'notifications'
                        ? 'text-primary border-r-2 border-primary font-bold'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Notifications
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-4 font-bold">
                Security
              </p>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => setActiveTab('api-keys')}
                    className={`flex items-center gap-2 py-2 text-sm font-medium transition-colors w-full text-left focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-l-lg ${
                      activeTab === 'api-keys'
                        ? 'text-primary border-r-2 border-primary font-bold'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    API Keys
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('team-access')}
                    className={`flex items-center gap-2 py-2 text-sm font-medium transition-colors w-full text-left focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-l-lg ${
                      activeTab === 'team-access'
                        ? 'text-primary border-r-2 border-primary font-bold'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Team Access
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('ultra-mode')}
                    className={`flex items-center gap-2 py-2 text-sm font-medium transition-colors w-full text-left focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-l-lg ${
                      activeTab === 'ultra-mode'
                        ? 'text-primary border-r-2 border-primary font-bold'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Ultra Mode
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-red-400/70 mb-4 font-bold">
                Danger Zone
              </p>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => setActiveTab('danger-zone')}
                    className={`flex items-center gap-2 py-2 text-sm font-medium transition-colors w-full text-left focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-l-lg ${
                      activeTab === 'danger-zone'
                        ? 'text-red-400 border-r-2 border-red-400 font-bold'
                        : 'text-on-surface-variant hover:text-red-400'
                    }`}
                  >
                    Reset Data
                  </button>
                </li>
              </ul>
            </div>
          </nav>
        </aside>

        {/* Content Area */}
        <div className="flex-1 space-y-10">
          {/* Profile Tab Content */}
          {activeTab === 'profile' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold font-headline mb-6">Profile Settings</h2>
              </div>

              {/* Avatar Section */}
              <div className="space-y-4">
                <label className="text-sm font-bold text-on-surface">Profile Avatar</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-on-surface text-2xl font-bold">
                    {profileForm.name.charAt(0) || '?'}
                  </div>
                  <button className="px-4 py-2 bg-surface-container-highest rounded-lg text-sm font-bold hover:bg-surface-bright transition-colors">
                    Upload Avatar
                  </button>
                </div>
              </div>

              {/* Name Input */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface">Full Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                  className="w-full px-4 py-3 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/30 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                />
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface">Email Address</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                  className="w-full px-4 py-3 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/30 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                />
              </div>

              <button
                onClick={() => setAlertMsg({ open: true, title: 'Profile', message: 'Profile updated successfully!' })}
                className="px-6 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-bold hover:bg-primary-container transition-colors"
              >
                Save Changes
              </button>
            </div>
          )}

          {/* Billing Tab Content */}
          {activeTab === 'billing' && (
            <div className="space-y-10">
              {/* Bento Grid for Billing Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Current Tier Card */}
                <div className="lg:col-span-2 glass-panel rounded-xl p-8 border border-outline-variant/15 flex flex-col justify-between min-h-[240px]">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <span className="px-3 py-1 bg-primary-container/20 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">
                        Active Plan
                      </span>
                      <span className="text-on-surface-variant text-sm font-medium font-body">
                        Next billing: Dec 12, 2024
                      </span>
                    </div>
                    <h3 className="text-4xl font-black font-headline text-on-surface mb-2">
                      Cinematic Pro
                    </h3>
                    <p className="text-on-surface-variant text-sm max-w-md">
                      Unrestricted access to 4K neural rendering, unlimited character presets, and
                      priority GPU queuing.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 mt-8">
                    <button
                      onClick={() => setAlertMsg({ open: true, title: 'Subscription', message: 'Opening subscription management...' })}
                      className="bg-surface-container-highest text-on-surface px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-surface-bright transition-colors"
                    >
                      Manage Subscription
                    </button>
                    <button
                      onClick={() => setAlertMsg({ open: true, title: 'Change Plan', message: 'Feature coming soon' })}
                      className="text-primary-dim text-sm font-bold hover:underline"
                    >
                      Change Plan
                    </button>
                  </div>
                </div>

                {/* Usage Card */}
                <div className="bg-surface-container-low rounded-xl p-8 border border-outline-variant/15 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="material-symbols-outlined text-tertiary">bolt</span>
                      <h4 className="text-sm font-bold uppercase tracking-wide text-on-surface">
                        Scene Blocks
                      </h4>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-3xl font-black font-headline">{usageData.creditsUsed}</span>
                      <span className="text-on-surface-variant text-xs">/ {usageData.creditsTotal.toLocaleString()}</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-primary" style={{ width: usageData.creditsTotal > 0 ? `${(usageData.creditsUsed / usageData.creditsTotal) * 100}%` : '0%' }} />
                    </div>
                    <p className="text-[10px] text-on-surface-variant font-medium">
                      {usageData.creditsTotal > 0 ? Math.round((usageData.creditsUsed / usageData.creditsTotal) * 100) : 0}% of monthly quota used
                    </p>
                  </div>
                  <button
                    onClick={() => setAlertMsg({ open: true, title: 'Credits', message: 'Adding credits...' })}
                    className="w-full mt-6 py-2 text-xs font-black uppercase tracking-widest border border-outline-variant/30 rounded-lg hover:bg-white hover:text-black transition-all"
                  >
                    Add Credits
                  </button>
                </div>
              </div>

              {/* Payment Methods Section */}
              <section className="space-y-6">
                <div className="flex justify-between items-end">
                  <div>
                    <h3 className="text-xl font-bold font-headline mb-1">Payment Method</h3>
                    <p className="text-sm text-on-surface-variant">
                      Manage your cards and integration preferences.
                    </p>
                  </div>
                  <button
                    onClick={() => setAlertMsg({ open: true, title: 'Payment Method', message: 'Add payment method functionality coming soon' })}
                    className="flex items-center gap-2 text-primary-dim text-sm font-bold group"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Add New Method
                  </button>
                </div>
                <div className="space-y-3">
                  {/* Card Item */}
                  <div className="bg-surface-container-low p-5 rounded-xl border border-outline-variant/10 flex items-center justify-between group hover:border-outline-variant/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-8 bg-surface-container-highest rounded flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-surface-variant">
                          credit_card
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface tracking-wide">
                          &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; 4242
                        </p>
                        <p className="text-xs text-on-surface-variant">Expires 12/26 — Visa</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant bg-surface-container-highest px-2 py-1 rounded">
                        Primary
                      </span>
                      <span
                        onClick={() => setAlertMsg({ open: true, title: 'Payment Method', message: 'Payment method deleted' })}
                        className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-error"
                      >
                        delete
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Transaction History */}
              <section className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold font-headline">Billing History</h3>
                  <button
                    onClick={() => setAlertMsg({ open: true, title: 'Export', message: 'Exporting billing history...' })}
                    className="text-xs font-medium text-on-surface-variant flex items-center gap-1 hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    Export CSV
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-outline-variant/15">
                      <tr>
                        <th className="py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                          Invoice ID
                        </th>
                        <th className="py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                          Date
                        </th>
                        <th className="py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                          Status
                        </th>
                        <th className="py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                          Amount
                        </th>
                        <th className="py-4 text-right" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/5">
                      <tr className="group hover:bg-surface-container-low transition-colors">
                        <td className="py-5 text-sm font-medium text-on-surface">#DIR-2024-0812</td>
                        <td className="py-5 text-sm text-on-surface-variant">Nov 12, 2024</td>
                        <td className="py-5">
                          <span className="px-2 py-0.5 bg-primary-container/10 text-primary text-[10px] font-bold rounded-full">
                            Paid
                          </span>
                        </td>
                        <td className="py-5 text-sm font-bold text-on-surface">$49.00</td>
                        <td className="py-5 text-right">
                          <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-on-surface">
                            visibility
                          </span>
                        </td>
                      </tr>
                      <tr className="group hover:bg-surface-container-low transition-colors">
                        <td className="py-5 text-sm font-medium text-on-surface">#DIR-2024-0712</td>
                        <td className="py-5 text-sm text-on-surface-variant">Oct 12, 2024</td>
                        <td className="py-5">
                          <span className="px-2 py-0.5 bg-primary-container/10 text-primary text-[10px] font-bold rounded-full">
                            Paid
                          </span>
                        </td>
                        <td className="py-5 text-sm font-bold text-on-surface">$49.00</td>
                        <td className="py-5 text-right">
                          <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-on-surface">
                            visibility
                          </span>
                        </td>
                      </tr>
                      <tr className="group hover:bg-surface-container-low transition-colors">
                        <td className="py-5 text-sm font-medium text-on-surface">#DIR-2024-0612</td>
                        <td className="py-5 text-sm text-on-surface-variant">Sep 12, 2024</td>
                        <td className="py-5">
                          <span className="px-2 py-0.5 bg-primary-container/10 text-primary text-[10px] font-bold rounded-full">
                            Paid
                          </span>
                        </td>
                        <td className="py-5 text-sm font-bold text-on-surface">$49.00</td>
                        <td className="py-5 text-right">
                          <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-on-surface">download</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* Usage Tab Content */}
          {activeTab === 'usage' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold font-headline mb-6">Usage & Credits</h2>
              </div>

              {/* Credits Usage */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">Credits Used</h3>
                  <span className="text-2xl font-black">{usageData.creditsUsed} / {usageData.creditsTotal}</span>
                </div>
                <div className="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: usageData.creditsTotal > 0 ? `${(usageData.creditsUsed / usageData.creditsTotal) * 100}%` : '0%' }} />
                </div>
                <p className="text-sm text-on-surface-variant">{usageData.creditsTotal > 0 ? Math.round((usageData.creditsUsed / usageData.creditsTotal) * 100) : 0}% of monthly quota used</p>
              </div>

              {/* API Calls */}
              <div className="space-y-4 pt-6 border-t border-outline-variant/30">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">API Calls</h3>
                  <span className="text-2xl font-black">{usageData.apiCalls.toLocaleString()}</span>
                </div>
                <p className="text-sm text-on-surface-variant">API requests made this month</p>
              </div>

              {/* Storage Usage */}
              <div className="space-y-4 pt-6 border-t border-outline-variant/30">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">Storage Used</h3>
                  <span className="text-2xl font-black">{usageData.storageUsed} / {usageData.storageTotal} GB</span>
                </div>
                <div className="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-tertiary" style={{ width: usageData.storageTotal > 0 ? `${(usageData.storageUsed / usageData.storageTotal) * 100}%` : '0%' }} />
                </div>
                <p className="text-sm text-on-surface-variant">{usageData.storageTotal > 0 ? Math.round((usageData.storageUsed / usageData.storageTotal) * 100) : 0}% of storage capacity used</p>
              </div>
            </div>
          )}

          {/* Notifications Tab Content */}
          {activeTab === 'notifications' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold font-headline mb-6">Notification Preferences</h2>
              </div>

              {/* Email Notifications */}
              <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg border border-outline-variant/30">
                <div>
                  <h3 className="text-sm font-bold">Email Notifications</h3>
                  <p className="text-xs text-on-surface-variant mt-1">Receive alerts about project updates and activity</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.emailNotifications}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      emailNotifications: e.target.checked,
                    })
                  }
                  className="w-6 h-6 cursor-pointer"
                />
              </div>

              {/* Push Notifications */}
              <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg border border-outline-variant/30">
                <div>
                  <h3 className="text-sm font-bold">Push Notifications</h3>
                  <p className="text-xs text-on-surface-variant mt-1">Receive browser push notifications</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.pushNotifications}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      pushNotifications: e.target.checked,
                    })
                  }
                  className="w-6 h-6 cursor-pointer"
                />
              </div>

              {/* Marketing Emails */}
              <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg border border-outline-variant/30">
                <div>
                  <h3 className="text-sm font-bold">Marketing Emails</h3>
                  <p className="text-xs text-on-surface-variant mt-1">Receive updates about new features and promotions</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.marketingEmails}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      marketingEmails: e.target.checked,
                    })
                  }
                  className="w-6 h-6 cursor-pointer"
                />
              </div>

              <button
                onClick={() => setAlertMsg({ open: true, title: 'Notifications', message: 'Notification preferences saved!' })}
                className="px-6 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-bold hover:bg-primary-container transition-colors mt-6"
              >
                Save Preferences
              </button>
            </div>
          )}

          {/* API Keys Tab Content */}
          {activeTab === 'api-keys' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold font-headline mb-2">API Keys</h2>
                <p className="text-sm text-on-surface-variant">
                  Configure your API keys for AI providers. Keys are stored locally in your browser.
                </p>
              </div>

              {/* Replicate Card */}
              <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/15 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-blue-400">image</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-on-surface">Replicate</h3>
                      <p className="text-xs text-on-surface-variant">Powers: Image Gen, Video Gen, LoRA Training</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    replicateStatus === 'connected'
                      ? 'bg-green-500/10 text-green-400'
                      : replicateStatus === 'invalid'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-surface-container-highest text-on-surface-variant'
                  }`}>
                    {replicateStatus === 'connected' ? 'Connected' : replicateStatus === 'invalid' ? 'Invalid' : 'Not configured'}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showReplicateKey ? 'text' : 'password'}
                    value={replicateKey}
                    onChange={(e) => { setReplicateKey(e.target.value); setReplicateStatus('idle'); }}
                    placeholder="r8_..."
                    className="w-full px-4 py-3 pr-12 bg-surface-container-highest text-on-surface rounded-lg border border-outline-variant/30 focus:border-primary focus:outline-none transition-colors font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowReplicateKey(!showReplicateKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showReplicateKey ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleTestKey('replicate', replicateKey, setReplicateStatus)}
                    disabled={!replicateKey.trim() || replicateStatus === 'testing'}
                    className="px-4 py-2 bg-surface-container-highest rounded-lg text-xs font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-bright transition-colors disabled:opacity-30"
                  >
                    {replicateStatus === 'testing' ? (
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                        Testing...
                      </span>
                    ) : 'Test Connection'}
                  </button>
                  <button
                    onClick={() => handleSaveKey('replicate', replicateKey, setReplicateStatus)}
                    disabled={!replicateKey.trim() || replicateStatus === 'testing'}
                    className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-primary-container transition-colors disabled:opacity-30"
                  >
                    Save Key
                  </button>
                </div>
              </div>

              {/* OpenRouter Card */}
              <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/15 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-purple-400">route</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-on-surface">OpenRouter</h3>
                      <p className="text-xs text-on-surface-variant">Powers: Director AI Chat, Persona Generation (multi-model)</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    openrouterStatus === 'connected'
                      ? 'bg-green-500/10 text-green-400'
                      : openrouterStatus === 'invalid'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-surface-container-highest text-on-surface-variant'
                  }`}>
                    {openrouterStatus === 'connected' ? 'Connected' : openrouterStatus === 'invalid' ? 'Invalid' : 'Not configured'}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showOpenrouterKey ? 'text' : 'password'}
                    value={openrouterKey}
                    onChange={(e) => { setOpenrouterKey(e.target.value); setOpenrouterStatus('idle'); }}
                    placeholder="sk-or-..."
                    className="w-full px-4 py-3 pr-12 bg-surface-container-highest text-on-surface rounded-lg border border-outline-variant/30 focus:border-primary focus:outline-none transition-colors font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenrouterKey(!showOpenrouterKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showOpenrouterKey ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>

                {/* Model Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Model</label>
                  <select
                    value={selectedORModel}
                    onChange={(e) => { setSelectedORModel(e.target.value); setSelectedModel(e.target.value); }}
                    className="w-full px-4 py-3 bg-surface-container-highest text-on-surface rounded-lg border border-outline-variant/30 focus:border-primary focus:outline-none transition-colors text-sm appearance-none cursor-pointer"
                  >
                    {OPENROUTER_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}{m.tag ? ` [${m.tag}]` : ''}{m.free ? ' (Free)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleTestKey('openrouter', openrouterKey, setOpenrouterStatus)}
                    disabled={!openrouterKey.trim() || openrouterStatus === 'testing'}
                    className="px-4 py-2 bg-surface-container-highest rounded-lg text-xs font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-bright transition-colors disabled:opacity-30"
                  >
                    {openrouterStatus === 'testing' ? (
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                        Testing...
                      </span>
                    ) : 'Test Connection'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedModel(selectedORModel);
                      handleSaveKey('openrouter', openrouterKey, setOpenrouterStatus);
                    }}
                    disabled={!openrouterKey.trim() || openrouterStatus === 'testing'}
                    className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-primary-container transition-colors disabled:opacity-30"
                  >
                    Save Key
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Team Access Tab Content */}
          {activeTab === 'team-access' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold font-headline">Team Members</h2>
                <button
                  onClick={() => setAlertMsg({ open: true, title: 'Invite', message: 'Invite dialog opening...' })}
                  className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-bold hover:bg-primary-container transition-colors"
                >
                  Invite Member
                </button>
              </div>

              <div className="space-y-4">
                {teamMembers.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4">group_off</span>
                    <p className="text-on-surface-variant">No team members yet. Invite someone to collaborate.</p>
                  </div>
                )}
                {teamMembers.map((member) => (
                  <div key={member.id} className="bg-surface-container-low p-5 rounded-lg border border-outline-variant/30 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-surface font-bold text-sm">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-on-surface">{member.name}</p>
                        <p className="text-xs text-on-surface-variant">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="px-3 py-1 bg-surface-container-highest rounded text-xs font-bold text-on-surface-variant">
                        {member.role}
                      </span>
                      <button
                        onClick={() => setAlertMsg({ open: true, title: 'Team', message: 'Removing team member...' })}
                        className="text-error hover:text-error-dark transition-colors"
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ultra Mode Tab Content */}
          {activeTab === 'ultra-mode' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold font-headline mb-2">Ultra Mode</h2>
                <p className="text-sm text-on-surface-variant">
                  Film-grade consistency pipeline with ControlNet, identity lock, and progressive refinement.
                </p>
              </div>

              {/* Toggle */}
              <div className="space-y-4">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
                  Enable / Disable
                </label>
                <UltraModeToggle />
              </div>

              {/* Status */}
              <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/15 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      ultraUnlocked ? 'bg-green-500/10' : 'bg-surface-container-highest'
                    }`}>
                      <span className={`material-symbols-outlined ${
                        ultraUnlocked ? 'text-green-400' : 'text-on-surface-variant'
                      }`}>
                        {ultraUnlocked ? 'lock_open' : 'lock'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-on-surface">Session Status</h3>
                      <p className="text-xs text-on-surface-variant">
                        {ultraUnlocked ? 'Unlocked for this session' : 'Locked — password required to enable'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    ultraUnlocked
                      ? 'bg-green-500/10 text-green-400'
                      : 'bg-surface-container-highest text-on-surface-variant'
                  }`}>
                    {ultraUnlocked ? 'Unlocked (session)' : 'Locked'}
                  </span>
                </div>

                {/* Lock button */}
                {ultraUnlocked && (
                  <button
                    onClick={handleLockUltra}
                    className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-highest rounded-lg text-xs font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-bright transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">lock</span>
                    Lock Ultra Mode
                  </button>
                )}
              </div>

              {/* Info */}
              <div className="bg-primary/5 border border-primary/15 rounded-xl p-6 space-y-3">
                <h4 className="text-sm font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">info</span>
                  What is Ultra Mode?
                </h4>
                <ul className="text-xs text-on-surface-variant space-y-2 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-primary/60 mt-0.5">check</span>
                    ControlNet-based structural consistency across all scenes
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-primary/60 mt-0.5">check</span>
                    PuLID identity lock for character face preservation
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-primary/60 mt-0.5">check</span>
                    Multi-stage quality gate (CLIP + ArcFace + DreamSim)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-primary/60 mt-0.5">check</span>
                    Progressive refinement for image upscaling
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-primary/60 mt-0.5">check</span>
                    VACE video generation with structure-aware conditioning
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-primary/60 mt-0.5">check</span>
                    3D Scene Composer for precise camera and depth control
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Danger Zone Tab Content */}
          {activeTab === 'danger-zone' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold font-headline mb-2 text-red-400">Danger Zone</h2>
                <p className="text-sm text-on-surface-variant">
                  Irreversible actions that will permanently delete your project data.
                </p>
              </div>

              {resetComplete ? (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-8 flex flex-col items-center gap-4">
                  <span className="material-symbols-outlined text-5xl text-green-400">check_circle</span>
                  <p className="text-lg font-bold text-green-400">All data cleared successfully</p>
                  <p className="text-sm text-on-surface-variant">Redirecting to dashboard...</p>
                </div>
              ) : (
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-8 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-red-400 text-2xl">delete_forever</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-on-surface text-lg mb-1">Reset All Project Data</h3>
                      <p className="text-sm text-on-surface-variant leading-relaxed">
                        This will permanently delete all projects, scenes, generated images, video results,
                        production assets, training data, and wizard state from your browser.
                        Your API keys will be preserved.
                      </p>
                    </div>
                  </div>

                  <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-4">
                    <p className="text-xs text-red-400/80 font-medium">
                      This action cannot be undone. All locally stored project data will be permanently removed.
                      Remote images hosted on Replicate will remain accessible via their URLs but will no longer
                      be linked to any project.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="px-6 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm font-bold hover:bg-red-500/20 transition-colors"
                  >
                    Delete All Data & Start Fresh
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hard Reset Confirmation Modal */}
      <ConfirmModal
        open={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleHardReset}
        title="Delete All Project Data?"
        message="This will permanently wipe all projects, scenes, images, videos, assets, and wizard state. Your API keys will be kept. This cannot be undone."
        confirmLabel="Yes, Delete Everything"
        danger
      />

      <AlertModal
        open={alertMsg.open}
        onClose={() => setAlertMsg({ ...alertMsg, open: false })}
        title={alertMsg.title}
        message={alertMsg.message}
      />
    </div>
  );
}
