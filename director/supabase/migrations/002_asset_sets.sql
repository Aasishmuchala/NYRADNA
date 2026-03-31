CREATE TABLE IF NOT EXISTS asset_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_asset_sets_project_id ON asset_sets(project_id);

CREATE TABLE IF NOT EXISTS asset_set_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_set_id UUID NOT NULL REFERENCES asset_sets(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'image' CHECK (type IN ('image', 'video', 'audio')),
  url TEXT NOT NULL DEFAULT '',
  thumbnail_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_asset_set_items_set_id ON asset_set_items(asset_set_id);
CREATE INDEX idx_asset_set_items_position ON asset_set_items(asset_set_id, position);
