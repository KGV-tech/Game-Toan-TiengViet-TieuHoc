-- Thi đua theo nhóm: schema, RLS, RPC và Realtime.
--
-- Migration này chỉ tạo cấu trúc và hàm máy chủ, không seed/xóa dữ liệu hiện có.
-- Chạy sau supabase_auth_security.sql trong đúng project đã được phê duyệt.
-- Không chạy supabase_rls.sql (tệp đó đã ngưng dùng).

DO $$
BEGIN
    IF to_regclass('public.game_users') IS NULL
       OR to_regclass('public.game_exams') IS NULL THEN
        RAISE EXCEPTION 'team competitions require public.game_users and public.game_exams';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'game_users' AND column_name = 'auth_user_id'
    ) THEN
        RAISE EXCEPTION 'run supabase_auth_security.sql first: game_users.auth_user_id is missing';
    END IF;
    IF to_regprocedure('private.is_admin()') IS NULL
       OR to_regprocedure('private.current_username()') IS NULL THEN
        RAISE EXCEPTION 'run supabase_auth_security.sql first: private auth helpers are missing';
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.team_competitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 160),
    classlevel TEXT NOT NULL CHECK (classlevel ~ '^[1-5]$'),
    participant_mode TEXT NOT NULL DEFAULT 'manual'
        CHECK (participant_mode IN ('manual', 'random')),
    question_mode TEXT NOT NULL DEFAULT 'same'
        CHECK (question_mode IN ('same', 'different')),
    common_exam_id UUID REFERENCES public.game_exams(id) ON DELETE RESTRICT,
    time_limit_minutes INTEGER CHECK (time_limit_minutes IS NULL OR time_limit_minutes > 0),
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'prepared', 'active', 'ended')),
    created_by UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE RESTRICT,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    version BIGINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CHECK (question_mode = 'same' OR common_exam_id IS NULL),
    CHECK (status <> 'active' OR started_at IS NOT NULL),
    CHECK (status <> 'ended' OR ended_at IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.team_competition_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID NOT NULL REFERENCES public.team_competitions(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 100),
    position INTEGER NOT NULL CHECK (position > 0),
    target_member_count INTEGER CHECK (target_member_count IS NULL OR target_member_count > 0),
    leader_username TEXT NOT NULL CHECK (char_length(trim(leader_username)) BETWEEN 1 AND 120),
    exam_id UUID REFERENCES public.game_exams(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'active', 'completed', 'locked', 'ended')),
    score NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 10),
    submitted_count INTEGER NOT NULL DEFAULT 0 CHECK (submitted_count >= 0),
    correct_count INTEGER NOT NULL DEFAULT 0 CHECK (correct_count >= 0),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    locked_at TIMESTAMPTZ,
    duration_seconds INTEGER CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (competition_id, position),
    UNIQUE (competition_id, name)
);

CREATE TABLE IF NOT EXISTS public.team_competition_members (
    competition_id UUID NOT NULL REFERENCES public.team_competitions(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.team_competition_teams(id) ON DELETE CASCADE,
    username TEXT NOT NULL CHECK (char_length(trim(username)) BETWEEN 1 AND 120),
    position INTEGER NOT NULL DEFAULT 1 CHECK (position > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (team_id, username),
    UNIQUE (competition_id, username)
);

CREATE TABLE IF NOT EXISTS public.team_competition_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID NOT NULL REFERENCES public.team_competitions(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.team_competition_teams(id) ON DELETE CASCADE,
    question_index INTEGER NOT NULL CHECK (question_index >= 0),
    question_payload JSONB NOT NULL,
    question_type TEXT NOT NULL DEFAULT 'Trắc nghiệm',
    answer_count SMALLINT NOT NULL CHECK (answer_count IN (1, 2, 4)),
    part_answer_counts JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (team_id, question_index)
);

-- Answer keys are deliberately kept in the private schema. Leaders can read the
-- sanitized payload above, but cannot select the correct answers through PostgREST.
CREATE SCHEMA IF NOT EXISTS private;
CREATE TABLE IF NOT EXISTS private.team_competition_answer_keys (
    question_id UUID PRIMARY KEY REFERENCES public.team_competition_questions(id) ON DELETE CASCADE,
    answer_key JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.team_competition_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID NOT NULL REFERENCES public.team_competitions(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.team_competition_teams(id) ON DELETE CASCADE,
    leader_username TEXT NOT NULL,
    leader_auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    session_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'completed', 'locked')),
    lock_reason TEXT,
    question_count INTEGER NOT NULL CHECK (question_count > 0),
    current_index INTEGER NOT NULL DEFAULT 0 CHECK (current_index >= 0),
    submitted_count INTEGER NOT NULL DEFAULT 0 CHECK (submitted_count >= 0),
    correct_count INTEGER NOT NULL DEFAULT 0 CHECK (correct_count >= 0),
    score NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 10),
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ,
    locked_at TIMESTAMPTZ,
    duration_seconds INTEGER CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
    last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (competition_id, team_id),
    UNIQUE (team_id)
);

CREATE TABLE IF NOT EXISTS public.team_competition_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES public.team_competition_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.team_competition_questions(id) ON DELETE RESTRICT,
    question_index INTEGER NOT NULL CHECK (question_index >= 0),
    selected_answer TEXT NOT NULL DEFAULT '',
    points NUMERIC(8, 6) NOT NULL DEFAULT 0 CHECK (points BETWEEN 0 AND 1),
    is_correct BOOLEAN NOT NULL DEFAULT false,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (attempt_id, question_id),
    UNIQUE (attempt_id, question_index)
);

CREATE TABLE IF NOT EXISTS public.team_competition_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID NOT NULL REFERENCES public.team_competitions(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.team_competition_teams(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    individual_score NUMERIC(5, 2) NOT NULL CHECK (individual_score BETWEEN 0 AND 10),
    team_rank INTEGER NOT NULL CHECK (team_rank > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (competition_id, username)
);

CREATE INDEX IF NOT EXISTS team_competitions_status_class_idx
    ON public.team_competitions (classlevel, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS team_competition_teams_competition_idx
    ON public.team_competition_teams (competition_id, position);
CREATE INDEX IF NOT EXISTS team_competition_members_username_idx
    ON public.team_competition_members (username, competition_id);
CREATE INDEX IF NOT EXISTS team_competition_questions_team_idx
    ON public.team_competition_questions (team_id, question_index);
CREATE INDEX IF NOT EXISTS team_competition_attempts_status_idx
    ON public.team_competition_attempts (competition_id, status);

CREATE OR REPLACE FUNCTION private.team_competition_answer_count(input JSONB)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    value_count INTEGER;
BEGIN
    IF jsonb_typeof(input->'statements') = 'array' THEN
        SELECT count(*) INTO value_count FROM jsonb_array_elements(input->'statements');
    ELSE
        SELECT count(*) INTO value_count
        FROM unnest(regexp_split_to_array(coalesce(input->>'ans', ''), '[|,]')) AS part
        WHERE char_length(trim(part)) > 0;
    END IF;
    RETURN coalesce(value_count, 0);
END;
$$;

CREATE OR REPLACE FUNCTION private.team_competition_sanitize_question(input JSONB)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    output JSONB := coalesce(input, '{}'::jsonb);
BEGIN
    output := output - 'ans' - 'answer' - 'correct' - 'correctAnswer' - 'explanation';
    IF jsonb_typeof(input->'statements') = 'array' THEN
        output := jsonb_set(output, '{statements}', coalesce((
            SELECT jsonb_agg(value - 'answer' - 'ans' - 'correct' - 'correctAnswer')
            FROM jsonb_array_elements(input->'statements')
        ), '[]'::jsonb));
    END IF;
    IF jsonb_typeof(input->'subquestions') = 'array' THEN
        output := jsonb_set(output, '{subquestions}', coalesce((
            SELECT jsonb_agg(value - 'answer' - 'ans' - 'correct' - 'correctAnswer')
            FROM jsonb_array_elements(input->'subquestions')
        ), '[]'::jsonb));
    END IF;
    RETURN output;
END;
$$;

CREATE OR REPLACE FUNCTION private.team_competition_score_question(question_key JSONB, selected TEXT)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    expected TEXT[] := '{}';
    chosen TEXT[] := '{}';
    part_counts INTEGER[] := '{}';
    expected_count INTEGER := 0;
    correct_count INTEGER := 0;
    grouped_correct_count INTEGER := 0;
    group_offset INTEGER := 1;
    group_size INTEGER;
    group_ok BOOLEAN;
    is_matching BOOLEAN := false;
    is_fill BOOLEAN := false;
    normalized_expected TEXT;
    normalized_chosen TEXT;
    raw_selected TEXT := coalesce(selected, '');
    score NUMERIC := 0;
    supported BOOLEAN := false;
    item TEXT;
    index_value INTEGER;
BEGIN
    IF jsonb_typeof(question_key->'statements') = 'array' THEN
        SELECT coalesce(array_agg(trim(value->>'answer') ORDER BY ordinality), '{}')
        INTO expected
        FROM jsonb_array_elements(question_key->'statements') WITH ORDINALITY;
    ELSE
        SELECT coalesce(array_agg(trim(part)), '{}') INTO expected
        FROM unnest(regexp_split_to_array(coalesce(question_key->>'ans', ''), '[|,]')) AS part
        WHERE char_length(trim(part)) > 0;
    END IF;

    SELECT coalesce(array_agg(trim(part)), '{}') INTO chosen
    FROM unnest(regexp_split_to_array(raw_selected, '[|,]')) AS part
    WHERE char_length(trim(part)) > 0;

    expected_count := coalesce(array_length(expected, 1), 0);
    is_matching := position('đối chiếu' IN lower(coalesce(question_key->>'type', ''))) > 0;
    is_fill := position('điền' IN lower(coalesce(question_key->>'type', ''))) > 0;

    IF jsonb_typeof(question_key->'partAnswerCounts') = 'array' THEN
        SELECT coalesce(array_agg(value::text::integer ORDER BY ordinality), '{}')
        INTO part_counts
        FROM jsonb_array_elements(question_key->'partAnswerCounts') WITH ORDINALITY;
    END IF;

    IF coalesce(array_length(part_counts, 1), 0) = 4
       AND (SELECT coalesce(sum(value), 0) FROM unnest(part_counts) AS value) = expected_count
       AND expected_count > 0 THEN
        FOREACH group_size IN ARRAY part_counts LOOP
            group_ok := true;
            FOR index_value IN 0..(group_size - 1) LOOP
                normalized_expected := lower(regexp_replace(trim(coalesce(expected[group_offset + index_value], '')), '\s+', ' ', 'g'));
                normalized_chosen := lower(regexp_replace(trim(coalesce(chosen[group_offset + index_value], '')), '\s+', ' ', 'g'));
                IF is_fill AND regexp_replace(normalized_expected, '\s', '', 'g') ~ '^[0-9]+$' THEN
                    normalized_expected := regexp_replace(normalized_expected, '\s', '', 'g');
                    normalized_chosen := regexp_replace(normalized_chosen, '\s', '', 'g');
                END IF;
                IF normalized_expected IS DISTINCT FROM normalized_chosen THEN group_ok := false; END IF;
            END LOOP;
            IF group_ok THEN grouped_correct_count := grouped_correct_count + 1; END IF;
            group_offset := group_offset + group_size;
        END LOOP;
        supported := true;
        correct_count := grouped_correct_count;
        score := grouped_correct_count::numeric / 4;
        RETURN jsonb_build_object(
            'answerCount', 4, 'correctCount', correct_count,
            'points', round(score, 6), 'isCorrect', correct_count = 4
        );
    END IF;

    IF is_matching THEN
        FOREACH item IN ARRAY chosen LOOP
            normalized_chosen := lower(regexp_replace(trim(item), '\s+', ' ', 'g'));
            IF normalized_chosen <> '' AND EXISTS (
                SELECT 1 FROM unnest(expected) AS expected_item
                WHERE lower(regexp_replace(trim(expected_item), '\s+', ' ', 'g')) = normalized_chosen
            ) THEN
                correct_count := correct_count + 1;
            END IF;
        END LOOP;
    ELSE
        FOR index_value IN 1..expected_count LOOP
            normalized_expected := lower(regexp_replace(trim(coalesce(expected[index_value], '')), '\s+', ' ', 'g'));
            normalized_chosen := lower(regexp_replace(trim(coalesce(chosen[index_value], '')), '\s+', ' ', 'g'));
            IF is_fill AND regexp_replace(normalized_expected, '\s', '', 'g') ~ '^[0-9]+$' THEN
                normalized_expected := regexp_replace(normalized_expected, '\s', '', 'g');
                normalized_chosen := regexp_replace(normalized_chosen, '\s', '', 'g');
            END IF;
            IF normalized_expected = normalized_chosen THEN correct_count := correct_count + 1; END IF;
        END LOOP;
    END IF;

    supported := expected_count IN (1, 2, 4);
    IF supported AND expected_count > 0 THEN score := correct_count::numeric / expected_count; END IF;
    RETURN jsonb_build_object(
        'answerCount', expected_count, 'correctCount', correct_count,
        'points', round(CASE WHEN supported THEN score ELSE 0 END, 6),
        'isCorrect', supported AND correct_count = expected_count
    );
END;
$$;

CREATE OR REPLACE FUNCTION private.team_competition_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS team_competitions_touch_updated_at ON public.team_competitions;
CREATE TRIGGER team_competitions_touch_updated_at
    BEFORE UPDATE ON public.team_competitions
    FOR EACH ROW EXECUTE FUNCTION private.team_competition_touch_updated_at();
DROP TRIGGER IF EXISTS team_competition_teams_touch_updated_at ON public.team_competition_teams;
CREATE TRIGGER team_competition_teams_touch_updated_at
    BEFORE UPDATE ON public.team_competition_teams
    FOR EACH ROW EXECUTE FUNCTION private.team_competition_touch_updated_at();
DROP TRIGGER IF EXISTS team_competition_attempts_touch_updated_at ON public.team_competition_attempts;
CREATE TRIGGER team_competition_attempts_touch_updated_at
    BEFORE UPDATE ON public.team_competition_attempts
    FOR EACH ROW EXECUTE FUNCTION private.team_competition_touch_updated_at();

CREATE OR REPLACE FUNCTION private.team_competition_guard_config_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.status IN ('active', 'ended') AND (
        NEW.name IS DISTINCT FROM OLD.name OR
        NEW.classlevel IS DISTINCT FROM OLD.classlevel OR
        NEW.participant_mode IS DISTINCT FROM OLD.participant_mode OR
        NEW.question_mode IS DISTINCT FROM OLD.question_mode OR
        NEW.common_exam_id IS DISTINCT FROM OLD.common_exam_id OR
        NEW.time_limit_minutes IS DISTINCT FROM OLD.time_limit_minutes
    ) THEN
        RAISE EXCEPTION 'active_or_ended_competition_is_immutable';
    END IF;
    IF OLD.status = 'ended' AND NEW.status <> OLD.status THEN
        RAISE EXCEPTION 'ended_competition_is_immutable';
    END IF;
    IF OLD.status = 'active' AND NEW.status NOT IN ('active', 'ended') THEN
        RAISE EXCEPTION 'active_competition_has_invalid_transition';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS team_competitions_guard_config_update ON public.team_competitions;
CREATE TRIGGER team_competitions_guard_config_update
    BEFORE UPDATE ON public.team_competitions
    FOR EACH ROW EXECUTE FUNCTION private.team_competition_guard_config_update();

CREATE OR REPLACE FUNCTION private.team_competition_guard_team_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    competition_status TEXT;
BEGIN
    SELECT status INTO competition_status
    FROM public.team_competitions
    WHERE id = OLD.competition_id;
    IF competition_status IN ('active', 'ended') AND (
        NEW.name IS DISTINCT FROM OLD.name OR
        NEW.position IS DISTINCT FROM OLD.position OR
        NEW.target_member_count IS DISTINCT FROM OLD.target_member_count OR
        NEW.leader_username IS DISTINCT FROM OLD.leader_username OR
        NEW.exam_id IS DISTINCT FROM OLD.exam_id
    ) THEN
        RAISE EXCEPTION 'active_or_ended_team_is_immutable';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS team_competition_teams_guard_update ON public.team_competition_teams;
CREATE TRIGGER team_competition_teams_guard_update
    BEFORE UPDATE ON public.team_competition_teams
    FOR EACH ROW EXECUTE FUNCTION private.team_competition_guard_team_update();

CREATE OR REPLACE FUNCTION public.team_competition_save_questions(
    p_team_id UUID,
    p_questions JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
    team_row public.team_competition_teams;
    competition_row public.team_competitions;
    question_item JSONB;
    question_id UUID;
    question_index INTEGER := 0;
    answer_count INTEGER;
BEGIN
    IF NOT (SELECT private.is_admin()) THEN RAISE EXCEPTION 'forbidden'; END IF;
    IF jsonb_typeof(coalesce(p_questions, '[]'::jsonb)) <> 'array' THEN RAISE EXCEPTION 'questions_must_be_array'; END IF;
    SELECT * INTO team_row FROM public.team_competition_teams WHERE id = p_team_id FOR UPDATE;
    IF team_row.id IS NULL THEN RAISE EXCEPTION 'team_not_found'; END IF;
    SELECT * INTO competition_row FROM public.team_competitions WHERE id = team_row.competition_id FOR UPDATE;
    IF competition_row.status NOT IN ('draft', 'prepared') THEN RAISE EXCEPTION 'competition_is_locked'; END IF;

    DELETE FROM public.team_competition_questions WHERE team_id = p_team_id;
    FOR question_item IN SELECT value FROM jsonb_array_elements(p_questions) LOOP
        answer_count := private.team_competition_answer_count(question_item);
        IF answer_count NOT IN (1, 2, 4) THEN RAISE EXCEPTION 'unsupported_question_answer_count'; END IF;
        INSERT INTO public.team_competition_questions (
            competition_id, team_id, question_index, question_payload, question_type, answer_count, part_answer_counts
        ) VALUES (
            team_row.competition_id, team_row.id, question_index,
            private.team_competition_sanitize_question(question_item),
            coalesce(question_item->>'type', 'Trắc nghiệm'), answer_count,
            coalesce(question_item->'partAnswerCounts', '[]'::jsonb)
        ) RETURNING id INTO question_id;
        INSERT INTO private.team_competition_answer_keys (question_id, answer_key)
        VALUES (question_id, jsonb_build_object(
            'type', question_item->'type', 'ans', question_item->'ans',
            'statements', question_item->'statements',
            'partAnswerCounts', question_item->'partAnswerCounts'
        ));
        question_index := question_index + 1;
    END LOOP;
    IF question_index = 0 THEN RAISE EXCEPTION 'team_questions_required'; END IF;
    RETURN question_index;
END;
$$;

CREATE OR REPLACE FUNCTION public.team_competition_prepare(p_competition_id UUID)
RETURNS public.team_competitions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
    competition_row public.team_competitions;
    team_row RECORD;
    team_total INTEGER;
    member_total INTEGER;
    leader_total INTEGER;
    distinct_leader_total INTEGER;
    question_total INTEGER;
    first_question_total INTEGER;
BEGIN
    IF NOT (SELECT private.is_admin()) THEN RAISE EXCEPTION 'forbidden'; END IF;
    SELECT * INTO competition_row FROM public.team_competitions WHERE id = p_competition_id FOR UPDATE;
    IF competition_row.id IS NULL THEN RAISE EXCEPTION 'competition_not_found'; END IF;
    IF competition_row.status = 'prepared' THEN RETURN competition_row; END IF;
    IF competition_row.status <> 'draft' THEN RAISE EXCEPTION 'invalid_prepare_transition'; END IF;

    SELECT count(*) INTO team_total FROM public.team_competition_teams WHERE competition_id = p_competition_id;
    IF team_total < 2 THEN RAISE EXCEPTION 'at_least_two_teams_required'; END IF;
    SELECT count(*), count(DISTINCT leader_username) INTO leader_total, distinct_leader_total
    FROM public.team_competition_teams WHERE competition_id = p_competition_id;
    IF leader_total <> distinct_leader_total THEN RAISE EXCEPTION 'leader_must_be_unique'; END IF;

    FOR team_row IN SELECT * FROM public.team_competition_teams WHERE competition_id = p_competition_id LOOP
        SELECT count(*) INTO member_total FROM public.team_competition_members WHERE team_id = team_row.id;
        IF member_total = 0 THEN RAISE EXCEPTION 'team_has_no_members'; END IF;
        IF team_row.target_member_count IS NOT NULL AND team_row.target_member_count <> member_total THEN
            RAISE EXCEPTION 'team_target_member_count_mismatch';
        END IF;
        IF NOT EXISTS (
            SELECT 1 FROM public.team_competition_members
            WHERE team_id = team_row.id AND username = team_row.leader_username
        ) THEN RAISE EXCEPTION 'leader_must_be_team_member'; END IF;
        IF EXISTS (
            SELECT 1 FROM public.team_competition_members member
            LEFT JOIN public.game_users user_profile ON user_profile.username = member.username
            WHERE member.team_id = team_row.id
              AND (user_profile.username IS NULL OR lower(coalesce(user_profile.role, 'student')) = 'admin'
                   OR user_profile.approved = false
                   OR regexp_replace(coalesce(user_profile.classlevel, ''), '^Lớp[[:space:]]*', '', 'i') <> competition_row.classlevel)
        ) THEN RAISE EXCEPTION 'member_is_not_an_approved_student_in_class'; END IF;
        SELECT count(*) INTO question_total FROM public.team_competition_questions WHERE team_id = team_row.id;
        IF question_total < 1 THEN RAISE EXCEPTION 'team_questions_required'; END IF;
        IF first_question_total IS NULL THEN first_question_total := question_total;
        ELSIF first_question_total <> question_total THEN RAISE EXCEPTION 'question_count_mismatch'; END IF;
    END LOOP;

    UPDATE public.team_competitions
    SET status = 'prepared', version = version + 1
    WHERE id = p_competition_id
    RETURNING * INTO competition_row;
    RETURN competition_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.team_competition_start(p_competition_id UUID)
RETURNS public.team_competitions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
    competition_row public.team_competitions;
    start_time TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    IF NOT (SELECT private.is_admin()) THEN RAISE EXCEPTION 'forbidden'; END IF;
    SELECT * INTO competition_row FROM public.team_competitions WHERE id = p_competition_id FOR UPDATE;
    IF competition_row.id IS NULL THEN RAISE EXCEPTION 'competition_not_found'; END IF;
    IF competition_row.status = 'active' THEN RETURN competition_row; END IF;
    IF competition_row.status <> 'prepared' THEN RAISE EXCEPTION 'invalid_start_transition'; END IF;
    UPDATE public.team_competitions
    SET status = 'active', started_at = start_time, version = version + 1
    WHERE id = p_competition_id
    RETURNING * INTO competition_row;
    UPDATE public.team_competition_teams
    SET status = 'active', started_at = start_time
    WHERE competition_id = p_competition_id;
    RETURN competition_row;
END;
$$;

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
        p_competition_id, p_team_id, current_name, auth.uid(), coalesce(p_session_id, uuid_generate_v4()),
        question_total, coalesce(competition_row.started_at, timezone('utc'::text, now()))
    ) RETURNING * INTO created_attempt;
    UPDATE public.team_competition_teams
    SET status = 'active', started_at = coalesce(started_at, created_attempt.started_at)
    WHERE id = p_team_id;
    RETURN created_attempt;
END;
$$;

CREATE OR REPLACE FUNCTION public.team_competition_lock_attempt(
    p_attempt_id UUID,
    p_session_id UUID,
    p_reason TEXT DEFAULT 'leader_exit'
)
RETURNS public.team_competition_attempts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
    attempt_row public.team_competition_attempts;
    lock_time TIMESTAMPTZ := timezone('utc'::text, now());
    is_admin BOOLEAN := private.is_admin();
BEGIN
    SELECT * INTO attempt_row FROM public.team_competition_attempts WHERE id = p_attempt_id FOR UPDATE;
    IF attempt_row.id IS NULL THEN RAISE EXCEPTION 'attempt_not_found'; END IF;
    IF NOT is_admin AND (
        private.current_username() IS DISTINCT FROM attempt_row.leader_username
        OR p_session_id IS NULL OR p_session_id <> attempt_row.session_id
    ) THEN RAISE EXCEPTION 'attempt_session_mismatch'; END IF;
    IF attempt_row.status = 'locked' THEN RETURN attempt_row; END IF;
    UPDATE public.team_competition_attempts
    SET status = 'locked', lock_reason = left(coalesce(p_reason, 'leader_exit'), 80),
        locked_at = lock_time, completed_at = coalesce(completed_at, lock_time),
        duration_seconds = greatest(0, extract(epoch FROM (coalesce(completed_at, lock_time) - started_at))::integer),
        last_heartbeat_at = lock_time
    WHERE id = p_attempt_id
    RETURNING * INTO attempt_row;
    UPDATE public.team_competition_teams
    SET status = 'locked', score = attempt_row.score, submitted_count = attempt_row.submitted_count,
        correct_count = attempt_row.correct_count, completed_at = attempt_row.completed_at,
        locked_at = attempt_row.locked_at, duration_seconds = attempt_row.duration_seconds
    WHERE id = attempt_row.team_id;
    RETURN attempt_row;
END;
$$;

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
    SELECT question INTO question_row FROM public.team_competition_questions question
    WHERE question.team_id = attempt_row.team_id AND question.question_index = p_question_index;
    IF question_row.id IS NULL THEN RAISE EXCEPTION 'question_not_found'; END IF;
    SELECT answer_key INTO answer_key FROM private.team_competition_answer_keys WHERE question_id = question_row.id;
    IF answer_key IS NULL THEN RAISE EXCEPTION 'answer_key_not_found'; END IF;
    IF EXISTS (SELECT 1 FROM public.team_competition_answers WHERE attempt_id = p_attempt_id AND question_id = question_row.id) THEN
        RETURN attempt_row;
    END IF;
    score_result := private.team_competition_score_question(answer_key, p_selected_answer);
    INSERT INTO public.team_competition_answers (
        attempt_id, question_id, question_index, selected_answer, points, is_correct, submitted_at
    ) VALUES (
        p_attempt_id, question_row.id, p_question_index, coalesce(p_selected_answer, ''),
        coalesce((score_result->>'points')::numeric, 0), coalesce((score_result->>'isCorrect')::boolean, false), submit_time
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
        score = attempt_row.score, submitted_count = attempt_row.submitted_count,
        correct_count = attempt_row.correct_count, completed_at = attempt_row.completed_at,
        duration_seconds = attempt_row.duration_seconds
    WHERE id = attempt_row.team_id;
    RETURN attempt_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.team_competition_end(p_competition_id UUID)
RETURNS public.team_competitions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
    competition_row public.team_competitions;
    end_time TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    IF NOT (SELECT private.is_admin()) THEN RAISE EXCEPTION 'forbidden'; END IF;
    SELECT * INTO competition_row FROM public.team_competitions WHERE id = p_competition_id FOR UPDATE;
    IF competition_row.id IS NULL THEN RAISE EXCEPTION 'competition_not_found'; END IF;
    IF competition_row.status = 'ended' THEN RETURN competition_row; END IF;
    IF competition_row.status <> 'active' THEN RAISE EXCEPTION 'invalid_end_transition'; END IF;

    UPDATE public.team_competition_attempts
    SET status = 'locked', lock_reason = coalesce(lock_reason, 'admin_end'),
        locked_at = coalesce(locked_at, end_time), completed_at = coalesce(completed_at, end_time),
        duration_seconds = greatest(0, extract(epoch FROM (coalesce(completed_at, end_time) - started_at))::integer),
        last_heartbeat_at = end_time
    WHERE competition_id = p_competition_id AND status = 'active';
    UPDATE public.team_competition_teams team
    SET status = 'ended', score = coalesce(attempt.score, 0),
        submitted_count = coalesce(attempt.submitted_count, 0), correct_count = coalesce(attempt.correct_count, 0),
        completed_at = coalesce(attempt.completed_at, team.completed_at, end_time),
        locked_at = attempt.locked_at, duration_seconds = attempt.duration_seconds
    FROM public.team_competition_attempts attempt
    WHERE attempt.team_id = team.id AND team.competition_id = p_competition_id;
    UPDATE public.team_competition_teams
    SET status = 'ended', completed_at = coalesce(completed_at, end_time)
    WHERE competition_id = p_competition_id;
    UPDATE public.team_competitions
    SET status = 'ended', ended_at = end_time, version = version + 1
    WHERE id = p_competition_id
    RETURNING * INTO competition_row;

    DELETE FROM public.team_competition_results WHERE competition_id = p_competition_id;
    INSERT INTO public.team_competition_results (competition_id, team_id, username, individual_score, team_rank)
    SELECT p_competition_id, team.id, member.username, team.score,
           rank() OVER (ORDER BY team.score DESC)::integer
    FROM public.team_competition_teams team
    JOIN public.team_competition_members member ON member.team_id = team.id
    WHERE team.competition_id = p_competition_id;
    RETURN competition_row;
END;
$$;

-- RLS: only authenticated users can see this feature. Admins manage the setup;
-- leaders can read/write only their own active attempt through the RPCs.
ALTER TABLE public.team_competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_competition_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_competition_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_competition_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_competition_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_competition_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_competition_results ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER membership helpers keep policy expressions from recursively
-- querying team_competition_members under its own RLS policy.
CREATE OR REPLACE FUNCTION private.team_competition_is_member(
    p_competition_id UUID,
    p_team_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.team_competition_members member
        JOIN public.team_competitions competition ON competition.id = member.competition_id
        WHERE member.competition_id = p_competition_id
          AND (p_team_id IS NULL OR member.team_id = p_team_id)
          AND member.username = (SELECT private.current_username())
          AND competition.status IN ('active', 'ended')
    );
$$;

CREATE OR REPLACE FUNCTION private.team_competition_is_leader(p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.team_competition_teams team
        JOIN public.team_competitions competition ON competition.id = team.competition_id
        WHERE team.id = p_team_id
          AND team.leader_username = (SELECT private.current_username())
          AND competition.status IN ('active', 'ended')
    );
$$;

REVOKE ALL ON public.team_competitions, public.team_competition_teams,
    public.team_competition_members, public.team_competition_questions,
    public.team_competition_attempts, public.team_competition_answers,
    public.team_competition_results FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_competitions,
    public.team_competition_teams, public.team_competition_members TO authenticated;
GRANT SELECT ON public.team_competition_questions, public.team_competition_attempts,
    public.team_competition_answers, public.team_competition_results TO authenticated;
REVOKE ALL ON private.team_competition_answer_keys FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS team_competitions_select ON public.team_competitions;
DROP POLICY IF EXISTS team_competitions_admin_write ON public.team_competitions;
CREATE POLICY team_competitions_select ON public.team_competitions FOR SELECT TO authenticated
USING (
    (SELECT private.is_admin()) OR (
        status IN ('active', 'ended') AND private.team_competition_is_member(team_competitions.id)
    )
);
CREATE POLICY team_competitions_admin_write ON public.team_competitions FOR ALL TO authenticated
USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));

DROP POLICY IF EXISTS team_competition_teams_select ON public.team_competition_teams;
DROP POLICY IF EXISTS team_competition_teams_admin_write ON public.team_competition_teams;
CREATE POLICY team_competition_teams_select ON public.team_competition_teams FOR SELECT TO authenticated
USING (
    (SELECT private.is_admin()) OR private.team_competition_is_member(team_competition_teams.competition_id)
);
CREATE POLICY team_competition_teams_admin_write ON public.team_competition_teams FOR ALL TO authenticated
USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));

DROP POLICY IF EXISTS team_competition_members_select ON public.team_competition_members;
DROP POLICY IF EXISTS team_competition_members_admin_write ON public.team_competition_members;
CREATE POLICY team_competition_members_select ON public.team_competition_members FOR SELECT TO authenticated
USING (
    (SELECT private.is_admin()) OR private.team_competition_is_member(team_competition_members.competition_id, team_competition_members.team_id)
);
CREATE POLICY team_competition_members_admin_write ON public.team_competition_members FOR ALL TO authenticated
USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));

DROP POLICY IF EXISTS team_competition_questions_select ON public.team_competition_questions;
CREATE POLICY team_competition_questions_select ON public.team_competition_questions FOR SELECT TO authenticated
USING (
    (SELECT private.is_admin()) OR private.team_competition_is_leader(team_competition_questions.team_id)
);

DROP POLICY IF EXISTS team_competition_attempts_select ON public.team_competition_attempts;
CREATE POLICY team_competition_attempts_select ON public.team_competition_attempts FOR SELECT TO authenticated
USING ((SELECT private.is_admin()) OR leader_username = (SELECT private.current_username()));

DROP POLICY IF EXISTS team_competition_answers_select ON public.team_competition_answers;
CREATE POLICY team_competition_answers_select ON public.team_competition_answers FOR SELECT TO authenticated
USING (
    (SELECT private.is_admin()) OR EXISTS (
        SELECT 1 FROM public.team_competition_attempts attempt
        WHERE attempt.id = team_competition_answers.attempt_id
          AND attempt.leader_username = (SELECT private.current_username())
    )
);

DROP POLICY IF EXISTS team_competition_results_select ON public.team_competition_results;
CREATE POLICY team_competition_results_select ON public.team_competition_results FOR SELECT TO authenticated
USING (
    (SELECT private.is_admin()) OR private.team_competition_is_member(team_competition_results.competition_id, team_competition_results.team_id)
);

GRANT EXECUTE ON FUNCTION public.team_competition_save_questions(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.team_competition_prepare(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.team_competition_start(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.team_competition_start_attempt(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.team_competition_lock_attempt(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.team_competition_submit_answer(UUID, INTEGER, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.team_competition_end(UUID) TO authenticated;
REVOKE ALL ON FUNCTION private.team_competition_is_member(UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.team_competition_is_leader(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.team_competition_is_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.team_competition_is_leader(UUID) TO authenticated;

-- Realtime is idempotently enabled for the public state tables.
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'team_competitions', 'team_competition_teams', 'team_competition_members',
        'team_competition_questions', 'team_competition_attempts',
        'team_competition_answers', 'team_competition_results'
    ] LOOP
        IF NOT EXISTS (
            SELECT 1
            FROM pg_publication_rel publication_relation
            JOIN pg_class relation ON relation.oid = publication_relation.prrelid
            JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
            JOIN pg_publication publication ON publication.oid = publication_relation.prpubid
            WHERE publication.pubname = 'supabase_realtime'
              AND namespace.nspname = 'public'
              AND relation.relname = table_name
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', table_name);
        END IF;
    END LOOP;
END $$;
