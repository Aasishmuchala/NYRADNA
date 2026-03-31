import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  StageId,
  StageStatus,
  PipelineRun,
  PipelineStage,
  STAGE_ORDER,
  DEFAULT_STAGES,
} from '../types/pipeline';

interface PipelineState {
  currentRun: PipelineRun | null;

  // Actions
  startRun: () => void;
  resetRun: () => void;
  completeStage: (stageId: StageId) => void;
  jumpToStage: (stageId: StageId) => boolean;

  // Queries
  canExecuteStage: (stageId: StageId) => boolean;
  getStage: (stageId: StageId) => PipelineStage | undefined;
  getStageStatus: (stageId: StageId) => StageStatus;
}

export const usePipelineStore = create<PipelineState>()(
  persist(
    (set, get) => ({
      currentRun: null,

      startRun: () => {
        const stages: PipelineStage[] = DEFAULT_STAGES.map((stage, index) => ({
          ...stage,
          status: index === 0 ? 'active' as StageStatus : 'idle' as StageStatus,
        }));

        const run: PipelineRun = {
          id: crypto.randomUUID(),
          stages,
          currentStageId: 'intent',
          createdAt: new Date().toISOString(),
        };

        set({ currentRun: run });
      },

      resetRun: () => {
        set({ currentRun: null });
      },

      canExecuteStage: (stageId: StageId): boolean => {
        const { currentRun } = get();

        // Freestyle mode: no active run means all stages are accessible (GATE-05)
        if (currentRun === null) {
          return true;
        }

        const targetIndex = STAGE_ORDER.indexOf(stageId);
        if (targetIndex === -1) return false;

        // Check all stages before the target
        for (let i = 0; i < targetIndex; i++) {
          const priorStage = currentRun.stages[i];
          // Only mandatory stages (canSkip === false) block progression
          if (!priorStage.canSkip && priorStage.status !== 'completed') {
            return false;
          }
        }

        return true;
      },

      jumpToStage: (stageId: StageId): boolean => {
        const { canExecuteStage, currentRun } = get();

        if (!currentRun) return false;

        // GATE-02: refuse to skip mandatory incomplete stages
        if (!canExecuteStage(stageId)) {
          return false;
        }

        const targetIndex = STAGE_ORDER.indexOf(stageId);
        if (targetIndex === -1) return false;

        const updatedStages = currentRun.stages.map((stage, index) => {
          if (index === targetIndex) {
            // Target stage becomes active
            return { ...stage, status: 'active' as StageStatus };
          }
          if (index < targetIndex && stage.canSkip && stage.status !== 'completed') {
            // Auto-mark skipped skippable stages as completed
            return { ...stage, status: 'completed' as StageStatus };
          }
          return stage;
        });

        set({
          currentRun: {
            ...currentRun,
            stages: updatedStages,
            currentStageId: stageId,
          },
        });

        return true;
      },

      completeStage: (stageId: StageId) => {
        const { currentRun } = get();
        if (!currentRun) return;

        const stageIndex = STAGE_ORDER.indexOf(stageId);
        if (stageIndex === -1) return;

        const nextIndex = stageIndex + 1;
        const hasNextStage = nextIndex < STAGE_ORDER.length;

        const updatedStages = currentRun.stages.map((stage, index) => {
          if (index === stageIndex) {
            return { ...stage, status: 'completed' as StageStatus };
          }
          if (hasNextStage && index === nextIndex) {
            return { ...stage, status: 'active' as StageStatus };
          }
          return stage;
        });

        set({
          currentRun: {
            ...currentRun,
            stages: updatedStages,
            currentStageId: hasNextStage
              ? STAGE_ORDER[nextIndex]
              : stageId,
          },
        });
      },

      getStage: (stageId: StageId): PipelineStage | undefined => {
        const { currentRun } = get();
        if (!currentRun) return undefined;
        return currentRun.stages.find((s) => s.id === stageId);
      },

      getStageStatus: (stageId: StageId): StageStatus => {
        const { currentRun } = get();
        if (!currentRun) return 'idle';
        const stage = currentRun.stages.find((s) => s.id === stageId);
        return stage?.status ?? 'idle';
      },
    }),
    {
      name: 'pipeline-store',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
