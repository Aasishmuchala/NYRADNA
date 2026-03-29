// ─── Scene Structure Engine ────────────────────────────────────────
// Generates dynamic scene templates based on pacing, replacing
// the hardcoded 6-scene array with cinematic grammar.

export type ShotType =
  | 'establishing'
  | 'medium'
  | 'closeup'
  | 'ots'
  | 'pov'
  | 'insert'
  | 'reaction'
  | 'aerial'
  | 'dialogue'
  | 'climax'
  | 'closing';

export type NarrativeRole = 'intro' | 'development' | 'tension' | 'climax' | 'resolution';
export type TransitionType = 'cut' | 'dissolve' | 'fade-from-black' | 'fade-to-black';

export interface SceneTemplate {
  id: string;
  shotType: ShotType;
  narrativeRole: NarrativeRole;
  act: 1 | 2 | 3;
  promptSuffix: string;
  durationHint: number;
  transitionIn: TransitionType;
  transitionOut: TransitionType;
}

// ─── Scene Structures by Pacing ────────────────────────────────────

const QUICK_STRUCTURE: Omit<SceneTemplate, 'id'>[] = [
  {
    shotType: 'establishing',
    narrativeRole: 'intro',
    act: 1,
    promptSuffix: 'opening environment reveal',
    durationHint: 4,
    transitionIn: 'fade-from-black',
    transitionOut: 'cut',
  },
  {
    shotType: 'closeup',
    narrativeRole: 'intro',
    act: 1,
    promptSuffix: 'character introduction, face reveal',
    durationHint: 3,
    transitionIn: 'cut',
    transitionOut: 'cut',
  },
  {
    shotType: 'medium',
    narrativeRole: 'development',
    act: 2,
    promptSuffix: 'key action moment',
    durationHint: 4,
    transitionIn: 'dissolve',
    transitionOut: 'cut',
  },
  {
    shotType: 'climax',
    narrativeRole: 'climax',
    act: 3,
    promptSuffix: 'climactic peak moment',
    durationHint: 4,
    transitionIn: 'cut',
    transitionOut: 'dissolve',
  },
  {
    shotType: 'closing',
    narrativeRole: 'resolution',
    act: 3,
    promptSuffix: 'final resolution, pull-back',
    durationHint: 4,
    transitionIn: 'dissolve',
    transitionOut: 'fade-to-black',
  },
];

const BALANCED_STRUCTURE: Omit<SceneTemplate, 'id'>[] = [
  {
    shotType: 'establishing',
    narrativeRole: 'intro',
    act: 1,
    promptSuffix: 'opening environment reveal, world-building',
    durationHint: 5,
    transitionIn: 'fade-from-black',
    transitionOut: 'cut',
  },
  {
    shotType: 'closeup',
    narrativeRole: 'intro',
    act: 1,
    promptSuffix: 'character introduction, intimate face reveal',
    durationHint: 4,
    transitionIn: 'cut',
    transitionOut: 'cut',
  },
  {
    shotType: 'medium',
    narrativeRole: 'development',
    act: 2,
    promptSuffix: 'action sequence, movement and energy',
    durationHint: 5,
    transitionIn: 'dissolve',
    transitionOut: 'cut',
  },
  {
    shotType: 'dialogue',
    narrativeRole: 'development',
    act: 2,
    promptSuffix: 'intimate dialogue or emotional exchange',
    durationHint: 5,
    transitionIn: 'cut',
    transitionOut: 'cut',
  },
  {
    shotType: 'climax',
    narrativeRole: 'climax',
    act: 3,
    promptSuffix: 'climactic peak, high intensity',
    durationHint: 5,
    transitionIn: 'cut',
    transitionOut: 'dissolve',
  },
  {
    shotType: 'closing',
    narrativeRole: 'resolution',
    act: 3,
    promptSuffix: 'closing resolution, contemplative pull-back',
    durationHint: 5,
    transitionIn: 'dissolve',
    transitionOut: 'fade-to-black',
  },
];

const SLOW_STRUCTURE: Omit<SceneTemplate, 'id'>[] = [
  {
    shotType: 'establishing',
    narrativeRole: 'intro',
    act: 1,
    promptSuffix: 'slow opening panorama, world-building atmosphere',
    durationHint: 6,
    transitionIn: 'fade-from-black',
    transitionOut: 'dissolve',
  },
  {
    shotType: 'insert',
    narrativeRole: 'intro',
    act: 1,
    promptSuffix: 'environment detail, texture and mood',
    durationHint: 4,
    transitionIn: 'dissolve',
    transitionOut: 'cut',
  },
  {
    shotType: 'closeup',
    narrativeRole: 'intro',
    act: 1,
    promptSuffix: 'slow character reveal, intimate portrait',
    durationHint: 5,
    transitionIn: 'cut',
    transitionOut: 'cut',
  },
  {
    shotType: 'medium',
    narrativeRole: 'development',
    act: 2,
    promptSuffix: 'deliberate action, building tension',
    durationHint: 5,
    transitionIn: 'dissolve',
    transitionOut: 'cut',
  },
  {
    shotType: 'ots',
    narrativeRole: 'development',
    act: 2,
    promptSuffix: 'over-the-shoulder perspective, intimate conversation',
    durationHint: 5,
    transitionIn: 'cut',
    transitionOut: 'cut',
  },
  {
    shotType: 'reaction',
    narrativeRole: 'tension',
    act: 2,
    promptSuffix: 'emotional reaction, vulnerability',
    durationHint: 4,
    transitionIn: 'cut',
    transitionOut: 'cut',
  },
  {
    shotType: 'dialogue',
    narrativeRole: 'tension',
    act: 2,
    promptSuffix: 'pivotal dialogue exchange, mounting stakes',
    durationHint: 5,
    transitionIn: 'cut',
    transitionOut: 'dissolve',
  },
  {
    shotType: 'climax',
    narrativeRole: 'climax',
    act: 3,
    promptSuffix: 'climactic peak, catharsis',
    durationHint: 5,
    transitionIn: 'dissolve',
    transitionOut: 'cut',
  },
  {
    shotType: 'establishing',
    narrativeRole: 'resolution',
    act: 3,
    promptSuffix: 'wide aftermath, new equilibrium',
    durationHint: 5,
    transitionIn: 'cut',
    transitionOut: 'dissolve',
  },
  {
    shotType: 'closing',
    narrativeRole: 'resolution',
    act: 3,
    promptSuffix: 'final contemplative shot, fade out',
    durationHint: 6,
    transitionIn: 'dissolve',
    transitionOut: 'fade-to-black',
  },
];

// ─── Public API ────────────────────────────────────────────────────

export function generateSceneStructure(pacing: string): SceneTemplate[] {
  let base: Omit<SceneTemplate, 'id'>[];

  switch (pacing) {
    case 'quick':
      base = QUICK_STRUCTURE;
      break;
    case 'slow':
      base = SLOW_STRUCTURE;
      break;
    default:
      base = BALANCED_STRUCTURE;
  }

  return base.map((scene, i) => ({
    ...scene,
    id: `scene-${i + 1}`,
  }));
}

export function getTransitionDuration(type: TransitionType): number {
  switch (type) {
    case 'dissolve':
      return 0.5;
    case 'fade-from-black':
    case 'fade-to-black':
      return 1.0;
    case 'cut':
    default:
      return 0;
  }
}
