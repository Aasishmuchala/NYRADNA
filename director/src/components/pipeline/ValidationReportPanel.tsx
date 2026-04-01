'use client';

import type { ValidationIssue, IssueCategory, ValidationStatus } from '@/lib/types/narrative-validation';
import { useValidationStore } from '@/lib/stores/validation-store';

interface ValidationReportPanelProps {
  issues: ValidationIssue[];
  onClose: () => void;
  onRegenerate: (nodeId: string) => void;
}

const categoryConfig: Record<IssueCategory, { label: string; icon: string }> = {
  'visual-style': { label: 'Visual Style', icon: 'palette' },
  pacing:         { label: 'Pacing',       icon: 'speed' },
  'story-flow':   { label: 'Story Flow',   icon: 'auto_stories' },
};

const severityColor: Record<string, string> = {
  critical: '#d32f2f',
  moderate: 'var(--color-primary)',
  minor:    '#ffd54f',
};

const statusBadge: Record<ValidationStatus, { color: string; label: string } | null> = {
  pending:      null,
  validated:    null,
  flagged:      { color: 'bg-amber-500/20 text-amber-400 border-amber-500', label: 'Flagged' },
  regenerated:  { color: 'bg-purple-500/20 text-purple-400 border-purple-500', label: 'Regenerated' },
  accepted:     { color: 'bg-green-500/20 text-green-400 border-green-500', label: 'Accepted' },
};

function groupByCategory(issues: ValidationIssue[]): Record<IssueCategory, ValidationIssue[]> {
  const grouped: Record<IssueCategory, ValidationIssue[]> = {
    'visual-style': [],
    pacing: [],
    'story-flow': [],
  };
  for (const issue of issues) {
    if (grouped[issue.category]) {
      grouped[issue.category].push(issue);
    }
  }
  return grouped;
}

export default function ValidationReportPanel({ issues, onClose, onRegenerate }: ValidationReportPanelProps) {
  const acceptIssue = useValidationStore((s) => s.acceptIssue);
  const acceptAll = useValidationStore((s) => s.acceptAll);

  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const moderateCount = issues.filter((i) => i.severity === 'moderate').length;
  const minorCount = issues.filter((i) => i.severity === 'minor').length;
  const hasUnaccepted = issues.some((i) => i.status !== 'accepted');
  const grouped = groupByCategory(issues);

  return (
    <div className="w-80 bg-surface-container border-l border-[var(--color-primary)]/10 p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-on-surface">Validation Report</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-outline hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-on-surface-variant">{issues.length} total</span>
        {criticalCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 border border-red-500 px-2 py-0.5 text-[10px] font-medium text-red-400">
            {criticalCount} critical
          </span>
        )}
        {moderateCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500 px-2 py-0.5 text-[10px] font-medium text-amber-400">
            {moderateCount} moderate
          </span>
        )}
        {minorCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/20 border border-yellow-500 px-2 py-0.5 text-[10px] font-medium text-yellow-400">
            {minorCount} minor
          </span>
        )}
      </div>

      {/* Category sections */}
      {(Object.keys(categoryConfig) as IssueCategory[]).map((category) => {
        const categoryIssues = grouped[category];
        if (categoryIssues.length === 0) return null;
        const config = categoryConfig[category];

        return (
          <div key={category} className="mb-4">
            {/* Category header */}
            <div className="flex items-center gap-1.5 mb-2">
              <span className="material-symbols-outlined text-sm text-on-surface-variant">{config.icon}</span>
              <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">{config.label}</h4>
              <span className="text-[10px] text-outline">({categoryIssues.length})</span>
            </div>

            {/* Issue cards */}
            <div className="flex flex-col gap-2">
              {categoryIssues.map((issue) => {
                const badge = statusBadge[issue.status];

                return (
                  <div
                    key={issue.id}
                    className="rounded-lg border border-[var(--color-primary)]/10 bg-white/5 p-3"
                  >
                    {/* Severity dot + Title + Status */}
                    <div className="flex items-start gap-2 mb-1">
                      <span
                        className="mt-1 inline-block h-2 w-2 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: severityColor[issue.severity] ?? '#ffd54f' }}
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-bold text-on-surface">{issue.title}</span>
                      </div>
                      {badge && (
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${badge.color}`}>
                          {badge.label}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-on-surface-variant mb-1">{issue.description}</p>

                    {/* Suggestion */}
                    <p className="text-xs text-outline italic mb-2">{issue.suggestion}</p>

                    {/* Action buttons */}
                    {issue.status === 'flagged' && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onRegenerate(issue.nodeId)}
                          className="rounded-lg border border-purple-500 px-3 py-1 text-xs font-medium text-purple-400 transition-colors hover:bg-purple-500/10"
                        >
                          Regenerate
                        </button>
                        <button
                          type="button"
                          onClick={() => acceptIssue(issue.id)}
                          className="rounded-lg border border-green-500 px-3 py-1 text-xs font-medium text-green-400 transition-colors hover:bg-green-500/10"
                        >
                          Accept
                        </button>
                      </div>
                    )}
                    {issue.status === 'regenerated' && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => acceptIssue(issue.id)}
                          className="rounded-lg border border-green-500 px-3 py-1 text-xs font-medium text-green-400 transition-colors hover:bg-green-500/10"
                        >
                          Accept
                        </button>
                      </div>
                    )}
                    {issue.status === 'accepted' && (
                      <div className="flex items-center gap-1 text-green-400">
                        <span className="material-symbols-outlined text-xs [font-variation-settings:'FILL'_1]">check_circle</span>
                        <span className="text-xs font-medium">Accepted</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {issues.length === 0 && (
        <p className="text-xs text-outline text-center mt-8">No validation issues found.</p>
      )}

      {/* Footer: Accept All */}
      {hasUnaccepted && issues.length > 0 && (
        <div className="mt-4 pt-3 border-t border-[var(--color-primary)]/10">
          <button
            type="button"
            onClick={() => {
              const first = issues[0];
              if (first) acceptAll(first.projectId, first.assetSetId);
            }}
            className="w-full rounded-lg bg-success px-3 py-2 text-xs font-bold text-on-surface transition-colors hover:bg-success/80"
          >
            Accept All Issues
          </button>
        </div>
      )}
    </div>
  );
}
