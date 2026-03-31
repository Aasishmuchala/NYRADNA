export type IssueCategory = 'visual-style' | 'pacing' | 'story-flow';
export type IssueSeverity = 'critical' | 'moderate' | 'minor';
export type ValidationStatus = 'pending' | 'validated' | 'flagged' | 'regenerated' | 'accepted';

export interface ValidationIssue {
  id: string;
  projectId: string;
  assetSetId: string;
  nodeId: string;                       // FK to pipeline_nodes -- the node with the issue
  category: IssueCategory;
  severity: IssueSeverity;
  status: ValidationStatus;
  title: string;                        // e.g., "Visual style drift at node 3"
  description: string;                  // detailed explanation
  suggestion: string;                   // recommended fix
  metadata: Record<string, unknown>;    // flexible JSONB
  createdAt: string;
  updatedAt: string;
}

export interface NewValidationIssue {
  projectId: string;
  assetSetId: string;
  nodeId: string;
  category: IssueCategory;
  severity: IssueSeverity;
  title: string;
  description: string;
  suggestion: string;
  metadata?: Record<string, unknown>;
}

export interface ValidationReport {
  issues: ValidationIssue[];
  summary: {
    total: number;
    critical: number;
    moderate: number;
    minor: number;
    byCategory: Record<IssueCategory, number>;
  };
}
