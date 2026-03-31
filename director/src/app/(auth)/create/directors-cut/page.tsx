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
          <span className="material-symbols-outlined text-[64px] text-[#555]">lock</span>
          <h1 className="text-2xl font-headline font-bold text-white">Step Locked</h1>
          <p className="text-[#A0A0B8]">
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
        <div className="text-[#A0A0B8] text-sm">Loading brief...</div>
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
          <div className="w-full h-1 bg-[#12121A] rounded-full overflow-hidden">
            <div className="w-[37.5%] h-full bg-[#7F72F7] rounded-full shadow-[0_0_40px_rgba(127,114,247,0.1)]"></div>
          </div>
        </div>

        {/* Page Heading */}
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-headline font-black tracking-tighter text-white">Director&apos;s Cut</h1>
          <p className="text-on-surface-variant font-body text-lg">Shape your creative vision. Define the story, the look, and the rhythm.</p>
        </div>

        {/* Section 1: Storyline */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-headline font-bold text-white">Define Your Story</h2>
            <p className="text-on-surface-variant text-sm">The narrative foundation for your video sequence.</p>
          </div>
          <div className="bg-[#1A1A2E] rounded-xl p-6 space-y-4 border border-[#7F72F7]/10">
            <div className="space-y-1">
              <label className="text-xs font-label uppercase tracking-widest text-[#A0A0B8]">Title</label>
              <input
                type="text"
                value={brief?.storyline.title ?? ''}
                onChange={(e) => updateStoryline({ title: e.target.value })}
                placeholder="Working title for your project"
                className="w-full bg-[#0A0A0F] border border-[#7F72F7]/10 rounded-lg px-4 py-3 text-white placeholder-[#555] focus:border-[#7F72F7] focus:outline-none transition"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-label uppercase tracking-widest text-[#A0A0B8]">Synopsis</label>
              <textarea
                rows={4}
                value={brief?.storyline.synopsis ?? ''}
                onChange={(e) => updateStoryline({ synopsis: e.target.value })}
                placeholder="Describe the core narrative arc..."
                className="w-full bg-[#0A0A0F] border border-[#7F72F7]/10 rounded-lg px-4 py-3 text-white placeholder-[#555] focus:border-[#7F72F7] focus:outline-none transition resize-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-label uppercase tracking-widest text-[#A0A0B8]">Theme</label>
              <input
                type="text"
                value={brief?.storyline.theme ?? ''}
                onChange={(e) => updateStoryline({ theme: e.target.value })}
                placeholder="e.g., transformation, discovery, resilience"
                className="w-full bg-[#0A0A0F] border border-[#7F72F7]/10 rounded-lg px-4 py-3 text-white placeholder-[#555] focus:border-[#7F72F7] focus:outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Visual Style */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-headline font-bold text-white">Set the Visual Tone</h2>
            <p className="text-on-surface-variant text-sm">How should your narrative look and feel?</p>
          </div>
          <div className="bg-[#1A1A2E] rounded-xl p-6 space-y-4 border border-[#7F72F7]/10">
            <div className="space-y-1">
              <label className="text-xs font-label uppercase tracking-widest text-[#A0A0B8]">Mood</label>
              <input
                type="text"
                value={brief?.visualStyle.mood ?? ''}
                onChange={(e) => updateVisualStyle({ mood: e.target.value })}
                placeholder="e.g., contemplative, energetic, mysterious"
                className="w-full bg-[#0A0A0F] border border-[#7F72F7]/10 rounded-lg px-4 py-3 text-white placeholder-[#555] focus:border-[#7F72F7] focus:outline-none transition"
              />
            </div>

            {/* Color Palette */}
            <div className="space-y-2">
              <label className="text-xs font-label uppercase tracking-widest text-[#A0A0B8]">Color Palette</label>
              <div className="flex flex-wrap gap-2">
                {brief?.visualStyle.colorPalette.map((color, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-2 bg-[#12121A] rounded-full px-3 py-1.5 text-xs text-white"
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-white/20"
                      style={{ backgroundColor: color }}
                    />
                    {color}
                    <button
                      onClick={() => removeColorFromPalette(i)}
                      className="text-[#A0A0B8] hover:text-white transition"
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
                    placeholder="e.g., #7F72F7 or warm gold"
                    className="flex-grow bg-[#0A0A0F] border border-[#7F72F7]/10 rounded-lg px-4 py-2 text-white text-sm placeholder-[#555] focus:border-[#7F72F7] focus:outline-none transition"
                  />
                  <button
                    onClick={handleAddColor}
                    className="px-4 py-2 rounded-lg border border-[#7F72F7] text-[#7F72F7] text-sm font-bold hover:bg-[#7F72F7]/10 transition"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            {/* Cinematography References */}
            <div className="space-y-2">
              <label className="text-xs font-label uppercase tracking-widest text-[#A0A0B8]">Cinematography References</label>
              <div className="flex flex-wrap gap-2">
                {brief?.visualStyle.cinematographyRefs.map((ref, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-2 bg-[#12121A] rounded-full px-3 py-1.5 text-xs text-white"
                  >
                    <span className="material-symbols-outlined text-[14px] text-[#7F72F7]">movie</span>
                    {ref}
                    <button
                      onClick={() => removeCinematographyRef(i)}
                      className="text-[#A0A0B8] hover:text-white transition"
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
                    className="flex-grow bg-[#0A0A0F] border border-[#7F72F7]/10 rounded-lg px-4 py-2 text-white text-sm placeholder-[#555] focus:border-[#7F72F7] focus:outline-none transition"
                  />
                  <button
                    onClick={handleAddCinRef}
                    className="px-4 py-2 rounded-lg border border-[#7F72F7] text-[#7F72F7] text-sm font-bold hover:bg-[#7F72F7]/10 transition"
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
            <h2 className="text-2xl font-headline font-bold text-white">Map the Emotional Journey</h2>
            <p className="text-on-surface-variant text-sm">Define key moments and transitions between segments.</p>
          </div>
          <div className="bg-[#1A1A2E] rounded-xl p-6 space-y-4 border border-[#7F72F7]/10">
            {brief?.narrativeBeats.beats.map((beat, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[#0A0A0F] border border-[#7F72F7]/10">
                {/* Segment number */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#12121A] flex items-center justify-center text-xs font-bold text-[#7F72F7]">
                  {i + 1}
                </div>
                {/* Fields */}
                <div className="flex-grow grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-label uppercase tracking-widest text-[#A0A0B8]">Label</label>
                    <input
                      type="text"
                      value={beat.label}
                      onChange={(e) => updateBeat(i, { label: e.target.value })}
                      placeholder="e.g., Opening hook"
                      className="w-full bg-[#1A1A2E] border border-[#7F72F7]/10 rounded-lg px-3 py-2 text-white text-sm placeholder-[#555] focus:border-[#7F72F7] focus:outline-none transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-label uppercase tracking-widest text-[#A0A0B8]">Emotion</label>
                    <input
                      type="text"
                      value={beat.emotion}
                      onChange={(e) => updateBeat(i, { emotion: e.target.value })}
                      placeholder="e.g., curiosity"
                      className="w-full bg-[#1A1A2E] border border-[#7F72F7]/10 rounded-lg px-3 py-2 text-white text-sm placeholder-[#555] focus:border-[#7F72F7] focus:outline-none transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-label uppercase tracking-widest text-[#A0A0B8]">Transition</label>
                    <select
                      value={beat.transition}
                      onChange={(e) => updateBeat(i, { transition: e.target.value })}
                      className="w-full bg-[#1A1A2E] border border-[#7F72F7]/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#7F72F7] focus:outline-none transition appearance-none"
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
                  className="flex-shrink-0 mt-4 text-[#A0A0B8] hover:text-red-400 transition"
                  aria-label={`Remove beat ${i + 1}`}
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            ))}

            {(brief?.narrativeBeats.beats.length ?? 0) < 12 && (
              <button
                onClick={handleAddBeat}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#7F72F7] text-[#7F72F7] text-sm font-bold hover:bg-[#7F72F7]/10 transition"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Add Beat
              </button>
            )}

            {(brief?.narrativeBeats.beats.length ?? 0) === 0 && (
              <p className="text-[#555] text-sm italic text-center py-4">No beats yet. Add your first narrative beat to map the emotional journey.</p>
            )}
          </div>
        </div>

        {/* Footer Action Area */}
        <div className="flex justify-between items-center pt-8">
          <Link
            href="/create/brief"
            className="px-8 py-3 rounded-xl bg-surface-container-highest text-white font-headline font-bold transition-all hover:scale-105 active:scale-95"
          >
            Back
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={handleAnalyze}
              disabled={!canContinue || analyzing}
              className="px-6 py-3 rounded-xl border border-[#7F72F7] text-[#7F72F7] font-headline font-bold transition-all hover:bg-[#7F72F7]/10 disabled:opacity-40 disabled:cursor-not-allowed"
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
        <div className="sticky top-24 bg-[#1A1A2E]/50 backdrop-blur-md border border-[#7F72F7]/10 rounded-2xl p-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-xs font-label uppercase tracking-widest text-primary">Intelligence Feed</h2>
            <p className="text-sm font-headline font-bold text-white">What DIRECTOR understands so far</p>
          </div>
          <div className="space-y-4">
            {/* Story Foundation */}
            {brief?.storyline.title || brief?.storyline.theme ? (
              <div className="p-4 rounded-xl bg-[#12121A]/40 border-l-2 border-[#7F72F7]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-xs text-[#7F72F7]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="text-[10px] uppercase tracking-wider text-[#A0A0B8]">Story Foundation</span>
                </div>
                <p className="text-xs text-white leading-relaxed">
                  {brief.storyline.title && <><strong>{brief.storyline.title}</strong><br /></>}
                  {brief.storyline.theme && <span className="text-[#A0A0B8]">Theme: {brief.storyline.theme}</span>}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#0A0A0F] border border-dashed border-[#7F72F7]/10 flex flex-col items-center justify-center text-center py-6">
                <span className="material-symbols-outlined text-[#A0A0B8]/30 text-2xl mb-2">auto_stories</span>
                <p className="text-[10px] text-[#A0A0B8] italic">Waiting for storyline...</p>
              </div>
            )}

            {/* Visual Direction */}
            {brief?.visualStyle.mood || (brief?.visualStyle.colorPalette.length ?? 0) > 0 ? (
              <div className="p-4 rounded-xl bg-[#12121A]/40 border-l-2 border-[#81e9ff]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-xs text-[#81e9ff]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="text-[10px] uppercase tracking-wider text-[#A0A0B8]">Visual Direction</span>
                </div>
                <div className="space-y-1">
                  {brief?.visualStyle.mood && (
                    <p className="text-xs text-white">Mood: {brief.visualStyle.mood}</p>
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
              <div className="p-4 rounded-xl bg-[#0A0A0F] border border-dashed border-[#7F72F7]/10 flex flex-col items-center justify-center text-center py-6">
                <span className="material-symbols-outlined text-[#A0A0B8]/30 text-2xl mb-2">palette</span>
                <p className="text-[10px] text-[#A0A0B8] italic">Waiting for visual style...</p>
              </div>
            )}

            {/* Beat Map */}
            {(brief?.narrativeBeats.beats.length ?? 0) > 0 ? (
              <div className="p-4 rounded-xl bg-[#12121A]/40 border-l-2 border-[#c9ff81]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-xs text-[#c9ff81]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="text-[10px] uppercase tracking-wider text-[#A0A0B8]">Beat Map</span>
                </div>
                <p className="text-xs text-white leading-relaxed">
                  {brief!.narrativeBeats.beats.length} beat{brief!.narrativeBeats.beats.length !== 1 ? 's' : ''} mapped
                  {brief!.narrativeBeats.beats[0]?.label && (
                    <> &middot; First: &quot;{brief!.narrativeBeats.beats[0].label}&quot;</>
                  )}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#0A0A0F] border border-dashed border-[#7F72F7]/10 flex flex-col items-center justify-center text-center py-6">
                <span className="material-symbols-outlined text-[#A0A0B8]/30 text-2xl mb-2">timeline</span>
                <p className="text-[10px] text-[#A0A0B8] italic">Waiting for narrative beats...</p>
              </div>
            )}

            {/* Sequence Plan (from Creative Director agent) */}
            {analyzing && (
              <div className="p-4 rounded-xl bg-[#12121A]/40 border-l-2 border-[#7F72F7] animate-pulse">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-xs text-[#7F72F7]">auto_awesome</span>
                  <span className="text-[10px] uppercase tracking-wider text-[#A0A0B8]">Analyzing...</span>
                </div>
                <p className="text-xs text-[#555]">Creative Director is mapping your vision to segments...</p>
              </div>
            )}

            {sequencePlan && !analyzing && (
              <div className="p-4 rounded-xl bg-[#12121A]/40 border-l-2 border-[#4cb150]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-xs text-[#4cb150]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="text-[10px] uppercase tracking-wider text-[#A0A0B8]">Sequence Plan</span>
                </div>
                <p className="text-xs text-white font-bold mb-2">{sequencePlan.overallArc}</p>
                <p className="text-[10px] text-[#A0A0B8] mb-3">Est. {sequencePlan.estimatedTotalDuration}</p>
                <div className="space-y-2">
                  {sequencePlan.segments.map((seg) => (
                    <div key={seg.index} className="flex items-start gap-2">
                      <span className="text-[10px] font-mono text-[#7F72F7] mt-0.5 shrink-0">{String(seg.index + 1).padStart(2, '0')}</span>
                      <div>
                        <p className="text-xs text-white font-medium">{seg.title}</p>
                        <p className="text-[10px] text-[#A0A0B8]">{seg.visualDescription}</p>
                        {seg.transitionFromPrevious && (
                          <p className="text-[10px] text-[#555] italic">via {seg.transitionFromPrevious}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Hint */}
          <div className="pt-4 border-t border-[#7F72F7]/10">
            <div className="flex items-start gap-3 opacity-60">
              <span className="material-symbols-outlined text-sm text-[#81e9ff] mt-0.5">lightbulb</span>
              <p className="text-[10px] text-[#A0A0B8] leading-tight">Your brief feeds into the Creative Director agent, which will compose a sequence plan from your narrative beats and visual preferences.</p>
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}
