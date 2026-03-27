'use client';

import Link from 'next/link';
import React, { useState } from 'react';

const sceneData = [
  { id: 'scene-01', title: 'Scene 01', duration: '04s', status: 'ready', clipScore: 94, thumbnail: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkn0YsTw2nskN99WICp9Y43R6GKz7iRbl3Hxnq0dINbBJpa6TXM1noSN9gyljvuhep4-3WKRuYrLHKhAIWP9B5JOAa5Q3Av4askqfjK66hUFmUWHIJS5Fo7DGZqnLHJJZShune7nSlHUQYE6Kznykpe9X9cWedznd2mGu0E71gzMV6fGAYFKCqE0walVvQW_HynR1z5aUAMxUFdh4hq1B9KISnAd2ws1yAZNaDNr6BPlH_MJ1InCOFFhsy4pfwa9gJRW7kq1v2U_0' },
  { id: 'scene-02', title: 'Scene 02', duration: '06s', status: 'ready', clipScore: 89, thumbnail: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBzHp0xU_Kgq2bqxp5pALccg81D-t_tJGhgbISBLkrGF5Wwo7dB6M15kTYJfc55bKwyNUKMnn7-fm3aV-bwPsRSp-zCN_KxW6kkdn0iVEbG6slEFoLww68nn415UQOfKtZIQpc6aknOWIIzdvk4Erfi1sAsKv9dqdlYXq5RR4a-atif2Y1Vn1gI3EHyCLsor9V_UKLJnc68MuxrMnz_L5aWlFVFdHbbXUYJPmmPz8kvrNa-fxYNK1fDWkIClKnOp3oRhIGWjhPn-wg' },
  { id: 'scene-03', title: 'Scene 03', duration: '05s', status: 'generating', clipScore: 0, thumbnail: '' },
  { id: 'scene-04', title: 'Scene 04', duration: '03s', status: 'ready', clipScore: 91, thumbnail: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDl-hSrJ-xJSZjJEXrK9EdJ4XQybnVvyGDV4_l4NJoF9mBV7VJKKxUm6guAXE-QTk5PpRBTjUGoCTjogCay92A8UHVHg2ukZTtHfMjd7NBgVOp9dpyWFr71mqDtBZgLr1U_HttijjBPx8Q3b1PZwyJB6ki-JKD0tFpmOs5RJiQT9inGJ9wtIbYVLOr--athVpo0W5teumXolzxMRNH_SPRjDx63TQH5TZRNrPMwxk2bFauNix_yKmAsHD-VgRwdhmM14_cwd9G9Ptk' },
  { id: 'scene-05', title: 'Scene 05', duration: '05s', status: 'error', clipScore: 64, thumbnail: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD4cl4xXnhEAKw_SvE2b-uFETkXlZ6hTa8Xd7B4zFfWQE4FJ2MuJ5dX-lxdiuVNHlihhkIH-lBntlK7Wm1l_VZmWSn-33MCYjFbSYRXC5ZI-lx29AKA3dbVqt9njbhvUb5gzsQetjhsmuJnNVi8H-GNyvU87V14V-ftlQKCzcckc_ALzq4j-TMvFYTyWMB-7BGwC0aOlWI2XGqYgf5b7bYvM6AM_qTdi4KtnSDHlulNAYe-00JElU-8Qc5FS_Y7n3j1bYD5o6HdD2Q' },
  { id: 'scene-06', title: 'Scene 06', duration: '', status: 'queued', clipScore: 0, thumbnail: '' },
];

export default function ReviewPage() {
  const [selectedScene, setSelectedScene] = useState('scene-01');
  const [filterReady, setFilterReady] = useState(false);
  const [gridSize, setGridSize] = useState(4);

  const readyScenes = sceneData.filter(s => s.status === 'ready');
  const displayScenes = filterReady ? readyScenes : sceneData;
  const consistencyScore = readyScenes.length > 0
    ? Math.round(readyScenes.reduce((sum, s) => sum + s.clipScore, 0) / readyScenes.length)
    : 0;

  return (
    <main className="flex flex-col h-full">
      <div className="flex-1 flex gap-8 overflow-hidden">
        {/* Left Section - Scene Grid */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Scene Review</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterReady(!filterReady)}
                className={`px-4 py-2 rounded-lg text-sm transition ${
                  filterReady
                    ? 'bg-[#ff9064] text-white'
                    : 'bg-[#262626] text-gray-300 hover:bg-[#333333]'
                }`}
              >
                Filter {filterReady && '(Ready Only)'}
              </button>
              <button
                onClick={() => setGridSize(gridSize === 4 ? 2 : 4)}
                className="px-4 py-2 bg-[#262626] text-gray-300 rounded-lg text-sm hover:bg-[#333333]"
              >
                Grid ({gridSize}-col)
              </button>
            </div>
          </div>

          <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}>
            {displayScenes.map((scene) => {
              if (scene.status === 'ready') {
                return (
                  <button
                    key={scene.id}
                    onClick={() => setSelectedScene(scene.id)}
                    className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer transition-all border-2 ${
                      selectedScene === scene.id ? 'border-[#4cb150]' : 'border-[#444444]'
                    }`}
                  >
                    <img
                      src={scene.thumbnail}
                      alt={scene.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                      <div className="bg-[#4cb150] text-white text-xs font-bold px-2 py-1 rounded">
                        CLIP:{scene.clipScore}
                      </div>
                      <div className="bg-black/50 text-white text-xs px-2 py-1 rounded">
                        {scene.duration}
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 text-white text-sm font-bold">
                      {scene.title.toUpperCase()}
                    </div>
                  </button>
                );
              } else if (scene.status === 'generating') {
                return (
                  <div
                    key={scene.id}
                    className="relative aspect-video rounded-lg border-2 border-[#444444] bg-[#1a1a1a] flex items-center justify-center"
                  >
                    <div className="text-center">
                      <div className="inline-block w-8 h-8 border-2 border-[#9c27b0]/30 border-t-[#9c27b0] rounded-full animate-spin mb-2"></div>
                      <div className="text-xs text-gray-500">Generating</div>
                    </div>
                    <div className="absolute bottom-2 left-2 text-gray-400 text-sm font-bold">
                      {scene.title.toUpperCase()}
                    </div>
                  </div>
                );
              } else if (scene.status === 'queued') {
                return (
                  <button
                    key={scene.id}
                    onClick={() => setSelectedScene(scene.id)}
                    className={`relative aspect-video rounded-lg border-2 ${
                      selectedScene === scene.id ? 'border-[#4cb150]' : 'border-[#444444]'
                    } bg-[#1a1a1a] flex items-center justify-center cursor-pointer transition-all`}
                  >
                    <span className="text-3xl text-gray-600">⏳</span>
                    <div className="absolute bottom-2 left-2 text-white text-sm font-bold">
                      {scene.title.toUpperCase()}
                    </div>
                  </button>
                );
              } else if (scene.status === 'error') {
                return (
                  <button
                    key={scene.id}
                    onClick={() => setSelectedScene(scene.id)}
                    className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer transition-all border-2 ${
                      selectedScene === scene.id ? 'border-[#d32f2f]' : 'border-[#444444]'
                    }`}
                  >
                    <img
                      src={scene.thumbnail}
                      alt={scene.title}
                      className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                      <div className="bg-[#d32f2f] text-white text-xs font-bold px-2 py-1 rounded">
                        CLIP:{scene.clipScore}
                      </div>
                      <div className="bg-black/50 text-white text-xs px-2 py-1 rounded">
                        {scene.duration}
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 text-white text-sm font-bold">
                      {scene.title.toUpperCase()}
                    </div>
                  </button>
                );
              }
            })}
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="border-t border-[#333333] px-8 py-6 flex justify-between items-center gap-4 bg-[#0f0f0f]">
        <Link href="/create/character-setup" className="px-8 py-3 rounded-xl bg-surface-container-highest text-white font-headline font-bold transition-all hover:scale-105 active:scale-95">
          Back
        </Link>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-gray-400">Film consistency:</span>
            <span className="text-white font-bold ml-2">{consistencyScore}%</span>
          </div>
          <Link href="/create/generating" className="px-10 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-headline font-black transition-all hover:scale-105 active:scale-95">
            GENERATE FILM
          </Link>
        </div>
      </div>
    </main>
  );
}
