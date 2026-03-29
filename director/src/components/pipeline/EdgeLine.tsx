'use client';

import React, { useMemo } from 'react';
import type { Edge } from '@/lib/pipeline/graph';

interface EdgeLineProps {
  edge: Edge;
  sourcePos: { x: number; y: number };
  targetPos: { x: number; y: number };
  color?: string;
  onDelete?: (edgeId: string) => void;
}

export const EdgeLine = React.memo(function EdgeLine({ edge, sourcePos, targetPos, color = '#ff906466', onDelete }: EdgeLineProps) {
  const d = useMemo(() => {
    const dx = targetPos.x - sourcePos.x;
    const cp = Math.max(Math.abs(dx) * 0.5, 50);
    return `M ${sourcePos.x} ${sourcePos.y} C ${sourcePos.x + cp} ${sourcePos.y}, ${targetPos.x - cp} ${targetPos.y}, ${targetPos.x} ${targetPos.y}`;
  }, [sourcePos.x, sourcePos.y, targetPos.x, targetPos.y]);

  return (
    <g>
      {/* Invisible wider hit area for easier clicking */}
      <path
        d={d}
        fill="none"
        stroke="transparent"
        strokeWidth={12}
        strokeLinecap="round"
        className="cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onDelete?.(edge.id);
        }}
      />
      {/* Visible edge */}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        data-edge-id={edge.id}
        className="transition-colors pointer-events-none"
      />
    </g>
  );
});

/** Temporary edge drawn while user drags from a port */
export const EdgeDraft = React.memo(function EdgeDraft({
  from,
  to,
  color = '#ff906444',
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color?: string;
}) {
  const d = useMemo(() => {
    const dx = to.x - from.x;
    const cp = Math.max(Math.abs(dx) * 0.5, 50);
    return `M ${from.x} ${from.y} C ${from.x + cp} ${from.y}, ${to.x - cp} ${to.y}, ${to.x} ${to.y}`;
  }, [from.x, from.y, to.x, to.y]);

  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeDasharray="6 4"
      strokeLinecap="round"
      className="pointer-events-none"
    />
  );
});
