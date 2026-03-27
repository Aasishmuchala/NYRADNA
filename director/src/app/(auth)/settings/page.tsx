'use client';

export default function SettingsPage() {
  return (
    <>
      {/* Sidebar Navigation */}
      <aside className="h-screen w-64 fixed left-0 top-0 hidden md:flex flex-col bg-[#0e0e0e] cinematic-glow z-50">
        <div className="flex flex-col h-full py-6 space-y-2">
          {/* Brand Header */}
          <div className="px-6 mb-8 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary-fixed">
                movie_filter
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white font-headline tracking-tight">
                DIRECTOR
              </h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-label">
                AI Video Engine
              </p>
            </div>
          </div>

          {/* Main Tabs */}
          <nav className="flex-1 space-y-1">
            <a
              className="text-[#adaaaa] mx-2 px-4 py-3 flex items-center gap-3 hover:text-white hover:bg-[#131313] rounded-lg transition-all duration-200"
              href="#"
            >
              <span className="material-symbols-outlined">dashboard</span>
              <span className="font-body text-sm font-medium">Dashboard</span>
            </a>
            <a
              className="text-[#adaaaa] mx-2 px-4 py-3 flex items-center gap-3 hover:text-white hover:bg-[#131313] rounded-lg transition-all duration-200"
              href="#"
            >
              <span className="material-symbols-outlined">video_library</span>
              <span className="font-body text-sm font-medium">Projects</span>
            </a>
            <a
              className="text-[#adaaaa] mx-2 px-4 py-3 flex items-center gap-3 hover:text-white hover:bg-[#131313] rounded-lg transition-all duration-200"
              href="#"
            >
              <span className="material-symbols-outlined">person_search</span>
              <span className="font-body text-sm font-medium">Characters</span>
            </a>
            {/* Active State for Settings context */}
            <a
              className="bg-[#262626] text-[#ff9064] rounded-lg mx-2 px-4 py-3 flex items-center gap-3"
              href="#"
            >
              <span className="material-symbols-outlined">settings</span>
              <span className="font-body text-sm font-bold">Settings</span>
            </a>
          </nav>

          {/* CTA */}
          <div className="px-4 mb-4">
            <button className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold py-3 rounded-lg text-sm transition-transform active:scale-95">
              New Project
            </button>
          </div>

          {/* Footer Tabs */}
          <div className="border-t border-outline-variant/15 pt-4">
            <a
              className="text-[#adaaaa] mx-2 px-4 py-3 flex items-center gap-3 hover:text-white transition-colors"
              href="#"
            >
              <span className="material-symbols-outlined">contact_support</span>
              <span className="font-body text-sm">Help &amp; Support</span>
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="md:ml-64 min-h-screen pb-20">
        {/* Top App Bar */}
        <header className="bg-[#0e0e0e]/70 backdrop-blur-xl top-0 z-40 sticky flex justify-between items-center w-full px-6 py-4">
          <h2 className="text-2xl font-black tracking-tighter text-[#ff9064] font-headline uppercase">
            Settings &amp; Billing
          </h2>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-on-surface-variant">
              <span className="material-symbols-outlined hover:text-white cursor-pointer transition-colors">
                notifications
              </span>
              <span className="material-symbols-outlined hover:text-white cursor-pointer transition-colors">
                help
              </span>
            </div>
            <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-highest">
              <img
                alt="User profile avatar"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhY2zXsH631YzQp2xYinvstPYhQI-a95sBErjmmowCf3JKlFQwXn9hHH__ESbsXgB_z0syRo1o1M1V7OGw5wawfCenoY4Ddf2xiid8v2Wv8UzqvOVRIoqHZ4okqxwto7pJ6_OYBErYYHticNhg2jmaQu3omCVJVikdTandRsA01lsSbPJ3o7bItFxp_t2tQKKfCxQ9ddGkVfisO_6XfYcgY9SzdnpHjnN5GFH7I5NBfzkTf_vA9z1LHgK4mNqASPdVXZY4Pw6sLx8"
              />
            </div>
          </div>
        </header>

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
                      <a
                        className="flex items-center gap-2 py-2 text-on-surface-variant hover:text-white transition-colors text-sm font-medium"
                        href="#"
                      >
                        Profile
                      </a>
                    </li>
                    <li>
                      <a
                        className="flex items-center gap-2 py-2 text-primary border-r-2 border-primary font-bold text-sm"
                        href="#"
                      >
                        Billing
                      </a>
                    </li>
                    <li>
                      <a
                        className="flex items-center gap-2 py-2 text-on-surface-variant hover:text-white transition-colors text-sm font-medium"
                        href="#"
                      >
                        Usage
                      </a>
                    </li>
                    <li>
                      <a
                        className="flex items-center gap-2 py-2 text-on-surface-variant hover:text-white transition-colors text-sm font-medium"
                        href="#"
                      >
                        Notifications
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-4 font-bold">
                    Security
                  </p>
                  <ul className="space-y-1">
                    <li>
                      <a
                        className="flex items-center gap-2 py-2 text-on-surface-variant hover:text-white transition-colors text-sm font-medium"
                        href="#"
                      >
                        API Keys
                      </a>
                    </li>
                    <li>
                      <a
                        className="flex items-center gap-2 py-2 text-on-surface-variant hover:text-white transition-colors text-sm font-medium"
                        href="#"
                      >
                        Team Access
                      </a>
                    </li>
                  </ul>
                </div>
              </nav>
            </aside>

            {/* Billing Content */}
            <div className="flex-1 space-y-10">
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
                    <button className="bg-surface-container-highest text-on-surface px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-surface-bright transition-colors">
                      Manage Subscription
                    </button>
                    <button className="text-primary-dim text-sm font-bold hover:underline">
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
                  <button className="w-full mt-6 py-2 text-xs font-black uppercase tracking-widest border border-outline-variant/30 rounded-lg hover:bg-white hover:text-black transition-all">
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
                  <button className="flex items-center gap-2 text-primary-dim text-sm font-bold group">
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
                      <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-error">
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
                  <button className="text-xs font-medium text-on-surface-variant flex items-center gap-1 hover:text-white">
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
          </div>
        </div>
        </main>

        {/* Footer */}
        <footer className="mt-auto w-full py-12 px-8 border-t border-[#494847]/15 bg-[#0e0e0e]">
          <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto gap-8">
            <p className="text-[#adaaaa] text-[10px] uppercase tracking-widest font-label order-2 md:order-1">&copy; 2024 DIRECTOR AI. All rights reserved.</p>
            <div className="flex gap-8 order-1 md:order-2">
              <a className="text-[#adaaaa] hover:text-[#ff9064] transition-colors text-[10px] uppercase tracking-widest font-label" href="#">Terms of Service</a>
              <a className="text-[#adaaaa] hover:text-[#ff9064] transition-colors text-[10px] uppercase tracking-widest font-label" href="#">Privacy Policy</a>
              <a className="text-[#adaaaa] hover:text-[#ff9064] transition-colors text-[10px] uppercase tracking-widest font-label" href="#">Twitter</a>
              <a className="text-[#adaaaa] hover:text-[#ff9064] transition-colors text-[10px] uppercase tracking-widest font-label" href="#">Discord</a>
            </div>
          </div>
        </footer>
    </>
  );
}