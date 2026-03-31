'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { AssetSetItem } from '@/lib/types/asset-set';

interface AssetItemGridProps {
  items: AssetSetItem[];
  onReorder: (itemIds: string[]) => void;
  onRemove: (itemId: string) => void;
}

interface SortableItemProps {
  item: AssetSetItem;
  onRemove: (itemId: string) => void;
}

function SortableItem({ item, onRemove }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const typeBadgeColor: Record<string, string> = {
    image: 'bg-blue-500/20 text-blue-400',
    video: 'bg-purple-500/20 text-purple-400',
    audio: 'bg-green-500/20 text-green-400',
  };

  const typeIcon: Record<string, string> = {
    video: 'videocam',
    audio: 'music_note',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group relative cursor-grab rounded-lg bg-[#1A1A2E] p-2 transition-colors hover:bg-[#1A1A2E] active:cursor-grabbing"
    >
      {/* Thumbnail */}
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-[#0A0A0F]">
        {item.type === 'image' ? (
          <img
            src={item.thumbnailUrl || item.url}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-[#6B6B80]">
              {typeIcon[item.type] || 'insert_drive_file'}
            </span>
          </div>
        )}
      </div>

      {/* Item name */}
      <p className="mt-1.5 truncate text-xs text-[#A0A0B8]">{item.name}</p>

      {/* Type badge */}
      <span
        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
          typeBadgeColor[item.type] || 'bg-[#1A1A2E] text-[#A0A0B8]'
        }`}
      >
        {item.type}
      </span>

      {/* Provenance badge */}
      {item.metadata?.source === 'gap-fill' && (
        <span
          className="mt-1 inline-flex items-center gap-0.5 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-400"
          title="AI-generated bridge scene"
        >
          <span className="material-symbols-outlined text-[12px]">auto_fix_high</span>
          Gap Fill
        </span>
      )}
      {item.metadata?.source === 'video-generation' && (
        <span
          className="mt-1 inline-flex items-center gap-0.5 rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-medium text-purple-400"
          title="AI-generated video from pipeline node"
        >
          <span className="material-symbols-outlined text-[12px]">smart_display</span>
          Generated
        </span>
      )}

      {/* Remove button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(item.id);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute right-1 top-1 rounded-md bg-[#0A0A0F]/80 p-0.5 text-[#6B6B80] opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
        title="Remove asset"
      >
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  );
}

export default function AssetItemGrid({ items, onReorder, onRemove }: AssetItemGridProps) {
  const [itemOrder, setItemOrder] = useState<string[]>(() => items.map((i) => i.id));

  // Keep order in sync when items change externally
  const currentIds = items.map((i) => i.id);
  if (
    currentIds.length !== itemOrder.length ||
    currentIds.some((id, idx) => id !== itemOrder[idx])
  ) {
    // Only reset if genuinely out of sync (not during drag)
    if (currentIds.length !== itemOrder.length ||
        !currentIds.every((id) => itemOrder.includes(id))) {
      setItemOrder(currentIds);
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = currentIds.indexOf(active.id as string);
    const newIndex = currentIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(currentIds, oldIndex, newIndex);
    setItemOrder(newOrder);
    onReorder(newOrder);
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-[#7F72F7]/10 p-8">
        <p className="text-center text-sm text-[#6B6B80]">
          No assets yet. Upload or add assets to get started.
        </p>
      </div>
    );
  }

  // Sort items according to current order
  const sortedItems = currentIds.map((id) => items.find((i) => i.id === id)!).filter(Boolean);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={currentIds} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {sortedItems.map((item) => (
            <SortableItem key={item.id} item={item} onRemove={onRemove} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
