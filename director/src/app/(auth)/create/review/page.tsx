'use client';

import Link from 'next/link';
import React, { useState, useEffect, useRef } from 'react';
import { useWizard } from '@/context/WizardContext';
import type { ProductionAsset, AssetCategory } from '@/context/WizardContext';
import { useSceneGeneration } from '@/hooks/useSceneGeneration';
import { AlertModal } from '@/components/ui/Modal';
import { buildCinematicPrompt } from '@/lib/cinematicPrompt';
import { generateSceneStructure } from '@/lib/sceneStructure';
import { estimateCost } from '@/lib/continuityEngine';
import {
  analyzeAllAssets,
  selectScenesForNarrative,
  selectionsToScenes,
  evaluateAndResolveRejections,
  getRejectedScenes,
  buildRejectionPayload,
  getConditioningImages,
  assetSceneId,
} from '@/lib/continuitySelection';
import type { SelectedScene, RejectionResult } from '@/lib/continuitySelection';
import { getApiKeys } from '@/lib/apiKeyStore';
import type { SceneAnalysis } from '@/app/api/analyze-scene/route';
import type { SceneImage } from '@/types/replicate';

// ─── Video motion prompts by asset category ──────────────────────

const CATEGORY_VIDEO_PROMPTS: Record<string, string> = {
  character: 'subtle character movement, slight head turn, natural breathing, eye contact with camera',
  location: 'slow camera pan across environment, ambient atmosphere, establishing shot movement',
  wardrobe: 'gentle fabric movement, model turning slowly, showcasing outfit details',
  prop: 'slow rotation reveal, rack focus on object details, dramatic lighting shift',
  vehicle: 'smooth tracking shot alongside vehicle, reflections shifting, cinematic movement',
  accessory: 'macro detail reveal, slow pull-back from close-up, luxury product showcase',
};

const CATEGORY_SHOT_TYPES: Record<string, string> = {
  character: 'closeup',
  location: 'establishing',
  wardrobe: 'medium',
  prop: 'insert',
  vehicle: 'establishing',
  accessory: 'insert',
};

const CATEGORY_ICONS: Record<string, string> = {
  character: 'face',
  location: 'landscape',
  wardrobe: 'checkroom',
  prop: 'inventory_2',
  vehicle: 'directions_car',
  accessory: 'watch',
};

// ─── Component ───────────────────────────────────────────────────

export default function ReviewPage() {
  useEffect(() => {
    document.title = 'Review — DIRECTOR';
  }, []);

  const { state, update } = useWizard();
  const { generateScene, generateScenesSequentially, regenerateScene, editScene, generateVariants, pickVariant, scenes, isGenerating, generatingIndex, generatingTotal, error: genError } = useSceneGeneration();
  const [filterReady, setFilterReady] = useState(false);
  const [gridSize, setGridSize] = useState(4);
  const [promptInput, setPromptInput] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ title: '', message: '' });
  const [editingScene, setEditingScene] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [analysisProgress, setAnalysisProgress] = useState<{ current: number; total: number; label: string } | null>(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [rejectedScenes, setRejectedScenes] = useState<SelectedScene[]>([]);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const selectionsRef = useRef<SelectedScene[]>([]);
  const hasImported = useRef(false);
  const [hasMounted, setHasMounted] = useState(false);
  // Ref to avoid stale closure in async import flow
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => { setHasMounted(true); }, []);

  // ─── Auto-import production assets as scenes (no analysis) ─────

  useEffect(() => {
    if (hasImported.current) return;
    hasImported.current = true;

    const currentState = stateRef.current;
    const succeededAssets = currentState.productionAssets.filter(
      (a) => a.status === 'succeeded' && a.imageUrl
    );
    if (succeededAssets.length === 0) return;

    // Check which assets are already imported (avoid duplicates on re-mount)
    const existingAssetIds = new Set(
      currentState.scenes.filter((s) => s.sourceAssetId).map((s) => s.sourceAssetId)
    );
    const unimported = succeededAssets.filter((a) => !existingAssetIds.has(a.id));
    if (unimported.length === 0) return;

    // Simple import: convert each asset to a scene without analysis
    const newScenes: SceneImage[] = unimported.map((asset, i) => ({
      id: assetSceneId(asset.id),
      prompt: asset.description || asset.name,
      imageUrl: asset.imageUrl,
      status: 'completed' as const,
      predictionId: asset.predictionId,
      error: null,
      sourceAssetId: asset.id,
      assetCategory: asset.category,
      sceneIndex: i,
      imageModelId: asset.model,
    }));

    if (newScenes.length > 0) {
      const existing = currentState.scenes;
      const existingIds = new Set(existing.map((s) => s.id));
      const deduped = newScenes.filter((s) => !existingIds.has(s.id));
      if (deduped.length > 0) {
        update({ scenes: [...existing, ...deduped] });
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Manual continuity analysis handler ───────────────────────

  const handleAnalyzeContinuity = async () => {
    const currentState = stateRef.current;
    const succeededAssets = currentState.productionAssets.filter(
      (a) => a.status === 'succeeded' && a.imageUrl
    );
    if (succeededAssets.length === 0) {
      setAlertMsg({ title: 'No Assets', message: 'No production assets available to analyze.' });
      setShowAlert(true);
      return;
    }

    const keys = getApiKeys();
    // Also check if server has the key configured via env
    if (!keys.openrouter) {
      try {
        const keysRes = await fetch('/api/keys');
        const keysData = await keysRes.json();
        if (!keysData.openrouter?.configured) {
          setAlertMsg({ title: 'API Key Missing', message: 'OpenRouter API key is required for continuity analysis. Add it in Settings > API Keys.' });
          setShowAlert(true);
          return;
        }
      } catch {
        setAlertMsg({ title: 'API Key Missing', message: 'OpenRouter API key is required for continuity analysis. Add it in Settings > API Keys.' });
        setShowAlert(true);
        return;
      }
    }

    let analysisMap: Map<string, SceneAnalysis> | undefined;

    // Phase 1: Vision model analysis
    setAnalysisProgress({ current: 0, total: succeededAssets.length, label: 'Starting analysis...' });
    try {
      analysisMap = await analyzeAllAssets(
        succeededAssets,
        keys.openrouter,
        (completed, total, assetName) => {
          setAnalysisProgress({
            current: completed,
            total,
            label: completed >= total ? 'Ordering scenes...' : `Analyzing: ${assetName}`,
          });
        },
      );
    } catch (err) {
      setAnalysisProgress(null);
      setAlertMsg({ title: 'Analysis Failed', message: err instanceof Error ? err.message : 'Vision analysis failed' });
      setShowAlert(true);
      return;
    }

    // Re-read fresh state after async gap
    const freshState = stateRef.current;

    // Phase 2: Continuity Engine selects and orders scenes
    const selections = selectScenesForNarrative(succeededAssets, freshState, analysisMap);

    // Phase 3: Rejection evaluation
    const evaluated = evaluateAndResolveRejections(selections, succeededAssets, freshState, analysisMap);
    const rejected = getRejectedScenes(evaluated);
    selectionsRef.current = evaluated;
    setRejectedScenes(rejected);

    // Phase 4: Reorder existing scenes based on continuity analysis
    const orderedScenes = selectionsToScenes(evaluated);
    if (orderedScenes.length > 0) {
      // Replace asset scenes with reordered versions, keep manual scenes untouched
      const manualOnly = freshState.scenes.filter((s) => !s.sourceAssetId);
      const orderedIds = new Set(orderedScenes.map((s) => s.id));
      // Keep manual scenes + any asset scenes not in the new ordering
      const kept = manualOnly.concat(
        freshState.scenes.filter((s) => s.sourceAssetId && !orderedIds.has(s.id))
      );
      update({ scenes: [...orderedScenes, ...kept] });
    }

    setAnalysisProgress(null);
    setAnalysisComplete(true);
  };

  // ─── Handlers ──────────────────────────────────────────────────

  function createFullMask(): string {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 512);
    return canvas.toDataURL('image/png');
  }

  const handleApplyEdit = async () => {
    if (!editingScene || !editPrompt.trim()) return;
    const maskUrl = createFullMask();
    await editScene(editingScene, maskUrl, editPrompt.trim());
    setEditingScene(null);
    setEditPrompt('');
  };

  const handleGenerateScene = async () => {
    if (!promptInput.trim()) {
      setAlertMsg({ title: 'Missing Prompt', message: 'Please enter a scene description to generate.' });
      setShowAlert(true);
      return;
    }
    const { imagePrompt, videoMotionPrompt, negativePrompt } = buildCinematicPrompt({
      basePrompt: promptInput.trim(),
      sceneType: 'medium',
      state,
    });
    await generateScene(imagePrompt, undefined, { videoMotionPrompt, negativePrompt });
    setPromptInput('');
  };

  const handleQuickGenerate = async () => {
    const basePrompt = state.visionText || 'cinematic scene';
    const structure = generateSceneStructure(state.pacing);

    const sceneInputs = structure.map((scene, i) => {
      const { imagePrompt, videoMotionPrompt, negativePrompt } = buildCinematicPrompt({
        basePrompt: `${basePrompt}, ${scene.promptSuffix}`,
        sceneType: scene.shotType,
        state,
        continuity: { sceneIndex: i, totalScenes: structure.length },
      });
      return { prompt: imagePrompt, sceneId: scene.id, meta: { videoMotionPrompt, negativePrompt, sceneIndex: i } };
    });

    await generateScenesSequentially(sceneInputs);
  };

  const handleRemoveScene = (sceneId: string) => {
    update({ scenes: state.scenes.filter((s) => s.id !== sceneId && s.variantOf !== sceneId) });
  };

  // ─── Regeneration handler for rejected scenes ───────────────────

  const handleRegenerate = async (sceneId: string) => {
    const rejected = rejectedScenes.find((s) => assetSceneId(s.selectedAsset.id) === sceneId);
    if (!rejected?.rejection) return;

    setRegeneratingId(sceneId);

    const rejection = rejected.rejection;
    const conditioningImages = getConditioningImages(rejection);

    // Determine scene type from rejection slot (authoritative), not analysis
    const slot = rejection.slot;
    const sceneType = slot.camera === 'wide' ? 'establishing'
      : slot.camera === 'close' ? 'closeup'
      : slot.camera === 'extreme-close' ? 'insert'
      : slot.camera === 'aerial' ? 'aerial'
      : 'medium';

    // Build the cinematic prompt with corrections baked in
    const { imagePrompt } = buildCinematicPrompt({
      basePrompt: rejection.regenerationPrompt,
      sceneType,
      state,
      continuity: {
        sceneIndex: rejected.scene - 1,
        totalScenes: selectionsRef.current.length,
      },
    });

    // Pass sceneId so generateScene REPLACES the existing scene, not duplicates
    await generateScene(imagePrompt, sceneId, {
      videoMotionPrompt: rejected.videoMotionPrompt,
      referenceImages: conditioningImages,
      sceneIndex: rejected.scene - 1,
    });

    // Remove from rejected list on successful regeneration
    setRejectedScenes((prev) => prev.filter((s) => s.selectedAsset.id !== rejected.selectedAsset.id));
    setRegeneratingId(null);
  };

  const editingSceneData = editingScene ? scenes.find(s => s.id === editingScene) : null;

  // Deduplicate scenes by id (guards against any duplicate entries in state)
  const uniqueScenes = scenes.filter((s, i, arr) => arr.findIndex((x) => x.id === s.id) === i);
  const parentScenes = uniqueScenes.filter(s => !s.variantOf);
  const assetScenes = parentScenes.filter(s => s.sourceAssetId);
  const manualScenes = parentScenes.filter(s => !s.sourceAssetId);
  const readyScenes = parentScenes.filter(s => s.status === 'completed');
  const displayScenes = filterReady ? readyScenes : parentScenes;
  const completedCount = readyScenes.length;

  // Group variants by parent scene ID
  const variantsByParent = uniqueScenes.reduce<Record<string, typeof scenes>>((acc, s) => {
    if (s.variantOf) {
      if (!acc[s.variantOf]) acc[s.variantOf] = [];
      acc[s.variantOf].push(s);
    }
    return acc;
  }, {});

  if (!hasMounted) {
    return (
      <main className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-sm text-on-surface-variant">Loading scenes...</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col h-full">
      <div className="flex-1 flex gap-8 overflow-hidden">
        {/* Scene Grid */}
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          <div className="mb-8">
            <h1 className="text-3xl font-headline font-light tracking-[-0.03em] mb-2">Scene Review</h1>
            <p className="text-on-surface-variant text-sm mb-4">
              {assetScenes.length > 0 && (
                <span className="text-primary font-semibold">{assetScenes.length} assets imported</span>
              )}
              {assetScenes.length > 0 && manualScenes.length > 0 && ' + '}
              {manualScenes.length > 0 && `${manualScenes.length} custom scene${manualScenes.length !== 1 ? 's' : ''}`}
              {assetScenes.length === 0 && manualScenes.length === 0 && 'Import your production assets or generate new scenes.'}
              {' '}&mdash; each becomes a video clip in your film.
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterReady(!filterReady)}
                className={`px-4 py-2 rounded-lg text-sm transition ${
                  filterReady
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                }`}
              >
                Filter {filterReady && '(Ready Only)'}
              </button>
              <button
                onClick={() => setGridSize(gridSize === 4 ? 2 : 4)}
                className="px-4 py-2 bg-surface-container-high text-on-surface-variant rounded-lg text-sm hover:bg-surface-container-highest"
              >
                Grid ({gridSize}-col)
              </button>
              <button
                onClick={handleQuickGenerate}
                disabled={isGenerating}
                className="px-4 py-2 bg-gradient-to-br from-primary to-primary-container text-on-surface rounded-lg text-sm hover:opacity-90 transition disabled:opacity-50"
              >
                {isGenerating
                  ? `Generating ${generatingIndex + 1}/${generatingTotal}...`
                  : `+ Auto-Generate ${generateSceneStructure(state.pacing).length} Scenes`}
              </button>
              <button
                onClick={handleAnalyzeContinuity}
                disabled={isGenerating || !!analysisProgress}
                className="px-4 py-2 bg-surface-container-high text-on-surface-variant rounded-lg text-sm hover:bg-surface-container-highest border border-outline-variant/30 transition disabled:opacity-50 flex items-center gap-2 ml-auto"
              >
                <span className="material-symbols-outlined text-base">psychology</span>
                {analysisProgress ? 'Analyzing...' : analysisComplete ? 'Re-Analyze' : 'Analyze Continuity'}
              </button>
              {!isGenerating && (
                <span className="text-xs text-on-surface-variant self-center">
                  Est. ~${estimateCost(generateSceneStructure(state.pacing).length, state.selectedImageModel).imageCost.toFixed(2)} for images
                </span>
              )}
            </div>
          </div>

          {/* Continuity Engine Analysis Progress */}
          {analysisProgress && (
            <div className="mb-6 bg-surface-container border border-outline-variant rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                <span className="text-sm text-on-surface font-medium">Cinematic Analysis</span>
                <span className="text-xs text-on-surface-variant ml-auto">
                  {analysisProgress.current}/{analysisProgress.total}
                </span>
              </div>
              <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary-container transition-all duration-300"
                  style={{ width: `${Math.round((analysisProgress.current / analysisProgress.total) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-on-surface-variant/60 mt-1.5">{analysisProgress.label}</p>
            </div>
          )}

          {/* Scene Prompt Input */}
          <div className="mb-6 flex gap-3">
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerateScene()}
              placeholder="Describe a scene to generate..."
              className="flex-1 px-4 py-3 bg-surface-container border border-outline-variant rounded-lg text-on-surface placeholder-gray-500 focus:border-primary outline-none transition"
            />
            <button
              onClick={handleGenerateScene}
              disabled={isGenerating || !promptInput.trim()}
              className="px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-on-surface rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              Generate
            </button>
          </div>

          {/* Rejection Summary */}
          {rejectedScenes.length > 0 && (
            <div className="mb-4 bg-red-950/30 border border-red-500/30 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-red-400">warning</span>
                <div>
                  <span className="text-red-300 font-semibold text-sm">
                    {rejectedScenes.length} scene{rejectedScenes.length !== 1 ? 's' : ''} rejected
                  </span>
                  <p className="text-red-200/60 text-xs">
                    Below quality thresholds for character consistency, emotion, or continuity. Regenerate or remove.
                  </p>
                </div>
              </div>
              <button
                onClick={async () => {
                  for (const r of rejectedScenes) {
                    const sid = assetSceneId(r.selectedAsset.id);
                    await handleRegenerate(sid);
                  }
                }}
                disabled={isGenerating || !!regeneratingId}
                className="px-4 py-2 bg-red-600 text-on-surface text-xs font-bold rounded-lg hover:bg-red-500 transition disabled:opacity-50 whitespace-nowrap"
              >
                Regenerate All ({rejectedScenes.length})
              </button>
            </div>
          )}

          {/* Scene Grid */}
          <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}>
            {displayScenes.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4">movie</span>
                <p className="text-on-surface-variant">No scenes yet. Go back to Characters to generate assets, or use auto-generate above.</p>
              </div>
            )}
            {displayScenes.map((scene) => {
              const variants = variantsByParent[scene.id] ?? [];
              const isAssetScene = !!scene.sourceAssetId;
              const catIcon = scene.assetCategory ? CATEGORY_ICONS[scene.assetCategory] : null;
              const isRejected = rejectedScenes.some((r) => assetSceneId(r.selectedAsset.id) === scene.id);
              const rejectionData = rejectedScenes.find((r) => assetSceneId(r.selectedAsset.id) === scene.id);
              const isRegenerating = regeneratingId === scene.id;

              if (scene.status === 'completed' && scene.imageUrl) {
                return (
                  <div key={scene.id} className="col-span-1 flex flex-col gap-2">
                    <div
                      onClick={() => update({ selectedScene: scene.id })}
                      className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer transition-all border-2 ${
                        isRejected ? 'border-red-500/70' : state.selectedScene === scene.id ? 'border-success' : 'border-surface-bright'
                      }`}
                    >
                      <img
                        src={scene.imageUrl}
                        alt={scene.prompt}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                        <p className="text-on-surface text-xs truncate">{scene.prompt}</p>
                      </div>

                      {/* Asset badge */}
                      {isAssetScene && catIcon && (
                        <span className="absolute top-2 left-2 bg-primary/80 text-on-primary text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 pointer-events-none">
                          <span className="material-symbols-outlined text-[12px]">{catIcon}</span>
                          {scene.assetCategory}
                        </span>
                      )}

                      {/* Model badge */}
                      {scene.imageModelId && (
                        <span className="absolute top-2 right-24 bg-black/60 text-on-surface/70 text-[10px] px-1.5 py-0.5 rounded pointer-events-none">
                          {scene.imageModelId}
                        </span>
                      )}

                      {/* Action buttons */}
                      {!isAssetScene && (
                        <button
                          onClick={(e) => { e.stopPropagation(); generateVariants(scene.id, 2); }}
                          className="absolute top-8 left-2 bg-black/60 text-on-surface text-xs px-2 py-1 rounded hover:bg-black/80 transition"
                        >
                          A/B
                        </button>
                      )}
                      {!isAssetScene && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingScene(scene.id); setEditPrompt(''); }}
                          className="absolute top-2 right-12 bg-black/60 text-on-surface text-xs px-2 py-1 rounded hover:bg-black/80 transition"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveScene(scene.id); }}
                        className="absolute top-2 right-2 bg-black/60 text-on-surface text-xs px-2 py-1 rounded hover:bg-red-600/80 transition"
                        title="Remove from film"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>

                      {/* Rejection overlay */}
                      {isRejected && !isRegenerating && (
                        <div className="absolute inset-0 bg-red-900/40 flex flex-col items-center justify-center gap-2">
                          <span className="material-symbols-outlined text-red-300 text-2xl">warning</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRegenerate(scene.id); }}
                            className="px-3 py-1.5 bg-red-600 text-on-surface text-xs font-bold rounded-lg hover:bg-red-500 transition"
                          >
                            Regenerate
                          </button>
                        </div>
                      )}

                      {/* Regenerating spinner overlay */}
                      {isRegenerating && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                          <span className="text-xs text-on-surface/80">Regenerating...</span>
                        </div>
                      )}
                    </div>

                    {/* Rejection details */}
                    {isRejected && rejectionData?.rejection && (
                      <div className="bg-red-950/40 border border-red-500/30 rounded-lg p-2.5 text-xs">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="material-symbols-outlined text-red-400 text-[14px]">error</span>
                          <span className="text-red-300 font-semibold">Rejected</span>
                          {rejectionData.rejection.retryCount > 1 && (
                            <span className="text-red-400/60 ml-auto">retry #{rejectionData.rejection.retryCount}</span>
                          )}
                        </div>
                        <ul className="text-red-200/70 space-y-0.5 mb-2">
                          {rejectionData.rejection.reasons.map((r, ri) => (
                            <li key={ri} className="flex gap-1">
                              <span className="text-red-400/50">-</span>
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="flex gap-1.5 flex-wrap">
                          {rejectionData.rejection.referenceImages.map((ref, ri) => (
                            <span
                              key={`${ref.imageId}-${ri}`}
                              className="px-1.5 py-0.5 bg-red-900/50 text-red-200/80 rounded text-[10px]"
                              title={ref.reason}
                            >
                              {ref.usage.replace(/_/g, ' ')} ({(ref.weight * 100).toFixed(0)}%)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Variant strip */}
                    {variants.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {variants.map((variant) => (
                          <div
                            key={variant.id}
                            className="relative flex-shrink-0 w-32 aspect-video rounded border border-surface-bright overflow-hidden bg-surface-container"
                          >
                            {variant.status === 'completed' && variant.imageUrl ? (
                              <>
                                <img
                                  src={variant.imageUrl}
                                  alt={variant.prompt}
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  onClick={() => pickVariant(variant.id)}
                                  className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-success text-on-surface text-[10px] px-2 py-0.5 rounded hover:bg-success-dim transition whitespace-nowrap"
                                >
                                  Pick this
                                </button>
                              </>
                            ) : variant.status === 'generating' ? (
                              <div className="flex items-center justify-center w-full h-full">
                                <div className="w-5 h-5 border-2 border-processing/30 border-t-processing rounded-full animate-spin"></div>
                              </div>
                            ) : variant.status === 'failed' ? (
                              <div className="flex items-center justify-center w-full h-full">
                                <span className="text-red-400 text-[10px]">Failed</span>
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              } else if (scene.status === 'generating') {
                return (
                  <div
                    key={scene.id}
                    className="relative aspect-video rounded-lg border-2 border-surface-bright bg-surface-container flex items-center justify-center"
                  >
                    <div className="text-center">
                      <div className="inline-block w-8 h-8 border-2 border-processing/30 border-t-processing rounded-full animate-spin mb-2"></div>
                      <div className="text-xs text-on-surface-variant/60">Generating</div>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 text-on-surface-variant text-xs truncate">
                      {scene.prompt}
                    </div>
                  </div>
                );
              } else if (scene.status === 'failed') {
                return (
                  <div
                    key={scene.id}
                    className="relative aspect-video rounded-lg border-2 border-red-500/40 bg-surface-container flex flex-col items-center justify-center p-4"
                  >
                    <span className="text-red-400 text-sm mb-2">Failed</span>
                    <p className="text-xs text-on-surface-variant/60 text-center truncate w-full">{scene.error ?? 'Unknown error'}</p>
                    <button
                      onClick={() => regenerateScene(scene.id)}
                      className="mt-2 text-xs text-primary hover:underline"
                    >
                      Retry
                    </button>
                  </div>
                );
              } else {
                // Skip placeholder/pending scenes with no content
                return null;
              }
            })}
          </div>
        </div>
      </div>

      {/* Edit Panel */}
      {editingScene && editingSceneData && editingSceneData.imageUrl && (
        <div className="border-t border-outline-variant bg-surface-container-low px-8 py-6">
          <div className="max-w-4xl mx-auto flex gap-6 items-start">
            <div className="flex-shrink-0">
              <img
                src={editingSceneData.imageUrl}
                alt={editingSceneData.prompt}
                className="w-64 h-40 object-cover rounded-lg border border-surface-bright"
              />
            </div>
            <div className="flex-1 flex flex-col gap-3">
              <h3 className="text-on-surface font-semibold text-lg">Edit Scene</h3>
              <p className="text-on-surface-variant text-xs">
                The entire image will be considered for editing guided by your prompt. Describe what you want to change.
              </p>
              <input
                type="text"
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyEdit()}
                placeholder="Describe what to change in the selected area..."
                className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-lg text-on-surface placeholder-gray-500 focus:border-primary outline-none transition"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleApplyEdit}
                  disabled={isGenerating || !editPrompt.trim()}
                  className="px-6 py-2 bg-gradient-to-br from-primary to-primary-container text-on-surface rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
                >
                  Apply Edit
                </button>
                <button
                  onClick={() => { setEditingScene(null); setEditPrompt(''); }}
                  className="px-6 py-2 bg-surface-container-high text-on-surface-variant rounded-lg text-sm hover:bg-surface-container-highest transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <div className="border-t border-outline-variant px-8 py-6 flex justify-between items-center gap-4 bg-surface">
        <Link href="/create/style-dna" className="px-8 py-3 rounded-xl bg-surface-container-highest text-on-surface font-headline font-bold transition-all hover:scale-105 active:scale-95">
          Back
        </Link>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-on-surface-variant">Scenes ready:</span>
            <span className="text-on-surface font-bold ml-2">{completedCount}/{parentScenes.length}</span>
          </div>
          <Link
            href={completedCount > 0 ? '/create/generating' : '#'}
            className={`px-10 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-headline font-black transition-all hover:scale-105 active:scale-95 ${
              completedCount === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            GENERATE FILM ({completedCount} clips)
          </Link>
        </div>
      </div>

      <AlertModal
        open={showAlert || !!genError}
        onClose={() => { setShowAlert(false); }}
        title={genError ? 'Generation Error' : alertMsg.title}
        message={genError ?? alertMsg.message}
      />
    </main>
  );
}
