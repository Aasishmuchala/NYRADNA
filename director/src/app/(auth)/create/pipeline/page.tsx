'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useWizard } from '@/context/WizardContext';
import { isUltraUnlocked } from '@/lib/ultraLock';
import { UltraGate } from '@/components/ultra/UltraGate';
import { ULTRA_PIPELINE, DIRECTOR_PIPELINE } from '@/lib/pipeline/presets';

const SceneComposer = dynamic(
  () => import('@/components/ultra/SceneComposer'),
  { ssr: false, loading: () => <div className="flex-1 flex items-center justify-center text-on-surface/20 text-sm">Loading 3D Composer...</div> },
);

interface PipelineNode {
  id: string;
  title: string;
  imageUrl: string | null;
  status: 'ready' | 'generating' | 'completed' | 'failed';
  category?: string;
  prompt?: string;
}

export default function PipelinePage() {
  useEffect(() => { document.title = 'Pipeline — DIRECTOR'; }, []);

  const { state, update } = useWizard();
  const [hasMounted, setHasMounted] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [pipelineTab, setPipelineTab] = useState<'standard' | 'ultra'>('standard');
  const [showUltraGate, setShowUltraGate] = useState(false);
  const [showComposer, setShowComposer] = useState(false);

  useEffect(() => { setHasMounted(true); }, []);

  // Sync tab with wizard ultra state
  useEffect(() => {
    if (state.ultraModeEnabled && isUltraUnlocked()) {
      setPipelineTab('ultra');
    }
  }, [state.ultraModeEnabled]);

  const handleUltraTabClick = useCallback(() => {
    if (isUltraUnlocked()) {
      setPipelineTab('ultra');
      update({ ultraModeEnabled: true });
    } else {
      setShowUltraGate(true);
    }
  }, [update]);

  const handleUltraUnlock = useCallback(() => {
    setShowUltraGate(false);
    setPipelineTab('ultra');
    update({ ultraModeEnabled: true });
  }, [update]);

  const handleControlSourceChange = useCallback((source: 'ai-estimate' | '3d-composer' | 'upload') => {
    update({ controlSourceType: source });
    if (source === '3d-composer') {
      setShowComposer(true);
    }
  }, [update]);

  const activePipeline = pipelineTab === 'ultra' ? ULTRA_PIPELINE : DIRECTOR_PIPELINE;

  // Auto-build pipeline nodes from completed scenes
  const nodes: PipelineNode[] = useMemo(() => {
    return state.scenes
      .filter(s => s.status === 'completed' && s.imageUrl)
      .map((scene, i) => ({
        id: scene.id,
        title: scene.prompt?.slice(0, 40) || `Scene ${i + 1}`,
        imageUrl: scene.imageUrl,
        status: 'ready' as const,
        category: scene.assetCategory,
        prompt: scene.prompt,
      }));
  }, [state.scenes]);

  const selectedNodeData = nodes.find(n => n.id === selectedNode);

  if (!hasMounted) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-sm text-on-surface-variant">Loading pipeline...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-[calc(100vh-12rem)] -mt-8 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-2 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] tracking-[0.4em] uppercase text-primary font-bold block">Pipeline</span>
            <h1 className="font-headline font-light text-2xl tracking-[-0.03em] text-on-surface">
              {nodes.length} Scene{nodes.length !== 1 ? 's' : ''} Connected
            </h1>
          </div>
          <div className="flex items-center gap-3 text-[10px] tracking-[0.2em] uppercase text-on-surface-variant font-bold">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success" />
              {nodes.filter(n => n.status === 'ready').length} Ready
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {nodes.filter(n => n.status === 'generating').length} Generating
            </span>
          </div>
        </div>

        {/* Pipeline mode tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setPipelineTab('standard'); update({ ultraModeEnabled: false }); }}
            className={`px-4 py-2 rounded-lg text-[10px] tracking-[0.2em] uppercase font-bold transition-all ${
              pipelineTab === 'standard'
                ? 'bg-surface-container-highest text-on-surface'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Standard
          </button>
          <button
            onClick={handleUltraTabClick}
            className={`px-4 py-2 rounded-lg text-[10px] tracking-[0.2em] uppercase font-bold transition-all flex items-center gap-1.5 ${
              pipelineTab === 'ultra'
                ? 'bg-primary/10 text-primary shadow-[0_0_16px_rgba(198,191,255,0.12)] border border-primary/30'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-sm">movie_filter</span>
            Ultra Consistency
            {!isUltraUnlocked() && (
              <span className="material-symbols-outlined text-xs opacity-60">lock</span>
            )}
          </button>

          {/* Active pipeline indicator */}
          <span className="ml-auto text-[10px] text-on-surface-variant/50 tracking-wider">
            {activePipeline.name} ({activePipeline.nodes.length} nodes)
          </span>
        </div>

        {/* Ultra-specific controls */}
        {pipelineTab === 'ultra' && (
          <div className="flex items-center gap-3 pt-1">
            {/* Control source selector */}
            <div className="flex items-center gap-1 bg-surface-container-low rounded-lg p-1 border border-outline-variant/15">
              {([
                { value: 'ai-estimate' as const, label: 'AI Estimate', icon: 'auto_awesome' },
                { value: '3d-composer' as const, label: '3D Composer', icon: 'view_in_ar' },
                { value: 'upload' as const, label: 'Upload', icon: 'upload' },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleControlSourceChange(opt.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] tracking-[0.15em] uppercase font-bold transition-all ${
                    state.controlSourceType === opt.value
                      ? 'bg-primary/10 text-primary'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Open 3D Composer standalone button */}
            <button
              onClick={() => setShowComposer(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/20 text-primary text-[10px] tracking-[0.15em] uppercase font-bold hover:bg-primary/5 transition-all"
            >
              <span className="material-symbols-outlined text-sm">view_in_ar</span>
              3D Composer
            </button>
          </div>
        )}
      </div>

      {/* Canvas — full width horizontal scroll */}
      {nodes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/20">account_tree</span>
          <p className="text-on-surface-variant/60 text-sm tracking-widest uppercase">No scenes in pipeline</p>
          <p className="text-on-surface-variant/30 text-xs">Generate scenes in the Review step first</p>
          <Link href="/create/review" className="mt-4 px-6 py-2.5 rounded-full bg-primary/10 text-primary text-[10px] tracking-[0.2em] uppercase font-bold hover:bg-primary/20 transition-colors">
            Go to Review
          </Link>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
          <div className="flex items-center gap-0 min-w-max h-full px-4 py-8">
            {nodes.map((node, i) => (
              <React.Fragment key={node.id}>
                {/* Node card */}
                <button
                  onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                  className={`shrink-0 w-64 rounded-xl overflow-hidden border transition-all duration-300 cursor-pointer ${
                    selectedNode === node.id
                      ? 'border-primary ring-2 ring-primary/20 scale-105'
                      : 'border-outline-variant/20 hover:border-outline-variant/40 hover:scale-[1.02]'
                  } bg-surface-container`}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-surface-container-highest">
                    {node.imageUrl ? (
                      <img src={node.imageUrl} alt={node.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl text-on-surface-variant/20">image</span>
                      </div>
                    )}
                    {/* Node number */}
                    <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                      <span className="text-[11px] font-bold text-on-surface">{String(i + 1).padStart(2, '0')}</span>
                    </div>
                    {/* Status */}
                    <div className="absolute top-2 right-2">
                      {node.status === 'ready' && (
                        <span className="px-2 py-0.5 rounded-full bg-success/80 text-[9px] font-bold uppercase text-on-surface">Ready</span>
                      )}
                      {node.status === 'generating' && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/80 text-[9px] font-bold uppercase text-on-surface animate-pulse">Generating</span>
                      )}
                      {node.status === 'completed' && (
                        <span className="px-2 py-0.5 rounded-full bg-success/80 text-[9px] font-bold uppercase text-on-surface">Done</span>
                      )}
                      {node.status === 'failed' && (
                        <span className="px-2 py-0.5 rounded-full bg-error/80 text-[9px] font-bold uppercase text-on-surface">Failed</span>
                      )}
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-3">
                    <p className="text-xs font-semibold text-on-surface truncate">{node.title}</p>
                    {node.category && (
                      <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">{node.category}</span>
                    )}
                  </div>
                </button>

                {/* Connector arrow */}
                {i < nodes.length - 1 && (
                  <div className="shrink-0 flex items-center px-2">
                    <div className="w-8 h-[2px] bg-outline-variant/30" />
                    <span className="material-symbols-outlined text-outline-variant/50 text-sm -ml-1">chevron_right</span>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Selected node detail panel */}
      {selectedNodeData && (
        <div className="shrink-0 border-t border-outline-variant/20 bg-surface-container-lowest/80 backdrop-blur-xl px-8 py-4">
          <div className="flex items-start gap-6 max-w-4xl">
            {selectedNodeData.imageUrl && (
              <img src={selectedNodeData.imageUrl} alt="" className="w-32 h-20 rounded-lg object-cover shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-on-surface">{selectedNodeData.title}</h3>
              {selectedNodeData.prompt && (
                <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{selectedNodeData.prompt}</p>
              )}
              {selectedNodeData.category && (
                <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">{selectedNodeData.category}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="shrink-0 border-t border-outline-variant/20 px-8 py-4 flex justify-between items-center bg-surface-container-lowest/80 backdrop-blur-xl">
        <Link href="/create/review" className="px-6 py-2.5 rounded-full text-on-surface-variant text-[10px] tracking-[0.2em] uppercase font-bold hover:text-on-surface transition-colors">
          Back to Review
        </Link>
        <div className="flex items-center gap-3">
          {pipelineTab === 'ultra' && (
            <span className="flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase font-bold text-primary/60">
              <span className="material-symbols-outlined text-sm">movie_filter</span>
              Ultra
            </span>
          )}
          <Link
            href={nodes.length > 0 ? '/create/generating' : '#'}
            className={`flex items-center gap-2 px-8 py-3 rounded-full bg-primary text-on-primary-fixed text-[10px] tracking-[0.2em] uppercase font-bold shadow-[0_0_30px_rgba(198,191,255,0.2)] hover:scale-105 active:scale-95 transition-all ${
              nodes.length === 0 ? 'opacity-40 cursor-not-allowed hover:scale-100' : ''
            }`}
          >
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            Generate Film ({nodes.length} scenes)
          </Link>
        </div>
      </div>

      {/* Ultra Gate modal */}
      <UltraGate
        open={showUltraGate}
        onClose={() => setShowUltraGate(false)}
        onUnlock={handleUltraUnlock}
      />

      {/* 3D Composer overlay */}
      {showComposer && (
        <div className="fixed inset-0 z-50 flex flex-col bg-surface/95 backdrop-blur-xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">view_in_ar</span>
              <h2 className="text-sm font-bold font-headline text-on-surface">3D Scene Composer</h2>
            </div>
            <button
              onClick={() => setShowComposer(false)}
              className="px-4 py-2 rounded-lg text-on-surface-variant text-[10px] tracking-[0.2em] uppercase font-bold hover:text-on-surface transition-colors"
            >
              Close
            </button>
          </div>
          <div className="flex-1">
            <SceneComposer />
          </div>
        </div>
      )}
    </main>
  );
}
