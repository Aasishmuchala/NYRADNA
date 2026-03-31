CREATE TABLE IF NOT EXISTS director_cuts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  storyline JSONB NOT NULL DEFAULT '{}',
  visual_style JSONB NOT NULL DEFAULT '{}',
  narrative_beats JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_director_cuts_project_id ON director_cuts(project_id);
