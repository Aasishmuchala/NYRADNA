export type StageId = 'intent' | 'brief' | 'style-dna' | 'character-setup' | 'review' | 'generating' | 'export';

export type StageStatus = 'idle' | 'completed' | 'blocked' | 'active';

export interface PipelineStage {
  id: StageId;
  label: string;
  href: string;
  icon: string;
  status: StageStatus;
  canSkip: boolean;
  /** If true, auto-advance pauses here waiting for user navigation */
  awaitUserAdvance: boolean;
}

export interface PipelineRun {
  id: string;
  stages: PipelineStage[];
  currentStageId: StageId;
  createdAt: string;
}

export const STAGE_ORDER: StageId[] = [
  'intent', 'brief', 'style-dna', 'character-setup', 'review', 'generating', 'export'
];

export const DEFAULT_STAGES: PipelineStage[] = [
  { id: 'intent', label: 'Intent', href: '/create/intent', icon: 'edit_note', status: 'idle', canSkip: false, awaitUserAdvance: false },
  { id: 'brief', label: 'Brief', href: '/create/brief', icon: 'psychology', status: 'idle', canSkip: false, awaitUserAdvance: false },
  { id: 'style-dna', label: 'Style DNA', href: '/create/style-dna', icon: 'palette', status: 'idle', canSkip: true, awaitUserAdvance: false },
  { id: 'character-setup', label: 'Characters', href: '/create/character-setup', icon: 'face', status: 'idle', canSkip: true, awaitUserAdvance: false },
  { id: 'review', label: 'Review', href: '/create/review', icon: 'movie', status: 'idle', canSkip: false, awaitUserAdvance: true },
  { id: 'generating', label: 'Generate', href: '/create/generating', icon: 'auto_awesome', status: 'idle', canSkip: false, awaitUserAdvance: true },
  { id: 'export', label: 'Export', href: '/create/export', icon: 'download', status: 'idle', canSkip: false, awaitUserAdvance: false },
];
