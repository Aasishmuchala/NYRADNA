'use client';

import React, { useCallback } from 'react';
import type { NodeInstance } from '@/lib/pipeline/graph';
import type { NodeTypeDef } from '@/lib/pipeline/types';
import { getNodeType } from '@/lib/pipeline/nodeTypes';
import { StatusBadge } from './StatusBadge';
import { Port } from './Port';

interface NodeCardProps {
  node: NodeInstance;
  selected: boolean;
  onSelect: (nodeId: string) => void;
  onDragStart: (nodeId: string, e: React.MouseEvent) => void;
  onPortDragStart: (nodeId: string, portId: string, side: 'input' | 'output', e: React.MouseEvent) => void;
  onPortDragEnd: (nodeId: string, portId: string, side: 'input' | 'output') => void;
}

const CATEGORY_BORDER: Record<string, string> = {
  source: 'border-secondary/30',
  generation: 'border-primary/30',
  gate: 'border-processing/30',
  processing: 'border-tertiary/30',
  output: 'border-success/30',
};

export const NodeCard = React.memo(function NodeCard({
  node,
  selected,
  onSelect,
  onDragStart,
  onPortDragStart,
  onPortDragEnd,
}: NodeCardProps) {
  const typeDef: NodeTypeDef | undefined = getNodeType(node.type);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).dataset.portId) return; // Port handles its own drag
      onSelect(node.id);
      onDragStart(node.id, e);
    },
    [node.id, onSelect, onDragStart],
  );

  if (!typeDef) {
    return (
      <div
        className="absolute w-[200px] bg-red-950/50 border border-red-500/30 rounded-xl p-3"
        style={{ transform: `translate(${node.position.x}px, ${node.position.y}px)` }}
      >
        <span className="text-xs text-red-400">Unknown: {node.type}</span>
      </div>
    );
  }

  const borderClass = CATEGORY_BORDER[typeDef.category] ?? 'border-outline-variant/20';
  const status = node.status ?? 'idle';

  return (
    <div
      className={`absolute w-[200px] rounded-xl border transition-shadow select-none
        bg-surface-container/90 backdrop-blur-lg
        ${borderClass}
        ${selected ? 'ring-2 ring-primary/50 shadow-lg shadow-primary/10' : ''}
        ${status === 'running' ? 'animate-pulse shadow-md shadow-primary/20' : ''}
      `}
      style={{ transform: `translate(${node.position.x}px, ${node.position.y}px)` }}
      onMouseDown={handleMouseDown}
      role="group"
      aria-label={`${typeDef.label} node, status: ${status}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 cursor-grab active:cursor-grabbing">
        <span className="material-symbols-outlined text-base text-on-surface/60" style={{ fontSize: '16px' }}>
          {typeDef.icon}
        </span>
        <span className="text-xs font-medium text-on-surface/80 truncate flex-1">
          {typeDef.label}
        </span>
        <StatusBadge status={status} />
      </div>

      {/* Ports */}
      <div className="flex px-2 py-1.5 gap-2">
        {/* Input ports (left) */}
        <div className="flex flex-col gap-1 flex-1">
          {typeDef.inputs.map((port) => (
            <Port
              key={port.id}
              port={port}
              side="input"
              nodeId={node.id}
              onDragStart={onPortDragStart}
              onDragEnd={onPortDragEnd}
            />
          ))}
        </div>
        {/* Output ports (right) */}
        <div className="flex flex-col gap-1 flex-1 items-end">
          {typeDef.outputs.map((port) => (
            <Port
              key={port.id}
              port={port}
              side="output"
              nodeId={node.id}
              onDragStart={onPortDragStart}
              onDragEnd={onPortDragEnd}
            />
          ))}
        </div>
      </div>

      {/* Output preview — show thumbnails for images/videos */}
      {status === 'done' && node.outputs && (
        <div className="px-2 py-1.5 border-t border-white/5 space-y-1">
          {typeof node.outputs.image === 'string' && node.outputs.image && (
            <img
              src={node.outputs.image}
              alt="Generated output"
              className="w-full h-20 object-cover rounded-lg"
              loading="lazy"
            />
          )}
          {typeof node.outputs.frame === 'string' && node.outputs.frame && (
            <img
              src={node.outputs.frame}
              alt="Extracted frame"
              className="w-full h-20 object-cover rounded-lg"
              loading="lazy"
            />
          )}
          {typeof node.outputs.video === 'string' && (
            <div className="flex items-center gap-1.5 text-[10px] text-tertiary">
              <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>videocam</span>
              <span className="truncate">Video ready</span>
            </div>
          )}
          {node.outputs.pass !== undefined && (
            <div className={`flex items-center gap-1.5 text-[10px] ${node.outputs.pass ? 'text-success' : 'text-error'}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                {node.outputs.pass ? 'check_circle' : 'cancel'}
              </span>
              <span>
                {node.outputs.pass ? 'Passed' : 'Failed'}
                {typeof node.outputs.score === 'number' && ` (${node.outputs.score.toFixed(2)})`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Status detail */}
      {(node.error || node.progressMessage) && (
        <div className="px-3 py-1.5 border-t border-white/5">
          {node.error ? (
            <p className="text-[10px] text-error truncate">{node.error}</p>
          ) : (
            <p className="text-[10px] text-on-surface/40 truncate">{node.progressMessage}</p>
          )}
        </div>
      )}
    </div>
  );
});
