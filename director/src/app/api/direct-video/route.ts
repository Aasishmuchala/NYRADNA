import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// ─── Director Agent System Prompt for Video Direction ─────────────

const VIDEO_DIRECTOR_PROMPT = `You are an elite film director. You turn disconnected still images into a COHESIVE SHORT FILM by writing precise, layered video prompts.

You will receive a project vision, visual style DNA, and a sequence of still images. Your job: construct a narrative arc, reorder scenes cinematically, and write prompts that produce professional-grade video.

═══ PROMPT LENGTH RULE (NON-NEGOTIABLE) ═══
You will be told the EXACT character limit. Each videoPrompt MUST use the FULL budget (within 50 chars of max). A 200-char prompt produces generic garbage. A 1900-char prompt produces cinema. ALWAYS FILL THE BUDGET.

═══ THE 5-LAYER PROMPT FORMULA ═══
Every video prompt must be built in this exact order. This is how professional AI video prompts are structured:

LAYER 1 — SUBJECT (who/what, with specificity)
Not "a person" but "a woman in her early 30s with dark hair pulled back in a low bun, wearing a tailored navy blazer over a cream silk blouse, silver watch catching light on her left wrist." Include age, build, clothing details, distinguishing features, expression, posture. The more specific the subject, the more consistent the output.

LAYER 2 — ACTION (what happens, beat by beat across full clip duration)
Describe the FULL motion sequence second by second. Not "walks forward" but "strides purposefully through the rain-slicked street, left hand clutching her coat collar against the wind, right hand swinging a leather portfolio bag, pace quickening as she spots the entrance, heels clicking with each step transitioning from wet asphalt to dry concrete under the awning." Include:
- Speed, direction, and physics of movement (drifting slowly, sharp pivot, gentle sway)
- Micro-gestures: fingers drumming, jaw tightening, shoulders dropping, eyes narrowing
- Cause and effect: "she notices the letter, hesitates, then reaches for it — expression shifting from curiosity to recognition"
- Interaction with environment: touching surfaces, reacting to elements, navigating space

LAYER 3 — SETTING (environment as active storytelling)
The world is not a backdrop — it moves, breathes, and tells the story. Not "in an office" but "inside a glass-walled corner office on the 40th floor, city skyline stretching behind her in soft focus, morning light streaming through floor-to-ceiling windows casting long geometric shadows across the polished concrete floor, a single orchid on the minimalist desk catching a beam of light, dust motes drifting in the warm air." Include:
- Time of day and weather affecting the scene
- Environmental motion: curtains swaying, reflections rippling, leaves falling, traffic flowing
- Spatial depth: foreground/midground/background layers
- Atmospheric particles: dust, rain, steam, fog, lens flare

LAYER 4 — CAMERA (motivated movement using cinematography vocabulary)
Camera movement must serve the story — never move the camera without narrative motivation. Use precise terminology:
- Angles: low angle (power), bird's eye (isolation), eye-level (intimacy), Dutch angle (tension), over-the-shoulder (dialogue)
- Movement: dolly forward/back (revelation/retreat), tracking shot (journey), pan (survey), tilt (scale), push-in (realization), pull-back (reveal), whip pan (surprise), crane up (transcendence)
- Framing: wide shot (context), medium close-up (connection), close-up (emotion), extreme close-up (detail/tension)
- Lens: shallow depth of field with soft bokeh (isolation), deep focus (context), rack focus pulling from foreground to background (shift of attention), anamorphic lens flare (cinema)
- MOTIVATE every move: "camera slowly pushes in as she reads the message, depth of field narrowing to isolate her expression from the blurred chaos behind her — the world falling away as the weight of the words lands"

LAYER 5 — LIGHTING + STYLE (mood, color, and aesthetic)
- Direction and quality: "soft diffused key light from the left, warm practicals filling shadows, rim light separating subject from background"
- Behavior over time: "golden hour light sweeping across the wall as clouds pass, alternating between warm direct sun and cool diffused shadow"
- Color language: "warm amber tones grading into deep teal in the shadows" not "warm colors"
- Reference established styles when relevant: "Wes Anderson symmetry," "Roger Deakins motivated naturalism," "noir chiaroscuro," "Wong Kar-wai saturated urban neon"
- Weave the VISUAL STYLE DNA tokens naturally — don't append them, integrate them as organic parts of the scene description
${`- Texture and material interaction: how light hits skin (subsurface glow), fabric (soft absorption), metal (sharp specular), glass (refraction), water (caustics)`}

═══ AUDIO LAYER (when enabled) ═══
Time specific sounds to specific actions:
- "Her heels click sharply on marble transitioning to muffled thuds on carpet as she crosses the threshold"
- "Ambient city hum fades to near-silence as the door closes, replaced by the quiet mechanical tick of a wall clock"
- "Music swells exactly as she looks up — strings building from pianissimo to the first emotional peak"

═══ STORY STRUCTURE ═══
1. Read the project vision. Understand the story.
2. Map ALL scenes to a narrative arc: HOOK → SETUP → JOURNEY → TURN → PAYOFF
3. Each scene connects to what came BEFORE and AFTER — every clip is a chapter.

Scene 1: THE HOOK — wide establishing shot, world + character, something catches attention.
Early: THE SETUP — introduce situation, desire, stakes.
Middle: THE JOURNEY — escalation, complications, discoveries. Raise emotional stakes each scene.
Late: THE TURN — the pivotal moment. Something changes irreversibly.
Final: THE PAYOFF — resolution, emotional landing. Leave the viewer feeling something.

═══ CRITICAL: START FRAME RULE ═══
The still image IS the first frame of the video. The video model will animate FROM this exact image. This means:
- The character is ALREADY in the frame, in the position shown in the image. DO NOT describe them entering, arriving, walking in, or appearing — they are ALREADY THERE.
- DO NOT write "she walks into the room" or "he enters the frame" or "character appears" — the character is already visible in the starting image.
- Instead, describe what happens NEXT: "she shifts her weight, turns her gaze toward the window..." or "he lifts the coffee cup, steam curling as he takes a slow sip..."
- Think of it as pressing PLAY on a paused video — describe the continuation of the moment, not the beginning.
- If you need a character to enter a scene, that must be a NEW scene with an imagePrompt showing the empty space BEFORE entry.

Violating this rule causes the character to "phase through walls" or "materialize from nowhere" — the #1 most common AI video artifact.

═══ WHAT TO AVOID ═══
- NEVER write conflicting instructions ("fast-paced action" + "slow contemplative mood")
- NEVER use vague words: "nice," "good," "interesting," "beautiful" — replace with specific visual terms
- NEVER write "cinematic, high quality, 4K, masterpiece" filler — that wastes character budget on nothing
- NEVER describe the character entering/arriving/appearing — they are ALREADY in the starting frame
- NEVER omit motion info — always specify what moves, how fast, in what direction
- NEVER write complex multi-action sequences that can't happen in one clip — keep actions realistic for the clip duration
- NEVER pad with generic adjectives. Every word earns its place with specificity.
- NEVER repeat the character's full physical description in every prompt — the subject_reference images handle face/body lock. Just use their name or a brief identifier ("she", "Priya", "the trainer").

═══ GOOD vs BAD EXAMPLES ═══

BAD: "A woman walks into a room and looks around. Cinematic lighting, high quality, 4K."
WHY BAD: "walks into" violates start frame rule (she's already in the image), vague subject, no specific action, no setting detail, no camera, "cinematic 4K" is filler.

GOOD: "Medium close-up of a woman in her early 30s with dark hair and a tailored charcoal blazer stepping through a frosted glass doorway into a sun-flooded corner office. She pauses mid-stride as her gaze catches something on the desk — her confident posture softening, fingers loosening around the leather portfolio strap. Camera holds steady at eye level then slowly pushes in as recognition crosses her face, shallow depth of field collapsing the bright cityscape behind her into abstract bokeh. Morning light streams through floor-to-ceiling windows at a low angle, casting her elongated shadow across polished concrete. Warm golden tones grade into cool slate in the deeper shadows, soft diffused key light from the windows wrapping her face. The quiet mechanical hum of the building gives way to near-silence as the door clicks shut behind her."
WHY GOOD: Specific subject, beat-by-beat action with micro-gestures, active setting, motivated camera with lens detail, precise lighting with color, timed audio.

═══ CONTINUITY BIBLE (CHARACTER + ENVIRONMENT LOCK) ═══
You will receive a CONTINUITY BIBLE in the user message with:
- CHARACTER references with <<<image_N>>> tags — USE these tags when referring to characters in your prompts
- ENVIRONMENT/LOCATION references with <<<image_N>>> tags — USE these tags for locations
- LOCKED visual attributes (wardrobe, hair, props, colors) — NEVER contradict these

CRITICAL: In every videoPrompt, use the <<<image_N>>> tag for the main character instead of describing their full appearance. The reference images handle visual identity — your prompts handle ACTION and STORY.

Example with tags:
"<<<image_1>>> leans against the railing, gaze drifting toward the horizon as golden hour light catches the edge of her jaw..."
NOT: "A woman in her 30s with dark hair wearing a navy blazer leans against the railing..."

The model will lock onto the reference image's face, body, clothing, and environment when it sees the <<<image_N>>> tag. This is the #1 consistency mechanism — always use it.

CONTINUITY RULES:
- Time must progress logically across scenes (morning → afternoon → evening, or scene-to-scene cause & effect)
- If a character is introduced in scene 1, reference them consistently by appearance details AND <<<image_N>>> tag
- Spatial relationships must make sense — if scene 2 is inside a building, there should be a reason they went inside
- Emotional tone should build, not randomly jump — create an arc the viewer FEELS
- The final scene must feel like an ENDING, not an arbitrary stop
- Visual style must remain consistent — same color grading, same film stock look, same lighting philosophy across all scenes
- Wardrobe, hair, accessories, and props MUST stay the same across all scenes unless the story explicitly changes them

SCENE ORDERING — THIS IS CRITICAL:
The scenes you receive may be in RANDOM ORDER (the order assets were generated, NOT narrative order). You MUST REORDER them into cinematic sequence. Think like a film editor:
- Start with an ESTABLISHING shot — a location wide, an environment, or a character arriving. NEVER start with a close-up of clothing, accessories, or props.
- Character introductions come early — face, personality, energy.
- Wardrobe, accessories, and props are REVEALED during the story — they don't open the film.
- Build tension and interest through the middle.
- End with emotional resolution — a closing moment, a look, a departure.

A professional ad/film ALWAYS opens with context (where are we? who is this?) before showing details (what are they wearing? what do they have?). The viewer needs to CARE about the character before caring about their outfit.

MISSING SCENES — FILL THE GAPS:
After reviewing the available scenes, you may find the story has GAPS — missing an establishing shot, a transition, a reaction, a climax, or a closing moment. If the story needs a scene that doesn't exist, ADD IT.

To add a missing scene, include an entry with sceneId starting with "new-" and add an "imagePrompt" field describing what still image should be generated as the starting frame.

Rules for new scenes:
- Add as many new scenes as the story NEEDS — there is no limit. If the narrative requires 2 new scenes, add 2. If it requires 10, add 10. The story comes first.
- New scenes should fill narrative gaps: missing establishing shot, missing transition, missing reaction, missing emotional beat, missing climax, missing closing
- The imagePrompt should describe a STILL PHOTOGRAPH (the starting frame), not a video
- Place new scenes in the correct narrative position in the output array
- New scenes need both imagePrompt (for image generation) AND videoPrompt (for video generation)

OUTPUT FORMAT:
Return ONLY a JSON array IN YOUR CHOSEN NARRATIVE ORDER (which may differ from the input order), no other text:
[
  {
    "sceneId": "existing-scene-id OR new-1, new-2, etc for scenes that need to be created",
    "videoPrompt": "the detailed story-driven video prompt — MUST be close to the CHARACTER LIMIT specified",
    "directorNote": "the narrative purpose of this scene in the overall story (1 sentence)",
    "imagePrompt": "ONLY for new scenes — describe the still image to generate as the starting frame (200-400 chars, cinematic photography description)"
  }
]`;

interface SceneInput {
  id: string;
  prompt: string;
  imageUrl: string | null;
  assetCategory?: string;
  sceneIndex?: number;
  videoMotionPrompt?: string;
}

interface ProjectContext {
  visionText: string;
  selectedPersona: number | null;
  customPersonaTone: string;
  customPersonaAtmosphere: string;
  colorIndex: number;
  aspectRatio: string;
  pacing: string;
  lighting: string;
  cameraMotion: string;
  characterName: string;
  characterGender: string;
  aiDescription: string;
  triggerWord: string;
  loraUrl: string | null;
  selectedVideoModel: string;
  includeAudio: boolean;
  styleSuffix?: string;
}

interface ContinuityBibleEntry {
  name: string;
  imageTag: string;         // e.g., '<<<image_1>>>'
  description: string;
  category: string;         // 'character' | 'location' | 'wardrobe' | 'prop' etc.
}

interface DirectVideoRequest {
  scenes: SceneInput[];
  context: ProjectContext;
  continuityBible?: ContinuityBibleEntry[];
}

// Color palette names for context
const COLOR_NAMES: Record<number, string> = {
  0: 'Action Orange — warm amber, golden hour, burnt orange tones',
  1: 'Electric Blue — cool cyan, moonlit, electric blue tones',
  2: 'Cyber Purple — deep violet, ultraviolet, neon accents',
  3: 'Neon Pink — hot magenta, fuchsia, sunset haze',
  4: 'Matrix Green — emerald, jade, bioluminescent tones',
};

const PERSONA_NAMES: Record<number, string> = {
  1: 'Modern Professional — clean corporate, minimalist, editorial',
  2: 'Gen Z Trendsetter — bold, social-native, high energy, viral',
  3: 'Luxury Seeker — premium, sophisticated, Vogue-grade',
  4: 'Small Business Owner — authentic, warm, relatable',
  5: 'Avant-Garde Creator — experimental, abstract, mixed media',
  6: 'Fitness & Lifestyle — dynamic, aspirational, high-energy',
  7: 'Tech Futurist — sleek, holographic, sci-fi inspired',
  8: 'Intimate Storyteller — documentary, raw, emotional',
};

const VIDEO_MODEL_CONTEXT: Record<string, { description: string; maxChars: number }> = {
  'kling-3.0': {
    description: 'Kling 3.0 Omni — supports audio generation, reference images, up to 15s, 4K/60fps. Responds extremely well to long, detailed motion descriptions, camera movement, environmental detail, and audio cues.',
    maxChars: 2000,
  },
  'hailuo-2.3': {
    description: 'MiniMax Hailuo 2.3 — realistic motion, high-fidelity stylization, up to 10s. No audio. Focus on visual motion and camera work.',
    maxChars: 1500,
  },
  'wan-2.1-720p': {
    description: 'Wan 2.1 I2V 720p — fast, 720p, up to 5s. No audio. Focus on primary action and camera movement.',
    maxChars: 1000,
  },
  'minimax-video-01': {
    description: 'MiniMax Video-01 Live — fast previews, up to 6s. No audio. Focus on motion descriptions.',
    maxChars: 1000,
  },
};

export async function POST(req: NextRequest) {
  try {
    const { scenes, context, continuityBible }: DirectVideoRequest = await req.json();

    if (!scenes || scenes.length === 0) {
      return NextResponse.json({ error: 'No scenes provided' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY || '';

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured. Add one in Settings > API Keys.' },
        { status: 500 },
      );
    }

    const client = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://director.ai',
        'X-Title': 'Director AI Video',
      },
    });

    // Resolve model capabilities
    const modelInfo = VIDEO_MODEL_CONTEXT[context.selectedVideoModel] ?? { description: context.selectedVideoModel, maxChars: 1500 };
    const maxPromptChars = modelInfo.maxChars;

    // Build the project context message
    const projectDescription = [
      `PROJECT VISION: ${context.visionText || 'No vision text provided'}`,
      `PERSONA: ${context.selectedPersona !== null ? (PERSONA_NAMES[context.selectedPersona] || `Custom — ${context.customPersonaTone}`) : 'Not set'}`,
      context.customPersonaAtmosphere ? `CUSTOM ATMOSPHERE: ${context.customPersonaAtmosphere}` : '',
      `COLOR PALETTE: ${COLOR_NAMES[context.colorIndex] || 'Action Orange'}`,
      `LIGHTING: ${context.lighting}`,
      `PACING: ${context.pacing}`,
      `CAMERA STYLE: ${context.cameraMotion}`,
      `ASPECT RATIO: ${context.aspectRatio}`,
      `AUDIO ENABLED: ${context.includeAudio ? 'Yes — include ambient sound and audio cues in prompts' : 'No — skip audio descriptions'}`,
      context.characterName ? `CHARACTER: ${context.characterName} (${context.characterGender})` : '',
      context.aiDescription ? `CHARACTER DESCRIPTION: ${context.aiDescription}` : '',
      context.loraUrl ? `LoRA TRAINED: Yes — use trigger word "${context.triggerWord}" for character consistency` : '',
      `VIDEO MODEL: ${modelInfo.description}`,
      context.styleSuffix ? `\nVISUAL STYLE DNA (these exact cinematic tokens define the look — weave them naturally into every video prompt):\n${context.styleSuffix}` : '',
    ].filter(Boolean).join('\n');

    // Build scene descriptions
    const sceneDescriptions = scenes.map((scene, idx) => {
      const parts = [
        `--- SCENE ${idx + 1} (id: ${scene.id}) ---`,
        `IMAGE DESCRIPTION: ${scene.prompt}`,
        scene.assetCategory ? `ASSET TYPE: ${scene.assetCategory}` : '',
        scene.videoMotionPrompt ? `EXISTING MOTION HINT: ${scene.videoMotionPrompt}` : '',
        scene.imageUrl ? `[Has source image]` : '[No image yet]',
      ];
      return parts.filter(Boolean).join('\n');
    }).join('\n\n');

    // Build continuity bible section if reference images are available
    let continuityBibleText = '';
    if (continuityBible && continuityBible.length > 0) {
      const characters = continuityBible.filter(e => e.category === 'character');
      const locations = continuityBible.filter(e => e.category === 'location');
      const others = continuityBible.filter(e => e.category !== 'character' && e.category !== 'location');

      const parts: string[] = ['═══ CONTINUITY BIBLE — VISUAL REFERENCES ═══'];

      if (characters.length > 0) {
        parts.push('\nCHARACTERS (use these <<<image_N>>> tags in EVERY prompt):');
        for (const c of characters) {
          parts.push(`  ${c.imageTag} — ${c.name}: ${c.description}`);
        }
      }

      if (locations.length > 0) {
        parts.push('\nLOCATIONS/ENVIRONMENTS:');
        for (const l of locations) {
          parts.push(`  ${l.imageTag} — ${l.name}: ${l.description}`);
        }
      }

      if (others.length > 0) {
        parts.push('\nWARDROBE / PROPS / VEHICLES:');
        for (const o of others) {
          parts.push(`  ${o.imageTag} — ${o.name} (${o.category}): ${o.description}`);
        }
      }

      parts.push('\nRULE: Always use the <<<image_N>>> tag when referring to a character or location. The model will lock onto the reference image for visual identity. DO NOT describe their full appearance — the reference handles that. Focus on ACTION and STORY.');
      continuityBibleText = parts.join('\n');
    }

    const userMessage = `${projectDescription}
${continuityBibleText ? `\n${continuityBibleText}\n` : ''}
TOTAL SCENES: ${scenes.length}

${sceneDescriptions}

═══════════════════════════════════════════════════════
CHARACTER LIMIT PER PROMPT: ${maxPromptChars} CHARACTERS
═══════════════════════════════════════════════════════

This is NON-NEGOTIABLE. Each videoPrompt in your JSON output MUST be between ${maxPromptChars - 100} and ${maxPromptChars} characters long. Count carefully. The video model performs dramatically better with longer, more detailed prompts — a 200-char prompt produces generic garbage, a ${maxPromptChars}-char prompt produces cinema.

USE THE 5-LAYER FORMULA TO FILL ${maxPromptChars} CHARACTERS PER SCENE:

LAYER 1 — SUBJECT: Specific character description with age, build, clothing details, expression, posture, distinguishing features. (2-3 sentences)
LAYER 2 — ACTION: Beat-by-beat motion across full clip duration. Micro-gestures, speed, direction, cause-and-effect, interaction with environment. NOT "walks forward" — describe the PHYSICS of every movement. (3-5 sentences)
LAYER 3 — SETTING: Active environment with foreground/midground/background depth. Time of day, weather, atmospheric particles, environmental motion. The world breathes and moves. (2-3 sentences)
LAYER 4 — CAMERA: Motivated movement using exact cinematography terms (dolly, tracking, push-in, rack focus, shallow DOF, anamorphic). Every camera move serves a story purpose. (2-3 sentences)
LAYER 5 — LIGHTING + STYLE: Light direction, quality, behavior over time. Color grading language. STYLE DNA tokens woven naturally. Material/texture interaction with light. (2-3 sentences)
${context.includeAudio ? 'AUDIO: Specific sounds timed to specific actions. Ambient transitions. Music swells at emotional peaks. (1-2 sentences)\n' : ''}
These ${scenes.length} scenes are the FRAMES of a short film. Your job is to turn them into a story.

Step 1: Read the project vision, VISUAL STYLE DNA, and all scene descriptions.
Step 2: REORDER scenes into cinematic narrative sequence (location/character first, wardrobe/props revealed during story, NOT as openers).
Step 3: Add NEW scenes if the story has gaps (missing establishing shot, transition, climax, closing).
Step 4: Write each video prompt using the 5-LAYER FORMULA, filling every character of the ${maxPromptChars}-char budget.

Every scene must connect to the one before it and the one after it. The final scene must feel like an ending.

REMEMBER: The image IS the first video frame. The character is ALREADY in position. NEVER describe them entering, arriving, or appearing — describe what happens NEXT from their current position. Think: pressing PLAY on a paused video.`;

    console.log(`[/api/direct-video] Generating prompts for ${scenes.length} scenes, model=${context.selectedVideoModel}`);

    // Scale max_tokens to scene count — each scene needs ~600 tokens for a 2000-char prompt + JSON overhead
    const estimatedTokens = Math.max(16000, scenes.length * 800 + 2000);

    const completion = await client.chat.completions.create({
      model: 'openai/gpt-5.4-mini',
      temperature: 0.8,
      max_tokens: estimatedTokens,
      messages: [
        { role: 'system', content: VIDEO_DIRECTOR_PROMPT },
        { role: 'user', content: userMessage },
      ],
    });

    const responseText = completion.choices[0]?.message?.content || '';

    // Parse JSON from response (handle markdown code blocks)
    let parsed: { sceneId: string; videoPrompt: string; directorNote: string }[];
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('No JSON array found in response');
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      console.error('[/api/direct-video] Failed to parse response:', responseText.slice(0, 500));
      return NextResponse.json(
        { error: 'Director AI returned invalid format. Please try again.' },
        { status: 500 },
      );
    }

    console.log(`[/api/direct-video] Generated ${parsed.length} video prompts`);

    return NextResponse.json({ prompts: parsed });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Director video prompting failed';
    console.error(`[/api/direct-video] Error: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
