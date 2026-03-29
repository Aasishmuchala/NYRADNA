// ─── Pipeline Graph Validation ──────────────────────────────────────
//
// Validates a pipeline graph before execution:
// - Type compatibility on all edges
// - Cycle detection
// - Required inputs connected
// - No orphan nodes (optional warning)

import type { PipelineGraph } from './graph';
import { topologicalSort, getIncomingEdges } from './graph';
import type { NodeTypeDef, PortDef } from './types';
import { arePortsCompatible } from './types';

// ─── Validation Result ──────────────────────────────────────────────

export interface ValidationIssue {
  severity: 'error' | 'warning';
  nodeId?: string;
  edgeId?: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

// ─── Validators ─────────────────────────────────────────────────────

/**
 * Validate the full pipeline graph.
 * @param graph The pipeline graph to validate
 * @param registry Map of node type string → NodeTypeDef for looking up port definitions
 */
export function validateGraph(
  graph: PipelineGraph,
  registry: Map<string, NodeTypeDef>,
): ValidationResult {
  const issues: ValidationIssue[] = [];

  // 1. Check for unknown node types
  for (const node of graph.nodes) {
    if (!registry.has(node.type)) {
      issues.push({
        severity: 'error',
        nodeId: node.id,
        message: `Unknown node type "${node.type}"`,
      });
    }
  }

  // 2. Cycle detection
  try {
    topologicalSort(graph);
  } catch {
    issues.push({
      severity: 'error',
      message: 'Pipeline contains a cycle — execution order is undefined.',
    });
  }

  // 3. Edge type compatibility
  for (const edge of graph.edges) {
    const sourceNode = graph.nodes.find((n) => n.id === edge.sourceNodeId);
    const targetNode = graph.nodes.find((n) => n.id === edge.targetNodeId);

    if (!sourceNode || !targetNode) {
      issues.push({
        severity: 'error',
        edgeId: edge.id,
        message: `Edge references missing node(s)`,
      });
      continue;
    }

    const sourceType = registry.get(sourceNode.type);
    const targetType = registry.get(targetNode.type);
    if (!sourceType || !targetType) continue; // Already caught above

    const sourcePort = sourceType.outputs.find((p) => p.id === edge.sourcePortId);
    const targetPort = targetType.inputs.find((p) => p.id === edge.targetPortId);

    if (!sourcePort) {
      issues.push({
        severity: 'error',
        edgeId: edge.id,
        nodeId: sourceNode.id,
        message: `Output port "${edge.sourcePortId}" not found on ${sourceType.label}`,
      });
      continue;
    }

    if (!targetPort) {
      issues.push({
        severity: 'error',
        edgeId: edge.id,
        nodeId: targetNode.id,
        message: `Input port "${edge.targetPortId}" not found on ${targetType.label}`,
      });
      continue;
    }

    if (!arePortsCompatible(sourcePort.dataType, targetPort.dataType)) {
      issues.push({
        severity: 'error',
        edgeId: edge.id,
        message: `Type mismatch: ${sourceType.label}.${sourcePort.id} (${sourcePort.dataType}) → ${targetType.label}.${targetPort.id} (${targetPort.dataType})`,
      });
    }
  }

  // 4. Required inputs must be connected
  for (const node of graph.nodes) {
    const typeDef = registry.get(node.type);
    if (!typeDef) continue;

    const incoming = getIncomingEdges(graph, node.id);
    const connectedPorts = new Set(incoming.map((e) => e.targetPortId));

    for (const port of typeDef.inputs) {
      if (port.required && !connectedPorts.has(port.id) && port.default === undefined) {
        issues.push({
          severity: 'error',
          nodeId: node.id,
          message: `Required input "${port.label}" is not connected on ${typeDef.label}`,
        });
      }
    }
  }

  // 5. Orphan detection (nodes with no edges at all — just a warning)
  for (const node of graph.nodes) {
    const hasEdge = graph.edges.some(
      (e) => e.sourceNodeId === node.id || e.targetNodeId === node.id,
    );
    if (!hasEdge && graph.nodes.length > 1) {
      issues.push({
        severity: 'warning',
        nodeId: node.id,
        message: `Node "${registry.get(node.type)?.label ?? node.type}" is disconnected`,
      });
    }
  }

  return {
    valid: issues.filter((i) => i.severity === 'error').length === 0,
    issues,
  };
}

/**
 * Quick check: can this specific edge be created?
 * Returns null if valid, or an error message string.
 */
export function canConnect(
  graph: PipelineGraph,
  registry: Map<string, NodeTypeDef>,
  sourceNodeId: string,
  sourcePortId: string,
  targetNodeId: string,
  targetPortId: string,
): string | null {
  // Can't connect to self
  if (sourceNodeId === targetNodeId) {
    return 'Cannot connect a node to itself';
  }

  const sourceNode = graph.nodes.find((n) => n.id === sourceNodeId);
  const targetNode = graph.nodes.find((n) => n.id === targetNodeId);
  if (!sourceNode || !targetNode) return 'Node not found';

  const sourceType = registry.get(sourceNode.type);
  const targetType = registry.get(targetNode.type);
  if (!sourceType || !targetType) return 'Unknown node type';

  const sourcePort = sourceType.outputs.find((p: PortDef) => p.id === sourcePortId);
  const targetPort = targetType.inputs.find((p: PortDef) => p.id === targetPortId);
  if (!sourcePort) return `Output port "${sourcePortId}" not found`;
  if (!targetPort) return `Input port "${targetPortId}" not found`;

  if (!arePortsCompatible(sourcePort.dataType, targetPort.dataType)) {
    return `Type mismatch: ${sourcePort.dataType} → ${targetPort.dataType}`;
  }

  // Check if adding this edge would create a cycle
  // Quick test: is targetNode already upstream of sourceNode?
  const visited = new Set<string>();
  const stack = [targetNodeId];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === sourceNodeId) return 'This connection would create a cycle';
    if (visited.has(current)) continue;
    visited.add(current);
    for (const edge of graph.edges) {
      if (edge.sourceNodeId === current) {
        stack.push(edge.targetNodeId);
      }
    }
  }

  return null; // Valid connection
}
