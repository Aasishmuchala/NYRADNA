'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useWizard } from '@/context/WizardContext';
import { getSelectedModel } from '@/lib/apiKeyStore';

interface Persona {
  id: number;
  title: string;
  description: string;
  feedDescription: string;
  icon: string;
  iconColor: string;
}

const personas: Persona[] = [
  {
    id: 1,
    title: 'Modern Professional',
    description: 'Efficiency, ambition, and high-tech minimalism.',
    feedDescription: 'Your audience values streamlined messaging, professional polish, and cutting-edge technology. Recommend: Clean transitions, geometric camera work, minimal soundtrack.',
    icon: 'business_center',
    iconColor: 'var(--color-primary)',
  },
  {
    id: 2,
    title: 'Gen Z Trendsetter',
    description: 'Bold aesthetics, digital native, and viral potential.',
    feedDescription: 'Your audience thrives on bold visuals, quick cuts, and cultural references. Recommend: Fast pacing, neon color grading, trending audio, dynamic camera movements.',
    icon: 'auto_awesome',
    iconColor: '#81e9ff',
  },
  {
    id: 3,
    title: 'Luxury Seeker',
    description: 'Exclusivity, timeless craft, and premium detail.',
    feedDescription: 'Your audience appreciates sophistication, subtle elegance, and exclusivity. Recommend: Slow cinematic pacing, warm lighting, premium color grading, sophisticated soundtrack.',
    icon: 'diamond',
    iconColor: 'var(--color-primary)',
  },
  {
    id: 4,
    title: 'Small Business Owner',
    description: 'Community focus, authenticity, and growth mindset.',
    feedDescription: 'Your audience values authenticity, community connection, and practical results. Recommend: Relatable pacing, warm tones, conversational messaging, genuine testimonials.',
    icon: 'storefront',
    iconColor: '#81e9ff',
  },
  {
    id: 5,
    title: 'Creative Artist',
    description: 'Experimental, boundary-pushing, and visually daring.',
    feedDescription: 'Your audience craves originality, abstract storytelling, and unconventional aesthetics. Recommend: Non-linear editing, mixed media overlays, experimental color grading, avant-garde soundtrack.',
    icon: 'brush',
    iconColor: '#8b5cf6',
  },
  {
    id: 6,
    title: 'Fitness & Wellness',
    description: 'Energy, transformation, and aspirational lifestyle.',
    feedDescription: 'Your audience is motivated by energy, progress, and personal transformation. Recommend: Dynamic slow-motion, high-contrast lighting, motivational pacing, powerful bass-driven soundtrack.',
    icon: 'fitness_center',
    iconColor: '#10b981',
  },
  {
    id: 7,
    title: 'Tech Startup',
    description: 'Innovation, disruption, and futuristic vision.',
    feedDescription: 'Your audience responds to forward-thinking narratives, sleek interfaces, and futuristic aesthetics. Recommend: Sci-fi inspired grading, smooth tracking shots, ambient electronic soundtrack, data visualization overlays.',
    icon: 'rocket_launch',
    iconColor: '#06b6d4',
  },
  {
    id: 8,
    title: 'Storyteller',
    description: 'Emotional depth, narrative arcs, and human connection.',
    feedDescription: 'Your audience values deep emotional resonance, character-driven narratives, and authentic moments. Recommend: Documentary-style intimacy, warm natural light, piano/strings soundtrack, slow dissolve transitions.',
    icon: 'menu_book',
    iconColor: '#f59e0b',
  },
];

export default function BriefPage() {
  useEffect(() => {
    document.title = 'Brief — DIRECTOR';
  }, []);

  const { state, update } = useWizard();
  const selectedPersona = state.selectedPersona;

  const [customInput, setCustomInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [customGenerated, setCustomGenerated] = useState(false);

  const selectedPersonaData =
    selectedPersona === 0
      ? {
          title: state.customPersonaTitle || 'Custom Persona',
          feedDescription: state.customPersonaDescription || 'Describe your audience and the AI will generate a cinematic profile.',
        }
      : personas.find(p => p.id === selectedPersona);

  const handleGenerateCustom = async () => {
    if (!customInput.trim()) return;
    setIsGenerating(true);

    try {
      const model = getSelectedModel();

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      const res = await fetch('/api/persona', {
        method: 'POST',
        headers,
        body: JSON.stringify({ description: customInput, model }),
      });

      if (!res.ok) throw new Error('Failed to generate');

      const persona = await res.json();

      update({
        selectedPersona: 0,
        customPersonaTitle: persona.title || 'Custom Persona',
        customPersonaDescription: persona.feedDescription || persona.description || customInput,
        customPersonaTone: persona.tone || '',
        customPersonaAtmosphere: persona.atmosphere || '',
      });
      setCustomGenerated(true);
    } catch (err) {
      console.error('Custom persona generation failed:', err);
      // Fallback: use raw input as persona
      update({
        selectedPersona: 0,
        customPersonaTitle: 'Custom Persona',
        customPersonaDescription: customInput,
        customPersonaTone: '',
        customPersonaAtmosphere: '',
      });
      setCustomGenerated(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const isCustomSelected = selectedPersona === 0;
  const canContinue = selectedPersona !== null && (selectedPersona !== 0 || customGenerated);

  return (
    <main className="flex-grow flex flex-col md:flex-row w-full max-w-7xl mx-auto px-6 py-12 gap-12">
      {/* Left Column */}
      <section className="flex-grow space-y-12">
        {/* Progress Bar */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <span className="text-xs font-label uppercase tracking-[0.2em] text-on-surface-variant">Step 2 of 5</span>
            <span className="text-xs font-label text-primary font-bold">Target Audience Selection</span>
          </div>
          <div className="w-full h-1 bg-surface-bright rounded-full overflow-hidden">
            <div className="w-2/5 h-full bg-primary rounded-full shadow-[0_0_40px_rgba(255,144,100,0.1)]"></div>
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-headline font-black tracking-tighter text-on-surface">Who is this for?</h1>
          <p className="text-on-surface-variant font-body text-lg">Define the protagonist of your brand&apos;s story.</p>
        </div>

        {/* Persona Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {personas.map((persona) => (
            <button
              key={persona.id}
              onClick={() => update({ selectedPersona: persona.id })}
              className={`group relative overflow-hidden bg-surface-container-low rounded-xl aspect-[4/3] text-left transition-all duration-300 hover:bg-surface-container border-2 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                selectedPersona === persona.id
                  ? 'border-primary ring-4 ring-primary/30'
                  : 'border-outline-variant/10'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/80 to-surface/40"></div>
              <div className="relative h-full p-5 flex flex-col justify-end">
                <span className="material-symbols-outlined mb-2 text-[28px]" style={{ color: persona.iconColor }}>{persona.icon}</span>
                <h3 className="font-headline text-lg font-bold text-on-surface">{persona.title}</h3>
                <p className="text-on-surface-variant text-xs mt-1 line-clamp-2">{persona.description}</p>
              </div>
            </button>
          ))}

          {/* Custom Persona Card */}
          <button
            onClick={() => {
              if (!customGenerated) {
                update({ selectedPersona: 0 });
              } else {
                update({ selectedPersona: 0 });
              }
            }}
            className={`group relative overflow-hidden bg-surface-container-low rounded-xl aspect-[4/3] text-left transition-all duration-300 border-2 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
              isCustomSelected
                ? 'border-primary ring-4 ring-primary/30'
                : 'border-dashed border-outline-variant/30 hover:border-outline-variant/60'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/80 to-surface/40"></div>
            <div className="relative h-full p-5 flex flex-col justify-end">
              <span className="material-symbols-outlined mb-2 text-[28px] text-primary">smart_toy</span>
              <h3 className="font-headline text-lg font-bold text-on-surface">
                {customGenerated ? state.customPersonaTitle : 'Custom Persona'}
              </h3>
              <p className="text-on-surface-variant text-xs mt-1">
                {customGenerated
                  ? 'AI-generated persona ready'
                  : 'Describe your audience, AI builds the rest'}
              </p>
            </div>
          </button>
        </div>

        {/* Custom Persona Input */}
        {isCustomSelected && (
          <div className="space-y-4 p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-primary text-sm">smart_toy</span>
              <span className="text-xs uppercase tracking-widest font-bold text-primary">AI Persona Builder</span>
            </div>
            <p className="text-sm text-on-surface-variant">
              Describe your target audience in a few words and the AI will generate a full cinematic persona profile.
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateCustom()}
                placeholder="e.g. Millennial parents who love outdoor adventures"
                className="flex-1 bg-surface border border-outline-variant/20 rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              />
              <button
                onClick={handleGenerateCustom}
                disabled={isGenerating || !customInput.trim()}
                className="px-5 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-headline font-bold text-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                    Generating...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                    Generate
                  </>
                )}
              </button>
            </div>

            {/* Generated persona preview */}
            {customGenerated && state.customPersonaTitle && (
              <div className="mt-4 p-4 rounded-xl bg-surface-bright/40 border-l-2 border-primary space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-headline font-bold text-on-surface">{state.customPersonaTitle}</h4>
                  <button
                    onClick={() => {
                      setCustomGenerated(false);
                      setCustomInput('');
                      update({
                        customPersonaTitle: '',
                        customPersonaDescription: '',
                        customPersonaTone: '',
                        customPersonaAtmosphere: '',
                      });
                    }}
                    className="text-xs text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    Reset
                  </button>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">{state.customPersonaDescription}</p>
                {state.customPersonaTone && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {state.customPersonaTone.split(',').map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px]">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center pt-8">
          <Link href="/create/intent" className="px-8 py-3 rounded-xl bg-surface-container-highest text-on-surface font-headline font-bold transition-all hover:scale-105 active:scale-95">Back</Link>
          {canContinue ? (
            <Link href="/create/character-setup" className="px-10 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-headline font-black cinematic-glow transition-all hover:scale-105 active:scale-95">CONTINUE</Link>
          ) : (
            <div className="px-10 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-headline font-black opacity-40 cursor-not-allowed">CONTINUE</div>
          )}
        </div>
      </section>

      {/* Right Column: Intelligence Feed */}
      <aside className="w-full md:w-80 shrink-0">
        <div className="sticky top-24 bg-surface-container-low/50 backdrop-blur-md border border-outline-variant/10 rounded-2xl p-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-xs font-label uppercase tracking-widest text-primary">Intelligence Feed</h2>
            <p className="text-sm font-headline font-bold text-on-surface">What DIRECTOR understands so far</p>
          </div>
          <div className="space-y-4">
            {/* Core Concept */}
            <div className="p-4 rounded-xl bg-surface-bright/40 border-l-2 border-primary">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-xs text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="text-[10px] uppercase tracking-wider text-on-surface-variant">Core Concept</span>
              </div>
              <p className="text-xs text-on-surface leading-relaxed">{state.visionText || 'Your concept will appear here once defined.'}</p>
            </div>

            {/* Persona Info */}
            {selectedPersonaData ? (
              <div className="p-4 rounded-xl bg-surface-bright/40 border-l-2 border-tertiary">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-xs text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="text-[10px] uppercase tracking-wider text-on-surface-variant">Target Audience</span>
                </div>
                <p className="text-xs text-on-surface leading-relaxed">{selectedPersonaData.feedDescription}</p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-surface-container-lowest border border-dashed border-outline-variant/20 flex flex-col items-center justify-center text-center py-8">
                <span className="material-symbols-outlined text-on-surface-variant/30 text-3xl mb-2">psychology</span>
                <p className="text-[10px] text-on-surface-variant italic">Waiting for persona selection to optimize visual tone...</p>
              </div>
            )}
          </div>

          {/* Footer Hint */}
          <div className="pt-4 border-t border-outline-variant/10">
            <div className="flex items-start gap-3 opacity-60">
              <span className="material-symbols-outlined text-sm text-tertiary mt-0.5">lightbulb</span>
              <p className="text-[10px] text-on-surface-variant leading-tight">Selecting a persona influences the cinematic lighting and soundtrack suggestions in the next phase.</p>
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}
