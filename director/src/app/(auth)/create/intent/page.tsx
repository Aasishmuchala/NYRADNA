'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function IntentPage() {
  const [visionText, setVisionText] = useState('');

  const handleChipClick = (text: string) => {
    setVisionText(text);
  };

  const isDisabled = visionText.trim() === '';

  return (
    <main className="flex-grow flex flex-col items-center justify-center px-6 relative overflow-hidden pt-20 pb-12">
      {/* Background Vignette/Ambient Light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-3xl z-10 space-y-12">
        {/* Header Section */}
        <div className="space-y-4 text-center">
          <span className="text-primary font-headline font-bold text-xs uppercase tracking-[0.2em]">Step 01: Concept</span>
          <h1 className="font-headline font-extrabold text-4xl md:text-5xl tracking-tight text-white leading-tight">
            What&apos;s the <span className="text-gradient-primary">Vision?</span>
          </h1>
        </div>

        {/* Input Area */}
        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-tertiary/20 rounded-xl blur opacity-30 group-focus-within:opacity-100 transition duration-500"></div>
          <div className="relative surface-container-lowest glass-input rounded-xl overflow-hidden border border-outline-variant/15">
            <textarea
              value={visionText}
              onChange={(e) => setVisionText(e.target.value)}
              className="w-full h-48 md:h-64 bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-on-surface-variant/40 font-body text-lg md:text-xl p-8 resize-none leading-relaxed"
              placeholder="Describe the film you want to make. Don't worry about how — just say what."
            ></textarea>
            {/* Character count or AI Indicator */}
            <div className="absolute bottom-4 right-6 flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-sm" data-icon="auto_awesome" style={{fontVariationSettings: "'FILL' 1"}}>auto_awesome</span>
                <span className="text-on-surface-variant font-label text-[10px] uppercase tracking-widest">AI Intelligence Active</span>
              </div>
              <span className="text-on-surface-variant font-label text-xs">{visionText.length} characters</span>
            </div>
          </div>
        </div>

        {/* Example Chips */}
        <div className="flex flex-col items-center space-y-6">
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => handleChipClick("A 60-second Instagram ad for my activewear brand...")}
              className="bg-surface-container-highest text-on-surface-variant hover:text-white hover:bg-surface-bright px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ease-in-out border border-outline-variant/10"
            >
              &quot;A 60-second Instagram ad for my activewear brand...&quot;
            </button>
            <button
              onClick={() => handleChipClick("A product walkthrough...")}
              className="bg-surface-container-highest text-on-surface-variant hover:text-white hover:bg-surface-bright px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ease-in-out border border-outline-variant/10"
            >
              &quot;A product walkthrough...&quot;
            </button>
            <button
              onClick={() => handleChipClick("A real estate walkthrough...")}
              className="bg-surface-container-highest text-on-surface-variant hover:text-white hover:bg-surface-bright px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ease-in-out border border-outline-variant/10"
            >
              &quot;A real estate walkthrough...&quot;
            </button>
          </div>

          {/* CTA */}
          {isDisabled ? (
            <div className="group mt-8 flex items-center gap-3 bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-headline font-bold px-10 py-4 rounded-xl shadow-[0_10px_30px_rgba(255,144,100,0.2)] opacity-40 cursor-not-allowed">
              <span>Continue</span>
              <span className="material-symbols-outlined transition-transform" data-icon="arrow_forward">arrow_forward</span>
            </div>
          ) : (
            <Link href="/create/brief" className="group mt-8 flex items-center gap-3 bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-headline font-bold px-10 py-4 rounded-xl shadow-[0_10px_30px_rgba(255,144,100,0.2)] hover:shadow-[0_15px_40px_rgba(255,144,100,0.3)] transition-all duration-300 hover:scale-[1.02] active:scale-95">
              <span>Continue</span>
              <span className="material-symbols-outlined transition-transform group-hover:translate-x-1" data-icon="arrow_forward">arrow_forward</span>
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
