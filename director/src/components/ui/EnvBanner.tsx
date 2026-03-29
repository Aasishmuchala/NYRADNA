'use client';

import { useState, useEffect } from 'react';

export default function EnvBanner() {
  const [issues, setIssues] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((data: { issues: string[] }) => {
        if (data.issues?.length > 0) setIssues(data.issues);
      })
      .catch(() => {});
  }, []);

  if (issues.length === 0 || dismissed) return null;

  return (
    <div className="bg-yellow-900/30 border-b border-yellow-600/40 px-4 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-sm text-yellow-300">
        <span className="material-symbols-outlined text-lg">warning</span>
        <span>{issues.join(' ')}</span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-yellow-400 hover:text-yellow-200 transition text-xs font-bold uppercase"
      >
        Dismiss
      </button>
    </div>
  );
}
