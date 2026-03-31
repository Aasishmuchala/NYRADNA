export type GapType = 'visual' | 'narrative';
export type GapSeverity = 'critical' | 'moderate' | 'minor';
export type GapStatus = 'detected' | 'accepted' | 'dismissed' | 'fill-requested' | 'generating' | 'filled';

export interface PipelineGap {
  id: string;
  projectId: string;
  assetSetId: string;
  sourceNodeId: string;      // FK to pipeline_nodes.id (left node in the pair)
  targetNodeId: string;      // FK to pipeline_nodes.id (right node in the pair)
  gapType: GapType;
  severity: GapSeverity;
  status: GapStatus;
  title: string;             // e.g., "Visual discontinuity between Node 2 and Node 3"
  description: string;       // detailed explanation of what was detected
  suggestion: string;        // recommended fix (e.g., "Add a dissolve transition scene")
  metadata: Record<string, unknown>; // flexible JSONB for analysis details
  fillNodeId?: string;               // UUID of bridge node created by gap-fill (null until filled)
  createdAt: string;
  updatedAt: string;
}

export interface NewPipelineGap {
  projectId: string;
  assetSetId: string;
  sourceNodeId: string;
  targetNodeId: string;
  gapType: GapType;
  severity: GapSeverity;
  title: string;
  description: string;
  suggestion: string;
  metadata?: Record<string, unknown>;
}
