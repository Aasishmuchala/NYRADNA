'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'usage' | 'notifications' | 'api-keys' | 'team-access'>('billing');

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: 'Alex Johnson',
    email: 'alex.johnson@company.com',
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
    creditsUsed: 842,
    creditsTotal: 1000,
    apiCalls: 1240,
    storageUsed: 2.4,
    storageTotal: 10,
  });

  // API Key state
  const [apiKeys] = useState([
    { id: '1', name: 'Production Key', masked: 'sk_prod_••••••••••••••••5678', created: 'Nov 12, 2024' },
  ]);

  // Team members state
  const [teamMembers] = useState([
    { id: '1', name: 'Sarah Chen', email: 'sarah@company.com', role: 'Admin' },
    { id: '2', name: 'Mike Torres', email: 'mike@company.com', role: 'Editor' },
  ]);

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
                    className={`flex items-center gap-2 py-2 text-sm font-medium transition-colors w-full text-left ${
                      activeTab === 'profile'
                        ? 'text-primary border-r-2 border-primary font-bold'
                        : 'text-on-surface-variant hover:text-white'
                    }`}
                  >
                    Profile
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('billing')}
                    className={`flex items-center gap-2 py-2 text-sm font-medium transition-colors w-full text-left ${
                      activeTab === 'billing'
                        ? 'text-primary border-r-2 border-primary font-bold'
                        : 'text-on-surface-variant hover:text-white'
                    }`}
                  >
                    Billing
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('usage')}
                    className={`flex items-center gap-2 py-2 text-sm font-medium transition-colors w-full text-left ${
                      activeTab === 'usage'
                        ? 'text-primary border-r-2 border-primary font-bold'
                        : 'text-on-surface-variant hover:text-white'
                    }`}
                  >
                    Usage
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className={`flex items-center gap-2 py-2 text-sm font-medium transition-colors w-full text-left ${
                      activeTab === 'notifications'
                        ? 'text-primary border-r-2 border-primary font-bold'
                        : 'text-on-surface-variant hover:text-white'
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
                    className={`flex items-center gap-2 py-2 text-sm font-medium transition-colors w-full text-left ${
                      activeTab === 'api-keys'
                        ? 'text-primary border-r-2 border-primary font-bold'
                        : 'text-on-surface-variant hover:text-white'
                    }`}
                  >
                    API Keys
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('team-access')}
                    className={`flex items-center gap-2 py-2 text-sm font-medium transition-colors w-full text-left ${
                      activeTab === 'team-access'
                        ? 'text-primary border-r-2 border-primary font-bold'
                        : 'text-on-surface-variant hover:text-white'
                    }`}
                  >
                    Team Access
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
                  <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold">
                    {profileForm.name.charAt(0)}
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
                  className="w-full px-4 py-3 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/30 focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface">Email Address</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                  className="w-full px-4 py-3 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/30 focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              <button
                onClick={() => alert('Profile updated successfully!')}
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
                    <h3 className="text-4xl font-black font-headline text-white mb-2">
                      Cinematic Pro
                    </h3>
                    <p className="text-on-surface-variant text-sm max-w-md">
                      Unrestricted access to 4K neural rendering, unlimited character presets, and
                      priority GPU queuing.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 mt-8">
                    <button
                      onClick={() => alert('Opening subscription management...')}
                      className="bg-surface-container-highest text-on-surface px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-surface-bright transition-colors"
                    >
                      Manage Subscription
                    </button>
                    <button
                      onClick={() => alert('Feature coming soon')}
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
                      <h4 className="text-sm font-bold uppercase tracking-wide text-white">
                        Scene Blocks
                      </h4>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-3xl font-black font-headline">842</span>
                      <span className="text-on-surface-variant text-xs">/ 1,000</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-primary" style={{ width: '84%' }} />
                    </div>
                    <p className="text-[10px] text-on-surface-variant font-medium">
                      84% of monthly quota used
                    </p>
                  </div>
                  <button
                    onClick={() => alert('Adding credits...')}
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
                    onClick={() => alert('Add payment method functionality coming soon')}
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
                        <p className="text-sm font-bold text-white tracking-wide">
                          •••• •••• •••• 4242
                        </p>
                        <p className="text-xs text-on-surface-variant">Expires 12/26 — Visa</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant bg-surface-container-highest px-2 py-1 rounded">
                        Primary
                      </span>
                      <span
                        onClick={() => alert('Payment method deleted')}
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
                    onClick={() => alert('Exporting billing history...')}
                    className="text-xs font-medium text-on-surface-variant flex items-center gap-1 hover:text-white"
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
                        <td className="py-5 text-sm font-medium text-white">#DIR-2024-0812</td>
                        <td className="py-5 text-sm text-on-surface-variant">Nov 12, 2024</td>
                        <td className="py-5">
                          <span className="px-2 py-0.5 bg-primary-container/10 text-primary text-[10px] font-bold rounded-full">
                            Paid
                          </span>
                        </td>
                        <td className="py-5 text-sm font-bold text-white">$49.00</td>
                        <td className="py-5 text-right">
                          <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-white">
                            visibility
                          </span>
                        </td>
                      </tr>
                      <tr className="group hover:bg-surface-container-low transition-colors">
                        <td className="py-5 text-sm font-medium text-white">#DIR-2024-0712</td>
                        <td className="py-5 text-sm text-on-surface-variant">Oct 12, 2024</td>
                        <td className="py-5">
                          <span className="px-2 py-0.5 bg-primary-container/10 text-primary text-[10px] font-bold rounded-full">
                            Paid
                          </span>
                        </td>
                        <td className="py-5 text-sm font-bold text-white">$49.00</td>
                        <td className="py-5 text-right">
                          <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-white">
                            visibility
                          </span>
                        </td>
                      </tr>
                      <tr className="group hover:bg-surface-container-low transition-colors">
                        <td className="py-5 text-sm font-medium text-white">#DIR-2024-0612</td>
                        <td className="py-5 text-sm text-on-surface-variant">Sep 12, 2024</td>
                        <td className="py-5">
                          <span className="px-2 py-0.5 bg-primary-container/10 text-primary text-[10px] font-bold rounded-full">
                            Paid
                          </span>
                        </td>
                        <td className="py-5 text-sm font-bold text-white">$49.00</td>
                        <td className="py-5 text-right">
                          <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-white">download</span>
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
                  <div className="h-full bg-primary" style={{ width: `${(usageData.creditsUsed / usageData.creditsTotal) * 100}%` }} />
                </div>
                <p className="text-sm text-on-surface-variant">{Math.round((usageData.creditsUsed / usageData.creditsTotal) * 100)}% of monthly quota used</p>
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
                  <div className="h-full bg-tertiary" style={{ width: `${(usageData.storageUsed / usageData.storageTotal) * 100}%` }} />
                </div>
                <p className="text-sm text-on-surface-variant">{Math.round((usageData.storageUsed / usageData.storageTotal) * 100)}% of storage capacity used</p>
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
                onClick={() => alert('Notification preferences saved!')}
                className="px-6 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-bold hover:bg-primary-container transition-colors mt-6"
              >
                Save Preferences
              </button>
            </div>
          )}

          {/* API Keys Tab Content */}
          {activeTab === 'api-keys' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold font-headline">API Keys</h2>
                <button
                  onClick={() => alert('Creating new API key...')}
                  className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-bold hover:bg-primary-container transition-colors"
                >
                  Create New Key
                </button>
              </div>

              <div className="space-y-4">
                {apiKeys.map((key) => (
                  <div key={key.id} className="bg-surface-container-low p-6 rounded-lg border border-outline-variant/30 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-white">{key.name}</h3>
                        <p className="text-xs text-on-surface-variant mt-1">Created {key.created}</p>
                      </div>
                      <button
                        onClick={() => alert('API key deleted')}
                        className="text-error hover:text-error-dark transition-colors"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                    <div className="font-mono text-sm bg-surface-container-lowest p-3 rounded flex items-center justify-between">
                      <span className="text-on-surface-variant">{key.masked}</span>
                      <button
                        onClick={() => alert('API key copied to clipboard!')}
                        className="text-primary hover:text-primary-container transition-colors"
                      >
                        <span className="material-symbols-outlined">content_copy</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team Access Tab Content */}
          {activeTab === 'team-access' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold font-headline">Team Members</h2>
                <button
                  onClick={() => alert('Invite dialog opening...')}
                  className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-bold hover:bg-primary-container transition-colors"
                >
                  Invite Member
                </button>
              </div>

              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="bg-surface-container-low p-5 rounded-lg border border-outline-variant/30 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-white">{member.name}</p>
                        <p className="text-xs text-on-surface-variant">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="px-3 py-1 bg-surface-container-highest rounded text-xs font-bold text-on-surface-variant">
                        {member.role}
                      </span>
                      <button
                        onClick={() => alert('Removing team member...')}
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
        </div>
      </div>
    </div>
  );
}
