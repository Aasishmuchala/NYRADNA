'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PipelineProvider } from '@/context/PipelineContext';
import { NodeCanvas } from '@/components/pipeline/NodeCanvas';
import { PIPELINE_PRESETS } from '@/lib/pipeline/presets';
import { listSavedPipelines, loadPipeline } from '@/lib/pipeline/serialization';
import type { PipelineGraph } from '@/lib/pipeline/graph';

export default function PipelinePage() {
  useEffect(() => {
    document.title = 'Pipeline — DIRECTOR';
  }, []);

  const [selectedPreset, setSelectedPreset] = useState<PipelineGraph | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    // Default to the first preset
    setSelectedPreset(PIPELINE_PRESETS[0] ?? null);
  }, []);

  const savedPipelines = hasMounted ? listSavedPipelines() : [];

  const handleLoadSaved = (id: string) => {
    const graph = loadPipeline(id);
    if (graph) setSelectedPreset(graph);
  };

  if (!hasMounted) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-sm text-on-surface-variant">Loading pipeline editor...</span>
        </div>
      </main>
    );
  }

  if (!selectedPreset) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
        <h1 className="text-xl font-semibold text-white/80">Pipeline Editor</h1>
        <p className="text-sm text-white/40 max-w-md text-center">
          Build custom video generation pipelines with quality gates. Drag nodes, connect ports, and run.
        </p>

        <div className="grid grid-cols-2 gap-4 max-w-lg w-full">
          {PIPELINE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setSelectedPreset(preset)}
              className="bg-surface-container/80 border border-white/10 rounded-xl p-4 text-left hover:border-primary/30 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <h3 className="text-sm font-medium text-white/80 mb-1">{preset.name}</h3>
              <p className="text-[10px] text-white/30">{preset.description}</p>
              <span className="text-[10px] text-white/20 mt-2 block">
                {preset.nodes.length} nodes, {preset.edges.length} edges
              </span>
            </button>
          ))}
        </div>

        {savedPipelines.length > 0 && (
          <div className="mt-4">
            <h2 className="text-xs font-medium text-white/40 mb-2">Saved Pipelines</h2>
            {savedPipelines.map((entry) => (
              <button
                key={entry.id}
                onClick={() => handleLoadSaved(entry.id)}
                className="block w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-xs text-white/60"
              >
                {entry.name}
              </button>
            ))}
          </div>
        )}

        <Link
          href="/create/generating"
          className="text-xs text-white/30 hover:text-white/50 mt-4"
        >
          Back to Simple Mode
        </Link>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden">
      <PipelineProvider initialGraph={selectedPreset}>
        <NodeCanvas />
      </PipelineProvider>
    </main>
  );
}
