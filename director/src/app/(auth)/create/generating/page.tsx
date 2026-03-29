'use client';

import Link from 'next/link';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useWizard } from '@/context/WizardContext';
import { useVideoGeneration } from '@/hooks/useVideoGeneration';
import { AlertModal } from '@/components/ui/Modal';
import { estimateCost } from '@/lib/continuityEngine';
import { VIDEO_MODELS } from '@/lib/models';
import { buildVideoStyleSuffix } from '@/lib/cinematicPrompt';
import { buildReferenceImageSet } from '@/lib/subjectRefs';
import dynamic from 'next/dynamic';
import { PipelineProvider } from '@/context/PipelineContext';
import { DIRECTOR_PIPELINE } from '@/lib/pipeline/presets';

const NodeCanvas = dynamic(() => import('@/components/pipeline/NodeCanvas').then(m => ({ default: m.NodeCanvas })), {
  ssr: false,
  loading: () => <div className="flex-1 flex items-center justify-center text-white/20 text-sm">Loading editor...</div>,
});

export default function GeneratingPage() {
  useEffect(() => {
    document.title = 'Generating — DIRECTOR';
  }, []);

  const { state, update } = useWizard();
  const { generateAllVideos, retryVideo, stopAll, videos, batches, isGenerating, progress, currentBatchLabel, totalDuration, error } = useVideoGeneration();
  const [hasMounted, setHasMounted] = useState(false);
  const [phase, setPhase] = useState<'planning' | 'production'>('planning');
  const [isDirecting, setIsDirecting] = useState(false);
  const [directError, setDirectError] = useState<string | null>(null);
  const [pipelineMode, setPipelineMode] = useState<'simple' | 'node'>('simple');
  const autoDirectedRef = useRef(false);
  useEffect(() => { setHasMounted(true); }, []);

  // Auto-switch to production phase when generation starts or videos exist
  useEffect(() => {
    if (isGenerating || videos.length > 0) setPhase('production');
  }, [isGenerating, videos.length]);

  const completedScenes = useMemo(
    () => state.scenes
      .filter((s) => s.status === 'completed' && s.imageUrl)
      .filter((s, i, arr) => arr.findIndex((x) => x.id === s.id) === i),
    [state.scenes]
  );

  // Auto-run Director AI when scenes arrive without video prompts
  useEffect(() => {
    if (autoDirectedRef.current || isDirecting || !hasMounted) return;
    if (completedScenes.length === 0) return;
    const hasVideoPrompts = completedScenes.some(s => s.videoPrompt && s.videoPrompt.length > 50);
    if (!hasVideoPrompts) {
      autoDirectedRef.current = true;
      handleDirectorCut();
    }
  }, [hasMounted, completedScenes.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const completedVideos = videos.filter(v => v.status === 'completed');
  const failedVideos = videos.filter(v => v.status === 'failed');
  const approvedCount = completedScenes.filter(s => s.videoApproved !== false).length;
  const allDone = completedVideos.length > 0 && completedVideos.length >= approvedCount;

  const selectedModel = VIDEO_MODELS.find(m => m.id === state.selectedVideoModel);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  // ── Handlers ──────────────────────────────────────────────────

  const handleUpdatePrompt = (sceneId: string, prompt: string) => {
    update({
      scenes: state.scenes.map(s =>
        s.id === sceneId ? { ...s, videoPrompt: prompt } : s
      ),
    });
  };

  const handleToggleApproval = (sceneId: string) => {
    update({
      scenes: state.scenes.map(s =>
        s.id === sceneId ? { ...s, videoApproved: s.videoApproved === false ? true : false } : s
      ),
    });
  };

  const handleDirectorCut = async () => {
    setIsDirecting(true);
    setDirectError(null);
    try {
      // Pre-sort scenes by cinematic priority: location/character first, wardrobe/prop/accessory later
      const categoryPriority: Record<string, number> = {
        location: 1, character: 2, vehicle: 3, wardrobe: 4, prop: 5, accessory: 6,
      };
      const sortedScenes = [...completedScenes].sort((a, b) => {
        const pa = categoryPriority[a.assetCategory ?? ''] ?? 3;
        const pb = categoryPriority[b.assetCategory ?? ''] ?? 3;
        return pa - pb;
      });
      const scenesPayload = sortedScenes.map((s, idx) => ({
        id: s.id,
        prompt: s.prompt,
        imageUrl: s.imageUrl,
        assetCategory: s.assetCategory,
        sceneIndex: idx,
        videoMotionPrompt: s.videoMotionPrompt,
      }));

      const contextPayload = {
        visionText: state.visionText,
        selectedPersona: state.selectedPersona,
        customPersonaTone: state.customPersonaTone,
        customPersonaAtmosphere: state.customPersonaAtmosphere,
        colorIndex: state.colorIndex,
        aspectRatio: state.aspectRatio,
        pacing: state.pacing,
        lighting: state.lighting,
        cameraMotion: state.cameraMotion,
        characterName: state.characterName,
        characterGender: state.characterGender,
        aiDescription: state.aiDescription,
        triggerWord: state.triggerWord,
        loraUrl: state.loraUrl,
        selectedVideoModel: state.selectedVideoModel,
        includeAudio: state.includeAudio,
        styleSuffix: buildVideoStyleSuffix(state),
      };

      // Build continuity bible from production assets + reference image tag map
      const refSet = buildReferenceImageSet({
        productionAssets: state.productionAssets,
        aiCharacterImageUrl: state.aiCharacterImageUrl,
        styleLockImages: state.styleLockImages,
      });

      const continuityBible: { name: string; imageTag: string; description: string; category: string }[] = [];
      const succeededAssets = (state.productionAssets || []).filter(a => a.status === 'succeeded' && a.imageUrl);
      for (const asset of succeededAssets) {
        const tag = refSet.tagMap.get(asset.id);
        if (tag) {
          continuityBible.push({
            name: asset.name,
            imageTag: tag,
            description: asset.description,
            category: asset.category,
          });
        }
      }
      // AI character fallback
      if (refSet.tagMap.has('ai-character') && state.characterName) {
        continuityBible.push({
          name: state.characterName,
          imageTag: refSet.tagMap.get('ai-character')!,
          description: state.aiDescription || 'Main character',
          category: 'character',
        });
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      const res = await fetch('/api/direct-video', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          scenes: scenesPayload,
          context: contextPayload,
          continuityBible: continuityBible.length > 0 ? continuityBible : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Director AI failed');
      }

      const { prompts } = await res.json();

      type DirectorPrompt = { sceneId: string; videoPrompt: string; imagePrompt?: string; directorNote?: string };

      // Separate existing scene prompts from new scene requests
      const existingPrompts: DirectorPrompt[] = [];
      const newSceneRequests: DirectorPrompt[] = [];
      for (const p of prompts as DirectorPrompt[]) {
        if (p.sceneId.startsWith('new-') && p.imagePrompt) {
          newSceneRequests.push(p);
        } else {
          existingPrompts.push(p);
        }
      }

      // Generate images for new scenes the Director AI requested
      const newScenes: typeof state.scenes = [];
      if (newSceneRequests.length > 0) {
        setDirectError(null);
        for (const req of newSceneRequests) {
          try {
            const genRes = await fetch('/api/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt: req.imagePrompt,
                imageModelId: state.selectedImageModel,
                aspectRatio: state.aspectRatio,
              }),
            });
            if (!genRes.ok) continue;
            const { predictionId } = await genRes.json();

            // Poll for completion
            let imageUrl: string | null = null;
            for (let poll = 0; poll < 120; poll++) {
              await new Promise(r => setTimeout(r, 2000));
              const statusRes = await fetch(`/api/status/${predictionId}`);
              const statusData = await statusRes.json();
              if (statusData.status === 'succeeded') {
                imageUrl = Array.isArray(statusData.output) ? statusData.output[0] : statusData.output;
                break;
              }
              if (statusData.status === 'failed' || statusData.status === 'canceled') break;
            }

            if (imageUrl) {
              newScenes.push({
                id: `scene-${req.sceneId}-${Date.now()}`,
                prompt: req.imagePrompt!,
                imageUrl,
                status: 'completed' as const,
                predictionId,
                error: null,
                videoPrompt: req.videoPrompt,
                videoApproved: true,
                imageModelId: state.selectedImageModel,
                directorSceneId: req.sceneId,
              });
            }
          } catch {
            // Non-blocking — skip failed new scene generation
          }
        }
      }

      // Build the full scene list with Director AI's narrative order
      const allPrompts = prompts as DirectorPrompt[];
      const promptMap = new Map(allPrompts.map(p => [p.sceneId, p.videoPrompt]));
      const directorOrder = allPrompts.map(p => p.sceneId);

      const sceneMap = new Map(state.scenes.map(s => [s.id, s]));
      // Also index new scenes by their director sceneId
      const newSceneMap = new Map(newScenes.map(s => [s.directorSceneId!, s]));

      const orderedScenes = directorOrder
        .map((id: string) => {
          // Check existing scenes first, then new scenes
          const existing = sceneMap.get(id);
          if (existing) {
            return { ...existing, videoPrompt: promptMap.get(id) || existing.videoPrompt, videoApproved: true };
          }
          const newScene = newSceneMap.get(id);
          if (newScene) return newScene;
          return null;
        })
        .filter(Boolean) as typeof state.scenes;

      // Append any scenes not included by the director
      const directedIds = new Set(directorOrder);
      const remainingScenes = state.scenes.filter(s => !directedIds.has(s.id));

      update({
        scenes: [...orderedScenes, ...remainingScenes],
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Director AI failed';
      setDirectError(msg);
    } finally {
      setIsDirecting(false);
    }
  };

  const handleApproveAll = () => {
    update({
      scenes: state.scenes.map(s => ({ ...s, videoApproved: true })),
    });
  };

  const handleToggleStyleLock = (imageUrl: string) => {
    const current = state.styleLockImages || [];
    if (current.includes(imageUrl)) {
      update({ styleLockImages: current.filter(u => u !== imageUrl) });
    } else if (current.length < 4) {
      update({ styleLockImages: [...current, imageUrl] });
    }
  };

  const handleStartProduction = () => {
    const approved = completedScenes
      .filter(s => s.videoApproved !== false)
      .map(s => s.id);
    if (approved.length === 0) return;
    setPhase('production');
    generateAllVideos(approved);
  };

  // ── Loading ───────────────────────────────────────────────────

  if (!hasMounted) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-sm text-on-surface-variant">Loading pipeline...</span>
        </div>
      </main>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // NODE PIPELINE MODE
  // ══════════════════════════════════════════════════════════════

  if (pipelineMode === 'node') {
    return (
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mode toggle */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-surface-container-low/80">
          <button
            onClick={() => setPipelineMode('simple')}
            className="text-xs text-white/40 hover:text-white/60 px-2 py-1 rounded"
          >
            Simple
          </button>
          <button
            className="text-xs text-primary bg-primary/10 px-2 py-1 rounded font-medium"
          >
            Node Editor
          </button>
        </div>
        <PipelineProvider initialGraph={DIRECTOR_PIPELINE}>
          <NodeCanvas />
        </PipelineProvider>
      </main>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // PLANNING PHASE — Review prompts, approve scenes before gen
  // ══════════════════════════════════════════════════════════════

  if (phase === 'planning') {
    return (
      <main className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 flex flex-col">
        {/* Header */}
        <section className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">Video Planning</h1>
                <button
                  onClick={() => setPipelineMode('node')}
                  className="text-[10px] text-white/30 hover:text-primary border border-white/10 hover:border-primary/30 px-2 py-1 rounded-lg transition-colors"
                  title="Switch to visual node pipeline editor"
                >
                  Node Editor
                </button>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Review and edit the motion prompt for each clip. Only approved clips will be generated.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right text-sm">
                <span className="text-gray-400">Model:</span>{' '}
                <span className="text-white font-medium">{selectedModel?.name ?? state.selectedVideoModel}</span>
              </div>
              <div className="text-right text-sm">
                <span className="text-gray-400">Approved:</span>{' '}
                <span className="text-white font-medium">{approvedCount}/{completedScenes.length}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Bulk Actions */}
        <section className="mb-4 flex items-center gap-3">
          <button
            onClick={handleDirectorCut}
            disabled={isDirecting || completedScenes.length === 0}
            className="px-4 py-2 text-sm font-bold rounded-lg bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isDirecting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Director AI writing...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">movie_filter</span>
                Director&apos;s Cut
              </>
            )}
          </button>
          <button
            onClick={handleApproveAll}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-outline-variant text-gray-300 hover:bg-surface-container-high transition"
          >
            Approve All
          </button>
          <button
            onClick={() => update({ scenes: state.scenes.map(s => ({ ...s, videoApproved: false })) })}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-outline-variant text-gray-300 hover:bg-surface-container-high transition"
          >
            Deselect All
          </button>
          <div className="ml-auto text-sm text-gray-500">
            Est. Cost: ~${estimateCost(approvedCount, state.selectedImageModel, state.selectedVideoModel).totalCost.toFixed(2)}
          </div>
        </section>
        {directError && (
          <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
            {directError}
          </div>
        )}
        {isDirecting && (
          <div className="mb-4 px-4 py-3 bg-primary/10 border border-primary/30 rounded-lg text-sm text-primary">
            Director AI is analyzing your {completedScenes.length} scenes and writing cinematic video prompts. This takes 10-30 seconds...
          </div>
        )}

        {/* Style Lock — pinned reference images */}
        {(state.styleLockImages?.length > 0) && (
          <section className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-sm text-amber-400">lock</span>
              <span className="text-xs font-semibold text-amber-400 uppercase">Style Lock — sent as reference to every video</span>
              <span className="text-xs text-gray-500">({state.styleLockImages.length}/4)</span>
            </div>
            <div className="flex gap-2">
              {state.styleLockImages.map((url, i) => (
                <div key={`lock-${i}`} className="relative w-24 aspect-video rounded-lg overflow-hidden border-2 border-amber-400 group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleToggleStyleLock(url)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full text-white text-xs opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Scene Cards */}
        <section className="flex-1 space-y-4 mb-8">
          {completedScenes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4">image</span>
              <p className="text-on-surface-variant">No completed scenes yet. Go back to Review to generate images first.</p>
            </div>
          ) : (
            completedScenes.map((scene, idx) => {
              const isApproved = scene.videoApproved !== false;
              const prompt = scene.videoPrompt ?? scene.videoMotionPrompt ?? scene.prompt ?? '';
              return (
                <div
                  key={scene.id}
                  className={`flex gap-4 rounded-xl border p-4 transition ${
                    isApproved
                      ? 'bg-surface-container-high border-outline-variant hover:border-surface-bright'
                      : 'bg-surface-container border-outline-variant/40 opacity-50'
                  }`}
                >
                  {/* Approve toggle */}
                  <button
                    onClick={() => handleToggleApproval(scene.id)}
                    className={`flex-shrink-0 w-6 h-6 mt-1 rounded-md border-2 flex items-center justify-center transition ${
                      isApproved
                        ? 'bg-primary border-primary text-on-primary'
                        : 'border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {isApproved && (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 7L6 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>

                  {/* Scene image thumbnail — click pin icon to style-lock */}
                  <div className="flex-shrink-0 w-40 aspect-video rounded-lg overflow-hidden bg-surface-container relative group/thumb">
                    {scene.imageUrl && (
                      <>
                        <img
                          src={scene.imageUrl}
                          alt={`Scene ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {state.styleLockImages?.includes(scene.imageUrl) ? (
                          <button
                            onClick={() => handleToggleStyleLock(scene.imageUrl!)}
                            className="absolute top-1 left-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center text-black text-xs"
                            title="Remove from style lock"
                          >
                            <span className="material-symbols-outlined text-sm">lock</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStyleLock(scene.imageUrl!)}
                            className="absolute top-1 left-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover/thumb:opacity-100 transition"
                            title="Pin as style reference (max 4)"
                          >
                            <span className="material-symbols-outlined text-sm">push_pin</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Prompt editor */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-gray-400 uppercase">Clip {idx + 1}</span>
                      {scene.assetCategory && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-surface-container text-gray-400">
                          {scene.assetCategory}
                        </span>
                      )}
                      {scene.imageModelId && (
                        <span className="text-xs text-gray-500">{scene.imageModelId}</span>
                      )}
                    </div>
                    <textarea
                      value={prompt}
                      onChange={(e) => handleUpdatePrompt(scene.id, e.target.value)}
                      placeholder="Describe the motion, camera movement, and action for this video clip..."
                      rows={3}
                      className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-primary transition"
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500">Original:</span>
                      <span className="text-xs text-gray-600 truncate">{scene.prompt}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* Footer */}
        <div className="border-t border-outline-variant mt-auto pt-6 flex justify-between items-center gap-4">
          <Link href="/create/review" className="px-8 py-3 rounded-xl bg-surface-container-highest text-white font-headline font-bold transition-all hover:scale-105 active:scale-95">
            Back
          </Link>
          {videos.length > 0 && (
            <button
              onClick={() => setPhase('production')}
              className="px-6 py-3 rounded-xl border border-outline-variant text-white font-medium hover:bg-surface-container-high transition"
            >
              View Production
            </button>
          )}
          <button
            onClick={handleStartProduction}
            disabled={approvedCount === 0}
            className="px-10 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-headline font-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            GENERATE {approvedCount} VIDEO{approvedCount !== 1 ? 'S' : ''}
          </button>
        </div>
      </main>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // PRODUCTION PHASE — Generation progress + video results
  // ══════════════════════════════════════════════════════════════

  return (
    <main className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 flex flex-col">
      {/* ACT STRUCTURE Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
              ACT STRUCTURE
            </h2>
            <button
              onClick={() => setPipelineMode('node')}
              className="text-[10px] text-white/30 hover:text-primary border border-white/10 hover:border-primary/30 px-2 py-1 rounded-lg transition-colors"
              title="Switch to visual node pipeline editor"
            >
              Node Editor
            </button>
          </div>
          {!isGenerating && (
            <button
              onClick={() => setPhase('planning')}
              className="text-xs text-primary hover:underline"
            >
              Back to Planning
            </button>
          )}
        </div>
        <div className="flex gap-4">
          {/* Act 1 */}
          <div className="flex-1">
            <div className="bg-surface-container-high rounded-lg overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-primary to-primary-container" style={{ width: `${Math.min(progress * 3, 100)}%` }}></div>
              <div className="p-4">
                <div className="text-sm font-medium">Act 1</div>
                <div className="text-2xl font-bold text-primary mt-1">{Math.min(progress * 3, 100)}%</div>
              </div>
            </div>
          </div>

          {/* Act 2 */}
          <div className="flex-1">
            <div className="bg-surface-container-high rounded-lg overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-processing to-processing-dim" style={{ width: `${Math.max(0, Math.min((progress - 33) * 3, 100))}%` }}></div>
              <div className="p-4">
                <div className="text-sm font-medium">Act 2</div>
                <div className="text-2xl font-bold text-processing mt-1">{Math.max(0, Math.min(Math.round((progress - 33) * 3), 100))}%</div>
              </div>
            </div>
          </div>

          {/* Act 3 */}
          <div className="flex-1">
            <div className="bg-surface-container-high rounded-lg overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-success to-success-dim" style={{ width: `${Math.max(0, Math.min((progress - 66) * 3, 100))}%` }}></div>
              <div className="p-4">
                <div className={`text-sm font-medium ${progress > 66 ? 'text-white' : 'text-gray-600'}`}>Act 3</div>
                <div className={`text-2xl font-bold mt-1 ${progress > 66 ? 'text-success' : 'text-gray-600'}`}>{Math.max(0, Math.min(Math.round((progress - 66) * 3), 100))}%</div>
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
        <div className="bg-surface-container-high rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-2xl font-bold">{completedVideos.length} of {videos.length || approvedCount} videos complete</div>
              <div className="text-sm text-gray-500 mt-1">
                {allDone ? 'Ready to export' : isGenerating ? currentBatchLabel || 'Processing...' : videos.length === 0 ? 'Go to Planning to start' : 'Generation paused'}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-400">Est. Cost</div>
                <div className="text-lg font-bold text-white">
                  ~${estimateCost(approvedCount, state.selectedImageModel, state.selectedVideoModel).totalCost.toFixed(2)}
                </div>
              </div>
              {totalDuration > 0 && (
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">{formatDuration(totalDuration)}</div>
                  <div className="text-xs text-gray-500">Est. Duration</div>
                </div>
              )}
              <div className="flex gap-3">
                {allDone ? (
                  <Link
                    href="/create/export"
                    className="px-4 py-2 border border-surface-bright rounded-lg transition font-medium bg-surface-container text-white hover:bg-surface-container-high"
                  >
                    Preview Film
                  </Link>
                ) : null}
                {!isGenerating && videos.length > 0 && (
                  <button
                    onClick={() => { update({ videoResults: [], generationBatches: [], currentBatchIndex: 0 }); setPhase('planning'); }}
                    className="px-4 py-2 border border-red-500/40 rounded-lg transition font-medium text-red-400 hover:bg-red-500/10"
                  >
                    Reset & Re-plan
                  </button>
                )}
                {isGenerating && (
                  <button
                    onClick={() => { stopAll(); update({ isPaused: true }); }}
                    className="px-4 py-2 bg-gradient-to-br from-primary to-primary-container text-white rounded-lg hover:opacity-90 transition font-medium"
                  >
                    Pause
                  </button>
                )}
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary to-primary-container h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          {failedVideos.length > 0 && (
            <div className="mt-3 text-sm text-red-400">
              {failedVideos.length} video{failedVideos.length > 1 ? 's' : ''} failed — chain may have continuity gaps
            </div>
          )}
        </div>
      </section>

      {/* Batch Pipeline Section */}
      {batches.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Continuity Batches
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {batches.map((batch, idx) => {
              const [start, end] = batch.sceneRange;
              const clipCount = end - start + 1;
              const isActive = state.currentBatchIndex === idx && isGenerating;
              return (
                <div
                  key={batch.id}
                  className={`flex-shrink-0 w-48 rounded-lg border p-4 ${
                    batch.status === 'completed'
                      ? 'bg-success-container border-success/40'
                      : batch.status === 'generating' || isActive
                      ? 'bg-processing-container border-processing/60'
                      : batch.status === 'failed'
                      ? 'bg-failed-container border-red-500/40'
                      : 'bg-surface-container-high border-outline-variant'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase text-gray-400">Batch {idx + 1}</span>
                    {batch.status === 'completed' && <span className="text-success text-sm">Done</span>}
                    {(batch.status === 'generating' || isActive) && (
                      <span className="inline-block w-3 h-3 border border-processing/30 border-t-processing rounded-full animate-spin"></span>
                    )}
                    {batch.status === 'failed' && <span className="text-red-400 text-sm">Failed</span>}
                  </div>
                  <div className="text-sm font-medium">{clipCount} clip{clipCount > 1 ? 's' : ''}</div>
                  <div className="text-xs text-gray-500 mt-1">Scenes {start + 1}–{end + 1}</div>
                  {batch.anchorFrameUrl && (
                    <div className="text-xs text-success mt-2">Anchor frame linked</div>
                  )}
                  {batch.referenceImageUrls.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">{batch.referenceImageUrls.length} ref images</div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Video Pipeline Section */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
          Video Pipeline
        </h2>
        {videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4">movie</span>
            <p className="text-on-surface-variant">No videos in the pipeline yet.</p>
            <button
              onClick={() => setPhase('planning')}
              className="mt-4 px-4 py-2 text-sm text-primary border border-primary/40 rounded-lg hover:bg-primary/10 transition"
            >
              Go to Planning
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video, idx) => {
              // Find the source scene to show its prompt
              const sourceScene = video.sourceSceneId
                ? state.scenes.find(s => s.id === video.sourceSceneId)
                : undefined;
              const videoPrompt = sourceScene?.videoPrompt || sourceScene?.videoMotionPrompt || sourceScene?.prompt || '';

              return (
                <div key={video.id} className="bg-surface-container-high rounded-lg overflow-hidden border border-outline-variant hover:border-surface-bright transition">
                  {video.status === 'completed' && video.videoUrl ? (
                    <>
                      <div className="aspect-video bg-surface-container overflow-hidden relative group">
                        <video
                          src={video.videoUrl}
                          className="w-full h-full object-cover"
                          controls
                          crossOrigin="anonymous"
                          preload="auto"
                          playsInline
                        />
                        <a
                          href={video.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition bg-black/60 rounded-lg px-2 py-1 text-xs text-white hover:bg-black/80"
                        >
                          Open ↗
                        </a>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">Clip {idx + 1}</span>
                          <span className="text-sm font-semibold text-success">Complete</span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2">{videoPrompt}</p>
                      </div>
                    </>
                  ) : video.status === 'generating' ? (
                    <>
                      <div className="aspect-video bg-surface-container border-b-2 border-processing relative overflow-hidden">
                        {video.inputImageUrl && (
                          <img src={video.inputImageUrl} alt="" className="w-full h-full object-cover opacity-40" />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="inline-block w-8 h-8 border-2 border-processing/30 border-t-processing rounded-full animate-spin mb-2"></div>
                            <div className="text-xs text-gray-300">Generating clip {idx + 1}</div>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="w-full bg-surface-container rounded-full h-2 mb-2">
                          <div className="bg-gradient-to-r from-processing to-processing-dim h-full rounded-full animate-pulse w-1/2"></div>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2">{videoPrompt}</p>
                      </div>
                    </>
                  ) : video.status === 'failed' ? (
                    <>
                      <div className="aspect-video bg-surface-container relative overflow-hidden">
                        {video.inputImageUrl && (
                          <img src={video.inputImageUrl} alt="" className="w-full h-full object-cover opacity-20" />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center text-red-400">
                            <span className="text-2xl">X</span>
                            <p className="text-xs mt-1">Failed</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-xs text-red-400 truncate mb-1">{video.error ?? 'Unknown error'}</p>
                        <p className="text-xs text-gray-500 line-clamp-1 mb-2">{videoPrompt}</p>
                        <button
                          onClick={() => retryVideo(video.id)}
                          disabled={isGenerating}
                          className="px-3 py-1 text-xs bg-primary text-on-primary rounded hover:bg-primary-dim transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Retry
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="aspect-video bg-surface-container relative overflow-hidden opacity-60">
                        {video.inputImageUrl && (
                          <img src={video.inputImageUrl} alt="" className="w-full h-full object-cover opacity-30" />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-xs text-gray-500">Clip {idx + 1} — Queued</div>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-xs text-gray-500 line-clamp-2">{videoPrompt}</p>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Footer Navigation */}
      <div className="border-t border-outline-variant mt-auto pt-6 flex justify-between items-center gap-4">
        <Link href="/create/review" className="px-8 py-3 rounded-xl bg-surface-container-highest text-white font-headline font-bold transition-all hover:scale-105 active:scale-95">
          Back
        </Link>
        {allDone ? (
          <Link href="/create/export" className="px-10 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-headline font-black transition-all hover:scale-105 active:scale-95">
            GENERATION COMPLETE
          </Link>
        ) : (
          <button disabled className="px-10 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-headline font-black transition-all opacity-50 cursor-not-allowed">
            {isGenerating ? 'GENERATING...' : 'WAITING FOR VIDEOS'}
          </button>
        )}
      </div>

      <AlertModal
        open={!!error}
        onClose={() => {}}
        title="Video Generation Error"
        message={error ?? ''}
      />
    </main>
  );
}
