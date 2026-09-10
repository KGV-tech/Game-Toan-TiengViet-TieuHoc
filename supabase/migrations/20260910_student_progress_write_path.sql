-- Bước 2: tách đường ghi tiến độ khỏi hồ sơ game_users.
--
-- Migration này phụ thuộc 20260910_game_users_rls_hardening.sql. Client chỉ
-- gửi event nhỏ; máy chủ khóa đúng hồ sơ, tính các thay đổi liên quan và ghi
-- event + game_users/user_quests trong cùng transaction.

DO $$
BEGIN
  IF to_regclass('public.game_users') IS NULL
     OR to_regclass('public.user_quests') IS NULL
     OR to_regclass('public.game_quests') IS NULL THEN
    RAISE EXCEPTION 'game_users, user_quests and game_quests are required before the student progress write path';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.student_progress_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_key TEXT NOT NULL,
  event_type TEXT NOT NULL,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (auth_user_id, event_key)
);

ALTER TABLE public.student_progress_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.student_progress_events FROM PUBLIC;
REVOKE ALL ON TABLE public.student_progress_events FROM anon;
REVOKE ALL ON TABLE public.student_progress_events FROM authenticated;

COMMENT ON TABLE public.student_progress_events IS
  'Private idempotency ledger for atomic student progress events.';

CREATE INDEX IF NOT EXISTS student_progress_events_free_spin_idx
  ON public.student_progress_events (auth_user_id, created_at)
  WHERE event_type = 'lucky_spin' AND consumed_at IS NULL;

CREATE OR REPLACE FUNCTION public.apply_student_progress_event(p_event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_auth_user_id UUID := (SELECT auth.uid());
  v_event_type TEXT;
  v_event_key TEXT;
  v_event_id UUID;
  v_existing_event public.student_progress_events%ROWTYPE;
  v_user public.game_users;
  v_event_round JSONB;
  v_entry JSONB;
  v_details JSONB;
  v_topics JSONB;
  v_lessons JSONB;
  v_history JSONB;
  v_history_total NUMERIC := 0;
  v_score NUMERIC;
  v_question_count INTEGER;
  v_subject TEXT;
  v_exam_id UUID;
  v_quest_id UUID;
  v_is_exam BOOLEAN := false;
  v_consume_energy BOOLEAN := false;
  v_today DATE := (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;
  v_yesterday DATE;
  v_energy INTEGER;
  v_daily_reward INTEGER := 0;
  v_practice_streak INTEGER;
  v_total_stars_earned INTEGER;
  v_quest_updates JSONB := '[]'::jsonb;
  v_extra JSONB := '{}'::jsonb;
  v_result JSONB;
  v_quest RECORD;
  v_user_quest public.user_quests%ROWTYPE;
  v_reward_stars INTEGER := 0;
  v_reward_code TEXT := 'none';
  v_segment INTEGER := 3;
  v_free_spin BOOLEAN := false;
  v_free_spin_awarded BOOLEAN := false;
  v_free_spin_event_id UUID;
  v_roll NUMERIC;
  v_pet_id TEXT;
  v_pet_name TEXT;
  v_pet_image TEXT;
  v_pet JSONB := NULL;
BEGIN
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_event IS NULL OR jsonb_typeof(p_event) <> 'object'
     OR length(p_event::text) > 200000 THEN
    RAISE EXCEPTION 'invalid_progress_event' USING ERRCODE = '22023';
  END IF;

  v_event_type := lower(btrim(coalesce(p_event->>'type', '')));
  v_event_key := btrim(coalesce(p_event->>'event_id', ''));
  IF v_event_type NOT IN ('practice_round', 'spend_energy', 'daily_gift', 'quest_reward', 'lucky_spin') THEN
    RAISE EXCEPTION 'progress_event_type_not_allowed' USING ERRCODE = '42501';
  END IF;
  IF v_event_key !~ '^[A-Za-z0-9._:-]{8,128}$' THEN
    RAISE EXCEPTION 'invalid_progress_event_id' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_user
  FROM public.game_users
  WHERE auth_user_id = v_auth_user_id
    AND lower(coalesce(role, 'student')) = 'student'
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'student_profile_not_found' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_existing_event
  FROM public.student_progress_events
  WHERE auth_user_id = v_auth_user_id
    AND event_key = v_event_key
  FOR UPDATE;
  IF FOUND THEN
    IF v_existing_event.event_type <> v_event_type THEN
      RAISE EXCEPTION 'progress_event_id_conflict' USING ERRCODE = '23505';
    END IF;
    RETURN v_existing_event.result || jsonb_build_object('replayed', true);
  END IF;

  INSERT INTO public.student_progress_events (auth_user_id, event_key, event_type)
  VALUES (v_auth_user_id, v_event_key, v_event_type)
  ON CONFLICT (auth_user_id, event_key) DO NOTHING
  RETURNING id INTO v_event_id;
  IF v_event_id IS NULL THEN
    SELECT * INTO v_existing_event
    FROM public.student_progress_events
    WHERE auth_user_id = v_auth_user_id
      AND event_key = v_event_key
    FOR UPDATE;
    RETURN v_existing_event.result || jsonb_build_object('replayed', true);
  END IF;

  IF v_event_type = 'practice_round' THEN
    v_event_round := p_event->'round';
    IF v_event_round IS NULL OR jsonb_typeof(v_event_round) <> 'object' THEN
      RAISE EXCEPTION 'invalid_practice_round' USING ERRCODE = '22023';
    END IF;
    v_subject := lower(btrim(coalesce(v_event_round->>'subject', '')));
    IF v_subject NOT IN ('math', 'vietnamese') THEN
      RAISE EXCEPTION 'invalid_practice_subject' USING ERRCODE = '22023';
    END IF;
    IF jsonb_typeof(v_event_round->'score') <> 'number'
       OR (v_event_round->>'score')::numeric NOT BETWEEN 0 AND 10 THEN
      RAISE EXCEPTION 'invalid_practice_score' USING ERRCODE = '22023';
    END IF;
    v_score := round((v_event_round->>'score')::numeric, 2);
    IF coalesce(v_event_round->>'question_count', '') !~ '^[0-9]+$'
       OR (v_event_round->>'question_count')::integer NOT BETWEEN 1 AND 10 THEN
      RAISE EXCEPTION 'invalid_practice_question_count' USING ERRCODE = '22023';
    END IF;
    v_question_count := (v_event_round->>'question_count')::integer;

    v_details := coalesce(v_event_round->'details', '[]'::jsonb);
    IF jsonb_typeof(v_details) <> 'array' OR jsonb_array_length(v_details) > 10 THEN
      RAISE EXCEPTION 'invalid_practice_details' USING ERRCODE = '22023';
    END IF;
    IF EXISTS (
      SELECT 1 FROM jsonb_array_elements(v_details) AS item
      WHERE jsonb_typeof(item) <> 'object'
    ) THEN
      RAISE EXCEPTION 'invalid_practice_detail_item' USING ERRCODE = '22023';
    END IF;

    v_topics := coalesce(v_event_round->'topics', '[]'::jsonb);
    v_lessons := coalesce(v_event_round->'lessons', '[]'::jsonb);
    IF jsonb_typeof(v_topics) <> 'array' OR jsonb_array_length(v_topics) > 20
       OR jsonb_typeof(v_lessons) <> 'array' OR jsonb_array_length(v_lessons) > 20 THEN
      RAISE EXCEPTION 'invalid_practice_context' USING ERRCODE = '22023';
    END IF;
    IF EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(v_topics) AS item
      WHERE length(btrim(item)) = 0 OR length(btrim(item)) > 160
    ) OR EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(v_lessons) AS item
      WHERE length(btrim(item)) = 0 OR length(btrim(item)) > 160
    ) THEN
      RAISE EXCEPTION 'invalid_practice_context_item' USING ERRCODE = '22023';
    END IF;

    IF p_event ? 'is_exam' AND jsonb_typeof(p_event->'is_exam') <> 'boolean' THEN
      RAISE EXCEPTION 'invalid_practice_kind' USING ERRCODE = '22023';
    END IF;
    IF p_event ? 'consume_energy' AND jsonb_typeof(p_event->'consume_energy') <> 'boolean' THEN
      RAISE EXCEPTION 'invalid_energy_request' USING ERRCODE = '22023';
    END IF;
    v_is_exam := coalesce((p_event->>'is_exam')::boolean, false);
    v_consume_energy := coalesce((p_event->>'consume_energy')::boolean, false);

    IF nullif(btrim(v_event_round->>'exam_id'), '') IS NOT NULL THEN
      IF btrim(v_event_round->>'exam_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
        RAISE EXCEPTION 'invalid_exam_id' USING ERRCODE = '22023';
      END IF;
      v_exam_id := (v_event_round->>'exam_id')::uuid;
    END IF;
    IF nullif(btrim(v_event_round->>'quest_id'), '') IS NOT NULL THEN
      IF btrim(v_event_round->>'quest_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
        RAISE EXCEPTION 'invalid_quest_id' USING ERRCODE = '22023';
      END IF;
      v_quest_id := (v_event_round->>'quest_id')::uuid;
    END IF;

    v_entry := jsonb_build_object(
      'attempt_id', v_event_key,
      'date', to_char(now() AT TIME ZONE 'Asia/Ho_Chi_Minh', 'HH24:MI DD/MM/YYYY'),
      'title', left(btrim(coalesce(v_event_round->>'title', 'Luyện tập')), 200),
      'topic', left(btrim(coalesce(v_event_round->>'topic', 'Tất cả')), 500),
      'subject', v_subject,
      'classlevel', regexp_replace(coalesce(v_user.classlevel::text, '5'), '^Lớp[[:space:]]*', '', 'i'),
      'difficulty', left(btrim(coalesce(v_event_round->>'difficulty', 'Dễ')), 40),
      'questionCount', v_question_count,
      'score', v_score,
      'details', v_details
    );

    v_history := coalesce(v_user.history, '[]'::jsonb);
    IF jsonb_typeof(v_history) <> 'array' OR jsonb_array_length(v_history) >= 5000 THEN
      RAISE EXCEPTION 'invalid_existing_history' USING ERRCODE = '22023';
    END IF;
    IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_history) AS item
      WHERE jsonb_typeof(item) <> 'object'
        OR NOT (item ? 'score')
        OR (item->>'score') !~ '^(10([.][0-9]+)?|[0-9]([.][0-9]+)?)$'
        OR CASE
          WHEN (item->>'score') ~ '^(10([.][0-9]+)?|[0-9]([.][0-9]+)?)$'
            THEN (item->>'score')::numeric NOT BETWEEN 0 AND 10
          ELSE true
        END
    ) THEN
      RAISE EXCEPTION 'invalid_existing_history_score' USING ERRCODE = '22023';
    END IF;
    SELECT coalesce(sum((item->>'score')::numeric), 0)
      INTO v_history_total
    FROM jsonb_array_elements(v_history) AS item;

    IF v_consume_energy THEN
      v_energy := CASE
        WHEN v_user.energy_date IS DISTINCT FROM v_today THEN 5
        ELSE coalesce(v_user.energy, 5)
      END;
      IF v_energy <= 0 THEN
        RAISE EXCEPTION 'energy_depleted' USING ERRCODE = '22023';
      END IF;
      v_energy := v_energy - 1;
    END IF;

    IF NOT v_is_exam AND v_user.last_practice_date IS DISTINCT FROM v_today THEN
      v_yesterday := v_today - 1;
      v_practice_streak := CASE
        WHEN v_user.last_practice_date = v_yesterday THEN coalesce(v_user.practice_streak, 0) + 1
        ELSE 1
      END;
      IF v_practice_streak >= 5 THEN
        v_daily_reward := 6;
        v_practice_streak := 0;
      ELSE
        v_daily_reward := 1;
      END IF;
    ELSE
      v_practice_streak := coalesce(v_user.practice_streak, 0);
    END IF;

    UPDATE public.game_users
    SET history = v_history || jsonb_build_array(v_entry),
        totalscore = round(v_history_total + v_score, 1),
        stars = coalesce(stars, 0) + v_daily_reward,
        total_stars_earned = coalesce(total_stars_earned, 0) + v_daily_reward,
        energy = CASE WHEN v_consume_energy THEN v_energy ELSE energy END,
        energy_date = CASE WHEN v_consume_energy THEN v_today ELSE energy_date END,
        last_practice_date = CASE WHEN NOT v_is_exam THEN v_today ELSE last_practice_date END,
        practice_streak = CASE WHEN NOT v_is_exam THEN v_practice_streak ELSE practice_streak END
    WHERE id = v_user.id;

    -- Quest progress is derived from the canonical round event, not from a
    -- browser UPDATE of user_quests. The score is range-checked here; answer
    -- key verification remains a later server-authoritative content phase.
    FOR v_quest IN
      SELECT q.*
      FROM public.game_quests AS q
      WHERE q.is_active IS DISTINCT FROM false
        AND (q.start_at IS NULL OR q.start_at <= now())
        AND (q.end_at IS NULL OR q.end_at > now())
        AND (
          lower(coalesce(q.target_subject, 'any')) = 'any'
          OR lower(coalesce(q.target_subject, '')) = v_subject
        )
        AND (
          coalesce(q.assign_type, 'all') = 'all'
          OR (q.assign_type = 'user' AND btrim(coalesce(q.assign_target, '')) = btrim(v_user.username))
          OR (
            q.assign_type = 'class'
            AND (
              btrim(regexp_replace(coalesce(q.assign_target, ''), '^Lớp[[:space:]]*', '', 'i')) =
                btrim(regexp_replace(coalesce(v_user.class_name, ''), '^Lớp[[:space:]]*', '', 'i'))
              OR btrim(regexp_replace(coalesce(q.assign_target, ''), '^Lớp[[:space:]]*', '', 'i')) =
                btrim(regexp_replace(coalesce(v_user.classlevel::text, '5'), '^Lớp[[:space:]]*', '', 'i'))
            )
          )
        )
        AND (
          q.target_classlevel IS NULL
          OR btrim(regexp_replace(q.target_classlevel::text, '^Lớp[[:space:]]*', '', 'i')) =
             btrim(regexp_replace(coalesce(v_user.classlevel::text, '5'), '^Lớp[[:space:]]*', '', 'i'))
        )
        AND (
          (NOT v_is_exam AND q.exam_id IS NULL AND v_quest_id IS NULL)
          OR (v_is_exam AND q.exam_id IS NOT NULL AND q.id = v_quest_id AND q.exam_id = v_exam_id)
        )
        AND coalesce((q.curriculum->>'classlevel') IS NULL OR
          btrim(regexp_replace(q.curriculum->>'classlevel', '^Lớp[[:space:]]*', '', 'i')) =
          btrim(regexp_replace(coalesce(v_user.classlevel::text, '5'), '^Lớp[[:space:]]*', '', 'i')), true)
        AND coalesce((q.curriculum->>'topic') IS NULL OR NOT EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(v_topics) AS topic(value)
          WHERE lower(btrim(topic.value)) = lower(btrim(q.curriculum->>'topic'))
        ), true)
        AND coalesce((q.curriculum->>'lesson') IS NULL OR NOT EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(v_lessons) AS lesson(value)
          WHERE lower(btrim(lesson.value)) = lower(btrim(q.curriculum->>'lesson'))
        ), true)
        AND v_score >= coalesce(q.target_score, 0)
    LOOP
      SELECT * INTO v_user_quest
      FROM public.user_quests
      WHERE user_username = v_user.username
        AND quest_id = v_quest.id
      FOR UPDATE;

      IF NOT FOUND THEN
        INSERT INTO public.user_quests (user_username, quest_id, progress, is_completed)
        VALUES (v_user.username, v_quest.id, 1, false)
        RETURNING * INTO v_user_quest;
      ELSIF NOT v_user_quest.is_completed THEN
        UPDATE public.user_quests
        SET progress = LEAST(coalesce(progress, 0) + 1, greatest(coalesce(v_quest.target_count, 1), 1))
        WHERE id = v_user_quest.id
        RETURNING * INTO v_user_quest;
      ELSE
        CONTINUE;
      END IF;
      v_quest_updates := v_quest_updates || jsonb_build_array(jsonb_build_object(
        'id', v_user_quest.id,
        'quest_id', v_user_quest.quest_id,
        'progress', v_user_quest.progress,
        'is_completed', v_user_quest.is_completed
      ));
    END LOOP;

    v_extra := jsonb_build_object(
      'daily_reward', v_daily_reward,
      'daily_streak', v_practice_streak,
      'quest_updates', v_quest_updates
    );
  ELSIF v_event_type = 'spend_energy' THEN
    v_energy := CASE
      WHEN v_user.energy_date IS DISTINCT FROM v_today THEN 5
      ELSE coalesce(v_user.energy, 5)
    END;
    IF v_energy <= 0 THEN
      RAISE EXCEPTION 'energy_depleted' USING ERRCODE = '22023';
    END IF;
    UPDATE public.game_users
    SET energy = v_energy - 1, energy_date = v_today
    WHERE id = v_user.id;
    v_extra := jsonb_build_object('energy_spent', 1);
  ELSIF v_event_type = 'daily_gift' THEN
    IF v_user.daily_gift_date = v_today THEN
      v_extra := jsonb_build_object('claimed', false, 'stars_awarded', 0);
    ELSE
      v_roll := random();
      v_reward_stars := CASE
        WHEN v_roll < 0.45 THEN 2
        WHEN v_roll < 0.75 THEN 3
        WHEN v_roll < 0.95 THEN 5
        ELSE 10
      END;
      UPDATE public.game_users
      SET stars = coalesce(stars, 0) + v_reward_stars,
          total_stars_earned = coalesce(total_stars_earned, 0) + v_reward_stars,
          daily_gift_date = v_today,
          daily_gift_streak = coalesce(daily_gift_streak, 0) + 1
      WHERE id = v_user.id;
      v_extra := jsonb_build_object('claimed', true, 'stars_awarded', v_reward_stars);
    END IF;
  ELSIF v_event_type = 'quest_reward' THEN
    IF (p_event->>'quest_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
      RAISE EXCEPTION 'invalid_quest_id' USING ERRCODE = '22023';
    END IF;
    v_quest_id := (p_event->>'quest_id')::uuid;
    SELECT q.* INTO v_quest
    FROM public.game_quests AS q
    WHERE q.id = v_quest_id
      AND q.is_active IS DISTINCT FROM false
      AND (q.start_at IS NULL OR q.start_at <= now())
      AND (q.end_at IS NULL OR q.end_at > now())
      AND (
        coalesce(q.assign_type, 'all') = 'all'
        OR (q.assign_type = 'user' AND btrim(coalesce(q.assign_target, '')) = btrim(v_user.username))
        OR (q.assign_type = 'class' AND (
          btrim(regexp_replace(coalesce(q.assign_target, ''), '^Lớp[[:space:]]*', '', 'i')) = btrim(regexp_replace(coalesce(v_user.class_name, ''), '^Lớp[[:space:]]*', '', 'i'))
          OR btrim(regexp_replace(coalesce(q.assign_target, ''), '^Lớp[[:space:]]*', '', 'i')) = btrim(regexp_replace(coalesce(v_user.classlevel::text, '5'), '^Lớp[[:space:]]*', '', 'i'))
        ))
      )
      AND (q.target_classlevel IS NULL OR btrim(regexp_replace(q.target_classlevel::text, '^Lớp[[:space:]]*', '', 'i')) = btrim(regexp_replace(coalesce(v_user.classlevel::text, '5'), '^Lớp[[:space:]]*', '', 'i')))
    FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'quest_not_available' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_user_quest
    FROM public.user_quests
    WHERE user_username = v_user.username
      AND quest_id = v_quest_id
    FOR UPDATE;
    IF NOT FOUND OR v_user_quest.is_completed
       OR coalesce(v_user_quest.progress, 0) < greatest(coalesce(v_quest.target_count, 1), 1) THEN
      v_extra := jsonb_build_object('claimed', false, 'stars_awarded', 0);
    ELSE
      v_reward_stars := greatest(coalesce(v_quest.reward_stars, 0), 0);
      UPDATE public.user_quests
      SET is_completed = true
      WHERE id = v_user_quest.id;
      UPDATE public.game_users
      SET stars = coalesce(stars, 0) + v_reward_stars,
          total_stars_earned = coalesce(total_stars_earned, 0) + v_reward_stars
      WHERE id = v_user.id;
      v_extra := jsonb_build_object('claimed', true, 'stars_awarded', v_reward_stars);
    END IF;
  ELSIF v_event_type = 'lucky_spin' THEN
    IF p_event ? 'free_spin' AND jsonb_typeof(p_event->'free_spin') <> 'boolean' THEN
      RAISE EXCEPTION 'invalid_free_spin' USING ERRCODE = '22023';
    END IF;
    v_free_spin := coalesce((p_event->>'free_spin')::boolean, false);
    v_free_spin_awarded := false;
    IF v_free_spin THEN
      SELECT id INTO v_free_spin_event_id
      FROM public.student_progress_events
      WHERE auth_user_id = v_auth_user_id
        AND event_type = 'lucky_spin'
        AND consumed_at IS NULL
        AND (result->>'free_spin_awarded') = 'true'
      ORDER BY created_at, id
      LIMIT 1
      FOR UPDATE;
      IF v_free_spin_event_id IS NULL THEN
        RAISE EXCEPTION 'free_spin_not_available' USING ERRCODE = '42501';
      END IF;
      UPDATE public.student_progress_events
      SET consumed_at = now()
      WHERE id = v_free_spin_event_id;
    END IF;
    v_energy := CASE
      WHEN v_user.lucky_spin_date IS DISTINCT FROM v_today THEN 0
      ELSE coalesce(v_user.lucky_spin_count, 0)
    END;
    IF v_energy >= 3 THEN
      RAISE EXCEPTION 'lucky_spin_limit_reached' USING ERRCODE = '22023';
    END IF;
    IF NOT v_free_spin AND coalesce(v_user.stars, 0) < 2 THEN
      RAISE EXCEPTION 'not_enough_stars' USING ERRCODE = '22023';
    END IF;

    v_roll := random();
    IF v_roll < 0.001 THEN
      SELECT pi.pet_id INTO v_pet_id
      FROM public.pet_inventory AS pi
      WHERE pi.pet_id <> 'pet_dragon'
        AND pi.remaining > 0
        AND NOT EXISTS (
          SELECT 1 FROM public.user_pets AS up
          WHERE up.user_username = v_user.username
            AND up.pet_image = CASE pi.pet_id
              WHEN 'pet_1' THEN 'pet_1.png'
              WHEN 'pet_2' THEN 'pet_2.png'
              WHEN 'pet_3' THEN 'pet_3.png'
              WHEN 'pet_4' THEN 'pet_4.png'
              WHEN 'pet_5' THEN 'pet_5.png'
              WHEN 'pet_6' THEN 'pet_6.png'
              WHEN 'pet_7' THEN 'pet_7.png'
              WHEN 'pet_8' THEN 'pet_8.png'
              WHEN 'pet_9' THEN 'pet_9.png'
              WHEN 'pet_10' THEN 'pet_10.png'
              ELSE ''
            END
        )
      ORDER BY random()
      LIMIT 1
      FOR UPDATE;
      IF v_pet_id IS NOT NULL THEN
        v_pet_name := CASE v_pet_id
          WHEN 'pet_1' THEN 'Thỏ Hồng Không Gian'
          WHEN 'pet_2' THEN 'Gấu Trúc Siêu Chip'
          WHEN 'pet_3' THEN 'Ong Vệ Tinh Nhí'
          WHEN 'pet_4' THEN 'Cú Radar Tinh Anh'
          WHEN 'pet_5' THEN 'Chuột Capybara Từ Tính'
          WHEN 'pet_6' THEN 'Cún Nâu Ngân Hà'
          WHEN 'pet_7' THEN 'Gà Vàng Lõi Quang'
          WHEN 'pet_8' THEN 'Chúa Tể Plasma'
          WHEN 'pet_9' THEN 'Voi Siêu Bộ Nhớ'
          WHEN 'pet_10' THEN 'Trâu Giáp Titan'
          ELSE 'Thú cưng'
        END;
        v_pet_image := v_pet_id || '.png';
        UPDATE public.pet_inventory
        SET remaining = remaining - 1
        WHERE pet_id = v_pet_id AND remaining > 0;
        IF FOUND THEN
          INSERT INTO public.user_pets (user_username, pet_name, pet_image, rarity)
          VALUES (v_user.username, v_pet_name, v_pet_image, 'common');
          v_segment := 2;
          v_reward_code := 'pet';
          v_pet := jsonb_build_object('pet_name', v_pet_name, 'pet_image', v_pet_image, 'rarity', 'common');
        END IF;
      END IF;
    END IF;

    IF v_reward_code = 'none' THEN
      v_roll := random() * 100;
      IF v_roll < 12 THEN
        v_segment := 0; v_reward_code := 'star_1'; v_reward_stars := 1;
      ELSIF v_roll < 20 THEN
        v_segment := 1; v_reward_code := 'star_2'; v_reward_stars := 2;
      ELSIF v_roll < 33.33 THEN
        v_segment := 3; v_reward_code := 'none';
      ELSIF v_roll < 43.33 THEN
        v_segment := 4; v_reward_code := 'free_spin'; v_free_spin_awarded := true;
      ELSIF v_roll < 48.33 THEN
        v_segment := 5; v_reward_code := 'star_5'; v_reward_stars := 5;
      ELSIF v_roll < 61.66 THEN
        v_segment := 6; v_reward_code := 'none';
      ELSIF v_roll < 73.66 THEN
        v_segment := 7; v_reward_code := 'star_1'; v_reward_stars := 1;
      ELSIF v_roll < 87 THEN
        v_segment := 8; v_reward_code := 'none';
      ELSE
        v_segment := 9; v_reward_code := 'free_spin'; v_free_spin_awarded := true;
      END IF;
    END IF;

    UPDATE public.game_users
    SET stars = coalesce(stars, 0) - CASE WHEN p_event->>'free_spin' = 'true' THEN 0 ELSE 2 END + v_reward_stars,
        total_stars_earned = coalesce(total_stars_earned, 0) + v_reward_stars,
        lucky_spin_date = v_today,
        lucky_spin_count = v_energy + 1
    WHERE id = v_user.id;
    v_extra := jsonb_build_object(
      'segment', v_segment,
      'reward_code', v_reward_code,
      'stars_awarded', v_reward_stars,
      'free_spin_consumed', v_free_spin,
      'free_spin_awarded', v_free_spin_awarded,
      'pet', v_pet
    );
  END IF;

  SELECT * INTO v_user FROM public.game_users WHERE id = v_user.id;
  v_result := jsonb_build_object(
    'event_id', v_event_key,
    'event_type', v_event_type,
    'replayed', false,
    'free_spin_available', v_free_spin_awarded OR EXISTS (
      SELECT 1
      FROM public.student_progress_events
      WHERE auth_user_id = v_auth_user_id
        AND event_type = 'lucky_spin'
        AND consumed_at IS NULL
        AND (result->>'free_spin_awarded') = 'true'
    ),
    'user', jsonb_build_object(
      'id', v_user.id,
      'history', v_user.history,
      'totalscore', v_user.totalscore,
      'stars', v_user.stars,
      'total_stars_earned', v_user.total_stars_earned,
      'energy', v_user.energy,
      'energy_date', v_user.energy_date,
      'last_practice_date', v_user.last_practice_date,
      'practice_streak', v_user.practice_streak,
      'daily_gift_date', v_user.daily_gift_date,
      'daily_gift_streak', v_user.daily_gift_streak,
      'lucky_spin_date', v_user.lucky_spin_date,
      'lucky_spin_count', v_user.lucky_spin_count
    )
  ) || v_extra;

  UPDATE public.student_progress_events
  SET result = v_result
  WHERE id = v_event_id;
  RETURN v_result;
END;
$$;

-- Bỏ đường patch cũ sau khi frontend đã chuyển sang event RPC.
REVOKE ALL ON FUNCTION public.save_student_progress(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.save_student_progress(jsonb) FROM authenticated;
REVOKE ALL ON FUNCTION public.apply_student_progress_event(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_student_progress_event(jsonb) TO authenticated;

COMMENT ON FUNCTION public.apply_student_progress_event(jsonb) IS
  'Atomic, idempotent student progress events. Score range is validated here; answer-key verification is a later server-authoritative phase.';
