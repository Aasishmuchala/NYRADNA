'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { PipelineGraph, NodeInstance, NodeStatus } from '@/lib/pipeline/graph';
import {
  createNode,
  addNode as graphAddNode,
  removeNode as graphRemoveNode,
  addEdge as graphAddEdge,
  removeEdge as graphRemoveEdge,
  updateNode as graphUpdateNode,
  resetRuntimeState,
} from '@/lib/pipeline/graph';
import { getDefaultConfig, NODE_TYPE_REGISTRY } from '@/lib/pipeline/nodeTypes';
import { executePipeline, executePipelineFrom } from '@/lib/pipeline/executor';
import { revokePipelineBlobUrls } from '@/lib/pipeline/nodeExecutors';
import { savePipeline } from '@/lib/pipeline/serialization';
import type { ExecutionContext } from '@/lib/pipeline/types';
import { useWizard } from '@/context/WizardContext';

// ─── Types ──────────────────────────────────────────────────────────

interface PipelineContextType {
  graph: PipelineGraph;
  setGraph: (graph: PipelineGraph) => void;
  // Node operations
  addNode: (type: string, position: { x: number; y: number }) => string;
  removeNode: (nodeId: string) => void;
  updateNodeConfig: (nodeId: string, config: Record<string, unknown>) => void;
  updateNodePosition: (nodeId: string, position: { x: number; y: number }) => void;
  // Edge operations
  addEdge: (source: { nodeId: string; portId: string }, target: { nodeId: string; portId: string }) => boolean;
  removeEdge: (edgeId: string) => void;
  // Selection
  selectedNodeId: string | null;
  selectNode: (id: string | null) => void;
  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  // Execution
  execute: () => Promise<void>;
  executeFrom: (nodeId: string) => Promise<void>;
  abort: () => void;
  isExecuting: boolean;
}

const DEFAULT_GRAPH: PipelineGraph = {
  id: 'empty',
  name: 'New Pipeline',
  description: '',
  nodes: [],
  edges: [],
};

// ─── Context ────────────────────────────────────────────────────────

const PipelineContext = createContext<PipelineContextType | null>(null);

export function usePipeline(): PipelineContextType {
  const ctx = useContext(PipelineContext);
  if (!ctx) throw new Error('usePipeline must be used within PipelineProvider');
  return ctx;
}

// ─── Provider ───────────────────────────────────────────────────────

export function PipelineProvider({
  children,
  initialGraph,
}: {
  children: React.ReactNode;
  initialGraph?: PipelineGraph;
}) {
  const { state, update } = useWizard();
  const [graph, setGraphState] = useState<PipelineGraph>(initialGraph ?? DEFAULT_GRAPH);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const graphRef = useRef(graph);
  graphRef.current = graph;
  const isExecutingRef = useRef(false);

  // ── Undo/Redo Stack ──────────────────────────────────────────────
  const MAX_UNDO = 50;
  const undoStack = useRef<PipelineGraph[]>([]);
  const redoStack = useRef<PipelineGraph[]>([]);

  /** Push current graph to undo stack before a mutation */
  const pushUndo = useCallback(() => {
    undoStack.current = [...undoStack.current.slice(-(MAX_UNDO - 1)), graphRef.current];
    redoStack.current = []; // Clear redo on new action
  }, []);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  /** Wrapper that pushes undo before applying a graph mutation */
  const setGraphWithUndo = useCallback((updater: (prev: PipelineGraph) => PipelineGraph) => {
    pushUndo();
    setGraphState(updater);
    setCanUndo(true);
    setCanRedo(false);
  }, [pushUndo]);

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    const prev = undoStack.current.pop()!;
    redoStack.current.push(graphRef.current);
    setGraphState(prev);
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(true);
  }, []);

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    const next = redoStack.current.pop()!;
    undoStack.current.push(graphRef.current);
    setGraphState(next);
    setCanUndo(true);
    setCanRedo(redoStack.current.length > 0);
  }, []);

  // Abort execution on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      isExecutingRef.current = false;
    };
  }, []);

  const setGraph = useCallback((g: PipelineGraph) => {
    pushUndo();
    setGraphState(g);
    setCanUndo(true);
    setCanRedo(false);
  }, [pushUndo]);

  // Auto-save: debounce 3 seconds after any graph change
  useEffect(() => {
    if (graph.nodes.length === 0) return;
    const timer = setTimeout(() => {
      savePipeline(graph);
    }, 3000);
    return () => clearTimeout(timer);
  }, [graph]);

  // ── Node operations ─────────────────────────────────────────────

  const addNodeFn = useCallback((type: string, position: { x: number; y: number }): string => {
    const config = getDefaultConfig(type);
    const node = createNode(type, position, config);
    setGraphWithUndo((prev) => graphAddNode(prev, node));
    return node.id;
  }, [setGraphWithUndo]);

  const removeNodeFn = useCallback((nodeId: string) => {
    setGraphWithUndo((prev) => graphRemoveNode(prev, nodeId));
    setSelectedNodeId((prev) => (prev === nodeId ? null : prev));
  }, [setGraphWithUndo]);

  const updateNodeConfig = useCallback((nodeId: string, config: Record<string, unknown>) => {
    setGraphWithUndo((prev) => graphUpdateNode(prev, nodeId, { config }));
  }, [setGraphWithUndo]);

  // Position updates happen on every mouse move — don't push undo for each pixel
  const updateNodePosition = useCallback((nodeId: string, position: { x: number; y: number }) => {
    setGraphState((prev) => graphUpdateNode(prev, nodeId, { position }));
  }, []);

  // ── Edge operations ─────────────────────────────────────────────

  const addEdgeFn = useCallback(
    (source: { nodeId: string; portId: string }, target: { nodeId: string; portId: string }): boolean => {
      // Type-check before adding — read from latest graph state via callback
      let valid = false;
      setGraphWithUndo((prev) => {
        const sourceNode = prev.nodes.find((n) => n.id === source.nodeId);
        const targetNode = prev.nodes.find((n) => n.id === target.nodeId);
        if (!sourceNode || !targetNode) return prev;

        const sourceType = NODE_TYPE_REGISTRY.get(sourceNode.type);
        const targetType = NODE_TYPE_REGISTRY.get(targetNode.type);
        if (!sourceType || !targetType) return prev;

        valid = true;
        return graphAddEdge(prev, source, target);
      });
      return valid;
    },
    [setGraphWithUndo],
  );

  const removeEdgeFn = useCallback((edgeId: string) => {
    setGraphWithUndo((prev) => graphRemoveEdge(prev, edgeId));
  }, [setGraphWithUndo]);

  // ── Execution ───────────────────────────────────────────────────

  const execute = useCallback(async () => {
    if (isExecutingRef.current) return;
    isExecutingRef.current = true;
    setIsExecuting(true);

    const controller = new AbortController();
    abortRef.current = controller;

    // Reset all node statuses
    setGraphState((prev) => resetRuntimeState(prev));

    // Snapshot the graph at execution start
    const currentGraph = graphRef.current;

    const ctx: ExecutionContext = {
      signal: controller.signal,
      wizardState: state,
      updateWizardState: (partial) => update(partial),
      onProgress: (nodeId, message, pct) => {
        setGraphState((prev) =>
          graphUpdateNode(prev, nodeId, { progressMessage: message, progressPct: pct }),
        );
      },
      getNodeOutput: () => undefined, // Filled in by executor
    };

    try {
      await executePipeline(currentGraph, {
        ctx,
        onNodeStatusChange: (nodeId, status, data) => {
          const partial: Partial<NodeInstance> = { status: status as NodeStatus };
          if (data?.error) partial.error = data.error;
          if (data?.outputs) partial.outputs = data.outputs;
          if (data?.message) partial.progressMessage = data.message;
          if (status === 'running') partial.startedAt = Date.now();
          if (status === 'done' || status === 'failed') partial.completedAt = Date.now();
          setGraphState((prev) => graphUpdateNode(prev, nodeId, partial));
        },
      });
    } catch (err) {
      console.error('[Pipeline] Execution error:', err);
    } finally {
      isExecutingRef.current = false;
      setIsExecuting(false);
      abortRef.current = null;
      // Free memory from blob URLs created during execution
      revokePipelineBlobUrls();
    }
  }, [state, update]);

  const executeFrom = useCallback(async (nodeId: string) => {
    if (isExecutingRef.current) return;
    isExecutingRef.current = true;
    setIsExecuting(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const currentGraph = graphRef.current;

    // Collect existing outputs from completed nodes
    const existingOutputs = new Map<string, Record<string, unknown>>();
    for (const node of currentGraph.nodes) {
      if (node.outputs && node.id !== nodeId) {
        existingOutputs.set(node.id, node.outputs);
      }
    }

    const ctx: ExecutionContext = {
      signal: controller.signal,
      wizardState: state,
      updateWizardState: (partial) => update(partial),
      onProgress: (nId, message, pct) => {
        setGraphState((prev) =>
          graphUpdateNode(prev, nId, { progressMessage: message, progressPct: pct }),
        );
      },
      getNodeOutput: () => undefined,
    };

    try {
      await executePipelineFrom(currentGraph, nodeId, {
        ctx,
        onNodeStatusChange: (nId, status, data) => {
          const partial: Partial<NodeInstance> = { status: status as NodeStatus };
          if (data?.error) partial.error = data.error;
          if (data?.outputs) partial.outputs = data.outputs;
          if (status === 'running') partial.startedAt = Date.now();
          if (status === 'done' || status === 'failed') partial.completedAt = Date.now();
          setGraphState((prev) => graphUpdateNode(prev, nId, partial));
        },
      }, existingOutputs);
    } catch (err) {
      console.error('[Pipeline] Execution from node error:', err);
    } finally {
      isExecutingRef.current = false;
      setIsExecuting(false);
      abortRef.current = null;
      revokePipelineBlobUrls();
    }
  }, [state, update]);

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return (
    <PipelineContext.Provider
      value={{
        graph,
        setGraph,
        addNode: addNodeFn,
        removeNode: removeNodeFn,
        updateNodeConfig,
        updateNodePosition,
        addEdge: addEdgeFn,
        removeEdge: removeEdgeFn,
        selectedNodeId,
        selectNode: setSelectedNodeId,
        undo,
        redo,
        canUndo,
        canRedo,
        execute,
        executeFrom,
        abort,
        isExecuting,
      }}
    >
      {children}
    </PipelineContext.Provider>
  );
}
