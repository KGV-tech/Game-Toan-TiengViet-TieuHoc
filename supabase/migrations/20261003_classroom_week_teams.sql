-- Add week-specific Tổ/Nhóm without changing points, roster or game teams.
BEGIN;

CREATE OR REPLACE FUNCTION private.classroom_validate_week_teams(p_teams jsonb, p_members text[], p_mode text)
RETURNS void LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE v_team jsonb; v_kind text; v_people text[]; v_ids text[] := '{}';
  v_sections text[] := '{}'; v_groups text[] := '{}';
BEGIN
  IF p_mode IS NULL OR p_mode NOT IN ('sections','groups') OR p_members IS NULL
     OR jsonb_typeof(p_teams) IS DISTINCT FROM 'array' OR jsonb_array_length(p_teams) = 0
     THEN RAISE EXCEPTION 'invalid_week'; END IF;
  FOR v_team IN SELECT value FROM jsonb_array_elements(p_teams) LOOP
    v_kind := coalesce(v_team->>'kind', p_mode);
    IF jsonb_typeof(v_team) IS DISTINCT FROM 'object' OR v_kind NOT IN ('sections','groups')
       OR jsonb_typeof(v_team->'id') IS DISTINCT FROM 'string' OR char_length(v_team->>'id') NOT BETWEEN 1 AND 160
       OR v_team->>'id' = ANY(v_ids) OR jsonb_typeof(v_team->'name') IS DISTINCT FROM 'string'
       OR char_length(btrim(v_team->>'name')) NOT BETWEEN 1 AND 160
       OR jsonb_typeof(v_team->'members') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'invalid_week'; END IF;
    IF EXISTS (SELECT 1 FROM jsonb_array_elements(v_team->'members') member WHERE jsonb_typeof(member) <> 'string')
       THEN RAISE EXCEPTION 'invalid_members'; END IF;
    SELECT coalesce(array_agg(value), '{}') INTO v_people FROM jsonb_array_elements_text(v_team->'members');
    IF NOT v_people <@ p_members OR cardinality(v_people) <> (SELECT count(DISTINCT m) FROM unnest(v_people) m)
       OR (v_kind = 'sections' AND v_people && v_sections) OR (v_kind = 'groups' AND v_people && v_groups)
       THEN RAISE EXCEPTION 'invalid_members'; END IF;
    v_ids := array_append(v_ids, v_team->>'id');
    IF v_kind = 'sections' THEN v_sections := v_sections || v_people; ELSE v_groups := v_groups || v_people; END IF;
  END LOOP;
  IF (p_mode = 'sections' AND NOT p_members <@ v_sections) OR (p_mode = 'groups' AND NOT p_members <@ v_groups)
     THEN RAISE EXCEPTION 'invalid_members'; END IF;
END $$;
REVOKE ALL ON FUNCTION private.classroom_validate_week_teams(jsonb,text[],text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.classroom_set_week_teams(p_id uuid, p_kind text, p_teams jsonb, p_version bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_week public.classroom_weeks; v_members text[]; v_other jsonb; v_next jsonb;
BEGIN
  IF NOT coalesce(private.is_admin(), false) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_kind IS NULL OR p_kind NOT IN ('sections','groups') OR jsonb_typeof(p_teams) IS DISTINCT FROM 'array'
     OR EXISTS (SELECT 1 FROM jsonb_array_elements(p_teams) team WHERE team->>'kind' IS DISTINCT FROM p_kind)
     THEN RAISE EXCEPTION 'invalid_week'; END IF;
  SELECT * INTO v_week FROM public.classroom_weeks WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'invalid_week'; END IF;
  -- Retrying a committed request with a lost acknowledgement is safe.
  SELECT coalesce(jsonb_agg(team ORDER BY ord), '[]') INTO v_other
    FROM jsonb_array_elements(v_week.teams) WITH ORDINALITY AS item(team,ord)
    WHERE coalesce(team->>'kind', v_week.mode) <> p_kind;
  v_next := v_other || p_teams;
  IF v_week.teams = v_next THEN RETURN to_jsonb(v_week); END IF;
  IF v_week.version IS DISTINCT FROM p_version THEN RAISE EXCEPTION 'week_conflict'; END IF;
  SELECT array_agg(person->>'username') INTO v_members FROM jsonb_array_elements(v_week.participants) person;
  PERFORM private.classroom_validate_week_teams(v_next, v_members, v_week.mode);
  UPDATE public.classroom_weeks SET teams = v_next, version = version + 1, updated_at = now()
    WHERE id = p_id RETURNING * INTO v_week;
  RETURN to_jsonb(v_week);
END $$;
REVOKE ALL ON FUNCTION public.classroom_set_week_teams(uuid,text,jsonb,bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.classroom_set_week_teams(uuid,text,jsonb,bigint) TO authenticated;

CREATE OR REPLACE FUNCTION public.classroom_create_week(p_week jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_saved public.classroom_weeks; v_people jsonb; v_members text[];
  v_scores jsonb := '{}'; v_absences text[] := '{}'; v_score record;
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
  PERFORM private.classroom_validate_week_teams(p_week->'teams', v_members, p_week->>'mode');
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

COMMIT;
