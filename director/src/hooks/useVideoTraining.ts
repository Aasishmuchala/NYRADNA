'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useWizard } from '@/context/WizardContext';
import { apiFetch, apiUpload } from '@/lib/api';
import type { TrainingStatus } from '@/types/replicate';

export type VideoTrainingTarget = 'cogvideox-5b' | 'hunyuan-video';

export interface VideoTrainingConfig {
  steps?: number;
  learningRate?: number;
  targetModel: VideoTrainingTarget;
  password: string;
}

export function useVideoTraining() {
  const { state, update } = useWizard();
  const [isUploading, setIsUploading] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus | null>(null);
  const [videoLoraUrl, setVideoLoraUrl] = useState<string | null>(state.videoLoraUrl ?? null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, []);

  const uploadVideos = useCallback(async (files: File[]) => {
    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));
      const { zipUrl } = await apiUpload<{ zipUrl: string }>('/api/upload', formData);
      return zipUrl;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setError(msg);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const startTraining = useCallback(async (files: File[], config: VideoTrainingConfig) => {
    setError(null);
    setIsTraining(true);
    setTrainingStatus(null);

    const zipUrl = await uploadVideos(files);
    if (!zipUrl) {
      setIsTraining(false);
      return;
    }

    try {
      const { trainingId } = await apiFetch<{ trainingId: string; status: string }>('/api/train-video', {
        method: 'POST',
        body: JSON.stringify({
          zipUrl,
          triggerWord: state.triggerWord,
          steps: config.steps,
          learningRate: config.learningRate,
          targetModel: config.targetModel,
          password: config.password,
        }),
      });

      // Poll for status using the same /api/train/[id] endpoint (it reads from Replicate)
      pollRef.current = setInterval(async () => {
        try {
          const status = await apiFetch<TrainingStatus>(`/api/train/${trainingId}`);
          setTrainingStatus(status);

          if (status.status === 'succeeded') {
            clearInterval(pollRef.current!);
            pollRef.current = null;
            setIsTraining(false);
            const weightsUrl = status.output?.weights ?? null;
            setVideoLoraUrl(weightsUrl);
            update({ videoLoraUrl: weightsUrl });
          } else if (status.status === 'failed' || status.status === 'canceled') {
            clearInterval(pollRef.current!);
            pollRef.current = null;
            setIsTraining(false);
            setError(status.error ?? 'Video training failed');
          }
        } catch {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          setIsTraining(false);
          setError('Failed to poll training status');
        }
      }, 5000); // Poll every 5s (video training is slower)
    } catch (err) {
      setIsTraining(false);
      const msg = err instanceof Error ? err.message : 'Video training failed to start';
      setError(msg);
    }
  }, [state.triggerWord, update, uploadVideos]);

  const cancelTraining = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setIsTraining(false);
  }, []);

  return {
    uploadVideos,
    startTraining,
    cancelTraining,
    isUploading,
    isTraining,
    progress: trainingStatus?.progress ?? 0,
    status: trainingStatus,
    videoLoraUrl,
    error,
  };
}
