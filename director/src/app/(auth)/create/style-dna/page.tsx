'use client';
import { CachedImg } from '@/components/ui/CachedImg';

import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { useWizard } from '@/context/WizardContext';
import type { ProductionAsset, AssetCategory } from '@/context/WizardContext';
import { IMAGE_MODELS, VIDEO_MODELS } from '@/lib/models';

// ─── Cinematic language mappings ────────────────────────────────────

const COLOR_PALETTES = [
  { name: 'Action Orange', value: '#ff9064', accent: '#ff6b35', bg: 'from-orange-500/20 to-amber-500/10', tokens: 'Warm amber and burnt orange grading, golden hour tones' },
  { name: 'Electric Blue', value: '#00e0ff', accent: '#0099cc', bg: 'from-cyan-500/20 to-blue-500/10', tokens: 'Cool cyan and electric blue grading, moonlit tones' },
  { name: 'Cyber Purple', value: '#8b5cf6', accent: '#6d28d9', bg: 'from-violet-500/20 to-purple-500/10', tokens: 'Deep violet and ultraviolet grading, neon accents' },
  { name: 'Neon Pink', value: '#ec4899', accent: '#db2777', bg: 'from-pink-500/20 to-rose-500/10', tokens: 'Hot magenta and fuchsia grading, sunset haze' },
  { name: 'Matrix Green', value: '#10b981', accent: '#059669', bg: 'from-emerald-500/20 to-green-500/10', tokens: 'Emerald and jade grading, bioluminescent tones' },
];

const LIGHTING_OPTIONS = [
  { id: 'warm' as const, label: 'Warm', icon: 'light_mode', iconColor: 'text-orange-400', tokens: 'Soft diffused key light, warm practicals, golden bounce fill' },
  { id: 'cool' as const, label: 'Cool', icon: 'ac_unit', iconColor: 'text-cyan-400', tokens: 'Blue steel key, cool fluorescent fill, tungsten edge' },
  { id: 'high-contrast' as const, label: 'High Contrast', icon: 'exposure', iconColor: 'text-on-surface', tokens: 'Hard chiaroscuro lighting, deep shadows, single-source key' },
  { id: 'mood' as const, label: 'Mood', icon: 'wb_twilight', iconColor: 'text-purple-400', tokens: 'Available light, neon spill, motivated sources, atmospheric haze' },
];

const CAMERA_OPTIONS = [
  { id: 'Handheld Cinematic', icon: 'pan_tool', tokens: 'Handheld camera, slight motion blur, 35mm lens, documentary intimacy' },
  { id: 'Dolly Smooth', icon: 'switch_video', tokens: 'Smooth dolly track, Steadicam precision, 50mm lens, shallow DOF' },
  { id: 'Drone Sweep', icon: 'flight', tokens: 'Aerial perspective, sweeping crane shot, wide 24mm lens' },
  { id: 'Static Frame', icon: 'crop_free', tokens: 'Locked-off tripod, symmetrical composition, 40mm lens' },
  { id: 'Gimbal Drift', icon: 'animation', tokens: 'Fluid gimbal movement, parallax tracking, 28mm lens' },
  { id: 'Whip Pan', icon: 'fast_forward', tokens: 'Dynamic whip pan energy, 24mm wide lens, motion streak' },
];

const PACING_OPTIONS = [
  { id: 'quick' as const, label: 'Quick', description: '4-5 scenes, fast cuts, high energy', icon: 'speed' },
  { id: 'balanced' as const, label: 'Balanced', description: '6-8 scenes, natural rhythm', icon: 'tune' },
  { id: 'slow' as const, label: 'Slow', description: '8-10 scenes, lingering shots, contemplative', icon: 'hourglass_bottom' },
];

const STYLE_PRESETS = [
  { name: 'Film Noir', icon: 'contrast', colorIndex: 1, lighting: 'high-contrast' as const, camera: 'Static Frame', pacing: 'slow' as const },
  { name: 'Music Video', icon: 'music_note', colorIndex: 3, lighting: 'mood' as const, camera: 'Gimbal Drift', pacing: 'quick' as const },
  { name: 'Documentary', icon: 'videocam', colorIndex: 0, lighting: 'warm' as const, camera: 'Handheld Cinematic', pacing: 'balanced' as const },
  { name: 'Sci-Fi', icon: 'rocket_launch', colorIndex: 2, lighting: 'cool' as const, camera: 'Drone Sweep', pacing: 'balanced' as const },
  { name: 'Luxury', icon: 'diamond', colorIndex: 0, lighting: 'warm' as const, camera: 'Dolly Smooth', pacing: 'slow' as const },
  { name: 'Action', icon: 'bolt', colorIndex: 0, lighting: 'high-contrast' as const, camera: 'Whip Pan', pacing: 'quick' as const },
];

// ─── Component ──────────────────────────────────────────────────────

export default function StyleDnaPage() {
  useEffect(() => {
    document.title = 'Style DNA — DIRECTOR';
  }, []);

  const { state, update } = useWizard();
  const [activeSection, setActiveSection] = useState<'style' | 'models'>('style');
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null);

  const currentPalette = COLOR_PALETTES[state.colorIndex] || COLOR_PALETTES[0];
  const currentLighting = LIGHTING_OPTIONS.find(l => l.id === state.lighting) || LIGHTING_OPTIONS[2];
  const currentCamera = CAMERA_OPTIONS.find(c => c.id === state.cameraMotion) || CAMERA_OPTIONS[0];

  // Build the cinematic DNA string
  const dnaPreview = useMemo(() => {
    const parts = [
      currentPalette.tokens,
      currentLighting.tokens,
      currentCamera.tokens,
      `${state.pacing} pacing`,
      `${state.aspectRatio} frame`,
      'shot on 35mm film, subtle film grain, professional color grading',
    ];
    return parts.join('. ');
  }, [currentPalette, currentLighting, currentCamera, state.pacing, state.aspectRatio]);

  const applyPreset = (preset: typeof STYLE_PRESETS[0]) => {
    update({
      colorIndex: preset.colorIndex,
      lighting: preset.lighting,
      cameraMotion: preset.camera,
      pacing: preset.pacing,
    });
  };

  const succeededAssets = state.productionAssets.filter(a => a.status === 'succeeded' && a.imageUrl);
  const totalAssets = state.productionAssets.length;

  return (
    <main className="flex h-[calc(100vh-4rem)]">
      {/* ── Left Panel: Style Controls ─────────────────────────────── */}
      <section className="w-full md:w-[440px] lg:w-[480px] flex-shrink-0 h-full bg-surface-container-low overflow-y-auto custom-scrollbar flex flex-col">
        {/* Header */}
        <div className="p-8 pb-0">
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface mb-1">Style DNA</h1>
          <p className="text-on-surface-variant text-sm">The cinematic language that defines every frame.</p>
        </div>

        {/* Section Toggle */}
        <div className="px-8 pt-6">
          <div className="flex bg-surface-container-highest rounded-xl p-1">
            <button
              onClick={() => setActiveSection('style')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeSection === 'style' ? 'bg-primary text-on-primary shadow-lg' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Visual Style
            </button>
            <button
              onClick={() => setActiveSection('models')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeSection === 'models' ? 'bg-primary text-on-primary shadow-lg' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              AI Models
            </button>
          </div>
        </div>

        {activeSection === 'style' ? (
          <div className="p-8 flex flex-col gap-8 flex-1">
            {/* Quick Presets */}
            <div className="space-y-3">
              <label className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">Quick Presets</label>
              <div className="grid grid-cols-3 gap-2">
                {STYLE_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl bg-surface-container-highest border border-outline-variant/15 hover:border-primary/40 hover:bg-primary/5 transition-all group"
                  >
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant group-hover:text-primary transition-colors">{preset.icon}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant group-hover:text-primary">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Palette */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">Color Palette</label>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: currentPalette.value + '20', color: currentPalette.value }}>
                  {currentPalette.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {COLOR_PALETTES.map((color, index) => (
                  <button
                    key={index}
                    onClick={() => update({ colorIndex: index })}
                    className={`relative flex-1 h-14 rounded-xl transition-all duration-200 ${
                      state.colorIndex === index
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-container-low scale-105'
                        : 'hover:scale-105 opacity-70 hover:opacity-100'
                    }`}
                    style={{ background: `linear-gradient(135deg, ${color.value}, ${color.accent})` }}
                    title={color.name}
                  >
                    {state.colorIndex === index && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-surface text-sm drop-shadow-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-on-surface-variant/60 italic">{currentPalette.tokens}</p>
            </div>

            {/* Lighting */}
            <div className="space-y-3">
              <label className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">Lighting</label>
              <div className="grid grid-cols-2 gap-2">
                {LIGHTING_OPTIONS.map((light) => {
                  const active = state.lighting === light.id;
                  return (
                    <button
                      key={light.id}
                      onClick={() => update({ lighting: light.id })}
                      className={`relative px-4 py-3.5 rounded-xl flex items-center gap-3 transition-all border-2 ${
                        active
                          ? 'bg-primary/10 border-primary'
                          : 'bg-surface-container-highest border-outline-variant/15 hover:border-primary/30'
                      }`}
                    >
                      <span className={`material-symbols-outlined ${active ? 'text-primary' : light.iconColor}`}>{light.icon}</span>
                      <div className="text-left">
                        <span className={`text-sm block ${active ? 'font-bold text-primary' : 'font-medium'}`}>{light.label}</span>
                        <span className="text-[10px] text-on-surface-variant/70 line-clamp-1">{light.tokens.split(',')[0]}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Camera Motion */}
            <div className="space-y-3">
              <label className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">Camera Motion</label>
              <div className="grid grid-cols-3 gap-2">
                {CAMERA_OPTIONS.map((cam) => {
                  const active = state.cameraMotion === cam.id;
                  return (
                    <button
                      key={cam.id}
                      onClick={() => update({ cameraMotion: cam.id })}
                      className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl transition-all border ${
                        active
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-surface-container-highest border-outline-variant/15 text-on-surface-variant hover:border-primary/30'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-[20px] ${active ? 'text-primary' : ''}`}>{cam.icon}</span>
                      <span className={`text-[10px] font-bold text-center leading-tight ${active ? 'text-primary' : ''}`}>{cam.id}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pacing */}
            <div className="space-y-3">
              <label className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">Pacing</label>
              <div className="flex gap-2">
                {PACING_OPTIONS.map((p) => {
                  const active = state.pacing === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => update({ pacing: p.id })}
                      className={`flex-1 flex flex-col items-center gap-1 px-3 py-3 rounded-xl transition-all border ${
                        active
                          ? 'bg-primary/10 border-primary'
                          : 'bg-surface-container-highest border-outline-variant/15 hover:border-primary/30'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-[20px] ${active ? 'text-primary' : 'text-on-surface-variant'}`}>{p.icon}</span>
                      <span className={`text-xs font-bold ${active ? 'text-primary' : ''}`}>{p.label}</span>
                      <span className="text-[9px] text-on-surface-variant/60 text-center leading-tight">{p.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-3">
              <label className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">Aspect Ratio</label>
              <div className="flex gap-2">
                {(['9:16', '16:9', '1:1'] as const).map((ratio) => {
                  const active = state.aspectRatio === ratio;
                  const dims = ratio === '9:16' ? 'w-4 h-7' : ratio === '16:9' ? 'w-8 h-[18px]' : 'w-6 h-6';
                  return (
                    <button
                      key={ratio}
                      onClick={() => update({ aspectRatio: ratio })}
                      className={`flex-1 flex flex-col items-center gap-2 py-3 rounded-xl transition-all border ${
                        active
                          ? 'bg-primary/10 border-primary'
                          : 'bg-surface-container-highest border-outline-variant/15 hover:border-primary/30'
                      }`}
                    >
                      <div className={`${dims} border-2 rounded-sm ${active ? 'border-primary' : 'border-on-surface-variant/40'}`} />
                      <span className={`text-xs font-bold ${active ? 'text-primary' : 'text-on-surface-variant'}`}>{ratio}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 flex flex-col gap-8 flex-1">
            {/* Image Models */}
            <div className="space-y-3">
              <label className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">Image Generation Model</label>
              <div className="space-y-2">
                {IMAGE_MODELS.map((model) => {
                  const active = state.selectedImageModel === model.id;
                  return (
                    <button
                      key={model.id}
                      onClick={() => update({ selectedImageModel: model.id })}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all border-2 ${
                        active ? 'bg-primary/5 border-primary' : 'bg-surface-container-highest border-outline-variant/15 hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold ${active ? 'text-primary' : ''}`}>{model.name}</span>
                          {model.loraSupport && (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-tertiary-container text-on-tertiary-fixed">LoRA</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            model.speed === 'fast' ? 'bg-green-500/20 text-green-400' :
                            model.speed === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>{model.speed}</span>
                          <span className="text-[10px] text-on-surface-variant">{model.costTier}</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">{model.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Video Models */}
            <div className="space-y-3">
              <label className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">Video Generation Model</label>
              <div className="space-y-2">
                {VIDEO_MODELS.map((model) => {
                  const active = state.selectedVideoModel === model.id;
                  return (
                    <button
                      key={model.id}
                      onClick={() => update({ selectedVideoModel: model.id })}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all border-2 ${
                        active ? 'bg-primary/5 border-primary' : 'bg-surface-container-highest border-outline-variant/15 hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold ${active ? 'text-primary' : ''}`}>{model.name}</span>
                          {model.supportsReferenceImages && (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-tertiary-container text-on-tertiary-fixed">Ref Imgs</span>
                          )}
                          {model.supportsAudio && (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">Audio</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            model.speed === 'fast' ? 'bg-green-500/20 text-green-400' :
                            model.speed === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>{model.speed}</span>
                          <span className="text-[10px] text-on-surface-variant">{model.costTier}</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">{model.description}</p>
                      <span className="text-[10px] text-on-surface-variant/60">Max {model.maxDuration}s</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* CTA Bottom */}
        <div className="px-8 py-6 border-t border-outline-variant/10 flex gap-3 mt-auto">
          <Link href="/create/character-setup" className="flex-1 py-3.5 rounded-xl bg-surface-container-highest text-on-surface font-bold text-center hover:bg-surface-bright transition-all text-sm">
            Back
          </Link>
          <Link href="/create/review" className="flex-1 py-3.5 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-extrabold tracking-tight hover:shadow-[0_0_20px_rgba(255,144,100,0.3)] transition-all active:scale-95 text-center text-sm">
            Lock Style & Continue
          </Link>
        </div>
      </section>

      {/* ── Right Panel: DNA Preview + Asset Gallery ───────────────── */}
      <section className="hidden md:block flex-1 h-full bg-surface relative overflow-y-auto custom-scrollbar">
        {/* Atmospheric background based on selected palette */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute top-[-15%] right-[-15%] w-[60%] h-[60%] blur-[150px] rounded-full bg-gradient-to-br ${currentPalette.bg} opacity-60`} />
          <div className={`absolute bottom-[-15%] left-[-10%] w-[50%] h-[50%] blur-[120px] rounded-full bg-gradient-to-tr ${currentPalette.bg} opacity-40`} />
        </div>

        <div className="relative z-10 p-8 space-y-8">
          {/* DNA Card */}
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container overflow-hidden">
            {/* Color bar */}
            <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${currentPalette.value}, ${currentPalette.accent}, transparent)` }} />

            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: currentPalette.value + '20' }}>
                    <span className="material-symbols-outlined text-[20px]" style={{ color: currentPalette.value }}>genetics</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold headline-font">Your Style DNA</h2>
                    <p className="text-[11px] text-on-surface-variant">Cinematic language injected into every generation</p>
                  </div>
                </div>
              </div>

              {/* Style summary chips */}
              <div className="flex flex-wrap gap-2">
                <StyleChip icon="palette" label={currentPalette.name} color={currentPalette.value} />
                <StyleChip icon={currentLighting.icon} label={currentLighting.label} />
                <StyleChip icon={CAMERA_OPTIONS.find(c => c.id === state.cameraMotion)?.icon || 'videocam'} label={state.cameraMotion} />
                <StyleChip icon={PACING_OPTIONS.find(p => p.id === state.pacing)?.icon || 'tune'} label={state.pacing} />
                <StyleChip icon="aspect_ratio" label={state.aspectRatio} />
              </div>

              {/* Prompt preview */}
              <div className="bg-surface-container-highest rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-[14px] text-primary">terminal</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Prompt DNA Injection</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed font-mono">{dnaPreview}</p>
              </div>
            </div>
          </div>

          {/* Asset Gallery */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-bold">Production Assets</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant">
                  {succeededAssets.length}/{totalAssets}
                </span>
              </div>
              <Link
                href="/assets"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                Full Library
              </Link>
            </div>

            {totalAssets === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-outline-variant/20">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/20 mb-3">photo_library</span>
                <h3 className="text-sm font-bold mb-1">No production assets</h3>
                <p className="text-xs text-on-surface-variant mb-4 max-w-xs">
                  Generate assets in the Characters step first.
                </p>
                <Link
                  href="/create/character-setup"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">face</span>
                  Go to Characters
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Asset grid with color-tinted overlay */}
                <AssetGalleryGrouped
                  assets={state.productionAssets}
                  paletteColor={currentPalette.value}
                  expandedAsset={expandedAsset}
                  onToggle={setExpandedAsset}
                />
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────

function StyleChip({ icon, label, color }: { icon: string; label: string; color?: string }) {
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-highest border border-outline-variant/15 text-xs font-medium"
      style={color ? { borderColor: color + '30' } : undefined}
    >
      <span className="material-symbols-outlined text-[14px]" style={color ? { color } : undefined}>{icon}</span>
      <span className="capitalize">{label}</span>
    </div>
  );
}

const CATEGORY_ORDER: AssetCategory[] = ['character', 'location', 'wardrobe', 'prop', 'vehicle', 'accessory'];
const CATEGORY_ICONS: Record<AssetCategory, string> = {
  character: 'face', location: 'landscape', wardrobe: 'checkroom',
  prop: 'inventory_2', vehicle: 'directions_car', accessory: 'watch',
};
const CATEGORY_LABELS: Record<AssetCategory, string> = {
  character: 'Characters', location: 'Locations', wardrobe: 'Wardrobe',
  prop: 'Props', vehicle: 'Vehicles', accessory: 'Accessories',
};

function AssetGalleryGrouped({
  assets,
  paletteColor,
  expandedAsset,
  onToggle,
}: {
  assets: ProductionAsset[];
  paletteColor: string;
  expandedAsset: string | null;
  onToggle: (id: string | null) => void;
}) {
  const grouped = useMemo(() => {
    const map = new Map<AssetCategory, ProductionAsset[]>();
    for (const a of assets) {
      if (!map.has(a.category)) map.set(a.category, []);
      map.get(a.category)!.push(a);
    }
    return CATEGORY_ORDER.filter(c => map.has(c)).map(c => ({ category: c, assets: map.get(c)! }));
  }, [assets]);

  return (
    <>
      {grouped.map(({ category, assets: catAssets }) => (
        <div key={category}>
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">{CATEGORY_ICONS[category]}</span>
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{CATEGORY_LABELS[category]}</span>
            <span className="text-[10px] text-on-surface-variant/50">{catAssets.length}</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {catAssets.map((asset) => {
              const isExpanded = expandedAsset === asset.id;
              return (
                <button
                  key={asset.id}
                  onClick={() => onToggle(isExpanded ? null : asset.id)}
                  className={`group rounded-xl overflow-hidden border text-left transition-all ${
                    isExpanded
                      ? 'border-primary ring-1 ring-primary/20 col-span-2 row-span-2'
                      : 'border-outline-variant/15 hover:border-outline-variant/30'
                  } bg-surface-container`}
                >
                  <div className={`relative bg-surface-container-highest ${isExpanded ? 'aspect-[4/3]' : 'aspect-square'}`}>
                    {asset.status === 'generating' ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : asset.imageUrl ? (
                      <>
                        <CachedImg src={asset.imageUrl} alt={asset.name} className="w-full h-full object-cover" />
                        {/* Color grade overlay that reflects the selected palette */}
                        <div
                          className="absolute inset-0 mix-blend-color opacity-[0.08] pointer-events-none"
                          style={{ backgroundColor: paletteColor }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl text-on-surface-variant/20">image</span>
                      </div>
                    )}
                    {/* Status */}
                    {asset.status === 'succeeded' && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-green-600/90 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[10px] text-on-surface">check</span>
                      </div>
                    )}
                    {asset.status === 'failed' && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-error/90 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[10px] text-on-error">close</span>
                      </div>
                    )}
                  </div>
                  <div className={`px-2.5 py-2 ${isExpanded ? 'space-y-1' : ''}`}>
                    <p className="text-xs font-semibold truncate">{asset.name}</p>
                    {isExpanded && (
                      <p className="text-[11px] text-on-surface-variant leading-relaxed line-clamp-3">{asset.description}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
