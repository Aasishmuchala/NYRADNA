'use client';

import { useState, useCallback } from 'react';
import { useWizard } from '@/context/WizardContext';
import { apiFetch } from '@/lib/api';

interface VoiceoverResult {
  audioUrl: string;
  durationSeconds: number;
}

export function useVoiceover() {
  const { state, update } = useWizard();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (script?: string) => {
    const text = script ?? state.voiceoverScript;
    if (!text.trim()) {
      setError('Script is empty');
      return null;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await apiFetch<VoiceoverResult>('/api/voiceover', {
        method: 'POST',
        body: JSON.stringify({ script: text }),
      });

      update({ voiceoverUrl: result.audioUrl });
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Voiceover generation failed';
      setError(msg);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [state.voiceoverScript, update]);

  const clear = useCallback(() => {
    update({ voiceoverUrl: null });
  }, [update]);

  return {
    generate,
    clear,
    isGenerating,
    error,
    voiceoverUrl: state.voiceoverUrl,
    script: state.voiceoverScript,
  };
}
