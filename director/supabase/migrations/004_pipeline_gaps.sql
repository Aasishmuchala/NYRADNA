CREATE TABLE IF NOT EXISTS pipeline_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  asset_set_id UUID NOT NULL REFERENCES asset_sets(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL REFERENCES pipeline_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES pipeline_nodes(id) ON DELETE CASCADE,
  gap_type TEXT NOT NULL CHECK (gap_type IN ('visual', 'narrative')),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'moderate', 'minor')),
  status TEXT NOT NULL DEFAULT 'detected' CHECK (status IN ('detected', 'accepted', 'dismissed', 'fill-requested')),
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  suggestion TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pipeline_gaps_project ON pipeline_gaps(project_id);
CREATE INDEX idx_pipeline_gaps_asset_set ON pipeline_gaps(asset_set_id);
CREATE INDEX idx_pipeline_gaps_nodes ON pipeline_gaps(source_node_id, target_node_id);
