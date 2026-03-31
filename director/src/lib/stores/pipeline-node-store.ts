import { create } from 'zustand';
import { PipelineNode, NewPipelineNode, NodeStatus, GenerationConfig } from '../types/pipeline-node';

interface GenerationProgress {
  total: number;
  completed: number;
  current: string | null;
}

interface PipelineNodeState {
  nodes: PipelineNode[];
  loading: boolean;
  saving: boolean;
  generating: boolean;
  videoGenerating: boolean;
  generationProgress: GenerationProgress;

  // Queries
  getNodesByAssetSet: (assetSetId: string) => PipelineNode[];

  // CRUD
  loadNodes: (projectId: string, assetSetId: string) => Promise<void>;
  addNode: (node: NewPipelineNode) => Promise<PipelineNode | null>;
  removeNode: (nodeId: string) => Promise<void>;
  reorderNodes: (assetSetId: string, nodeIds: string[]) => Promise<void>;
  updateNodeStatus: (nodeId: string, status: NodeStatus) => void;

  // Generation
  generateFromAssetSet: (projectId: string, assetSetId: string) => Promise<void>;

  // Video Generation
  generateVideos: (projectId: string, assetSetId: string, config: GenerationConfig) => Promise<void>;
  generateSingleVideo: (nodeId: string) => Promise<void>;
}

export const usePipelineNodeStore = create<PipelineNodeState>()((set, get) => ({
  nodes: [],
  loading: false,
  saving: false,
  generating: false,
  videoGenerating: false,
  generationProgress: { total: 0, completed: 0, current: null },

  getNodesByAssetSet: (assetSetId: string) => {
    return get().nodes.filter((n) => n.assetSetId === assetSetId);
  },

  loadNodes: async (projectId: string, assetSetId: string) => {
    set({ loading: true });
    try {
      const res = await fetch(
        `/api/pipeline-nodes?projectId=${encodeURIComponent(projectId)}&assetSetId=${encodeURIComponent(assetSetId)}`
      );
      if (res.ok) {
        const data: PipelineNode[] = await res.json();
        set({ nodes: data, loading: false });
      } else {
        console.error('Failed to load pipeline nodes:', res.statusText);
        set({ loading: false });
      }
    } catch (err) {
      console.error('Failed to load pipeline nodes:', err);
      set({ loading: false });
    }
  },

  addNode: async (node: NewPipelineNode) => {
    set({ saving: true });
    try {
      const res = await fetch('/api/pipeline-nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(node),
      });
      if (res.ok) {
        const created: PipelineNode = await res.json();
        set((state) => ({
          nodes: [...state.nodes, created].sort((a, b) => a.position - b.position),
          saving: false,
        }));
        return created;
      } else {
        console.error('Failed to add pipeline node:', res.statusText);
        set({ saving: false });
        return null;
      }
    } catch (err) {
      console.error('Failed to add pipeline node:', err);
      set({ saving: false });
      return null;
    }
  },

  removeNode: async (nodeId: string) => {
    set({ saving: true });
    try {
      const res = await fetch(`/api/pipeline-nodes?id=${encodeURIComponent(nodeId)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== nodeId),
          saving: false,
        }));
      } else {
        console.error('Failed to remove pipeline node:', res.statusText);
        set({ saving: false });
      }
    } catch (err) {
      console.error('Failed to remove pipeline node:', err);
      set({ saving: false });
    }
  },

  reorderNodes: async (assetSetId: string, nodeIds: string[]) => {
    set({ saving: true });
    try {
      const res = await fetch(
        `/api/pipeline-nodes?assetSetId=${encodeURIComponent(assetSetId)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nodeIds }),
        }
      );
      if (res.ok) {
        // Reorder local nodes to match the new order
        set((state) => {
          const nodeMap = new Map(state.nodes.map((n) => [n.id, n]));
          const reordered = nodeIds
            .map((id, idx) => {
              const node = nodeMap.get(id);
              return node ? { ...node, position: idx } : null;
            })
            .filter((n): n is PipelineNode => n !== null);

          // Keep nodes from other asset sets intact
          const otherNodes = state.nodes.filter((n) => n.assetSetId !== assetSetId);
          return { nodes: [...otherNodes, ...reordered], saving: false };
        });
      } else {
        console.error('Failed to reorder pipeline nodes:', res.statusText);
        set({ saving: false });
      }
    } catch (err) {
      console.error('Failed to reorder pipeline nodes:', err);
      set({ saving: false });
    }
  },

  updateNodeStatus: (nodeId: string, status: NodeStatus) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, status } : n
      ),
    }));
  },

  generateFromAssetSet: async (projectId: string, assetSetId: string) => {
    set({ generating: true });
    try {
      const res = await fetch('/api/pipeline-nodes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, assetSetId }),
      });
      if (res.ok) {
        const data: PipelineNode[] = await res.json();
        set({ nodes: data, generating: false });
      } else {
        const errBody = await res.json().catch(() => ({ error: res.statusText }));
        console.error('Failed to generate pipeline nodes:', errBody.error);
        set({ generating: false });
      }
    } catch (err) {
      console.error('Failed to generate pipeline nodes:', err);
      set({ generating: false });
    }
  },

  generateVideos: async (projectId: string, assetSetId: string, config: GenerationConfig) => {
    const { nodes } = get();

    // Filter eligible nodes: pending or ready, matching asset set
    const eligible = nodes
      .filter((n) => n.assetSetId === assetSetId && (n.status === 'pending' || n.status === 'ready'))
      .sort((a, b) => a.position - b.position);

    if (eligible.length === 0) return;

    set({
      videoGenerating: true,
      generationProgress: { total: eligible.length, completed: 0, current: null },
    });

    // Helper to generate a single node and update state
    const processNode = async (node: PipelineNode): Promise<void> => {
      // Update progress and optimistically set node to 'generating'
      set((state) => ({
        generationProgress: { ...state.generationProgress, current: node.id },
        nodes: state.nodes.map((n) =>
          n.id === node.id ? { ...n, status: 'generating' as NodeStatus } : n
        ),
      }));

      try {
        const res = await fetch('/api/pipeline-nodes/generate-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nodeId: node.id }),
        });

        if (res.ok) {
          const updated: PipelineNode = await res.json();
          set((state) => ({
            nodes: state.nodes.map((n) => (n.id === node.id ? updated : n)),
            generationProgress: {
              ...state.generationProgress,
              completed: state.generationProgress.completed + 1,
            },
          }));
        } else {
          const errBody = await res.json().catch(() => ({ error: res.statusText }));
          console.error(`Failed to generate video for node ${node.id}:`, errBody.error);
          set((state) => ({
            nodes: state.nodes.map((n) =>
              n.id === node.id ? { ...n, status: 'error' as NodeStatus } : n
            ),
            generationProgress: {
              ...state.generationProgress,
              completed: state.generationProgress.completed + 1,
            },
          }));
        }
      } catch (err) {
        console.error(`Failed to generate video for node ${node.id}:`, err);
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === node.id ? { ...n, status: 'error' as NodeStatus } : n
          ),
          generationProgress: {
            ...state.generationProgress,
            completed: state.generationProgress.completed + 1,
          },
        }));
      }
    };

    if (config.sequential || config.batchSize === 1) {
      // Sequential mode: one node at a time
      for (const node of eligible) {
        await processNode(node);
      }
    } else {
      // Batched mode: process in chunks of batchSize (max 3)
      const effectiveBatchSize = Math.min(Math.max(config.batchSize, 1), 3);
      for (let i = 0; i < eligible.length; i += effectiveBatchSize) {
        const batch = eligible.slice(i, i + effectiveBatchSize);
        await Promise.allSettled(batch.map(processNode));
      }
    }

    set({
      videoGenerating: false,
      generationProgress: { ...get().generationProgress, current: null },
    });
  },

  generateSingleVideo: async (nodeId: string) => {
    // Optimistically set node status to 'generating'
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, status: 'generating' as NodeStatus } : n
      ),
    }));

    try {
      const res = await fetch('/api/pipeline-nodes/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId }),
      });

      if (res.ok) {
        const updated: PipelineNode = await res.json();
        set((state) => ({
          nodes: state.nodes.map((n) => (n.id === nodeId ? updated : n)),
        }));
      } else {
        const errBody = await res.json().catch(() => ({ error: res.statusText }));
        console.error(`Failed to generate video for node ${nodeId}:`, errBody.error);
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === nodeId ? { ...n, status: 'error' as NodeStatus } : n
          ),
        }));
      }
    } catch (err) {
      console.error(`Failed to generate video for node ${nodeId}:`, err);
      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === nodeId ? { ...n, status: 'error' as NodeStatus } : n
        ),
      }));
    }
  },
}));
