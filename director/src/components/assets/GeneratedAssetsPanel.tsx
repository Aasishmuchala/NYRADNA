'use client';

import { useState, useEffect } from 'react';
import type { AssetSetItem, AssetType } from '@/lib/types/asset-set';

interface GeneratedAssetsPanelProps {
  projectId: string;
  activeSetId: string | null;
  onAddToSet: (item: {
    name: string;
    type: AssetType;
    url: string;
    thumbnailUrl: string | null;
    metadata: Record<string, unknown>;
  }) => Promise<void>;
}

export default function GeneratedAssetsPanel({
  projectId,
  activeSetId,
  onAddToSet,
}: GeneratedAssetsPanelProps) {
  const [items, setItems] = useState<AssetSetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGeneratedAssets() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/asset-sets/generated?projectId=${encodeURIComponent(projectId)}`
        );
        if (res.ok) {
          const data: AssetSetItem[] = await res.json();
          setItems(data);
        }
      } catch (err) {
        console.error('Failed to load generated assets:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchGeneratedAssets();
  }, [projectId]);

  async function handleAddToSet(item: AssetSetItem) {
    if (!activeSetId) return;
    setAddingId(item.id);
    try {
      await onAddToSet({
        name: item.name,
        type: item.type,
        url: item.url,
        thumbnailUrl: item.thumbnailUrl,
        metadata: item.metadata,
      });
    } finally {
      setAddingId(null);
    }
  }

  const sourceColors: Record<string, string> = {
    'gap-fill': 'bg-amber-500/20 text-amber-400',
    'video-generation': 'bg-purple-500/20 text-purple-400',
  };

  const sourceIcons: Record<string, string> = {
    'gap-fill': 'auto_fix_high',
    'video-generation': 'smart_display',
  };

  const sourceLabels: Record<string, string> = {
    'gap-fill': 'Gap Fill',
    'video-generation': 'Generated',
  };

  return (
    <div className="rounded-xl bg-[#1A1A2E] overflow-hidden">
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-[#1A1A2E]"
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-[#A0A0B8]">
            auto_awesome
          </span>
          <span className="text-sm font-semibold text-white">Generated Assets</span>
          {items.length > 0 && (
            <span className="rounded-full bg-[#7F72F7]/20 px-2 py-0.5 text-[10px] font-medium text-[#7F72F7]">
              {items.length}
            </span>
          )}
        </div>
        <span
          className={`material-symbols-outlined text-[18px] text-[#6B6B80] transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
        >
          expand_more
        </span>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-[#222] px-4 pb-4 pt-3">
          {loading ? (
            <p className="animate-pulse text-center text-xs text-[#6B6B80]">
              Loading generated assets...
            </p>
          ) : items.length === 0 ? (
            <p className="text-center text-xs text-[#6B6B80]">
              No generated assets yet. Generate videos or fill gaps to see them here.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {items.map((item) => {
                const source = (item.metadata?.source as string) ?? '';

                return (
                  <div
                    key={item.id}
                    className="group rounded-lg bg-[#0A0A0F] p-2 transition-colors hover:bg-[#1A1A2E]"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-20 w-full overflow-hidden rounded-md bg-[#1A1A2E]">
                      {item.type === 'video' ? (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="material-symbols-outlined text-3xl text-[#6B6B80]">
                            videocam
                          </span>
                        </div>
                      ) : (
                        <img
                          src={item.thumbnailUrl || item.url}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>

                    {/* Name */}
                    <p className="mt-1.5 truncate text-[11px] text-[#A0A0B8]">{item.name}</p>

                    {/* Source badge */}
                    <span
                      className={`mt-1 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        sourceColors[source] || 'bg-[#1A1A2E] text-[#A0A0B8]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[12px]">
                        {sourceIcons[source] || 'star'}
                      </span>
                      {sourceLabels[source] || source}
                    </span>

                    {/* Add to Set button */}
                    <button
                      type="button"
                      onClick={() => handleAddToSet(item)}
                      disabled={!activeSetId || addingId === item.id}
                      className="mt-2 flex w-full items-center justify-center gap-1 rounded-md bg-[#12121A] px-2 py-1.5 text-[11px] font-medium text-[#A0A0B8] transition-colors hover:bg-[#1A1A2E] hover:text-white disabled:opacity-40 disabled:hover:bg-[#12121A] disabled:hover:text-[#A0A0B8]"
                      title={
                        !activeSetId
                          ? 'Select an asset set first'
                          : 'Add this asset to the active set'
                      }
                    >
                      <span className="material-symbols-outlined text-[14px]">add</span>
                      {addingId === item.id ? 'Adding...' : 'Add to Set'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
