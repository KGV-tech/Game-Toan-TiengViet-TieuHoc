-- Patch for projects where the legacy UUID extension was never enabled.
-- PostgreSQL/Supabase provides gen_random_uuid() for team competition IDs.
alter table public.team_competitions alter column id set default gen_random_uuid();
alter table public.team_competition_teams alter column id set default gen_random_uuid();
alter table public.team_competition_questions alter column id set default gen_random_uuid();
alter table public.team_competition_attempts alter column id set default gen_random_uuid();
alter table public.team_competition_attempts alter column session_id set default gen_random_uuid();
alter table public.team_competition_answers alter column id set default gen_random_uuid();
alter table public.team_competition_results alter column id set default gen_random_uuid();

-- The original leader-attempt RPC generated a session UUID explicitly, so
-- changing the column default alone did not repair the student entry flow.
CREATE OR REPLACE FUNCTION public.team_competition_start_attempt(
    p_competition_id UUID,
    p_team_id UUID,
    p_session_id UUID DEFAULT NULL
)
RETURNS public.team_competition_attempts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
    competition_row public.team_competitions;
    team_row public.team_competition_teams;
    existing_attempt public.team_competition_attempts;
    created_attempt public.team_competition_attempts;
    question_total INTEGER;
    current_name TEXT := private.current_username();
BEGIN
    SELECT * INTO competition_row FROM public.team_competitions WHERE id = p_competition_id;
    SELECT * INTO team_row FROM public.team_competition_teams WHERE id = p_team_id AND competition_id = p_competition_id;
    IF competition_row.id IS NULL OR team_row.id IS NULL THEN RAISE EXCEPTION 'team_or_competition_not_found'; END IF;
    IF competition_row.status <> 'active' THEN RAISE EXCEPTION 'competition_is_not_active'; END IF;
    IF current_name IS NULL OR current_name <> team_row.leader_username THEN RAISE EXCEPTION 'leader_only'; END IF;

    SELECT * INTO existing_attempt FROM public.team_competition_attempts
    WHERE competition_id = p_competition_id AND team_id = p_team_id FOR UPDATE;
    IF existing_attempt.id IS NOT NULL THEN
        IF existing_attempt.status <> 'active' THEN RAISE EXCEPTION 'team_attempt_is_locked'; END IF;
        IF p_session_id IS NULL OR existing_attempt.session_id <> p_session_id THEN RAISE EXCEPTION 'attempt_already_open'; END IF;
        RETURN existing_attempt;
    END IF;

    SELECT count(*) INTO question_total FROM public.team_competition_questions WHERE team_id = p_team_id;
    IF question_total < 1 THEN RAISE EXCEPTION 'team_questions_required'; END IF;
    INSERT INTO public.team_competition_attempts (
        competition_id, team_id, leader_username, leader_auth_user_id, session_id,
        question_count, started_at
    ) VALUES (
        p_competition_id, p_team_id, current_name, auth.uid(), coalesce(p_session_id, gen_random_uuid()),
        question_total, coalesce(competition_row.started_at, timezone('utc'::text, now()))
    ) RETURNING * INTO created_attempt;
    UPDATE public.team_competition_teams
    SET status = 'active', started_at = coalesce(started_at, created_attempt.started_at)
    WHERE id = p_team_id;
    RETURN created_attempt;
END;
$$;
