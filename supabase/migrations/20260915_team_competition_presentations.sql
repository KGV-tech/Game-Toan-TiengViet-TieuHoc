-- Presentation choices for Admin-only team competition boards.
-- This migration adds metadata only; it does not alter scores, answers, or memberships.

ALTER TABLE public.team_competitions
    ADD COLUMN IF NOT EXISTS presentation_theme TEXT NOT NULL DEFAULT 'speed-race'
        CHECK (presentation_theme IN ('speed-race', 'space-launch')),
    ADD COLUMN IF NOT EXISTS presentation_team_identity JSONB NOT NULL DEFAULT '{}'::jsonb;

