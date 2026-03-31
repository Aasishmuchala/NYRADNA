import { create } from 'zustand';
import { AssetSet, AssetSetItem, NewAssetSet } from '../types/asset-set';

interface AssetSetState {
  assetSets: AssetSet[];
  activeSetId: string | null;
  loading: boolean;
  saving: boolean;

  // Queries
  getActiveSet: () => AssetSet | null;

  // Set CRUD
  loadAssetSets: (projectId: string) => Promise<void>;
  createAssetSet: (data: NewAssetSet) => Promise<AssetSet | null>;
  deleteAssetSet: (id: string) => Promise<void>;
  setActiveSet: (id: string | null) => void;

  // Item management
  addItem: (setId: string, item: Omit<AssetSetItem, 'id' | 'assetSetId' | 'createdAt' | 'position'>) => Promise<void>;
  removeItem: (setId: string, itemId: string) => Promise<void>;
  reorderItems: (setId: string, itemIds: string[]) => Promise<void>;

  // Upload
  uploadAsset: (setId: string, file: File) => Promise<void>;
}

export const useAssetSetStore = create<AssetSetState>()((set, get) => ({
  assetSets: [],
  activeSetId: null,
  loading: false,
  saving: false,

  getActiveSet: () => {
    const { assetSets, activeSetId } = get();
    return assetSets.find((s) => s.id === activeSetId) ?? null;
  },

  loadAssetSets: async (projectId: string) => {
    set({ loading: true });
    try {
      const res = await fetch(`/api/asset-sets?projectId=${encodeURIComponent(projectId)}`);
      if (res.ok) {
        const data: AssetSet[] = await res.json();
        set({ assetSets: data, loading: false });
      } else {
        console.error('Failed to load asset sets:', res.statusText);
        set({ loading: false });
      }
    } catch (err) {
      console.error('Failed to load asset sets:', err);
      set({ loading: false });
    }
  },

  createAssetSet: async (data: NewAssetSet) => {
    set({ saving: true });
    try {
      const res = await fetch('/api/asset-sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const created: AssetSet = await res.json();
        set((state) => ({
          assetSets: [created, ...state.assetSets],
          saving: false,
        }));
        return created;
      } else {
        console.error('Failed to create asset set:', res.statusText);
        set({ saving: false });
        return null;
      }
    } catch (err) {
      console.error('Failed to create asset set:', err);
      set({ saving: false });
      return null;
    }
  },

  deleteAssetSet: async (id: string) => {
    set({ saving: true });
    try {
      const res = await fetch(`/api/asset-sets?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        set((state) => ({
          assetSets: state.assetSets.filter((s) => s.id !== id),
          activeSetId: state.activeSetId === id ? null : state.activeSetId,
          saving: false,
        }));
      } else {
        console.error('Failed to delete asset set:', res.statusText);
        set({ saving: false });
      }
    } catch (err) {
      console.error('Failed to delete asset set:', err);
      set({ saving: false });
    }
  },

  setActiveSet: (id: string | null) => {
    set({ activeSetId: id });
  },

  addItem: async (setId: string, item: Omit<AssetSetItem, 'id' | 'assetSetId' | 'createdAt' | 'position'>) => {
    set({ saving: true });
    try {
      const res = await fetch(`/api/asset-sets/${encodeURIComponent(setId)}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        const created: AssetSetItem = await res.json();
        set((state) => ({
          assetSets: state.assetSets.map((s) =>
            s.id === setId ? { ...s, items: [...s.items, created] } : s
          ),
          saving: false,
        }));
      } else {
        console.error('Failed to add item:', res.statusText);
        set({ saving: false });
      }
    } catch (err) {
      console.error('Failed to add item:', err);
      set({ saving: false });
    }
  },

  removeItem: async (setId: string, itemId: string) => {
    set({ saving: true });
    try {
      const res = await fetch(
        `/api/asset-sets/${encodeURIComponent(setId)}/items?itemId=${encodeURIComponent(itemId)}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        set((state) => ({
          assetSets: state.assetSets.map((s) =>
            s.id === setId
              ? {
                  ...s,
                  items: s.items
                    .filter((i) => i.id !== itemId)
                    .map((i, idx) => ({ ...i, position: idx })),
                }
              : s
          ),
          saving: false,
        }));
      } else {
        console.error('Failed to remove item:', res.statusText);
        set({ saving: false });
      }
    } catch (err) {
      console.error('Failed to remove item:', err);
      set({ saving: false });
    }
  },

  reorderItems: async (setId: string, itemIds: string[]) => {
    set({ saving: true });
    try {
      const res = await fetch(`/api/asset-sets/${encodeURIComponent(setId)}/items/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds }),
      });
      if (res.ok) {
        // Reorder local items to match the new order
        set((state) => ({
          assetSets: state.assetSets.map((s) => {
            if (s.id !== setId) return s;
            const itemMap = new Map(s.items.map((i) => [i.id, i]));
            const reordered = itemIds
              .map((id, idx) => {
                const item = itemMap.get(id);
                return item ? { ...item, position: idx } : null;
              })
              .filter((i): i is AssetSetItem => i !== null);
            return { ...s, items: reordered };
          }),
          saving: false,
        }));
      } else {
        console.error('Failed to reorder items:', res.statusText);
        set({ saving: false });
      }
    } catch (err) {
      console.error('Failed to reorder items:', err);
      set({ saving: false });
    }
  },

  uploadAsset: async (setId: string, file: File) => {
    set({ saving: true });
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/api/asset-sets/upload?setId=${encodeURIComponent(setId)}`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const created: AssetSetItem = await res.json();
        set((state) => ({
          assetSets: state.assetSets.map((s) =>
            s.id === setId ? { ...s, items: [...s.items, created] } : s
          ),
          saving: false,
        }));
      } else {
        console.error('Failed to upload asset:', res.statusText);
        set({ saving: false });
      }
    } catch (err) {
      console.error('Failed to upload asset:', err);
      set({ saving: false });
    }
  },
}));
