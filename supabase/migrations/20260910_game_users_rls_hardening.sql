-- Bước 1: harden quyền ghi hồ sơ game_users.
-- Chạy sau supabase_auth_security.sql và sau khi frontend đã dùng RPC/Edge Function.
-- Không cho authenticated UPDATE trực tiếp game_users; service_role vẫn dùng cho
-- Edge Function quản trị, còn học sinh chỉ đi qua RPC allowlist bên dưới.

DO $$
BEGIN
  IF to_regclass('public.game_users') IS NULL THEN
    RAISE EXCEPTION 'game_users table is required before applying game_users RLS hardening';
  END IF;
  IF to_regprocedure('private.is_admin()') IS NULL THEN
    RAISE EXCEPTION 'private.is_admin() is required before applying game_users RLS hardening';
  END IF;
END $$;

ALTER TABLE public.game_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_update_own_or_teacher" ON public.game_users;
DROP POLICY IF EXISTS "profiles_update_admin_only" ON public.game_users;
CREATE POLICY "profiles_update_admin_only" ON public.game_users FOR UPDATE TO authenticated
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));

DROP POLICY IF EXISTS "profiles_insert_own_student" ON public.game_users;
CREATE POLICY "profiles_insert_own_student" ON public.game_users FOR INSERT TO authenticated
  WITH CHECK (
    auth_user_id = (SELECT auth.uid())
    AND lower(coalesce(role, 'student')) = 'student'
    AND approved IS FALSE
  );

-- A policy is row-level only. Remove the table UPDATE grant as a second,
-- independent guard; admin provisioning is performed by service_role.
REVOKE UPDATE ON public.game_users FROM authenticated;

CREATE OR REPLACE FUNCTION private.guard_game_users_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- The Edge Function uses service_role and is already authorized server-side.
  IF coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role'
     OR (SELECT private.is_admin()) THEN
    RETURN NEW;
  END IF;

  IF NEW.auth_user_id IS DISTINCT FROM (SELECT auth.uid())
     OR lower(coalesce(NEW.role, '')) <> 'student'
     OR NEW.approved IS DISTINCT FROM false
     OR coalesce(NEW.fullname, '') = ''
     OR length(btrim(NEW.fullname)) > 120
     OR coalesce(NEW.username, '') !~ '^[a-z0-9._-]{3,32}$'
     OR coalesce(NEW.totalscore, 0) <> 0
     OR coalesce(NEW.stars, 0) <> 0
     OR coalesce(NEW.total_stars_earned, 0) <> 0
     OR NEW.history IS DISTINCT FROM '[]'::jsonb THEN
    RAISE EXCEPTION 'student_profile_initial_values_invalid' USING ERRCODE = '42501';
  END IF;

  -- Legacy password is never accepted from a browser insert.
  NEW.password := NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_game_users_insert ON public.game_users;
CREATE TRIGGER guard_game_users_insert
  BEFORE INSERT ON public.game_users
  FOR EACH ROW EXECUTE FUNCTION private.guard_game_users_insert();

CREATE OR REPLACE FUNCTION public.save_student_progress(p_patch jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user public.game_users;
  v_unknown_key text;
  v_history jsonb;
  v_history_total numeric := 0;
  v_total_stars_earned integer;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_patch IS NULL OR jsonb_typeof(p_patch) <> 'object' THEN
    RAISE EXCEPTION 'invalid_progress_patch' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_user
  FROM public.game_users
  WHERE auth_user_id = (SELECT auth.uid())
    AND lower(coalesce(role, 'student')) = 'student'
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'student_profile_not_found' USING ERRCODE = '42501';
  END IF;

  SELECT key INTO v_unknown_key
  FROM jsonb_object_keys(p_patch) AS key
  WHERE key NOT IN (
    'history', 'totalscore', 'stars', 'total_stars_earned',
    'energy', 'energy_date', 'last_practice_date', 'practice_streak',
    'daily_gift_date', 'daily_gift_streak', 'lucky_spin_date', 'lucky_spin_count'
  )
  LIMIT 1;
  IF v_unknown_key IS NOT NULL THEN
    RAISE EXCEPTION 'progress_field_not_allowed: %', v_unknown_key USING ERRCODE = '42501';
  END IF;

  v_history := coalesce(p_patch->'history', coalesce(v_user.history, '[]'::jsonb));
  IF jsonb_typeof(v_history) <> 'array' OR jsonb_array_length(v_history) > 5000 THEN
    RAISE EXCEPTION 'invalid_history' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(v_history) AS item
    WHERE jsonb_typeof(item) <> 'object'
      OR coalesce(jsonb_typeof(item->'score') NOT IN ('number', 'string'), true)
      OR coalesce((item->>'score') !~ '^(10|[0-9])([.][0-9]+)?$', true)
  ) THEN
    RAISE EXCEPTION 'invalid_history_score' USING ERRCODE = '22023';
  END IF;
  SELECT coalesce(sum((item->>'score')::numeric), 0)
    INTO v_history_total
  FROM jsonb_array_elements(v_history) AS item;

  IF p_patch ? 'totalscore' THEN
    IF jsonb_typeof(p_patch->'totalscore') <> 'number'
       OR (p_patch->>'totalscore')::numeric < 0
       OR abs((p_patch->>'totalscore')::numeric - v_history_total) > 0.01 THEN
      RAISE EXCEPTION 'invalid_total_score' USING ERRCODE = '22023';
    END IF;
  END IF;
  IF p_patch ? 'stars' AND (
    jsonb_typeof(p_patch->'stars') <> 'number'
    OR (p_patch->>'stars') !~ '^[0-9]+$'
    OR CASE
      WHEN (p_patch->>'stars') ~ '^[0-9]+$' THEN (p_patch->>'stars')::numeric > 2147483647
      ELSE true
    END
  ) THEN
    RAISE EXCEPTION 'invalid_stars' USING ERRCODE = '22023';
  END IF;
  IF p_patch ? 'total_stars_earned' AND (
    jsonb_typeof(p_patch->'total_stars_earned') <> 'number'
    OR (p_patch->>'total_stars_earned') !~ '^[0-9]+$'
    OR CASE
      WHEN (p_patch->>'total_stars_earned') ~ '^[0-9]+$' THEN
        (p_patch->>'total_stars_earned')::numeric < coalesce(v_user.total_stars_earned, 0)
        OR (p_patch->>'total_stars_earned')::numeric > 2147483647
      ELSE true
    END
  ) THEN
    RAISE EXCEPTION 'total_stars_cannot_decrease' USING ERRCODE = '22023';
  END IF;
  IF p_patch ? 'energy' AND (
    jsonb_typeof(p_patch->'energy') <> 'number'
    OR (p_patch->>'energy') !~ '^[0-9]+$'
    OR CASE
      WHEN (p_patch->>'energy') ~ '^[0-9]+$' THEN (p_patch->>'energy')::numeric NOT BETWEEN 0 AND 5
      ELSE true
    END
  ) THEN
    RAISE EXCEPTION 'invalid_energy' USING ERRCODE = '22023';
  END IF;
  IF p_patch ? 'practice_streak' AND (
    jsonb_typeof(p_patch->'practice_streak') <> 'number'
    OR (p_patch->>'practice_streak') !~ '^[0-9]+$'
    OR CASE
      WHEN (p_patch->>'practice_streak') ~ '^[0-9]+$' THEN (p_patch->>'practice_streak')::numeric NOT BETWEEN 0 AND 5
      ELSE true
    END
  ) THEN
    RAISE EXCEPTION 'invalid_practice_streak' USING ERRCODE = '22023';
  END IF;
  IF p_patch ? 'daily_gift_streak' AND (
    jsonb_typeof(p_patch->'daily_gift_streak') <> 'number'
    OR (p_patch->>'daily_gift_streak') !~ '^[0-9]+$'
    OR CASE
      WHEN (p_patch->>'daily_gift_streak') ~ '^[0-9]+$' THEN (p_patch->>'daily_gift_streak')::numeric > 2147483647
      ELSE true
    END
  ) THEN
    RAISE EXCEPTION 'invalid_daily_gift_streak' USING ERRCODE = '22023';
  END IF;
  IF p_patch ? 'lucky_spin_count' AND (
    jsonb_typeof(p_patch->'lucky_spin_count') <> 'number'
    OR (p_patch->>'lucky_spin_count') !~ '^[0-9]+$'
    OR CASE
      WHEN (p_patch->>'lucky_spin_count') ~ '^[0-9]+$' THEN (p_patch->>'lucky_spin_count')::numeric NOT BETWEEN 0 AND 100
      ELSE true
    END
  ) THEN
    RAISE EXCEPTION 'invalid_lucky_spin_count' USING ERRCODE = '22023';
  END IF;

  v_total_stars_earned := CASE
    WHEN p_patch ? 'total_stars_earned' THEN (p_patch->>'total_stars_earned')::integer
    ELSE v_user.total_stars_earned
  END;

  UPDATE public.game_users
  SET
    history = CASE WHEN p_patch ? 'history' THEN p_patch->'history' ELSE history END,
    totalscore = CASE
      WHEN p_patch ? 'history' THEN v_history_total
      WHEN p_patch ? 'totalscore' THEN (p_patch->>'totalscore')::numeric
      ELSE totalscore
    END,
    stars = CASE WHEN p_patch ? 'stars' THEN (p_patch->>'stars')::integer ELSE stars END,
    total_stars_earned = CASE WHEN p_patch ? 'total_stars_earned' THEN v_total_stars_earned ELSE total_stars_earned END,
    energy = CASE WHEN p_patch ? 'energy' THEN (p_patch->>'energy')::integer ELSE energy END,
    energy_date = CASE WHEN p_patch ? 'energy_date' THEN (p_patch->>'energy_date')::date ELSE energy_date END,
    last_practice_date = CASE WHEN p_patch ? 'last_practice_date' THEN (p_patch->>'last_practice_date')::date ELSE last_practice_date END,
    practice_streak = CASE WHEN p_patch ? 'practice_streak' THEN (p_patch->>'practice_streak')::integer ELSE practice_streak END,
    daily_gift_date = CASE WHEN p_patch ? 'daily_gift_date' THEN (p_patch->>'daily_gift_date')::date ELSE daily_gift_date END,
    daily_gift_streak = CASE WHEN p_patch ? 'daily_gift_streak' THEN (p_patch->>'daily_gift_streak')::integer ELSE daily_gift_streak END,
    lucky_spin_date = CASE WHEN p_patch ? 'lucky_spin_date' THEN (p_patch->>'lucky_spin_date')::date ELSE lucky_spin_date END,
    lucky_spin_count = CASE WHEN p_patch ? 'lucky_spin_count' THEN (p_patch->>'lucky_spin_count')::integer ELSE lucky_spin_count END
  WHERE id = v_user.id;
  SELECT * INTO v_user FROM public.game_users WHERE id = v_user.id;

  RETURN jsonb_build_object(
    'id', v_user.id,
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
  );
END;
$$;

REVOKE ALL ON FUNCTION public.save_student_progress(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_student_progress(jsonb) TO authenticated;

COMMENT ON FUNCTION public.save_student_progress(jsonb) IS
  'Allowlisted student progress write. Score/reward calculation remains a follow-up server-authoritative hardening step.';
