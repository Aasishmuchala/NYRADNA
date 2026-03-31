'use client';

import { useRouter } from 'next/navigation';
import { usePipelineStore } from '@/lib/stores/pipeline-store';
import { StageId, STAGE_ORDER, DEFAULT_STAGES, PipelineStage } from '@/lib/types/pipeline';

export interface GatedNavResult {
  canProceed: boolean;
  blockedBy: StageId | null;
  blockedByLabel: string | null;
  blockedByHref: string | null;
  errorMessage: string | null;
  navigate: () => void;
}

/**
 * Maps a StageId to its href from DEFAULT_STAGES.
 */
function getStageHref(stageId: StageId): string {
  const stage = DEFAULT_STAGES.find((s) => s.id === stageId);
  return stage?.href ?? '/create/intent';
}

/**
 * Finds the first incomplete mandatory stage blocking the target stage index.
 * Iterates STAGE_ORDER up to targetIndex, finds first stage where canSkip === false
 * and status !== 'completed'.
 */
function findFirstBlocker(
  stages: PipelineStage[],
  targetIndex: number
): PipelineStage | null {
  for (let i = 0; i < targetIndex; i++) {
    const stage = stages[i];
    if (!stage.canSkip && stage.status !== 'completed') {
      return stage;
    }
  }
  return null;
}

/**
 * Reusable hook for pipeline-gated navigation.
 *
 * In freestyle mode (no active pipeline run), all stages are freely navigable.
 * When a pipeline run is active, navigation is gated by mandatory stage completion.
 */
export function useGatedNavigation(targetStageId: StageId): GatedNavResult {
  const router = useRouter();
  const currentRun = usePipelineStore((s) => s.currentRun);
  const canExecuteStage = usePipelineStore((s) => s.canExecuteStage);

  const targetHref = getStageHref(targetStageId);

  // Freestyle mode -- no gating
  if (!currentRun) {
    return {
      canProceed: true,
      blockedBy: null,
      blockedByLabel: null,
      blockedByHref: null,
      errorMessage: null,
      navigate: () => router.push(targetHref),
    };
  }

  const canProceed = canExecuteStage(targetStageId);

  if (canProceed) {
    return {
      canProceed: true,
      blockedBy: null,
      blockedByLabel: null,
      blockedByHref: null,
      errorMessage: null,
      navigate: () => router.push(targetHref),
    };
  }

  // Find the first incomplete mandatory blocker
  const targetIndex = STAGE_ORDER.indexOf(targetStageId);
  const blocker = findFirstBlocker(currentRun.stages, targetIndex);

  return {
    canProceed: false,
    blockedBy: blocker?.id ?? null,
    blockedByLabel: blocker?.label ?? null,
    blockedByHref: blocker?.href ?? null,
    errorMessage: blocker
      ? `Complete "${blocker.label}" first`
      : 'Prerequisites incomplete',
    navigate: () => {
      // Navigate to the blocking stage instead
      if (blocker?.href) router.push(blocker.href);
    },
  };
}
