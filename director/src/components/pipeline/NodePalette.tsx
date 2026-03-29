'use client';

import React from 'react';
import { NODE_TYPES } from '@/lib/pipeline/nodeTypes';
import { CATEGORY_LABELS, type NodeCategory } from '@/lib/pipeline/types';
import { usePipeline } from '@/context/PipelineContext';

const CATEGORIES: NodeCategory[] = ['source', 'generation', 'gate', 'processing', 'output'];

export function NodePalette() {
  const { addNode } = usePipeline();

  const handleAdd = (type: string) => {
    // Add at a default position (center-ish area)
    addNode(type, { x: 300 + Math.random() * 100, y: 200 + Math.random() * 100 });
  };

  return (
    <div className="w-[200px] bg-surface-container-low/95 backdrop-blur-lg border-r border-white/5 overflow-y-auto custom-scrollbar">
      <div className="p-3 border-b border-white/5">
        <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Nodes</h3>
      </div>

      {CATEGORIES.map((cat) => {
        const nodes = NODE_TYPES.filter((n) => n.category === cat);
        if (nodes.length === 0) return null;

        return (
          <div key={cat} className="px-2 py-2">
            <h4 className="text-[10px] font-medium text-white/30 uppercase tracking-wider px-1 mb-1">
              {CATEGORY_LABELS[cat]}
            </h4>
            {nodes.map((nodeDef) => (
              <button
                key={nodeDef.type}
                onClick={() => handleAdd(nodeDef.type)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left
                  hover:bg-white/5 focus:bg-white/5 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors group"
                title={nodeDef.description}
                aria-label={`Add ${nodeDef.label} node`}
              >
                <span
                  className="material-symbols-outlined text-white/40 group-hover:text-white/60"
                  style={{ fontSize: '16px' }}
                >
                  {nodeDef.icon}
                </span>
                <span className="text-xs text-white/60 group-hover:text-white/80 truncate">
                  {nodeDef.label}
                </span>
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}
