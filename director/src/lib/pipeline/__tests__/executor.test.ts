import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createNode,
  addNode,
  addEdge,
} from '../graph';
import type { PipelineGraph } from '../graph';
import type { ExecutionContext, NodeTypeDef } from '../types';
import { NODE_TYPE_REGISTRY } from '../nodeTypes';
import { executePipeline, executePipelineFrom } from '../executor';
import type { NodeStatusCallback, ExecutionOptions } from '../executor';

// ─── Test Helpers ───────────────────────────────────────────────────

function emptyGraph(): PipelineGraph {
  return { id: 'test', name: 'Test', description: '', nodes: [], edges: [] };
}

function mockCtx(overrides?: Partial<ExecutionContext>): ExecutionContext {
  return {
    signal: new AbortController().signal,
    wizardState: {} as any,
    updateWizardState: vi.fn(),
    onProgress: vi.fn(),
    getNodeOutput: vi.fn(() => undefined),
    ...overrides,
  };
}

function mockOptions(overrides?: Partial<ExecutionOptions>): ExecutionOptions {
  return {
    onNodeStatusChange: vi.fn(),
    ctx: mockCtx(),
    ...overrides,
  };
}

/** Register a temporary mock node type for testing. Removes after callback. */
function withMockNodeType(type: string, def: Partial<NodeTypeDef>, fn: () => Promise<void> | void) {
  const full: NodeTypeDef = {
    type,
    category: def.category ?? 'processing',
    label: def.label ?? type,
    description: '',
    icon: 'test',
    inputs: def.inputs ?? [],
    outputs: def.outputs ?? [],
    config: def.config ?? [],
    forEach: def.forEach,
    execute: def.execute ?? (async () => ({})),
  };
  NODE_TYPE_REGISTRY.set(type, full);
  try {
    const result = fn();
    if (result && typeof result.then === 'function') {
      return result.finally(() => NODE_TYPE_REGISTRY.delete(type));
    }
    NODE_TYPE_REGISTRY.delete(type);
    return result;
  } catch (e) {
    NODE_TYPE_REGISTRY.delete(type);
    throw e;
  }
}

// ─── Tests ─────────────────────────────────────────────────────────

describe('executePipeline', () => {
  it('does nothing on empty graph', async () => {
    const opts = mockOptions();
    await executePipeline(emptyGraph(), opts);
    expect(opts.onNodeStatusChange).not.toHaveBeenCalled();
  });

  it('executes a single node', async () => {
    const executeFn = vi.fn(async () => ({ result: 42 }));

    await withMockNodeType('TestSingle', {
      outputs: [{ id: 'result', label: 'Result', dataType: 'number', required: false }],
      execute: executeFn,
    }, async () => {
      const n = createNode('TestSingle', { x: 0, y: 0 });
      const g = addNode(emptyGraph(), n);

      const statusChanges: [string, string][] = [];
      const opts = mockOptions({
        onNodeStatusChange: vi.fn((id, status) => statusChanges.push([id, status])),
      });

      await executePipeline(g, opts);

      expect(executeFn).toHaveBeenCalledOnce();
      // Should see: pending → running → done
      const statuses = statusChanges.filter(([id]) => id === n.id).map(([, s]) => s);
      expect(statuses).toContain('pending');
      expect(statuses).toContain('running');
      expect(statuses).toContain('done');
    });
  });

  it('executes nodes in topological order (A → B)', async () => {
    const order: string[] = [];

    await withMockNodeType('OrderA', {
      outputs: [{ id: 'out', label: 'Out', dataType: 'text', required: false }],
      execute: async () => { order.push('A'); return { out: 'hello' }; },
    }, () =>
      withMockNodeType('OrderB', {
        inputs: [{ id: 'in', label: 'In', dataType: 'text', required: true }],
        execute: async () => { order.push('B'); return {}; },
      }, async () => {
        const a = createNode('OrderA', { x: 0, y: 0 });
        const b = createNode('OrderB', { x: 100, y: 0 });
        let g = addNode(emptyGraph(), a);
        g = addNode(g, b);
        g = addEdge(g, { nodeId: a.id, portId: 'out' }, { nodeId: b.id, portId: 'in' });

        await executePipeline(g, mockOptions());

        expect(order).toEqual(['A', 'B']);
      })
    );
  });

  it('passes outputs from upstream to downstream inputs', async () => {
    let receivedInput: unknown = null;

    await withMockNodeType('Producer', {
      outputs: [{ id: 'out', label: 'Out', dataType: 'text', required: false }],
      execute: async () => ({ out: 'produced-value' }),
    }, () =>
      withMockNodeType('Consumer', {
        inputs: [{ id: 'in', label: 'In', dataType: 'text', required: true }],
        execute: async (inputs) => { receivedInput = inputs.in; return {}; },
      }, async () => {
        const a = createNode('Producer', { x: 0, y: 0 });
        const b = createNode('Consumer', { x: 100, y: 0 });
        let g = addNode(emptyGraph(), a);
        g = addNode(g, b);
        g = addEdge(g, { nodeId: a.id, portId: 'out' }, { nodeId: b.id, portId: 'in' });

        await executePipeline(g, mockOptions());

        expect(receivedInput).toBe('produced-value');
      })
    );
  });

  it('executes parallel nodes at the same level concurrently', async () => {
    let concurrentCount = 0;
    let maxConcurrent = 0;

    const slowExecute = async () => {
      concurrentCount++;
      maxConcurrent = Math.max(maxConcurrent, concurrentCount);
      await new Promise((r) => setTimeout(r, 50));
      concurrentCount--;
      return { out: 'done' };
    };

    await withMockNodeType('Root', {
      outputs: [{ id: 'out', label: 'Out', dataType: 'text', required: false }],
      execute: async () => ({ out: 'root' }),
    }, () =>
      withMockNodeType('Parallel', {
        inputs: [{ id: 'in', label: 'In', dataType: 'text', required: false }],
        outputs: [{ id: 'out', label: 'Out', dataType: 'text', required: false }],
        execute: slowExecute,
      }, async () => {
        const root = createNode('Root', { x: 0, y: 0 });
        const p1 = createNode('Parallel', { x: -50, y: 100 });
        const p2 = createNode('Parallel', { x: 50, y: 100 });
        let g = addNode(emptyGraph(), root);
        g = addNode(g, p1);
        g = addNode(g, p2);
        g = addEdge(g, { nodeId: root.id, portId: 'out' }, { nodeId: p1.id, portId: 'in' });
        g = addEdge(g, { nodeId: root.id, portId: 'out' }, { nodeId: p2.id, portId: 'in' });

        await executePipeline(g, mockOptions());

        expect(maxConcurrent).toBe(2);
      })
    );
  });

  it('handles node execution failure gracefully', async () => {
    await withMockNodeType('Failer', {
      execute: async () => { throw new Error('boom'); },
    }, async () => {
      const n = createNode('Failer', { x: 0, y: 0 });
      const g = addNode(emptyGraph(), n);

      const statusChanges: [string, string, any][] = [];
      const opts = mockOptions({
        onNodeStatusChange: vi.fn((id, status, data) => statusChanges.push([id, status, data])),
      });

      await executePipeline(g, opts);

      const failEntry = statusChanges.find(([, s]) => s === 'failed');
      expect(failEntry).toBeDefined();
      expect(failEntry![2]?.error).toBe('boom');
    });
  });

  it('aborts execution when signal is triggered', async () => {
    const controller = new AbortController();
    let nodesBExecuted = false;

    await withMockNodeType('SlowNode', {
      outputs: [{ id: 'out', label: 'Out', dataType: 'text', required: false }],
      execute: async () => {
        // Abort during first node execution
        controller.abort();
        return { out: 'done' };
      },
    }, () =>
      withMockNodeType('AfterAbort', {
        inputs: [{ id: 'in', label: 'In', dataType: 'text', required: false }],
        execute: async () => { nodesBExecuted = true; return {}; },
      }, async () => {
        const a = createNode('SlowNode', { x: 0, y: 0 });
        const b = createNode('AfterAbort', { x: 100, y: 0 });
        let g = addNode(emptyGraph(), a);
        g = addNode(g, b);
        g = addEdge(g, { nodeId: a.id, portId: 'out' }, { nodeId: b.id, portId: 'in' });

        const ctx = mockCtx({ signal: controller.signal });
        await executePipeline(g, { onNodeStatusChange: vi.fn(), ctx });

        expect(nodesBExecuted).toBe(false);
      })
    );
  });
});

describe('gate handling', () => {
  it('skips downstream nodes when gate fails', async () => {
    const statusChanges: [string, string][] = [];

    await withMockNodeType('Gen', {
      category: 'generation',
      outputs: [{ id: 'image', label: 'Image', dataType: 'image', required: false }],
      execute: async () => ({ image: 'img.png' }),
    }, () =>
      withMockNodeType('Gate', {
        category: 'gate',
        inputs: [{ id: 'image', label: 'Image', dataType: 'image', required: true }],
        outputs: [
          { id: 'pass', label: 'Pass', dataType: 'boolean', required: false },
          { id: 'score', label: 'Score', dataType: 'number', required: false },
          { id: 'image', label: 'Image', dataType: 'image', required: false },
        ],
        execute: async () => ({ pass: false, score: 0.3, image: 'img.png' }),
      }, () =>
        withMockNodeType('Downstream', {
          inputs: [{ id: 'image', label: 'Image', dataType: 'image', required: true }],
          execute: async () => ({}),
        }, async () => {
          const gen = createNode('Gen', { x: 0, y: 0 });
          const gate = createNode('Gate', { x: 100, y: 0 });
          const down = createNode('Downstream', { x: 200, y: 0 });
          let g = addNode(emptyGraph(), gen);
          g = addNode(g, gate);
          g = addNode(g, down);
          g = addEdge(g, { nodeId: gen.id, portId: 'image' }, { nodeId: gate.id, portId: 'image' });
          g = addEdge(g, { nodeId: gate.id, portId: 'image' }, { nodeId: down.id, portId: 'image' });

          const opts = mockOptions({
            onNodeStatusChange: vi.fn((id, status) => statusChanges.push([id, status])),
          });
          await executePipeline(g, opts);

          // Downstream should be skipped
          const downStatuses = statusChanges.filter(([id]) => id === down.id).map(([, s]) => s);
          expect(downStatuses).toContain('skipped');
        })
      )
    );
  });

  it('retries gate upstream when retryOnFail is true', async () => {
    let genCallCount = 0;
    let gateCallCount = 0;

    await withMockNodeType('RetryGen', {
      category: 'generation',
      outputs: [{ id: 'image', label: 'Image', dataType: 'image', required: false }],
      execute: async () => {
        genCallCount++;
        return { image: `img-${genCallCount}.png` };
      },
    }, () =>
      withMockNodeType('RetryGate', {
        category: 'gate',
        inputs: [{ id: 'image', label: 'Image', dataType: 'image', required: true }],
        outputs: [
          { id: 'pass', label: 'Pass', dataType: 'boolean', required: false },
          { id: 'score', label: 'Score', dataType: 'number', required: false },
          { id: 'image', label: 'Image', dataType: 'image', required: false },
        ],
        execute: async (inputs) => {
          gateCallCount++;
          // Pass on second gate call (after retry)
          const pass = gateCallCount >= 2;
          return { pass, score: pass ? 0.95 : 0.3, image: inputs.image };
        },
      }, () =>
        withMockNodeType('AfterGate', {
          inputs: [{ id: 'image', label: 'Image', dataType: 'image', required: true }],
          execute: async () => ({}),
        }, async () => {
          const gen = createNode('RetryGen', { x: 0, y: 0 });
          const gate = createNode('RetryGate', { x: 100, y: 0 }, { retryOnFail: true, maxRetries: 3 });
          const after = createNode('AfterGate', { x: 200, y: 0 });
          let g = addNode(emptyGraph(), gen);
          g = addNode(g, gate);
          g = addNode(g, after);
          g = addEdge(g, { nodeId: gen.id, portId: 'image' }, { nodeId: gate.id, portId: 'image' });
          g = addEdge(g, { nodeId: gate.id, portId: 'image' }, { nodeId: after.id, portId: 'image' });

          const statusChanges: [string, string][] = [];
          const opts = mockOptions({
            onNodeStatusChange: vi.fn((id, status) => statusChanges.push([id, status])),
          });
          await executePipeline(g, opts);

          // Gen should have been called twice (initial + 1 retry)
          expect(genCallCount).toBe(2);
          // Gate should have been called at least twice
          expect(gateCallCount).toBeGreaterThanOrEqual(2);
          // AfterGate should NOT be skipped (gate passed on retry)
          const afterStatuses = statusChanges.filter(([id]) => id === after.id).map(([, s]) => s);
          expect(afterStatuses).not.toContain('skipped');
        })
      )
    );
  });

  it('does not skip nodes with alternative paths around the gate', async () => {
    //   Gen → Gate → Merge
    //   Gen ─────────→ Merge  (alternative path)
    const statusChanges: [string, string][] = [];

    await withMockNodeType('AltGen', {
      category: 'generation',
      outputs: [
        { id: 'image', label: 'Image', dataType: 'image', required: false },
        { id: 'alt', label: 'Alt', dataType: 'text', required: false },
      ],
      execute: async () => ({ image: 'img.png', alt: 'alt-path' }),
    }, () =>
      withMockNodeType('AltGate', {
        category: 'gate',
        inputs: [{ id: 'image', label: 'Image', dataType: 'image', required: true }],
        outputs: [
          { id: 'pass', label: 'Pass', dataType: 'boolean', required: false },
          { id: 'image', label: 'Image', dataType: 'image', required: false },
        ],
        execute: async () => ({ pass: false, image: 'img.png' }),
      }, () =>
        withMockNodeType('AltMerge', {
          inputs: [
            { id: 'gated', label: 'Gated', dataType: 'image', required: false },
            { id: 'direct', label: 'Direct', dataType: 'text', required: false },
          ],
          execute: async () => ({}),
        }, async () => {
          const gen = createNode('AltGen', { x: 0, y: 0 });
          const gate = createNode('AltGate', { x: 100, y: 0 });
          const merge = createNode('AltMerge', { x: 200, y: 0 });
          let g = addNode(emptyGraph(), gen);
          g = addNode(g, gate);
          g = addNode(g, merge);
          g = addEdge(g, { nodeId: gen.id, portId: 'image' }, { nodeId: gate.id, portId: 'image' });
          g = addEdge(g, { nodeId: gate.id, portId: 'image' }, { nodeId: merge.id, portId: 'gated' });
          // Alternative path bypassing the gate
          g = addEdge(g, { nodeId: gen.id, portId: 'alt' }, { nodeId: merge.id, portId: 'direct' });

          const opts = mockOptions({
            onNodeStatusChange: vi.fn((id, status) => statusChanges.push([id, status])),
          });
          await executePipeline(g, opts);

          // Merge should NOT be skipped because it has an alternative path from Gen
          const mergeStatuses = statusChanges.filter(([id]) => id === merge.id).map(([, s]) => s);
          expect(mergeStatuses).not.toContain('skipped');
        })
      )
    );
  });
});

describe('executePipelineFrom', () => {
  it('executes only the target node and its downstream', async () => {
    const executedNodes: string[] = [];

    await withMockNodeType('FromA', {
      outputs: [{ id: 'out', label: 'Out', dataType: 'text', required: false }],
      execute: async () => { executedNodes.push('A'); return { out: 'a' }; },
    }, () =>
      withMockNodeType('FromB', {
        inputs: [{ id: 'in', label: 'In', dataType: 'text', required: false }],
        outputs: [{ id: 'out', label: 'Out', dataType: 'text', required: false }],
        execute: async () => { executedNodes.push('B'); return { out: 'b' }; },
      }, () =>
        withMockNodeType('FromC', {
          inputs: [{ id: 'in', label: 'In', dataType: 'text', required: false }],
          execute: async () => { executedNodes.push('C'); return {}; },
        }, async () => {
          const a = createNode('FromA', { x: 0, y: 0 });
          const b = createNode('FromB', { x: 100, y: 0 });
          const c = createNode('FromC', { x: 200, y: 0 });
          let g = addNode(emptyGraph(), a);
          g = addNode(g, b);
          g = addNode(g, c);
          g = addEdge(g, { nodeId: a.id, portId: 'out' }, { nodeId: b.id, portId: 'in' });
          g = addEdge(g, { nodeId: b.id, portId: 'out' }, { nodeId: c.id, portId: 'in' });

          // Pre-seed A's output (as if it already ran)
          const existing = new Map<string, Record<string, unknown>>();
          existing.set(a.id, { out: 'pre-existing' });

          await executePipelineFrom(g, b.id, mockOptions(), existing);

          // A should NOT have been re-executed, only B and C
          expect(executedNodes).toEqual(['B', 'C']);
        })
      )
    );
  });
});

describe('transient error retry', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  it('retries on 429 rate limit errors', async () => {
    let attempts = 0;

    await withMockNodeType('RateLimited', {
      execute: async () => {
        attempts++;
        if (attempts < 3) throw new Error('429 Too Many Requests');
        return { result: 'ok' };
      },
    }, async () => {
      const n = createNode('RateLimited', { x: 0, y: 0 });
      const g = addNode(emptyGraph(), n);

      const statusChanges: [string, string][] = [];
      const opts = mockOptions({
        onNodeStatusChange: vi.fn((id, status) => statusChanges.push([id, status])),
      });
      const promise = executePipeline(g, opts);

      // Advance timers through retry backoffs
      for (let i = 0; i < 5; i++) {
        await vi.advanceTimersByTimeAsync(65_000);
      }

      await promise;

      expect(attempts).toBe(3);
      const doneEntry = statusChanges.find(([, s]) => s === 'done');
      expect(doneEntry).toBeDefined();
    });

    vi.useRealTimers();
  }, 30_000);

  it('does not retry on non-transient errors', async () => {
    vi.useRealTimers();
    let attempts = 0;

    await withMockNodeType('HardFail', {
      execute: async () => {
        attempts++;
        throw new Error('Invalid configuration');
      },
    }, async () => {
      const n = createNode('HardFail', { x: 0, y: 0 });
      const g = addNode(emptyGraph(), n);

      await executePipeline(g, mockOptions());

      // Should only attempt once since the error is not transient
      expect(attempts).toBe(1);
    });
  });
});
