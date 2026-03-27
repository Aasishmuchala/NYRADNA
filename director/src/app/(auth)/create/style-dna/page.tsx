'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function StyleDnaPage() {
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('16:9');
  const [selectedPacing, setSelectedPacing] = useState<'quick' | 'balanced' | 'slow'>('balanced');
  const [selectedLighting, setSelectedLighting] = useState<'warm' | 'cool' | 'high-contrast' | 'mood'>('high-contrast');
  const [selectedCameraMotion, setSelectedCameraMotion] = useState('Handheld Cinematic');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const colors = [
    { name: 'Action Orange', value: '#ff9064' },
    { name: 'Electric Blue', value: '#00e0ff' },
    { name: 'Cyber Purple', value: '#8b5cf6' },
    { name: 'Neon Pink', value: '#ec4899' },
    { name: 'Matrix Green', value: '#10b981' },
  ];

  const cameraOptions = [
    'Handheld Cinematic',
    'Dolly Smooth',
    'Drone Sweep',
    'Static Frame',
    'Gimbal Drift',
    'Whip Pan',
  ];

  const getPacingPercentage = () => {
    if (selectedPacing === 'quick') return 33;
    if (selectedPacing === 'balanced') return 50;
    return 100;
  };

  return (
    <main className="flex h-screen">
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
            {colors.map((color, index) => (
              <button
                key={index}
                onClick={() => setSelectedColor(index)}
                className={`w-12 h-16 rounded-lg transition-transform hover:scale-105 ${
                  selectedColor === index
                    ? 'border-2 border-white ring-4 ring-primary/20'
                    : 'border-2 border-transparent'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              ></button>
            ))}
          </div>
        </div>

        {/* Aspect Ratio */}
        <div className="space-y-4">
          <label className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">Aspect Ratio</label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setSelectedAspectRatio('9:16')}
              className={`flex flex-col items-center justify-center p-4 rounded-xl transition-colors group ${
                selectedAspectRatio === '9:16'
                  ? 'bg-surface-container-highest border-2 border-primary'
                  : 'bg-surface-container-highest border border-outline-variant/15 hover:bg-surface-bright'
              }`}
            >
              <div className={`w-4 h-7 border-2 rounded-sm mb-2 ${
                selectedAspectRatio === '9:16' ? 'border-primary' : 'border-on-surface-variant group-hover:border-primary'
              }`}></div>
              <span className={`text-xs font-medium ${selectedAspectRatio === '9:16' ? 'text-primary font-bold' : ''}`}>9:16</span>
            </button>
            <button
              onClick={() => setSelectedAspectRatio('16:9')}
              className={`flex flex-col items-center justify-center p-4 rounded-xl transition-colors group ${
                selectedAspectRatio === '16:9'
                  ? 'bg-surface-container-highest border-2 border-primary'
                  : 'bg-surface-container-highest border border-outline-variant/15 hover:bg-surface-bright'
              }`}
            >
              <div className={`w-8 h-4.5 border-2 rounded-sm mb-2 ${
                selectedAspectRatio === '16:9' ? 'border-primary' : 'border-on-surface-variant group-hover:border-primary'
              }`}></div>
              <span className={`text-xs font-medium ${selectedAspectRatio === '16:9' ? 'text-primary font-bold' : ''}`}>16:9</span>
            </button>
            <button
              onClick={() => setSelectedAspectRatio('1:1')}
              className={`flex flex-col items-center justify-center p-4 rounded-xl transition-colors group ${
                selectedAspectRatio === '1:1'
                  ? 'bg-surface-container-highest border-2 border-primary'
                  : 'bg-surface-container-highest border border-outline-variant/15 hover:bg-surface-bright'
              }`}
            >
              <div className={`w-6 h-6 border-2 rounded-sm mb-2 ${
                selectedAspectRatio === '1:1' ? 'border-primary' : 'border-on-surface-variant group-hover:border-primary'
              }`}></div>
              <span className={`text-xs font-medium ${selectedAspectRatio === '1:1' ? 'text-primary font-bold' : ''}`}>1:1</span>
            </button>
          </div>
        </div>

        {/* Pacing Slider */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">Pacing</label>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded capitalize">{selectedPacing}</span>
          </div>
          <div className="relative h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary to-primary-container transition-all duration-300"
              style={{ width: `${getPacingPercentage()}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] uppercase font-bold px-1">
            <button
              onClick={() => setSelectedPacing('quick')}
              className={`transition-colors ${selectedPacing === 'quick' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
            >
              Quick
            </button>
            <button
              onClick={() => setSelectedPacing('balanced')}
              className={`transition-colors ${selectedPacing === 'balanced' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
            >
              Balanced
            </button>
            <button
              onClick={() => setSelectedPacing('slow')}
              className={`transition-colors ${selectedPacing === 'slow' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
            >
              Slow
            </button>
          </div>
        </div>

        {/* Lighting Selection */}
        <div className="space-y-4">
          <label className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">Lighting Environment</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedLighting('warm')}
              className={`px-4 py-3 rounded-lg bg-surface-container-highest flex items-center gap-3 transition-all border-2 ${
                selectedLighting === 'warm' ? 'border-primary' : 'border-outline-variant/15 hover:border-primary/50'
              }`}
            >
              <span className="material-symbols-outlined text-orange-400">light_mode</span>
              <span className={`text-sm ${selectedLighting === 'warm' ? 'font-bold text-primary' : 'font-medium'}`}>Warm</span>
            </button>
            <button
              onClick={() => setSelectedLighting('cool')}
              className={`px-4 py-3 rounded-lg bg-surface-container-highest flex items-center gap-3 transition-all border-2 ${
                selectedLighting === 'cool' ? 'border-primary' : 'border-outline-variant/15 hover:border-primary/50'
              }`}
            >
              <span className={`material-symbols-outlined ${selectedLighting === 'cool' ? 'text-primary' : 'text-[#81e9ff]'}`}>ac_unit</span>
              <span className={`text-sm ${selectedLighting === 'cool' ? 'font-bold text-primary' : 'font-medium'}`}>Cool</span>
            </button>
            <button
              onClick={() => setSelectedLighting('high-contrast')}
              className={`px-4 py-3 rounded-lg bg-surface-container-highest flex items-center gap-3 transition-all border-2 ${
                selectedLighting === 'high-contrast' ? 'border-primary' : 'border-outline-variant/15 hover:border-primary/50'
              }`}
            >
              <span className={`material-symbols-outlined ${selectedLighting === 'high-contrast' ? 'text-primary' : 'text-on-surface-variant'}`}>exposure</span>
              <span className={`text-sm ${selectedLighting === 'high-contrast' ? 'font-bold text-primary' : 'font-medium'}`}>High-contrast</span>
            </button>
            <button
              onClick={() => setSelectedLighting('mood')}
              className={`px-4 py-3 rounded-lg bg-surface-container-highest flex items-center gap-3 transition-all border-2 ${
                selectedLighting === 'mood' ? 'border-primary' : 'border-outline-variant/15 hover:border-primary/50'
              }`}
            >
              <span className={`material-symbols-outlined ${selectedLighting === 'mood' ? 'text-primary' : 'text-on-surface-variant'}`}>wb_twilight</span>
              <span className={`text-sm ${selectedLighting === 'mood' ? 'font-bold text-primary' : 'font-medium'}`}>Mood</span>
            </button>
          </div>
        </div>

        {/* Camera Style Dropdown */}
        <div className="space-y-4">
          <label className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">Camera Motion</label>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full bg-surface-container-highest px-4 py-4 rounded-xl flex items-center justify-between border border-outline-variant/15 hover:bg-surface-bright transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-tertiary">videocam</span>
                <span className="text-sm font-medium">{selectedCameraMotion}</span>
              </div>
              <span className={`material-symbols-outlined text-on-surface-variant transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-highest border border-outline-variant/15 rounded-xl overflow-hidden shadow-lg z-10">
                {cameraOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setSelectedCameraMotion(option);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-sm text-left transition-colors ${
                      selectedCameraMotion === option
                        ? 'bg-primary/20 text-primary font-medium'
                        : 'text-on-surface hover:bg-surface-bright'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CTA Bottom */}
        <div className="mt-auto pt-6 border-t border-outline-variant/10 flex gap-4">
          <Link href="/create/brief" className="flex-1 py-4 rounded-xl bg-surface-container-highest text-on-surface font-headline font-bold hover:bg-surface-bright transition-all">
            Back
          </Link>
          <Link href="/create/character-setup" className="flex-1 py-4 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-headline font-extrabold tracking-tight hover:shadow-[0_0_20px_rgba(255,144,100,0.3)] transition-all active:scale-95 text-center">
            Lock Style DNA & Continue
          </Link>
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

          {/* Center Play State */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-primary/20 backdrop-blur-xl border border-primary/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary scale-150" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
