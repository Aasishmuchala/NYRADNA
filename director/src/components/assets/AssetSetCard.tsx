'use client';

import type { AssetSet } from '@/lib/types/asset-set';

interface AssetSetCardProps {
  set: AssetSet;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function AssetSetCard({ set, isActive, onSelect, onDelete }: AssetSetCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(set.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(set.id);
        }
      }}
      className={`group relative cursor-pointer rounded-xl border-l-4 p-4 transition-colors ${
        isActive
          ? 'border-[#7F72F7] bg-[#1A1A2E]'
          : 'border-transparent bg-[#1A1A2E] hover:bg-[#1A1A2E]'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined mt-0.5 text-[20px] text-[#6B6B80]">
          photo_library
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-white">{set.name}</h3>
          {set.description && (
            <p className="mt-0.5 truncate text-xs text-[#A0A0B8]">{set.description}</p>
          )}
          <p className="mt-1 text-xs font-medium text-[#7F72F7]">
            {set.items.length} {set.items.length === 1 ? 'asset' : 'assets'}
          </p>
        </div>
      </div>

      {/* Delete button - visible on hover */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(set.id);
        }}
        className="absolute right-2 top-2 rounded-md p-1 text-[#6B6B80] opacity-0 transition-opacity hover:bg-[#1A1A2E] hover:text-red-400 group-hover:opacity-100"
        title="Delete set"
      >
        <span className="material-symbols-outlined text-[16px]">delete</span>
      </button>
    </div>
  );
}
