'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useWizard } from '@/context/WizardContext';
import { apiFetch } from '@/lib/api';
import { persistImageUrl } from '@/lib/persistImage';
import type { Prediction, SceneImage } from '@/types/replicate';

export function useSceneGeneration() {
  const { state, update } = useWizard();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingIndex, setGeneratingIndex] = useState(-1);
  const [generatingTotal, setGeneratingTotal] = useState(0);
  const loopRunning = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Stop generation loop on unmount
  useEffect(() => {
    return () => {
      loopRunning.current = false;
    };
  }, []);

  // ─── Submit a single prediction with retry on 429 ──────────────

  const submitWithRetry = useCallback(async (body: Record<string, unknown>, maxRetries = 5): Promise<string> => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const res = await fetch('/api/generate', {
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
        // Parse retry_after if available
        const retryMatch = errText.match(/resets in ~(\d+)s/);
        const waitSec = retryMatch ? parseInt(retryMatch[1], 10) + 1 : (attempt + 1) * 12;
        await new Promise(r => setTimeout(r, waitSec * 1000));
        continue;
      }

      throw new Error(errText || `Request failed with status ${res.status}`);
    }
    throw new Error('Max retries exceeded');
  }, []);

  // ─── Poll until prediction completes ───────────────────────────

  const pollUntilDone = useCallback(async (predictionId: string): Promise<Prediction> => {
    for (let i = 0; i < 120; i++) {
      await new Promise(r => setTimeout(r, 2500));
      const prediction = await apiFetch<Prediction>(`/api/status/${predictionId}`);
      if (prediction.status === 'succeeded' || prediction.status === 'failed' || prediction.status === 'canceled') {
        return prediction;
      }
    }
    throw new Error('Polling timeout — prediction did not complete in 5 minutes');
  }, []);

  // ─── Generate a single scene: submit → poll → resolve ─────────

  const generateScene = useCallback(async (
    prompt: string,
    sceneId?: string,
    meta?: {
      videoMotionPrompt?: string;
      sceneIndex?: number;
      referenceImages?: { url: string; weight: number; role: string }[];
      negativePrompt?: string;
    },
  ) => {
    setError(null);
    setIsGenerating(true);

    const id = sceneId ?? `scene-${Date.now()}`;
    const currentScenes = stateRef.current.scenes;
    const newScene: SceneImage = {
      id,
      prompt,
      imageUrl: null,
      status: 'generating',
      predictionId: null,
      error: null,
      videoMotionPrompt: meta?.videoMotionPrompt,
      sceneIndex: meta?.sceneIndex,
      imageModelId: stateRef.current.selectedImageModel,
    };

    const existingIndex = currentScenes.findIndex((s) => s.id === id);
    const updatedScenes = existingIndex >= 0
      ? currentScenes.map((s) => (s.id === id ? newScene : s))
      : [...currentScenes, newScene];

    update({ scenes: updatedScenes });

    const seed = meta?.sceneIndex !== undefined && stateRef.current.baseSeed
      ? stateRef.current.baseSeed + meta.sceneIndex
      : undefined;

    try {
      // Step 1: Submit with retry (include reference images for conditioning)
      const predictionId = await submitWithRetry({
        prompt,
        loraUrl: stateRef.current.loraUrl,
        imageModelId: stateRef.current.selectedImageModel,
        aspectRatio: stateRef.current.aspectRatio,
        seed,
        negativePrompt: meta?.negativePrompt,
        ...(meta?.referenceImages?.length ? {
          referenceImages: meta.referenceImages.map((r) => r.url),
          conditioningWeights: meta.referenceImages.map((r) => ({
            url: r.url,
            weight: r.weight,
            role: r.role,
          })),
        } : {}),
      });

      // Update prediction ID
      update({
        scenes: stateRef.current.scenes.map((s) =>
          s.id === id ? { ...s, predictionId } : s
        ),
      });

      // Step 2: Poll until done
      const prediction = await pollUntilDone(predictionId);
      const rawUrl = Array.isArray(prediction.output)
        ? prediction.output[0]
        : prediction.output;

      if (prediction.status === 'succeeded' && rawUrl) {
        const imageUrl = await persistImageUrl(rawUrl);
        update({
          scenes: stateRef.current.scenes.map((s) =>
            s.id === id ? { ...s, status: 'completed' as const, imageUrl, predictionId } : s
          ),
        });
      } else {
        update({
          scenes: stateRef.current.scenes.map((s) =>
            s.id === id ? { ...s, status: 'failed' as const, error: prediction.error, predictionId } : s
          ),
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Generation failed';
      setError(msg);
      update({
        scenes: stateRef.current.scenes.map((s) =>
          s.id === id ? { ...s, status: 'failed' as const, error: msg } : s
        ),
      });
    }

    // Only clear isGenerating if we're not in a batch loop
    if (!loopRunning.current) {
      setIsGenerating(false);
    }
  }, [update, submitWithRetry, pollUntilDone]);

  // ─── Generate multiple scenes sequentially ─────────────────────

  const generateScenesSequentially = useCallback(async (
    sceneInputs: { prompt: string; sceneId: string; meta: { videoMotionPrompt?: string; negativePrompt?: string; sceneIndex: number } }[]
  ) => {
    setError(null);
    setIsGenerating(true);
    loopRunning.current = true;
    setGeneratingTotal(sceneInputs.length);

    for (let i = 0; i < sceneInputs.length; i++) {
      if (!loopRunning.current) break;
      setGeneratingIndex(i);
      const { prompt, sceneId, meta } = sceneInputs[i];
      await generateScene(prompt, sceneId, meta);

      // Small delay between requests to be polite to rate limits
      if (i < sceneInputs.length - 1) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    loopRunning.current = false;
    setIsGenerating(false);
    setGeneratingIndex(-1);
    setGeneratingTotal(0);
  }, [generateScene]);

  // ─── Regenerate a single scene ─────────────────────────────────

  const regenerateScene = useCallback(async (sceneId: string, newPrompt?: string) => {
    const scene = stateRef.current.scenes.find((s) => s.id === sceneId);
    if (!scene) return;
    await generateScene(newPrompt ?? scene.prompt, sceneId, {
      videoMotionPrompt: scene.videoMotionPrompt,
      sceneIndex: scene.sceneIndex,
    });
  }, [generateScene]);

  // ─── Edit a scene ──────────────────────────────────────────────

  const editScene = useCallback(async (sceneId: string, maskUrl: string, editPrompt: string) => {
    const scene = stateRef.current.scenes.find((s) => s.id === sceneId);
    if (!scene || !scene.imageUrl) return;

    setError(null);
    setIsGenerating(true);

    update({
      scenes: stateRef.current.scenes.map((s) =>
        s.id === sceneId ? { ...s, status: 'generating' as const, error: null } : s
      ),
      editingSceneId: sceneId,
      editMaskUrl: maskUrl,
    });

    try {
      const res = await fetch('/api/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: scene.imageUrl,
          maskUrl,
          prompt: editPrompt,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `Edit failed with status ${res.status}`);
      }

      const { predictionId } = await res.json();

      update({
        scenes: stateRef.current.scenes.map((s) =>
          s.id === sceneId ? { ...s, predictionId } : s
        ),
      });

      const prediction = await pollUntilDone(predictionId);
      const rawEditUrl = Array.isArray(prediction.output)
        ? prediction.output[0]
        : prediction.output;

      if (prediction.status === 'succeeded' && rawEditUrl) {
        const imageUrl = await persistImageUrl(rawEditUrl);
        update({
          scenes: stateRef.current.scenes.map((s) =>
            s.id === sceneId ? { ...s, status: 'completed' as const, imageUrl, predictionId } : s
          ),
          editingSceneId: null,
          editMaskUrl: null,
        });
      } else {
        update({
          scenes: stateRef.current.scenes.map((s) =>
            s.id === sceneId ? { ...s, status: 'failed' as const, error: prediction.error, predictionId } : s
          ),
          editingSceneId: null,
          editMaskUrl: null,
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Edit failed';
      setError(msg);
      update({
        scenes: stateRef.current.scenes.map((s) =>
          s.id === sceneId ? { ...s, status: 'failed' as const, error: msg } : s
        ),
        editingSceneId: null,
        editMaskUrl: null,
      });
    } finally {
      setIsGenerating(false);
    }
  }, [update, pollUntilDone]);

  // ─── Generate variants (sequential) ────────────────────────────

  const generateVariants = useCallback(async (sceneId: string, count: number = 2) => {
    const scene = stateRef.current.scenes.find(s => s.id === sceneId);
    if (!scene) return;

    setError(null);
    setIsGenerating(true);
    loopRunning.current = true;

    for (let i = 0; i < count; i++) {
      if (!loopRunning.current) break;

      const variantId = `${sceneId}-var-${i + 1}`;
      const variantSeed = (stateRef.current.baseSeed ?? 0) + (scene.sceneIndex ?? 0) + (i + 1) * 1000;

      const variantScene: SceneImage = {
        id: variantId,
        prompt: scene.prompt,
        imageUrl: null,
        status: 'generating',
        predictionId: null,
        error: null,
        videoMotionPrompt: scene.videoMotionPrompt,
        sceneIndex: scene.sceneIndex,
        variantOf: sceneId,
      };

      update({ scenes: [...stateRef.current.scenes.filter(s => s.id !== variantId), variantScene] });

      try {
        const predictionId = await submitWithRetry({
          prompt: scene.prompt,
          loraUrl: stateRef.current.loraUrl,
          imageModelId: stateRef.current.selectedImageModel,
          aspectRatio: stateRef.current.aspectRatio,
          seed: variantSeed,
        });

        const prediction = await pollUntilDone(predictionId);
        const rawVariantUrl = Array.isArray(prediction.output)
          ? prediction.output[0]
          : prediction.output;

        if (prediction.status === 'succeeded' && rawVariantUrl) {
          const imageUrl = await persistImageUrl(rawVariantUrl);
          update({
            scenes: stateRef.current.scenes.map(s =>
              s.id === variantId ? { ...s, status: 'completed' as const, imageUrl, predictionId } : s
            ),
          });
        } else {
          update({
            scenes: stateRef.current.scenes.map(s =>
              s.id === variantId ? { ...s, status: 'failed' as const, error: prediction.error } : s
            ),
          });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Variant generation failed';
        setError(msg);
        update({
          scenes: stateRef.current.scenes.map(s =>
            s.id === variantId ? { ...s, status: 'failed' as const, error: msg } : s
          ),
        });
      }

      // Delay between variants
      if (i < count - 1) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    loopRunning.current = false;
    setIsGenerating(false);
  }, [update, submitWithRetry, pollUntilDone]);

  // ─── Pick a variant ────────────────────────────────────────────

  const pickVariant = useCallback((variantId: string) => {
    const variant = stateRef.current.scenes.find(s => s.id === variantId);
    if (!variant || !variant.variantOf) return;

    const parentId = variant.variantOf;

    const updatedScenes = stateRef.current.scenes
      .filter(s => s.variantOf !== parentId && s.id !== variantId)
      .map(s => s.id === parentId
        ? { ...s, imageUrl: variant.imageUrl, status: variant.status }
        : s
      );

    update({ scenes: updatedScenes });
  }, [update]);

  // ─── Stop all ──────────────────────────────────────────────────

  const stopAll = useCallback(() => {
    loopRunning.current = false;
    setIsGenerating(false);
  }, []);

  return {
    generateScene,
    generateScenesSequentially,
    regenerateScene,
    editScene,
    generateVariants,
    pickVariant,
    stopAll,
    scenes: state.scenes.filter((s, i, arr) => arr.findIndex((x) => x.id === s.id) === i),
    isGenerating,
    generatingIndex,
    generatingTotal,
    error,
  };
}
