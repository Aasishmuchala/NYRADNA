'use client';

export default function CharactersPage() {
  return (
    <div className="bg-surface text-on-surface font-body selection:bg-primary selection:text-on-primary">
      {/* SideNavBar */}
      <aside className="h-screen w-64 fixed left-0 top-0 hidden md:flex flex-col bg-[#0e0e0e] py-6 space-y-2 z-50 overflow-hidden">
        <div className="px-6 mb-8">
          <h1 className="text-xl font-bold text-white font-headline tracking-tight">DIRECTOR</h1>
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-label">AI Video Engine</p>
        </div>
        <nav className="flex-1 space-y-1">
          <a className="text-[#adaaaa] mx-2 px-4 py-3 flex items-center gap-3 hover:text-white hover:bg-[#131313] rounded-lg transition-all duration-200" href="#">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-label text-sm">Dashboard</span>
          </a>
          <a className="text-[#adaaaa] mx-2 px-4 py-3 flex items-center gap-3 hover:text-white hover:bg-[#131313] rounded-lg transition-all duration-200" href="#">
            <span className="material-symbols-outlined">video_library</span>
            <span className="font-label text-sm">Projects</span>
          </a>
          <a className="bg-[#262626] text-[#ff9064] rounded-lg mx-2 px-4 py-3 flex items-center gap-3 translate-x-1 transition-transform duration-200" href="#">
            <span className="material-symbols-outlined">person_search</span>
            <span className="font-label text-sm font-bold">Characters</span>
          </a>
          <a className="text-[#adaaaa] mx-2 px-4 py-3 flex items-center gap-3 hover:text-white hover:bg-[#131313] rounded-lg transition-all duration-200" href="#">
            <span className="material-symbols-outlined">settings</span>
            <span className="font-label text-sm">Settings</span>
          </a>
        </nav>
        <div className="px-4 mt-auto space-y-4">
          <button className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 scale-100 active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-xl">add</span>
            <span className="font-label">New Project</span>
          </button>
          <a className="text-[#adaaaa] px-4 py-3 flex items-center gap-3 hover:text-white transition-colors" href="#">
            <span className="material-symbols-outlined">contact_support</span>
            <span className="font-label text-sm">Help &amp; Support</span>
          </a>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="md:ml-64 min-h-screen relative">
        {/* TopAppBar */}
        <header className="bg-[#0e0e0e]/70 backdrop-blur-xl top-0 z-40 sticky shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
          <div className="flex justify-between items-center w-full px-8 py-4">
            <div className="flex items-center gap-8">
              <h2 className="text-2xl font-black tracking-tighter text-[#ff9064] font-headline">CHARACTERS</h2>
              <div className="hidden lg:flex items-center gap-6">
                <span className="text-[#ff9064] font-bold border-b-2 border-[#ff9064] pb-1 cursor-default">Library</span>
                <span className="text-[#adaaaa] hover:text-white transition-colors cursor-pointer">Training</span>
                <span className="text-[#adaaaa] hover:text-white transition-colors cursor-pointer">Shared</span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-tertiary transition-colors">
                  <span className="material-symbols-outlined text-xl">search</span>
                </span>
                <input className="bg-surface-container-lowest border-none rounded-full pl-10 pr-4 py-2 text-sm w-64 focus:ring-1 focus:ring-tertiary/50 transition-all placeholder:text-on-surface-variant/50" placeholder="Search roster..." type="text" />
              </div>
              <div className="flex items-center gap-4 text-on-surface-variant">
                <button className="hover:bg-[#262626] p-2 rounded-full transition-all duration-300">
                  <span className="material-symbols-outlined">notifications</span>
                </button>
                <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-highest">
                  <img alt="User profile avatar" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBENL5ohQvA20B8G3ca43dIH1rcSOzOAEdmJcllet0r2LvV_8E6H4PJ6OGvobtueDEe1kU-Ezml_aHtDG_id_Co-se4-ccrmsvpQZynG2nUlKpA-CY-My8D7clyjKcWI4L_qnO80PsG2T2mYGEKDUwVxTsaPmMvfU5cxW7p4hJ9WjVOarxTl7WBVjIX2NzmpFWto1Cl5SP0Tb8GDNFrD4soa5uJpdwQb_HNf9kRuGiO0hcsCMDFbMFGdyt_6WeR-5SARS883snNzj8" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 max-w-[1600px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="space-y-2">
              <h3 className="text-4xl font-black font-headline tracking-tighter text-on-surface">Digital Cast</h3>
              <p className="text-on-surface-variant max-w-md">Manage your consistent character identities for high-fidelity cinematic generation. Leverage LoRA training for frame-to-frame stability.</p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-highest rounded-lg text-sm font-medium hover:bg-surface-bright transition-colors">
                <span className="material-symbols-outlined text-lg">filter_list</span>
                Sort by Recent
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-highest rounded-lg text-sm font-medium hover:bg-surface-bright transition-colors">
                <span className="material-symbols-outlined text-lg">grid_view</span>
              </button>
            </div>
          </div>

          {/* Character Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Create New Card */}
            <div className="group relative aspect-[4/5] rounded-xl overflow-hidden bg-surface-container-low flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/30 hover:border-primary/50 transition-all cursor-pointer">
              <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-3xl">add</span>
              </div>
              <span className="mt-4 font-headline font-bold text-lg text-on-surface">+ New Character</span>
              <span className="text-xs text-on-surface-variant/60 font-label">Upload or Generate Face</span>
            </div>

            {/* Character Card 1: Elias Thorne */}
            <div className="group relative aspect-[4/5] rounded-xl overflow-hidden bg-surface-container-low transition-all duration-300 hover:-translate-y-2">
              <div className="absolute inset-0 z-0">
                <img alt="Male protagonist face reference" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD6BE7BKdxqMaVFpnCm2WZ7VaAVPyn9TBwYSoHXwYZdB9vge_0ZfOsj7MkM1LkljPyHOVbLtQf_HncAL3_RVk4Jid4IQat4Sw8dBVHldysqgL5IUNiZ-TMl_URWsz5UV5CSobPO2pB7jjVuD-LRRlFiLr2xu7WmgOuSLF0Y-W8nbWoa_i5wQMVajIbxHGE3nYYU-GF2pTPLPQRwMrZK_CMruSuFsMKjAXA64wBweSbX_AsreVNBsmLBbW12NYXGB2x9_IN1Erbirt8" />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/20 to-transparent"></div>
              </div>
              <div className="absolute top-4 left-4 z-10 flex gap-2">
                <span className="px-2 py-1 bg-primary-container text-on-primary-container text-[10px] font-bold uppercase rounded-md tracking-wider">AI Generated</span>
                <span className="px-2 py-1 bg-tertiary-container/30 backdrop-blur-md text-tertiary text-[10px] font-bold uppercase rounded-md tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
                  LoRA: Active
                </span>
              </div>
              <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="bg-surface-container-highest/80 backdrop-blur-md p-2 rounded-lg hover:text-error transition-colors">
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5 z-10 space-y-3">
                <div>
                  <h4 className="text-xl font-bold font-headline text-white">Elias Thorne</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">movie</span>
                      12 Projects
                    </span>
                    <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      Oct 24, 2024
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t border-outline-variant/20 flex gap-2">
                  <button className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-bold py-2 rounded-lg transition-all">Rename</button>
                  <button className="flex-[2] bg-primary hover:bg-primary-container text-on-primary text-xs font-bold py-2 rounded-lg transition-all">Use in Project</button>
                </div>
              </div>
            </div>

            {/* Character Card 2: Sloane Vane */}
            <div className="group relative aspect-[4/5] rounded-xl overflow-hidden bg-surface-container-low transition-all duration-300 hover:-translate-y-2">
              <div className="absolute inset-0 z-0">
                <img alt="Female protagonist face reference" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCS3wtfgLtqwiiK_X83C2i421M7panEcHPMGYIYaORQJX9T1npDcstrQIF5dFNG_WZUVnuC7d3h715mhZ8-6snyr9NibI1gx-tI-MA3YFv3Bw0gqI3cGDPxQvJDcMUx9fnSWaD16cTh7r7AsZysetEy-VZ_1S5-l3YJioUCidU5tHA2lmgrXN3GGY8LRLzGc1k-nV05_8FqFz4QfPm_jyUf0BPsNKX_UcHH7G1T1YPA1fKMe-2utJ61k5Zui8dOy1kvn7RwKBF4oBw" />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/20 to-transparent"></div>
              </div>
              <div className="absolute top-4 left-4 z-10 flex gap-2">
                <span className="px-2 py-1 bg-surface-bright text-on-surface text-[10px] font-bold uppercase rounded-md tracking-wider">Real Asset</span>
                <span className="px-2 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase rounded-md tracking-wider">Base Only</span>
              </div>
              <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="bg-surface-container-highest/80 backdrop-blur-md p-2 rounded-lg hover:text-error transition-colors">
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5 z-10 space-y-3">
                <div>
                  <h4 className="text-xl font-bold font-headline text-white">Sloane Vane</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">movie</span>
                      4 Projects
                    </span>
                    <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      Nov 02, 2024
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t border-outline-variant/20 flex gap-2">
                  <button className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-bold py-2 rounded-lg transition-all">Rename</button>
                  <button className="flex-[2] bg-primary hover:bg-primary-container text-on-primary text-xs font-bold py-2 rounded-lg transition-all">Use in Project</button>
                </div>
              </div>
            </div>

            {/* Character Card 3: The Captain */}
            <div className="group relative aspect-[4/5] rounded-xl overflow-hidden bg-surface-container-low transition-all duration-300 hover:-translate-y-2">
              <div className="absolute inset-0 z-0">
                <img alt="Older male character face reference" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNRNbCaysjVWCY-oVuGz1FHojxSY15sJzb2jyTeg22OFUMwmEAN36u738vJD-RVk3rdACnQAAaeHhLex7_gw4cmPe44hzYa1kX3LwbDi5U25JDSwzIgZd2G3r2r6DHwzEvkWaBzZ1bkhLgPl103zEup2ud91_XSVU351m_xhwdE3tNvvH3ihnov5M1HIaOJWHW-QT31YXxPcVSMhVPqpB1iHqPYRtI-rBx49LhfXFPeo_BfeKLY9XZ6FBR5jC2nVr7_7nMclbduiw" />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/20 to-transparent"></div>
              </div>
              <div className="absolute top-4 left-4 z-10 flex gap-2">
                <span className="px-2 py-1 bg-primary-container text-on-primary-container text-[10px] font-bold uppercase rounded-md tracking-wider">AI Generated</span>
                <span className="px-2 py-1 bg-tertiary-container/30 backdrop-blur-md text-tertiary text-[10px] font-bold uppercase rounded-md tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
                  LoRA: Ready
                </span>
              </div>
              <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="bg-surface-container-highest/80 backdrop-blur-md p-2 rounded-lg hover:text-error transition-colors">
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5 z-10 space-y-3">
                <div>
                  <h4 className="text-xl font-bold font-headline text-white">The Captain</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">movie</span>
                      1 Project
                    </span>
                    <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      Nov 15, 2024
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t border-outline-variant/20 flex gap-2">
                  <button className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-bold py-2 rounded-lg transition-all">Rename</button>
                  <button className="flex-[2] bg-primary hover:bg-primary-container text-on-primary text-xs font-bold py-2 rounded-lg transition-all">Use in Project</button>
                </div>
              </div>
            </div>

            {/* Character Card 4: Nova Prime */}
            <div className="group relative aspect-[4/5] rounded-xl overflow-hidden bg-surface-container-low transition-all duration-300 hover:-translate-y-2">
              <div className="absolute inset-0 z-0">
                <img alt="Futuristic character face reference" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPA2AqFvY1NaI3cVmxqOhWr8Ht4unJQw7I7PTD0Wl4lObLVl4cO3OQHHDD9nrc8sej24vY8VuUUpAxg2atf-S1oZXGkfZ-YZMyTPa3bfRmWoJIOHx-ih9GngsFE7VkrSwRf4N3gVD_KUfxu-nkN-e0JUtzFMj61fFPYX03E9mdBAteUXFx0Hy8lEcA7hiSndQ8HCSR9wu2-hpJmMVyMiRglFqvuH6772ZwQyG6D4kwCQCp9l6eYAW2mb3JxBiA9r1ZaZQR35VaRQI" />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/20 to-transparent"></div>
              </div>
              <div className="absolute top-4 left-4 z-10 flex gap-2">
                <span className="px-2 py-1 bg-primary-container text-on-primary-container text-[10px] font-bold uppercase rounded-md tracking-wider">AI Generated</span>
                <span className="px-2 py-1 bg-surface-container-highest text-on-surface-variant text-[10px] font-bold uppercase rounded-md tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">sync</span>
                  Training...
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5 z-10 space-y-3">
                <div>
                  <h4 className="text-xl font-bold font-headline text-white">Nova Prime</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">movie</span>
                      0 Projects
                    </span>
                    <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      Just Now
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t border-outline-variant/20 flex gap-2">
                  <button className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-bold py-2 rounded-lg transition-all">Rename</button>
                  <button className="flex-[2] bg-primary/20 cursor-not-allowed text-primary-dim text-xs font-bold py-2 rounded-lg transition-all">Preparing...</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full py-12 px-8 border-t border-[#494847]/15 bg-[#0e0e0e] mt-20">
          <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto gap-8">
            <p className="text-[#adaaaa] font-label text-xs uppercase tracking-widest">&copy; 2024 DIRECTOR AI. All rights reserved.</p>
            <div className="flex gap-8">
              <a className="text-[#adaaaa] hover:text-[#ff9064] transition-colors font-label text-xs uppercase tracking-widest" href="#">Terms of Service</a>
              <a className="text-[#adaaaa] hover:text-[#ff9064] transition-colors font-label text-xs uppercase tracking-widest" href="#">Privacy Policy</a>
              <a className="text-[#adaaaa] hover:text-[#ff9064] transition-colors font-label text-xs uppercase tracking-widest" href="#">Twitter</a>
              <a className="text-[#adaaaa] hover:text-[#ff9064] transition-colors font-label text-xs uppercase tracking-widest" href="#">Discord</a>
            </div>
          </div>
        </footer>
      </main>

      {/* Mobile Navigation Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0e0e0e]/80 backdrop-blur-xl border-t border-[#494847]/15 z-50 flex justify-around items-center py-4">
        <a className="flex flex-col items-center text-[#adaaaa] hover:text-[#ff9064]" href="#">
          <span className="material-symbols-outlined">dashboard</span>
        </a>
        <a className="flex flex-col items-center text-[#adaaaa] hover:text-[#ff9064]" href="#">
          <span className="material-symbols-outlined">video_library</span>
        </a>
        <a className="flex flex-col items-center text-[#ff9064]" href="#">
          <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>person_search</span>
        </a>
        <a className="flex flex-col items-center text-[#adaaaa] hover:text-[#ff9064]" href="#">
          <span className="material-symbols-outlined">settings</span>
        </a>
      </nav>
    </div>
  );
}
