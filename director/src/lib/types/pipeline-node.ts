export type NodeStatus = 'pending' | 'ready' | 'generating' | 'completed' | 'error';

export interface PipelineNode {
  id: string;
  projectId: string;
  assetSetId: string;
  assetItemId: string;        // FK to asset_set_items.id
  position: number;           // 0-indexed order in pipeline
  title: string;              // from SequenceSegment.title or asset item name
  description: string;        // from SequenceSegment.visualDescription or empty
  status: NodeStatus;
  narrativeContext: {          // mapped from Director's Brief
    emotionalTone: string;
    transitionFromPrevious: string | null;
    durationHint: string;
  };
  thumbnailUrl: string | null; // from source AssetSetItem
  videoUrl: string | null;     // generated video URL
  metadata: Record<string, unknown>; // flexible JSONB for future use
  createdAt: string;
  updatedAt: string;
}

export interface NewPipelineNode {
  projectId: string;
  assetSetId: string;
  assetItemId: string;
  position: number;
  title: string;
  description: string;
  narrativeContext: PipelineNode['narrativeContext'];
  thumbnailUrl: string | null;
}

export interface GenerationConfig {
  batchSize: number;      // 1-3, default 1
  sequential: boolean;    // true = one at a time, false = use batchSize
}

export interface VideoGenerationResult {
  nodeId: string;
  videoUrl: string;
  assetItemId: string;    // newly created asset
  status: 'completed' | 'error';
  error?: string;
}
