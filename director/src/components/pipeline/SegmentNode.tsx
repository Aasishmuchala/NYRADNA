'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { PipelineNode, NodeStatus } from '@/lib/types/pipeline-node';
import type { ValidationIssue, IssueSeverity } from '@/lib/types/narrative-validation';

interface SegmentNodeData {
  node: PipelineNode;
  validationIssues?: ValidationIssue[];
  [key: string]: unknown;
}

const statusConfig: Record<NodeStatus, { color: string; label: string; icon?: string; pulse?: boolean }> = {
  pending:    { color: '#555',    label: 'Pending' },
  ready:      { color: '#4cb150', label: 'Ready' },
  generating: { color: '#9c27b0', label: 'Generating', pulse: true },
  completed:  { color: '#4cb150', label: 'Completed', icon: 'check_circle' },
  error:      { color: '#d32f2f', label: 'Error' },
};

const severityColor: Record<IssueSeverity, string> = {
  critical: '#d32f2f',
  moderate: 'var(--color-primary)',
  minor: '#ffd54f',
};

const severityRank: Record<IssueSeverity, number> = {
  critical: 3,
  moderate: 2,
  minor: 1,
};

function getHighestSeverityColor(issues: ValidationIssue[]): string {
  let highest: IssueSeverity = 'minor';
  for (const issue of issues) {
    if (severityRank[issue.severity] > severityRank[highest]) {
      highest = issue.severity;
    }
  }
  return severityColor[highest];
}

function SegmentNode({ data, selected }: NodeProps & { data: SegmentNodeData }) {
  const { node } = data;
  const validationIssues = data.validationIssues ?? [];
  const isBridge = (node as PipelineNode).metadata?.source === 'gap-fill';

  // Determine display status: override label when completed with video
  const hasVideo = node.status === 'completed' && !!node.videoUrl;
  const status = statusConfig[node.status] ?? statusConfig.pending;
  const displayLabel = hasVideo ? 'Video Ready' : status.label;

  return (
    <div
      className={`relative min-w-[200px] rounded-xl border bg-surface-container p-3 transition-colors ${
        isBridge ? 'border-dashed' : ''
      } ${selected ? 'border-[var(--color-primary)]' : 'border-[var(--color-primary)]/10'}`}
    >
      {isBridge && (
        <div className="absolute -top-2 -right-2 rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-[9px] font-bold text-on-surface">
          BRIDGE
        </div>
      )}
      <Handle type="target" position={Position.Left} className="!bg-outline !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-outline !w-2 !h-2" />

      <div className="flex gap-3">
        {/* Thumbnail with video play overlay */}
        <div className="relative flex-shrink-0">
          {node.thumbnailUrl ? (
            <img
              src={node.thumbnailUrl}
              alt={node.title}
              className="h-16 w-16 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white/5">
              <span className="material-symbols-outlined text-2xl text-outline">image</span>
            </div>
          )}
          {/* Play overlay for completed nodes with video */}
          {hasVideo && (
            <div className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60">
              <span className="material-symbols-outlined text-xs text-on-surface [font-variation-settings:'FILL'_1]">
                play_circle
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Title */}
          <h4 className="truncate text-sm font-bold text-on-surface">{node.title}</h4>

          {/* Status badge */}
          <div className="mt-1 flex items-center gap-1.5">
            {status.icon ? (
              <span
                className="material-symbols-outlined text-xs [font-variation-settings:'FILL'_1]"
                style={{ color: status.color }}
              >
                {status.icon}
              </span>
            ) : (
              <span
                className={`inline-block h-2 w-2 rounded-full ${status.pulse ? 'animate-pulse' : ''}`}
                style={{ backgroundColor: status.color }}
              />
            )}
            <span className="text-xs" style={{ color: status.color }}>
              {displayLabel}
            </span>
            {/* Retry icon for error state */}
            {node.status === 'error' && (
              <span
                className="material-symbols-outlined text-xs text-[#d32f2f]"
                title="Retry generation"
              >
                refresh
              </span>
            )}
          </div>

          {/* Generating video text */}
          {node.status === 'generating' && (
            <p className="mt-0.5 animate-pulse text-xs text-purple-400">
              Generating video...
            </p>
          )}

          {/* Validation flag indicator */}
          {validationIssues.length > 0 && (
            <div className="mt-1 flex items-center gap-1">
              <span
                className="material-symbols-outlined text-xs"
                style={{ color: getHighestSeverityColor(validationIssues) }}
              >
                warning
              </span>
              <span
                className="text-xs"
                style={{ color: getHighestSeverityColor(validationIssues) }}
              >
                {validationIssues.length} issue{validationIssues.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Emotional tone */}
          {node.narrativeContext?.emotionalTone && (
            <p className="mt-1 truncate text-xs text-on-surface-variant">
              {node.narrativeContext.emotionalTone}
            </p>
          )}

          {/* Duration hint */}
          {node.narrativeContext?.durationHint && (
            <p className="mt-0.5 text-xs text-outline">{node.narrativeContext.durationHint}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(SegmentNode);
