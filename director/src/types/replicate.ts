export interface TrainingStatus {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  model: string;
  version: string;
  logs: string;
  output: { version: string; weights: string } | null;
  error: string | null;
  progress: number;
}

export interface Prediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  input: Record<string, unknown>;
  output: string | string[] | null;
  error: string | null;
  model: string;
  version: string;
}

export interface SceneImage {
  id: string;
  prompt: string;
  imageUrl: string | null;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  predictionId: string | null;
  error: string | null;
  videoMotionPrompt?: string;
  videoPrompt?: string;         // user-editable prompt for video generation
  videoApproved?: boolean;      // whether user approved this scene for video gen
  sceneIndex?: number;
  variantOf?: string;  // parent scene ID if this is a variant
  imageModelId?: string; // which image model generated this scene
  sourceAssetId?: string; // production asset ID if imported from assets
  assetCategory?: string; // category of source asset (character, location, etc.)
  directorSceneId?: string; // Director AI's scene ID for newly generated scenes
}

export interface VideoResult {
  id: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  videoUrl: string | null;
  predictionId: string | null;
  inputImageUrl: string;
  error: string | null;
  // Chaining & continuity
  lastFrameUrl?: string;       // Extracted last frame for next clip's start_image
  chainIndex?: number;         // Position in chain sequence (0 = first)
  batchId?: string;            // Which batch this belongs to
  sourceSceneId?: string;      // Which scene generated this video
  durationSeconds?: number;    // Actual video duration
}

export interface GenerationBatch {
  id: string;
  sceneRange: [number, number];
  status: 'pending' | 'generating' | 'completed' | 'failed';
  videoIds: string[];
  anchorFrameUrl?: string;     // Last frame from previous batch for continuity
  referenceImageUrls: string[];
}

export interface TrainingConfig {
  triggerWord: string;
  steps?: number;
  learningRate?: number;
  resolution?: number;
  inputZipUrl: string;
}

export interface ReplicateWebhookEvent {
  id: string;
  type: 'training' | 'prediction';
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output: unknown;
  error: string | null;
  created_at: string;
  completed_at: string | null;
}

export type ImageModel = 'schnell' | 'pro';

export interface GenerateImageOptions {
  prompt: string;
  loraUrl?: string;
  model?: ImageModel;
  aspectRatio?: string;
  seed?: number;
}
