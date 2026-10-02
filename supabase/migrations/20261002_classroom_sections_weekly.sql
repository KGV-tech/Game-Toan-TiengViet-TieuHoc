-- Reviewed additive migration. Apply only to the explicitly approved Supabase project.
-- Classroom records are independent of game progress, stars and team_competitions.
BEGIN;
DO $$ BEGIN
  IF to_regprocedure('private.is_admin()') IS NULL
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'game_users' AND column_name = 'class_name') THEN
    RAISE EXCEPTION 'Classroom management requires existing auth helpers and game_users.class_name';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.classroom_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 160),
  classlevel text NOT NULL CHECK (classlevel ~ '^[1-5]$'),
  class_name text NOT NULL DEFAULT '',
  members text[] NOT NULL DEFAULT '{}',
  version bigint NOT NULL DEFAULT 1,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS classroom_sections_name_idx
  ON public.classroom_sections (classlevel, class_name, lower(btrim(name)));
CREATE TABLE IF NOT EXISTS public.classroom_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 160),
  classlevel text NOT NULL CHECK (classlevel ~ '^[1-5]$'),
  class_name text NOT NULL DEFAULT '',
  start_date date NOT NULL,
  end_date date NOT NULL CHECK (end_date >= start_date),
  mode text NOT NULL CHECK (mode IN ('sections', 'groups')),
  participants jsonb NOT NULL CHECK (jsonb_typeof(participants) = 'array'),
  teams jsonb NOT NULL CHECK (jsonb_typeof(teams) = 'array'),
  scores jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(scores) = 'object'),
  absences text[] NOT NULL DEFAULT '{}',
  version bigint NOT NULL DEFAULT 1,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.classroom_point_events (
  id uuid PRIMARY KEY,
  week_id uuid NOT NULL REFERENCES public.classroom_weeks(id),
  username text NOT NULL,
  delta integer NOT NULL CHECK (delta IN (-1, 1)),
  actor uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.classroom_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_point_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.classroom_sections, public.classroom_weeks, public.classroom_point_events FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.classroom_sections, public.classroom_weeks, public.classroom_point_events TO authenticated;
DROP POLICY IF EXISTS classroom_sections_admin_read ON public.classroom_sections;
CREATE POLICY classroom_sections_admin_read ON public.classroom_sections FOR SELECT TO authenticated USING ((SELECT private.is_admin()));
DROP POLICY IF EXISTS classroom_weeks_admin_read ON public.classroom_weeks;
CREATE POLICY classroom_weeks_admin_read ON public.classroom_weeks FOR SELECT TO authenticated USING ((SELECT private.is_admin()));
DROP POLICY IF EXISTS classroom_points_admin_read ON public.classroom_point_events;
CREATE POLICY classroom_points_admin_read ON public.classroom_point_events FOR SELECT TO authenticated USING ((SELECT private.is_admin()));

CREATE OR REPLACE FUNCTION public.classroom_save_section(
  p_id uuid, p_name text, p_classlevel text, p_class_name text, p_members text[], p_version bigint
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_existing public.classroom_sections; v_saved public.classroom_sections;
BEGIN
  IF NOT coalesce(private.is_admin(), false) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_id IS NULL OR p_name IS NULL OR char_length(btrim(p_name)) NOT BETWEEN 1 AND 160
     OR p_classlevel IS NULL OR p_classlevel !~ '^[1-5]$' OR p_members IS NULL THEN RAISE EXCEPTION 'invalid_members'; END IF;
  -- Serialize all membership changes: a student cannot join two concurrent sections.
  PERFORM pg_catalog.pg_advisory_xact_lock(20261002, 1);
  SELECT * INTO v_existing FROM public.classroom_sections WHERE id = p_id FOR UPDATE;
  IF FOUND AND p_version = 0 AND v_existing.created_by = auth.uid()
     AND v_existing.name = btrim(p_name) AND v_existing.classlevel = p_classlevel
     AND v_existing.class_name = coalesce(p_class_name, '') AND v_existing.members = p_members
     THEN RETURN to_jsonb(v_existing); END IF;
  IF FOUND AND v_existing.version IS DISTINCT FROM p_version THEN RAISE EXCEPTION 'section_conflict'; END IF;
  IF v_existing.id IS NULL AND coalesce(p_version, 0) <> 0 THEN RAISE EXCEPTION 'section_conflict'; END IF;
  IF cardinality(p_members) <> (SELECT count(DISTINCT m) FROM unnest(p_members) m)
     OR EXISTS (SELECT 1 FROM unnest(p_members) m WHERE NOT EXISTS (
       SELECT 1 FROM public.game_users u WHERE u.username = m AND lower(coalesce(u.role, 'student')) <> 'admin'
       AND u.approved IS NOT FALSE AND u.classlevel::text = p_classlevel
       AND coalesce(u.class_name, '') = coalesce(p_class_name, '')
     )) THEN RAISE EXCEPTION 'invalid_members'; END IF;
  IF EXISTS (SELECT 1 FROM public.classroom_sections s WHERE s.id <> p_id
     AND s.classlevel = p_classlevel AND s.class_name = coalesce(p_class_name, '') AND s.members && p_members)
     THEN RAISE EXCEPTION 'member_conflict'; END IF;
  IF EXISTS (SELECT 1 FROM public.classroom_sections s WHERE s.id <> p_id AND s.classlevel = p_classlevel
     AND s.class_name = coalesce(p_class_name, '') AND lower(btrim(s.name)) = lower(btrim(p_name)))
     THEN RAISE EXCEPTION 'duplicate_section'; END IF;
  INSERT INTO public.classroom_sections (id, name, classlevel, class_name, members)
    VALUES (p_id, btrim(p_name), p_classlevel, coalesce(p_class_name, ''), p_members)
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, classlevel = EXCLUDED.classlevel,
      class_name = EXCLUDED.class_name, members = EXCLUDED.members,
      version = public.classroom_sections.version + 1, updated_at = now()
    RETURNING * INTO v_saved;
  RETURN to_jsonb(v_saved);
END $$;

CREATE OR REPLACE FUNCTION public.classroom_delete_section(p_id uuid, p_version bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_existing public.classroom_sections;
BEGIN
  IF NOT coalesce(private.is_admin(), false) THEN RAISE EXCEPTION 'forbidden'; END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(20261002, 1);
  SELECT * INTO v_existing FROM public.classroom_sections WHERE id = p_id FOR UPDATE;
  IF NOT FOUND OR v_existing.version IS DISTINCT FROM p_version THEN RAISE EXCEPTION 'section_conflict'; END IF;
  DELETE FROM public.classroom_sections WHERE id = p_id;
  RETURN jsonb_build_object('id', p_id);
END $$;

CREATE OR REPLACE FUNCTION public.classroom_create_week(p_week jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_saved public.classroom_weeks; v_people jsonb; v_members text[]; v_team jsonb;
  v_scores jsonb := '{}'; v_absences text[] := '{}'; v_score record;
  v_assigned text[] := '{}'; v_team_ids text[] := '{}'; v_group_members text[];
BEGIN
  IF NOT coalesce(private.is_admin(), false) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF jsonb_typeof(p_week) IS DISTINCT FROM 'object' OR p_week->>'id' IS NULL
     OR p_week->>'name' IS NULL OR char_length(btrim(p_week->>'name')) NOT BETWEEN 1 AND 160
     OR p_week->>'classlevel' IS NULL OR p_week->>'classlevel' !~ '^[1-5]$'
     OR p_week->>'mode' IS NULL OR p_week->>'mode' NOT IN ('sections', 'groups')
     OR jsonb_typeof(p_week->'participants') IS DISTINCT FROM 'array'
     OR jsonb_typeof(p_week->'teams') IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_week->'participants') = 0 OR jsonb_array_length(p_week->'teams') = 0
     OR p_week->>'startDate' IS NULL OR p_week->>'endDate' IS NULL
     OR (p_week->>'startDate')::date > (p_week->>'endDate')::date THEN RAISE EXCEPTION 'invalid_week'; END IF;
  SELECT array_agg(p->>'username') INTO v_members FROM jsonb_array_elements(p_week->'participants') p;
  IF cardinality(v_members) <> (SELECT count(DISTINCT m) FROM unnest(v_members) m)
     OR EXISTS (SELECT 1 FROM unnest(v_members) m WHERE NOT EXISTS (
       SELECT 1 FROM public.game_users u WHERE u.username = m AND lower(coalesce(u.role, 'student')) <> 'admin'
         AND u.approved IS NOT FALSE AND u.classlevel::text = p_week->>'classlevel'
         AND coalesce(u.class_name, '') = coalesce(p_week->>'className', '')
     )) THEN RAISE EXCEPTION 'invalid_members'; END IF;
  -- Copy trusted names, not client-provided profile fields. Freeze this roster for the match.
  SELECT jsonb_agg(jsonb_build_object('username', u.username, 'fullname', coalesce(u.fullname, u.username)) ORDER BY u.username)
    INTO v_people FROM public.game_users u WHERE u.username = ANY(v_members);
  FOR v_team IN SELECT value FROM jsonb_array_elements(p_week->'teams') LOOP
    IF v_team->>'id' IS NULL OR v_team->>'name' IS NULL OR char_length(btrim(v_team->>'name')) NOT BETWEEN 1 AND 160
       OR v_team->>'id' = ANY(v_team_ids) OR jsonb_typeof(v_team->'members') IS DISTINCT FROM 'array'
       THEN RAISE EXCEPTION 'invalid_week'; END IF;
    SELECT coalesce(array_agg(value), '{}') INTO v_group_members FROM jsonb_array_elements_text(v_team->'members');
    IF cardinality(v_group_members) <> (SELECT count(DISTINCT m) FROM unnest(v_group_members) m)
       OR NOT v_group_members <@ v_members OR v_group_members && v_assigned THEN RAISE EXCEPTION 'invalid_week'; END IF;
    v_team_ids := array_append(v_team_ids, v_team->>'id');
    v_assigned := v_assigned || v_group_members;
  END LOOP;
  IF NOT v_members <@ v_assigned THEN RAISE EXCEPTION 'invalid_week'; END IF;
  -- Upload an offline match explicitly, retaining only its own validated points.
  IF p_week->>'localOnly' = 'true' THEN
    IF jsonb_typeof(p_week->'scores') IS DISTINCT FROM 'object' OR jsonb_typeof(p_week->'absences') IS DISTINCT FROM 'array'
      THEN RAISE EXCEPTION 'invalid_week'; END IF;
    FOR v_score IN SELECT key, value FROM jsonb_each(p_week->'scores') LOOP
      IF NOT v_score.key = ANY(v_members) OR jsonb_typeof(v_score.value) <> 'number'
         OR v_score.value::text !~ '^[0-9]{1,9}$' THEN RAISE EXCEPTION 'invalid_week'; END IF;
    END LOOP;
    v_scores := p_week->'scores';
    SELECT coalesce(array_agg(value), '{}') INTO v_absences FROM jsonb_array_elements_text(p_week->'absences');
    IF NOT v_absences <@ v_members OR cardinality(v_absences) <> (SELECT count(DISTINCT m) FROM unnest(v_absences) m)
      THEN RAISE EXCEPTION 'invalid_members'; END IF;
  END IF;
  -- One ID per form; a committed request with a lost response is safe to retry.
  PERFORM pg_catalog.pg_advisory_xact_lock(20261002, 2);
  SELECT * INTO v_saved FROM public.classroom_weeks WHERE id = (p_week->>'id')::uuid;
  IF FOUND THEN
    IF v_saved.created_by <> auth.uid() OR v_saved.name <> btrim(p_week->>'name')
       OR v_saved.classlevel <> p_week->>'classlevel' OR v_saved.class_name <> coalesce(p_week->>'className', '')
       OR v_saved.start_date <> (p_week->>'startDate')::date OR v_saved.end_date <> (p_week->>'endDate')::date
       OR v_saved.mode <> p_week->>'mode' OR v_saved.teams <> p_week->'teams'
       OR NOT (SELECT array_agg(p->>'username' ORDER BY p->>'username') FROM jsonb_array_elements(v_saved.participants) p)
         = (SELECT array_agg(m ORDER BY m) FROM unnest(v_members) m) THEN RAISE EXCEPTION 'invalid_week'; END IF;
    RETURN to_jsonb(v_saved);
  END IF;
  INSERT INTO public.classroom_weeks (id, name, classlevel, class_name, start_date, end_date, mode, participants, teams, scores, absences)
    VALUES ((p_week->>'id')::uuid, btrim(p_week->>'name'), p_week->>'classlevel', coalesce(p_week->>'className', ''),
      (p_week->>'startDate')::date, (p_week->>'endDate')::date, p_week->>'mode', v_people, p_week->'teams', v_scores, v_absences) RETURNING * INTO v_saved;
  -- New matches start empty; explicit offline uploads retain their isolated scores.
  RETURN to_jsonb(v_saved);
END $$;

CREATE OR REPLACE FUNCTION public.classroom_add_point(p_week_id uuid, p_username text, p_delta integer, p_event_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_week public.classroom_weeks; v_event public.classroom_point_events; v_score integer;
BEGIN
  IF NOT coalesce(private.is_admin(), false) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_delta IS NULL OR p_delta NOT IN (-1, 1) OR p_event_id IS NULL THEN RAISE EXCEPTION 'point_conflict'; END IF;
  SELECT * INTO v_week FROM public.classroom_weeks WHERE id = p_week_id FOR UPDATE;
  IF NOT FOUND OR NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_week.participants) p WHERE p->>'username' = p_username)
    THEN RAISE EXCEPTION 'invalid_members'; END IF;
  SELECT * INTO v_event FROM public.classroom_point_events WHERE id = p_event_id;
  IF FOUND THEN
    IF v_event.week_id <> p_week_id OR v_event.username <> p_username OR v_event.delta <> p_delta OR v_event.actor <> auth.uid()
      THEN RAISE EXCEPTION 'point_conflict'; END IF;
    RETURN to_jsonb(v_week);
  END IF;
  v_score := coalesce((v_week.scores->>p_username)::integer, 0) + p_delta;
  IF v_score < 0 THEN RAISE EXCEPTION 'point_conflict'; END IF;
  INSERT INTO public.classroom_point_events (id, week_id, username, delta) VALUES (p_event_id, p_week_id, p_username, p_delta);
  UPDATE public.classroom_weeks SET scores = jsonb_set(scores, ARRAY[p_username], to_jsonb(v_score)),
    version = version + 1, updated_at = now() WHERE id = p_week_id RETURNING * INTO v_week;
  RETURN to_jsonb(v_week);
END $$;

CREATE OR REPLACE FUNCTION public.classroom_set_absences(p_week_id uuid, p_absences text[], p_version bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_week public.classroom_weeks; v_members text[];
BEGIN
  IF NOT coalesce(private.is_admin(), false) THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO v_week FROM public.classroom_weeks WHERE id = p_week_id FOR UPDATE;
  IF NOT FOUND OR v_week.version IS DISTINCT FROM p_version THEN RAISE EXCEPTION 'point_conflict'; END IF;
  SELECT array_agg(p->>'username') INTO v_members FROM jsonb_array_elements(v_week.participants) p;
  IF p_absences IS NULL OR NOT p_absences <@ v_members
    OR cardinality(p_absences) <> (SELECT count(DISTINCT m) FROM unnest(p_absences) m) THEN RAISE EXCEPTION 'invalid_members'; END IF;
  UPDATE public.classroom_weeks SET absences = p_absences, version = version + 1, updated_at = now()
    WHERE id = p_week_id RETURNING * INTO v_week;
  RETURN to_jsonb(v_week);
END $$;

REVOKE ALL ON FUNCTION public.classroom_save_section(uuid, text, text, text, text[], bigint) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.classroom_delete_section(uuid, bigint) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.classroom_create_week(jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.classroom_add_point(uuid, text, integer, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.classroom_set_absences(uuid, text[], bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.classroom_save_section(uuid, text, text, text, text[], bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.classroom_delete_section(uuid, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.classroom_create_week(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.classroom_add_point(uuid, text, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.classroom_set_absences(uuid, text[], bigint) TO authenticated;
COMMIT;
