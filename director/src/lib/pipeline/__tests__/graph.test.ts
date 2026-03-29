import { describe, it, expect } from 'vitest';
import {
  createNode,
  addNode,
  removeNode,
  addEdge,
  removeEdge,
  updateNode,
  topologicalSort,
  assignExecutionLevels,
  getReachableDownstream,
  getIncomingEdges,
  getOutgoingEdges,
  getUpstreamNodeIds,
  getDownstreamNodeIds,
  resetRuntimeState,
} from '../graph';
import type { PipelineGraph } from '../graph';

// ─── Helpers ────────────────────────────────────────────────────────

function emptyGraph(): PipelineGraph {
  return { id: 'test', name: 'Test', description: '', nodes: [], edges: [] };
}

function linearGraph(): PipelineGraph {
  // A → B → C
  const a = createNode('A', { x: 0, y: 0 });
  const b = createNode('B', { x: 100, y: 0 });
  const c = createNode('C', { x: 200, y: 0 });
  let g = emptyGraph();
  g = addNode(g, a);
  g = addNode(g, b);
  g = addNode(g, c);
  g = addEdge(g, { nodeId: a.id, portId: 'out' }, { nodeId: b.id, portId: 'in' });
  g = addEdge(g, { nodeId: b.id, portId: 'out' }, { nodeId: c.id, portId: 'in' });
  return g;
}

function diamondGraph(): PipelineGraph {
  //     A
  //    / \
  //   B   C
  //    \ /
  //     D
  const a = createNode('A', { x: 0, y: 0 });
  const b = createNode('B', { x: -50, y: 100 });
  const c = createNode('C', { x: 50, y: 100 });
  const d = createNode('D', { x: 0, y: 200 });
  let g = emptyGraph();
  g = addNode(g, a);
  g = addNode(g, b);
  g = addNode(g, c);
  g = addNode(g, d);
  g = addEdge(g, { nodeId: a.id, portId: 'out' }, { nodeId: b.id, portId: 'in' });
  g = addEdge(g, { nodeId: a.id, portId: 'out' }, { nodeId: c.id, portId: 'in' });
  g = addEdge(g, { nodeId: b.id, portId: 'out' }, { nodeId: d.id, portId: 'in1' });
  g = addEdge(g, { nodeId: c.id, portId: 'out' }, { nodeId: d.id, portId: 'in2' });
  return g;
}

// ─── Tests ──────────────────────────────────────────────────────────

describe('createNode', () => {
  it('creates a node with unique id', () => {
    const n = createNode('ImageGen', { x: 10, y: 20 });
    expect(n.id).toMatch(/^node-/);
    expect(n.type).toBe('ImageGen');
    expect(n.position).toEqual({ x: 10, y: 20 });
    expect(n.status).toBe('idle');
  });

  it('applies default config', () => {
    const n = createNode('Test', { x: 0, y: 0 }, { threshold: 0.9 });
    expect(n.config).toEqual({ threshold: 0.9 });
  });
});

describe('addNode / removeNode', () => {
  it('adds a node to the graph', () => {
    const n = createNode('X', { x: 0, y: 0 });
    const g = addNode(emptyGraph(), n);
    expect(g.nodes).toHaveLength(1);
    expect(g.nodes[0].id).toBe(n.id);
  });

  it('removes a node and its connected edges', () => {
    const g = linearGraph();
    const midNode = g.nodes[1];
    const result = removeNode(g, midNode.id);
    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(0); // both edges touched the removed node
  });

  it('does not remove unrelated edges', () => {
    const g = diamondGraph();
    const nodeB = g.nodes[1];
    const result = removeNode(g, nodeB.id);
    // A→C and C→D should remain
    expect(result.nodes).toHaveLength(3);
    expect(result.edges).toHaveLength(2);
  });
});

describe('addEdge / removeEdge', () => {
  it('adds an edge', () => {
    const a = createNode('A', { x: 0, y: 0 });
    const b = createNode('B', { x: 100, y: 0 });
    let g = addNode(emptyGraph(), a);
    g = addNode(g, b);
    g = addEdge(g, { nodeId: a.id, portId: 'out' }, { nodeId: b.id, portId: 'in' });
    expect(g.edges).toHaveLength(1);
    expect(g.edges[0].sourceNodeId).toBe(a.id);
    expect(g.edges[0].targetNodeId).toBe(b.id);
  });

  it('replaces existing connection to same input port', () => {
    const a = createNode('A', { x: 0, y: 0 });
    const b = createNode('B', { x: 100, y: 0 });
    const c = createNode('C', { x: 200, y: 0 });
    let g = addNode(emptyGraph(), a);
    g = addNode(g, b);
    g = addNode(g, c);
    g = addEdge(g, { nodeId: a.id, portId: 'out' }, { nodeId: c.id, portId: 'in' });
    g = addEdge(g, { nodeId: b.id, portId: 'out' }, { nodeId: c.id, portId: 'in' });
    // Only one edge to C's 'in' port
    expect(g.edges).toHaveLength(1);
    expect(g.edges[0].sourceNodeId).toBe(b.id);
  });

  it('removes an edge by id', () => {
    const g = linearGraph();
    const edgeId = g.edges[0].id;
    const result = removeEdge(g, edgeId);
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0].id).not.toBe(edgeId);
  });
});

describe('updateNode', () => {
  it('updates node position', () => {
    const g = linearGraph();
    const nodeId = g.nodes[0].id;
    const updated = updateNode(g, nodeId, { position: { x: 999, y: 888 } });
    expect(updated.nodes.find(n => n.id === nodeId)?.position).toEqual({ x: 999, y: 888 });
  });

  it('updates node config', () => {
    const g = linearGraph();
    const nodeId = g.nodes[0].id;
    const updated = updateNode(g, nodeId, { config: { foo: 'bar' } });
    expect(updated.nodes.find(n => n.id === nodeId)?.config).toEqual({ foo: 'bar' });
  });

  it('does not affect other nodes', () => {
    const g = linearGraph();
    const updated = updateNode(g, g.nodes[0].id, { status: 'running' });
    expect(updated.nodes[1].status).toBe('idle');
    expect(updated.nodes[2].status).toBe('idle');
  });
});

describe('edge queries', () => {
  it('getIncomingEdges returns edges entering a node', () => {
    const g = diamondGraph();
    const nodeD = g.nodes[3]; // D has two incoming
    expect(getIncomingEdges(g, nodeD.id)).toHaveLength(2);
  });

  it('getOutgoingEdges returns edges leaving a node', () => {
    const g = diamondGraph();
    const nodeA = g.nodes[0]; // A has two outgoing
    expect(getOutgoingEdges(g, nodeA.id)).toHaveLength(2);
  });

  it('getUpstreamNodeIds / getDownstreamNodeIds', () => {
    const g = linearGraph();
    const [a, b, c] = g.nodes;
    expect(getUpstreamNodeIds(g, b.id)).toEqual([a.id]);
    expect(getDownstreamNodeIds(g, b.id)).toEqual([c.id]);
    expect(getUpstreamNodeIds(g, a.id)).toEqual([]);
    expect(getDownstreamNodeIds(g, c.id)).toEqual([]);
  });
});

describe('topologicalSort', () => {
  it('sorts a linear graph in order', () => {
    const g = linearGraph();
    const sorted = topologicalSort(g);
    expect(sorted).toHaveLength(3);
    // A before B before C
    expect(sorted.indexOf(g.nodes[0].id)).toBeLessThan(sorted.indexOf(g.nodes[1].id));
    expect(sorted.indexOf(g.nodes[1].id)).toBeLessThan(sorted.indexOf(g.nodes[2].id));
  });

  it('sorts a diamond graph correctly', () => {
    const g = diamondGraph();
    const [a, b, c, d] = g.nodes;
    const sorted = topologicalSort(g);
    expect(sorted).toHaveLength(4);
    // A before B and C, B and C before D
    expect(sorted.indexOf(a.id)).toBeLessThan(sorted.indexOf(b.id));
    expect(sorted.indexOf(a.id)).toBeLessThan(sorted.indexOf(c.id));
    expect(sorted.indexOf(b.id)).toBeLessThan(sorted.indexOf(d.id));
    expect(sorted.indexOf(c.id)).toBeLessThan(sorted.indexOf(d.id));
  });

  it('throws on cycle', () => {
    // A → B → A (cycle)
    const a = createNode('A', { x: 0, y: 0 });
    const b = createNode('B', { x: 100, y: 0 });
    let g = addNode(emptyGraph(), a);
    g = addNode(g, b);
    g = addEdge(g, { nodeId: a.id, portId: 'out' }, { nodeId: b.id, portId: 'in' });
    g = addEdge(g, { nodeId: b.id, portId: 'out' }, { nodeId: a.id, portId: 'in' });
    expect(() => topologicalSort(g)).toThrow(/cycle/i);
  });

  it('handles single node', () => {
    const n = createNode('X', { x: 0, y: 0 });
    const g = addNode(emptyGraph(), n);
    const sorted = topologicalSort(g);
    expect(sorted).toEqual([n.id]);
  });

  it('handles empty graph', () => {
    const sorted = topologicalSort(emptyGraph());
    expect(sorted).toEqual([]);
  });
});

describe('assignExecutionLevels', () => {
  it('assigns level 0 to root nodes', () => {
    const g = linearGraph();
    const levels = assignExecutionLevels(g);
    expect(levels.get(g.nodes[0].id)).toBe(0);
  });

  it('assigns sequential levels in a chain', () => {
    const g = linearGraph();
    const levels = assignExecutionLevels(g);
    expect(levels.get(g.nodes[0].id)).toBe(0);
    expect(levels.get(g.nodes[1].id)).toBe(1);
    expect(levels.get(g.nodes[2].id)).toBe(2);
  });

  it('assigns parallel nodes the same level in diamond', () => {
    const g = diamondGraph();
    const [a, b, c, d] = g.nodes;
    const levels = assignExecutionLevels(g);
    expect(levels.get(a.id)).toBe(0);
    expect(levels.get(b.id)).toBe(1);
    expect(levels.get(c.id)).toBe(1); // same level as B
    expect(levels.get(d.id)).toBe(2);
  });
});

describe('getReachableDownstream', () => {
  it('returns all downstream nodes in linear graph', () => {
    const g = linearGraph();
    const [a, b, c] = g.nodes;
    const downstream = getReachableDownstream(g, a.id);
    expect(downstream.has(b.id)).toBe(true);
    expect(downstream.has(c.id)).toBe(true);
    expect(downstream.has(a.id)).toBe(false); // excludes self
  });

  it('returns empty set for terminal node', () => {
    const g = linearGraph();
    const c = g.nodes[2];
    expect(getReachableDownstream(g, c.id).size).toBe(0);
  });

  it('follows all branches in diamond', () => {
    const g = diamondGraph();
    const [a, b, c, d] = g.nodes;
    const downstream = getReachableDownstream(g, a.id);
    expect(downstream.size).toBe(3);
    expect(downstream.has(b.id)).toBe(true);
    expect(downstream.has(c.id)).toBe(true);
    expect(downstream.has(d.id)).toBe(true);
  });
});

describe('resetRuntimeState', () => {
  it('resets all runtime fields to idle', () => {
    let g = linearGraph();
    g = updateNode(g, g.nodes[0].id, { status: 'done', outputs: { x: 1 }, error: 'oops' });
    g = updateNode(g, g.nodes[1].id, { status: 'running', progressMessage: 'working...' });

    const reset = resetRuntimeState(g);
    for (const node of reset.nodes) {
      expect(node.status).toBe('idle');
      expect(node.error).toBeUndefined();
      expect(node.outputs).toBeUndefined();
      expect(node.progressMessage).toBeUndefined();
    }
  });

  it('preserves node config and position', () => {
    let g = linearGraph();
    g = updateNode(g, g.nodes[0].id, { status: 'done', config: { threshold: 0.5 } });
    const reset = resetRuntimeState(g);
    expect(reset.nodes[0].config).toEqual({ threshold: 0.5 });
    expect(reset.nodes[0].position).toEqual(g.nodes[0].position);
  });
});
