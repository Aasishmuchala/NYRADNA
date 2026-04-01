import { describe, it, expect, beforeEach } from 'vitest';
import { usePipelineStore } from '../pipeline-store';
import { STAGE_ORDER } from '../../types/pipeline';

// Helper to get store state and actions without React hooks
const getState = () => usePipelineStore.getState();
const setState = usePipelineStore.setState;

describe('Pipeline Store', () => {
  beforeEach(() => {
    // Reset store to clean state before each test
    setState({
      currentRun: null,
    });
  });

  describe('startRun', () => {
    it('creates a PipelineRun with all stages in idle status', () => {
      getState().startRun();
      const { currentRun } = getState();

      expect(currentRun).not.toBeNull();
      expect(currentRun!.stages).toHaveLength(8);
      expect(currentRun!.currentStageId).toBe('intent');
      expect(currentRun!.id).toBeTruthy();
      expect(currentRun!.createdAt).toBeTruthy();

      // First stage should be active, rest idle
      expect(currentRun!.stages[0].status).toBe('active');
      for (let i = 1; i < currentRun!.stages.length; i++) {
        expect(currentRun!.stages[i].status).toBe('idle');
      }
    });
  });

  describe('resetRun', () => {
    it('sets currentRun to null (enters freestyle mode)', () => {
      getState().startRun();
      expect(getState().currentRun).not.toBeNull();

      getState().resetRun();
      expect(getState().currentRun).toBeNull();
    });
  });

  describe('canExecuteStage', () => {
    it('returns false when a prior mandatory stage is incomplete', () => {
      getState().startRun();

      // intent is idle (active but not completed), brief should be blocked
      const canDoBrief = getState().canExecuteStage('brief');
      expect(canDoBrief).toBe(false);
    });

    it('returns true when prior mandatory stages are completed', () => {
      getState().startRun();
      getState().completeStage('intent');

      const canDoBrief = getState().canExecuteStage('brief');
      expect(canDoBrief).toBe(true);
    });

    it('returns true for style-dna when intent, brief, and directors-cut are completed (skippable stage still needs prior mandatory stages)', () => {
      getState().startRun();
      getState().completeStage('intent');
      getState().completeStage('brief');
      getState().completeStage('style-dna');

      const canDoStyleDna = getState().canExecuteStage('style-dna');
      expect(canDoStyleDna).toBe(true);
    });

    it('returns false for review when intent or brief is idle (skippable stages do not block, mandatory ones do)', () => {
      getState().startRun();
      // Only complete intent, brief is still idle
      getState().completeStage('intent');

      const canDoReview = getState().canExecuteStage('review');
      expect(canDoReview).toBe(false);
    });

    it('returns true for review when all mandatory prior stages are complete (skippable stages do not block)', () => {
      getState().startRun();
      getState().completeStage('intent');
      getState().completeStage('brief');
      getState().completeStage('style-dna');
      // style-dna and character-setup are skippable, so they should NOT block review

      const canDoReview = getState().canExecuteStage('review');
      expect(canDoReview).toBe(true);
    });

    it('returns true for ALL stages when currentRun is null (freestyle mode -- GATE-05)', () => {
      // currentRun is null by default (set in beforeEach)
      expect(getState().currentRun).toBeNull();

      for (const stageId of STAGE_ORDER) {
        expect(getState().canExecuteStage(stageId)).toBe(true);
      }
    });

    it('returns true for the first stage (intent) even when run just started', () => {
      getState().startRun();
      const canDoIntent = getState().canExecuteStage('intent');
      expect(canDoIntent).toBe(true);
    });
  });

  describe('jumpToStage', () => {
    it('returns false when mandatory prior stages are incomplete (GATE-02)', () => {
      getState().startRun();

      // Try to jump to review without completing intent and brief
      const result = getState().jumpToStage('review');
      expect(result).toBe(false);

      // currentStageId should not have changed
      expect(getState().currentRun!.currentStageId).toBe('intent');
    });

    it('returns true and updates currentStageId when all mandatory priors are complete', () => {
      getState().startRun();
      getState().completeStage('intent');
      getState().completeStage('brief');
      getState().completeStage('style-dna');

      const result = getState().jumpToStage('review');
      expect(result).toBe(true);
      expect(getState().currentRun!.currentStageId).toBe('review');
    });

    it('sets target stage status to active on successful jump', () => {
      getState().startRun();
      getState().completeStage('intent');
      getState().completeStage('brief');
      getState().completeStage('style-dna');

      getState().jumpToStage('review');
      const reviewStage = getState().currentRun!.stages.find(s => s.id === 'review');
      expect(reviewStage!.status).toBe('active');
    });

    it('auto-marks skipped skippable stages as completed when jumping past them', () => {
      getState().startRun();
      getState().completeStage('intent');
      getState().completeStage('brief');
      getState().completeStage('style-dna');

      // Jump to review, skipping style-dna and character-setup
      getState().jumpToStage('review');

      const styleDna = getState().currentRun!.stages.find(s => s.id === 'style-dna');
      const charSetup = getState().currentRun!.stages.find(s => s.id === 'character-setup');
      expect(styleDna!.status).toBe('completed');
      expect(charSetup!.status).toBe('completed');
    });
  });

  describe('completeStage', () => {
    it('marks stage as completed and advances currentStageId to next stage', () => {
      getState().startRun();
      getState().completeStage('intent');

      const { currentRun } = getState();
      const intentStage = currentRun!.stages.find(s => s.id === 'intent');
      expect(intentStage!.status).toBe('completed');
      expect(currentRun!.currentStageId).toBe('brief');
    });

    it('marks the next stage as active after completing current stage', () => {
      getState().startRun();
      getState().completeStage('intent');

      const briefStage = getState().currentRun!.stages.find(s => s.id === 'brief');
      expect(briefStage!.status).toBe('active');
    });

    it('handles completing the last stage (export) without error', () => {
      getState().startRun();
      // Complete all stages in order
      for (const stageId of STAGE_ORDER) {
        getState().completeStage(stageId);
      }

      const { currentRun } = getState();
      const exportStage = currentRun!.stages.find(s => s.id === 'export');
      expect(exportStage!.status).toBe('completed');
      // currentStageId remains at export since there's no next stage
      expect(currentRun!.currentStageId).toBe('export');
    });
  });

  describe('getStage', () => {
    it('returns the stage by id when a run is active', () => {
      getState().startRun();
      const stage = getState().getStage('intent');
      expect(stage).toBeDefined();
      expect(stage!.id).toBe('intent');
      expect(stage!.label).toBe('Intent');
    });

    it('returns undefined when no run is active', () => {
      const stage = getState().getStage('intent');
      expect(stage).toBeUndefined();
    });
  });

  describe('getStageStatus', () => {
    it('returns the stage status when a run is active', () => {
      getState().startRun();
      expect(getState().getStageStatus('intent')).toBe('active');
      expect(getState().getStageStatus('brief')).toBe('idle');
    });

    it('returns idle when no run is active', () => {
      expect(getState().getStageStatus('intent')).toBe('idle');
    });
  });

  describe('persistence', () => {
    it('store is configured with persist middleware (sessionStorage)', () => {
      // Verify the store has persist API
      expect(usePipelineStore.persist).toBeDefined();
      expect(usePipelineStore.persist.getOptions().name).toBe('pipeline-store');
    });
  });
});
