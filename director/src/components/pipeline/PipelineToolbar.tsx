'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { usePipeline } from '@/context/PipelineContext';
import { validateGraph } from '@/lib/pipeline/validation';
import { NODE_TYPE_REGISTRY } from '@/lib/pipeline/nodeTypes';
import { savePipeline, listSavedPipelines, loadPipeline } from '@/lib/pipeline/serialization';
import { PIPELINE_PRESETS } from '@/lib/pipeline/presets';

export function PipelineToolbar() {
  const { graph, setGraph, execute, abort, isExecuting } = usePipeline();
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showLoadMenu, setShowLoadMenu] = useState(false);
  const [savedList, setSavedList] = useState<{ id: string; name: string }[]>([]);
  const [saveFlash, setSaveFlash] = useState(false);

  useEffect(() => {
    if (showLoadMenu) {
      setSavedList(listSavedPipelines().map((e) => ({ id: e.id, name: e.name })));
    }
  }, [showLoadMenu]);

  const handleRun = useCallback(() => {
    const result = validateGraph(graph, NODE_TYPE_REGISTRY);
    if (!result.valid) {
      const errors = result.issues
        .filter((i) => i.severity === 'error')
        .map((e) => e.message);
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);
    execute();
  }, [graph, execute]);

  const handleSave = useCallback(() => {
    savePipeline(graph);
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1200);
  }, [graph]);

  const handleLoad = useCallback((id: string) => {
    const loaded = loadPipeline(id);
    if (loaded) setGraph(loaded);
    setShowLoadMenu(false);
  }, [setGraph]);

  const handlePreset = useCallback((presetId: string) => {
    const preset = PIPELINE_PRESETS.find((p) => p.id === presetId);
    if (preset) setGraph({ ...preset, id: `${preset.id}-${Date.now()}` });
    setShowLoadMenu(false);
  }, [setGraph]);

  const nodeCount = graph.nodes.length;
  const edgeCount = graph.edges.length;
  const doneCount = graph.nodes.filter((n) => n.status === 'done').length;
  const failedCount = graph.nodes.filter((n) => n.status === 'failed').length;

  // Live validation — runs on every graph change
  const liveIssues = useMemo(() => {
    if (nodeCount === 0) return [];
    const result = validateGraph(graph, NODE_TYPE_REGISTRY);
    return result.issues;
  }, [graph, nodeCount]);
  const liveErrorCount = liveIssues.filter((i) => i.severity === 'error').length;
  const liveWarnCount = liveIssues.filter((i) => i.severity === 'warning').length;
  const [showLiveErrors, setShowLiveErrors] = useState(false);

  return (
    <div className="h-12 bg-[#141414]/95 backdrop-blur-lg border-b border-white/5 flex items-center px-4 gap-3 relative">
      {/* Run / Stop */}
      {isExecuting ? (
        <button
          onClick={abort}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>stop</span>
          Stop
        </button>
      ) : (
        <button
          onClick={handleRun}
          disabled={nodeCount === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ff9064]/20 text-[#ff9064] text-xs font-medium hover:bg-[#ff9064]/30 transition-colors disabled:opacity-30"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>play_arrow</span>
          Run Pipeline
        </button>
      )}

      {/* Divider */}
      <div className="w-px h-5 bg-white/10" />

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={nodeCount === 0}
        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-30 ${
          saveFlash
            ? 'bg-green-500/20 text-green-400'
            : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
        }`}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>save</span>
        {saveFlash ? 'Saved' : 'Save'}
      </button>

      {/* Load / Presets dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowLoadMenu(!showLoadMenu)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 text-white/50 text-xs hover:bg-white/10 hover:text-white/70 transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>folder_open</span>
          Load
          <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>expand_more</span>
        </button>

        {showLoadMenu && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
            {/* Presets section */}
            <div className="px-3 pt-2.5 pb-1">
              <span className="text-[9px] font-medium text-white/30 uppercase tracking-wider">Presets</span>
            </div>
            {PIPELINE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePreset(preset.id)}
                className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors"
              >
                <div className="text-xs text-white/70">{preset.name}</div>
                <div className="text-[10px] text-white/30">{preset.description}</div>
              </button>
            ))}

            {/* Saved pipelines section */}
            {savedList.length > 0 && (
              <>
                <div className="border-t border-white/5 mx-2 my-1" />
                <div className="px-3 pt-1.5 pb-1">
                  <span className="text-[9px] font-medium text-white/30 uppercase tracking-wider">Saved</span>
                </div>
                {savedList.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleLoad(item.id)}
                    className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors"
                  >
                    <div className="text-xs text-white/70">{item.name}</div>
                  </button>
                ))}
              </>
            )}

            {/* Close overlay */}
            <div
              className="fixed inset-0 z-[-1]"
              onClick={() => setShowLoadMenu(false)}
            />
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-white/10" />

      {/* Stats */}
      <div className="flex items-center gap-3 text-[10px] text-white/30">
        <span>{nodeCount} nodes</span>
        <span>{edgeCount} edges</span>
        {isExecuting && (
          <span className="text-[#ff9064]">
            {doneCount}/{nodeCount} complete
          </span>
        )}
        {failedCount > 0 && (
          <span className="text-[#ffb4ab]">{failedCount} failed</span>
        )}
      </div>

      {/* Live validation badge */}
      {(liveErrorCount > 0 || liveWarnCount > 0) && (
        <div className="relative">
          <button
            onClick={() => setShowLiveErrors(!showLiveErrors)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] transition-colors ${
              liveErrorCount > 0
                ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
                : 'bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/25'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
              {liveErrorCount > 0 ? 'error' : 'warning'}
            </span>
            {liveErrorCount > 0 && <span>{liveErrorCount} error{liveErrorCount !== 1 ? 's' : ''}</span>}
            {liveWarnCount > 0 && <span>{liveWarnCount} warn</span>}
          </button>
          {showLiveErrors && (
            <div className="absolute top-full right-0 mt-1 w-72 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 p-3 max-h-48 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-medium text-white/30 uppercase tracking-wider">Issues</span>
                <button onClick={() => setShowLiveErrors(false)} className="text-white/30 hover:text-white/60 text-xs">&times;</button>
              </div>
              {liveIssues.map((issue, i) => (
                <div key={i} className={`text-[10px] py-0.5 ${issue.severity === 'error' ? 'text-red-400' : 'text-yellow-400/80'}`}>
                  {issue.message}
                </div>
              ))}
              <div className="fixed inset-0 z-[-1]" onClick={() => setShowLiveErrors(false)} />
            </div>
          )}
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Pipeline name */}
      <span className="text-xs text-white/40">{graph.name || 'Untitled Pipeline'}</span>
    </div>
  );
}
