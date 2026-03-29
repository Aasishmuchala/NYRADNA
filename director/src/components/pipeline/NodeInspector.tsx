'use client';

import React, { useCallback } from 'react';
import { usePipeline } from '@/context/PipelineContext';
import { getNodeType } from '@/lib/pipeline/nodeTypes';
import type { ConfigFieldDef } from '@/lib/pipeline/types';
import { StatusBadge } from './StatusBadge';

export const NodeInspector = React.memo(function NodeInspector() {
  const { graph, selectedNodeId, updateNodeConfig, removeNode, executeFrom, isExecuting } = usePipeline();

  const node = graph.nodes.find((n) => n.id === selectedNodeId);
  if (!node) {
    return (
      <div className="w-[260px] bg-[#141414]/95 backdrop-blur-lg border-l border-white/5 flex items-center justify-center">
        <p className="text-xs text-white/20">Select a node to inspect</p>
      </div>
    );
  }

  const typeDef = getNodeType(node.type);
  if (!typeDef) return null;

  const handleConfigChange = useCallback(
    (fieldId: string, value: unknown) => {
      updateNodeConfig(node.id, { ...node.config, [fieldId]: value });
    },
    [node.id, node.config, updateNodeConfig],
  );

  return (
    <div className="w-[260px] bg-[#141414]/95 backdrop-blur-lg border-l border-white/5 overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="p-3 border-b border-white/5">
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-white/50" style={{ fontSize: '18px' }}>
            {typeDef.icon}
          </span>
          <h3 className="text-sm font-medium text-white/80">{typeDef.label}</h3>
        </div>
        <p className="text-[10px] text-white/30">{typeDef.description}</p>
        <div className="mt-2 flex items-center gap-2">
          <StatusBadge status={node.status ?? 'idle'} />
          {node.status === 'failed' && (
            <button
              onClick={() => executeFrom(node.id)}
              disabled={isExecuting}
              className="text-[10px] text-[#ff9064] hover:underline disabled:opacity-50"
            >
              Retry from here
            </button>
          )}
        </div>
      </div>

      {/* Config fields */}
      {typeDef.config.length > 0 && (
        <div className="p-3 space-y-3">
          <h4 className="text-[10px] font-medium text-white/30 uppercase tracking-wider">Configuration</h4>
          {typeDef.config.map((field) => (
            <ConfigField
              key={field.id}
              field={field}
              value={node.config[field.id] ?? field.default}
              onChange={(val) => handleConfigChange(field.id, val)}
            />
          ))}
        </div>
      )}

      {/* Outputs viewer */}
      {node.status === 'done' && node.outputs && Object.keys(node.outputs).length > 0 && (
        <div className="p-3 border-t border-white/5 space-y-2">
          <h4 className="text-[10px] font-medium text-white/30 uppercase tracking-wider">Outputs</h4>

          {/* Image preview */}
          {typeof node.outputs.image === 'string' && (
            <div>
              <span className="text-[10px] text-white/30 block mb-1">Image</span>
              {node.outputs.image.startsWith('data:') ? (
                <img src={node.outputs.image} alt="Output" className="w-full rounded-lg" />
              ) : (
                <>
                  <img src={node.outputs.image} alt="Output" className="w-full rounded-lg mb-1" loading="lazy" />
                  <button
                    onClick={() => navigator.clipboard.writeText(node.outputs!.image as string)}
                    className="text-[9px] text-white/30 hover:text-white/60 transition-colors"
                  >
                    Copy URL
                  </button>
                </>
              )}
            </div>
          )}

          {/* Frame preview */}
          {typeof node.outputs.frame === 'string' && (
            <div>
              <span className="text-[10px] text-white/30 block mb-1">Extracted Frame</span>
              <img src={node.outputs.frame} alt="Frame" className="w-full rounded-lg" loading="lazy" />
            </div>
          )}

          {/* Video preview */}
          {typeof node.outputs.video === 'string' && (
            <div>
              <span className="text-[10px] text-white/30 block mb-1">Video</span>
              <video
                src={node.outputs.video}
                controls
                className="w-full rounded-lg"
                preload="metadata"
              />
              <button
                onClick={() => navigator.clipboard.writeText(node.outputs!.video as string)}
                className="text-[9px] text-white/30 hover:text-white/60 transition-colors mt-1"
              >
                Copy URL
              </button>
            </div>
          )}

          {/* Gate result */}
          {node.outputs.pass !== undefined && (
            <div className={`flex items-center gap-2 p-2 rounded-lg ${node.outputs.pass ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: node.outputs.pass ? '#4caf50' : '#ffb4ab' }}>
                {node.outputs.pass ? 'check_circle' : 'cancel'}
              </span>
              <div>
                <span className={`text-xs font-medium ${node.outputs.pass ? 'text-[#4caf50]' : 'text-[#ffb4ab]'}`}>
                  {node.outputs.pass ? 'Gate Passed' : 'Gate Failed'}
                </span>
                {node.outputs.score !== undefined && (
                  <span className="text-[10px] text-white/40 ml-2">
                    Score: {(node.outputs.score as number).toFixed(3)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Audio */}
          {typeof node.outputs.audio === 'string' && (
            <div>
              <span className="text-[10px] text-white/30 block mb-1">Audio</span>
              <audio src={node.outputs.audio} controls className="w-full" preload="metadata" />
            </div>
          )}

          {/* Refset info */}
          {node.outputs.count !== undefined && (
            <div className="text-[10px] text-white/40">
              {node.outputs.count as number} reference images loaded
            </div>
          )}

          {/* Prompt preview */}
          {typeof node.outputs.prompt === 'string' && (
            <div>
              <span className="text-[10px] text-white/30 block mb-1">Prompt</span>
              <p className="text-[10px] text-white/60 bg-white/5 rounded-lg p-2 break-words max-h-24 overflow-y-auto">
                {node.outputs.prompt}
              </p>
            </div>
          )}

          {/* Videos array */}
          {Array.isArray(node.outputs.videos) && (
            <div>
              <span className="text-[10px] text-white/30 block mb-1">{(node.outputs.videos as string[]).length} videos</span>
              {(node.outputs.videos as string[]).slice(0, 3).map((url, i) => (
                <video key={i} src={url} controls className="w-full rounded-lg mb-1" preload="metadata" />
              ))}
              {(node.outputs.videos as string[]).length > 3 && (
                <span className="text-[9px] text-white/30">+{(node.outputs.videos as string[]).length - 3} more</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error detail */}
      {node.error && (
        <div className="p-3 border-t border-white/5">
          <h4 className="text-[10px] font-medium text-[#ffb4ab]/60 uppercase mb-1">Error</h4>
          <p className="text-[10px] text-[#ffb4ab]/80 break-words">{node.error}</p>
        </div>
      )}

      {/* Delete */}
      <div className="p-3 border-t border-white/5">
        <button
          onClick={() => removeNode(node.id)}
          className="w-full text-xs text-red-400/60 hover:text-red-400 py-1.5 rounded-lg hover:bg-red-400/10 transition-colors"
        >
          Delete Node
        </button>
      </div>
    </div>
  );
});

// ─── Config Field Renderer ──────────────────────────────────────────

function ConfigField({
  field,
  value,
  onChange,
}: {
  field: ConfigFieldDef;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  switch (field.type) {
    case 'select':
      return (
        <label className="block">
          <span className="text-[10px] text-white/40 mb-0.5 block">{field.label}</span>
          <select
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white/80 outline-none focus:border-[#ff9064]/40"
          >
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      );

    case 'slider':
      return (
        <label className="block">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] text-white/40">{field.label}</span>
            <span className="text-[10px] text-white/60 font-mono">{String(value)}</span>
          </div>
          <input
            type="range"
            min={field.min ?? 0}
            max={field.max ?? 1}
            step={field.step ?? 0.01}
            value={Number(value)}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#ff9064]"
          />
        </label>
      );

    case 'number':
      return (
        <label className="block">
          <span className="text-[10px] text-white/40 mb-0.5 block">{field.label}</span>
          <input
            type="number"
            value={Number(value)}
            min={field.min}
            max={field.max}
            step={field.step ?? 1}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white/80 outline-none focus:border-[#ff9064]/40"
          />
        </label>
      );

    case 'boolean':
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 accent-[#ff9064]"
          />
          <span className="text-[10px] text-white/50">{field.label}</span>
        </label>
      );

    case 'text':
      return (
        <label className="block">
          <span className="text-[10px] text-white/40 mb-0.5 block">{field.label}</span>
          <input
            type="text"
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white/80 outline-none focus:border-[#ff9064]/40"
          />
        </label>
      );

    default:
      return null;
  }
}
