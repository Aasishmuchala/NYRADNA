import { create } from 'zustand';
import type { ValidationIssue, ValidationStatus } from '../types/narrative-validation';

interface ValidationState {
  issues: ValidationIssue[];
  loading: boolean;
  validating: boolean;

  // CRUD
  loadIssues: (projectId: string, assetSetId: string) => Promise<void>;
  runValidation: (projectId: string, assetSetId: string) => Promise<void>;
  updateIssueStatus: (issueId: string, status: ValidationStatus) => Promise<void>;
  acceptIssue: (issueId: string) => Promise<void>;
  acceptAll: (projectId: string, assetSetId: string) => Promise<void>;
  markRegenerated: (issueId: string) => Promise<void>;
}

export const useValidationStore = create<ValidationState>()((set, get) => ({
  issues: [],
  loading: false,
  validating: false,

  loadIssues: async (projectId: string, assetSetId: string) => {
    set({ loading: true });
    try {
      const res = await fetch(
        `/api/narrative-validation?projectId=${encodeURIComponent(projectId)}&assetSetId=${encodeURIComponent(assetSetId)}`
      );
      if (res.ok) {
        const data: ValidationIssue[] = await res.json();
        set({ issues: data, loading: false });
      } else {
        console.error('Failed to load validation issues:', res.statusText);
        set({ loading: false });
      }
    } catch (err) {
      console.error('Failed to load validation issues:', err);
      set({ loading: false });
    }
  },

  runValidation: async (projectId: string, assetSetId: string) => {
    set({ validating: true });
    try {
      const res = await fetch('/api/narrative-validation/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, assetSetId }),
      });
      if (res.ok) {
        const data: ValidationIssue[] = await res.json();
        set({ issues: data, validating: false });
      } else {
        const errBody = await res.json().catch(() => ({ error: res.statusText }));
        console.error('Failed to run validation:', errBody.error);
        set({ validating: false });
      }
    } catch (err) {
      console.error('Failed to run validation:', err);
      set({ validating: false });
    }
  },

  updateIssueStatus: async (issueId: string, status: ValidationStatus) => {
    try {
      const res = await fetch(
        `/api/narrative-validation?id=${encodeURIComponent(issueId)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        }
      );
      if (res.ok) {
        const updated: ValidationIssue = await res.json();
        set((state) => ({
          issues: state.issues.map((i) => (i.id === issueId ? updated : i)),
        }));
      } else {
        console.error('Failed to update issue status:', res.statusText);
      }
    } catch (err) {
      console.error('Failed to update issue status:', err);
    }
  },

  acceptIssue: async (issueId: string) => {
    await get().updateIssueStatus(issueId, 'accepted');
  },

  acceptAll: async (_projectId: string, _assetSetId: string) => {
    const { issues, acceptIssue } = get();
    const nonAccepted = issues.filter((i) => i.status !== 'accepted');
    for (const issue of nonAccepted) {
      await acceptIssue(issue.id);
    }
  },

  markRegenerated: async (issueId: string) => {
    await get().updateIssueStatus(issueId, 'regenerated');
  },
}));
