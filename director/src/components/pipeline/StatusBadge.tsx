'use client';

import type { NodeStatus } from '@/lib/pipeline/graph';

const STATUS_STYLES: Record<NodeStatus, { bg: string; text: string; label: string }> = {
  idle: { bg: 'bg-white/5', text: 'text-on-surface/40', label: 'Idle' },
  pending: { bg: 'bg-white/10', text: 'text-on-surface/60', label: 'Pending' },
  running: { bg: 'bg-primary/20', text: 'text-primary', label: 'Running' },
  done: { bg: 'bg-success/20', text: 'text-success', label: 'Done' },
  failed: { bg: 'bg-error/20', text: 'text-error', label: 'Failed' },
  skipped: { bg: 'bg-white/5', text: 'text-on-surface/30', label: 'Skipped' },
};

export function StatusBadge({ status }: { status: NodeStatus }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.idle;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${style.bg} ${style.text}`}>
      {status === 'running' && (
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
      )}
      {style.label}
    </span>
  );
}
