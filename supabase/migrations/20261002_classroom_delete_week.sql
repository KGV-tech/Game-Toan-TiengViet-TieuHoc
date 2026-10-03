-- Apply only after approval for the configured Supabase project.
BEGIN;
CREATE OR REPLACE FUNCTION public.classroom_delete_week(p_id uuid, p_version bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_week public.classroom_weeks;
BEGIN
  IF NOT coalesce(private.is_admin(), false) THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO v_week FROM public.classroom_weeks WHERE id = p_id FOR UPDATE;
  IF NOT FOUND OR v_week.version IS DISTINCT FROM p_version THEN RAISE EXCEPTION 'week_conflict'; END IF;
  DELETE FROM public.classroom_point_events WHERE week_id = p_id;
  DELETE FROM public.classroom_weeks WHERE id = p_id;
  RETURN jsonb_build_object('id', p_id);
END $$;
REVOKE ALL ON FUNCTION public.classroom_delete_week(uuid, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.classroom_delete_week(uuid, bigint) TO authenticated;
COMMIT;
