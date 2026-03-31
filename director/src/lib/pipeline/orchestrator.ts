import { usePipelineStore } from '@/lib/stores/pipeline-store';
import { StageId, STAGE_ORDER } from '@/lib/types/pipeline';

/**
 * PipelineOrchestrator drives the pipeline forward, auto-advancing through
 * stages that don't require user intervention and pausing at stages marked
 * with awaitUserAdvance=true.
 *
 * Uses usePipelineStore.getState() (not the hook) because this is a plain
 * class, not a React component. This is the standard Zustand pattern for
 * accessing state outside React.
 */
export class PipelineOrchestrator {
  /**
   * Attempts to advance the pipeline past the current stage.
   *
   * Behavior:
   * - If the current stage has awaitUserAdvance=true and is active, refuses to advance
   * - Completes the current stage and moves forward
   * - Auto-skips through canSkip stages (optional stages like style-dna, character-setup)
   * - Stops at stages with awaitUserAdvance=true (paused for user confirmation)
   * - Stops at mandatory (canSkip=false) stages that require user work
   * - Returns the StageId where the pipeline stopped, or null if pipeline complete
   */
  advanceToNext(): StageId | null {
    const store = usePipelineStore.getState();
    const { currentRun } = store;
    if (!currentRun) return null;

    let currentStageId = currentRun.currentStageId;
    const currentStage = store.getStage(currentStageId);
    if (!currentStage) return null;

    // Don't advance from a user boundary (must use advanceUserBoundary)
    if (currentStage.awaitUserAdvance && currentStage.status === 'active') {
      return currentStageId;
    }

    // First advance: complete current stage
    const currentIdx = STAGE_ORDER.indexOf(currentStageId);

    // At last stage: complete it and return null (pipeline done)
    if (currentIdx === STAGE_ORDER.length - 1) {
      store.completeStage(currentStageId);
      return null;
    }

    const nextStageId = STAGE_ORDER[currentIdx + 1];

    // Pre-check: would the next stage be executable after completing current?
    if (!this.wouldBeExecutable(nextStageId, currentStageId)) {
      return currentStageId;
    }

    // Complete current stage (store auto-advances currentStageId to next)
    store.completeStage(currentStageId);

    // After completing, check the new current stage
    const freshState = usePipelineStore.getState();
    const newCurrentId = freshState.currentRun!.currentStageId;
    const newCurrentStage = freshState.getStage(newCurrentId);

    // If next stage has awaitUserAdvance, stop here (paused for user)
    if (newCurrentStage?.awaitUserAdvance) {
      return newCurrentId;
    }

    // If next stage is mandatory (canSkip=false), stop -- requires user work
    if (newCurrentStage && !newCurrentStage.canSkip) {
      return newCurrentId;
    }

    // Next stage is canSkip -- auto-advance through it
    return this.advanceToNext() ?? newCurrentId;
  }

  /**
   * Manually advances past a stage boundary that has awaitUserAdvance=true.
   * Called when the user explicitly confirms they're ready to proceed.
   * Returns the StageId where pipeline stopped next, or null if complete.
   */
  advanceUserBoundary(): StageId | null {
    const store = usePipelineStore.getState();
    const { currentRun } = store;
    if (!currentRun) return null;

    const currentStage = store.getStage(currentRun.currentStageId);
    if (!currentStage?.awaitUserAdvance) return null; // Not at a user boundary

    // Force-advance: complete the current boundary stage and continue
    const currentIdx = STAGE_ORDER.indexOf(currentRun.currentStageId);

    // At last stage: complete and return null
    if (currentIdx === STAGE_ORDER.length - 1) {
      store.completeStage(currentRun.currentStageId);
      return null;
    }

    // Complete current boundary stage (store auto-advances to next)
    store.completeStage(currentRun.currentStageId);

    // Check what we landed on
    const freshState = usePipelineStore.getState();
    const newCurrentId = freshState.currentRun!.currentStageId;
    const newCurrentStage = freshState.getStage(newCurrentId);

    // If next stage also has awaitUserAdvance, pause there
    if (newCurrentStage?.awaitUserAdvance) {
      return newCurrentId;
    }

    // If next stage doesn't need user advance, auto-advance from there
    return this.advanceToNext() ?? newCurrentId;
  }

  /**
   * Returns true if the pipeline is currently paused at a user-advance boundary.
   */
  isPausedAtBoundary(): boolean {
    const store = usePipelineStore.getState();
    const { currentRun } = store;
    if (!currentRun) return false;

    const stage = store.getStage(currentRun.currentStageId);
    return stage?.awaitUserAdvance === true && stage.status === 'active';
  }

  /**
   * Returns the current stage ID or null if no active run.
   */
  getCurrentStageId(): StageId | null {
    const store = usePipelineStore.getState();
    return store.currentRun?.currentStageId ?? null;
  }

  /**
   * Pre-check: would targetStageId be executable if we completed stageBeingCompleted?
   * Simulates the canExecuteStage check but assumes stageBeingCompleted will be 'completed'.
   */
  private wouldBeExecutable(targetStageId: StageId, stageBeingCompleted: StageId): boolean {
    const store = usePipelineStore.getState();
    const { currentRun } = store;
    if (!currentRun) return false;

    const targetIndex = STAGE_ORDER.indexOf(targetStageId);
    if (targetIndex === -1) return false;

    // Check all mandatory stages before targetStageId
    for (let i = 0; i < targetIndex; i++) {
      const priorStage = currentRun.stages[i];
      // Skip non-mandatory (canSkip) stages -- they don't block
      if (priorStage.canSkip) continue;
      // If this is the stage we're about to complete, it will become 'completed'
      if (priorStage.id === stageBeingCompleted) continue;
      // Otherwise, it must already be completed
      if (priorStage.status !== 'completed') {
        return false;
      }
    }

    return true;
  }
}
