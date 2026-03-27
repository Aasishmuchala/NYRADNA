'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const handlePlayProject = (projectName: string) => {
    console.log(`Playing: ${projectName}`);
    alert(`Playing: ${projectName}`);
  };

  return (
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
          <Link href="/projects">
            <div className="group relative bg-surface-container-low rounded-xl overflow-hidden shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
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
                    <p className="text-xs text-on-surface-variant mt-1">Last edited 2h ago • 4m 12s</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handlePlayProject('Neon Syndicate');
                    }}
                    className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all"
                  >
                    <span className="material-symbols-outlined" data-icon="play_arrow" style={{fontVariationSettings: "'FILL' 1"}}>play_arrow</span>
                  </button>
                </div>
              </div>
            </div>
          </Link>

          {/* Project Card 2: Generating */}
          <Link href="/projects">
            <div className="group relative bg-surface-container-low rounded-xl overflow-hidden shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
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
                    <p className="text-xs text-on-surface-variant mt-1">AI creating scene 4 of 12 • 75% complete</p>
                  </div>
                  <button className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center cursor-not-allowed opacity-50">
                    <span className="material-symbols-outlined" data-icon="hourglass_empty">hourglass_empty</span>
                  </button>
                </div>
              </div>
            </div>
          </Link>
        </section>

        {/* New Project Action */}
        <section>
          <Link href="/create/intent">
            <button className="w-full h-48 rounded-xl border-2 border-dashed border-outline-variant/30 hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center gap-4 transition-all group cursor-pointer">
              <div className="w-16 h-16 rounded-full bg-surface-container-highest group-hover:bg-primary group-hover:text-on-primary flex items-center justify-center transition-all duration-300">
                <span className="material-symbols-outlined text-3xl" data-icon="add_circle">add_circle</span>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold headline-font">Start New Project</p>
                <p className="text-sm text-on-surface-variant">Empty canvas for your next AI-generated film</p>
              </div>
            </button>
          </Link>
        </section>
      </div>
    </main>
  );
}
