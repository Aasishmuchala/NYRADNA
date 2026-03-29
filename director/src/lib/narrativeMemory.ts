/**
 * Narrative Memory System
 *
 * Tracks scene-by-scene story context and injects it into prompts so
 * AI models maintain story coherence across batches. Each completed
 * scene produces a brief narrative summary that subsequent scenes
 * reference — "continuing from the previous scene where..."
 *
 * This bridges the gap between isolated per-batch generation and a
 * coherent story arc by giving the model explicit memory of what
 * happened before.
 */

// ─── Types ──────────────────────────────────────────────────────────

export interface SceneMemory {
  sceneId: string;
  sceneIndex: number;
  /** One-line summary of what happens in this scene */
  summary: string;
  /** Key visual elements to maintain (e.g. "red dress", "rainy street") */
  visualAnchors: string[];
  /** Character actions/emotions to carry forward */
  characterState: string;
  /** Setting/location for spatial continuity */
  setting: string;
  /** Narrative phase: setup / rising / climax / resolution */
  narrativePhase: 'setup' | 'rising' | 'climax' | 'resolution';
}

export interface NarrativeContext {
  /** Per-scene memory entries, ordered by sceneIndex */
  scenes: SceneMemory[];
  /** Global story premise extracted from visionText */
  storyPremise: string;
  /** Running character state that persists across scenes */
  characterArc: string;
}

// ─── Narrative Context Builder ──────────────────────────────────────

/**
 * Creates the initial narrative context from the user's vision text.
 * Called once at the start of generation.
 */
export function initNarrativeContext(visionText: string): NarrativeContext {
  return {
    scenes: [],
    storyPremise: extractStoryPremise(visionText),
    characterArc: '',
  };
}

/**
 * Extracts a compact story premise from the user's full vision text.
 * Keeps only the most relevant narrative information.
 */
function extractStoryPremise(visionText: string): string {
  if (!visionText) return '';

  // Take first 2 sentences or 200 chars as the core premise
  const sentences = visionText.match(/[^.!?]+[.!?]+/g) ?? [visionText];
  const premise = sentences.slice(0, 2).join(' ').trim();
  return premise.length > 200 ? premise.slice(0, 200) + '...' : premise;
}

// ─── Scene Memory Extraction ────────────────────────────────────────

/**
 * Builds a SceneMemory entry from a scene's prompt and metadata.
 * This is called after each scene's image is generated to record
 * what happened for future scenes to reference.
 */
export function buildSceneMemory(
  sceneId: string,
  sceneIndex: number,
  prompt: string,
  totalScenes: number,
  videoMotionPrompt?: string,
): SceneMemory {
  const progressPct = totalScenes > 1 ? sceneIndex / (totalScenes - 1) : 1;

  return {
    sceneId,
    sceneIndex,
    summary: extractSceneSummary(prompt),
    visualAnchors: extractVisualAnchors(prompt),
    characterState: extractCharacterState(prompt, videoMotionPrompt),
    setting: extractSetting(prompt),
    narrativePhase: progressPct < 0.25 ? 'setup'
      : progressPct < 0.6 ? 'rising'
      : progressPct < 0.85 ? 'climax'
      : 'resolution',
  };
}

/**
 * Extracts a concise summary from a scene prompt.
 * Strips cinematic jargon, keeps the narrative core.
 */
function extractSceneSummary(prompt: string): string {
  // Remove common cinematic/technical tokens that aren't narrative
  const cleaned = prompt
    .replace(/\b(shot on|35mm|film grain|bokeh|depth of field|shallow|anamorphic|aspect ratio|color grading|Kodak|Fuji)\b[^,]*/gi, '')
    .replace(/\b(wide shot|close-up|medium shot|establishing shot|aerial|dolly|handheld|steadicam|gimbal)\b[^,]*/gi, '')
    .replace(/,\s*,/g, ',')
    .replace(/^[,\s]+|[,\s]+$/g, '')
    .trim();

  // Take first meaningful clause (up to 80 chars)
  const firstClause = cleaned.split(/[,;]/)[0]?.trim() ?? cleaned;
  return firstClause.length > 80 ? firstClause.slice(0, 80) + '...' : firstClause;
}

/**
 * Extracts key visual elements that should persist across scenes.
 */
function extractVisualAnchors(prompt: string): string[] {
  const anchors: string[] = [];
  const lower = prompt.toLowerCase();

  // Color/clothing mentions
  const colorMatch = lower.match(/\b(red|blue|green|white|black|gold|silver|yellow|purple|orange)\s+\w+/g);
  if (colorMatch) anchors.push(...colorMatch.slice(0, 2));

  // Prop/object mentions
  const propPatterns = /\b(holding|carrying|wearing|with a|with an)\s+([^,]+)/gi;
  let match;
  while ((match = propPatterns.exec(prompt)) !== null) {
    anchors.push(match[0].trim().slice(0, 40));
  }

  // Weather/atmosphere
  const weatherMatch = lower.match(/\b(rain|snow|fog|mist|sun|storm|wind|cloudy|overcast|clear sky)\b/);
  if (weatherMatch) anchors.push(weatherMatch[0]);

  return anchors.slice(0, 4); // Keep top 4 visual anchors
}

/**
 * Extracts character state (action + emotion) from scene prompt.
 */
function extractCharacterState(prompt: string, motionPrompt?: string): string {
  const combined = `${prompt} ${motionPrompt ?? ''}`.toLowerCase();

  // Action detection
  const actionPatterns = /\b(walking|running|sitting|standing|looking|turning|reaching|dancing|talking|laughing|crying|fighting|embracing|driving|typing|reading|cooking|sleeping|waking)\b/g;
  const actions: string[] = [];
  let match;
  while ((match = actionPatterns.exec(combined)) !== null) {
    actions.push(match[1]);
  }

  // Emotion detection
  const emotionPatterns = /\b(happy|sad|angry|confident|nervous|excited|calm|determined|worried|surprised|thoughtful|passionate|serene|intense|melancholy|joyful)\b/g;
  const emotions: string[] = [];
  while ((match = emotionPatterns.exec(combined)) !== null) {
    emotions.push(match[1]);
  }

  const parts: string[] = [];
  if (actions.length > 0) parts.push(actions.slice(0, 2).join(' and '));
  if (emotions.length > 0) parts.push(`feeling ${emotions[0]}`);

  return parts.join(', ') || 'present in scene';
}

/**
 * Extracts setting/location from scene prompt.
 */
function extractSetting(prompt: string): string {
  const lower = prompt.toLowerCase();

  const settingPatterns: [RegExp, string][] = [
    [/\b(office|corporate|workspace)\b/, 'office'],
    [/\b(city|urban|downtown|street)\b/, 'city street'],
    [/\b(forest|woods|jungle)\b/, 'forest'],
    [/\b(beach|ocean|coast|shore)\b/, 'beach'],
    [/\b(desert|sand|dunes)\b/, 'desert'],
    [/\b(mountain|alpine|peak)\b/, 'mountain'],
    [/\b(home|house|apartment|living room|kitchen|bedroom)\b/, 'home interior'],
    [/\b(restaurant|cafe|bar)\b/, 'restaurant'],
    [/\b(hospital|clinic)\b/, 'hospital'],
    [/\b(school|classroom|university)\b/, 'school'],
    [/\b(warehouse|factory|industrial)\b/, 'industrial space'],
    [/\b(studio|stage|theater)\b/, 'studio'],
    [/\b(garden|park|courtyard)\b/, 'garden'],
    [/\b(rooftop|balcony|terrace)\b/, 'rooftop'],
    [/\b(car|vehicle|road|highway)\b/, 'vehicle/road'],
    [/\b(rain|rainy|wet street)\b/, 'rainy setting'],
    [/\b(night|nighttime|dark|moonlit)\b/, 'nighttime'],
    [/\b(morning|sunrise|dawn)\b/, 'morning'],
  ];

  for (const [pattern, label] of settingPatterns) {
    if (pattern.test(lower)) return label;
  }

  return 'unspecified setting';
}

// ─── Narrative Context Injection ────────────────────────────────────

/**
 * Adds a completed scene to the narrative context.
 */
export function addSceneToContext(
  ctx: NarrativeContext,
  memory: SceneMemory,
): NarrativeContext {
  const updatedScenes = [...ctx.scenes.filter(s => s.sceneId !== memory.sceneId), memory]
    .sort((a, b) => a.sceneIndex - b.sceneIndex);

  // Update character arc with latest state
  const characterArc = updatedScenes
    .slice(-3) // Last 3 scenes' character states
    .map(s => s.characterState)
    .filter(Boolean)
    .join(' → ');

  return {
    ...ctx,
    scenes: updatedScenes,
    characterArc,
  };
}

/**
 * Builds a narrative continuity string to inject into a scene's prompt.
 * This gives the AI model memory of what happened in previous scenes.
 *
 * Returns empty string if no previous context exists.
 */
export function buildNarrativeInjection(
  ctx: NarrativeContext,
  currentSceneIndex: number,
): string {
  if (ctx.scenes.length === 0) return '';

  const parts: string[] = [];

  // Previous scene summary (most important for continuity)
  const prevScenes = ctx.scenes
    .filter(s => s.sceneIndex < currentSceneIndex)
    .sort((a, b) => b.sceneIndex - a.sceneIndex); // Most recent first

  if (prevScenes.length > 0) {
    const lastScene = prevScenes[0];
    parts.push(`continuing from previous scene: ${lastScene.summary}`);

    // Visual anchors from last scene
    if (lastScene.visualAnchors.length > 0) {
      parts.push(`maintaining: ${lastScene.visualAnchors.join(', ')}`);
    }

    // Setting continuity
    if (lastScene.setting !== 'unspecified setting') {
      parts.push(`same ${lastScene.setting} environment`);
    }
  }

  // Character arc (carries emotional thread)
  if (ctx.characterArc) {
    parts.push(`character arc: ${ctx.characterArc}`);
  }

  // Narrative phase guidance
  const currentPhase = getNarrativePhaseGuidance(currentSceneIndex, ctx.scenes.length + 1);
  if (currentPhase) {
    parts.push(currentPhase);
  }

  return parts.join(', ');
}

/**
 * Builds a compact narrative context for batch boundaries.
 * Used when transitioning between multi-prompt batches to ensure
 * the new batch knows what the previous batch established.
 */
export function buildBatchTransitionContext(
  ctx: NarrativeContext,
  batchStartIndex: number,
): string {
  if (ctx.scenes.length === 0) return '';

  // Get the last 2-3 scenes before this batch
  const priorScenes = ctx.scenes
    .filter(s => s.sceneIndex < batchStartIndex)
    .sort((a, b) => b.sceneIndex - a.sceneIndex)
    .slice(0, 3);

  if (priorScenes.length === 0) return '';

  const parts: string[] = [];

  // Story so far (compact)
  parts.push('story so far:');

  // Last scene's summary
  parts.push(priorScenes[0].summary);

  // Collect unique visual anchors from recent scenes
  const allAnchors = priorScenes.flatMap(s => s.visualAnchors);
  const uniqueAnchors = [...new Set(allAnchors)].slice(0, 3);
  if (uniqueAnchors.length > 0) {
    parts.push(`key elements: ${uniqueAnchors.join(', ')}`);
  }

  // Setting from most recent scene
  const lastSetting = priorScenes[0].setting;
  if (lastSetting !== 'unspecified setting') {
    parts.push(`current location: ${lastSetting}`);
  }

  // Narrative phase
  const phase = priorScenes[0].narrativePhase;
  const phaseMap: Record<string, string> = {
    setup: 'establishing the world',
    rising: 'tension building',
    climax: 'peak dramatic moment',
    resolution: 'wrapping up the story',
  };
  parts.push(phaseMap[phase] ?? '');

  return parts.filter(Boolean).join(', ');
}

/**
 * Returns narrative phase guidance text for the given scene position.
 */
function getNarrativePhaseGuidance(sceneIndex: number, totalScenes: number): string {
  if (totalScenes <= 1) return '';

  const pct = sceneIndex / (totalScenes - 1);

  if (pct === 0) return 'opening moment, establishing the world and tone';
  if (pct < 0.2) return 'early story, still setting up the visual world';
  if (pct < 0.4) return 'developing the narrative, building engagement';
  if (pct < 0.6) return 'mid-story, raising the stakes';
  if (pct < 0.8) return 'approaching the climax, peak visual intensity';
  if (pct < 0.95) return 'climactic moment, most dramatic scene';
  return 'final scene, resolving the story, contemplative closure';
}
