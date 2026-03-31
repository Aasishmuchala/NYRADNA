-- Migration 005: Extend pipeline_gaps for gap-fill lifecycle
-- Adds 'generating' and 'filled' statuses, plus fill_node_id FK

-- Extend the status CHECK constraint to include new statuses
ALTER TABLE pipeline_gaps DROP CONSTRAINT IF EXISTS pipeline_gaps_status_check;
ALTER TABLE pipeline_gaps ADD CONSTRAINT pipeline_gaps_status_check
  CHECK (status IN ('detected', 'accepted', 'dismissed', 'fill-requested', 'generating', 'filled'));

-- Track which bridge node was created for a filled gap
ALTER TABLE pipeline_gaps
  ADD COLUMN IF NOT EXISTS fill_node_id UUID REFERENCES pipeline_nodes(id) ON DELETE SET NULL;
