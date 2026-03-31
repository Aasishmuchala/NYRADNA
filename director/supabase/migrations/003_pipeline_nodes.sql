CREATE TABLE IF NOT EXISTS pipeline_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  asset_set_id UUID NOT NULL REFERENCES asset_sets(id) ON DELETE CASCADE,
  asset_item_id UUID NOT NULL REFERENCES asset_set_items(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'generating', 'completed', 'error')),
  narrative_context JSONB NOT NULL DEFAULT '{}',
  thumbnail_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pipeline_nodes_project ON pipeline_nodes(project_id);
CREATE INDEX idx_pipeline_nodes_asset_set ON pipeline_nodes(asset_set_id);
CREATE INDEX idx_pipeline_nodes_position ON pipeline_nodes(asset_set_id, position);
