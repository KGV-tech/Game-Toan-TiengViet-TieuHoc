-- Repair a legacy deployed RPC that wrote the full question record into the
-- question_id UUID field. This patch replaces only that function: no tables,
-- data, RLS policies, or permissions are changed.

CREATE OR REPLACE FUNCTION public.team_competition_submit_answer(
    p_attempt_id UUID,
    p_question_index INTEGER,
    p_selected_answer TEXT,
    p_session_id UUID
)
RETURNS public.team_competition_attempts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
    attempt_row public.team_competition_attempts;
    competition_row public.team_competitions;
    question_row public.team_competition_questions;
    answer_key JSONB;
    score_result JSONB;
    submit_time TIMESTAMPTZ := timezone('utc'::text, now());
    next_submitted INTEGER;
    next_status TEXT := 'active';
BEGIN
    IF p_question_index IS NULL OR p_question_index < 0 THEN RAISE EXCEPTION 'invalid_question_index'; END IF;
    IF char_length(coalesce(p_selected_answer, '')) > 4000 THEN RAISE EXCEPTION 'answer_too_long'; END IF;

    SELECT * INTO attempt_row FROM public.team_competition_attempts WHERE id = p_attempt_id FOR UPDATE;
    IF attempt_row.id IS NULL THEN RAISE EXCEPTION 'attempt_not_found'; END IF;
    IF attempt_row.status <> 'active' THEN RETURN attempt_row; END IF;

    IF private.current_username() IS DISTINCT FROM attempt_row.leader_username
       OR p_session_id IS NULL OR p_session_id <> attempt_row.session_id THEN
        RAISE EXCEPTION 'attempt_session_mismatch';
    END IF;

    SELECT * INTO competition_row FROM public.team_competitions WHERE id = attempt_row.competition_id;
    IF competition_row.status <> 'active' THEN RAISE EXCEPTION 'competition_is_not_active'; END IF;
    IF competition_row.time_limit_minutes IS NOT NULL
       AND submit_time >= competition_row.started_at + make_interval(mins => competition_row.time_limit_minutes) THEN
        PERFORM public.team_competition_lock_attempt(p_attempt_id, p_session_id, 'timeout');
        RAISE EXCEPTION 'team_competition_timeout';
    END IF;

    SELECT question.* INTO question_row
    FROM public.team_competition_questions question
    WHERE question.team_id = attempt_row.team_id AND question.question_index = p_question_index;
    IF question_row.id IS NULL THEN RAISE EXCEPTION 'question_not_found'; END IF;

    SELECT answer_keys.answer_key INTO answer_key
    FROM private.team_competition_answer_keys AS answer_keys
    WHERE answer_keys.question_id = question_row.id;
    IF answer_key IS NULL THEN RAISE EXCEPTION 'answer_key_not_found'; END IF;
    IF EXISTS (
        SELECT 1 FROM public.team_competition_answers
        WHERE attempt_id = p_attempt_id AND question_id = question_row.id
    ) THEN
        RETURN attempt_row;
    END IF;

    score_result := private.team_competition_score_question(answer_key, p_selected_answer);
    INSERT INTO public.team_competition_answers (
        attempt_id, question_id, question_index, selected_answer, points, is_correct, submitted_at
    ) VALUES (
        p_attempt_id, question_row.id, p_question_index, coalesce(p_selected_answer, ''),
        coalesce((score_result->>'points')::numeric, 0),
        coalesce((score_result->>'isCorrect')::boolean, false), submit_time
    );

    next_submitted := attempt_row.submitted_count + 1;
    IF next_submitted >= attempt_row.question_count THEN next_status := 'completed'; END IF;
    UPDATE public.team_competition_attempts
    SET submitted_count = next_submitted,
        correct_count = correct_count + CASE WHEN coalesce((score_result->>'isCorrect')::boolean, false) THEN 1 ELSE 0 END,
        score = round(((SELECT coalesce(sum(points), 0) FROM public.team_competition_answers WHERE attempt_id = p_attempt_id)
                       / question_count * 10)::numeric, 2),
        current_index = greatest(current_index, p_question_index + 1),
        status = next_status,
        completed_at = CASE WHEN next_status = 'completed' THEN submit_time ELSE completed_at END,
        duration_seconds = CASE WHEN next_status = 'completed'
            THEN greatest(0, extract(epoch FROM (submit_time - started_at))::integer) ELSE duration_seconds END,
        last_heartbeat_at = submit_time
    WHERE id = p_attempt_id
    RETURNING * INTO attempt_row;

    UPDATE public.team_competition_teams
    SET status = CASE WHEN attempt_row.status = 'completed' THEN 'completed' ELSE 'active' END,
        score = attempt_row.score,
        submitted_count = attempt_row.submitted_count,
        correct_count = attempt_row.correct_count,
        completed_at = attempt_row.completed_at,
        duration_seconds = attempt_row.duration_seconds
    WHERE id = attempt_row.team_id;

    RETURN attempt_row;
END;
$$;
