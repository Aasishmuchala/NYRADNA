import { useMemo, useCallback } from 'react';
import { usePipelineStore } from '@/lib/stores/pipeline-store';
import { PipelineOrchestrator } from '@/lib/pipeline/orchestrator';
import type { StageId } from '@/lib/types/pipeline';

interface OrchestratorHook {
  /** Advance past current stage (auto-skips canSkip stages, stops at mandatory or awaitUserAdvance stages) */
  advanceToNext: () => StageId | null;
  /** Manually advance past an awaitUserAdvance boundary */
  advanceUserBoundary: () => StageId | null;
  /** Whether pipeline is paused at a user-advance boundary */
  isPausedAtBoundary: boolean;
  /** Current stage ID */
  currentStageId: StageId | null;
  /** Whether there is an active pipeline run */
  isActive: boolean;
  /** Start a new pipeline run */
  startRun: () => void;
  /** Reset to freestyle mode */
  resetRun: () => void;
}

/**
 * React hook wrapping PipelineOrchestrator for component use.
 *
 * - Creates a stable orchestrator instance via useMemo
 * - Subscribes to reactive store state (currentRun) so components re-render
 *   when pipeline state changes
 * - Exposes a clean API: advanceToNext, advanceUserBoundary, isPausedAtBoundary,
 *   startRun, resetRun
 * - Components do NOT need to know about the PipelineOrchestrator class directly
 */
export function usePipelineOrchestrator(): OrchestratorHook {
  const orchestrator = useMemo(() => new PipelineOrchestrator(), []);

  // Subscribe to reactive store state for re-rendering
  const currentRun = usePipelineStore((s) => s.currentRun);
  const startRun = usePipelineStore((s) => s.startRun);
  const resetRun = usePipelineStore((s) => s.resetRun);

  // Derive reactive values from current state
  const currentStageId = currentRun?.currentStageId ?? null;
  const isActive = currentRun !== null;

  // Compute isPausedAtBoundary reactively
  const isPausedAtBoundary = useMemo(() => {
    if (!currentRun) return false;
    const stage = currentRun.stages.find((s) => s.id === currentRun.currentStageId);
    return stage?.awaitUserAdvance === true && stage.status === 'active';
  }, [currentRun]);

  // Stable callback references
  const advanceToNext = useCallback(
    () => orchestrator.advanceToNext(),
    [orchestrator],
  );

  const advanceUserBoundary = useCallback(
    () => orchestrator.advanceUserBoundary(),
    [orchestrator],
  );

  return {
    advanceToNext,
    advanceUserBoundary,
    isPausedAtBoundary,
    currentStageId,
    isActive,
    startRun,
    resetRun,
  };
}
