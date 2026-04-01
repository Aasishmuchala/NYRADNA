'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useWizard } from '@/context/WizardContext';
import type { ProductionAsset, AssetCategory } from '@/context/WizardContext';
import { AlertModal } from '@/components/ui/Modal';
import { useTraining } from '@/hooks/useTraining';
import { useVideoTraining } from '@/hooks/useVideoTraining';
import { IMAGE_MODELS } from '@/lib/models';
import { getApiKeys, getSelectedModel } from '@/lib/apiKeyStore';
import { buildVideoStyleSuffix, buildCharacterDescriptionLock } from '@/lib/cinematicPrompt';

const AI_MODELS = IMAGE_MODELS.filter(m => !m.loraSupport);

// ─── Asset Categories ──────────────────────────────────────────────

const ASSET_CATEGORIES: { id: AssetCategory; label: string; icon: string; description: string; placeholder: string }[] = [
  { id: 'character', label: 'Characters', icon: 'face', description: 'Main & supporting characters', placeholder: 'A mysterious detective in a noir trench coat, aged 40s, sharp jawline, piercing blue eyes...' },
  { id: 'location', label: 'Locations', icon: 'landscape', description: 'Backgrounds, sets, environments', placeholder: 'A rain-soaked Tokyo alley at night, neon signs reflecting in puddles, steam rising from grates...' },
  { id: 'wardrobe', label: 'Wardrobe', icon: 'checkroom', description: 'Clothing, outfits, costumes', placeholder: 'A tailored navy blue double-breasted suit with gold pocket square, slim fit, Italian wool...' },
  { id: 'prop', label: 'Props', icon: 'inventory_2', description: 'Key objects, devices, items', placeholder: 'A vintage leather-bound journal with brass clasp, weathered pages, mysterious symbols on cover...' },
  { id: 'vehicle', label: 'Vehicles', icon: 'directions_car', description: 'Cars, bikes, aircraft', placeholder: 'A matte black 1967 Ford Mustang GT500, chrome details, parked under streetlight, wet asphalt...' },
  { id: 'accessory', label: 'Accessories', icon: 'watch', description: 'Watches, glasses, jewelry', placeholder: 'A vintage gold pocket watch with intricate engraving, cracked glass face, stopped at 11:42...' },
];

// Character-specific shot types
const CHARACTER_SHOTS = [
  { id: 'hero', label: 'Hero Portrait', icon: 'face', promptSuffix: 'professional headshot, neutral confident expression, eye-level, studio lighting' },
  { id: 'happy', label: 'Happy', icon: 'sentiment_very_satisfied', promptSuffix: 'warm genuine smile, joyful expression, soft natural lighting' },
  { id: 'serious', label: 'Serious', icon: 'psychology', promptSuffix: 'serious intense expression, dramatic side lighting, moody shadows' },
  { id: 'angry', label: 'Angry', icon: 'sentiment_very_dissatisfied', promptSuffix: 'angry fierce expression, harsh under-lighting, high contrast' },
  { id: 'sad', label: 'Sad', icon: 'mood_bad', promptSuffix: 'sad reflective expression, soft diffused backlight, somber atmosphere' },
  { id: 'action', label: 'Action', icon: 'directions_run', promptSuffix: 'dynamic action pose, low angle, slight motion blur' },
  { id: 'closeup', label: 'Close-up', icon: 'zoom_in', promptSuffix: 'extreme close-up on eyes, macro detail, shallow depth of field' },
  { id: 'profile', label: 'Profile', icon: 'account_circle', promptSuffix: 'side profile view, rim lighting, silhouette edge' },
] as const;

// Location/prop angle variants
const ASSET_ANGLES = [
  { id: 'main', label: 'Main Shot', promptSuffix: 'hero shot, centered composition, studio lighting, product photography' },
  { id: 'detail', label: 'Detail', promptSuffix: 'extreme close-up detail shot, macro photography, texture visible' },
  { id: 'wide', label: 'Wide / Context', promptSuffix: 'wide establishing shot, environmental context, cinematic composition' },
  { id: 'dramatic', label: 'Dramatic', promptSuffix: 'dramatic low angle, moody lighting, cinematic atmosphere' },
] as const;

// ─── Agent System Prompt ────────────────────────────────────────────

const PRODUCTION_AGENT_PROMPT = `You are the PRODUCTION DESIGNER agent for DIRECTOR AI — an elite production designer, casting director, and art director with deep knowledge of cinematic visual storytelling.

Your job: Design EVERY production asset needed for the user's AI video project — characters, locations, wardrobe, props, vehicles, accessories. Output a COMPLETE production package IMMEDIATELY. Do NOT ask questions unless absolutely critical. Act decisively.

CRITICAL BEHAVIOR:
- When given a project concept (even brief), IMMEDIATELY output a full production package. Don't ask "what do you want?" — you're the production designer, DESIGN IT.
- Be extremely creative and proactive. If user says "luxury watch ad", you decide the character, the penthouse location, the outfit, the car, the watch itself.
- Every description MUST be 50+ words and hyper-specific for AI image generation. Include: materials, textures, colors, lighting, atmosphere, age, condition, brand aesthetic.
- Always include 2-3 characters (main + supporting), 2-3 locations, wardrobe per character, 3-5 props, and relevant vehicles/accessories.
- Pick the RIGHT generation model for each asset based on its nature.

OUTPUT FORMAT — use this EXACT structure:

---PRODUCTION_ASSETS---
{
  "assets": [
    {
      "category": "character|location|wardrobe|prop|vehicle|accessory",
      "name": "Asset Name",
      "description": "Extremely detailed visual description for AI image generation. Include textures, colors, materials, condition, lighting, atmosphere, age, ethnicity, build. Minimum 50 words. Be vivid and specific enough that two different AI models would produce similar results.",
      "model": "flux-schnell|flux-2-pro|ideogram-v3|recraft-v4",
      "gender": "male|female|other (only for characters)"
    }
  ]
}
---END_ASSETS---

ASSET REQUIREMENTS BY CATEGORY:
- **Characters**: Age, ethnicity, build, height, facial features (eye color, jaw shape, nose, lips), hair (color, length, style), clothing they're wearing, posture, expression, distinguishing marks (scars, tattoos, moles), overall vibe/energy
- **Locations**: Time of day, season, weather, architectural style, materials (concrete, wood, glass), ambient lighting (neon, sunlight, moonlight), atmosphere (foggy, clear, dusty), camera-ready composition notes
- **Wardrobe**: Fabric type, color exact shade, fit (slim, oversized, tailored), brand aesthetic, condition (new, worn, vintage), layering, accessories worn with it, era/decade influence
- **Props**: Material, size, weight feel, color, surface texture, condition, contextual placement, era, any text/logos/markings
- **Vehicles**: Make, model, year, exact color, finish (matte, gloss, metallic), condition, any modifications, interior details, setting/background it sits in
- **Accessories**: Material (gold, silver, leather, titanium), finish, size, distinguishing details, brand aesthetic, wear/patina, era

MODEL SELECTION GUIDE:
- "flux-2-pro" — Hero characters, key locations, luxury items. BEST QUALITY.
- "recraft-v4" — Editorial wardrobe, brand assets, high-fashion. ART DIRECTED.
- "ideogram-v3" — Props with text/logos, designed branded items. TEXT RENDERING.
- "flux-schnell" — Quick supporting assets, accessories, simple props. FAST.

STYLE DNA — You MUST also output a style recommendation block for the next step. This tells the system what visual style to use for scene generation. Base it on the project concept, target audience, and the assets you designed.

---STYLE_DNA---
{
  "colorIndex": 0,
  "lighting": "warm|cool|high-contrast|mood",
  "cameraMotion": "Handheld Cinematic|Dolly Smooth|Drone Sweep|Static Frame|Gimbal Drift|Whip Pan",
  "pacing": "quick|balanced|slow",
  "aspectRatio": "16:9|9:16|1:1",
  "selectedImageModel": "flux-dev-lora|flux-schnell|flux-2-pro|ideogram-v3|recraft-v4",
  "selectedVideoModel": "kling-3.0|hailuo-2.3|wan-2.1-720p|minimax-video-01"
}
---END_STYLE---

COLOR INDEX MAP:
0 = Action Orange (warm, energetic, golden hour) — ideal for action, lifestyle, food
1 = Electric Blue (cool, tech, moonlit) — ideal for tech, corporate, sci-fi
2 = Cyber Purple (futuristic, neon, creative) — ideal for music, nightlife, fashion
3 = Neon Pink (vibrant, youth, bold) — ideal for Gen Z, social media, pop culture
4 = Matrix Green (natural, organic, fresh) — ideal for nature, wellness, eco

LIGHTING GUIDE:
- "warm" — Golden hour, romantic, cozy, product beauty shots
- "cool" — Corporate, tech, modern, clinical, sci-fi
- "high-contrast" — Dramatic, noir, fashion editorial, thriller
- "mood" — Atmospheric, music video, nightlife, emotional

CAMERA GUIDE:
- "Handheld Cinematic" — Documentary, vlog, raw/authentic
- "Dolly Smooth" — Premium, luxury, corporate, beauty
- "Drone Sweep" — Travel, real estate, epic landscape
- "Static Frame" — Minimalist, symmetrical, Wes Anderson
- "Gimbal Drift" — Social content, lifestyle, dreamy
- "Whip Pan" — High energy, transitions, action

VIDEO MODEL GUIDE:
- "kling-3.0" — Best quality, supports audio, 15s clips. Default choice.
- "hailuo-2.3" — MiniMax Hailuo, realistic motion, high-fidelity. 10s clips.
- "wan-2.1-720p" — Open-source, fast, competitive quality. 5s clips. Budget option.
- "minimax-video-01" — Fast and reliable. Good for quick previews. 6s clips.

OUTPUT THE FULL PACKAGE ON YOUR FIRST RESPONSE. Include both PRODUCTION_ASSETS and STYLE_DNA blocks. Then say "Production package ready. Hit Execute to generate all assets, or tell me what to adjust."`;

const OPENROUTER_MODEL_NAMES: Record<string, string> = {
  'google/gemini-2.5-pro': 'Gemini 2.5 Pro',
  'anthropic/claude-sonnet-4': 'Claude Sonnet 4',
  'minimax/minimax-m2.7': 'MiniMax M2.7',
  'minimax/minimax-m2.5': 'MiniMax M2.5',
  'minimax/minimax-m2-her': 'MiniMax M2-Her',
  'mistralai/mistral-small-creative': 'Mistral Creative',
};

// ─── Types ──────────────────────────────────────────────────────────

interface ChatMessage { id: string; role: 'user' | 'assistant'; content: string; }

interface AgentAsset {
  category: AssetCategory;
  name: string;
  description: string;
  model: string;
  gender?: string;
}

interface StyleDnaSpec {
  colorIndex?: number;
  lighting?: 'warm' | 'cool' | 'high-contrast' | 'mood';
  cameraMotion?: string;
  pacing?: 'quick' | 'balanced' | 'slow';
  aspectRatio?: '9:16' | '16:9' | '1:1';
  selectedImageModel?: string;
  selectedVideoModel?: string;
}

function parseAssetSpec(content: string): AgentAsset[] | null {
  const match = content.match(/---PRODUCTION_ASSETS---\s*([\s\S]*?)\s*---END_ASSETS---/);
  if (!match) {
    console.log('[parseAssetSpec] No PRODUCTION_ASSETS block found');
    return null;
  }
  try {
    // Strip markdown code fences if LLM wrapped JSON in ```json ... ```
    const raw = match[1].replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(raw);
    const assets = parsed.assets ?? parsed;
    console.log(`[parseAssetSpec] Parsed ${Array.isArray(assets) ? assets.length : 0} assets`);
    return Array.isArray(assets) ? (assets as AgentAsset[]) : null;
  } catch (e) {
    console.error('[parseAssetSpec] JSON parse failed:', e, '\nRaw:', match[1].slice(0, 200));
    return null;
  }
}

function parseStyleDna(content: string): StyleDnaSpec | null {
  const match = content.match(/---STYLE_DNA---\s*([\s\S]*?)\s*---END_STYLE---/);
  if (!match) {
    console.log('[parseStyleDna] No STYLE_DNA block found');
    return null;
  }
  try {
    const raw = match[1].replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '').trim();
    return JSON.parse(raw) as StyleDnaSpec;
  } catch (e) {
    console.error('[parseStyleDna] JSON parse failed:', e, '\nRaw:', match[1].slice(0, 200));
    return null;
  }
}

function stripAssetBlock(content: string): string {
  return content
    .replace(/---PRODUCTION_ASSETS---[\s\S]*?---END_ASSETS---/, '')
    .replace(/---STYLE_DNA---[\s\S]*?---END_STYLE---/, '')
    .trim();
}

// ─── Component ──────────────────────────────────────────────────────

export default function CharacterSetupPage() {
  useEffect(() => {
    document.title = 'Character Setup — DIRECTOR';
  }, []);

  const { state, update } = useWizard();
  const { startTraining, isUploading, isTraining, progress, loraUrl, error: trainingError } = useTraining();
  const videoTraining = useVideoTraining();

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [mode, setMode] = useState<'agent' | 'manual'>('agent');
  const [activeCategory, setActiveCategory] = useState<AssetCategory>('character');

  // Manual form state
  const [assetName, setAssetName] = useState('');
  const [assetDescription, setAssetDescription] = useState('');
  const [assetModel, setAssetModel] = useState('flux-schnell');
  const [showModelPicker, setShowModelPicker] = useState(false);

  // LoRA upload state
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Training config state
  const [trainingSteps, setTrainingSteps] = useState(1000);
  const [trainingLR, setTrainingLR] = useState(0.0004);
  const [trainingResolution, setTrainingResolution] = useState(512);

  // Video LoRA state
  const [videoLoraUnlocked, setVideoLoraUnlocked] = useState(false);
  const [videoLoraPassword, setVideoLoraPassword] = useState('');
  const [videoLoraError, setVideoLoraError] = useState<string | null>(null);
  const [videoTrainingFiles, setVideoTrainingFiles] = useState<File[]>([]);
  const [videoTrainingTarget, setVideoTrainingTarget] = useState<'cogvideox-5b' | 'hunyuan-video'>('cogvideox-5b');
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  // Agent state
  const [agentMessages, setAgentMessages] = useState<ChatMessage[]>([]);
  const [agentInput, setAgentInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [agentAssets, setAgentAssets] = useState<AgentAsset[] | null>(null);
  const [agentStyleDna, setAgentStyleDna] = useState<StyleDnaSpec | null>(null);
  const [autopilotPhase, setAutopilotPhase] = useState<'idle' | 'designing' | 'review' | 'applying' | 'generating' | 'done'>('idle');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const autoStarted = useRef(false);

  // Generation polling
  const [generatingIds, setGeneratingIds] = useState<Map<string, string>>(new Map()); // assetId -> predictionId
  const generationLoopRunning = useRef(false); // true while the sequential generation loop is active

  // LLM config
  const [llmModel, setLlmModel] = useState('');
  const [llmApiKey, setLlmApiKey] = useState('');

  const [showContinueBanner, setShowContinueBanner] = useState(false);
  const router = useRouter();

  // Reset local state when wizard state is cleared (new project)
  const prevBaseSeed = useRef(state.baseSeed);
  useEffect(() => {
    if (state.baseSeed !== prevBaseSeed.current) {
      prevBaseSeed.current = state.baseSeed;
      setAgentMessages([]);
      setAgentInput('');
      setAgentAssets(null);
      setAgentStyleDna(null);
      setAutopilotPhase('idle');
      setIsStreaming(false);
      setGeneratingIds(new Map());
      setShowContinueBanner(false);
      autoStarted.current = false;
      if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    }
  }, [state.baseSeed]);

  const [showAlert, setShowAlert] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ title: '', message: '' });

  const loadProviderSettings = useCallback(() => {
    const m = getSelectedModel(); const k = getApiKeys();
    setLlmModel(m); setLlmApiKey(k.openrouter);
  }, []);

  useEffect(() => { loadProviderSettings(); window.addEventListener('focus', loadProviderSettings); return () => window.removeEventListener('focus', loadProviderSettings); }, [loadProviderSettings]);
  useEffect(() => { return () => { uploadedImages.forEach(u => URL.revokeObjectURL(u)); }; }, [uploadedImages]);
  useEffect(() => { if (trainingError) { setAlertMsg({ title: 'Training Error', message: trainingError }); setShowAlert(true); } }, [trainingError]);
  useEffect(() => { if (loraUrl) { setAlertMsg({ title: 'LoRA Trained', message: 'Character LoRA ready!' }); setShowAlert(true); } }, [loraUrl]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [agentMessages]);

  // ─── Polling for generating assets ────────────────────────────────

  // Use a ref for productionAssets so polling always sees the latest
  const assetsRef = useRef(state.productionAssets);
  useEffect(() => { assetsRef.current = state.productionAssets; }, [state.productionAssets]);

  const pollAsset = useCallback(async (assetId: string, predictionId: string) => {
    try {
      const res = await fetch(`/api/status/${predictionId}`);
      const data = await res.json();
      if (data.status === 'succeeded') {
        const output = Array.isArray(data.output) ? data.output[0] : data.output;
        update({
          productionAssets: assetsRef.current.map(a =>
            a.id === assetId ? { ...a, imageUrl: output || null, status: 'succeeded' as const } : a
          ),
        });
        setGeneratingIds(prev => { const next = new Map(prev); next.delete(assetId); return next; });
        // Also set as main character image + auto-lock character description
        const asset = assetsRef.current.find(a => a.id === assetId);
        if (asset?.category === 'character' && output) {
          const updates: Record<string, unknown> = { aiCharacterImageUrl: output };
          // Auto-lock the character description on first successful character generation
          if (!state.characterDescriptionLock && asset.description) {
            updates.characterDescriptionLock = asset.description;
          }
          update(updates as Partial<typeof state>);
        }
      } else if (data.status === 'failed') {
        update({
          productionAssets: assetsRef.current.map(a =>
            a.id === assetId ? { ...a, status: 'failed' as const } : a
          ),
        });
        setGeneratingIds(prev => { const next = new Map(prev); next.delete(assetId); return next; });
      }
    } catch { /* continue polling */ }
  }, [update]);

  useEffect(() => {
    if (generatingIds.size === 0) return;
    const interval = setInterval(() => {
      generatingIds.forEach((predId, assetId) => pollAsset(assetId, predId));
    }, 2500);
    return () => clearInterval(interval);
  }, [generatingIds, pollAsset]);

  // ─── Generate single asset ────────────────────────────────────────

  const generateAsset = async (asset: ProductionAsset) => {
    // Build story-aware prompt with vision context + cinematic style DNA
    const storyContext = {
      visionText: state.visionText,
      styleSuffix: buildVideoStyleSuffix(state),
      characterLock: buildCharacterDescriptionLock(state),
    };
    const prompt = buildAssetPrompt(asset, storyContext);

    update({
      productionAssets: assetsRef.current.map(a =>
        a.id === asset.id ? { ...a, status: 'generating' as const, imageUrl: null } : a
      ),
    });

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, imageModelId: asset.model, aspectRatio: asset.category === 'location' ? '16:9' : '1:1' }),
      });
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();

      update({
        productionAssets: assetsRef.current.map(a =>
          a.id === asset.id ? { ...a, predictionId: data.predictionId } : a
        ),
      });
      setGeneratingIds(prev => new Map(prev).set(asset.id, data.predictionId));
    } catch {
      update({
        productionAssets: assetsRef.current.map(a =>
          a.id === asset.id ? { ...a, status: 'failed' as const } : a
        ),
      });
    }
  };

  const generateAllPending = async () => {
    const pending = assetsRef.current.filter(a => a.status === 'idle' || a.status === 'failed');
    for (let i = 0; i < pending.length; i += 3) {
      const batch = pending.slice(i, i + 3);
      await Promise.all(batch.map(a => generateAsset(a)));
      if (i + 3 < pending.length) await new Promise(r => setTimeout(r, 500));
    }
  };

  // ─── Add manual asset ─────────────────────────────────────────────

  const addManualAsset = () => {
    if (!assetName.trim() || !assetDescription.trim()) return;
    const newAsset: ProductionAsset = {
      id: `asset-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      category: activeCategory,
      name: assetName,
      description: assetDescription,
      imageUrl: null,
      predictionId: null,
      status: 'idle',
      model: assetModel,
    };
    update({ productionAssets: [...state.productionAssets, newAsset] });
    setAssetName('');
    setAssetDescription('');
  };

  const removeAsset = (id: string) => {
    update({ productionAssets: state.productionAssets.filter(a => a.id !== id) });
  };

  // ─── Agent chat ───────────────────────────────────────────────────

  const sendAgentMessage = useCallback(async (userText: string) => {
    if (!userText.trim() || isStreaming) return;

    const userMsg: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content: userText.trim() };
    const updated = [...agentMessages, userMsg];
    setAgentMessages(updated);
    setAgentInput('');
    setIsStreaming(true);

    const assistantId = `assistant-${Date.now()}`;
    setAgentMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      const contextPrefix = state.visionText ? `[PROJECT: ${state.visionText}]\n` : '';
      const personaContext = state.selectedPersona ? `[AUDIENCE: Persona ${state.selectedPersona}]\n` : '';

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          messages: updated.map(m => ({
            role: m.role,
            content: m === userMsg ? contextPrefix + personaContext + m.content : m.content,
          })),
          model: llmModel,
          systemPrompt: PRODUCTION_AGENT_PROMPT,
          maxTokens: 8000,
        }),
      });

      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed');

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No body');

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            const d = line.slice(6);
            if (d === '[DONE]') break;
            try { const p = JSON.parse(d); if (p.text) { fullContent += p.text; setAgentMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: fullContent } : m)); } } catch { /* skip */ }
          }
        }
      }

      console.log(`[agent] Stream complete. Content length: ${fullContent.length} chars`);
      const assets = parseAssetSpec(fullContent);
      if (assets) {
        setAgentAssets(assets);
      } else {
        console.warn('[agent] Failed to parse assets from response. Check if output was truncated.');
      }
      const styleDna = parseStyleDna(fullContent);
      if (styleDna) setAgentStyleDna(styleDna);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setAgentMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: m.content || `Error: ${(err as Error).message}` } : m));
      }
    } finally { setIsStreaming(false); abortRef.current = null; }
  }, [agentMessages, isStreaming, llmModel, llmApiKey, state.visionText, state.selectedPersona]);

  // ─── Apply agent assets ───────────────────────────────────────────

  const applyAgentAssets = () => {
    if (!agentAssets) return;
    const newAssets: ProductionAsset[] = agentAssets.map((a, i) => ({
      id: `agent-${Date.now()}-${i}`,
      category: a.category,
      name: a.name,
      description: a.description,
      imageUrl: null,
      predictionId: null,
      status: 'idle' as const,
      model: a.model || 'flux-schnell',
    }));

    // Build update payload
    const updatePayload: Partial<typeof state> = {
      productionAssets: [...state.productionAssets, ...newAssets],
    };

    // Set character info from first character asset
    const firstChar = agentAssets.find(a => a.category === 'character');
    if (firstChar) {
      updatePayload.characterName = firstChar.name;
      updatePayload.characterGender = firstChar.gender || 'other';
      updatePayload.aiDescription = firstChar.description;
      updatePayload.characterTab = 'ai';
    }

    // Apply Style DNA if agent provided it
    if (agentStyleDna) {
      if (agentStyleDna.colorIndex !== undefined) updatePayload.colorIndex = agentStyleDna.colorIndex;
      if (agentStyleDna.lighting) updatePayload.lighting = agentStyleDna.lighting;
      if (agentStyleDna.cameraMotion) updatePayload.cameraMotion = agentStyleDna.cameraMotion;
      if (agentStyleDna.pacing) updatePayload.pacing = agentStyleDna.pacing;
      if (agentStyleDna.aspectRatio) updatePayload.aspectRatio = agentStyleDna.aspectRatio;
      if (agentStyleDna.selectedImageModel) updatePayload.selectedImageModel = agentStyleDna.selectedImageModel;
      if (agentStyleDna.selectedVideoModel) updatePayload.selectedVideoModel = agentStyleDna.selectedVideoModel;
    }

    update(updatePayload);
  };

  // Ref-based generation that works with freshly applied assets
  const generateAssets = useCallback(async (assets: ProductionAsset[]) => {
    const pending = assets.filter(a => a.status === 'idle' || a.status === 'failed');
    for (let i = 0; i < pending.length; i += 3) {
      const batch = pending.slice(i, i + 3);
      await Promise.all(batch.map(a => generateAsset(a)));
      if (i + 3 < pending.length) await new Promise(r => setTimeout(r, 500));
    }
  }, []);

  const applyAndGenerateAll = async () => {
    if (!agentAssets) return;
    setAutopilotPhase('applying');

    const newAssets: ProductionAsset[] = agentAssets.map((a, i) => ({
      id: `agent-${Date.now()}-${i}`,
      category: a.category,
      name: a.name,
      description: a.description,
      imageUrl: null,
      predictionId: null,
      status: 'idle' as const,
      model: a.model || 'flux-schnell',
    }));

    const firstChar = agentAssets.find(a => a.category === 'character');
    const allAssets = [...state.productionAssets, ...newAssets];

    // Build update payload with assets + character info + style DNA
    const updatePayload: Partial<typeof state> = {
      productionAssets: allAssets,
    };

    if (firstChar) {
      updatePayload.characterName = firstChar.name;
      updatePayload.characterGender = (firstChar.gender || 'other') as 'male' | 'female' | 'other';
      updatePayload.aiDescription = firstChar.description;
      updatePayload.characterTab = 'ai' as const;
    }

    // Apply Style DNA recommendations
    if (agentStyleDna) {
      if (agentStyleDna.colorIndex !== undefined) updatePayload.colorIndex = agentStyleDna.colorIndex;
      if (agentStyleDna.lighting) updatePayload.lighting = agentStyleDna.lighting;
      if (agentStyleDna.cameraMotion) updatePayload.cameraMotion = agentStyleDna.cameraMotion;
      if (agentStyleDna.pacing) updatePayload.pacing = agentStyleDna.pacing;
      if (agentStyleDna.aspectRatio) updatePayload.aspectRatio = agentStyleDna.aspectRatio;
      if (agentStyleDna.selectedImageModel) updatePayload.selectedImageModel = agentStyleDna.selectedImageModel;
      if (agentStyleDna.selectedVideoModel) updatePayload.selectedVideoModel = agentStyleDna.selectedVideoModel;
    }

    update(updatePayload);
    // Immediately sync ref so generation callbacks can find the new assets
    assetsRef.current = allAssets;

    // Generate assets fully sequentially: send one request, wait for image to
    // finish (poll until succeeded/failed), then move to the next asset.
    // This avoids all rate-limit and race-condition issues.
    setAutopilotPhase('generating');
    generationLoopRunning.current = true;
    for (let i = 0; i < newAssets.length; i++) {
      const a = newAssets[i];
      console.log(`[generate] Starting ${i + 1}/${newAssets.length}: ${a.name}`);

      // Mark as generating
      const generatingUpdate = assetsRef.current.map(x =>
        x.id === a.id ? { ...x, status: 'generating' as const } : x
      );
      assetsRef.current = generatingUpdate;
      update({ productionAssets: generatingUpdate });

      const prompt = buildAssetPrompt(a);
      let predictionId: string | null = null;

      // Step 1: Submit generation request (retry up to 5 times for rate limits)
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, imageModelId: a.model, aspectRatio: a.category === 'location' ? '16:9' : '1:1' }),
          });
          if (!res.ok) {
            const errBody = await res.text().catch(() => '');
            const isRateLimit = res.status === 429 || errBody.includes('429') || errBody.includes('Too Many Requests') || errBody.includes('rate limit');
            if (isRateLimit) {
              const retryMatch = errBody.match(/resets in ~(\d+)s/);
              const waitSec = retryMatch ? parseInt(retryMatch[1], 10) + 3 : 15;
              console.log(`[generate] Rate limited on ${a.name}, waiting ${waitSec}s (attempt ${attempt + 1}/5)...`);
              await new Promise(r => setTimeout(r, waitSec * 1000));
              continue;
            }
            console.error(`[generate] Failed for ${a.name} (attempt ${attempt + 1}): ${res.status} ${errBody}`);
            if (attempt < 4) { await new Promise(r => setTimeout(r, 5000)); continue; }
          } else {
            const data = await res.json();
            predictionId = data.predictionId;
            break;
          }
        } catch (err) {
          console.error(`[generate] Network error for ${a.name} (attempt ${attempt + 1}):`, err);
          if (attempt < 4) { await new Promise(r => setTimeout(r, 5000)); continue; }
        }
      }

      // If request never succeeded, mark as failed and move on
      if (!predictionId) {
        console.error(`[generate] All retries exhausted for ${a.name}, marking failed`);
        const failUpdate = assetsRef.current.map(x =>
          x.id === a.id ? { ...x, status: 'failed' as const } : x
        );
        assetsRef.current = failUpdate;
        update({ productionAssets: failUpdate });
        continue;
      }

      // Update predictionId
      const withPredId = assetsRef.current.map(x =>
        x.id === a.id ? { ...x, predictionId } : x
      );
      assetsRef.current = withPredId;
      update({ productionAssets: withPredId });

      // Step 2: Poll until this image is done (succeeded or failed)
      let done = false;
      for (let pollCount = 0; pollCount < 120; pollCount++) { // max ~5 min per asset
        await new Promise(r => setTimeout(r, 2500));
        try {
          const statusRes = await fetch(`/api/status/${predictionId}`);
          const statusData = await statusRes.json();
          if (statusData.status === 'succeeded') {
            const rawOutput = Array.isArray(statusData.output) ? statusData.output[0] : statusData.output;
            // Persist to base64 data URL so it survives Replicate CDN expiry
            let output = rawOutput;
            if (rawOutput) {
              try {
                const { persistImageUrl } = await import('@/lib/persistImage');
                output = await persistImageUrl(rawOutput);
              } catch { /* fallback to raw URL */ }
            }
            const successUpdate = assetsRef.current.map(x =>
              x.id === a.id ? { ...x, imageUrl: output || null, status: 'succeeded' as const } : x
            );
            assetsRef.current = successUpdate;
            update({ productionAssets: successUpdate });
            // Set as main character image if first character + auto-lock description
            if (a.category === 'character' && output) {
              const updates: Record<string, unknown> = { aiCharacterImageUrl: output };
              if (!state.characterDescriptionLock && a.description) {
                updates.characterDescriptionLock = a.description;
              }
              update(updates as Partial<typeof state>);
            }
            console.log(`[generate] Completed ${i + 1}/${newAssets.length}: ${a.name}`);
            done = true;
            break;
          } else if (statusData.status === 'failed' || statusData.status === 'canceled') {
            console.error(`[generate] Prediction failed for ${a.name}: ${statusData.status}`);
            const failUpdate = assetsRef.current.map(x =>
              x.id === a.id ? { ...x, status: 'failed' as const } : x
            );
            assetsRef.current = failUpdate;
            update({ productionAssets: failUpdate });
            done = true;
            break;
          }
          // else still processing, keep polling
        } catch { /* network blip, keep polling */ }
      }
      if (!done) {
        // Timed out waiting for this asset
        console.error(`[generate] Polling timed out for ${a.name}`);
        const failUpdate = assetsRef.current.map(x =>
          x.id === a.id ? { ...x, status: 'failed' as const } : x
        );
        assetsRef.current = failUpdate;
        update({ productionAssets: failUpdate });
      }
    }
    generationLoopRunning.current = false;
  };

  // ─── Autopilot: fully autonomous end-to-end ───────────────────────

  const runAutopilot = useCallback(async () => {
    setAutopilotPhase('designing');

    const briefParts: string[] = [];
    if (state.visionText) briefParts.push(`Project concept: ${state.visionText}`);
    if (state.selectedPersona) briefParts.push(`Target audience persona: ${state.selectedPersona}`);
    if (state.customPersonaTitle) briefParts.push(`Custom persona: ${state.customPersonaTitle} — ${state.customPersonaDescription}`);
    if (state.lighting) briefParts.push(`Lighting style: ${state.lighting}`);
    if (state.cameraMotion) briefParts.push(`Camera: ${state.cameraMotion}`);
    if (state.pacing) briefParts.push(`Pacing: ${state.pacing}`);

    const autoMessage = briefParts.length > 0
      ? `Design the complete production package for this project.\n\n${briefParts.join('\n')}\n\nInclude all characters, locations, wardrobe, props, vehicles, and accessories needed. Output the full asset list immediately.`
      : 'Design a complete production package for a cinematic short film. Include diverse characters, multiple locations, wardrobe, props, and all assets needed for a professional production. Output everything immediately.';

    await sendAgentMessage(autoMessage);
  }, [state.visionText, state.selectedPersona, state.customPersonaTitle, state.customPersonaDescription, state.lighting, state.cameraMotion, state.pacing, sendAgentMessage]);

  // Show review banner when agent finishes designing
  useEffect(() => {
    if (autopilotPhase === 'designing' && agentAssets && agentAssets.length > 0 && !isStreaming) {
      const timer = setTimeout(() => setAutopilotPhase('review'), 800);
      return () => clearTimeout(timer);
    }
  }, [agentAssets, isStreaming, autopilotPhase]);

  // Stable derived values for generation completion detection
  const hasCompletedAssets = state.productionAssets.some(a => a.status === 'succeeded' || a.status === 'failed');
  const hasGeneratingAssets = state.productionAssets.some(a => a.status === 'generating');

  // Auto-detect generation completion — the sequential loop handles its own polling,
  // so we just check that the loop has finished and no assets are still generating.
  useEffect(() => {
    if (autopilotPhase === 'generating' && !generationLoopRunning.current && hasCompletedAssets && !hasGeneratingAssets) {
      setAutopilotPhase('done');
      setShowContinueBanner(true);
    }
  }, [autopilotPhase, hasCompletedAssets, hasGeneratingAssets]);

  // Auto-start agent if we have project context and no assets yet
  useEffect(() => {
    if (autoStarted.current) return;
    if (mode !== 'agent') return;
    if (agentMessages.length > 0) return;
    if (state.productionAssets.length > 0) return;
    if (!state.visionText) return;
    if (!llmApiKey && !llmModel) return; // no key configured

    autoStarted.current = true;
    setAutopilotPhase('designing');
    // Auto-send project context to agent — autopilotPhase triggers applyAndGenerateAll when assets arrive
    const autoMsg = `Here's my project — design the full production package:\n\n${state.visionText}${state.selectedPersona ? `\n\nTarget audience: Persona ${state.selectedPersona}` : ''}${state.customPersonaTitle ? `\nCustom persona: ${state.customPersonaTitle}` : ''}`;
    setTimeout(() => sendAgentMessage(autoMsg), 500);
  }, [mode, agentMessages.length, state.productionAssets.length, state.visionText, state.selectedPersona, state.customPersonaTitle, llmApiKey, llmModel, sendAgentMessage]);

  // ─── LoRA Training ────────────────────────────────────────────────

  const handleTrain = async () => {
    if (uploadedFiles.length < 3) { setAlertMsg({ title: 'Not Enough', message: '3+ images required (5+ recommended)' }); setShowAlert(true); return; }
    await startTraining(uploadedFiles, { steps: trainingSteps, learningRate: trainingLR, resolution: trainingResolution });
  };

  const handleVideoLoraUnlock = () => {
    // Client-side check — the actual password gate is on the API
    if (videoLoraPassword.length >= 4) {
      setVideoLoraUnlocked(true);
      setVideoLoraError(null);
    } else {
      setVideoLoraError('Password too short');
    }
  };

  const handleVideoTrain = async () => {
    if (videoTrainingFiles.length < 3) { setAlertMsg({ title: 'Not Enough', message: '3+ video clips required' }); setShowAlert(true); return; }
    await videoTraining.startTraining(videoTrainingFiles, {
      targetModel: videoTrainingTarget,
      password: videoLoraPassword,
      steps: 2000,
      learningRate: 0.0001,
    });
  };

  // ─── Derived state ────────────────────────────────────────────────

  const categoryAssets = state.productionAssets.filter(a => a.category === activeCategory);
  const totalAssets = state.productionAssets.length;
  const completedAssets = state.productionAssets.filter(a => a.status === 'succeeded').length;
  const generatingAssets = state.productionAssets.filter(a => a.status === 'generating').length;
  const selectedModelDef = AI_MODELS.find(m => m.id === assetModel) ?? AI_MODELS[0];

  const providerName = OPENROUTER_MODEL_NAMES[llmModel] || llmModel.split('/').pop() || 'OpenRouter';

  // Prevent hydration mismatch — server has no localStorage state
  if (!mounted) {
    return (
      <main className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-headline font-light tracking-[-0.03em]">Production Assets</h2>
            <p className="text-on-surface-variant text-sm mt-1">Characters, locations, wardrobe, props — everything your scenes need</p>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex gap-2 p-1 bg-surface-container-high rounded-xl border border-outline-variant">
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-br from-primary to-primary-container text-on-surface shadow-lg">
              <span className="material-symbols-outlined text-[18px]">smart_toy</span>AI Agent
            </div>
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">tune</span>Manual
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-24">
          <span className="material-symbols-outlined text-primary text-3xl animate-spin">progress_activity</span>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-headline font-light tracking-[-0.03em]">Production Assets</h2>
          <p className="text-on-surface-variant text-sm mt-1">Characters, locations, wardrobe, props — everything your scenes need</p>
        </div>
        <div className="flex items-center gap-3">
          {totalAssets > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-high border border-outline-variant">
              <span className="text-xs text-on-surface-variant">{completedAssets}/{totalAssets} generated</span>
              {generatingAssets > 0 && <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />}
            </div>
          )}
          {loraUrl && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-high border border-green-500/40">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-xs text-green-400">LoRA</span>
            </div>
          )}
        </div>
      </div>

      {/* Mode Toggle + Autopilot */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-2 p-1 bg-surface-container-high rounded-xl border border-outline-variant">
          <button onClick={() => setMode('agent')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'agent' ? 'bg-gradient-to-br from-primary to-primary-container text-on-surface shadow-lg' : 'text-on-surface-variant hover:text-on-surface'}`}>
            <span className="material-symbols-outlined text-[18px]">smart_toy</span>AI Agent
          </button>
          <button onClick={() => setMode('manual')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'manual' ? 'bg-gradient-to-br from-primary to-primary-container text-on-surface shadow-lg' : 'text-on-surface-variant hover:text-on-surface'}`}>
            <span className="material-symbols-outlined text-[18px]">tune</span>Manual
          </button>
        </div>

        {mode === 'agent' && state.visionText && autopilotPhase === 'idle' && agentMessages.length === 0 && state.productionAssets.length === 0 && (
          <button
            onClick={runAutopilot}
            disabled={isStreaming}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-surface font-headline font-bold text-sm hover:scale-105 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/20 animate-pulse hover:animate-none"
          >
            <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
            Autopilot
          </button>
        )}

        {autopilotPhase === 'done' && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-400 font-medium">{completedAssets} assets ready</span>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* AGENT MODE                                                     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {mode === 'agent' && (
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Chat Panel */}
          <div className="lg:col-span-3 flex flex-col glass-card rounded-2xl overflow-hidden" style={{ height: 'calc(100vh - 340px)', minHeight: 500 }}>
            <div className="px-5 py-3 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-high/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-surface text-[16px]">movie_filter</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">Production Designer</p>
                  <p className="text-[10px] text-on-surface-variant/60">Powered by {providerName}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 custom-scrollbar">
              {agentMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center gap-6 px-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary-container/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-3xl">movie_filter</span>
                  </div>
                  <div>
                    <p className="text-on-surface font-headline font-light tracking-[-0.03em] text-lg">Production Designer Agent</p>
                    <p className="text-on-surface-variant/60 text-sm mt-1 max-w-sm">
                      {state.visionText
                        ? 'Your project concept is loaded. Hit Autopilot to design & generate everything automatically.'
                        : 'Describe your project and I\'ll design characters, sets, wardrobe, props — the full production package.'}
                    </p>
                  </div>

                  {/* Autopilot CTA */}
                  {state.visionText && (
                    <button
                      onClick={runAutopilot}
                      disabled={isStreaming || autopilotPhase !== 'idle'}
                      className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-on-surface font-headline font-bold text-base hover:scale-105 transition-all active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-primary/20"
                    >
                      <span className="material-symbols-outlined text-[22px]">rocket_launch</span>
                      Autopilot — Design & Generate Everything
                    </button>
                  )}

                  <div className="flex flex-wrap gap-2 justify-center max-w-md">
                    {[
                      'Design the full production for my project',
                      'I need a noir detective story cast & sets',
                      'Create assets for a luxury product launch',
                      'Sci-fi setting with futuristic props',
                    ].map((chip) => (
                      <button key={chip} onClick={() => sendAgentMessage(chip)} className="px-3 py-1.5 rounded-full border border-outline-variant/30 text-xs text-on-surface-variant hover:text-on-surface hover:border-primary/40 transition">{chip}</button>
                    ))}
                  </div>
                </div>
              )}

              {agentMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-primary/20 text-on-surface' : 'bg-surface-container text-on-surface-variant border border-outline-variant/10'}`}>
                    <div className="whitespace-pre-wrap">{msg.role === 'assistant' ? stripAssetBlock(msg.content) : msg.content}</div>
                  </div>
                </div>
              ))}

              {isStreaming && (
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="px-4 py-3 border-t border-outline-variant/20 bg-surface-container-low">
              <div className="flex gap-2">
                <textarea
                  value={agentInput}
                  onChange={(e) => setAgentInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAgentMessage(agentInput); } }}
                  placeholder="Describe what you need..."
                  rows={1}
                  className="flex-1 bg-surface border border-outline-variant/20 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/40 resize-none"
                />
                <button onClick={() => sendAgentMessage(agentInput)} disabled={isStreaming || !agentInput.trim()} className="px-4 rounded-xl bg-primary text-on-primary font-bold text-sm disabled:opacity-40 transition hover:opacity-90">
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: Asset Preview */}
          <div className="lg:col-span-2 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 340px)' }}>
            {/* Autopilot Status Bar */}
            {autopilotPhase !== 'idle' && (
              <div className={`rounded-xl p-4 border flex items-center gap-3 ${
                autopilotPhase === 'done'
                  ? 'bg-green-500/10 border-green-500/30'
                  : autopilotPhase === 'review'
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-primary/10 border-primary/30'
              }`}>
                {autopilotPhase === 'done' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                ) : autopilotPhase === 'review' ? (
                  <span className="material-symbols-outlined text-amber-400 text-[20px]">rate_review</span>
                ) : (
                  <span className="material-symbols-outlined text-primary animate-spin text-[20px]">progress_activity</span>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-on-surface">
                    {autopilotPhase === 'designing' && 'Agent is designing production assets...'}
                    {autopilotPhase === 'review' && 'Review the production package below, then execute to generate.'}
                    {autopilotPhase === 'applying' && 'Applying production package...'}
                    {autopilotPhase === 'generating' && `Generating ${generatingIds.size} asset${generatingIds.size !== 1 ? 's' : ''}...`}
                    {autopilotPhase === 'done' && 'Production assets complete!'}
                  </p>
                  {autopilotPhase === 'generating' && totalAssets > 0 && (
                    <div className="mt-2 w-full bg-surface-bright rounded-full h-1.5 overflow-hidden">
                      <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${Math.round((completedAssets / totalAssets) * 100)}%` }} />
                    </div>
                  )}
                </div>
                {autopilotPhase === 'review' && (
                  <button
                    onClick={() => applyAndGenerateAll()}
                    className="px-5 py-2 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-headline font-bold text-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shrink-0 cinematic-glow"
                  >
                    <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                    Execute
                  </button>
                )}
              </div>
            )}

            {agentAssets ? (
              <>
                <div className="bg-surface-container-high rounded-2xl border border-primary/30 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-headline font-light tracking-[-0.03em] text-on-surface">Production Package</h3>
                    <span className="text-xs text-on-surface-variant/60">{agentAssets.length} assets</span>
                  </div>

                  {ASSET_CATEGORIES.map(cat => {
                    const catAssets = agentAssets.filter(a => a.category === cat.id);
                    if (catAssets.length === 0) return null;
                    return (
                      <div key={cat.id} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-[14px]">{cat.icon}</span>
                          <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/60">{cat.label}</span>
                        </div>
                        {catAssets.map((a, i) => (
                          <div key={i} className="p-3 rounded-lg bg-surface-container border border-outline-variant">
                            <p className="text-sm font-medium text-on-surface">{a.name}</p>
                            <p className="text-[10px] text-on-surface-variant/60 mt-1 line-clamp-2">{a.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[9px] text-on-surface-variant/40">{AI_MODELS.find(m => m.id === a.model)?.name || a.model}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>

                {/* Style DNA Preview */}
                {agentStyleDna && (
                  <div className="bg-surface-container-high rounded-2xl border border-processing/30 p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-processing text-[16px]">palette</span>
                      <h3 className="font-headline font-light tracking-[-0.03em] text-on-surface text-sm">Style DNA -- Auto-configured</h3>
                    </div>
                    <p className="text-[10px] text-on-surface-variant/60">These settings will be pre-filled on the Style DNA page.</p>
                    <div className="grid grid-cols-2 gap-2">
                      {agentStyleDna.colorIndex !== undefined && (
                        <div className="p-2 rounded-lg bg-surface-container border border-outline-variant">
                          <span className="text-[9px] text-on-surface-variant/60 uppercase tracking-wider">Color</span>
                          <p className="text-xs text-on-surface mt-0.5">{['Action Orange', 'Electric Blue', 'Cyber Purple', 'Neon Pink', 'Matrix Green'][agentStyleDna.colorIndex] || 'Custom'}</p>
                        </div>
                      )}
                      {agentStyleDna.lighting && (
                        <div className="p-2 rounded-lg bg-surface-container border border-outline-variant">
                          <span className="text-[9px] text-on-surface-variant/60 uppercase tracking-wider">Lighting</span>
                          <p className="text-xs text-on-surface mt-0.5 capitalize">{agentStyleDna.lighting}</p>
                        </div>
                      )}
                      {agentStyleDna.cameraMotion && (
                        <div className="p-2 rounded-lg bg-surface-container border border-outline-variant">
                          <span className="text-[9px] text-on-surface-variant/60 uppercase tracking-wider">Camera</span>
                          <p className="text-xs text-on-surface mt-0.5">{agentStyleDna.cameraMotion}</p>
                        </div>
                      )}
                      {agentStyleDna.pacing && (
                        <div className="p-2 rounded-lg bg-surface-container border border-outline-variant">
                          <span className="text-[9px] text-on-surface-variant/60 uppercase tracking-wider">Pacing</span>
                          <p className="text-xs text-on-surface mt-0.5 capitalize">{agentStyleDna.pacing}</p>
                        </div>
                      )}
                      {agentStyleDna.aspectRatio && (
                        <div className="p-2 rounded-lg bg-surface-container border border-outline-variant">
                          <span className="text-[9px] text-on-surface-variant/60 uppercase tracking-wider">Aspect</span>
                          <p className="text-xs text-on-surface mt-0.5">{agentStyleDna.aspectRatio}</p>
                        </div>
                      )}
                      {agentStyleDna.selectedVideoModel && (
                        <div className="p-2 rounded-lg bg-surface-container border border-outline-variant">
                          <span className="text-[9px] text-on-surface-variant/60 uppercase tracking-wider">Video Model</span>
                          <p className="text-xs text-on-surface mt-0.5">{agentStyleDna.selectedVideoModel}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <button onClick={applyAndGenerateAll} disabled={generatingAssets > 0} className="w-full py-4 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-surface font-headline font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3">
                  {generatingAssets > 0 ? (<><span className="material-symbols-outlined animate-spin">progress_activity</span>Generating {generatingAssets} assets...</>) : (<><span className="material-symbols-outlined">auto_awesome</span>Execute — Generate All Assets</>)}
                </button>

                <button onClick={() => { applyAgentAssets(); setMode('manual'); }} className="w-full py-3 rounded-xl border border-outline-variant text-on-surface-variant text-sm hover:text-on-surface hover:border-primary/30 transition flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">edit</span>Review in Manual Mode
                </button>
              </>
            ) : (
              <div className="bg-surface-container-high rounded-2xl border border-outline-variant p-6 flex flex-col items-center justify-center text-center gap-4 min-h-[300px]">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant/40">movie_filter</span>
                <div>
                  <p className="text-on-surface font-headline font-bold">
                    {autopilotPhase === 'designing' ? 'Designing...' : 'Agent Ready'}
                  </p>
                  <p className="text-xs text-on-surface-variant/60 mt-1">
                    {autopilotPhase === 'designing'
                      ? 'The Production Designer is creating your full asset package. Characters, locations, wardrobe, props — all being designed now.'
                      : 'The Production Designer will create characters, locations, wardrobe, props — everything your project needs for visual consistency.'}
                  </p>
                </div>
                {autopilotPhase !== 'idle' && autopilotPhase !== 'done' && (
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}

                {/* What it generates */}
                <div className="w-full grid grid-cols-3 gap-2 mt-2">
                  {ASSET_CATEGORIES.slice(0, 6).map(cat => (
                    <div key={cat.id} className="flex flex-col items-center gap-1 py-2 rounded-lg bg-surface-container border border-outline-variant">
                      <span className="material-symbols-outlined text-[16px] text-on-surface-variant/60">{cat.icon}</span>
                      <span className="text-[9px] text-on-surface-variant/60">{cat.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Already generated assets */}
            {completedAssets > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/60">Generated Assets</span>
                <div className="grid grid-cols-3 gap-2">
                  {state.productionAssets.filter(a => a.imageUrl).map(a => (
                    <div key={a.id} className="relative aspect-square rounded-lg overflow-hidden border border-outline-variant">
                      <img src={a.imageUrl!} alt={a.name} className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1.5 py-0.5">
                        <span className="text-[8px] text-on-surface">{a.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MANUAL MODE                                                    */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {mode === 'manual' && (
        <div className="space-y-6">
          {/* Category Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {ASSET_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                  activeCategory === cat.id
                    ? 'bg-primary/15 text-primary border border-primary/30'
                    : 'text-on-surface-variant hover:text-on-surface border border-transparent hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{cat.icon}</span>
                {cat.label}
                {state.productionAssets.filter(a => a.category === cat.id).length > 0 && (
                  <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">{state.productionAssets.filter(a => a.category === cat.id).length}</span>
                )}
              </button>
            ))}
          </div>

          {/* LoRA Training (only for Characters) */}
          {activeCategory === 'character' && (
            <div className="bg-surface-container-high rounded-xl border border-outline-variant p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">model_training</span>
                  <h3 className="font-semibold text-on-surface">LoRA Training (Real Person)</h3>
                </div>
                {loraUrl && <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle2 className="w-3 h-3" />Trained</span>}
              </div>

              {!loraUrl && !isTraining && (
                <>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => {
                        if (e.target.files) { const f = Array.from(e.target.files); setUploadedImages(p => [...p, ...f.map(x => URL.createObjectURL(x))]); setUploadedFiles(p => [...p, ...f]); }
                      }} />
                      <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 border-2 border-dashed border-outline-variant rounded-lg text-sm text-on-surface-variant hover:border-primary/40 transition">
                        Upload {uploadedFiles.length > 0 ? `(${uploadedFiles.length} images)` : 'Photos'}
                      </button>
                    </div>
                    <div className="space-y-2">
                      <input type="text" value={state.triggerWord} onChange={(e) => update({ triggerWord: e.target.value })} placeholder="Trigger word" className="px-3 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm text-on-surface font-mono w-40 focus:border-primary outline-none" />
                    </div>
                    <button onClick={handleTrain} disabled={isUploading || uploadedFiles.length < 3} className="px-6 py-2 rounded-lg bg-gradient-to-br from-primary to-primary-container text-on-surface text-sm font-medium disabled:opacity-40 transition">
                      {isUploading ? 'Uploading...' : 'Train'}
                    </button>
                  </div>

                  {/* Advanced Training Config */}
                  <details className="group">
                    <summary className="text-xs text-on-surface-variant/60 cursor-pointer hover:text-on-surface-variant transition flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] group-open:rotate-90 transition-transform">chevron_right</span>
                      Advanced Settings
                    </summary>
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-on-surface-variant/60 uppercase tracking-wider">Steps</label>
                        <input type="number" value={trainingSteps} onChange={(e) => setTrainingSteps(Math.max(100, Math.min(10000, parseInt(e.target.value) || 1000)))} min={100} max={10000} step={100} className="w-full px-3 py-1.5 bg-surface-container border border-outline-variant rounded-lg text-sm text-on-surface font-mono focus:border-primary outline-none" />
                        <p className="text-[9px] text-on-surface-variant/40">1000 default. More = better but slower</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-on-surface-variant/60 uppercase tracking-wider">Learning Rate</label>
                        <input type="number" value={trainingLR} onChange={(e) => setTrainingLR(Math.max(0.0001, Math.min(0.01, parseFloat(e.target.value) || 0.0004)))} min={0.0001} max={0.01} step={0.0001} className="w-full px-3 py-1.5 bg-surface-container border border-outline-variant rounded-lg text-sm text-on-surface font-mono focus:border-primary outline-none" />
                        <p className="text-[9px] text-on-surface-variant/40">0.0004 default. Lower = stable</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-on-surface-variant/60 uppercase tracking-wider">Resolution</label>
                        <select value={trainingResolution} onChange={(e) => setTrainingResolution(parseInt(e.target.value))} className="w-full px-3 py-1.5 bg-surface-container border border-outline-variant rounded-lg text-sm text-on-surface focus:border-primary outline-none">
                          <option value={512}>512px ($)</option>
                          <option value={768}>768px ($$)</option>
                          <option value={1024}>1024px ($$$)</option>
                        </select>
                        <p className="text-[9px] text-on-surface-variant/40">Higher = sharper, costs more</p>
                      </div>
                    </div>
                  </details>
                </>
              )}

              {isTraining && (
                <div className="space-y-2">
                  <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden"><div className="bg-primary h-full rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
                  <span className="text-xs text-primary">{progress}%</span>
                </div>
              )}

              {loraUrl && <p className="text-xs text-on-surface-variant">Trigger: <code className="text-primary font-mono">{state.triggerWord}</code></p>}

              {uploadedImages.length > 0 && !loraUrl && (
                <div className="flex gap-2 overflow-x-auto">
                  {uploadedImages.map((src, i) => (
                    <img key={i} src={src} alt={`Ref ${i}`} className="w-14 h-14 rounded-lg object-cover border border-outline-variant shrink-0" />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Video LoRA Training (password-locked) */}
          {activeCategory === 'character' && (
            <div className="bg-surface-container-high rounded-xl border border-outline-variant p-5 space-y-4 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary">movie</span>
                  <h3 className="font-semibold text-on-surface">Video LoRA Training</h3>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-processing/20 text-processing-dim font-medium uppercase">Experimental</span>
                </div>
                {state.videoLoraUrl && <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle2 className="w-3 h-3" />Trained</span>}
              </div>

              {!videoLoraUnlocked && (
                <div className="space-y-3">
                  <p className="text-xs text-on-surface-variant/60">Train CogVideoX-5B or Hunyuan Video with your character for consistent video generation. Requires authorization.</p>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={videoLoraPassword}
                      onChange={(e) => setVideoLoraPassword(e.target.value)}
                      placeholder="Enter password"
                      className="flex-1 px-3 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm text-on-surface font-mono focus:border-tertiary outline-none"
                      onKeyDown={(e) => { if (e.key === 'Enter') handleVideoLoraUnlock(); }}
                    />
                    <button onClick={handleVideoLoraUnlock} className="px-4 py-2 rounded-lg bg-tertiary/10 border border-tertiary/30 text-tertiary text-sm font-medium hover:bg-tertiary/20 transition">
                      <span className="material-symbols-outlined text-[16px]">lock_open</span>
                    </button>
                  </div>
                  {videoLoraError && <p className="text-[10px] text-error">{videoLoraError}</p>}
                </div>
              )}

              {videoLoraUnlocked && !videoTraining.isTraining && !state.videoLoraUrl && (
                <>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <input ref={videoFileInputRef} type="file" multiple accept="video/*" className="hidden" onChange={(e) => {
                        if (e.target.files) setVideoTrainingFiles(Array.from(e.target.files));
                      }} />
                      <button onClick={() => videoFileInputRef.current?.click()} className="w-full py-3 border-2 border-dashed border-outline-variant rounded-lg text-sm text-on-surface-variant hover:border-tertiary/40 transition">
                        Upload {videoTrainingFiles.length > 0 ? `(${videoTrainingFiles.length} videos)` : 'Video Clips'}
                      </button>
                    </div>
                    <select value={videoTrainingTarget} onChange={(e) => setVideoTrainingTarget(e.target.value as 'cogvideox-5b' | 'hunyuan-video')} className="px-3 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm text-on-surface focus:border-tertiary outline-none">
                      <option value="cogvideox-5b">CogVideoX-5B (~$0.32/vid)</option>
                      <option value="hunyuan-video">Hunyuan Video (~$1.27/vid)</option>
                    </select>
                    <button onClick={handleVideoTrain} disabled={videoTraining.isUploading || videoTrainingFiles.length < 3} className="px-6 py-2 rounded-lg bg-gradient-to-br from-tertiary to-tertiary-dim text-black text-sm font-medium disabled:opacity-40 transition">
                      {videoTraining.isUploading ? 'Uploading...' : 'Train'}
                    </button>
                  </div>
                  <p className="text-[10px] text-on-surface-variant/40">Upload 3-25 video clips (5-15s each) of your character. Training costs ~$11-71 depending on model and duration.</p>
                </>
              )}

              {videoTraining.isTraining && (
                <div className="space-y-2">
                  <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden"><div className="bg-tertiary h-full rounded-full transition-all" style={{ width: `${videoTraining.progress}%` }} /></div>
                  <span className="text-xs text-tertiary">{videoTraining.progress}% — Video LoRA training (this may take 2-13 hours)</span>
                </div>
              )}

              {state.videoLoraUrl && <p className="text-xs text-on-surface-variant">Video LoRA ready. Select CogVideoX-5B or Hunyuan as your video model to use it.</p>}
            </div>
          )}

          {/* Add New Asset Form */}
          <div className="bg-surface-container-high rounded-xl border border-outline-variant p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">{ASSET_CATEGORIES.find(c => c.id === activeCategory)?.icon}</span>
              <h3 className="font-semibold text-on-surface">Add {ASSET_CATEGORIES.find(c => c.id === activeCategory)?.label.slice(0, -1)}</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-on-surface-variant">Name</label>
                <input type="text" value={assetName} onChange={(e) => setAssetName(e.target.value)} placeholder={`e.g. ${activeCategory === 'character' ? 'Detective Noir' : activeCategory === 'location' ? 'Rain-Soaked Alley' : 'Item Name'}`} className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-lg text-on-surface placeholder-gray-500 focus:border-primary outline-none transition text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-on-surface-variant">Model</label>
                <div className="relative">
                  <button onClick={() => setShowModelPicker(!showModelPicker)} className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-lg text-on-surface text-sm text-left flex items-center justify-between">
                    <span>{selectedModelDef.name}</span>
                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant/60">expand_more</span>
                  </button>
                  {showModelPicker && (
                    <div className="absolute top-full mt-1 left-0 right-0 bg-surface-container-high border border-outline-variant rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                      {AI_MODELS.map(m => (
                        <button key={m.id} onClick={() => { setAssetModel(m.id); setShowModelPicker(false); }} className={`w-full px-4 py-2 text-left text-sm hover:bg-surface-container transition ${assetModel === m.id ? 'text-primary' : 'text-on-surface-variant'}`}>
                          {m.name} <span className="text-[10px] text-on-surface-variant/40">({m.speed})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-on-surface-variant">Description (detailed for AI generation)</label>
              <textarea
                value={assetDescription}
                onChange={(e) => setAssetDescription(e.target.value)}
                placeholder={ASSET_CATEGORIES.find(c => c.id === activeCategory)?.placeholder}
                className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-lg text-on-surface placeholder-gray-500 focus:border-primary outline-none transition resize-none h-24 text-sm"
              />
            </div>

            <button onClick={addManualAsset} disabled={!assetName.trim() || !assetDescription.trim()} className="px-6 py-2.5 rounded-lg bg-gradient-to-br from-primary to-primary-container text-on-surface text-sm font-medium disabled:opacity-40 transition flex items-center gap-2">
              <Plus className="w-4 h-4" />Add {ASSET_CATEGORIES.find(c => c.id === activeCategory)?.label.slice(0, -1)}
            </button>
          </div>

          {/* Asset Grid */}
          {categoryAssets.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-on-surface">{ASSET_CATEGORIES.find(c => c.id === activeCategory)?.label} ({categoryAssets.length})</h3>
                <button onClick={generateAllPending} disabled={generatingAssets > 0 || categoryAssets.every(a => a.status === 'succeeded')} className="text-xs text-primary hover:text-primary/80 transition disabled:opacity-40">
                  Generate All Pending
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {categoryAssets.map(asset => (
                  <div key={asset.id} className="bg-surface-container-high rounded-xl border border-outline-variant overflow-hidden group">
                    {/* Preview */}
                    <div className="aspect-square relative bg-surface-container">
                      {asset.imageUrl ? (
                        <>
                          <img src={asset.imageUrl} alt={asset.name} className="w-full h-full object-cover" />
                          <button onClick={() => generateAsset(asset)} className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <span className="material-symbols-outlined text-on-surface">refresh</span>
                          </button>
                        </>
                      ) : asset.status === 'generating' ? (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                          <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                          <span className="text-[10px] text-on-surface-variant/60">Generating...</span>
                        </div>
                      ) : asset.status === 'failed' ? (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3">
                          <AlertCircle className="w-5 h-5 text-red-400" />
                          <button onClick={() => generateAsset(asset)} className="text-[10px] text-primary hover:underline">Retry</button>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <button onClick={() => generateAsset(asset)} className="flex flex-col items-center gap-2 text-on-surface-variant/60 hover:text-primary transition">
                            <span className="material-symbols-outlined text-3xl">auto_awesome</span>
                            <span className="text-[10px]">Generate</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-on-surface truncate">{asset.name}</p>
                        <button onClick={() => removeAsset(asset.id)} className="opacity-0 group-hover:opacity-100 transition"><Trash2 className="w-3 h-3 text-on-surface-variant/40 hover:text-red-400" /></button>
                      </div>
                      <p className="text-[10px] text-on-surface-variant/60 line-clamp-2">{asset.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {categoryAssets.length === 0 && (
            <div className="text-center py-12 text-on-surface-variant/60">
              <span className="material-symbols-outlined text-4xl mb-2">{ASSET_CATEGORIES.find(c => c.id === activeCategory)?.icon}</span>
              <p className="text-sm">No {ASSET_CATEGORIES.find(c => c.id === activeCategory)?.label.toLowerCase()} yet</p>
              <p className="text-xs text-on-surface-variant/40 mt-1">Add one above or use the AI Agent to generate everything</p>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center gap-4 pt-8 border-t border-outline-variant">
        <Link href="/create/brief" className="px-8 py-3 rounded-xl bg-surface-container-highest text-on-surface font-headline font-bold transition-all hover:scale-105 active:scale-95">Back</Link>
        <Link href="/create/style-dna" className="px-10 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-headline font-black transition-all hover:scale-105 active:scale-95">CONTINUE</Link>
      </div>

      <AlertModal open={showAlert} onClose={() => setShowAlert(false)} title={alertMsg.title} message={alertMsg.message} />

      {/* Continue Banner */}
      {showContinueBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
          <div className="max-w-4xl mx-auto px-6 pb-6">
            <div className="bg-surface-container-low/95 backdrop-blur-xl border border-primary/30 rounded-2xl p-5 shadow-2xl shadow-primary/10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-on-surface text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <div>
                  <p className="text-sm font-headline font-bold text-on-surface">Production package ready</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {completedAssets > 0
                      ? `${completedAssets} asset${completedAssets !== 1 ? 's' : ''} generated`
                      : generatingIds.size > 0
                        ? `Generating ${generatingIds.size} asset${generatingIds.size !== 1 ? 's' : ''} in background...`
                        : `${agentAssets?.length || 0} assets queued`
                    }
                    {' \u2014 you can continue while they finish'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setShowContinueBanner(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => router.push('/create/style-dna')}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-headline font-black text-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cinematic-glow"
                >
                  Continue
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// ─── Prompt Builders ────────────────────────────────────────────────

function buildAssetPrompt(asset: ProductionAsset, storyContext?: { visionText?: string; styleSuffix?: string; characterLock?: string }): string {
  const categoryPrefix: Record<AssetCategory, string> = {
    character: 'cinematic character portrait, photorealistic, 8k, studio lighting, shallow depth of field',
    location: 'cinematic establishing shot, photorealistic, 8k, wide angle, atmospheric, volumetric lighting',
    wardrobe: 'fashion photography, clothing on invisible mannequin, studio shot, 8k, detailed fabric texture',
    prop: 'product photography, cinematic still life, 8k, dramatic lighting, detailed texture',
    vehicle: 'automotive photography, cinematic, 8k, dramatic lighting, reflective surfaces',
    accessory: 'macro product photography, cinematic, 8k, detailed craftsmanship, studio lighting',
  };

  const parts: string[] = [categoryPrefix[asset.category]];

  // Story context — so the asset is designed for the story, not in isolation
  if (storyContext?.visionText) {
    parts.push(`for a film about: ${storyContext.visionText.slice(0, 200)}`);
  }

  // Asset description
  parts.push(asset.description);

  // For non-character assets, reference the character for consistency
  if (asset.category !== 'character' && storyContext?.characterLock) {
    parts.push(`consistent with character: ${storyContext.characterLock.slice(0, 100)}`);
  }

  // Cinematic style DNA — same visual language as scenes/videos
  if (storyContext?.styleSuffix) {
    parts.push(storyContext.styleSuffix);
  } else {
    parts.push('shot on 35mm film, subtle film grain, professional color grading, cinematic color science');
  }

  return parts.join(', ');
}
