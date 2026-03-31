'use client';

import { useState } from 'react';
import { usePipelineNodeStore } from '@/lib/stores/pipeline-node-store';
import type { PipelineNode } from '@/lib/types/pipeline-node';

interface NodeControlsProps {
  selectedNodeId: string | null;
  nodes: PipelineNode[];
  assetSetId: string;
}

export default function NodeControls({ selectedNodeId, nodes, assetSetId }: NodeControlsProps) {
  const removeNode = usePipelineNodeStore((s) => s.removeNode);
  const reorderNodes = usePipelineNodeStore((s) => s.reorderNodes);
  const addNode = usePipelineNodeStore((s) => s.addNode);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const selectedIndex = selectedNodeId
    ? nodes.findIndex((n) => n.id === selectedNodeId)
    : -1;
  const canMoveUp = selectedIndex > 0;
  const canMoveDown = selectedIndex >= 0 && selectedIndex < nodes.length - 1;

  async function handleRemove() {
    if (!selectedNodeId) return;
    await removeNode(selectedNodeId);
  }

  async function handleMoveUp() {
    if (!canMoveUp || selectedIndex < 1) return;
    const ids = nodes.map((n) => n.id);
    // Swap selected with previous
    [ids[selectedIndex - 1], ids[selectedIndex]] = [ids[selectedIndex], ids[selectedIndex - 1]];
    await reorderNodes(assetSetId, ids);
  }

  async function handleMoveDown() {
    if (!canMoveDown || selectedIndex < 0) return;
    const ids = nodes.map((n) => n.id);
    // Swap selected with next
    [ids[selectedIndex], ids[selectedIndex + 1]] = [ids[selectedIndex + 1], ids[selectedIndex]];
    await reorderNodes(assetSetId, ids);
  }

  async function handleAdd() {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    await addNode({
      projectId: 'default-project',
      assetSetId,
      assetItemId: '',
      position: nodes.length,
      title: trimmed,
      description: '',
      narrativeContext: {
        emotionalTone: 'neutral',
        transitionFromPrevious: 'cut',
        durationHint: '3-5 seconds',
      },
      thumbnailUrl: null,
    });
    setNewTitle('');
    setShowAddForm(false);
  }

  return (
    <div className="flex items-center gap-2 rounded-xl bg-white/5 p-3">
      {/* Remove Node */}
      <button
        type="button"
        onClick={handleRemove}
        disabled={!selectedNodeId}
        className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-sm text-[#c8c4d6] transition-colors hover:bg-red-900/30 hover:text-red-300 disabled:opacity-40 disabled:hover:bg-white/5 disabled:hover:text-[#c8c4d6]"
      >
        <span className="material-symbols-outlined text-[18px]">delete</span>
        Remove
      </button>

      {/* Move Up */}
      <button
        type="button"
        onClick={handleMoveUp}
        disabled={!canMoveUp}
        className="flex items-center gap-1 rounded-lg bg-white/5 px-3 py-2 text-sm text-[#c8c4d6] transition-colors hover:bg-[#c6bfff]/10 hover:text-white disabled:opacity-40 disabled:hover:bg-white/5 disabled:hover:text-[#c8c4d6]"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
      </button>

      {/* Move Down */}
      <button
        type="button"
        onClick={handleMoveDown}
        disabled={!canMoveDown}
        className="flex items-center gap-1 rounded-lg bg-white/5 px-3 py-2 text-sm text-[#c8c4d6] transition-colors hover:bg-[#c6bfff]/10 hover:text-white disabled:opacity-40 disabled:hover:bg-white/5 disabled:hover:text-[#c8c4d6]"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Add Node */}
      {showAddForm ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Node title"
            className="rounded-lg border border-[#c6bfff]/10 bg-[#1f1f24] px-3 py-2 text-sm text-white placeholder-[#928f9f] focus:border-[#c6bfff]/50 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') {
                setShowAddForm(false);
                setNewTitle('');
              }
            }}
            autoFocus
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newTitle.trim()}
            className="rounded-lg bg-[#c6bfff] px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-[#c6bfff] disabled:opacity-50"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAddForm(false);
              setNewTitle('');
            }}
            className="rounded-lg bg-white/5 px-3 py-2 text-sm text-[#c8c4d6] transition-colors hover:bg-[#c6bfff]/10"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 rounded-lg bg-[#c6bfff] px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-[#c6bfff]"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Node
        </button>
      )}
    </div>
  );
}
