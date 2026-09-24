-- Allow the new 'knowledge-garden' theme in team competitions.
-- This changes display metadata check constraint only; scores, questions, teams and attempts stay intact.

ALTER TABLE public.team_competitions
    DROP CONSTRAINT IF EXISTS team_competitions_presentation_theme_check;

ALTER TABLE public.team_competitions
    ADD CONSTRAINT team_competitions_presentation_theme_check
    CHECK (presentation_theme IN ('speed-race', 'balloon-festival', 'treasure-island', 'space-launch', 'knowledge-garden'));
