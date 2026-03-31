CREATE TABLE IF NOT EXISTS narrative_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  asset_set_id UUID NOT NULL REFERENCES asset_sets(id) ON DELETE CASCADE,
  node_id UUID NOT NULL REFERENCES pipeline_nodes(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('visual-style', 'pacing', 'story-flow')),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'moderate', 'minor')),
  status TEXT NOT NULL DEFAULT 'flagged' CHECK (status IN ('pending', 'validated', 'flagged', 'regenerated', 'accepted')),
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  suggestion TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_narrative_validations_asset_set ON narrative_validations(asset_set_id);
CREATE INDEX idx_narrative_validations_node ON narrative_validations(node_id);
