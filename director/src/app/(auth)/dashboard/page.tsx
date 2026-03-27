'use client';

import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="bg-surface text-on-surface selection:bg-primary/30">
      {/* Sidebar Navigation */}
      <aside className="bg-[#0e0e0e] h-screen w-64 fixed left-0 top-0 hidden md:flex flex-col z-40">
        <div className="flex flex-col h-full py-6 space-y-2">
          {/* Brand Section */}
          <div className="px-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,144,100,0.3)]">
                <span className="material-symbols-outlined text-on-primary font-bold" data-icon="movie_filter">movie_filter</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white headline-font tracking-tight">DIRECTOR</h1>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-medium">AI Video Engine</p>
              </div>
            </div>
          </div>

          {/* Main Navigation Tabs */}
          <nav className="flex-1 px-2 space-y-1">
            <a className="bg-[#262626] text-[#ff9064] rounded-lg px-4 py-3 flex items-center gap-3 transition-transform duration-200 hover:translate-x-1" href="#">
              <span className="material-symbols-outlined" data-icon="dashboard" style={{fontVariationSettings: "'FILL' 1"}}>dashboard</span>
              <span className="font-headline font-bold">Dashboard</span>
            </a>
            <a className="text-[#adaaaa] px-4 py-3 flex items-center gap-3 hover:bg-[#131313] hover:text-white rounded-lg transition-all duration-200 hover:translate-x-1" href="#">
              <span className="material-symbols-outlined" data-icon="video_library">video_library</span>
              <span className="font-headline">Projects</span>
            </a>
            <a className="text-[#adaaaa] px-4 py-3 flex items-center gap-3 hover:bg-[#131313] hover:text-white rounded-lg transition-all duration-200 hover:translate-x-1" href="#">
              <span className="material-symbols-outlined" data-icon="person_search">person_search</span>
              <span className="font-headline">Characters</span>
            </a>
            <a className="text-[#adaaaa] px-4 py-3 flex items-center gap-3 hover:bg-[#131313] hover:text-white rounded-lg transition-all duration-200 hover:translate-x-1" href="#">
              <span className="material-symbols-outlined" data-icon="settings">settings</span>
              <span className="font-headline">Settings</span>
            </a>
          </nav>

          {/* CTA & Footer Tabs */}
          <div className="px-4 mt-auto space-y-4">
            <button className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform">
              <span className="material-symbols-outlined" data-icon="add">add</span>
              New Project
            </button>
            <div className="pt-4 border-t border-outline-variant/15">
              <a className="text-[#adaaaa] px-4 py-3 flex items-center gap-3 hover:text-white transition-colors" href="#">
                <span className="material-symbols-outlined" data-icon="contact_support">contact_support</span>
                <span className="text-sm">Help &amp; Support</span>
              </a>
            </div>
          </div>
        </div>
      </aside>

      {/* Top Bar */}
      <header className="fixed top-0 right-0 left-0 md:left-64 bg-[#0e0e0e]/70 backdrop-blur-xl z-30">
        <div className="flex justify-between items-center w-full px-8 py-4">
          <div className="relative w-1/3 group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" data-icon="search">search</span>
            <input className="w-full bg-surface-container-lowest border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary/50 placeholder:text-on-surface-variant/50" placeholder="Search projects or assets..." type="text" />
          </div>
          <div className="flex items-center gap-6">
            <button className="relative text-on-surface-variant hover:text-white transition-colors">
              <span className="material-symbols-outlined" data-icon="notifications">notifications</span>
              <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full border-2 border-surface"></span>
            </button>
            <button className="text-on-surface-variant hover:text-white transition-colors">
              <span className="material-symbols-outlined" data-icon="help">help</span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-outline-variant/20">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-white">Alex Rivera</p>
                <p className="text-[10px] text-on-surface-variant">Director Pro</p>
              </div>
              <img alt="User profile avatar" className="w-10 h-10 rounded-full border border-outline-variant/30 hover:scale-105 transition-transform cursor-pointer" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDiGc6TD4eHBJ-FcBSOfHbE1v8RFuOR8YhzcRBjvW0R3aiqxBCIIBgHTIiGtG91byJMWb_Q32YxvRSSskuDvyU9U1VltSyH-tY84y45bq21ZvMuXAF049H5nZ1wsrnFCioWJ7nt2-fsGnshAbjJMK9p2L4IlPn2g58NWRsjrB-CrHBkiTHCOODz_fuc2P-AUeY9CZaCl68HuL0uycYUussgoEnB29m5T5RZ0joeRKTFVIssTfUAdVg-KjyRFPXlRcxXVIduicibbF0" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-24 pb-12 pl-4 pr-4 md:pl-72 md:pr-[340px] min-h-screen">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Hero Heading */}
          <section className="space-y-1">
            <h2 className="text-3xl md:text-4xl font-extrabold headline-font tracking-tighter">Continue where you left off</h2>
            <p className="text-on-surface-variant text-sm">Your recent masterpieces are ready for the next cut.</p>
          </section>

          {/* Projects Grid */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Project Card 1: Ready */}
            <div className="group relative bg-surface-container-low rounded-xl overflow-hidden shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="aspect-video w-full bg-surface-container-highest relative">
                <img alt="Cinematic cyberpunk street scene with neon lights" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDEYBa58QP5bj21qqwrFajB97n9Y7bh6HfkN-QjEFYKl3kr81zBhQatqv0S2zjxqb5XftEqqTULzyZTBd2uuCUmt6v2m2i2JB1kyQMaRQM6QMS2j3oEmb83AfQwXS6a-UvcmHZR31tB_0nC_wMmRPy1gfc56TZLVFNlG6zzqet-blsyyY8XVE4vGJpJih78Hyx11qiRMxANm8vapS6ThlxWzAmCNXaOb31hR9nM4-9CraxX_wSrk741001xo5v1XkJeApiMZYwvqi4" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-primary-container text-on-primary-container shadow-lg">Ready</span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold headline-font">Neon Syndicate</h3>
                    <p className="text-xs text-on-surface-variant mt-1">Last edited 2h ago &bull; 4m 12s</p>
                  </div>
                  <button className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all">
                    <span className="material-symbols-outlined" data-icon="play_arrow" style={{fontVariationSettings: "'FILL' 1"}}>play_arrow</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Project Card 2: Generating */}
            <div className="group relative bg-surface-container-low rounded-xl overflow-hidden shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="aspect-video w-full bg-surface-container-highest relative">
                <img alt="Space station orbiting a blue planet" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2dHOMYu7R-LZBrC8e5mKXgnp2Jkegfh4kJYIrF4z2deNpkKR-aTxuVGBJ_zDOwfApi5M0YWuE4l4vSGM4YAUsla96u4g-Jzk7MTsdL62tgPSV3aUzNI6oACcITiQhvi2DXuo6rkR6PqoK-xemoqpX6gAZI_u7PHb4vmuUizkoYoaC-AZtAOiYaABsijqkqxidYmmnzO6XHNy_pKSfATceox0YPvpJreidDS1WCCHLRmt85u7oibwIgpIqZHeHh3ziGPZUVA0ksgc" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute top-4 left-4">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-tertiary-container text-on-tertiary-fixed shadow-lg">
                    <span className="w-2 h-2 bg-on-tertiary-fixed rounded-full animate-pulse"></span>
                    Generating
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 h-1 bg-tertiary w-3/4 shadow-[0_0_10px_#81e9ff]"></div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold headline-font">Mars Horizon</h3>
                    <p className="text-xs text-on-surface-variant mt-1">AI creating scene 4 of 12 &bull; 75% complete</p>
                  </div>
                  <button className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center cursor-not-allowed opacity-50">
                    <span className="material-symbols-outlined" data-icon="hourglass_empty">hourglass_empty</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* New Project Action */}
          <section>
            <button className="w-full h-48 rounded-xl border-2 border-dashed border-outline-variant/30 hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center gap-4 transition-all group">
              <div className="w-16 h-16 rounded-full bg-surface-container-highest group-hover:bg-primary group-hover:text-on-primary flex items-center justify-center transition-all duration-300">
                <span className="material-symbols-outlined text-3xl" data-icon="add_circle">add_circle</span>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold headline-font">Start New Project</p>
                <p className="text-sm text-on-surface-variant">Empty canvas for your next AI-generated film</p>
              </div>
            </button>
          </section>
        </div>
      </main>

      {/* Right Panel: Usage Meter */}
      <aside className="fixed top-24 right-0 bottom-0 w-[340px] hidden md:flex flex-col p-8 z-20">
        <div className="bg-surface-container-low rounded-2xl h-full flex flex-col p-6 shadow-2xl border border-outline-variant/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold headline-font text-lg">Resource Usage</h3>
            <span className="material-symbols-outlined text-on-surface-variant text-sm" data-icon="info">info</span>
          </div>

          <div className="space-y-8 flex-1">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <p className="text-sm font-medium">Scene Blocks</p>
                <p className="text-xs font-bold text-primary">75 <span className="text-on-surface-variant">/ 100 used</span></p>
              </div>
              <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full shadow-[0_0_12px_rgba(255,144,100,0.5)]" style={{width: '75%'}}></div>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">You&apos;ve utilized 75% of your monthly scene generation capacity.</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <p className="text-sm font-medium">AI Compute Time</p>
                <p className="text-xs font-bold text-tertiary">1.2h <span className="text-on-surface-variant">/ 5h</span></p>
              </div>
              <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-tertiary rounded-full shadow-[0_0_12px_rgba(129,233,255,0.5)]" style={{width: '24%'}}></div>
              </div>
            </div>

            {/* Upsell Card */}
            <div className="mt-8 p-5 bg-gradient-to-br from-surface-container-highest to-surface-container-low rounded-xl border border-primary/10 relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 blur-3xl group-hover:bg-primary/20 transition-all"></div>
              <h4 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg" data-icon="bolt" style={{fontVariationSettings: "'FILL' 1"}}>bolt</span>
                Go Unlimited
              </h4>
              <p className="text-[11px] text-on-surface-variant mb-4">Unlock 4K exports, priority compute, and unlimited scene blocks with the Pro Plan.</p>
              <button className="w-full py-2 bg-surface-bright hover:bg-white hover:text-black text-xs font-bold rounded-lg transition-all">
                Upgrade to Pro
              </button>
            </div>
          </div>

          {/* Footer Stats */}
          <div className="pt-6 border-t border-outline-variant/15 flex items-center justify-between">
            <div className="flex -space-x-2">
              <img alt="Team member" className="w-6 h-6 rounded-full border border-surface" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8lmBEJFeq0CPL2fkDjKfvMO-4yJSRg9NUHVe3JLiMXkWErtpNbH4Lodx_VXr5_P3Jv3k0QiyPtPbnZdUQ0069Z_82vAgVRvgZFkJcPcMEp7Tp-2twQryjLuzOUwSCthdO3qNWxZfhWq1pj6Y02MWjd_bY-w77Y_lEDOOT5VJl3Eiv4nEiR3P5Qs6hCteVElKtvK77RYkDwYpirIO4hpr_ngnSsCBLP4PJwJIFMcWoWuWodKT066zAsYHgx_X2oAgWqC0RB4FXhzk" />
              <img alt="Team member" className="w-6 h-6 rounded-full border border-surface" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB4Xa5Wp7avYJafPN8CqntHzn19gh_BtJwTSMs59Pqv2G-DyczSy3rl7dKw5H6jOCHcrc9Crhk0kE6gHe1bkI7ZbQsLFdVd_f8ORMwcNWZVdUQAOWR-knJt8eR29XX7ArZGmKodDwzlxqHUlffKNBPMbSz8YmO8KlLGaFWp4hTmdu2aJIEWHyi2Hi3fbt3ZkgQK3VV_Dz2mZx_d1AtuPGOrgiY1lgZXa_RAtF25wy-fs6um0I-sOuGk1eUhLYzN5n0-gTNygu-BDQg" />
              <div className="w-6 h-6 rounded-full bg-surface-container-highest border border-surface flex items-center justify-center text-[8px] font-bold">+3</div>
            </div>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Collaborators</p>
          </div>
        </div>
      </aside>

      {/* Footer (Mobile) */}
      <footer className="md:hidden mt-auto py-12 px-8 border-t border-[#494847]/15 bg-[#0e0e0e] z-10">
        <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto gap-6">
          <p className="text-[#adaaaa] text-[10px] uppercase tracking-widest">&copy; 2024 DIRECTOR AI. All rights reserved.</p>
          <div className="flex gap-6">
            <a className="text-[#adaaaa] text-[10px] uppercase tracking-widest hover:text-[#ff9064] transition-colors" href="#">Terms of Service</a>
            <a className="text-[#adaaaa] text-[10px] uppercase tracking-widest hover:text-[#ff9064] transition-colors" href="#">Twitter</a>
            <a className="text-[#adaaaa] text-[10px] uppercase tracking-widest hover:text-[#ff9064] transition-colors" href="#">Discord</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
