'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useWizard } from '@/context/WizardContext';
import type { ProductionAsset, AssetCategory } from '@/context/WizardContext';
import { IMAGE_MODELS } from '@/lib/models';
import { listProjects, loadProject } from '@/lib/projectStorage';
import type { ProjectIndexEntry } from '@/lib/projectStorage';
import { getApiKeys } from '@/lib/apiKeyStore';

const CATEGORY_FILTERS: { id: AssetCategory | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: 'grid_view' },
  { id: 'character', label: 'Characters', icon: 'face' },
  { id: 'location', label: 'Locations', icon: 'landscape' },
  { id: 'wardrobe', label: 'Wardrobe', icon: 'checkroom' },
  { id: 'prop', label: 'Props', icon: 'inventory_2' },
  { id: 'vehicle', label: 'Vehicles', icon: 'directions_car' },
  { id: 'accessory', label: 'Accessories', icon: 'watch' },
];

const AI_MODELS = IMAGE_MODELS.filter(m => !m.loraSupport);

function buildAssetPrompt(asset: ProductionAsset): string {
  const categoryPrefix: Record<AssetCategory, string> = {
    character: 'cinematic character portrait, photorealistic, 8k, studio lighting, shallow depth of field',
    location: 'cinematic establishing shot, photorealistic, 8k, wide angle, atmospheric, volumetric lighting',
    wardrobe: 'fashion photography, clothing on invisible mannequin, studio shot, 8k, detailed fabric texture',
    prop: 'product photography, cinematic still life, 8k, dramatic lighting, detailed texture',
    vehicle: 'automotive photography, cinematic, 8k, dramatic lighting, reflective surfaces',
    accessory: 'macro product photography, cinematic, 8k, detailed craftsmanship, studio lighting',
  };
  const suffix = 'shot on 35mm film, subtle film grain, professional color grading, cinematic color science';
  return `${categoryPrefix[asset.category]}, ${asset.description}, ${suffix}`;
}

interface ProjectAssets {
  project: ProjectIndexEntry;
  assets: ProductionAsset[];
  isCurrent: boolean;
}

function deriveProjectId(baseSeed: number): string {
  return `proj-${baseSeed}`;
}

export default function AssetsPage() {
  useEffect(() => {
    document.title = 'Assets — DIRECTOR';
  }, []);

  const { state, update } = useWizard();
  const [filter, setFilter] = useState<AssetCategory | 'all'>('all');
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  // Manual add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState<AssetCategory>('character');
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newModel, setNewModel] = useState(AI_MODELS[0]?.id || 'flux-schnell');

  // Load all projects and their assets
  const [projectAssets, setProjectAssets] = useState<ProjectAssets[]>([]);

  const currentProjectId = deriveProjectId(state.baseSeed);

  useEffect(() => {
    const projects = listProjects();
    const result: ProjectAssets[] = [];

    // Current project (from live wizard state) — always first
    const currentEntry = projects.find(p => p.id === currentProjectId);
    result.push({
      project: currentEntry || { id: currentProjectId, title: state.visionText?.slice(0, 50) || 'Current Project', updatedAt: new Date().toISOString() },
      assets: state.productionAssets,
      isCurrent: true,
    });

    // Other saved projects
    for (const proj of projects) {
      if (proj.id === currentProjectId) continue;
      const loaded = loadProject(proj.id);
      if (loaded && loaded.productionAssets && loaded.productionAssets.length > 0) {
        result.push({
          project: proj,
          assets: loaded.productionAssets,
          isCurrent: false,
        });
      }
    }

    setProjectAssets(result);
  }, [state.productionAssets, state.baseSeed, state.visionText, currentProjectId]);

  // Flatten all assets with project info for counting
  const allAssets = useMemo(() =>
    projectAssets.flatMap(pa => pa.assets.map(a => ({ ...a, _projectId: pa.project.id }))),
    [projectAssets]
  );

  const totalCount = allAssets.length;
  const counts = allAssets.reduce((acc, a) => {
    acc[a.category] = (acc[a.category] || 0) + 1;
    acc.all = (acc.all || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Find selected asset across all projects
  const selectedEntry = useMemo(() => {
    if (!selectedAsset) return null;
    for (const pa of projectAssets) {
      const found = pa.assets.find(a => a.id === selectedAsset);
      if (found) return { asset: found, project: pa.project, isCurrent: pa.isCurrent };
    }
    return null;
  }, [selectedAsset, projectAssets]);

  const handleDelete = (id: string) => {
    // Only delete from current project
    update({ productionAssets: state.productionAssets.filter(a => a.id !== id) });
    if (selectedAsset === id) setSelectedAsset(null);
  };

  const handleRegenerate = async (asset: ProductionAsset) => {
    const keys = getApiKeys();
    if (!keys.replicate) return;

    setGeneratingId(asset.id);
    update({
      productionAssets: state.productionAssets.map(a =>
        a.id === asset.id ? { ...a, status: 'generating' as const, imageUrl: null } : a
      ),
    });

    const prompt = buildAssetPrompt(asset);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, imageModelId: asset.model, aspectRatio: asset.category === 'location' ? '16:9' : '1:1' }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();

      for (let i = 0; i < 120; i++) {
        await new Promise(r => setTimeout(r, 2500));
        const statusRes = await fetch(`/api/status/${data.predictionId}`);
        const statusData = await statusRes.json();
        if (statusData.status === 'succeeded') {
          const output = Array.isArray(statusData.output) ? statusData.output[0] : statusData.output;
          update({
            productionAssets: state.productionAssets.map(a =>
              a.id === asset.id ? { ...a, imageUrl: output || null, status: 'succeeded' as const } : a
            ),
          });
          break;
        } else if (statusData.status === 'failed' || statusData.status === 'canceled') {
          update({
            productionAssets: state.productionAssets.map(a =>
              a.id === asset.id ? { ...a, status: 'failed' as const } : a
            ),
          });
          break;
        }
      }
    } catch {
      update({
        productionAssets: state.productionAssets.map(a =>
          a.id === asset.id ? { ...a, status: 'failed' as const } : a
        ),
      });
    }
    setGeneratingId(null);
  };

  // Copy asset from another project into current
  const handleImportAsset = (asset: ProductionAsset) => {
    const exists = state.productionAssets.some(a => a.id === asset.id);
    if (exists) return;
    const imported: ProductionAsset = {
      ...asset,
      id: `asset-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
    update({ productionAssets: [...state.productionAssets, imported] });
  };

  const handleAddAsset = () => {
    if (!newName.trim() || !newDescription.trim()) return;
    const newAsset: ProductionAsset = {
      id: `asset-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      category: newCategory,
      name: newName.trim(),
      description: newDescription.trim(),
      imageUrl: null,
      predictionId: null,
      status: 'idle',
      model: newModel,
    };
    update({ productionAssets: [...state.productionAssets, newAsset] });
    setNewName('');
    setNewDescription('');
    setShowAddForm(false);
  };

  // Filter visible projects
  const visibleProjects = useMemo(() => {
    if (selectedProjectId) {
      return projectAssets.filter(pa => pa.project.id === selectedProjectId);
    }
    return projectAssets;
  }, [projectAssets, selectedProjectId]);

  return (
    <main className="pt-24 pb-12 pl-4 pr-4 md:pl-72 md:pr-8 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold headline-font tracking-tighter">Production Assets</h1>
            <p className="text-on-surface-variant text-sm mt-1">
              {totalCount} asset{totalCount !== 1 ? 's' : ''} across {projectAssets.length} project{projectAssets.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-on-primary text-sm font-bold hover:bg-primary/90 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Asset
          </button>
        </div>

        {/* Add Asset Form */}
        {showAddForm && (
          <div className="p-6 rounded-xl border border-outline-variant/20 bg-surface-container space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">New Asset (Current Project)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as AssetCategory)}
                  className="w-full px-3 py-2.5 bg-surface-container-highest text-on-surface rounded-lg border border-outline-variant/30 text-sm focus:border-primary focus:outline-none"
                >
                  {CATEGORY_FILTERS.filter(c => c.id !== 'all').map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Model</label>
                <select
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-container-highest text-on-surface rounded-lg border border-outline-variant/30 text-sm focus:border-primary focus:outline-none"
                >
                  {AI_MODELS.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Lead Detective"
                  className="w-full px-3 py-2.5 bg-surface-container-highest text-on-surface rounded-lg border border-outline-variant/30 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Description</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Detailed visual description..."
                  className="w-full px-3 py-2.5 bg-surface-container-highest text-on-surface rounded-lg border border-outline-variant/30 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors">Cancel</button>
              <button
                onClick={handleAddAsset}
                disabled={!newName.trim() || !newDescription.trim()}
                className="px-5 py-2 rounded-lg bg-primary text-on-primary text-sm font-bold disabled:opacity-40 hover:bg-primary/90 transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Project Filter + Category Filter */}
        <div className="space-y-3">
          {/* Project tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedProjectId(null)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                !selectedProjectId
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'bg-surface-container text-on-surface-variant border border-outline-variant/20 hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">folder_open</span>
              All Projects
            </button>
            {projectAssets.map((pa) => (
              <button
                key={pa.project.id}
                onClick={() => setSelectedProjectId(pa.project.id === selectedProjectId ? null : pa.project.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedProjectId === pa.project.id
                    ? 'bg-primary/15 text-primary border border-primary/30'
                    : 'bg-surface-container text-on-surface-variant border border-outline-variant/20 hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{pa.isCurrent ? 'movie_filter' : 'movie'}</span>
                <span className="max-w-[140px] truncate">{pa.project.title}</span>
                {pa.isCurrent && (
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/20 text-primary">Active</span>
                )}
                <span className="text-[10px] font-bold text-on-surface-variant/60">{pa.assets.length}</span>
              </button>
            ))}
          </div>

          {/* Category tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {CATEGORY_FILTERS.map((cat) => {
              const count = counts[cat.id] || 0;
              const active = filter === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setFilter(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-surface-container-highest text-on-surface border border-outline-variant/30'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">{cat.icon}</span>
                  {cat.label}
                  {count > 0 && <span className="text-[10px] font-bold text-on-surface-variant/60">{count}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content — grouped by project */}
        <div className="flex gap-8">
          <div className="flex-1 space-y-10">
            {visibleProjects.map((pa) => {
              const projectFiltered = filter === 'all' ? pa.assets : pa.assets.filter(a => a.category === filter);
              if (projectFiltered.length === 0) return null;
              return (
                <section key={pa.project.id}>
                  {/* Project header */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`material-symbols-outlined text-[20px] ${pa.isCurrent ? 'text-primary' : 'text-on-surface-variant'}`}>
                      {pa.isCurrent ? 'movie_filter' : 'movie'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base font-bold truncate">
                        {pa.project.title}
                        {pa.isCurrent && <span className="ml-2 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/15 text-primary align-middle">Active</span>}
                      </h2>
                      <p className="text-[11px] text-on-surface-variant">{projectFiltered.length} asset{projectFiltered.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  {/* Asset grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {projectFiltered.map((asset) => (
                      <button
                        key={asset.id}
                        onClick={() => setSelectedAsset(asset.id === selectedAsset ? null : asset.id)}
                        className={`group relative rounded-xl overflow-hidden border transition-all text-left ${
                          selectedAsset === asset.id
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-outline-variant/20 hover:border-outline-variant/40'
                        } bg-surface-container`}
                      >
                        <div className="aspect-square relative bg-surface-container-highest">
                          {asset.status === 'generating' ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                          ) : asset.imageUrl ? (
                            <img src={asset.imageUrl} alt={asset.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="material-symbols-outlined text-3xl text-on-surface-variant/30">image</span>
                            </div>
                          )}
                          {asset.status === 'failed' && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-error/90 flex items-center justify-center">
                              <span className="material-symbols-outlined text-[14px] text-on-error">close</span>
                            </div>
                          )}
                          {asset.status === 'succeeded' && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-600/90 flex items-center justify-center">
                              <span className="material-symbols-outlined text-[14px] text-on-surface">check</span>
                            </div>
                          )}
                          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider text-on-surface">
                            {asset.category}
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-semibold truncate">{asset.name}</p>
                          <p className="text-xs text-on-surface-variant line-clamp-1 mt-0.5">{asset.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}

            {/* Empty state */}
            {visibleProjects.every(pa => {
              const f = filter === 'all' ? pa.assets : pa.assets.filter(a => a.category === filter);
              return f.length === 0;
            }) && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4">image</span>
                <h3 className="text-lg font-bold mb-2">No assets found</h3>
                <p className="text-on-surface-variant text-sm mb-6">
                  Generate production assets in the Characters step.
                </p>
                <Link
                  href="/create/character-setup"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-on-primary text-sm font-bold hover:bg-primary/90 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">face</span>
                  Go to Characters
                </Link>
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {selectedEntry && (
            <div className="hidden lg:block w-80 shrink-0">
              <div className="sticky top-24 rounded-xl border border-outline-variant/20 bg-surface-container overflow-hidden">
                <div className="aspect-square bg-surface-container-highest">
                  {selectedEntry.asset.imageUrl ? (
                    <img src={selectedEntry.asset.imageUrl} alt={selectedEntry.asset.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-5xl text-on-surface-variant/30">image</span>
                    </div>
                  )}
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold">{selectedEntry.asset.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded bg-surface-container-highest text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                        {selectedEntry.asset.category}
                      </span>
                      <span className="text-[10px] text-on-surface-variant truncate max-w-[140px]">
                        {selectedEntry.project.title}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{selectedEntry.asset.description}</p>
                  <div className="text-xs text-on-surface-variant">
                    <span className="font-semibold">Model:</span> {AI_MODELS.find(m => m.id === selectedEntry.asset.model)?.name || selectedEntry.asset.model}
                  </div>
                  <div className="text-xs text-on-surface-variant">
                    <span className="font-semibold">Status:</span>{' '}
                    <span className={
                      selectedEntry.asset.status === 'succeeded' ? 'text-green-400' :
                      selectedEntry.asset.status === 'failed' ? 'text-error' :
                      selectedEntry.asset.status === 'generating' ? 'text-primary' : 'text-on-surface-variant'
                    }>
                      {selectedEntry.asset.status}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 pt-2">
                    {selectedEntry.isCurrent ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRegenerate(selectedEntry.asset)}
                          disabled={generatingId === selectedEntry.asset.id}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-primary text-on-primary text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">refresh</span>
                          {generatingId === selectedEntry.asset.id ? 'Generating...' : 'Regenerate'}
                        </button>
                        <button
                          onClick={() => handleDelete(selectedEntry.asset.id)}
                          className="px-3 py-2.5 rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-error/10 hover:text-error hover:border-error/30 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleImportAsset(selectedEntry.asset)}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-primary text-on-primary text-sm font-bold hover:bg-primary/90 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">add_circle</span>
                        Import to Current Project
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
