'use client';

import { memo } from 'react';
import type { PipelineGap, GapSeverity } from '@/lib/types/pipeline-gap';

interface GapMarkerProps {
  gaps: PipelineGap[];
  onClick: () => void;
}

const severityStyles: Record<GapSeverity, string> = {
  critical: 'bg-red-500/20 border-red-500 text-red-400',
  moderate: 'bg-amber-500/20 border-amber-500 text-amber-400',
  minor:    'bg-[#555]/20 border-[#555] text-[#A0A0B8]',
};

function highestSeverity(gaps: PipelineGap[]): GapSeverity {
  const order: GapSeverity[] = ['critical', 'moderate', 'minor'];
  for (const level of order) {
    if (gaps.some((g) => g.severity === level)) return level;
  }
  return 'minor';
}

function GapMarker({ gaps, onClick }: GapMarkerProps) {
  if (gaps.length === 0) return null;

  const severity = highestSeverity(gaps);
  const styles = severityStyles[severity];
  const hasMultiple = gaps.length > 1;

  // For a single gap, show an icon based on type; for multiple, show count
  const icon = hasMultiple
    ? null
    : gaps[0].gapType === 'narrative'
      ? 'warning'
      : 'palette';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`flex h-7 w-7 items-center justify-center rounded-full border ${styles} cursor-pointer hover:scale-110 transition-transform`}
      title={hasMultiple ? `${gaps.length} gaps detected` : gaps[0].title}
    >
      {hasMultiple ? (
        <span className="text-xs font-bold">{gaps.length}</span>
      ) : (
        <span className="material-symbols-outlined text-sm">{icon}</span>
      )}
    </button>
  );
}

export default memo(GapMarker);
