'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { usePipeline } from '@/context/PipelineContext';
import { getNodeType } from '@/lib/pipeline/nodeTypes';
import { canConnect } from '@/lib/pipeline/validation';
import { NODE_TYPE_REGISTRY } from '@/lib/pipeline/nodeTypes';
import { savePipeline } from '@/lib/pipeline/serialization';
import { NodeCard } from './NodeCard';
import { EdgeLine, EdgeDraft } from './EdgeLine';
import { NodePalette } from './NodePalette';
import { NodeInspector } from './NodeInspector';
import { PipelineToolbar } from './PipelineToolbar';

// ─── Port Position Calculation ──────────────────────────────────────

const NODE_WIDTH = 200;
const PORT_RADIUS = 6;
const HEADER_HEIGHT = 36;
const PORT_HEIGHT = 20;
const PORT_GAP = 4;

function getPortPosition(
  nodeX: number,
  nodeY: number,
  portIndex: number,
  side: 'input' | 'output',
): { x: number; y: number } {
  const x = side === 'input' ? nodeX + PORT_RADIUS : nodeX + NODE_WIDTH - PORT_RADIUS;
  const y = nodeY + HEADER_HEIGHT + 8 + portIndex * (PORT_HEIGHT + PORT_GAP) + PORT_HEIGHT / 2;
  return { x, y };
}

// ─── Canvas Component ───────────────────────────────────────────────

export function NodeCanvas() {
  const {
    graph,
    selectedNodeId,
    selectNode,
    addEdge,
    removeEdge,
    removeNode,
    updateNodePosition,
    undo,
    redo,
  } = usePipeline();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Node dragging
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Edge dragging
  const [edgeDraft, setEdgeDraft] = useState<{
    nodeId: string;
    portId: string;
    side: 'input' | 'output';
    startPos: { x: number; y: number };
    mousePos: { x: number; y: number };
  } | null>(null);

  // ── Pan / Zoom ────────────────────────────────────────────────

  // Attach wheel listener natively with { passive: false } so preventDefault works
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((prev) => Math.min(2, Math.max(0.25, prev - e.deltaY * 0.001)));
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Middle mouse or Space+click = pan
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        setIsPanning(true);
        panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
        e.preventDefault();
      } else if (e.button === 0) {
        // Click on canvas background = deselect
        if ((e.target as HTMLElement) === canvasRef.current?.querySelector('[data-canvas-bg]')) {
          selectNode(null);
        }
      }
    },
    [pan, selectNode],
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setPan({
          x: panStart.current.panX + (e.clientX - panStart.current.x),
          y: panStart.current.panY + (e.clientY - panStart.current.y),
        });
      }

      if (draggingNodeId) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = (e.clientX - rect.left - pan.x) / zoom - dragOffset.current.x;
        const y = (e.clientY - rect.top - pan.y) / zoom - dragOffset.current.y;
        updateNodePosition(draggingNodeId, { x: Math.round(x), y: Math.round(y) });
      }

      if (edgeDraft) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        setEdgeDraft((prev) =>
          prev
            ? {
                ...prev,
                mousePos: {
                  x: (e.clientX - rect.left - pan.x) / zoom,
                  y: (e.clientY - rect.top - pan.y) / zoom,
                },
              }
            : null,
        );
      }
    },
    [isPanning, draggingNodeId, edgeDraft, pan, zoom, updateNodePosition],
  );

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false);
    setDraggingNodeId(null);
    setEdgeDraft(null);
  }, []);

  // ── Node Dragging ─────────────────────────────────────────────

  const handleNodeDragStart = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      const node = graph.nodes.find((n) => n.id === nodeId);
      if (!node) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      dragOffset.current = {
        x: (e.clientX - rect.left - pan.x) / zoom - node.position.x,
        y: (e.clientY - rect.top - pan.y) / zoom - node.position.y,
      };
      setDraggingNodeId(nodeId);
    },
    [graph.nodes, pan, zoom],
  );

  // ── Port Dragging (Edge Creation) ─────────────────────────────

  const handlePortDragStart = useCallback(
    (nodeId: string, portId: string, side: 'input' | 'output', e: React.MouseEvent) => {
      const node = graph.nodes.find((n) => n.id === nodeId);
      if (!node) return;

      const typeDef = getNodeType(node.type);
      if (!typeDef) return;

      const ports = side === 'output' ? typeDef.outputs : typeDef.inputs;
      const portIndex = ports.findIndex((p) => p.id === portId);
      if (portIndex < 0) return;
      const pos = getPortPosition(node.position.x, node.position.y, portIndex, side);

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      setEdgeDraft({
        nodeId,
        portId,
        side,
        startPos: pos,
        mousePos: {
          x: (e.clientX - rect.left - pan.x) / zoom,
          y: (e.clientY - rect.top - pan.y) / zoom,
        },
      });
    },
    [graph.nodes, pan, zoom],
  );

  const handlePortDragEnd = useCallback(
    (nodeId: string, portId: string, side: 'input' | 'output') => {
      if (!edgeDraft) return;

      // Must connect output → input
      let source: { nodeId: string; portId: string };
      let target: { nodeId: string; portId: string };

      if (edgeDraft.side === 'output' && side === 'input') {
        source = { nodeId: edgeDraft.nodeId, portId: edgeDraft.portId };
        target = { nodeId, portId };
      } else if (edgeDraft.side === 'input' && side === 'output') {
        source = { nodeId, portId };
        target = { nodeId: edgeDraft.nodeId, portId: edgeDraft.portId };
      } else {
        setEdgeDraft(null);
        return;
      }

      // Validate connection
      const error = canConnect(graph, NODE_TYPE_REGISTRY, source.nodeId, source.portId, target.nodeId, target.portId);
      if (error) {
        console.warn('[Pipeline] Cannot connect:', error);
        setEdgeDraft(null);
        return;
      }

      addEdge(source, target);
      setEdgeDraft(null);
    },
    [edgeDraft, graph, addEdge],
  );

  // ── Keyboard ──────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? '').toUpperCase();
      const isInput = tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';

      // Escape — deselect
      if (e.key === 'Escape') {
        selectNode(null);
        return;
      }

      // Ctrl/Cmd+Z — undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y — redo
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }

      // Ctrl/Cmd+S — save pipeline
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        savePipeline(graph);
        return;
      }

      // Delete / Backspace — remove selected node (skip if typing in input)
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput) {
        if (selectedNodeId) {
          removeNode(selectedNodeId);
          selectNode(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, graph, selectNode, removeNode, undo, redo]);

  // ── Render Edge Positions ─────────────────────────────────────

  const edgePositions = useMemo(
    () =>
      graph.edges.map((edge) => {
        const sourceNode = graph.nodes.find((n) => n.id === edge.sourceNodeId);
        const targetNode = graph.nodes.find((n) => n.id === edge.targetNodeId);
        if (!sourceNode || !targetNode) return null;

        const sourceType = getNodeType(sourceNode.type);
        const targetType = getNodeType(targetNode.type);
        if (!sourceType || !targetType) return null;

        const sourceIdx = sourceType.outputs.findIndex((p) => p.id === edge.sourcePortId);
        const targetIdx = targetType.inputs.findIndex((p) => p.id === edge.targetPortId);
        if (sourceIdx < 0 || targetIdx < 0) return null;

        return {
          edge,
          sourcePos: getPortPosition(sourceNode.position.x, sourceNode.position.y, sourceIdx, 'output'),
          targetPos: getPortPosition(targetNode.position.x, targetNode.position.y, targetIdx, 'input'),
        };
      }),
    [graph.edges, graph.nodes],
  );

  return (
    <div className="flex flex-col h-full">
      <PipelineToolbar />
      <div className="flex flex-1 overflow-hidden">
        <NodePalette />

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 relative overflow-hidden bg-surface-container-lowest"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        >
          {/* Grid background */}
          <div
            data-canvas-bg
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)`,
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              backgroundPosition: `${pan.x}px ${pan.y}px`,
            }}
          />

          {/* Transform container */}
          <div
            className="absolute origin-top-left"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          >
            {/* SVG layer for edges */}
            <svg
              className="absolute inset-0"
              style={{ width: '10000px', height: '10000px', overflow: 'visible' }}
            >
              {edgePositions.map(
                (ep) =>
                  ep && (
                    <EdgeLine
                      key={ep.edge.id}
                      edge={ep.edge}
                      sourcePos={ep.sourcePos}
                      targetPos={ep.targetPos}
                      onDelete={removeEdge}
                    />
                  ),
              )}
              {edgeDraft && (
                <EdgeDraft
                  from={edgeDraft.startPos}
                  to={edgeDraft.mousePos}
                />
              )}
            </svg>

            {/* Node cards */}
            {graph.nodes.map((node) => (
              <NodeCard
                key={node.id}
                node={node}
                selected={node.id === selectedNodeId}
                onSelect={selectNode}
                onDragStart={handleNodeDragStart}
                onPortDragStart={handlePortDragStart}
                onPortDragEnd={handlePortDragEnd}
              />
            ))}
          </div>

          {/* Zoom indicator */}
          <div className="absolute bottom-3 left-3 text-[10px] text-on-surface/20 font-mono">
            {Math.round(zoom * 100)}%
          </div>
        </div>

        <NodeInspector />
      </div>
    </div>
  );
}
