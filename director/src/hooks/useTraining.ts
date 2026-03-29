'use client';

import { useState, useRef, useCallback } from 'react';
import { useWizard } from '@/context/WizardContext';
import { apiFetch, apiUpload } from '@/lib/api';
import type { TrainingStatus } from '@/types/replicate';

export function useTraining() {
  const { state, update } = useWizard();
  const [isUploading, setIsUploading] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const uploadImages = useCallback(async (files: File[]) => {
    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));
      const { zipUrl } = await apiUpload<{ zipUrl: string }>('/api/upload', formData);
      update({ trainingImages: files });
      return zipUrl;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setError(msg);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [update]);

  const startTraining = useCallback(async (files: File[]) => {
    setError(null);
    setIsTraining(true);

    const zipUrl = await uploadImages(files);
    if (!zipUrl) {
      setIsTraining(false);
      return;
    }

    try {
      const { trainingId } = await apiFetch<{ trainingId: string; status: string }>('/api/train', {
        method: 'POST',
        body: JSON.stringify({
          zipUrl,
          triggerWord: state.triggerWord,
        }),
      });

      update({ trainingId });

      // Start polling
      pollRef.current = setInterval(async () => {
        try {
          const status = await apiFetch<TrainingStatus>(`/api/train/${trainingId}`);
          update({ trainingStatus: status });

          if (status.status === 'succeeded') {
            clearInterval(pollRef.current!);
            pollRef.current = null;
            setIsTraining(false);
            update({
              loraUrl: status.output?.weights ?? null,
            });
          } else if (status.status === 'failed' || status.status === 'canceled') {
            clearInterval(pollRef.current!);
            pollRef.current = null;
            setIsTraining(false);
            setError(status.error ?? 'Training failed');
          }
        } catch {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          setIsTraining(false);
          setError('Failed to poll training status');
        }
      }, 3000);
    } catch (err) {
      setIsTraining(false);
      const msg = err instanceof Error ? err.message : 'Training failed to start';
      setError(msg);
    }
  }, [state.triggerWord, update, uploadImages]);

  const cancelTraining = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setIsTraining(false);
  }, []);

  return {
    uploadImages,
    startTraining,
    cancelTraining,
    isUploading,
    isTraining,
    progress: state.trainingStatus?.progress ?? 0,
    status: state.trainingStatus,
    loraUrl: state.loraUrl,
    error,
  };
}
