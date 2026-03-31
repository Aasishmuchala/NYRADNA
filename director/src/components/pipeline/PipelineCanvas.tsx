'use client';

import { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  type Node,
  type Edge,
  type NodeTypes,
  type NodeMouseHandler,
} from '@xyflow/react';
import SegmentNode from './SegmentNode';
import GapMarker from './GapMarker';
import type { PipelineNode } from '@/lib/types/pipeline-node';
import type { PipelineGap, GapSeverity } from '@/lib/types/pipeline-gap';
import type { ValidationIssue } from '@/lib/types/narrative-validation';

interface PipelineCanvasProps {
  nodes: PipelineNode[];
  gaps: PipelineGap[];
  validationIssues?: ValidationIssue[];
  onNodeSelect: (nodeId: string) => void;
  onGapSelect: (sourceNodeId: string, targetNodeId: string) => void;
  selectedNodeId: string | null;
}

const severityStrokeColor: Record<GapSeverity, string> = {
  critical: '#ef4444',
  moderate: '#f59e0b',
  minor:    '#555',
};

function highestSeverity(gaps: PipelineGap[]): GapSeverity {
  const order: GapSeverity[] = ['critical', 'moderate', 'minor'];
  for (const level of order) {
    if (gaps.some((g) => g.severity === level)) return level;
  }
  return 'minor';
}

const nodeTypes: NodeTypes = {
  segmentNode: SegmentNode,
};

export default function PipelineCanvas({ nodes, gaps, validationIssues = [], onNodeSelect, onGapSelect, selectedNodeId }: PipelineCanvasProps) {
  const rfNodes: Node[] = useMemo(() => {
    return nodes.map((pNode, index) => ({
      id: pNode.id,
      type: 'segmentNode',
      position: { x: index * 280, y: 100 },
      data: {
        node: pNode,
        validationIssues: validationIssues.filter((i) => i.nodeId === pNode.id),
      },
      selected: pNode.id === selectedNodeId,
    }));
  }, [nodes, selectedNodeId, validationIssues]);

  const rfEdges: Edge[] = useMemo(() => {
    return nodes.slice(1).map((pNode, index) => {
      const prev = nodes[index];
      const isGenerating = pNode.status === 'generating';
      const edgeGaps = gaps.filter(
        (g) => g.sourceNodeId === prev.id && g.targetNodeId === pNode.id
      );
      const hasGaps = edgeGaps.length > 0;

      return {
        id: `e-${prev.id}-${pNode.id}`,
        source: prev.id,
        target: pNode.id,
        type: 'smoothstep',
        animated: isGenerating,
        style: {
          stroke: hasGaps ? severityStrokeColor[highestSeverity(edgeGaps)] : '#555',
          strokeWidth: hasGaps ? 3 : 2,
        },
        ...(hasGaps && {
          label: (
            <GapMarker
              gaps={edgeGaps}
              onClick={() => onGapSelect(prev.id, pNode.id)}
            />
          ),
        }),
      };
    });
  }, [nodes, gaps, onGapSelect]);

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      onNodeSelect(node.id);
    },
    [onNodeSelect]
  );

  if (nodes.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <span className="material-symbols-outlined mb-3 text-5xl text-[#7F72F7]/10">account_tree</span>
        <p className="text-sm text-[#555]">
          No pipeline nodes yet. Generate from an asset set to get started.
        </p>
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={rfNodes}
      edges={rfEdges}
      nodeTypes={nodeTypes}
      onNodeClick={handleNodeClick}
      fitView
      proOptions={{ hideAttribution: true }}
      nodesDraggable={false}
      nodesConnectable={false}
    >
      <Background variant={BackgroundVariant.Dots} color="rgba(127,114,247,0.1)" gap={24} />
    </ReactFlow>
  );
}
