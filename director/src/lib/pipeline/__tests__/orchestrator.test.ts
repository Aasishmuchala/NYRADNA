import { describe, it, expect, beforeEach } from 'vitest';
import { PipelineOrchestrator } from '../orchestrator';
import { usePipelineStore } from '../../stores/pipeline-store';
import { STAGE_ORDER } from '../../types/pipeline';

const getState = () => usePipelineStore.getState();
const setState = usePipelineStore.setState;

describe('PipelineOrchestrator', () => {
  let orchestrator: PipelineOrchestrator;

  beforeEach(() => {
    // Reset store to clean state
    setState({ currentRun: null });
    // Start a fresh run so intent is active
    getState().startRun();
    orchestrator = new PipelineOrchestrator();
  });

  describe('advanceToNext', () => {
    it('auto-completes intent (awaitUserAdvance=false) and moves to brief', () => {
      // intent has awaitUserAdvance=false, so advanceToNext should complete it
      // and move to brief
      const result = orchestrator.advanceToNext();

      expect(result).toBe('brief');
      expect(getState().currentRun!.currentStageId).toBe('brief');

      // intent should be completed
      const intentStage = getState().getStage('intent');
      expect(intentStage!.status).toBe('completed');

      // brief should be active
      const briefStage = getState().getStage('brief');
      expect(briefStage!.status).toBe('active');
    });

    it('stops at review because review has awaitUserAdvance=true', () => {
      // Advance through intent -> brief -> directors-cut
      getState().completeStage('intent');
      getState().completeStage('brief');
      getState().completeStage('directors-cut');
      // Now at style-dna (active)
      // style-dna: awaitUserAdvance=false, canSkip=true
      // character-setup: awaitUserAdvance=false, canSkip=true
      // review: awaitUserAdvance=true

      // Advance from style-dna
      const result = orchestrator.advanceToNext();

      // Should stop at review because review.awaitUserAdvance=true
      // The orchestrator completes style-dna, sees character-setup (no awaitUserAdvance),
      // auto-advances through it, then stops at review
      expect(result).toBe('review');
      expect(getState().currentRun!.currentStageId).toBe('review');

      // review should be active (not completed)
      const reviewStage = getState().getStage('review');
      expect(reviewStage!.status).toBe('active');
    });

    it('does NOT advance when current stage has awaitUserAdvance=true', () => {
      // Navigate to review stage
      getState().completeStage('intent');
      getState().completeStage('brief');
      getState().completeStage('directors-cut');
      getState().completeStage('style-dna');
      getState().completeStage('character-setup');
      // Now at review (active, awaitUserAdvance=true)

      expect(getState().currentRun!.currentStageId).toBe('review');

      // advanceToNext should NOT advance because we're at a user boundary
      const result = orchestrator.advanceToNext();
      expect(result).toBe('review');

      // Still at review
      expect(getState().currentRun!.currentStageId).toBe('review');
      // review should still be active (not completed)
      const reviewStage = getState().getStage('review');
      expect(reviewStage!.status).toBe('active');
    });

    it('respects canExecuteStage -- does not advance if next stage is blocked', () => {
      // intent is active. If we complete intent, brief becomes active.
      // But what if we manipulate state so next stage can't execute?
      // canExecuteStage checks that prior mandatory stages are completed.
      // Let's start at intent and NOT complete it, but try to advance to brief.
      // Actually, advanceToNext completes the current stage first, so this would
      // actually work. Let's test a different scenario:
      //
      // We need to test the case where after completing current stage,
      // the next stage is still blocked. This can happen if there's a mandatory
      // stage between current and next that hasn't been completed.
      //
      // Actually the simplest: we manually set currentStageId to a stage where
      // the next one can't be executed (prior mandatory incomplete).
      // Let's manually jump to style-dna without completing intent.

      // Reset and create a custom state where intent is NOT completed
      // but we're at style-dna somehow
      const { currentRun } = getState();
      setState({
        currentRun: {
          ...currentRun!,
          currentStageId: 'style-dna',
          stages: currentRun!.stages.map((s) => {
            if (s.id === 'style-dna') return { ...s, status: 'active' as const };
            return s; // intent is still 'active' (not completed)
          }),
        },
      });

      // Now advanceToNext from style-dna: completes style-dna,
      // next is character-setup. But intent is not completed (mandatory),
      // so canExecuteStage('character-setup') should check that all prior mandatory
      // stages are completed. intent is mandatory and NOT completed.
      // Actually, canExecuteStage checks prior stages' status relative to the target.
      // For character-setup (index 4), it checks stages 0-3: intent (mandatory, not completed) -> blocked

      const result = orchestrator.advanceToNext();

      // Should not advance because character-setup can't be executed
      // (intent is incomplete and mandatory)
      expect(result).toBe('style-dna');
    });

    it('returns null and completes the run at export (last stage)', () => {
      // Complete all stages through to export
      for (const stageId of STAGE_ORDER.slice(0, -1)) {
        getState().completeStage(stageId);
      }
      // Now at export (active)
      expect(getState().currentRun!.currentStageId).toBe('export');

      const result = orchestrator.advanceToNext();
      // Pipeline is complete, returns null
      expect(result).toBeNull();

      // export should be completed
      const exportStage = getState().getStage('export');
      expect(exportStage!.status).toBe('completed');
    });

    it('does nothing and returns null when no active run', () => {
      setState({ currentRun: null });

      const result = orchestrator.advanceToNext();
      expect(result).toBeNull();
    });
  });

  describe('advanceUserBoundary', () => {
    it('advances past review (awaitUserAdvance=true) to generating', () => {
      // Get to review stage
      getState().completeStage('intent');
      getState().completeStage('brief');
      getState().completeStage('directors-cut');
      getState().completeStage('style-dna');
      getState().completeStage('character-setup');
      // Now at review (active, awaitUserAdvance=true)
      expect(getState().currentRun!.currentStageId).toBe('review');

      const result = orchestrator.advanceUserBoundary();

      // Should complete review and advance to generating
      // generating also has awaitUserAdvance=true, so it pauses there
      expect(result).toBe('generating');
      expect(getState().currentRun!.currentStageId).toBe('generating');

      // review should be completed
      const reviewStage = getState().getStage('review');
      expect(reviewStage!.status).toBe('completed');
    });

    it('returns null when not at a user boundary', () => {
      // At intent (awaitUserAdvance=false)
      expect(getState().currentRun!.currentStageId).toBe('intent');

      const result = orchestrator.advanceUserBoundary();
      expect(result).toBeNull();

      // Should not have moved
      expect(getState().currentRun!.currentStageId).toBe('intent');
    });

    it('returns null when no active run', () => {
      setState({ currentRun: null });

      const result = orchestrator.advanceUserBoundary();
      expect(result).toBeNull();
    });
  });

  describe('isPausedAtBoundary', () => {
    it('returns true when at review (awaitUserAdvance=true, status=active)', () => {
      getState().completeStage('intent');
      getState().completeStage('brief');
      getState().completeStage('directors-cut');
      getState().completeStage('style-dna');
      getState().completeStage('character-setup');

      expect(getState().currentRun!.currentStageId).toBe('review');
      expect(orchestrator.isPausedAtBoundary()).toBe(true);
    });

    it('returns false when at intent (awaitUserAdvance=false)', () => {
      expect(getState().currentRun!.currentStageId).toBe('intent');
      expect(orchestrator.isPausedAtBoundary()).toBe(false);
    });

    it('returns false when no active run', () => {
      setState({ currentRun: null });
      expect(orchestrator.isPausedAtBoundary()).toBe(false);
    });

    it('returns true when at generating (awaitUserAdvance=true, status=active)', () => {
      // Complete through to generating
      getState().completeStage('intent');
      getState().completeStage('brief');
      getState().completeStage('directors-cut');
      getState().completeStage('style-dna');
      getState().completeStage('character-setup');
      getState().completeStage('review');

      expect(getState().currentRun!.currentStageId).toBe('generating');
      expect(orchestrator.isPausedAtBoundary()).toBe(true);
    });
  });

  describe('getCurrentStageId', () => {
    it('returns current stage ID when run is active', () => {
      expect(orchestrator.getCurrentStageId()).toBe('intent');
    });

    it('returns null when no run is active', () => {
      setState({ currentRun: null });
      expect(orchestrator.getCurrentStageId()).toBeNull();
    });
  });

  describe('GATE-06 scenario: full pipeline walkthrough', () => {
    it('auto-advances through non-boundary stages and pauses at boundaries', () => {
      // Start at intent
      expect(orchestrator.getCurrentStageId()).toBe('intent');
      expect(orchestrator.isPausedAtBoundary()).toBe(false);

      // Advance from intent -> brief (mandatory, canSkip=false, no boundary)
      let result = orchestrator.advanceToNext();
      expect(result).toBe('brief');

      // Advance from brief -> stops at directors-cut (mandatory, canSkip=false, requires user work)
      result = orchestrator.advanceToNext();
      expect(result).toBe('directors-cut');

      // Complete directors-cut manually (user does their work), then advance
      // directors-cut is mandatory but awaitUserAdvance=false, so advanceToNext will:
      // complete it, then auto-skip style-dna + character-setup, stop at review boundary
      result = orchestrator.advanceToNext();
      expect(result).toBe('review');
      expect(orchestrator.isPausedAtBoundary()).toBe(true);

      // advanceToNext should NOT work at boundary
      result = orchestrator.advanceToNext();
      expect(result).toBe('review');

      // User explicitly advances past review boundary
      result = orchestrator.advanceUserBoundary();
      expect(result).toBe('generating');
      expect(orchestrator.isPausedAtBoundary()).toBe(true);

      // User explicitly advances past generating boundary
      result = orchestrator.advanceUserBoundary();
      expect(result).toBe('export');
      expect(orchestrator.isPausedAtBoundary()).toBe(false);

      // Advance from export -> pipeline complete
      result = orchestrator.advanceToNext();
      expect(result).toBeNull();
    });
  });
});
