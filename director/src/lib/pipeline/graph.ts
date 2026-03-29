// ─── Pipeline Graph Model ───────────────────────────────────────────
//
// Runtime graph instances: nodes with positions/config/status,
// edges connecting ports, and utility functions for graph manipulation.

// ─── Node Instance ──────────────────────────────────────────────────

export type NodeStatus = 'idle' | 'pending' | 'running' | 'done' | 'failed' | 'skipped';

export interface NodeInstance {
  id: string;
  type: string;               // References NodeTypeDef.type
  position: { x: number; y: number };
  config: Record<string, unknown>;
  // Runtime state (not persisted in saved pipelines)
  status?: NodeStatus;
  error?: string;
  outputs?: Record<string, unknown>;
  progressMessage?: string;
  progressPct?: number;
  startedAt?: number;
  completedAt?: number;
}

// ─── Edge ───────────────────────────────────────────────────────────

export interface Edge {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
}

// ─── Pipeline Graph ─────────────────────────────────────────────────

export interface PipelineGraph {
  id: string;
  name: string;
  description: string;
  nodes: NodeInstance[];
  edges: Edge[];
  createdAt?: string;
  updatedAt?: string;
}

// ─── Utility Functions ──────────────────────────────────────────────

function uid(prefix: string): string {
  // Use crypto.randomUUID when available, fallback to timestamp + random
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Create a new node instance from a type string */
export function createNode(
  type: string,
  position: { x: number; y: number },
  defaultConfig?: Record<string, unknown>,
): NodeInstance {
  return {
    id: uid('node'),
    type,
    position,
    config: defaultConfig ?? {},
    status: 'idle',
  };
}

/** Add a node to a graph, returning the new graph and node ID */
export function addNode(
  graph: PipelineGraph,
  node: NodeInstance,
): PipelineGraph {
  return { ...graph, nodes: [...graph.nodes, node] };
}

/** Remove a node and all its connected edges */
export function removeNode(graph: PipelineGraph, nodeId: string): PipelineGraph {
  return {
    ...graph,
    nodes: graph.nodes.filter((n) => n.id !== nodeId),
    edges: graph.edges.filter(
      (e) => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId,
    ),
  };
}

/** Create and add an edge. Returns null if duplicate. */
export function addEdge(
  graph: PipelineGraph,
  source: { nodeId: string; portId: string },
  target: { nodeId: string; portId: string },
): PipelineGraph {
  // Prevent duplicate edges to same input port (1 input = 1 source)
  const existing = graph.edges.find(
    (e) => e.targetNodeId === target.nodeId && e.targetPortId === target.portId,
  );
  // Remove existing connection to that input
  const filtered = existing
    ? graph.edges.filter((e) => e.id !== existing.id)
    : graph.edges;

  const edge: Edge = {
    id: uid('edge'),
    sourceNodeId: source.nodeId,
    sourcePortId: source.portId,
    targetNodeId: target.nodeId,
    targetPortId: target.portId,
  };

  return { ...graph, edges: [...filtered, edge] };
}

/** Remove an edge by ID */
export function removeEdge(graph: PipelineGraph, edgeId: string): PipelineGraph {
  return {
    ...graph,
    edges: graph.edges.filter((e) => e.id !== edgeId),
  };
}

/** Update a node's properties (position, config, status, etc.) */
export function updateNode(
  graph: PipelineGraph,
  nodeId: string,
  partial: Partial<NodeInstance>,
): PipelineGraph {
  return {
    ...graph,
    nodes: graph.nodes.map((n) =>
      n.id === nodeId ? { ...n, ...partial } : n,
    ),
  };
}

// ─── Graph Traversal ────────────────────────────────────────────────

/** Get all edges entering a node */
export function getIncomingEdges(graph: PipelineGraph, nodeId: string): Edge[] {
  return graph.edges.filter((e) => e.targetNodeId === nodeId);
}

/** Get all edges leaving a node */
export function getOutgoingEdges(graph: PipelineGraph, nodeId: string): Edge[] {
  return graph.edges.filter((e) => e.sourceNodeId === nodeId);
}

/** Get the IDs of all direct upstream nodes */
export function getUpstreamNodeIds(graph: PipelineGraph, nodeId: string): string[] {
  return getIncomingEdges(graph, nodeId).map((e) => e.sourceNodeId);
}

/** Get the IDs of all direct downstream nodes */
export function getDownstreamNodeIds(graph: PipelineGraph, nodeId: string): string[] {
  return getOutgoingEdges(graph, nodeId).map((e) => e.targetNodeId);
}

/**
 * Topological sort using Kahn's algorithm.
 * Returns node IDs in execution order.
 * Throws if the graph contains a cycle.
 */
export function topologicalSort(graph: PipelineGraph): string[] {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const node of graph.nodes) {
    inDegree.set(node.id, 0);
    adj.set(node.id, []);
  }

  for (const edge of graph.edges) {
    inDegree.set(edge.targetNodeId, (inDegree.get(edge.targetNodeId) ?? 0) + 1);
    adj.get(edge.sourceNodeId)?.push(edge.targetNodeId);
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);
    for (const neighbor of adj.get(current) ?? []) {
      const newDeg = (inDegree.get(neighbor) ?? 0) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  if (sorted.length !== graph.nodes.length) {
    throw new Error('Pipeline graph contains a cycle — cannot execute.');
  }

  return sorted;
}

/**
 * Assigns execution levels (0 = roots, 1 = their children, etc.)
 * Nodes at the same level can execute in parallel.
 */
export function assignExecutionLevels(graph: PipelineGraph): Map<string, number> {
  const sorted = topologicalSort(graph);
  const levels = new Map<string, number>();

  for (const nodeId of sorted) {
    const upstreamIds = getUpstreamNodeIds(graph, nodeId);
    if (upstreamIds.length === 0) {
      levels.set(nodeId, 0);
    } else {
      const maxParentLevel = Math.max(
        ...upstreamIds.map((id) => levels.get(id) ?? 0),
      );
      levels.set(nodeId, maxParentLevel + 1);
    }
  }

  return levels;
}

/**
 * Get all node IDs reachable downstream from a given node.
 * Used by gate nodes to determine which nodes to skip on failure.
 */
export function getReachableDownstream(graph: PipelineGraph, nodeId: string): Set<string> {
  const visited = new Set<string>();
  const stack = [nodeId];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const downstream of getDownstreamNodeIds(graph, current)) {
      stack.push(downstream);
    }
  }

  visited.delete(nodeId); // Don't include the source node itself
  return visited;
}

/**
 * Reset all runtime state on all nodes (for re-execution or save).
 */
export function resetRuntimeState(graph: PipelineGraph): PipelineGraph {
  return {
    ...graph,
    nodes: graph.nodes.map((n) => ({
      ...n,
      status: 'idle' as const,
      error: undefined,
      outputs: undefined,
      progressMessage: undefined,
      progressPct: undefined,
      startedAt: undefined,
      completedAt: undefined,
    })),
  };
}
