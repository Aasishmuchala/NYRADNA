-- Migration 006: Add video_url column to pipeline_nodes for AI video generation
-- Each pipeline node can have a generated video stored alongside its thumbnail

ALTER TABLE pipeline_nodes ADD COLUMN IF NOT EXISTS video_url TEXT;
