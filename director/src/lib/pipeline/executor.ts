// ─── Pipeline Execution Engine ──────────────────────────────────────
//
// Executes a PipelineGraph as a DAG:
// 1. Topological sort → execution levels
// 2. Level-by-level parallel execution
// 3. Gate nodes can skip downstream on failure
// 4. Gate retry: re-runs upstream node then retries gate
// 5. Abort support via AbortController

import type { PipelineGraph, NodeInstance, NodeStatus } from './graph';
import {
  topologicalSort,
  assignExecutionLevels,
  getIncomingEdges,
  getReachableDownstream,
  getUpstreamNodeIds,
} from './graph';
import type { ExecutionContext, NodeTypeDef } from './types';
import { NODE_TYPE_REGISTRY } from './nodeTypes';

// ─── Types ──────────────────────────────────────────────────────────

export type NodeStatusCallback = (
  nodeId: string,
  status: NodeStatus,
  data?: { outputs?: Record<string, unknown>; error?: string; message?: string; pct?: number },
) => void;

export interface ExecutionOptions {
  /** Called on every node status transition */
  onNodeStatusChange: NodeStatusCallback;
  /** Execution context with abort signal, wizard state, etc. */
  ctx: ExecutionContext;
}

// ─── Executor ───────────────────────────────────────────────────────

/**
 * Execute the full pipeline graph.
 *
 * - Nodes are executed level-by-level (parallel within a level).
 * - Gate nodes that output `pass === false` skip all downstream nodes.
 * - Gate nodes with `retryOnFail` re-run their upstream generator node.
 * - Transient errors (429, timeout) are retried with exponential backoff.
 */
export async function executePipeline(
  graph: PipelineGraph,
  options: ExecutionOptions,
): Promise<void> {
  const { onNodeStatusChange, ctx } = options;

  // Validate we have nodes
  if (graph.nodes.length === 0) return;

  // Topological sort (throws on cycle)
  const sortedIds = topologicalSort(graph);
  const levels = assignExecutionLevels(graph);

  // Group by level
  const maxLevel = Math.max(...Array.from(levels.values()));
  const levelGroups: string[][] = Array.from({ length: maxLevel + 1 }, () => []);
  for (const nodeId of sortedIds) {
    levelGroups[levels.get(nodeId) ?? 0].push(nodeId);
  }

  // Track outputs and skipped nodes
  const nodeOutputs = new Map<string, Record<string, unknown>>();
  const skippedNodes = new Set<string>();

  // Mark all nodes as pending
  for (const node of graph.nodes) {
    onNodeStatusChange(node.id, 'pending');
  }

  // Context helper: get output from a completed node
  const getNodeOutput = (nodeId: string, portId: string): unknown => {
    return nodeOutputs.get(nodeId)?.[portId];
  };
  const enrichedCtx: ExecutionContext = { ...ctx, getNodeOutput };

  // Execute level by level
  for (const levelNodeIds of levelGroups) {
    if (ctx.signal.aborted) break;

    const executableIds = levelNodeIds.filter((id) => !skippedNodes.has(id));

    // Mark skipped nodes
    for (const id of levelNodeIds) {
      if (skippedNodes.has(id)) {
        onNodeStatusChange(id, 'skipped');
      }
    }

    if (executableIds.length === 0) continue;

    // Execute all nodes at this level in parallel
    const results = await Promise.allSettled(
      executableIds.map((nodeId) =>
        executeNode(graph, nodeId, nodeOutputs, skippedNodes, enrichedCtx, onNodeStatusChange),
      ),
    );

    // Log any unexpected rejections (executeNode handles its own errors,
    // but if it throws unexpectedly, we catch here)
    for (let i = 0; i < results.length; i++) {
      if (results[i].status === 'rejected') {
        const reason = (results[i] as PromiseRejectedResult).reason;
        const msg = reason instanceof Error ? reason.message : String(reason);
        onNodeStatusChange(executableIds[i], 'failed', { error: msg });
      }
    }
  }
}

// ─── Single Node Execution ──────────────────────────────────────────

async function executeNode(
  graph: PipelineGraph,
  nodeId: string,
  nodeOutputs: Map<string, Record<string, unknown>>,
  skippedNodes: Set<string>,
  ctx: ExecutionContext,
  onStatus: NodeStatusCallback,
): Promise<void> {
  const node = graph.nodes.find((n) => n.id === nodeId);
  if (!node) return;

  const typeDef = NODE_TYPE_REGISTRY.get(node.type);
  if (!typeDef) {
    onStatus(nodeId, 'failed', { error: `Unknown node type: ${node.type}` });
    return;
  }

  // Collect inputs from upstream edges
  const inputs = collectInputs(graph, node, nodeOutputs);

  // Mark as running
  onStatus(nodeId, 'running');

  // Create a per-node context that binds nodeId to onProgress
  const nodeCtx: ExecutionContext = {
    ...ctx,
    onProgress: (_, message, pct) => ctx.onProgress(nodeId, message, pct),
  };

  try {
    if (ctx.signal.aborted) throw new Error('Pipeline aborted');

    let outputs: Record<string, unknown>;

    // ForEach mode: execute once per item in first array input
    if (typeDef.forEach && hasArrayInput(typeDef, inputs)) {
      outputs = await executeForEach(typeDef, inputs, node.config, nodeCtx, nodeId, onStatus);
    } else {
      outputs = await executeWithRetry(typeDef, inputs, node.config, nodeCtx, nodeId, onStatus);
    }

    // Store outputs
    nodeOutputs.set(nodeId, outputs);

    // Gate handling: if this is a gate node and it failed, skip downstream
    if (typeDef.category === 'gate' && outputs.pass === false) {
      const shouldRetry = node.config.retryOnFail === true;
      const maxRetries = (node.config.maxRetries as number) ?? 3;

      if (shouldRetry) {
        // Try re-running upstream generation node then retry the gate
        const retried = await retryGateUpstream(
          graph, nodeId, typeDef, node, nodeOutputs, skippedNodes, ctx, onStatus, maxRetries,
        );
        if (retried) {
          // Gate passed after retry
          onStatus(nodeId, 'done', { outputs: nodeOutputs.get(nodeId) });
          return;
        }
      }

      // Gate failed — skip all downstream nodes
      const downstream = getReachableDownstream(graph, nodeId);
      for (const downId of downstream) {
        // Only skip if ALL paths to this node go through the failed gate
        // Simple heuristic: skip all reachable downstream
        skippedNodes.add(downId);
      }

      onStatus(nodeId, 'done', {
        outputs,
        message: `Gate failed (score: ${outputs.score ?? 'N/A'}). Downstream nodes skipped.`,
      });
      return;
    }

    onStatus(nodeId, 'done', { outputs });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    onStatus(nodeId, 'failed', { error: message });
  }
}

// ─── Input Collection ───────────────────────────────────────────────

function collectInputs(
  graph: PipelineGraph,
  node: NodeInstance,
  nodeOutputs: Map<string, Record<string, unknown>>,
): Record<string, unknown> {
  const inputs: Record<string, unknown> = {};

  // Start with default values from port definitions
  const typeDef = NODE_TYPE_REGISTRY.get(node.type);
  if (typeDef) {
    for (const port of typeDef.inputs) {
      if (port.default !== undefined) {
        inputs[port.id] = port.default;
      }
    }
  }

  // Override with actual upstream outputs
  const incoming = getIncomingEdges(graph, node.id);
  for (const edge of incoming) {
    const upstreamOutputs = nodeOutputs.get(edge.sourceNodeId);
    if (upstreamOutputs && upstreamOutputs[edge.sourcePortId] !== undefined) {
      let value = upstreamOutputs[edge.sourcePortId];

      // Auto-wrap: if target port expects an array but value is a single item, wrap it
      if (typeDef) {
        const targetPort = typeDef.inputs.find((p) => p.id === edge.targetPortId);
        if (targetPort?.dataType.endsWith('[]') && !Array.isArray(value)) {
          value = [value];
        }
      }

      inputs[edge.targetPortId] = value;
    }
  }

  return inputs;
}

// ─── ForEach Execution ──────────────────────────────────────────────

function hasArrayInput(typeDef: NodeTypeDef, inputs: Record<string, unknown>): boolean {
  for (const port of typeDef.inputs) {
    if (port.dataType.endsWith('[]') && Array.isArray(inputs[port.id])) {
      return true;
    }
  }
  return false;
}

async function executeForEach(
  typeDef: NodeTypeDef,
  inputs: Record<string, unknown>,
  config: Record<string, unknown>,
  ctx: ExecutionContext,
  nodeId: string,
  onStatus: NodeStatusCallback,
): Promise<Record<string, unknown>> {
  // Find the array input
  let arrayPortId: string | null = null;
  let items: unknown[] = [];

  for (const port of typeDef.inputs) {
    if (port.dataType.endsWith('[]') && Array.isArray(inputs[port.id])) {
      arrayPortId = port.id;
      items = inputs[port.id] as unknown[];
      break;
    }
  }

  if (!arrayPortId || items.length === 0) {
    return typeDef.execute(inputs, config, ctx);
  }

  // Execute once per item, collecting outputs into arrays
  const allOutputs: Record<string, unknown[]> = {};
  for (const port of typeDef.outputs) {
    allOutputs[port.id] = [];
  }

  for (let i = 0; i < items.length; i++) {
    if (ctx.signal.aborted) throw new Error('Pipeline aborted');

    onStatus(nodeId, 'running', { message: `Processing ${i + 1}/${items.length}`, pct: (i / items.length) * 100 });

    const itemInputs = { ...inputs, [arrayPortId]: items[i] };
    const result = await executeWithRetry(typeDef, itemInputs, config, ctx, nodeId, onStatus);

    for (const port of typeDef.outputs) {
      allOutputs[port.id].push(result[port.id]);
    }
  }

  // Convert single-element arrays to arrays
  const outputs: Record<string, unknown> = {};
  for (const port of typeDef.outputs) {
    outputs[port.id] = allOutputs[port.id];
  }

  return outputs;
}

// ─── Retry Logic ────────────────────────────────────────────────────

const MAX_TRANSIENT_RETRIES = 3;
const BASE_BACKOFF_MS = 4000;

async function executeWithRetry(
  typeDef: NodeTypeDef,
  inputs: Record<string, unknown>,
  config: Record<string, unknown>,
  ctx: ExecutionContext,
  nodeId: string,
  onStatus: NodeStatusCallback,
): Promise<Record<string, unknown>> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_TRANSIENT_RETRIES; attempt++) {
    try {
      return await typeDef.execute(inputs, config, ctx);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Only retry on transient errors
      if (!isTransientError(lastError)) throw lastError;

      const backoff = BASE_BACKOFF_MS * Math.pow(2, attempt);
      onStatus(nodeId, 'running', {
        message: `Retry ${attempt + 1}/${MAX_TRANSIENT_RETRIES} in ${Math.round(backoff / 1000)}s...`,
      });

      await sleep(backoff, ctx.signal);
    }
  }

  throw lastError ?? new Error('Max retries exceeded');
}

function isTransientError(err: Error): boolean {
  const msg = err.message.toLowerCase();
  return msg.includes('429') || msg.includes('rate limit') ||
    msg.includes('timeout') || msg.includes('econnreset') ||
    msg.includes('502') || msg.includes('503');
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(new Error('Aborted')); return; }
    const onAbort = () => { clearTimeout(timer); reject(new Error('Aborted')); };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

// ─── Gate Retry (re-run upstream generator) ─────────────────────────

async function retryGateUpstream(
  graph: PipelineGraph,
  gateNodeId: string,
  gateTypeDef: NodeTypeDef,
  gateNode: NodeInstance,
  nodeOutputs: Map<string, Record<string, unknown>>,
  skippedNodes: Set<string>,
  ctx: ExecutionContext,
  onStatus: NodeStatusCallback,
  maxRetries: number,
): Promise<boolean> {
  // Find the upstream generation node (the one feeding the gate's primary input)
  const upstreamIds = getUpstreamNodeIds(graph, gateNodeId);
  if (upstreamIds.length === 0) return false;

  // Find the generation node (first upstream that's a generation category)
  let genNodeId: string | null = null;
  for (const upId of upstreamIds) {
    const upNode = graph.nodes.find((n) => n.id === upId);
    if (!upNode) continue;
    const upType = NODE_TYPE_REGISTRY.get(upNode.type);
    if (upType?.category === 'generation') {
      genNodeId = upId;
      break;
    }
  }

  if (!genNodeId) return false;

  const genNode = graph.nodes.find((n) => n.id === genNodeId)!;
  const genType = NODE_TYPE_REGISTRY.get(genNode.type);
  if (!genType) return false;

  for (let retry = 0; retry < maxRetries; retry++) {
    if (ctx.signal.aborted) return false;

    onStatus(gateNodeId, 'running', {
      message: `Gate retry ${retry + 1}/${maxRetries}: re-generating upstream...`,
    });

    try {
      // Re-run the generation node
      const genInputs = collectInputs(graph, genNode, nodeOutputs);
      const genOutputs = await executeWithRetry(genType, genInputs, genNode.config, ctx, genNodeId, onStatus);
      nodeOutputs.set(genNodeId, genOutputs);

      // Re-run the gate
      const gateInputs = collectInputs(graph, gateNode, nodeOutputs);
      const gateOutputs = await gateTypeDef.execute(gateInputs, gateNode.config, ctx);

      if (gateOutputs.pass === true) {
        nodeOutputs.set(gateNodeId, gateOutputs);
        return true; // Gate passed!
      }
    } catch (err) {
      console.warn(`[Pipeline] Gate retry ${retry + 1} failed:`, err instanceof Error ? err.message : err);
    }
  }

  return false; // All retries exhausted
}

// ─── Public Helpers ─────────────────────────────────────────────────

/**
 * Execute pipeline from a specific node onwards (for "retry from here" UI).
 * Re-executes the target node and all its downstream dependents.
 */
export async function executePipelineFrom(
  graph: PipelineGraph,
  startNodeId: string,
  options: ExecutionOptions,
  existingOutputs?: Map<string, Record<string, unknown>>,
): Promise<void> {
  const { onNodeStatusChange, ctx } = options;

  const downstream = getReachableDownstream(graph, startNodeId);
  downstream.add(startNodeId);

  // Topological sort the full graph, then filter to only downstream nodes
  const sortedIds = topologicalSort(graph).filter((id) => downstream.has(id));
  const levels = assignExecutionLevels(graph);

  const maxLevel = Math.max(...sortedIds.map((id) => levels.get(id) ?? 0));
  const levelGroups: string[][] = Array.from({ length: maxLevel + 1 }, () => []);
  for (const nodeId of sortedIds) {
    levelGroups[levels.get(nodeId) ?? 0].push(nodeId);
  }

  // Seed with existing outputs from already-completed upstream nodes
  const nodeOutputs = new Map<string, Record<string, unknown>>(existingOutputs ?? []);
  const skippedNodes = new Set<string>();

  const getNodeOutput = (nodeId: string, portId: string): unknown => {
    return nodeOutputs.get(nodeId)?.[portId];
  };
  const enrichedCtx: ExecutionContext = { ...ctx, getNodeOutput };

  for (const levelNodeIds of levelGroups) {
    if (ctx.signal.aborted) break;
    const executableIds = levelNodeIds.filter((id) => !skippedNodes.has(id));
    for (const id of levelNodeIds) {
      if (skippedNodes.has(id)) onNodeStatusChange(id, 'skipped');
    }
    if (executableIds.length === 0) continue;

    const results = await Promise.allSettled(
      executableIds.map((nodeId) =>
        executeNode(graph, nodeId, nodeOutputs, skippedNodes, enrichedCtx, onNodeStatusChange),
      ),
    );
    for (let i = 0; i < results.length; i++) {
      if (results[i].status === 'rejected') {
        const reason = (results[i] as PromiseRejectedResult).reason;
        const msg = reason instanceof Error ? reason.message : String(reason);
        onNodeStatusChange(executableIds[i], 'failed', { error: msg });
      }
    }
  }
}
