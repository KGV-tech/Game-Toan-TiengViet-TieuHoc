-- Restore the finished presentation as a named, selectable asset bundle.
-- Future themes are intentionally not persisted until their own 3D assets exist.
-- This changes display metadata only; scores, questions, teams and attempts stay intact.

ALTER TABLE public.team_competitions
    DROP CONSTRAINT IF EXISTS team_competitions_presentation_theme_check;

UPDATE public.team_competitions
SET presentation_theme = 'speed-race'
WHERE presentation_theme = 'stadium-3d';

ALTER TABLE public.team_competitions
    ALTER COLUMN presentation_theme SET DEFAULT 'speed-race';

ALTER TABLE public.team_competitions
    ADD CONSTRAINT team_competitions_presentation_theme_check
    CHECK (presentation_theme IN ('speed-race'));
