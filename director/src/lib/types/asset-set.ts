export type AssetType = 'image' | 'video' | 'audio';

export interface AssetSetItem {
  id: string;
  assetSetId: string;
  name: string;
  type: AssetType;
  url: string;           // Supabase Storage public URL
  thumbnailUrl: string | null;
  metadata: Record<string, unknown>; // flexible JSONB
  position: number;      // 0-indexed ordering within set
  createdAt: string;
}

export interface AssetSet {
  id: string;
  projectId: string;
  name: string;
  description: string;
  items: AssetSetItem[];  // loaded eagerly for display
  createdAt: string;
  updatedAt: string;
}

export interface NewAssetSet {
  name: string;
  description: string;
  projectId: string;
}

/** Asset set is usable if it has a name and at least one item */
export function isAssetSetComplete(set: AssetSet | null): boolean {
  if (!set) return false;
  return set.name.trim().length > 0 && set.items.length > 0;
}
