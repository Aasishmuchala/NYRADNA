'use client';

export default function StyleDnaPage() {
  return (
    <>
      <div className="bg-surface text-on-surface font-body selection:bg-primary selection:text-on-primary-fixed overflow-hidden">
        {/* TopNavBar (Shared Component) */}
        <header className="bg-[#0e0e0e]/70 backdrop-blur-xl top-0 z-50 shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex justify-between items-center w-full px-6 py-4 fixed">
          <div className="flex items-center gap-8">
            <span className="text-2xl font-black tracking-tighter text-[#ff9064] font-headline">DIRECTOR</span>
            <nav className="hidden md:flex gap-6 items-center">
              <a className="text-[#adaaaa] hover:text-white transition-colors text-sm font-medium" href="#">Dashboard</a>
              <a className="text-[#ff9064] font-bold border-b-2 border-[#ff9064] pb-1 text-sm" href="#">Projects</a>
              <a className="text-[#adaaaa] hover:text-white transition-colors text-sm font-medium" href="#">Characters</a>
              <a className="text-[#adaaaa] hover:text-white transition-colors text-sm font-medium" href="#">Settings</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative flex items-center bg-surface-container-highest rounded-full px-4 py-2 hover:bg-[#262626] transition-all duration-300 ease-in-out">
              <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
              <input className="bg-transparent border-none focus:ring-0 text-sm ml-2 text-on-surface placeholder:text-on-surface-variant w-32" placeholder="Search DNA..." type="text" />
            </div>
            <button className="material-symbols-outlined text-on-surface-variant hover:text-white transition-colors scale-95 active:scale-90 transition-transform">notifications</button>
            <button className="material-symbols-outlined text-on-surface-variant hover:text-white transition-colors scale-95 active:scale-90 transition-transform">help</button>
            <img alt="User profile avatar" className="w-8 h-8 rounded-full border border-outline-variant/30" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAtzkaHMNFVwcMk3eTMo6Dymm8QOOYimq1uP8_gBrTJEJQIb4v2rniJHwFEH936JWsAqUWI0IOP9yfsENB5Hd-caukZtx7hM8TqannROIjM2ZeoDRzZmZmWC095Yj-NnzHGhuAkXTf8agmiAwiEWweBT5YbZiTZun0m-2-ZGuIutn-HKD-VbFmNMrFYA_7jrjg8dD918dhvraqY6Zs-g4ESA9XlBJTLYZhqJkFt4HXHDZUlp6U6Nu7RdTET-vibdWLx1w8P4eo3DlY" />
          </div>
        </header>

        <main className="flex h-screen pt-[72px]">
          {/* Left: Style DNA Controls */}
          <section className="w-full md:w-[480px] h-full bg-surface-container-low overflow-y-auto custom-scrollbar p-8 flex flex-col gap-10">
            <div>
              <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface mb-2">Style DNA</h1>
              <p className="text-on-surface-variant text-sm leading-relaxed">Define the cinematic foundation for your AI generation engine.</p>
            </div>

            {/* Color Palette */}
            <div className="space-y-4">
              <label className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">Color Palette</label>
              <div className="flex items-center gap-3">
                <button className="w-12 h-16 rounded-lg bg-[#ff9064] border-2 border-white ring-4 ring-primary/20 transition-transform hover:scale-105" title="Action Orange"></button>
                <button className="w-12 h-16 rounded-lg bg-[#00e0ff] transition-transform hover:scale-105" title="Electric Blue"></button>
                <button className="w-12 h-16 rounded-lg bg-[#8b5cf6] transition-transform hover:scale-105" title="Cyber Purple"></button>
                <button className="w-12 h-16 rounded-lg bg-[#ec4899] transition-transform hover:scale-105" title="Neon Pink"></button>
                <button className="w-12 h-16 rounded-lg bg-[#10b981] transition-transform hover:scale-105" title="Matrix Green"></button>
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-4">
              <label className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">Aspect Ratio</label>
              <div className="grid grid-cols-3 gap-3">
                <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-surface-container-highest border border-outline-variant/15 hover:bg-surface-bright transition-colors group">
                  <div className="w-4 h-7 border-2 border-on-surface-variant group-hover:border-primary rounded-sm mb-2"></div>
                  <span className="text-xs font-medium">9:16</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-surface-container-highest border-2 border-primary transition-colors">
                  <div className="w-8 h-4.5 border-2 border-primary rounded-sm mb-2"></div>
                  <span className="text-xs font-bold text-primary">16:9</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-surface-container-highest border border-outline-variant/15 hover:bg-surface-bright transition-colors group">
                  <div className="w-6 h-6 border-2 border-on-surface-variant group-hover:border-primary rounded-sm mb-2"></div>
                  <span className="text-xs font-medium">1:1</span>
                </button>
              </div>
            </div>

            {/* Pacing Slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">Pacing</label>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">Balanced</span>
              </div>
              <div className="relative h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="absolute left-0 top-0 h-full w-1/2 bg-gradient-to-r from-primary to-primary-container"></div>
              </div>
              <div className="flex justify-between text-[10px] uppercase font-bold text-on-surface-variant px-1">
                <span>Quick</span>
                <span>Balanced</span>
                <span>Slow</span>
              </div>
            </div>

            {/* Lighting Selection */}
            <div className="space-y-4">
              <label className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">Lighting Environment</label>
              <div className="grid grid-cols-2 gap-3">
                <button className="px-4 py-3 rounded-lg bg-surface-container-highest flex items-center gap-3 border border-outline-variant/15 hover:border-primary/50 transition-all">
                  <span className="material-symbols-outlined text-orange-400">light_mode</span>
                  <span className="text-sm font-medium">Warm</span>
                </button>
                <button className="px-4 py-3 rounded-lg bg-surface-container-highest flex items-center gap-3 border border-outline-variant/15 hover:border-primary/50 transition-all">
                  <span className="material-symbols-outlined text-[#81e9ff]">ac_unit</span>
                  <span className="text-sm font-medium">Cool</span>
                </button>
                <button className="px-4 py-3 rounded-lg bg-surface-container-highest flex items-center gap-3 border-2 border-primary transition-all">
                  <span className="material-symbols-outlined text-primary">exposure</span>
                  <span className="text-sm font-bold text-primary">High-contrast</span>
                </button>
                <button className="px-4 py-3 rounded-lg bg-surface-container-highest flex items-center gap-3 border border-outline-variant/15 hover:border-primary/50 transition-all">
                  <span className="material-symbols-outlined text-on-surface-variant">wb_twilight</span>
                  <span className="text-sm font-medium">Mood</span>
                </button>
              </div>
            </div>

            {/* Camera Style Dropdown */}
            <div className="space-y-4">
              <label className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">Camera Motion</label>
              <div className="relative group">
                <button className="w-full bg-surface-container-highest px-4 py-4 rounded-xl flex items-center justify-between border border-outline-variant/15 hover:bg-surface-bright transition-all">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-tertiary">videocam</span>
                    <span className="text-sm font-medium">Handheld Cinematic</span>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant">expand_more</span>
                </button>
              </div>
            </div>

            {/* CTA Bottom */}
            <div className="mt-auto pt-6 border-t border-outline-variant/10">
              <button className="w-full py-4 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-headline font-extrabold tracking-tight hover:shadow-[0_0_20px_rgba(255,144,100,0.3)] transition-all active:scale-95">
                Lock Style DNA
              </button>
            </div>
          </section>

          {/* Right: Live Preview Video Player */}
          <section className="flex-1 h-full bg-surface relative flex items-center justify-center overflow-hidden p-12">
            {/* Background Atmospheric Glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full"></div>
              <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-tertiary/10 blur-[100px] rounded-full"></div>
            </div>

            {/* Video Player Container */}
            <div className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-outline-variant/20 bg-surface-container-lowest group">
              <div className="absolute inset-0 z-0">
                <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAbSw7HmrK2H_V46mgMvBz2JpJK5UXrgp2JOg3DXkR3N4ORFS054c--b13_MpANG0_ZOcPhULDyZ5ss30752vJ0tgQCjfl7LeI3syVBuPRXRdHKEeIyMeujCA3P266FUOuzKbBpawlnN-vdF0fDdk-PYOfHz4hBkyR8iFA4t0zdO3Ok5RzReASEOvEiQj1cd2Wp1a7tOCGV4zLoKVWwHac_wsukMbTNgFtRFCH4_hUuPRWcVaQdXExfugLXKGOJGeSLG-mJMUKLM7g" alt="Cinematic preview" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              </div>

              {/* Generation Status Pill */}
              <div className="absolute top-6 left-6 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-tertiary-container text-on-tertiary-fixed text-[10px] font-bold uppercase tracking-widest backdrop-blur-md">
                <div className="w-1.5 h-1.5 rounded-full bg-on-tertiary-fixed animate-pulse"></div>
                Real-time Rendering
              </div>

              {/* Meta Info Overlay */}
              <div className="absolute bottom-8 left-8 right-8 z-10 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Preview Loop</span>
                  <h3 className="text-xl font-headline font-black tracking-tight">Vanguard Protocol - Sequence 04</h3>
                </div>
                <div className="flex items-center gap-4">
                  <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors">
                    <span className="material-symbols-outlined text-white">fullscreen</span>
                  </button>
                  <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors">
                    <span className="material-symbols-outlined text-white">volume_up</span>
                  </button>
                </div>
              </div>

              {/* Center Play State */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-16 h-16 rounded-full bg-primary/20 backdrop-blur-xl border border-primary/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary scale-150" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                </div>
              </div>

              {/* Scrubber */}
              <div className="absolute bottom-0 left-0 h-1 bg-primary/20 w-full">
                <div className="h-full bg-primary w-1/3 shadow-[0_0_10px_#ff9064]"></div>
              </div>
            </div>

            {/* Floating Preview Specs */}
            <div className="absolute bottom-12 right-12 flex flex-col gap-4">
              <div className="bg-surface-container-high/60 backdrop-blur-xl p-4 rounded-xl border border-outline-variant/15 flex flex-col gap-2 min-w-[200px]">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant">Lut Confidence</span>
                  <span className="text-[10px] font-black text-tertiary">98%</span>
                </div>
                <div className="w-full h-1 bg-surface-container-highest rounded-full">
                  <div className="w-[98%] h-full bg-tertiary rounded-full"></div>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-1 leading-tight italic">Optimizing dynamic range for high-contrast DNA settings.</p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}