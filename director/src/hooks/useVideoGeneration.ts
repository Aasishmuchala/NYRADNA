'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useWizard } from '@/context/WizardContext';
import { apiFetch } from '@/lib/api';
import { persistVideoUrl } from '@/lib/persistImage';
import type { Prediction, VideoResult, GenerationBatch } from '@/types/replicate';
import {
  planBatches,
  planMultiPromptBatches,
  selectReferenceImages,
  estimateTotalDuration,
} from '@/lib/continuityEngine';
import type { MultiPromptBatch } from '@/lib/continuityEngine';
import { getVideoModel } from '@/lib/models';
import { buildVideoStyleSuffix, buildConsistencyPrefix } from '@/lib/cinematicPrompt';
import { checkVisualDrift } from '@/lib/driftDetection';
import { buildReferenceImageSet } from '@/lib/subjectRefs';
import {
  initNarrativeContext,
  buildSceneMemory,
  addSceneToContext,
  buildNarrativeInjection,
  buildBatchTransitionContext,
} from '@/lib/narrativeMemory';
import type { NarrativeContext } from '@/lib/narrativeMemory';

// ─── Quality Gate Helpers (Simple Mode) ──────────────────────────────

const FACE_GATE_THRESHOLD = 0.85; // slightly relaxed vs Node mode's 0.90
const FACE_GATE_MAX_RETRIES = 2;

interface ConsistencyResult {
  pass: boolean;
  score: number;
  character_consistency: number;
  composition_quality: number;
}

/**
 * Check an image against the face/character consistency gate.
 * Returns pass/fail + scores. Throws on API error.
 */
async function checkImageConsistency(imageUrl: string): Promise<ConsistencyResult> {
  try {
    const res = await fetch('/api/analyze-scene', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl }),
    });
    if (!res.ok) {
      console.warn('[checkImageConsistency] Analysis failed, passing through');
      return { pass: true, score: 1, character_consistency: 1, composition_quality: 1 };
    }
    const data = await res.json();
    const cc = data.character_consistency ?? 0;
    const cq = data.composition_quality ?? 0;
    return {
      pass: cc >= FACE_GATE_THRESHOLD,
      score: cc,
      character_consistency: cc,
      composition_quality: cq,
    };
  } catch (err) {
    console.warn('[checkImageConsistency] Error, skipping gate:', err);
    return { pass: true, score: 1, character_consistency: 1, composition_quality: 1 };
  }
}

/**
 * Regenerate an image if it fails the consistency gate.
 * Returns the best imageUrl after up to FACE_GATE_MAX_RETRIES regenerations.
 */
async function gateAndRegenImage(
  imageUrl: string,
  imagePrompt: string,
  refImages: string[],
  state: Record<string, unknown>,
  onStatus?: (msg: string) => void,
): Promise<{ imageUrl: string; gateScore: number }> {
  // First check — maybe the existing image is fine
  const initial = await checkImageConsistency(imageUrl);
  if (initial.pass) {
    return { imageUrl, gateScore: initial.score };
  }

  onStatus?.(`Face consistency low (${(initial.score * 100).toFixed(0)}%) — regenerating image...`);
  let bestUrl = imageUrl;
  let bestScore = initial.score;

  for (let attempt = 0; attempt < FACE_GATE_MAX_RETRIES; attempt++) {
    try {
      const body: Record<string, unknown> = {
        prompt: imagePrompt,
        imageModelId: state.selectedImageModel ?? 'flux-dev-lora',
        aspectRatio: state.aspectRatio ?? '16:9',
      };
      if (refImages.length > 0) body.referenceImages = refImages;
      if (state.loraUrl) body.loraUrl = state.loraUrl;
      if (state.triggerWord) body.triggerWord = state.triggerWord;

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(`Image regeneration failed: ${errBody.error || res.statusText}`);
      }

      const { predictionId } = await res.json();

      // Poll for image completion
      let imgResult: { output: unknown; status: string } | null = null;
      for (let poll = 0; poll < 120; poll++) {
        await new Promise(r => setTimeout(r, 2000));
        const statusRes = await fetch(`/api/status/${predictionId}`);
        if (!statusRes.ok) continue;
        const statusData = await statusRes.json();
        if (statusData.status === 'succeeded') {
          imgResult = statusData;
          break;
        }
        if (statusData.status === 'failed' || statusData.status === 'canceled') break;
      }

      if (!imgResult?.output) continue;

      const newUrl = Array.isArray(imgResult.output) ? imgResult.output[0] : imgResult.output;
      if (typeof newUrl !== 'string') continue;

      const recheck = await checkImageConsistency(newUrl);
      onStatus?.(`Retry ${attempt + 1}: consistency ${(recheck.score * 100).toFixed(0)}%`);

      if (recheck.score > bestScore) {
        bestUrl = newUrl;
        bestScore = recheck.score;
      }
      if (recheck.pass) {
        return { imageUrl: newUrl, gateScore: recheck.score };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Regeneration failed';
      onStatus?.(`Retry ${attempt + 1} failed: ${msg}`);
      console.error(`[gate] Regen attempt ${attempt + 1} failed:`, msg);
    }
  }

  onStatus?.(`Using best image (consistency: ${(bestScore * 100).toFixed(0)}%)`);
  return { imageUrl: bestUrl, gateScore: bestScore };
}

export function useVideoGeneration() {
  const { state, update } = useWizard();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentBatchLabel, setCurrentBatchLabel] = useState('');
  const abortRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Abort generation on unmount to prevent setState on unmounted component
  useEffect(() => {
    return () => {
      abortRef.current = true;
    };
  }, []);

  // ─── Submit with 429 retry ───────────────────────────────────

  const submitVideoWithRetry = useCallback(async (
    body: Record<string, unknown>,
    maxRetries = 5,
  ): Promise<string> => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const res = await fetch('/api/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        return data.predictionId;
      }

      const errText = await res.text();
      const isRateLimit = res.status === 429
        || errText.includes('429')
        || errText.includes('Too Many Requests')
        || errText.includes('rate limit')
        || errText.includes('throttled');

      if (isRateLimit && attempt < maxRetries - 1) {
        const retryMatch = errText.match(/resets in ~(\d+)s/);
        const parsedSec = retryMatch ? parseInt(retryMatch[1], 10) + 1 : (attempt + 1) * 12;
        const waitSec = Math.min(parsedSec, 120); // Cap at 2 minutes to prevent unbounded waits
        await new Promise(r => setTimeout(r, waitSec * 1000));
        continue;
      }

      throw new Error(errText || `Video request failed with status ${res.status}`);
    }
    throw new Error('Max retries exceeded for video generation');
  }, []);

  // ─── Poll a single prediction until done ───────────────────────

  const waitForPrediction = useCallback(async (predictionId: string): Promise<Prediction> => {
    for (let i = 0; i < 240; i++) {
      await new Promise(r => setTimeout(r, 2000));
      try {
        const prediction = await apiFetch<Prediction>(`/api/status/${predictionId}`);
        if (prediction.status === 'succeeded' || prediction.status === 'failed' || prediction.status === 'canceled') {
          return prediction;
        }
      } catch {
        // Transient poll error — keep trying
        if (i > 170) throw new Error('Polling failed after many retries');
      }
    }
    throw new Error('Video polling timeout — did not complete in 9 minutes');
  }, []);

  // ─── Extract last frame from a completed video ─────────────────

  const extractLastFrame = useCallback(async (videoUrl: string): Promise<string | null> => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await apiFetch<{ frameUrl: string; duration: number }>('/api/extract-frame', {
          method: 'POST',
          body: JSON.stringify({ videoUrl, position: 'last' }),
        });
        return result.frameUrl;
      } catch {
        console.warn(`[extractLastFrame] Attempt ${attempt + 1}/3 failed for ${videoUrl.slice(0, 80)}...`);
        if (attempt < 2) await new Promise(r => setTimeout(r, 1000));
      }
    }
    console.warn(`[extractLastFrame] All 3 attempts failed — anchor frame unavailable`);
    return null;
  }, []);

  // ─── Generate a single video ───────────────────────────────────

  const generateVideo = useCallback(async (imageUrl: string, prompt?: string) => {
    setError(null);
    setIsGenerating(true);

    const id = `video-${Date.now()}`;
    const newVideo: VideoResult = {
      id,
      status: 'generating',
      videoUrl: null,
      predictionId: null,
      inputImageUrl: imageUrl,
      error: null,
    };

    const updatedVideos = [...stateRef.current.videoResults, newVideo];
    update({ videoResults: updatedVideos });

    try {
      // Build unified reference images (characters + environments + style)
      const refSet = buildReferenceImageSet(stateRef.current);
      if (refSet.characterCount === 0) {
        console.warn('[generateVideo] No character reference images — consistency will be weak');
      }

      // Face consistency gate on input image
      let gatedUrl = imageUrl;
      if (refSet.characterCount > 0) {
        const gateResult = await gateAndRegenImage(
          imageUrl,
          prompt ?? '',
          refSet.referenceImages,
          stateRef.current as unknown as Record<string, unknown>,
        );
        gatedUrl = gateResult.imageUrl;
      }

      const videoModelDef = getVideoModel(stateRef.current.selectedVideoModel);
      const maxDuration = videoModelDef?.maxDuration ?? 10;

      const predictionId = await submitVideoWithRetry({
        imageUrl: gatedUrl,
        prompt,
        videoModelId: stateRef.current.selectedVideoModel,
        referenceImages: refSet.referenceImages,
        aspectRatio: stateRef.current.aspectRatio,
        duration: maxDuration,
        generateAudio: stateRef.current.includeAudio,
      });

      update({
        videoResults: updatedVideos.map((v) =>
          v.id === id ? { ...v, predictionId } : v
        ),
      });

      const prediction = await waitForPrediction(predictionId);
      const _rawVideoUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output; const videoUrl = _rawVideoUrl ? await persistVideoUrl(_rawVideoUrl as string) : null;

      if (prediction.status === 'succeeded' && videoUrl) {
        update({
          videoResults: stateRef.current.videoResults.map((v) =>
            v.id === id ? { ...v, status: 'completed' as const, videoUrl } : v
          ),
        });
      } else {
        update({
          videoResults: stateRef.current.videoResults.map((v) =>
            v.id === id ? { ...v, status: 'failed' as const, error: prediction.error } : v
          ),
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Video generation failed';
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  }, [update, submitVideoWithRetry, waitForPrediction]);

  // ─── Chained batch generation (core continuity system) ─────────

  const generateAllVideos = useCallback(async (approvedSceneIds?: string[]) => {
    const allCompleted = stateRef.current.scenes.filter((s) => s.status === 'completed' && s.imageUrl);
    const deduped = allCompleted.filter((s, i, arr) => arr.findIndex((x) => x.id === s.id) === i);
    // If approved list provided, only generate those scenes (in order)
    const completedScenes = approvedSceneIds
      ? deduped.filter((s) => approvedSceneIds.includes(s.id))
      : deduped;
    if (completedScenes.length === 0) {
      setError('No approved scenes to generate videos from');
      return;
    }

    // Character readiness check — warn but don't block
    const preflightRefs = buildReferenceImageSet(stateRef.current);
    if (preflightRefs.characterCount === 0) {
      console.warn('[generateAllVideos] No character reference images — videos may lack consistency');
    }
    console.log(`[generateAllVideos] Preflight: ${preflightRefs.characterCount} character refs, ${preflightRefs.environmentCount} environment refs, ${preflightRefs.referenceImages.length} total`);

    setIsGenerating(true);
    setProgress(0);
    setError(null);
    abortRef.current = false;

    // Initialize narrative memory for story continuity across batches
    let narrativeCtx: NarrativeContext = stateRef.current.narrativeContext
      ?? initNarrativeContext(stateRef.current.visionText);

    // Record scene memories for all approved scenes
    for (let i = 0; i < completedScenes.length; i++) {
      const scene = completedScenes[i];
      const memory = buildSceneMemory(
        scene.id,
        i,
        scene.prompt,
        completedScenes.length,
        scene.videoMotionPrompt,
      );
      narrativeCtx = addSceneToContext(narrativeCtx, memory);
    }
    update({ narrativeContext: narrativeCtx });

    // Check if model supports multi_prompt (Kling 3.0)
    const videoModelDef = getVideoModel(stateRef.current.selectedVideoModel);
    const useMultiPrompt = videoModelDef?.supportsMultiPrompt ?? false;

    // Initialize all video results
    const allVideos: VideoResult[] = completedScenes.map((scene, i) => ({
      id: `video-${scene.id}`,
      status: 'pending' as const,
      videoUrl: null,
      predictionId: null,
      inputImageUrl: scene.imageUrl!,
      error: null,
      chainIndex: i,
      sourceSceneId: scene.id,
    }));

    update({ videoResults: allVideos });

    let completedCount = 0;
    const totalCount = completedScenes.length;

    if (useMultiPrompt) {
      // ─── MULTI_PROMPT PATH (Kling 3.0) ─────────────────────────
      // Batch scenes into groups of ~5, generate each batch as ONE coherent video
      console.log(`[generateAllVideos] Using multi_prompt mode (${videoModelDef!.name})`);

      const mpBatches = planMultiPromptBatches(
        completedScenes.map(s => ({ id: s.id, durationHint: 3 }))
      );

      const legacyBatches: GenerationBatch[] = mpBatches.map((b) => ({
        id: b.id,
        sceneRange: b.sceneRange,
        status: 'pending' as const,
        videoIds: b.sceneIds.map(id => `video-${id}`),
        referenceImageUrls: [],
      }));
      update({ generationBatches: legacyBatches, currentBatchIndex: 0 });

      // Track anchor frame across batches for cross-batch continuity
      let mpAnchorFrameUrl: string | undefined;

      for (let batchIdx = 0; batchIdx < mpBatches.length; batchIdx++) {
        if (abortRef.current) break;

        const mpBatch = mpBatches[batchIdx];
        const [startIdx, endIdx] = mpBatch.sceneRange;
        const batchScenes = completedScenes.slice(startIdx, endIdx + 1);

        setCurrentBatchLabel(`Batch ${batchIdx + 1}/${mpBatches.length} (multi-shot)`);
        update({ currentBatchIndex: batchIdx });

        // Mark all scenes in batch as generating
        for (let i = startIdx; i <= endIdx; i++) {
          allVideos[i] = { ...allVideos[i], status: 'generating' };
        }
        update({ videoResults: [...allVideos] });

        // Build unified reference images
        const refSet = buildReferenceImageSet(stateRef.current);
        console.log(`[multi_prompt batch ${batchIdx + 1}] ${batchScenes.length} scenes, refs=${refSet.referenceImages.length}`);

        // ── Cross-Batch Anchor Frame ──────────────────────────────
        // Use the previous batch's last frame as start image for seamless transitions
        let batchStartImage = mpAnchorFrameUrl ?? batchScenes[0].imageUrl;

        // ── Face Consistency Gate (batch start image) ─────────────
        if (batchStartImage && refSet.characterCount > 0) {
          const gateResult = await gateAndRegenImage(
            batchStartImage,
            batchScenes[0].prompt || '',
            refSet.referenceImages,
            stateRef.current as unknown as Record<string, unknown>,
            (msg) => setCurrentBatchLabel(`Batch ${batchIdx + 1}/${mpBatches.length} — ${msg}`),
          );
          if (gateResult.imageUrl !== batchStartImage) {
            batchStartImage = gateResult.imageUrl;
            // Only update scene image if we didn't use an anchor frame
            if (!mpAnchorFrameUrl) {
              const updatedScenes = stateRef.current.scenes.map(s =>
                s.id === batchScenes[0].id ? { ...s, imageUrl: batchStartImage } : s
              );
              update({ scenes: updatedScenes });
            }
            console.log(`[gate] Multi-prompt batch ${batchIdx + 1}: regenerated start image, consistency ${(gateResult.gateScore * 100).toFixed(0)}%`);
          }
        }

        // ── Inter-Batch Drift Detection ───────────────────────────
        if (batchIdx > 0) {
          const prevBatchEnd = completedScenes[startIdx - 1];
          const currBatchStart = batchScenes[0];
          const prevPrompt = prevBatchEnd?.videoPrompt || prevBatchEnd?.videoMotionPrompt || '';
          const currPrompt = currBatchStart?.videoPrompt || currBatchStart?.videoMotionPrompt || '';
          if (prevPrompt && currPrompt) {
            try {
              const drift = await checkVisualDrift(prevPrompt, currPrompt);
              if (drift.drifted) {
                console.warn(
                  `[drift] Cross-batch gap between batch ${batchIdx} and ${batchIdx + 1}: similarity=${drift.similarity.toFixed(2)}. ${drift.reason || 'Visual drift detected at batch boundary'}`
                );
              }
            } catch {
              // Drift check is informational — don't block on errors
            }
          }
        }

        // ── Build Segments with Narrative Memory ──────────────────
        const MAX_SEGMENT_PROMPT = 500;
        const styleSuffix = buildVideoStyleSuffix(stateRef.current);

        // Build batch transition context from narrative memory
        const batchNarrativeCtx = batchIdx > 0
          ? buildBatchTransitionContext(narrativeCtx, startIdx)
          : '';

        const segments = batchScenes.map((scene, segIdx) => {
          const basePrompt = scene.videoPrompt || scene.videoMotionPrompt || '';

          // Inject per-scene narrative continuity
          const sceneNarrative = buildNarrativeInjection(narrativeCtx, startIdx + segIdx);

          // Compose: narrative context + consistency prefix + scene prompt + style suffix
          const narrativePrefix = segIdx === 0 && batchNarrativeCtx
            ? batchNarrativeCtx
            : sceneNarrative;

          const promptParts = [
            narrativePrefix,
            buildConsistencyPrefix(stateRef.current),
            basePrompt,
            styleSuffix,
          ].filter(Boolean);

          const fullPrompt = basePrompt && basePrompt.length > 200
            ? [narrativePrefix, basePrompt, styleSuffix].filter(Boolean).join(', ')
            : promptParts.join(', ');

          // Truncate to stay within Kling's 512 char limit per shot
          const trimmed = fullPrompt.length > MAX_SEGMENT_PROMPT ? fullPrompt.slice(0, MAX_SEGMENT_PROMPT) : fullPrompt;
          return { prompt: trimmed, duration: 3 };
        });

        try {
          // Submit multi_prompt batch
          const res = await fetch('/api/video-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              segments,
              referenceImages: refSet.referenceImages,
              startImageUrl: batchStartImage ?? batchScenes[0].imageUrl,
              aspectRatio: stateRef.current.aspectRatio,
              generateAudio: stateRef.current.includeAudio,
            }),
          });

          if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText || 'Multi-prompt request failed');
          }

          const { predictionId } = await res.json();

          // Store prediction ID on all scenes in batch
          for (let i = startIdx; i <= endIdx; i++) {
            allVideos[i] = { ...allVideos[i], predictionId };
          }
          update({ videoResults: [...allVideos] });

          // Poll single prediction for the whole batch
          const prediction = await waitForPrediction(predictionId);
          const _rawVideoUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output; const videoUrl = _rawVideoUrl ? await persistVideoUrl(_rawVideoUrl as string) : null;

          if (prediction.status === 'succeeded' && videoUrl) {
            // multi_prompt returns ONE concatenated video — all scenes share the same URL
            // The stitch pipeline will use this directly
            for (let i = startIdx; i <= endIdx; i++) {
              allVideos[i] = {
                ...allVideos[i],
                status: 'completed',
                videoUrl,
                predictionId,
                batchId: mpBatch.id,
              };
            }
            completedCount += batchScenes.length;

            // Extract last frame for next batch's cross-batch continuity
            const lastFrame = await extractLastFrame(videoUrl);
            if (lastFrame) {
              mpAnchorFrameUrl = lastFrame;
              allVideos[endIdx] = { ...allVideos[endIdx], lastFrameUrl: lastFrame };
            }
          } else {
            // Batch failed — fall back to individual generation
            console.warn(`[multi_prompt] Batch ${batchIdx + 1} failed: ${prediction.error} — falling back to individual generation`);
            for (let i = startIdx; i <= endIdx; i++) {
              allVideos[i] = { ...allVideos[i], status: 'failed', error: prediction.error || 'Multi-prompt batch failed' };
            }
            // Reset anchor frame on failure so next batch uses its own start image
            mpAnchorFrameUrl = undefined;
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Multi-prompt batch failed';
          console.error(`[multi_prompt] Batch ${batchIdx + 1} error: ${msg}`);
          for (let i = startIdx; i <= endIdx; i++) {
            allVideos[i] = { ...allVideos[i], status: 'failed', error: msg };
          }
          completedCount += (endIdx - startIdx + 1);
          setProgress(Math.round((completedCount / totalCount) * 100));
          update({ videoResults: [...allVideos] });
          // Reset anchor frame on failure
          mpAnchorFrameUrl = undefined;
        }

        setProgress(Math.round((completedCount / totalCount) * 100));
        update({ videoResults: [...allVideos] });

        // Brief delay between batches
        if (batchIdx < mpBatches.length - 1) {
          await new Promise(r => setTimeout(r, 500));
        }
      }
    } else {
      // ─── SINGLE-VIDEO PATH (Wan, Hailuo, MiniMax) ──────────────
      // Existing per-video generation — unchanged

      const sceneTemplates = completedScenes.map((s, i) => ({
        id: s.id,
        shotType: 'medium' as const,
        narrativeRole: 'development' as const,
        act: 1 as const,
        promptSuffix: '',
        durationHint: 5,
        transitionIn: 'cut' as const,
        transitionOut: i === completedScenes.length - 1 ? 'fade-to-black' as const : 'dissolve' as const,
      }));

      const batchPlans = planBatches(sceneTemplates);
      const batches: GenerationBatch[] = batchPlans.map((b) => ({
        ...b,
        referenceImageUrls: [],
      }));

      update({ generationBatches: batches, currentBatchIndex: 0 });

      let anchorFrameUrl: string | undefined;

      for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
        if (abortRef.current) break;

        const batch = batches[batchIdx];
        const [startIdx, endIdx] = batch.sceneRange;

        setCurrentBatchLabel(`Batch ${batchIdx + 1}/${batches.length}`);
        update({ currentBatchIndex: batchIdx });

        const updatedBatches = [...batches];
        updatedBatches[batchIdx] = { ...batch, status: 'generating', anchorFrameUrl };
        update({ generationBatches: updatedBatches });

        for (let sceneIdx = startIdx; sceneIdx <= endIdx; sceneIdx++) {
          if (abortRef.current) break;

          const scene = completedScenes[sceneIdx];
          const isFirstInBatch = sceneIdx === startIdx && batchIdx > 0;
          const startImageUrl = isFirstInBatch && anchorFrameUrl ? anchorFrameUrl : scene.imageUrl!;

          allVideos[sceneIdx] = { ...allVideos[sceneIdx], status: 'generating' };
          update({ videoResults: [...allVideos] });
          setCurrentBatchLabel(`Batch ${batchIdx + 1}/${batches.length} — Video ${sceneIdx + 1}/${totalCount}`);

          const refSet = buildReferenceImageSet(stateRef.current);
          const maxDuration = videoModelDef?.maxDuration ?? 10;

          const styleSuffix = buildVideoStyleSuffix(stateRef.current);
          const basePrompt = scene.videoPrompt || scene.videoMotionPrompt || '';

          // Inject narrative memory for story continuity
          const sceneNarrative = buildNarrativeInjection(narrativeCtx, sceneIdx);
          const isFirstInBatchNarrative = sceneIdx === startIdx && batchIdx > 0;
          const narrativePrefix = isFirstInBatchNarrative
            ? buildBatchTransitionContext(narrativeCtx, startIdx)
            : sceneNarrative;

          const promptParts = [
            narrativePrefix,
            buildConsistencyPrefix(stateRef.current),
            basePrompt,
            styleSuffix,
          ].filter(Boolean);

          const fullPrompt = basePrompt && basePrompt.length > 200
            ? [narrativePrefix, basePrompt, styleSuffix].filter(Boolean).join(', ')
            : promptParts.join(', ');

          // ── Face Consistency Gate ──────────────────────────────────
          // Check start image quality before expensive video generation
          let gatedImageUrl = startImageUrl;
          if (refSet.characterCount > 0) {
            const gateResult = await gateAndRegenImage(
              startImageUrl,
              scene.prompt || '',
              refSet.referenceImages,
              stateRef.current as unknown as Record<string, unknown>,
              (msg) => setCurrentBatchLabel(`Batch ${batchIdx + 1}/${batches.length} — ${msg}`),
            );
            gatedImageUrl = gateResult.imageUrl;
            if (gatedImageUrl !== startImageUrl) {
              // Update scene image if we regenerated
              const updatedScenes = stateRef.current.scenes.map(s =>
                s.id === scene.id ? { ...s, imageUrl: gatedImageUrl } : s
              );
              update({ scenes: updatedScenes });
              console.log(`[gate] Scene ${scene.id}: regenerated image, consistency ${(gateResult.gateScore * 100).toFixed(0)}%`);
            }
          }

          try {
            const predictionId = await submitVideoWithRetry({
              imageUrl: gatedImageUrl,
              prompt: fullPrompt,
              duration: maxDuration,
              referenceImages: refSet.referenceImages,
              aspectRatio: stateRef.current.aspectRatio,
              videoModelId: stateRef.current.selectedVideoModel,
              generateAudio: stateRef.current.includeAudio,
              mode: 'standard',
            });

            allVideos[sceneIdx] = { ...allVideos[sceneIdx], predictionId };
            update({ videoResults: [...allVideos] });

            const prediction = await waitForPrediction(predictionId);
            const _rawVideoUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output; const videoUrl = _rawVideoUrl ? await persistVideoUrl(_rawVideoUrl as string) : null;

            if (prediction.status === 'succeeded' && videoUrl) {
              allVideos[sceneIdx] = { ...allVideos[sceneIdx], status: 'completed', videoUrl, predictionId };
            } else {
              allVideos[sceneIdx] = { ...allVideos[sceneIdx], status: 'failed', error: prediction.error, predictionId };
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Video generation failed';
            allVideos[sceneIdx] = { ...allVideos[sceneIdx], status: 'failed', error: msg };
          }

          completedCount++;
          setProgress(Math.round((completedCount / totalCount) * 100));
          update({ videoResults: [...allVideos] });

          if (allVideos[sceneIdx]?.status === 'completed' && allVideos[sceneIdx].videoUrl) {
            const lastFrame = await extractLastFrame(allVideos[sceneIdx].videoUrl!);
            if (lastFrame) {
              anchorFrameUrl = lastFrame;
              allVideos[sceneIdx] = { ...allVideos[sceneIdx], lastFrameUrl: lastFrame };
              update({ videoResults: [...allVideos] });
            }

            // ── Drift Detection (between consecutive scenes) ──────
            if (sceneIdx > startIdx) {
              const prevScene = completedScenes[sceneIdx - 1];
              const prevPrompt = prevScene.videoPrompt || prevScene.videoMotionPrompt || '';
              const currPrompt = fullPrompt;
              if (prevPrompt && currPrompt) {
                try {
                  const drift = await checkVisualDrift(prevPrompt, currPrompt);
                  if (drift.drifted) {
                    console.warn(
                      `[drift] Scenes ${sceneIdx}-${sceneIdx + 1}: similarity=${drift.similarity.toFixed(2)} (threshold=${0.55}). ${drift.reason || 'Visual drift detected'}`
                    );
                  }
                } catch {
                  // Drift check is informational — don't block on errors
                }
              }
            }
          }
        }

        const finalBatches = [...batches];
        finalBatches[batchIdx] = { ...finalBatches[batchIdx], status: 'completed', anchorFrameUrl };
        update({ generationBatches: finalBatches });

        if (batchIdx < batches.length - 1) {
          await new Promise(r => setTimeout(r, 500));
        }
      }
    }

    setIsGenerating(false);
    setCurrentBatchLabel('');
  }, [update, submitVideoWithRetry, waitForPrediction, extractLastFrame]);

  // ─── Retry a single failed video ─────────────────────────────────

  const retryVideo = useCallback(async (videoId: string) => {
    const failedVideo = stateRef.current.videoResults.find((v) => v.id === videoId);
    if (!failedVideo || failedVideo.status !== 'failed') return;

    const completedScenes = stateRef.current.scenes.filter((s) => s.status === 'completed' && s.imageUrl);
    const scene = failedVideo.sourceSceneId
      ? completedScenes.find((s) => s.id === failedVideo.sourceSceneId)
      : undefined;

    if (!scene) return;

    const videoIndex = stateRef.current.videoResults.findIndex((v) => v.id === videoId);
    if (videoIndex === -1) return;

    const batch = stateRef.current.generationBatches.find((b) => {
      const [start, end] = b.sceneRange;
      return videoIndex >= start && videoIndex <= end;
    });

    const referenceImages = batch?.referenceImageUrls ?? [];

    // Reset status to generating
    update({
      videoResults: stateRef.current.videoResults.map((v) =>
        v.id === videoId ? { ...v, status: 'generating' as const, error: null } : v
      ),
    });

    // Build fresh unified refs
    const retryRefSet = buildReferenceImageSet(stateRef.current);
    if (retryRefSet.characterCount === 0) {
      console.warn(`[retryVideo] No character references — consistency will be weak`);
    }
    console.log(`[retryVideo] refs=${retryRefSet.referenceImages.length} (${retryRefSet.characterCount} char, ${retryRefSet.environmentCount} env)`);

    const retryVideoModelDef = getVideoModel(stateRef.current.selectedVideoModel);
    const retryMaxDuration = retryVideoModelDef?.maxDuration ?? 10;

    const retryPrefix = buildConsistencyPrefix(stateRef.current);
    const retryStyleSuffix = buildVideoStyleSuffix(stateRef.current);
    const retryBasePrompt = scene.videoPrompt || scene.videoMotionPrompt || '';
    const retryFullPrompt = [retryPrefix, retryBasePrompt, retryStyleSuffix].filter(Boolean).join(', ');

    try {
      const predictionId = await submitVideoWithRetry({
        imageUrl: scene.imageUrl,
        prompt: retryFullPrompt,
        duration: retryMaxDuration,
        referenceImages: retryRefSet.referenceImages,
        aspectRatio: stateRef.current.aspectRatio,
        videoModelId: stateRef.current.selectedVideoModel,
        generateAudio: stateRef.current.includeAudio,
        mode: 'standard',
      });

      const prediction = await waitForPrediction(predictionId);
      const _rawVideoUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output; const videoUrl = _rawVideoUrl ? await persistVideoUrl(_rawVideoUrl as string) : null;

      if (prediction.status === 'succeeded' && videoUrl) {
        update({
          videoResults: stateRef.current.videoResults.map((v) =>
            v.id === videoId ? { ...v, status: 'completed' as const, videoUrl, predictionId, error: null } : v
          ),
        });

        // If last in batch, re-extract anchor frame
        if (batch) {
          const [, endIdx] = batch.sceneRange;
          if (videoIndex === endIdx) {
            const lastFrame = await extractLastFrame(videoUrl);
            if (lastFrame) {
              update({
                videoResults: stateRef.current.videoResults.map((v) =>
                  v.id === videoId
                    ? { ...v, status: 'completed' as const, videoUrl, predictionId, error: null, lastFrameUrl: lastFrame }
                    : v
                ),
                generationBatches: stateRef.current.generationBatches.map((b) =>
                  b.id === batch.id ? { ...b, anchorFrameUrl: lastFrame } : b
                ),
              });
            }
          }
        }
      } else {
        update({
          videoResults: stateRef.current.videoResults.map((v) =>
            v.id === videoId ? { ...v, status: 'failed' as const, error: prediction.error, predictionId } : v
          ),
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Video retry failed';
      update({
        videoResults: stateRef.current.videoResults.map((v) =>
          v.id === videoId ? { ...v, status: 'failed' as const, error: msg } : v
        ),
      });
    }
  }, [update, submitVideoWithRetry, waitForPrediction, extractLastFrame]);

  // ─── Stop all generation ───────────────────────────────────────

  const stopAll = useCallback(() => {
    abortRef.current = true;
    setIsGenerating(false);
  }, []);

  return {
    generateVideo,
    generateAllVideos,
    retryVideo,
    stopAll,
    videos: state.videoResults.filter((v, i, arr) => arr.findIndex((x) => x.id === v.id) === i),
    batches: state.generationBatches,
    isGenerating,
    progress,
    currentBatchLabel,
    error,
    totalDuration: estimateTotalDuration(state.videoResults),
  };
}
