-- Reveal the answer key only after the authenticated leader has submitted
-- that exact question. This lets the team surface reuse the proven practice
-- feedback without exposing future answers to a browser.

CREATE OR REPLACE FUNCTION public.team_competition_get_answer_feedback(
    p_attempt_id UUID,
    p_question_index INTEGER,
    p_session_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
    attempt_row public.team_competition_attempts;
    question_row public.team_competition_questions;
    saved_answer public.team_competition_answers;
    stored_key JSONB;
BEGIN
    IF p_question_index IS NULL OR p_question_index < 0 THEN
        RAISE EXCEPTION 'invalid_question_index';
    END IF;

    SELECT * INTO attempt_row
    FROM public.team_competition_attempts
    WHERE id = p_attempt_id;
    IF attempt_row.id IS NULL THEN RAISE EXCEPTION 'attempt_not_found'; END IF;
    IF private.current_username() IS DISTINCT FROM attempt_row.leader_username
       OR p_session_id IS NULL OR p_session_id <> attempt_row.session_id THEN
        RAISE EXCEPTION 'attempt_session_mismatch';
    END IF;
    -- A leader can see only the answer that has just advanced their normal
    -- sequential turn. This blocks direct requests for a later question.
    IF attempt_row.current_index <> p_question_index + 1
       OR attempt_row.submitted_count <> p_question_index + 1 THEN
        RAISE EXCEPTION 'answer_not_ready';
    END IF;

    SELECT * INTO question_row
    FROM public.team_competition_questions
    WHERE team_id = attempt_row.team_id
      AND question_index = p_question_index;
    IF question_row.id IS NULL THEN RAISE EXCEPTION 'question_not_found'; END IF;

    SELECT * INTO saved_answer
    FROM public.team_competition_answers
    WHERE attempt_id = p_attempt_id
      AND question_id = question_row.id;
    IF saved_answer.id IS NULL THEN RAISE EXCEPTION 'answer_not_recorded'; END IF;

    SELECT answer_keys.answer_key INTO stored_key
    FROM private.team_competition_answer_keys AS answer_keys
    WHERE answer_keys.question_id = question_row.id;
    IF stored_key IS NULL THEN RAISE EXCEPTION 'answer_key_not_found'; END IF;

    RETURN jsonb_build_object(
        'answerKey', stored_key,
        'points', saved_answer.points,
        'isCorrect', saved_answer.is_correct
    );
END;
$$;

REVOKE ALL ON FUNCTION public.team_competition_get_answer_feedback(UUID, INTEGER, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.team_competition_get_answer_feedback(UUID, INTEGER, UUID) TO authenticated;
