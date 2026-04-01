'use client';

import React, { useCallback } from 'react';
import type { PortDef } from '@/lib/pipeline/types';
import { PORT_COLORS } from '@/lib/pipeline/types';

interface PortProps {
  port: PortDef;
  side: 'input' | 'output';
  nodeId: string;
  onDragStart?: (nodeId: string, portId: string, side: 'input' | 'output', e: React.MouseEvent) => void;
  onDragEnd?: (nodeId: string, portId: string, side: 'input' | 'output') => void;
}

export function Port({ port, side, nodeId, onDragStart, onDragEnd }: PortProps) {
  const color = PORT_COLORS[port.dataType] ?? PORT_COLORS.any;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDragStart?.(nodeId, port.id, side, e);
    },
    [nodeId, port.id, side, onDragStart],
  );

  const handleMouseUp = useCallback(() => {
    onDragEnd?.(nodeId, port.id, side);
  }, [nodeId, port.id, side, onDragEnd]);

  return (
    <div
      className={`flex items-center gap-1.5 py-0.5 ${side === 'output' ? 'flex-row-reverse' : ''}`}
    >
      <div
        className="w-3 h-3 rounded-full border-2 cursor-crosshair transition-transform hover:scale-125 shrink-0"
        style={{ borderColor: color, backgroundColor: `${color}33` }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        data-port-id={port.id}
        data-port-side={side}
        data-node-id={nodeId}
      />
      <span className="text-[10px] text-on-surface/50 leading-none whitespace-nowrap">
        {port.label}
      </span>
    </div>
  );
}
