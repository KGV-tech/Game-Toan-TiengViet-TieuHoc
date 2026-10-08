-- Giao/nộp/chấm Phiếu tự do, độc lập hoàn toàn với đề kiểm tra và điểm game.
BEGIN;
CREATE TABLE IF NOT EXISTS public.worksheet_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worksheet_id text NOT NULL,
  student_username text NOT NULL REFERENCES public.game_users(username),
  assigned_by uuid NOT NULL REFERENCES auth.users(id),
  title text NOT NULL,
  document jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.worksheet_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL UNIQUE REFERENCES public.worksheet_assignments(id) ON DELETE CASCADE,
  student_username text NOT NULL REFERENCES public.game_users(username),
  answers jsonb NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  score numeric CHECK (score >= 0 AND score <= 10),
  feedback text NOT NULL DEFAULT '',
  graded_at timestamptz,
  graded_by uuid REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS worksheet_assignment_student_idx ON public.worksheet_assignments(student_username, created_at DESC);
ALTER TABLE public.worksheet_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worksheet_submissions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.worksheet_assignments, public.worksheet_submissions FROM anon, authenticated;
GRANT SELECT ON public.worksheet_assignments, public.worksheet_submissions TO authenticated;
DROP POLICY IF EXISTS worksheet_assignment_read ON public.worksheet_assignments;
CREATE POLICY worksheet_assignment_read ON public.worksheet_assignments FOR SELECT TO authenticated
  USING (student_username = (SELECT private.current_username()) OR (SELECT private.is_admin()));
DROP POLICY IF EXISTS worksheet_submission_read ON public.worksheet_submissions;
CREATE POLICY worksheet_submission_read ON public.worksheet_submissions FOR SELECT TO authenticated
  USING (student_username = (SELECT private.current_username()) OR (SELECT private.is_admin()));

CREATE OR REPLACE FUNCTION public.assign_freeform_worksheet(p_worksheet_id text, p_students text[], p_document jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE clean jsonb := p_document; p integer; b integer; i integer; affected integer;
BEGIN
  IF auth.uid() IS NULL OR NOT private.is_admin() THEN RAISE EXCEPTION 'teacher_required' USING ERRCODE='42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.game_worksheets WHERE id::text = p_worksheet_id) THEN RAISE EXCEPTION 'worksheet_not_found'; END IF;
  IF p_students IS NULL OR cardinality(p_students) NOT BETWEEN 1 AND 300
     OR jsonb_typeof(clean->'pages') IS DISTINCT FROM 'array'
     OR octet_length(clean::text) > 1000000 THEN RAISE EXCEPTION 'invalid_assignment'; END IF;
  IF EXISTS (SELECT 1 FROM unnest(p_students) student WHERE NOT EXISTS (
    SELECT 1 FROM public.game_users u WHERE u.username = student AND lower(u.role) = 'student' AND u.approved IS TRUE
  )) THEN RAISE EXCEPTION 'invalid_student'; END IF;
  clean := clean - 'warnings';
  -- Tuyệt đối không đưa đáp án nội bộ vào bản giao cho học sinh.
  FOR p IN 0..jsonb_array_length(clean->'pages')-1 LOOP
    clean := jsonb_set(clean, ARRAY['pages',p::text], (clean->'pages'->p) - 'source');
    IF jsonb_typeof(clean->'pages'->p->'blocks') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'invalid_blocks'; END IF;
    FOR b IN 0..jsonb_array_length(clean->'pages'->p->'blocks')-1 LOOP
      clean := jsonb_set(clean, ARRAY['pages',p::text,'blocks',b::text], (clean->'pages'->p->'blocks'->b) - 'answer' - 'review');
      IF jsonb_typeof(clean->'pages'->p->'blocks'->b->'parts') = 'array' THEN
        FOR i IN 0..jsonb_array_length(clean->'pages'->p->'blocks'->b->'parts')-1 LOOP
          clean := jsonb_set(clean, ARRAY['pages',p::text,'blocks',b::text,'parts',i::text], (clean->'pages'->p->'blocks'->b->'parts'->i) - 'answer');
        END LOOP;
      END IF;
    END LOOP;
  END LOOP;
  INSERT INTO public.worksheet_assignments (worksheet_id, student_username, assigned_by, title, document)
    SELECT p_worksheet_id, student, auth.uid(), left(coalesce(clean->>'title','Phiếu học tập'),500), clean FROM (SELECT DISTINCT unnest(p_students) AS student) targets;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END $$;

CREATE OR REPLACE FUNCTION public.submit_freeform_worksheet(p_assignment_id uuid, p_answers jsonb)
RETURNS public.worksheet_submissions LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE assignment public.worksheet_assignments; result public.worksheet_submissions; username_value text;
BEGIN
  username_value := private.current_username();
  IF auth.uid() IS NULL OR username_value IS NULL OR private.is_admin() THEN RAISE EXCEPTION 'student_required' USING ERRCODE='42501'; END IF;
  SELECT * INTO assignment FROM public.worksheet_assignments WHERE id = p_assignment_id FOR UPDATE;
  IF NOT FOUND OR assignment.student_username IS DISTINCT FROM username_value THEN RAISE EXCEPTION 'assignment_not_owned' USING ERRCODE='42501'; END IF;
  IF jsonb_typeof(p_answers) IS DISTINCT FROM 'object' OR octet_length(p_answers::text) > 2000000 THEN RAISE EXCEPTION 'invalid_answers'; END IF;
  INSERT INTO public.worksheet_submissions (assignment_id, student_username, answers)
    VALUES (p_assignment_id, username_value, p_answers) ON CONFLICT (assignment_id) DO NOTHING;
  SELECT * INTO result FROM public.worksheet_submissions WHERE assignment_id = p_assignment_id;
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.grade_freeform_worksheet(p_submission_id uuid, p_score numeric, p_feedback text)
RETURNS public.worksheet_submissions LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE result public.worksheet_submissions;
BEGIN
  IF auth.uid() IS NULL OR NOT private.is_admin() THEN RAISE EXCEPTION 'teacher_required' USING ERRCODE='42501'; END IF;
  IF p_score IS NULL OR p_score < 0 OR p_score > 10 OR length(coalesce(p_feedback,'')) > 10000 THEN RAISE EXCEPTION 'invalid_grade'; END IF;
  UPDATE public.worksheet_submissions SET score=p_score, feedback=coalesce(p_feedback,''), graded_at=now(), graded_by=auth.uid()
    WHERE id=p_submission_id RETURNING * INTO result;
  IF NOT FOUND THEN RAISE EXCEPTION 'submission_not_found'; END IF;
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.assign_freeform_worksheet(text,text[],jsonb), public.submit_freeform_worksheet(uuid,jsonb), public.grade_freeform_worksheet(uuid,numeric,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_freeform_worksheet(text,text[],jsonb), public.submit_freeform_worksheet(uuid,jsonb), public.grade_freeform_worksheet(uuid,numeric,text) TO authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
