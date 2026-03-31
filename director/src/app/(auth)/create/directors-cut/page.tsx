'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePipelineStore } from '@/lib/stores/pipeline-store';
import { useDirectorsBriefStore } from '@/lib/stores/directors-brief-store';
import { useGatedNavigation } from '@/hooks/useGatedNavigation';
import { isBriefComplete } from '@/lib/types/directors-brief';
import type { SequencePlan } from '@/lib/types/sequence-plan';

const TRANSITION_OPTIONS = ['cut', 'dissolve', 'fade', 'wipe', 'match-cut'] as const;

export default function DirectorsCutPage() {
  const router = useRouter();
  const completeStage = usePipelineStore((s) => s.completeStage);

  // Store state
  const brief = useDirectorsBriefStore((s) => s.brief);
  const loading = useDirectorsBriefStore((s) => s.loading);
  const saving = useDirectorsBriefStore((s) => s.saving);
  const updateStoryline = useDirectorsBriefStore((s) => s.updateStoryline);
  const updateVisualStyle = useDirectorsBriefStore((s) => s.updateVisualStyle);
  const addColorToPalette = useDirectorsBriefStore((s) => s.addColorToPalette);
  const removeColorFromPalette = useDirectorsBriefStore((s) => s.removeColorFromPalette);
  const addCinematographyRef = useDirectorsBriefStore((s) => s.addCinematographyRef);
  const removeCinematographyRef = useDirectorsBriefStore((s) => s.removeCinematographyRef);
  const addBeat = useDirectorsBriefStore((s) => s.addBeat);
  const updateBeat = useDirectorsBriefStore((s) => s.updateBeat);
  const removeBeat = useDirectorsBriefStore((s) => s.removeBeat);
  const loadBrief = useDirectorsBriefStore((s) => s.loadBrief);
  const saveBrief = useDirectorsBriefStore((s) => s.saveBrief);

  // Local input state for chip inputs
  const [newColor, setNewColor] = useState('');
  const [newCinRef, setNewCinRef] = useState('');

  // Sequence Plan state (from Creative Director agent analysis)
  const [sequencePlan, setSequencePlan] = useState<SequencePlan | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Gated navigation
  const gating = useGatedNavigation('directors-cut');

  // Hydration safety
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Load brief on mount
  useEffect(() => {
    loadBrief('default-project');
  }, [loadBrief]);

  const handleAddColor = useCallback(() => {
    const trimmed = newColor.trim();
    if (!trimmed) return;
    addColorToPalette(trimmed);
    setNewColor('');
  }, [newColor, addColorToPalette]);

  const handleAddCinRef = useCallback(() => {
    const trimmed = newCinRef.trim();
    if (!trimmed) return;
    addCinematographyRef(trimmed);
    setNewCinRef('');
  }, [newCinRef, addCinematographyRef]);

  const handleAddBeat = useCallback(() => {
    if (!brief) return;
    const nextIndex = brief.narrativeBeats.beats.length + 1;
    addBeat({
      segmentIndex: nextIndex,
      label: '',
      emotion: '',
      transition: 'cut',
    });
  }, [brief, addBeat]);

  const triggerAnalysis = useCallback(async () => {
    if (!brief || !isBriefComplete(brief)) return;
    setAnalyzing(true);
    try {
      const res = await fetch('/api/briefs/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief }),
      });
      if (res.ok) {
        const data = await res.json();
        setSequencePlan(data.sequencePlan);
      }
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setAnalyzing(false);
    }
  }, [brief]);

  const handleAnalyze = useCallback(async () => {
    if (!brief || !isBriefComplete(brief)) return;
    await saveBrief();
    await triggerAnalysis();
  }, [brief, saveBrief, triggerAnalysis]);

  const handleContinue = useCallback(async () => {
    if (!brief || !isBriefComplete(brief)) return;
    await saveBrief();
    await triggerAnalysis();
    completeStage('directors-cut');
    router.push('/create/style-dna');
  }, [brief, saveBrief, triggerAnalysis, completeStage, router]);

  const canContinue = brief !== null && isBriefComplete(brief);

  // Show blocked message if pipeline gating prevents access
  if (hydrated && !gating.canProceed) {
    return (
      <main className="flex-grow flex flex-col items-center justify-center px-6 py-12">
        <div className="text-center space-y-6 max-w-md">
          <span className="material-symbols-outlined text-[64px] text-outline">lock</span>
          <h1 className="text-2xl font-headline font-light tracking-[-0.03em] text-on-surface">Step Locked</h1>
          <p className="text-on-surface-variant">
            Complete &quot;{gating.blockedByLabel}&quot; first to unlock this step.
          </p>
          {gating.blockedByHref && (
            <Link
              href={gating.blockedByHref}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-headline font-bold transition-all hover:scale-105 active:scale-95"
            >
              Go to {gating.blockedByLabel}
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          )}
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex-grow flex items-center justify-center">
        <div className="text-on-surface-variant text-sm">Loading brief...</div>
      </main>
    );
  }

  return (
    <main className="flex-grow flex flex-col md:flex-row w-full max-w-7xl mx-auto px-6 py-12 gap-12">
      {/* Left Column: Form Content */}
      <section className="flex-grow space-y-12">
        {/* Progress Bar */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <span className="text-xs font-label uppercase tracking-[0.2em] text-on-surface-variant">Step 3 of 8</span>
            <span className="text-xs font-label text-primary font-bold">Director&apos;s Cut</span>
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="w-[37.5%] h-full bg-primary rounded-full shadow-[0_0_40px_rgba(198,191,255,0.1)]"></div>
          </div>
        </div>

        {/* Page Heading */}
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-headline font-light tracking-[-0.03em] text-on-surface">Director&apos;s Cut</h1>
          <p className="text-on-surface-variant font-body text-lg">Shape your creative vision. Define the story, the look, and the rhythm.</p>
        </div>

        {/* Section 1: Storyline */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-headline font-light tracking-[-0.03em] text-on-surface">Define Your Story</h2>
            <p className="text-on-surface-variant text-sm">The narrative foundation for your video sequence.</p>
          </div>
          <div className="glass-card rounded-xl p-8 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-label uppercase tracking-widest text-on-surface-variant">Title</label>
              <input
                type="text"
                value={brief?.storyline.title ?? ''}
                onChange={(e) => updateStoryline({ title: e.target.value })}
                placeholder="Working title for your project"
                className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-on-surface placeholder-outline focus:border-primary/30 focus:outline-none transition"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-label uppercase tracking-widest text-on-surface-variant">Synopsis</label>
              <textarea
                rows={4}
                value={brief?.storyline.synopsis ?? ''}
                onChange={(e) => updateStoryline({ synopsis: e.target.value })}
                placeholder="Describe the core narrative arc..."
                className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-on-surface placeholder-outline focus:border-primary/30 focus:outline-none transition resize-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-label uppercase tracking-widest text-on-surface-variant">Theme</label>
              <input
                type="text"
                value={brief?.storyline.theme ?? ''}
                onChange={(e) => updateStoryline({ theme: e.target.value })}
                placeholder="e.g., transformation, discovery, resilience"
                className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-on-surface placeholder-outline focus:border-primary/30 focus:outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Visual Style */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-headline font-light tracking-[-0.03em] text-on-surface">Set the Visual Tone</h2>
            <p className="text-on-surface-variant text-sm">How should your narrative look and feel?</p>
          </div>
          <div className="glass-card rounded-xl p-8 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-label uppercase tracking-widest text-on-surface-variant">Mood</label>
              <input
                type="text"
                value={brief?.visualStyle.mood ?? ''}
                onChange={(e) => updateVisualStyle({ mood: e.target.value })}
                placeholder="e.g., contemplative, energetic, mysterious"
                className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-on-surface placeholder-outline focus:border-primary/30 focus:outline-none transition"
              />
            </div>

            {/* Color Palette */}
            <div className="space-y-2">
              <label className="text-xs font-label uppercase tracking-widest text-on-surface-variant">Color Palette</label>
              <div className="flex flex-wrap gap-2">
                {brief?.visualStyle.colorPalette.map((color, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-2 bg-white/5 rounded-full px-3 py-1.5 text-xs text-on-surface"
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-white/20"
                      style={{ backgroundColor: color }}
                    />
                    {color}
                    <button
                      onClick={() => removeColorFromPalette(i)}
                      className="text-on-surface-variant hover:text-on-surface transition"
                      aria-label={`Remove ${color}`}
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </span>
                ))}
              </div>
              {(brief?.visualStyle.colorPalette.length ?? 0) < 8 && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddColor()}
                    placeholder="e.g., var(--color-primary) or warm gold"
                    className="flex-grow bg-white/[0.03] border border-white/10 rounded-lg px-4 py-2 text-on-surface text-sm placeholder-outline focus:border-primary/30 focus:outline-none transition"
                  />
                  <button
                    onClick={handleAddColor}
                    className="px-4 py-2 rounded-lg border border-primary text-primary text-sm font-bold hover:bg-primary/10 transition"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            {/* Cinematography References */}
            <div className="space-y-2">
              <label className="text-xs font-label uppercase tracking-widest text-on-surface-variant">Cinematography References</label>
              <div className="flex flex-wrap gap-2">
                {brief?.visualStyle.cinematographyRefs.map((ref, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-2 bg-white/5 rounded-full px-3 py-1.5 text-xs text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[14px] text-primary">movie</span>
                    {ref}
                    <button
                      onClick={() => removeCinematographyRef(i)}
                      className="text-on-surface-variant hover:text-on-surface transition"
                      aria-label={`Remove ${ref}`}
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </span>
                ))}
              </div>
              {(brief?.visualStyle.cinematographyRefs.length ?? 0) < 5 && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCinRef}
                    onChange={(e) => setNewCinRef(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCinRef()}
                    placeholder="e.g., Blade Runner, Wes Anderson symmetry"
                    className="flex-grow bg-white/[0.03] border border-white/10 rounded-lg px-4 py-2 text-on-surface text-sm placeholder-outline focus:border-primary/30 focus:outline-none transition"
                  />
                  <button
                    onClick={handleAddCinRef}
                    className="px-4 py-2 rounded-lg border border-primary text-primary text-sm font-bold hover:bg-primary/10 transition"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Narrative Beats */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-headline font-light tracking-[-0.03em] text-on-surface">Map the Emotional Journey</h2>
            <p className="text-on-surface-variant text-sm">Define key moments and transitions between segments.</p>
          </div>
          <div className="glass-card rounded-xl p-8 space-y-4">
            {brief?.narrativeBeats.beats.map((beat, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/10">
                {/* Segment number */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-primary">
                  {i + 1}
                </div>
                {/* Fields */}
                <div className="flex-grow grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-label uppercase tracking-[0.2em] text-on-surface-variant font-bold">Label</label>
                    <input
                      type="text"
                      value={beat.label}
                      onChange={(e) => updateBeat(i, { label: e.target.value })}
                      placeholder="e.g., Opening hook"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-on-surface text-sm placeholder-outline focus:border-primary/30 focus:outline-none transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-label uppercase tracking-[0.2em] text-on-surface-variant font-bold">Emotion</label>
                    <input
                      type="text"
                      value={beat.emotion}
                      onChange={(e) => updateBeat(i, { emotion: e.target.value })}
                      placeholder="e.g., curiosity"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-on-surface text-sm placeholder-outline focus:border-primary/30 focus:outline-none transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-label uppercase tracking-[0.2em] text-on-surface-variant font-bold">Transition</label>
                    <select
                      value={beat.transition}
                      onChange={(e) => updateBeat(i, { transition: e.target.value })}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-on-surface text-sm focus:border-primary/30 focus:outline-none transition appearance-none"
                    >
                      {TRANSITION_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* Remove button */}
                <button
                  onClick={() => removeBeat(i)}
                  className="flex-shrink-0 mt-4 text-on-surface-variant hover:text-red-400 transition"
                  aria-label={`Remove beat ${i + 1}`}
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            ))}

            {(brief?.narrativeBeats.beats.length ?? 0) < 12 && (
              <button
                onClick={handleAddBeat}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-primary text-primary text-sm font-bold hover:bg-primary/10 transition"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Add Beat
              </button>
            )}

            {(brief?.narrativeBeats.beats.length ?? 0) === 0 && (
              <p className="text-outline text-sm italic text-center py-4">No beats yet. Add your first narrative beat to map the emotional journey.</p>
            )}
          </div>
        </div>

        {/* Footer Action Area */}
        <div className="flex justify-between items-center pt-8">
          <Link
            href="/create/brief"
            className="px-8 py-3 rounded-xl bg-surface-container-highest text-on-surface font-headline font-bold transition-all hover:scale-105 active:scale-95"
          >
            Back
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={handleAnalyze}
              disabled={!canContinue || analyzing}
              className="px-6 py-3 rounded-xl border border-primary text-primary font-headline font-bold transition-all hover:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {analyzing ? 'Analyzing...' : 'Preview Plan'}
            </button>
            {canContinue ? (
              <button
                onClick={handleContinue}
                disabled={saving}
                className="px-10 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-headline font-black cinematic-glow transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'CONTINUE'}
              </button>
            ) : (
              <div className="px-10 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-headline font-black opacity-40 cursor-not-allowed">
                CONTINUE
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Right Column: Intelligence Feed Sidebar */}
      <aside className="w-full md:w-80 shrink-0">
        <div className="sticky top-24 glass-card rounded-2xl p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-xs font-label uppercase tracking-widest text-primary">Intelligence Feed</h2>
            <p className="text-sm font-headline font-light tracking-[-0.03em] text-on-surface">What DIRECTOR understands so far</p>
          </div>
          <div className="space-y-4">
            {/* Story Foundation */}
            {brief?.storyline.title || brief?.storyline.theme ? (
              <div className="p-4 rounded-xl bg-white/[0.03] border-l-2 border-primary">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-xs text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="text-[10px] uppercase tracking-wider text-on-surface-variant">Story Foundation</span>
                </div>
                <p className="text-xs text-on-surface leading-relaxed">
                  {brief.storyline.title && <><strong>{brief.storyline.title}</strong><br /></>}
                  {brief.storyline.theme && <span className="text-on-surface-variant">Theme: {brief.storyline.theme}</span>}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-dashed border-white/10 flex flex-col items-center justify-center text-center py-6">
                <span className="material-symbols-outlined text-on-surface-variant/30 text-2xl mb-2">auto_stories</span>
                <p className="text-[10px] text-on-surface-variant italic">Waiting for storyline...</p>
              </div>
            )}

            {/* Visual Direction */}
            {brief?.visualStyle.mood || (brief?.visualStyle.colorPalette.length ?? 0) > 0 ? (
              <div className="p-4 rounded-xl bg-white/[0.03] border-l-2 border-[#81e9ff]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-xs text-[#81e9ff]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="text-[10px] uppercase tracking-wider text-on-surface-variant">Visual Direction</span>
                </div>
                <div className="space-y-1">
                  {brief?.visualStyle.mood && (
                    <p className="text-xs text-on-surface">Mood: {brief.visualStyle.mood}</p>
                  )}
                  {(brief?.visualStyle.colorPalette.length ?? 0) > 0 && (
                    <div className="flex gap-1">
                      {brief?.visualStyle.colorPalette.map((color, i) => (
                        <span
                          key={i}
                          className="w-4 h-4 rounded-full border border-white/20"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-dashed border-white/10 flex flex-col items-center justify-center text-center py-6">
                <span className="material-symbols-outlined text-on-surface-variant/30 text-2xl mb-2">palette</span>
                <p className="text-[10px] text-on-surface-variant italic">Waiting for visual style...</p>
              </div>
            )}

            {/* Beat Map */}
            {(brief?.narrativeBeats.beats.length ?? 0) > 0 ? (
              <div className="p-4 rounded-xl bg-white/[0.03] border-l-2 border-[#c9ff81]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-xs text-[#c9ff81]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="text-[10px] uppercase tracking-wider text-on-surface-variant">Beat Map</span>
                </div>
                <p className="text-xs text-on-surface leading-relaxed">
                  {brief!.narrativeBeats.beats.length} beat{brief!.narrativeBeats.beats.length !== 1 ? 's' : ''} mapped
                  {brief!.narrativeBeats.beats[0]?.label && (
                    <> &middot; First: &quot;{brief!.narrativeBeats.beats[0].label}&quot;</>
                  )}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-dashed border-white/10 flex flex-col items-center justify-center text-center py-6">
                <span className="material-symbols-outlined text-on-surface-variant/30 text-2xl mb-2">timeline</span>
                <p className="text-[10px] text-on-surface-variant italic">Waiting for narrative beats...</p>
              </div>
            )}

            {/* Sequence Plan (from Creative Director agent) */}
            {analyzing && (
              <div className="p-4 rounded-xl bg-white/[0.03] border-l-2 border-primary animate-pulse">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-xs text-primary">auto_awesome</span>
                  <span className="text-[10px] uppercase tracking-wider text-on-surface-variant">Analyzing...</span>
                </div>
                <p className="text-xs text-outline">Creative Director is mapping your vision to segments...</p>
              </div>
            )}

            {sequencePlan && !analyzing && (
              <div className="p-4 rounded-xl bg-white/[0.03] border-l-2 border-[#4cb150]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-xs text-[#4cb150]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="text-[10px] uppercase tracking-wider text-on-surface-variant">Sequence Plan</span>
                </div>
                <p className="text-xs text-on-surface font-bold mb-2">{sequencePlan.overallArc}</p>
                <p className="text-[10px] text-on-surface-variant mb-3">Est. {sequencePlan.estimatedTotalDuration}</p>
                <div className="space-y-2">
                  {sequencePlan.segments.map((seg) => (
                    <div key={seg.index} className="flex items-start gap-2">
                      <span className="text-[10px] font-mono text-primary mt-0.5 shrink-0">{String(seg.index + 1).padStart(2, '0')}</span>
                      <div>
                        <p className="text-xs text-on-surface font-medium">{seg.title}</p>
                        <p className="text-[10px] text-on-surface-variant">{seg.visualDescription}</p>
                        {seg.transitionFromPrevious && (
                          <p className="text-[10px] text-outline italic">via {seg.transitionFromPrevious}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Hint */}
          <div className="pt-4 border-t border-white/10">
            <div className="flex items-start gap-3 opacity-60">
              <span className="material-symbols-outlined text-sm text-[#81e9ff] mt-0.5">lightbulb</span>
              <p className="text-[10px] text-on-surface-variant leading-tight">Your brief feeds into the Creative Director agent, which will compose a sequence plan from your narrative beats and visual preferences.</p>
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}
