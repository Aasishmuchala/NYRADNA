'use client';

import React, { useState } from 'react';

export default function GeneratingPage() {
  const [isPaused, setIsPaused] = useState(false);

  const sceneCards = [
    {
      id: 1,
      title: 'Scene 1',
      status: 'complete',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLeu8InRJMbst71cbugb7cGsHf0JGaTWf6T3HumLaI5N-hoJ58amvMZbTFl5V8Pua2oHjbeVCkafcWPcyOdgbE_XwPjFpjmvxPsSjeggSyso__Kt6l5_41Zi1DceKdUQP-GorL8cw8Z00YbBf3bDCVp4l_Uz2edSYYPW7cujr-FKB-ziqVtRK_JsYCXfGLv0b5GVI4FteGNo_ecQIAMKnNs90a7FI-8SWrMcDNj8FnizQMVpsDkwIvPVs9OarL9Qy_0UAjsTLvDoQ',
      consistency: '94%'
    },
    {
      id: 2,
      title: 'Scene 2',
      status: 'complete',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQe2zvEHIlALEoYS_aSXa3zGQ0xrTIft7iNoe7p3XACzmRoIY0sSqZwlEdq-Q-8BE1LdKqJMIcarhdbNd-vWe1AB4j5JR0RxN1BnlWnML81Rtom4tnKeGepVzF5KEBvY1nk9We0NoHvUCEav7YX3sVH5JC_KhGaP7tLq7DY9ozhpysRQt3o3JLKyM7pUhErMjIbJGJLUVInl4g38vBpgWMo7E7Davcf626w-k70YXuTxDK3BucmuQgVOTT8IVDQaDvpSuLBhAc-GI',
      consistency: '88%'
    },
    {
      id: 3,
      title: 'Scene 3',
      status: 'generating',
      progress: 45
    },
    {
      id: 4,
      title: 'Scene 4',
      status: 'queued'
    },
    {
      id: 5,
      title: 'Scene 5',
      status: 'complete',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3T55w_1BZoAB3q5EDVLtuHXY2MKzTEfN3dlQ-IPZa2vtQkhLcLRuhQyCGscENfniBmPc3LLo6HgBybuL719VwQNUpu2yOR0qvRbu-tBQe-9aT1Yvp63ORB-PBdolwNSvAaC79kQnQLSUuz5xhgLfKUllZgdc0JY36ATE8YXQmpQU4bNj-eInZWB8QRgVhQPGHx0xiFe2P4vxaERceqcXm3b13awhpHdOsZncKtTo7btEhq-AKG6mXqurLH576VvQJPnQFMKJShAU',
      consistency: '92%'
    },
    {
      id: 6,
      title: 'Scene 6',
      status: 'complete',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHF5UpXrVLgCwwP8JRpRSCQ7MAwUEOgM8b8n0q-TFPN7Ij1Wn95SfbbqqLpamjKMJNCy0gA8dl4Wp0XB4LK2zdPmX4GfC59XbfJ2lTaMCnAxPK4Ii8_mRxt7tKOMoxtOC4sUTUEw0fzKEH4Xub2SJtqAAvnSX0lrdZ7Yizr-k_xVDsEyr4Q-m19SmghdL8UE2RV1ql2s3dov8sTj1VSP74o_mvH-otksznBmtVcI7Gf5sAqIO6QDfYAY3Vhp2MuEbC8uvhqVQd8ng',
      consistency: '90%'
    },
    {
      id: 7,
      title: 'Scene 7',
      status: 'generating',
      progress: 62
    },
    {
      id: 8,
      title: 'Scene 8',
      status: 'queued'
    }
  ];

  return (
    <>
      <div className="flex h-screen bg-[#0e0e0e] text-white">
        {/* Sidebar */}
        <aside className="w-64 fixed h-full bg-[#1a1a1a] border-r border-[#262626] flex flex-col md:flex md:w-64">
          {/* Logo */}
          <div className="p-6 border-b border-[#262626]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#ff9064] to-[#ff6b4a] flex items-center justify-center text-white font-bold">
                🎬
              </div>
              <div className="font-bold text-lg">DIRECTOR</div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#b3b3b3] hover:bg-[#262626] transition">
              <span>📊</span>
              <span>Dashboard</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#262626] text-[#ff9064] font-medium">
              <span>🎞️</span>
              <span>Projects</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#b3b3b3] hover:bg-[#262626] transition">
              <span>👤</span>
              <span>Characters</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#b3b3b3] hover:bg-[#262626] transition">
              <span>⚙️</span>
              <span>Settings</span>
            </a>
          </nav>

          {/* New Project Button */}
          <div className="p-4 border-t border-[#262626]">
            <button className="w-full bg-gradient-to-r from-[#ff9064] to-[#ff6b4a] text-white font-medium py-2 rounded-lg hover:opacity-90 transition">
              + New Project
            </button>
          </div>

          {/* Help & Support */}
          <div className="p-4 border-t border-[#262626]">
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-[#b3b3b3] hover:text-white transition">
              <span>❓</span>
              <span>Help &amp; Support</span>
            </a>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 flex flex-col h-screen overflow-hidden">
          {/* Header */}
          <header className="bg-[#1a1a1a] border-b border-[#262626] px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button className="p-2 hover:bg-[#262626] rounded-lg transition">
                  <span className="text-xl">←</span>
                </button>
                <div>
                  <h1 className="text-lg font-semibold">Project: Neo-Tokyo Drift v0.4</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-3 py-1 bg-[#262626] rounded-full text-xs font-medium text-[#4caf50]">
                      🔄 Rendering Pipeline Active
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button className="p-2 hover:bg-[#262626] rounded-lg transition">
                  <span>🔔</span>
                </button>
                <button className="p-2 hover:bg-[#262626] rounded-lg transition">
                  <span>❓</span>
                </button>
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDBYva88flVhhmlq0Z8EyiGGKAzcKI14ZrV4SUILclCx8lFdxqmql2uihmVERDDGyIrs3OiJTMp3lypg0UZKJMAxFWSq2QFBSaxRuHySmpktjwXA691I2T4BVoQn71Mpms8wsxnm_3OVDwA_F1ujl5czcd-XTIsNordrikh47YJS2gBXUP-QqIt1nzsIwvNszdvElzeM4Luiyvu0S4rWYiNEBirenC6KlpV22xhE8ujEukZ01HSMNGVhxfKHowbQXtT52-CRolHAoY"
                  alt="Avatar"
                  className="w-10 h-10 rounded-full"
                />
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6">
            {/* ACT STRUCTURE Section */}
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-[#b3b3b3] uppercase tracking-wide mb-4">
                ACT STRUCTURE
              </h2>
              <div className="flex gap-4">
                {/* Act 1 */}
                <div className="flex-1">
                  <div className="bg-[#262626] rounded-lg overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-[#ff9064] to-[#ff6b4a]"></div>
                    <div className="p-4">
                      <div className="text-sm font-medium">Act 1</div>
                      <div className="text-2xl font-bold text-[#ff9064] mt-1">100%</div>
                    </div>
                  </div>
                </div>

                {/* Act 2 - with shimmer */}
                <div className="flex-1">
                  <div className="bg-[#262626] rounded-lg overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-[#9c27b0] to-[#7b1fa2] shimmer"></div>
                    <div className="p-4">
                      <div className="text-sm font-medium">Act 2</div>
                      <div className="text-2xl font-bold text-[#9c27b0] mt-1">80%</div>
                    </div>
                  </div>
                </div>

                {/* Act 3 */}
                <div className="flex-1">
                  <div className="bg-[#262626] rounded-lg overflow-hidden">
                    <div className="h-2 bg-[#424242]"></div>
                    <div className="p-4">
                      <div className="text-sm font-medium text-[#666]">Act 3</div>
                      <div className="text-2xl font-bold text-[#666] mt-1">0%</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Global Progress Section */}
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-[#b3b3b3] uppercase tracking-wide mb-4">
                Global Progress
              </h2>
              <div className="bg-[#262626] rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-2xl font-bold">14 of 20 scenes complete</div>
                    <div className="text-sm text-[#999] mt-1">Preview available</div>
                  </div>
                  <div className="flex gap-3">
                    <button className="px-4 py-2 bg-[#1a1a1a] border border-[#444] rounded-lg hover:bg-[#333] transition font-medium">
                      Preview
                    </button>
                    <button
                      onClick={() => setIsPaused(!isPaused)}
                      className="px-4 py-2 bg-gradient-to-r from-[#ff9064] to-[#ff6b4a] text-white rounded-lg hover:opacity-90 transition font-medium"
                    >
                      {isPaused ? '▶ Resume' : '⏸ Pause'} Render
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Scene Pipeline Section */}
            <section>
              <h2 className="text-sm font-semibold text-[#b3b3b3] uppercase tracking-wide mb-4">
                Scene Pipeline
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {sceneCards.map((card) => (
                  <div key={card.id} className="bg-[#262626] rounded-lg overflow-hidden border border-[#333] hover:border-[#444] transition">
                    {/* Card Content */}
                    {card.status === 'complete' && (
                      <>
                        <div className="aspect-video bg-[#1a1a1a] overflow-hidden">
                          <img
                            src={card.image}
                            alt={card.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-4">
                          <div className="text-sm font-medium mb-3">{card.title}</div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-[#999]">Consistency</span>
                            <span className="text-sm font-semibold text-[#4caf50]">✓ {card.consistency}</span>
                          </div>
                        </div>
                      </>
                    )}

                    {card.status === 'generating' && (
                      <div className="aspect-video bg-[#1a1a1a] border-b-2 border-[#9c27b0] flex items-center justify-center">
                        <div className="text-center">
                          <div className="animate-spin text-3xl mb-2">⚙️</div>
                          <div className="text-xs text-[#999]">Generating</div>
                        </div>
                      </div>
                    )}

                    {card.status === 'generating' && (
                      <div className="p-4">
                        <div className="text-sm font-medium mb-3">{card.title}</div>
                        <div className="w-full bg-[#1a1a1a] rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-[#9c27b0] to-[#7b1fa2] h-full rounded-full"
                            style={{ width: `${card.progress}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-[#999] mt-2">{card.progress}%</div>
                      </div>
                    )}

                    {card.status === 'queued' && (
                      <>
                        <div className="aspect-video bg-[#1a1a1a] flex items-center justify-center opacity-60">
                          <div className="text-4xl">⏳</div>
                        </div>
                        <div className="p-4">
                          <div className="text-sm font-medium">{card.title}</div>
                          <div className="text-xs text-[#999] mt-2">Queued</div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Footer */}
          <footer className="bg-[#1a1a1a] border-t border-[#262626] px-6 py-4 text-xs text-[#666]">
            <div className="flex items-center justify-between">
              <div>
                Last updated: {new Date().toLocaleTimeString()}
              </div>
              <div className="flex gap-4">
                <a href="#" className="hover:text-white transition">Terms</a>
                <a href="#" className="hover:text-white transition">Privacy</a>
                <a href="#" className="hover:text-white transition">Support</a>
              </div>
            </div>
          </footer>
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#262626] flex justify-around py-2">
          <a href="#" className="flex flex-col items-center gap-1 p-2 text-[#666] hover:text-white transition">
            <span className="text-xl">📊</span>
            <span className="text-xs">Dashboard</span>
          </a>
          <a href="#" className="flex flex-col items-center gap-1 p-2 text-[#ff9064]">
            <span className="text-xl">🎞️</span>
            <span className="text-xs">Projects</span>
          </a>
          <a href="#" className="flex flex-col items-center gap-1 p-2 text-[#666] hover:text-white transition">
            <span className="text-xl">👤</span>
            <span className="text-xs">Characters</span>
          </a>
          <a href="#" className="flex flex-col items-center gap-1 p-2 text-[#666] hover:text-white transition">
            <span className="text-xl">⚙️</span>
            <span className="text-xs">Settings</span>
          </a>
        </nav>
      </div>
    </>
  );
}
