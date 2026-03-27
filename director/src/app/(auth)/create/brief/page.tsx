'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function BriefPage() {
  const [selectedPersona, setSelectedPersona] = useState<number | null>(null);

  const personas = [
    {
      id: 1,
      title: 'Modern Professional',
      description: 'Efficiency, ambition, and high-tech minimalism.',
      feedDescription: 'Your audience values streamlined messaging, professional polish, and cutting-edge technology. Recommend: Clean transitions, geometric camera work, minimal soundtrack.',
      icon: 'business_center',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAp1MK9QgLHcriwYNjPdw-PsrcUI1QkPKgWZWAH3lMNCGyxDeQAlBIPOJcKuud9v1WGj74VBCnOT5FMOVJ3Cf1zwxkYe2BBtB2JpCA4qp-pmxvj6ZjOJqX87aOmSuL_8f3f3zydOrm1y-LJzvTXhob97TY_WuEny6QqWli6JdjK_tfCBWQtyzHqpO162kkAUw1DM9r4-OehvquArh0Dj87b1ckC_2STZiu6d7iFQT1TiFJYnE-drWqU4v3g_L_LBlynYKYiaZjVDiA',
      iconColor: '#ff9064',
    },
    {
      id: 2,
      title: 'Gen Z Trendsetter',
      description: 'Bold aesthetics, digital native, and viral potential.',
      feedDescription: 'Your audience thrives on bold visuals, quick cuts, and cultural references. Recommend: Fast pacing, neon color grading, trending audio, dynamic camera movements.',
      icon: 'auto_awesome',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBM6j5jnDGmCss2s0Yhj925QWaPg7ozF5bzYGZppwGJe1BTP9VeNgdiq8poeknarGRM2kWcx3-L35FUNvwLGg28-2qOT6Tydo3dWyZbdrwwcAiR7HA1xVYcaF5ZUeH4y1TdHtDMtVytdHze63YdB4_51bcv_Rkn45ihiksfbmj1WSpnTtXQmhUld_PS_LiC-8YUJWfjOjTdh9-tOpMgE3Ipc-nU6s_slrGYcZRrZA9rhlVgQCTvSbQZ2-AW37BlIGrx3DTmWbmh19k',
      iconColor: '#81e9ff',
    },
    {
      id: 3,
      title: 'Luxury Seeker',
      description: 'Exclusivity, timeless craft, and premium detail.',
      feedDescription: 'Your audience appreciates sophistication, subtle elegance, and exclusivity. Recommend: Slow cinematic pacing, warm lighting, premium color grading, sophisticated soundtrack.',
      icon: 'diamond',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDZLD-yomDoNtAL3hTr7etHfVtivl31DK284T6YK2QbfqU93YDLaRlb_uZvkWlzrXA3FmOq4k5Rg50Q31waTvGx_IQOfM1TgBPUcBdCrL5JZ0toZgx_fFq5CdmzWuoZhAJ3AJf0E5Cx4vdRIPzlIjYqxLX1HzrgDey-7yD1S6rdjcA6T6STL6OcqB2zmfDYhyMl1zp1iH0GTPl6F3NFoYByWr2DSuBs_w9sAycyFP20VN46I7bq-V8UQ6EeopYXYSxIBTw4ABaOTm4',
      iconColor: '#ff9064',
    },
    {
      id: 4,
      title: 'Small Business Owner',
      description: 'Community focus, authenticity, and growth mindset.',
      feedDescription: 'Your audience values authenticity, community connection, and practical results. Recommend: Relatable pacing, warm tones, conversational messaging, genuine testimonials.',
      icon: 'storefront',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBOl2Ffd7VKoaHvQ8UhDZmyRPWmNCGhQ_ABTWg3noyek5QEbSJR1ac90IX9v2KAd-OUrkof5bsNXhu-t8xL33QJxisBtfUghbVBlSQXazuJccJ5PAY1IdYHCi5wCb2LvjY3MYa31zDPbcNwuoYYZndw6ssmF0wFo7DGfP_UuPfX0WmKTPAqRtuFMSCUz_3oeqQM2nedjXDpncnOgI4FxBBfCInjcxQ3tcSS8dpjN2o2LcCK7-7IxycvN-0iRQ4FuGIVf1HqLp7Ka7M',
      iconColor: '#81e9ff',
    },
  ];

  const selectedPersonaData = personas.find(p => p.id === selectedPersona);

  return (
    <main className="flex-grow flex flex-col md:flex-row w-full max-w-7xl mx-auto px-6 py-12 gap-12">
      {/* Left Column: Interrogation Flow */}
      <section className="flex-grow space-y-12">
        {/* Progress Bar Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <span className="text-xs font-label uppercase tracking-[0.2em] text-on-surface-variant">Step 2 of 5</span>
            <span className="text-xs font-label text-primary font-bold">Target Audience Selection</span>
          </div>
          <div className="w-full h-1 bg-[#262626] rounded-full overflow-hidden">
            <div className="w-2/5 h-full bg-[#ff9064] rounded-full shadow-[0_0_40px_rgba(255,144,100,0.1)]"></div>
          </div>
        </div>

        {/* Question Heading */}
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-headline font-black tracking-tighter text-white">Who is this for?</h1>
          <p className="text-on-surface-variant font-body text-lg">Define the protagonist of your brand&apos;s story.</p>
        </div>

        {/* Persona Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {personas.map((persona) => (
            <button
              key={persona.id}
              onClick={() => setSelectedPersona(persona.id)}
              className={`group relative overflow-hidden bg-[#131313] rounded-xl aspect-[4/3] text-left transition-all duration-300 hover:bg-[#262626] border-2 ${
                selectedPersona === persona.id
                  ? 'border-primary ring-4 ring-primary/30'
                  : 'border-[#494847]/10'
              }`}
            >
              <img className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:scale-105 transition-transform duration-700" src={persona.image} alt={persona.title}/>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/60 to-transparent"></div>
              <div className="relative h-full p-6 flex flex-col justify-end">
                <span className="material-symbols-outlined text-[#ff9064] mb-2" style={{color: persona.iconColor}}>{persona.icon}</span>
                <h3 className="font-headline text-xl font-bold text-white">{persona.title}</h3>
                <p className="text-on-surface-variant text-sm mt-1">{persona.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Footer Action Area */}
        <div className="flex justify-between items-center pt-8">
          <Link href="/create/intent" className="px-8 py-3 rounded-xl bg-surface-container-highest text-white font-headline font-bold transition-all hover:scale-105 active:scale-95">Back</Link>
          {selectedPersona ? (
            <Link href="/create/style-dna" className="px-10 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-headline font-black cinematic-glow transition-all hover:scale-105 active:scale-95">CONTINUE</Link>
          ) : (
            <div className="px-10 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-headline font-black opacity-40 cursor-not-allowed">CONTINUE</div>
          )}
        </div>
      </section>

      {/* Right Column: Intelligence Feed Sidebar */}
      <aside className="w-full md:w-80 shrink-0">
        <div className="sticky top-24 bg-[#131313]/50 backdrop-blur-md border border-[#494847]/10 rounded-2xl p-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-xs font-label uppercase tracking-widest text-primary">Intelligence Feed</h2>
            <p className="text-sm font-headline font-bold text-white">What DIRECTOR understands so far</p>
          </div>
          <div className="space-y-4">
            {/* Core Concept Summary */}
            <div className="p-4 rounded-xl bg-[#262626]/40 border-l-2 border-[#ff9064]">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-xs text-[#ff9064]" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                <span className="text-[10px] uppercase tracking-wider text-[#adaaaa]">Core Concept</span>
              </div>
              <p className="text-xs text-white leading-relaxed">Eco-friendly coffee brand with a focus on sustainable sourcing and minimal packaging.</p>
            </div>

            {/* Persona Info or Waiting State */}
            {selectedPersonaData ? (
              <div className="p-4 rounded-xl bg-[#262626]/40 border-l-2 border-[#81e9ff]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-xs text-[#81e9ff]" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                  <span className="text-[10px] uppercase tracking-wider text-[#adaaaa]">Target Audience</span>
                </div>
                <p className="text-xs text-white leading-relaxed">{selectedPersonaData.feedDescription}</p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#000000] border border-dashed border-[#494847]/20 flex flex-col items-center justify-center text-center py-8">
                <span className="material-symbols-outlined text-[#adaaaa]/30 text-3xl mb-2">psychology</span>
                <p className="text-[10px] text-[#adaaaa] italic">Waiting for persona selection to optimize visual tone...</p>
              </div>
            )}
          </div>

          {/* Footer Hint */}
          <div className="pt-4 border-t border-[#494847]/10">
            <div className="flex items-start gap-3 opacity-60">
              <span className="material-symbols-outlined text-sm text-[#81e9ff] mt-0.5">lightbulb</span>
              <p className="text-[10px] text-[#adaaaa] leading-tight">Selecting a persona influences the cinematic lighting and soundtrack suggestions in the next phase.</p>
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}
