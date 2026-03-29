'use client';

import type { NodeStatus } from '@/lib/pipeline/graph';

const STATUS_STYLES: Record<NodeStatus, { bg: string; text: string; label: string }> = {
  idle: { bg: 'bg-white/5', text: 'text-white/40', label: 'Idle' },
  pending: { bg: 'bg-white/10', text: 'text-white/60', label: 'Pending' },
  running: { bg: 'bg-[#ff9064]/20', text: 'text-[#ff9064]', label: 'Running' },
  done: { bg: 'bg-[#4caf50]/20', text: 'text-[#4caf50]', label: 'Done' },
  failed: { bg: 'bg-[#ffb4ab]/20', text: 'text-[#ffb4ab]', label: 'Failed' },
  skipped: { bg: 'bg-white/5', text: 'text-white/30', label: 'Skipped' },
};

export function StatusBadge({ status }: { status: NodeStatus }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.idle;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${style.bg} ${style.text}`}>
      {status === 'running' && (
        <span className="w-1.5 h-1.5 rounded-full bg-[#ff9064] animate-pulse" />
      )}
      {style.label}
    </span>
  );
}
