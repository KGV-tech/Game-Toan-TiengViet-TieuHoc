-- Allow team competitions to use questions whose answer tokens are grouped
-- into one, two, or four scored parts (for example [2, 2, 2, 2]).
-- Apply after 20260906_team_competitions.sql. This migration changes RPC
-- behavior only; it does not alter tables, scores already recorded, or RLS.

CREATE OR REPLACE FUNCTION private.team_competition_answer_count(input JSONB)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    value_count INTEGER;
    group_count INTEGER;
    group_total INTEGER;
BEGIN
    IF jsonb_typeof(input->'statements') = 'array' THEN
        SELECT count(*) INTO value_count FROM jsonb_array_elements(input->'statements');
    ELSE
        SELECT count(*) INTO value_count
        FROM unnest(regexp_split_to_array(coalesce(input->>'ans', ''), '[|,]')) AS part
        WHERE char_length(trim(part)) > 0;
    END IF;
    IF jsonb_typeof(input->'partAnswerCounts') = 'array'
       AND jsonb_array_length(input->'partAnswerCounts') IN (1, 2, 4)
       AND NOT EXISTS (
           SELECT 1
           FROM jsonb_array_elements(input->'partAnswerCounts') AS part(value)
           WHERE jsonb_typeof(part.value) <> 'number'
              OR (part.value #>> '{}') !~ '^[1-9][0-9]*$'
       ) THEN
        group_count := jsonb_array_length(input->'partAnswerCounts');
        SELECT coalesce(sum((part.value #>> '{}')::INTEGER), 0)
        INTO group_total
        FROM jsonb_array_elements(input->'partAnswerCounts') AS part(value);
        IF group_total = value_count THEN RETURN group_count; END IF;
    END IF;
    RETURN coalesce(value_count, 0);
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

    IF coalesce(array_length(part_counts, 1), 0) IN (1, 2, 4)
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
        score := grouped_correct_count::numeric / array_length(part_counts, 1);
        RETURN jsonb_build_object(
            'answerCount', array_length(part_counts, 1), 'correctCount', correct_count,
            'points', round(score, 6), 'isCorrect', correct_count = array_length(part_counts, 1)
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
