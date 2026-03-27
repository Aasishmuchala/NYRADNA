'use client';

import { useState } from 'react';

export default function ProjectsPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const projects = [
    {
      id: 1,
      title: 'Neon Genesis: Part II',
      badge: 'Ready',
      duration: '02:45',
      created: 'Created Oct 12, 2023',
      edited: 'Edited 2h ago',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC_wHq3QXsceTS2rc2HuEGzYF0n1tKtmOo-fEJAeghoFXe5Spw87ymjjovDrjMjZNT1P35rGrjFjuIM_KuYtS9ATeDVRB3Edx6tuGyMt3zcOzFcL6V6zAgEXMF9slv_IQdmgAEoNLp4TtHFkyJrufKc6WLw9woBG0YMETZUMbAh3-Kn9J9GZK6aC_ew3oK0OY-6BskM_Q79W649_mv2OVemPk5QX09ixNE6L34QynoeZGuToJRVrcrWbJ9moQZzvymgIZ21yA4Agcc',
    },
    {
      id: 2,
      title: 'Desert Echoes',
      badge: 'Generating',
      duration: null,
      created: 'Created Oct 10, 2023',
      edited: 'Edited 14m ago',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARQUxIA42SK7fz-JfUhG74LyCSZQuSUZBRhsDWJLoNB2isqFZY9vYwWjX9QQTsRLjDDg2ODuW08fI7M-U-ZprxKdfqL2EP_OvLIikIC9Y6idZXbbjoFQlMcEZlDvtzeQylzAixNnjIVFv5jt5rnAamTkfZpZ0sD1MDM0XPMpkVDesyc3o79o32To4aa5Hmw-lpjjxqREagdqNckn_LvBC2A4ZxPjjXDL6yu5-cKji31-VwboSCg7PtcYai60-ac4ZcWxzp1shXVP4',
      isGenerating: true,
    },
    {
      id: 3,
      title: 'Noir Studio Session',
      badge: 'Drafting',
      duration: '--:--',
      created: 'Created Oct 08, 2023',
      edited: 'Edited 1d ago',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAn98tZ7BsAvTq3jq4b41dG-3mbk6FUlxE27I-ErEHwC8cebU4ULDyIrV43vP4lTgjpTFRDhWdF9_EqA31K8wzklYE5uz56Z5BfOrpFLP6QnGzLnf29khucx_JGUBL1Ih_LIjWAIC201L7pmiN1KOWzIysIRuRawxVCJ55zl1DM1zVS0N5nj_1WkJX-HF2rWWiqg03ZjKKBEFFf6LyyAam6qjdqka_ejgOxLYsORuu-syGJgyEvRoqjy-XrD-PY0dAQ4jY5O0i00sE',
    },
    {
      id: 4,
      title: 'Forest Sprint Final',
      badge: 'Exported',
      duration: '01:15',
      created: 'Created Oct 05, 2023',
      edited: 'Edited 3d ago',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJ4GZyZmwUG0gLavisV-Ysxlm9vZswAkuwIM11cWUFFnIJIcWbHJbng8Mze9QIQUZmYKxRxMZCzi74OqEF3B9tu1bFyhVQpKolkBnOoYA5qCteTxo5eCWt_23x71W3d_c1fYLwtUxU-axyLXGz6aPl0lqp4W5LsGaDKCl0w-I5i1HopRSHLF9LxXjhzNMbfsG1_6Q-byParj2SLFuKrOC3ZCEgCAUEc9K2wrShDraXwV6NqspzirZPsuX3N-7L8veH1ecUUj5BfMs',
    },
    {
      id: 5,
      title: 'Skyline Montage',
      badge: 'Ready',
      duration: '00:45',
      created: 'Created Sep 30, 2023',
      edited: 'Edited 1w ago',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAeoVG7FVlT8jg3outzTR1TvC7aAWTQ1dVyc3t5f4AbOQmA7yfiCyHyKlVhOJavSrLamcBZciz1mmii7fTDOM2kZeGiLmte_wcJxN7OpPMaQTIC0qV-TfdMu-g7oqxrs7MuoKO6Nm0gez4wMXvhIAZiu6Gdb2sI8xtgwHD8Czk_IusCSl1ebq-9NwXtdVl8TbOr6rZG7ptjwF5x1mfbVmlPRebBhBxo9ROT0J9muaPzrY9_mtQUyDZiVEQf0Ogsnt8j2xutcXM2C-U',
    },
    {
      id: 6,
      title: 'Abstract Flow V3',
      badge: 'Ready',
      duration: '03:20',
      created: 'Created Sep 28, 2023',
      edited: 'Edited 1w ago',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAtHkDj2KwkHegyLvCTeeEmHjBg4_VxUewNUM9FGhILWTYVa240e9xgkUT4MpkHdklsFuar33rrIDZIkDX5sS2yvKpchah7RMcUVgaQPEDIDOJKGLKoyrr-AYnoXP5feAHNS5F8WPorrBaOpK0TGTI9wrhCv1C7pmmMY5GU5RtjuPwaZ2dEmw3gDB8O6jIHGH0Y9xbxUmtkcHpZ-WH1OYMl79Np3nKRGHweolTaXENZvges9qiBpG6aV6DmKXdEtcdhy6oGyMbspBo',
    },
  ];

  const getBadgeClasses = (badge: string) => {
    switch (badge) {
      case 'Ready':
        return 'bg-[#ff7941] text-[#431200]';
      case 'Generating':
        return 'bg-[#00e0ff] text-[#00363f]';
      case 'Drafting':
        return 'bg-[#474746] text-[#525151]';
      case 'Exported':
        return 'bg-[#2c2c2c] text-white';
      default:
        return 'bg-[#474746] text-[#525151]';
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0e0e0e] text-white font-body">
      {/* Sidebar */}
      <aside className="h-screen w-64 fixed left-0 top-0 hidden md:flex flex-col bg-[#0e0e0e] py-6 space-y-2 z-40">
        <div className="px-6 mb-8">
          <h1 className="text-xl font-bold text-white font-headline tracking-tight">DIRECTOR</h1>
          <p className="text-[0.6875rem] text-[#adaaaa] font-label uppercase tracking-widest">AI Video Engine</p>
        </div>
        <nav className="flex-1 space-y-1">
          <a className="text-[#adaaaa] mx-2 px-4 py-3 flex items-center gap-3 hover:text-white hover:bg-[#131313] rounded-lg transition-colors hover:translate-x-1 duration-200" href="/dashboard">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-medium">Dashboard</span>
          </a>
          {/* Active State: Projects */}
          <a className="bg-[#262626] text-[#ff9064] rounded-lg mx-2 px-4 py-3 flex items-center gap-3 transition-transform duration-200" href="/projects">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>video_library</span>
            <span className="font-bold">Projects</span>
          </a>
          <a className="text-[#adaaaa] mx-2 px-4 py-3 flex items-center gap-3 hover:text-white hover:bg-[#131313] rounded-lg transition-colors hover:translate-x-1 duration-200" href="/characters">
            <span className="material-symbols-outlined">person_search</span>
            <span className="font-medium">Characters</span>
          </a>
          <a className="text-[#adaaaa] mx-2 px-4 py-3 flex items-center gap-3 hover:text-white hover:bg-[#131313] rounded-lg transition-colors hover:translate-x-1 duration-200" href="/settings">
            <span className="material-symbols-outlined">settings</span>
            <span className="font-medium">Settings</span>
          </a>
        </nav>
        <div className="px-4 mt-auto">
          <button className="w-full py-3 bg-gradient-to-br from-[#ff9064] to-[#ff7941] text-[#571a00] font-bold rounded-xl flex items-center justify-center gap-2 active:scale-90 transition-transform">
            <span className="material-symbols-outlined">add</span>
            New Project
          </button>
        </div>
        <div className="pt-6 mt-6 border-t border-[#494847]/15">
          <a className="text-[#adaaaa] mx-2 px-4 py-3 flex items-center gap-3 hover:text-white hover:bg-[#131313] rounded-lg transition-colors" href="#">
            <span className="material-symbols-outlined">contact_support</span>
            <span className="font-medium text-sm">Help &amp; Support</span>
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 min-h-screen bg-[#0e0e0e] flex flex-col flex-1">
        {/* Top Nav */}
        <header className="sticky top-0 z-30 bg-[#0e0e0e]/70 backdrop-blur-xl px-6 py-4 flex justify-between items-center w-full shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black tracking-tighter text-white font-headline">Project Library</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative hidden lg:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#adaaaa] text-sm">search</span>
              <input
                className="bg-black border-none rounded-full py-2 pl-10 pr-4 text-sm w-64 focus:ring-1 focus:ring-[#81e9ff]/50 transition-all placeholder:text-[#adaaaa]/50 text-white"
                placeholder="Search projects..."
                type="text"
              />
            </div>
            <div className="flex items-center gap-4 text-[#adaaaa]">
              <button className="hover:text-white transition-colors">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <button className="hover:text-white transition-colors">
                <span className="material-symbols-outlined">help</span>
              </button>
              <div className="w-8 h-8 rounded-full bg-[#262626] overflow-hidden border border-[#494847]/20">
                <img
                  alt="User profile avatar"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDI7TrSuLFQ0udcUQ5xRChUtJs9RKPO3eGK1YDLgNJSia3StfueZF4Pd2quZp6co5xHB0Oj2gxrIA0utm2oZmdebtvzlVopelv6utAyZDX9nPJCnCbKt_vmBIhPxEhvLLCXvBP0RGfBzupNYn-1-TwyQgE9B1c4lewtvEogwnqnXWGa5Vaqqe17VSvUQaUVadCgbWKPmzh1rWpV8_CzCjlsIz4rXGWfgvKB5FpE4khAxKfCUQfHZuLCrI27GgZoIlIurlW1pBsGxyg"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Library Content */}
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8">
          {/* Filter & Action Bar */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex flex-wrap items-center gap-2 p-1 bg-[#131313] rounded-xl">
              {['All', 'Drafting', 'Generating', 'Ready', 'Exported'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter.toLowerCase())}
                  className={`px-5 py-2 rounded-lg text-sm transition-all ${
                    activeFilter === filter.toLowerCase()
                      ? 'bg-[#262626] text-[#ff9064] font-bold'
                      : 'text-[#adaaaa] hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="flex items-center gap-2 bg-[#131313] p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-[#262626] text-[#ff9064]' : 'text-[#adaaaa] hover:text-white'}`}
                >
                  <span className="material-symbols-outlined">grid_view</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-[#262626] text-[#ff9064]' : 'text-[#adaaaa] hover:text-white'}`}
                >
                  <span className="material-symbols-outlined">format_list_bulleted</span>
                </button>
              </div>
              <div className="h-8 w-[1px] bg-[#494847]/20"></div>
              <button className="flex items-center gap-2 text-sm font-medium text-[#adaaaa] hover:text-white transition-colors bg-[#131313] px-4 py-2.5 rounded-lg">
                <span className="material-symbols-outlined text-sm">sort</span>
                Sort: Last edited
              </button>
            </div>
          </div>

          {/* Bulk Actions Banner */}
          <div className="flex items-center justify-between px-6 py-3 bg-[#201f1f]/70 backdrop-blur-md rounded-2xl border border-[#494847]/10 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="w-5 h-5 border-2 border-[#ff9064] rounded flex items-center justify-center bg-[#ff9064]">
                <span className="material-symbols-outlined text-[#571a00] text-xs" style={{ fontVariationSettings: "'wght' 700" }}>check</span>
              </div>
              <span className="text-sm font-medium">3 Projects selected</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#adaaaa] hover:text-white transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">content_copy</span>
                Duplicate
              </button>
              <button className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#adaaaa] hover:text-white transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">ios_share</span>
                Export
              </button>
              <button className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#ff716c] hover:text-[#d7383b] transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">delete</span>
                Delete
              </button>
            </div>
          </div>

          {/* Project Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group relative flex flex-col bg-[#131313] rounded-xl overflow-hidden hover:translate-y-[-4px] transition-all duration-300 shadow-lg hover:shadow-[#ff9064]/5"
              >
                <div className={`relative aspect-video overflow-hidden ${project.isGenerating ? 'bg-[#262626]' : ''}`}>
                  <img
                    alt="Thumbnail"
                    className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${project.isGenerating ? 'opacity-40' : ''}`}
                    src={project.image}
                  />
                  {!project.isGenerating && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                  )}
                  {project.isGenerating && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`${getBadgeClasses(project.badge)} px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider`}>
                      {project.badge}
                    </span>
                  </div>
                  {project.isGenerating && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full border-2 border-[#81e9ff]/30 border-t-[#81e9ff] flex items-center justify-center animate-spin">
                        <span className="material-symbols-outlined text-[#81e9ff]">cycle</span>
                      </div>
                    </div>
                  )}
                  {project.duration && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 text-[10px] font-medium text-white/90">
                      <span className="material-symbols-outlined text-sm">schedule</span> {project.duration}
                    </div>
                  )}
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className={`font-bold text-lg leading-tight line-clamp-1 transition-colors ${project.isGenerating ? 'group-hover:text-[#81e9ff]' : 'group-hover:text-[#ff9064]'}`}>
                      {project.title}
                    </h3>
                    <button className="text-[#adaaaa] hover:text-white">
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                  </div>
                  <div className="flex justify-between items-center text-xs text-[#adaaaa] font-label">
                    <span>{project.created}</span>
                    <span>{project.edited}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Add New Project Ghost Card */}
            <button className="group relative flex flex-col items-center justify-center bg-[#131313] border-2 border-dashed border-[#494847]/30 rounded-xl aspect-video hover:bg-[#262626] transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-[#262626] flex items-center justify-center text-[#ff9064] group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">add</span>
              </div>
              <span className="mt-4 text-sm font-bold uppercase tracking-widest text-[#adaaaa] group-hover:text-[#ff9064] transition-colors">Create New Project</span>
            </button>
          </div>
        </div>

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
      </main>
    </div>
  );
}