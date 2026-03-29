import type { WizardState } from '@/context/WizardContext';

// ─── Color Palette → Prompt Tokens ─────────────────────────────────

const COLOR_GRADING: Record<number, string> = {
  0: 'warm amber and burnt orange color grading, golden hour tones',
  1: 'cool cyan and electric blue color grading, moonlit tones',
  2: 'deep violet and ultraviolet color grading, neon accents',
  3: 'hot magenta and fuchsia color grading, sunset haze',
  4: 'emerald and jade color grading, bioluminescent tones',
};

// ─── Lighting → Cinematic Descriptors ──────────────────────────────

const LIGHTING_MAP: Record<string, string> = {
  warm: 'soft diffused key light, warm practicals, golden bounce fill, Kodak Vision3 250D look',
  cool: 'blue steel key, cool fluorescent fill, tungsten edge, Fuji Eterna 400T look',
  'high-contrast': 'hard chiaroscuro lighting, deep shadows, single-source key, Storaro-inspired',
  mood: 'available light, neon spill, motivated sources, atmospheric haze, Roger Deakins style',
};

// ─── Camera Motion → Composition Language ──────────────────────────

const CAMERA_IMAGE_MAP: Record<string, string> = {
  'Handheld Cinematic': 'handheld camera, slight motion blur, 35mm lens, documentary intimacy',
  'Dolly Smooth': 'smooth dolly track, Steadicam precision, 50mm lens, shallow depth of field',
  'Drone Sweep': 'aerial perspective, sweeping crane shot, wide 24mm lens, vast depth of field',
  'Static Frame': 'locked-off tripod, symmetrical composition, 40mm lens',
  'Gimbal Drift': 'fluid gimbal movement, parallax tracking, 28mm lens',
  'Whip Pan': 'dynamic whip pan energy, 24mm wide lens, motion streak',
};

const CAMERA_VIDEO_MAP: Record<string, string> = {
  'Handheld Cinematic': 'subtle handheld camera shake, natural breathing motion, character moves forward',
  'Dolly Smooth': 'smooth dolly push-in toward subject, steady lateral movement',
  'Drone Sweep': 'aerial camera swooping right to left, slowly descending',
  'Static Frame': 'locked camera, only subject moves, still background',
  'Gimbal Drift': 'slow drifting camera orbit, parallax effect',
  'Whip Pan': 'fast whip pan from left to right, motion blur on transition',
};

// ─── Persona → Tone Tokens ─────────────────────────────────────────

const PERSONA_TONE: Record<number, string> = {
  1: 'clean corporate aesthetic, minimalist framing, editorial photography',
  2: 'bold saturated colors, Dutch angle, TikTok-native framing, high energy',
  3: 'rich shallow depth of field, luxury editorial, Vogue-grade composition',
  4: 'warm authentic feel, natural skin tones, relatable candid framing',
  5: 'experimental mixed media, abstract composition, avant-garde visual storytelling',
  6: 'high-energy dynamic framing, slow-motion power shots, aspirational glow',
  7: 'futuristic sleek aesthetic, holographic accents, sci-fi inspired composition',
  8: 'intimate documentary framing, natural light, raw emotional close-ups',
};

// ─── Persona → Atmosphere (for video audio) ────────────────────────

const PERSONA_ATMOSPHERE: Record<number, string> = {
  1: 'quiet office ambience, subtle electronic hum',
  2: 'upbeat electronic music, city sounds, energetic crowd',
  3: 'soft orchestral strings, gentle room tone',
  4: 'warm coffee shop ambience, conversational background',
  5: 'experimental ambient textures, glitch sounds, ethereal drones',
  6: 'powerful bass-driven beats, gym energy, motivational crescendo',
  7: 'futuristic synth pads, digital interface sounds, clean electronic pulse',
  8: 'soft piano underscore, natural room tone, intimate silence',
};

// ─── Shot Type → Cinematic Framing ─────────────────────────────────

const SHOT_FRAMING: Record<string, string> = {
  establishing: 'wide establishing shot, full environment visible, subject small in frame',
  closeup: 'tight close-up, face fills the frame, eyes in sharp focus, bokeh background',
  medium: 'medium shot from waist up, balanced composition, subject centered',
  ots: 'over-the-shoulder shot, foreground silhouette framing, intimate perspective',
  pov: 'first-person point of view, eye-level perspective, immersive framing',
  insert: 'extreme close-up detail shot, macro focus, texture visible',
  reaction: 'medium close-up reaction shot, expression clearly visible, soft background',
  aerial: 'bird\'s eye aerial view, looking straight down, geometric composition',
  dialogue: 'medium close-up two-shot, intimate dialogue framing, steady cam',
  climax: 'dynamic low-angle hero shot, dramatic framing, powerful presence',
  closing: 'wide pull-back shot, subject receding, contemplative composition',
};

// ─── Film Stock Suffix ─────────────────────────────────────────────

const FILM_STOCK: Record<string, string> = {
  warm: 'shot on Kodak Vision3 250D 35mm film',
  cool: 'shot on Fuji Eterna 400T 35mm film',
  'high-contrast': 'shot on Kodak Double-X 35mm film, pushed one stop',
  mood: 'shot on Kodak Vision3 500T 35mm film',
};

const FILM_SUFFIX = 'subtle film grain, cinematic color science, professional color grading, 24fps cinematic motion';

// ─── Negative Prompt ───────────────────────────────────────────────

const NEGATIVE_PROMPT =
  'cartoon, anime, illustration, drawing, painting, sketch, 3D render, CGI, ' +
  'watermark, text overlay, logo, blurry, out of focus, overexposed, underexposed, ' +
  'oversaturated, plastic skin, uncanny valley, extra fingers, extra limbs, ' +
  'deformed, distorted face, low quality, compressed, noisy, pixelated, ' +
  'split screen, collage, multiple frames, border';

// ─── Time of Day from Lighting ─────────────────────────────────────

const TIME_OF_DAY: Record<string, string> = {
  warm: 'golden hour, late afternoon sunlight',
  cool: 'blue hour, early morning twilight',
  'high-contrast': 'midday harsh sun, deep shadows',
  mood: 'nighttime, city lights, ambient neon glow',
};

// ─── Location & Environment Extraction ───────────────────────────

/**
 * Extracts location/environment keywords from the user's vision text
 * to inject spatial continuity across all scenes.
 */
function extractLocationKeywords(visionText: string): string {
  if (!visionText) return '';

  const lower = visionText.toLowerCase();
  const locationSignals: string[] = [];

  // Common environment types
  const envPatterns: [RegExp, string][] = [
    [/\b(office|corporate|workspace|cubicle)\b/, 'modern office interior'],
    [/\b(city|urban|downtown|street|metropolis)\b/, 'urban cityscape'],
    [/\b(forest|woods|jungle|nature|wilderness)\b/, 'lush natural environment'],
    [/\b(beach|ocean|coast|sea|shore)\b/, 'coastal setting, ocean nearby'],
    [/\b(desert|sand|arid|dunes)\b/, 'arid desert landscape'],
    [/\b(mountain|alpine|summit|peak)\b/, 'mountainous terrain'],
    [/\b(home|house|apartment|living room|kitchen|bedroom)\b/, 'domestic interior'],
    [/\b(restaurant|cafe|bar|diner)\b/, 'restaurant/cafe setting'],
    [/\b(hospital|clinic|medical)\b/, 'medical facility interior'],
    [/\b(school|classroom|university|campus)\b/, 'educational institution'],
    [/\b(warehouse|factory|industrial)\b/, 'industrial setting'],
    [/\b(studio|stage|theater|theatre)\b/, 'studio/stage environment'],
    [/\b(space|galaxy|sci-fi|futuristic)\b/, 'futuristic sci-fi environment'],
    [/\b(medieval|castle|kingdom|fantasy)\b/, 'fantasy medieval setting'],
  ];

  for (const [pattern, descriptor] of envPatterns) {
    if (pattern.test(lower)) {
      locationSignals.push(descriptor);
    }
  }

  return locationSignals.length > 0
    ? `consistent setting: ${locationSignals.join(', ')}`
    : '';
}

/**
 * Builds spatial continuity context between scenes —
 * references the previous scene's framing for smooth visual flow.
 */
function buildSceneContinuityContext(
  sceneIndex: number,
  totalScenes: number,
  sceneType: string,
): string {
  if (sceneIndex === 0) return 'opening scene, establishing the visual world';

  const progressPct = sceneIndex / (totalScenes - 1);
  const narrativePhase = progressPct < 0.3 ? 'early narrative, still establishing'
    : progressPct < 0.7 ? 'mid-narrative, rising action'
    : 'approaching climax, peak intensity';

  const spatialCues: string[] = [`scene ${sceneIndex + 1} of ${totalScenes}`, narrativePhase];

  // Add transition guidance based on shot type
  if (sceneType === 'establishing' || sceneType === 'aerial') {
    spatialCues.push('pulling back to reveal scope');
  } else if (sceneType === 'closeup' || sceneType === 'reaction') {
    spatialCues.push('cutting in closer, same environment as previous scene');
  } else if (sceneType === 'ots' || sceneType === 'dialogue') {
    spatialCues.push('reverse angle, same location and lighting as previous scene');
  }

  return spatialCues.join(', ');
}

// ─── Main Builder ──────────────────────────────────────────────────

export interface CinematicPromptInput {
  basePrompt: string;
  sceneType: string;
  state: WizardState;
  continuity?: {
    sceneIndex: number;
    totalScenes: number;
  };
}

export interface CinematicPromptOutput {
  imagePrompt: string;
  videoMotionPrompt: string;
  negativePrompt: string;
}

export function buildCinematicPrompt(input: CinematicPromptInput): CinematicPromptOutput {
  const { basePrompt, sceneType, state, continuity } = input;

  // Gather all prompt components
  const parts: string[] = [];

  // 1. Shot framing
  const framing = SHOT_FRAMING[sceneType] ?? SHOT_FRAMING.medium;
  parts.push(framing);

  // 2. Scene description
  parts.push(basePrompt);

  // 3. Character injection
  const charParts: string[] = [];
  if (state.loraUrl && state.triggerWord) {
    charParts.push(state.triggerWord);
    if (state.characterGender) {
      charParts.push(`a ${state.characterGender} character`);
    }
    if (state.characterName) {
      charParts.push(`named ${state.characterName}`);
    }
  } else if (state.characterTab === 'ai' && state.aiDescription) {
    charParts.push(state.aiDescription);
  }
  if (charParts.length > 0) {
    parts.push(charParts.join(', '));
  }

  // 4. Color grading
  const colorGrading = COLOR_GRADING[state.colorIndex] ?? COLOR_GRADING[0];
  parts.push(colorGrading);

  // 5. Lighting
  const lighting = LIGHTING_MAP[state.lighting] ?? LIGHTING_MAP.warm;
  parts.push(lighting);

  // 6. Camera/composition
  const cameraComp = CAMERA_IMAGE_MAP[state.cameraMotion] ?? CAMERA_IMAGE_MAP['Static Frame'];
  parts.push(cameraComp);

  // 7. Persona tone
  if (state.selectedPersona !== null) {
    if (state.selectedPersona === 0 && state.customPersonaTone) {
      parts.push(state.customPersonaTone);
    } else {
      const tone = PERSONA_TONE[state.selectedPersona];
      if (tone) parts.push(tone);
    }
  }

  // 8. Time of day consistency
  const timeOfDay = TIME_OF_DAY[state.lighting] ?? TIME_OF_DAY.warm;
  parts.push(timeOfDay);

  // 9. Location/environment continuity from vision text
  const locationContext = extractLocationKeywords(state.visionText);
  if (locationContext) {
    parts.push(locationContext);
  }

  // 10. Scene-to-scene continuity context
  if (continuity) {
    const continuityContext = buildSceneContinuityContext(
      continuity.sceneIndex,
      continuity.totalScenes,
      sceneType,
    );
    parts.push(continuityContext);
    parts.push('maintaining visual continuity with previous scene');
  }

  // 11. Film stock + grain
  const filmStock = FILM_STOCK[state.lighting] ?? FILM_STOCK.warm;
  parts.push(`${filmStock}, ${FILM_SUFFIX}`);

  // Build the image prompt
  const imagePrompt = parts.join(', ');

  // Build the video motion prompt
  const cameraMotion = CAMERA_VIDEO_MAP[state.cameraMotion] ?? CAMERA_VIDEO_MAP['Static Frame'];
  const videoParts = [cameraMotion];

  // Scene-type-specific motion hints
  const sceneMotionHints: Record<string, string> = {
    establishing: 'slow reveal, camera settles into position',
    closeup: 'subtle focus breathing, micro-expressions visible',
    reaction: 'hold on face, slight push-in',
    aerial: 'sweeping continuous motion, landscape unfolding below',
    dialogue: 'gentle alternating focus, conversational rhythm',
    climax: 'accelerating camera energy, dramatic push',
    closing: 'slow pull-back, gradually widening frame',
    insert: 'rack focus on detail, shallow depth transition',
  };
  const motionHint = sceneMotionHints[sceneType];
  if (motionHint) videoParts.push(motionHint);

  // Add atmosphere for audio-enabled models
  if (state.selectedPersona !== null) {
    if (state.selectedPersona === 0 && state.customPersonaAtmosphere) {
      videoParts.push(`ambient sound: ${state.customPersonaAtmosphere}`);
    } else {
      const atmosphere = PERSONA_ATMOSPHERE[state.selectedPersona];
      if (atmosphere) videoParts.push(`ambient sound: ${atmosphere}`);
    }
  }

  // Lighting atmosphere for audio
  const lightingAtmosphere: Record<string, string> = {
    warm: 'warm ambient room tone, gentle background hum',
    cool: 'crisp air ambience, distant mechanical sounds',
    'high-contrast': 'tense silence, sharp footstep reverb',
    mood: 'moody rain or distant traffic, atmospheric drones',
  };
  const lightingAudio = lightingAtmosphere[state.lighting];
  if (lightingAudio && state.includeAudio) videoParts.push(lightingAudio);

  // Add pacing hint for video
  if (state.pacing === 'quick') {
    videoParts.push('fast-paced movement, quick transitions');
  } else if (state.pacing === 'slow') {
    videoParts.push('slow deliberate movement, contemplative pacing');
  }

  const videoMotionPrompt = videoParts.join(', ');

  return {
    imagePrompt,
    videoMotionPrompt,
    negativePrompt: NEGATIVE_PROMPT,
  };
}

// ─── Video Style Suffix ───────────────────────────────────────────
// Appended to EVERY video prompt for visual consistency across all clips

export function buildVideoStyleSuffix(state: WizardState): string {
  const parts: string[] = [];

  // Color grading — the most visible consistency anchor
  const colorGrading = COLOR_GRADING[state.colorIndex] ?? COLOR_GRADING[0];
  parts.push(colorGrading);

  // Lighting style
  const lighting = LIGHTING_MAP[state.lighting] ?? LIGHTING_MAP.warm;
  parts.push(lighting);

  // Film stock look
  const filmStock = FILM_STOCK[state.lighting] ?? FILM_STOCK.warm;
  parts.push(filmStock);

  // Time of day
  const timeOfDay = TIME_OF_DAY[state.lighting] ?? TIME_OF_DAY.warm;
  parts.push(timeOfDay);

  // Persona atmosphere (for audio-enabled models)
  if (state.selectedPersona !== null && state.selectedPersona !== 0) {
    const atmosphere = PERSONA_ATMOSPHERE[state.selectedPersona];
    if (atmosphere) parts.push(`ambient: ${atmosphere}`);
  } else if (state.selectedPersona === 0 && state.customPersonaAtmosphere) {
    parts.push(`ambient: ${state.customPersonaAtmosphere}`);
  }

  // Character reference in prompt for models that respond to text cues
  if (state.loraUrl && state.triggerWord) {
    parts.push(`consistent character: ${state.triggerWord}`);
  } else if (state.characterName) {
    parts.push(`consistent character: ${state.characterName}`);
  }

  return parts.join(', ');
}

// ─── Character Description Lock ──────────────────────────────────

/**
 * Builds a character description lock string from wizard state.
 * This frozen description is prepended word-for-word to every video prompt
 * so the AI model never drifts on character appearance.
 */
export function buildCharacterDescriptionLock(state: WizardState): string {
  // If user already locked a description, return it
  if (state.characterDescriptionLock) return state.characterDescriptionLock;

  const parts: string[] = [];

  // From LoRA training
  if (state.loraUrl && state.triggerWord) {
    parts.push(state.triggerWord);
    if (state.characterGender) parts.push(`a ${state.characterGender} character`);
    if (state.characterName) parts.push(`named ${state.characterName}`);
  }

  // From AI description
  if (state.characterTab === 'ai' && state.aiDescription) {
    parts.push(state.aiDescription);
  }

  // From production assets — find main character asset for physical details
  const characterAssets = (state.productionAssets || [])
    .filter(a => a.category === 'character' && a.description);
  if (characterAssets.length > 0) {
    // Use the first (primary) character's full description
    parts.push(characterAssets[0].description);
  }

  if (state.characterName && !parts.some(p => p.includes(state.characterName))) {
    parts.push(`character: ${state.characterName}`);
  }

  return parts.join(', ');
}

// ─── Consistency Prefix ──────────────────────────────────────────

/**
 * Builds a fixed ~200-char visual anchor block that is prepended
 * identically to every video prompt. This gives the model a consistent
 * starting point so it never drifts on the core visual identity.
 */
export function buildConsistencyPrefix(state: WizardState): string {
  const parts: string[] = [];

  // Character lock — the most critical anchor
  const charLock = state.characterDescriptionLock || buildCharacterDescriptionLock(state);
  if (charLock) parts.push(charLock);

  // Color grading anchor
  const colorGrading = COLOR_GRADING[state.colorIndex] ?? COLOR_GRADING[0];
  parts.push(colorGrading);

  // Lighting anchor
  const lighting = LIGHTING_MAP[state.lighting] ?? LIGHTING_MAP.warm;
  parts.push(lighting);

  // Film stock
  const filmStock = FILM_STOCK[state.lighting] ?? FILM_STOCK.warm;
  parts.push(filmStock);

  return parts.join(', ');
}

// ─── Exports for external use ──────────────────────────────────────

export { NEGATIVE_PROMPT, PERSONA_ATMOSPHERE, COLOR_GRADING };
