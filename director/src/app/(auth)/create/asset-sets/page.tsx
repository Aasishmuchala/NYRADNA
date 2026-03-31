'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAssetSetStore } from '@/lib/stores/asset-set-store';
import { usePipelineNodeStore } from '@/lib/stores/pipeline-node-store';
import AssetSetCard from '@/components/assets/AssetSetCard';
import AssetItemGrid from '@/components/assets/AssetItemGrid';
import FileUploadZone from '@/components/assets/FileUploadZone';
import GeneratedAssetsPanel from '@/components/assets/GeneratedAssetsPanel';
import type { AssetSet, AssetType } from '@/lib/types/asset-set';

export default function AssetSetsPage() {
  const router = useRouter();
  const generateFromAssetSet = usePipelineNodeStore((s) => s.generateFromAssetSet);

  // Store state
  const assetSets = useAssetSetStore((s) => s.assetSets);
  const activeSetId = useAssetSetStore((s) => s.activeSetId);
  const loading = useAssetSetStore((s) => s.loading);
  const saving = useAssetSetStore((s) => s.saving);
  const loadAssetSets = useAssetSetStore((s) => s.loadAssetSets);
  const createAssetSet = useAssetSetStore((s) => s.createAssetSet);
  const deleteAssetSet = useAssetSetStore((s) => s.deleteAssetSet);
  const setActiveSet = useAssetSetStore((s) => s.setActiveSet);
  const getActiveSet = useAssetSetStore((s) => s.getActiveSet);
  const reorderItems = useAssetSetStore((s) => s.reorderItems);
  const removeItem = useAssetSetStore((s) => s.removeItem);
  const uploadAsset = useAssetSetStore((s) => s.uploadAsset);
  const addItem = useAssetSetStore((s) => s.addItem);

  // Local state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSetName, setNewSetName] = useState('');
  const [newSetDescription, setNewSetDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [generatingPipeline, setGeneratingPipeline] = useState(false);

  // Load sets on mount
  useEffect(() => {
    loadAssetSets('default-project');
  }, [loadAssetSets]);

  const activeSet: AssetSet | null = getActiveSet();

  async function handleCreateSet() {
    const trimmedName = newSetName.trim();
    if (!trimmedName) return;

    const created = await createAssetSet({
      name: trimmedName,
      description: newSetDescription.trim(),
      projectId: 'default-project',
    });

    if (created) {
      setActiveSet(created.id);
      setShowCreateForm(false);
      setNewSetName('');
      setNewSetDescription('');
    }
  }

  async function handleUpload(file: File) {
    if (!activeSetId) return;
    setUploading(true);
    try {
      await uploadAsset(activeSetId, file);
    } finally {
      setUploading(false);
    }
  }

  function handleReorder(newIds: string[]) {
    if (!activeSetId) return;
    reorderItems(activeSetId, newIds);
  }

  function handleRemoveItem(itemId: string) {
    if (!activeSetId) return;
    removeItem(activeSetId, itemId);
  }

  function handleDeleteSet(id: string) {
    deleteAssetSet(id);
  }

  async function handleAddGeneratedToSet(item: {
    name: string;
    type: AssetType;
    url: string;
    thumbnailUrl: string | null;
    metadata: Record<string, unknown>;
  }) {
    if (!activeSetId) return;
    await addItem(activeSetId, item);
  }

  async function handleGeneratePipeline() {
    if (!activeSetId || !activeSet || activeSet.items.length === 0) return;
    setGeneratingPipeline(true);
    try {
      await generateFromAssetSet('default-project', activeSetId);
      router.push('/create/pipeline');
    } finally {
      setGeneratingPipeline(false);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-on-surface">Asset Sets</h1>
        <p className="mt-1 text-sm text-[#c8c4d6]">
          Organize your media assets into narrative sequences
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left panel: Set list */}
        <div className="col-span-12 lg:col-span-4">
          <div className="rounded-xl bg-surface-container p-4">
            {/* Create new set button */}
            {!showCreateForm && (
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 font-bold text-on-surface transition-colors hover:bg-[var(--color-primary)]"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                New Asset Set
              </button>
            )}

            {/* Create form */}
            {showCreateForm && (
              <div className="mb-4 rounded-lg bg-[#1a1a1a] p-4">
                <h3 className="mb-3 text-sm font-semibold text-on-surface">Create Asset Set</h3>
                <input
                  type="text"
                  value={newSetName}
                  onChange={(e) => setNewSetName(e.target.value)}
                  placeholder="Set name"
                  className="mb-2 w-full rounded-lg border border-[rgba(127,114,247,0.1)] bg-surface-container px-3 py-2 text-sm text-on-surface placeholder-[#555] focus:border-primary focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateSet();
                  }}
                />
                <textarea
                  value={newSetDescription}
                  onChange={(e) => setNewSetDescription(e.target.value)}
                  placeholder="Description (optional)"
                  rows={2}
                  className="mb-3 w-full resize-none rounded-lg border border-[rgba(127,114,247,0.1)] bg-surface-container px-3 py-2 text-sm text-on-surface placeholder-[#555] focus:border-primary focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCreateSet}
                    disabled={!newSetName.trim() || saving}
                    className="flex-1 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-on-surface transition-colors hover:bg-[var(--color-primary)] disabled:opacity-50"
                  >
                    {saving ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewSetName('');
                      setNewSetDescription('');
                    }}
                    className="rounded-lg bg-white/5 px-4 py-2 text-sm text-[#c8c4d6] transition-colors hover:bg-[rgba(127,114,247,0.1)]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Set list */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <p className="animate-pulse text-sm text-[#555]">Loading sets...</p>
              </div>
            ) : assetSets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <span className="material-symbols-outlined mb-2 text-3xl text-[rgba(127,114,247,0.1)]">
                  photo_library
                </span>
                <p className="text-center text-sm text-[#555]">
                  No asset sets yet. Create one to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {assetSets.map((set) => (
                  <AssetSetCard
                    key={set.id}
                    set={set}
                    isActive={set.id === activeSetId}
                    onSelect={setActiveSet}
                    onDelete={handleDeleteSet}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right panel: Active set detail */}
        <div className="col-span-12 lg:col-span-8">
          {activeSet ? (
            <div className="space-y-6">
              {/* Set header */}
              <div className="rounded-xl bg-surface-container p-4">
                <h2 className="text-lg font-bold text-on-surface">{activeSet.name}</h2>
                {activeSet.description && (
                  <p className="mt-1 text-sm text-[#c8c4d6]">{activeSet.description}</p>
                )}
                <p className="mt-2 text-xs text-[#555]">
                  {activeSet.items.length} {activeSet.items.length === 1 ? 'asset' : 'assets'}
                  {' '}&middot;{' '}
                  Updated {new Date(activeSet.updatedAt).toLocaleDateString()}
                </p>
                <button
                  type="button"
                  onClick={handleGeneratePipeline}
                  disabled={!activeSet || activeSet.items.length === 0 || generatingPipeline}
                  className="mt-3 flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-on-surface transition-colors hover:bg-[var(--color-primary)] disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">account_tree</span>
                  {generatingPipeline ? 'Generating...' : 'Generate Pipeline'}
                </button>
              </div>

              {/* Upload zone */}
              <FileUploadZone
                onUpload={handleUpload}
                uploading={uploading}
              />

              {/* Generated assets panel */}
              <GeneratedAssetsPanel
                projectId="default-project"
                activeSetId={activeSetId}
                onAddToSet={handleAddGeneratedToSet}
              />

              {/* Asset grid */}
              <AssetItemGrid
                items={activeSet.items}
                onReorder={handleReorder}
                onRemove={handleRemoveItem}
              />
            </div>
          ) : (
            <div className="flex min-h-[400px] items-center justify-center rounded-xl bg-surface-container">
              <div className="text-center">
                <span className="material-symbols-outlined mb-3 text-5xl text-[rgba(127,114,247,0.1)]">
                  collections
                </span>
                <p className="text-sm text-[#555]">
                  Select or create an asset set to view its contents
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
