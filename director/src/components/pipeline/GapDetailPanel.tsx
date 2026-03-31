'use client';

import type { PipelineGap } from '@/lib/types/pipeline-gap';
import { useGapStore } from '@/lib/stores/gap-store';

interface GapDetailPanelProps {
  gaps: PipelineGap[];
  onClose: () => void;
}

const severityBadge: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500',
  moderate: 'bg-amber-500/20 text-amber-400 border-amber-500',
  minor:    'bg-[#555]/20 text-[#c8c4d6] border-[#555]',
};

const typeBadge: Record<string, { label: string; icon: string; color: string }> = {
  visual:    { label: 'Visual',    icon: 'palette',      color: 'bg-blue-500/20 text-blue-400 border-blue-500' },
  narrative: { label: 'Narrative', icon: 'auto_stories', color: 'bg-purple-500/20 text-purple-400 border-purple-500' },
};

function StatusLabel({ status }: { status: string }) {
  if (status === 'accepted') {
    return <span className="text-xs font-medium text-green-400">Accepted</span>;
  }
  if (status === 'dismissed') {
    return <span className="text-xs font-medium text-[#555] line-through">Dismissed</span>;
  }
  if (status === 'fill-requested') {
    return <span className="text-xs font-medium text-[#c6bfff] animate-pulse">Fill Requested</span>;
  }
  if (status === 'generating') {
    return (
      <span className="text-xs font-medium text-[#c6bfff] flex items-center gap-1">
        <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>
        Generating bridge scene...
      </span>
    );
  }
  if (status === 'filled') {
    return (
      <span className="text-xs font-medium text-green-400 flex items-center gap-1">
        <span className="material-symbols-outlined text-xs">check_circle</span>
        Filled — bridge node added
      </span>
    );
  }
  return null;
}

export default function GapDetailPanel({ gaps, onClose }: GapDetailPanelProps) {
  const acceptGap = useGapStore((s) => s.acceptGap);
  const dismissGap = useGapStore((s) => s.dismissGap);
  const requestFill = useGapStore((s) => s.requestFill);
  const filling = useGapStore((s) => s.filling);

  return (
    <div className="w-80 bg-[#1f1f24] border-l border-[#c6bfff]/10 p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white">Gap Analysis</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-[#555] hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {/* Gap cards */}
      <div className="flex flex-col gap-3">
        {gaps.map((gap) => {
          const typeInfo = typeBadge[gap.gapType] ?? typeBadge.narrative;
          const sevStyle = severityBadge[gap.severity] ?? severityBadge.minor;
          const showActions = gap.status === 'detected' || gap.status === 'accepted';

          return (
            <div
              key={gap.id}
              className="rounded-lg border border-[#c6bfff]/10 bg-white/5 p-3"
            >
              {/* Badges row */}
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${typeInfo.color}`}>
                  <span className="material-symbols-outlined text-xs">{typeInfo.icon}</span>
                  {typeInfo.label}
                </span>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${sevStyle}`}>
                  {gap.severity}
                </span>
              </div>

              {/* Title */}
              <h4 className="text-sm font-bold text-white mb-1">{gap.title}</h4>

              {/* Description */}
              <p className="text-xs text-[#c8c4d6] mb-1">{gap.description}</p>

              {/* Suggestion */}
              <p className="text-xs text-[#c8c4d6] italic flex items-start gap-1 mb-3">
                <span className="material-symbols-outlined text-xs mt-0.5 flex-shrink-0">lightbulb</span>
                {gap.suggestion}
              </p>

              {/* Actions or status */}
              {showActions ? (
                <div className="flex items-center gap-2">
                  {gap.status === 'detected' && (
                    <>
                      <button
                        type="button"
                        onClick={() => acceptGap(gap.id)}
                        className="rounded-lg border border-green-500 px-3 py-1 text-xs font-medium text-green-400 transition-colors hover:bg-green-500/10"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => dismissGap(gap.id)}
                        className="rounded-lg border border-[#555] px-3 py-1 text-xs font-medium text-[#c8c4d6] transition-colors hover:bg-[#555]/10"
                      >
                        Dismiss
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => requestFill(gap.id)}
                    disabled={filling}
                    className={`rounded-lg bg-[#c6bfff] px-3 py-1 text-xs font-bold text-white transition-colors hover:bg-[#c6bfff] disabled:opacity-50${
                      filling ? ' opacity-50' : ''
                    }`}
                  >
                    {filling ? 'Filling...' : 'Auto-Fill'}
                  </button>
                </div>
              ) : (
                <StatusLabel status={gap.status} />
              )}
            </div>
          );
        })}
      </div>

      {gaps.length === 0 && (
        <p className="text-xs text-[#555] text-center mt-8">No gaps for this edge.</p>
      )}
    </div>
  );
}
