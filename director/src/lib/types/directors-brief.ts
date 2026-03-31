export interface Storyline {
  title: string;
  synopsis: string;
  theme: string;
}

export interface VisualStyle {
  mood: string;
  colorPalette: string[];
  cinematographyRefs: string[];
}

export interface NarrativeBeat {
  segmentIndex: number;
  label: string;
  emotion: string;
  transition: string;
}

export interface NarrativeBeats {
  beats: NarrativeBeat[];
}

export interface DirectorsBrief {
  id: string;
  projectId: string;
  storyline: Storyline;
  visualStyle: VisualStyle;
  narrativeBeats: NarrativeBeats;
  createdAt: string;
  updatedAt: string;
}

/** Minimal check: title and synopsis must be non-empty */
export function isBriefComplete(brief: DirectorsBrief | null): boolean {
  if (!brief) return false;
  return brief.storyline.title.trim().length > 0
    && brief.storyline.synopsis.trim().length > 0;
}
