-- Patch for projects where the legacy UUID extension was never enabled.
-- PostgreSQL/Supabase provides gen_random_uuid() for team competition IDs.
alter table public.team_competitions alter column id set default gen_random_uuid();
alter table public.team_competition_teams alter column id set default gen_random_uuid();
alter table public.team_competition_questions alter column id set default gen_random_uuid();
alter table public.team_competition_attempts alter column id set default gen_random_uuid();
alter table public.team_competition_attempts alter column session_id set default gen_random_uuid();
alter table public.team_competition_answers alter column id set default gen_random_uuid();
alter table public.team_competition_results alter column id set default gen_random_uuid();
