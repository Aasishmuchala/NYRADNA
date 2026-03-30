export interface SequenceSegment {
  index: number;
  title: string;
  visualDescription: string;
  emotionalTone: string;
  transitionFromPrevious: string | null;
  durationHint: string; // e.g., "3-5 seconds", "medium"
}

export interface SequencePlan {
  id: string;
  briefId: string;
  segments: SequenceSegment[];
  overallArc: string;
  estimatedTotalDuration: string;
  createdAt: string;
}
