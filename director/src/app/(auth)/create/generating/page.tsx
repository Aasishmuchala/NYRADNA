'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';

export default function GeneratingPage() {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(70);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + 2;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [isPaused]);

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
    <main className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 flex flex-col">
      {/* ACT STRUCTURE Section */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
          ACT STRUCTURE
        </h2>
        <div className="flex gap-4">
          {/* Act 1 */}
          <div className="flex-1">
            <div className="bg-[#262626] rounded-lg overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-[#ff9064] to-[#ff6b4a]" style={{ width: `${Math.min(progress, 100)}%` }}></div>
              <div className="p-4">
                <div className="text-sm font-medium">Act 1</div>
                <div className="text-2xl font-bold text-[#ff9064] mt-1">{Math.min(progress, 100)}%</div>
              </div>
            </div>
          </div>

          {/* Act 2 */}
          <div className="flex-1">
            <div className="bg-[#262626] rounded-lg overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-[#9c27b0] to-[#7b1fa2]" style={{ width: `${Math.max(0, Math.min(progress - 33, 100))}%` }}></div>
              <div className="p-4">
                <div className="text-sm font-medium">Act 2</div>
                <div className="text-2xl font-bold text-[#9c27b0] mt-1">{Math.max(0, Math.min(progress - 33, 100))}%</div>
              </div>
            </div>
          </div>

          {/* Act 3 */}
          <div className="flex-1">
            <div className="bg-[#262626] rounded-lg overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-[#4caf50] to-[#45a049]" style={{ width: `${Math.max(0, Math.min(progress - 66, 100))}%` }}></div>
              <div className="p-4">
                <div className={`text-sm font-medium ${progress > 66 ? 'text-white' : 'text-gray-600'}`}>Act 3</div>
                <div className={`text-2xl font-bold mt-1 ${progress > 66 ? 'text-[#4caf50]' : 'text-gray-600'}`}>{Math.max(0, Math.min(progress - 66, 100))}%</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Global Progress Section */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
          Global Progress
        </h2>
        <div className="bg-[#262626] rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-2xl font-bold">{Math.round((progress / 100) * 20)} of 20 scenes complete</div>
              <div className="text-sm text-gray-500 mt-1">{progress >= 100 ? 'Ready to export' : 'Processing...'}</div>
            </div>
            <div className="flex gap-3">
              <Link
                href={progress >= 100 ? '/create/export' : '#'}
                className={`px-4 py-2 border border-[#444] rounded-lg transition font-medium ${
                  progress >= 100
                    ? 'bg-[#1a1a1a] text-white hover:bg-[#333]'
                    : 'bg-[#1a1a1a] text-gray-600 cursor-not-allowed opacity-50'
                }`}
              >
                {progress >= 100 ? 'Preview Film' : 'Generating...'}
              </Link>
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
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
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
                      <span className="text-xs text-gray-500">Consistency</span>
                      <span className="text-sm font-semibold text-[#4caf50]">✓ {card.consistency}</span>
                    </div>
                  </div>
                </>
              )}

              {card.status === 'generating' && (
                <>
                  <div className="aspect-video bg-[#1a1a1a] border-b-2 border-[#9c27b0] flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin text-3xl mb-2">⚙️</div>
                      <div className="text-xs text-gray-500">Generating</div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="text-sm font-medium mb-3">{card.title}</div>
                    <div className="w-full bg-[#1a1a1a] rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-[#9c27b0] to-[#7b1fa2] h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(progress + 20, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">{Math.min(progress + 20, 100)}%</div>
                  </div>
                </>
              )}

              {card.status === 'queued' && (
                <>
                  <div className="aspect-video bg-[#1a1a1a] flex items-center justify-center opacity-60">
                    <div className="text-4xl">⏳</div>
                  </div>
                  <div className="p-4">
                    <div className="text-sm font-medium">{card.title}</div>
                    <div className="text-xs text-gray-500 mt-2">Queued</div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer Navigation */}
      <div className="border-t border-[#333333] mt-auto pt-6 flex justify-between items-center gap-4">
        <Link href="/create/review" className="px-8 py-3 rounded-xl bg-surface-container-highest text-white font-headline font-bold transition-all hover:scale-105 active:scale-95">
          Back
        </Link>
        <button className="px-10 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-headline font-black transition-all hover:scale-105 active:scale-95">
          GENERATION COMPLETE
        </button>
      </div>
    </main>
  );
}
