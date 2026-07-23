-- SECURITY MIGRATION: Supabase Auth + RLS. Run only after the new frontend is deployed.
-- Before running, replace :admin_auth_user_id below with the UUID of the teacher's Auth user.

ALTER TABLE public.game_users ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.game_users ALTER COLUMN password DROP NOT NULL;
ALTER TABLE public.game_users ADD COLUMN IF NOT EXISTS lucky_spin_date DATE;
ALTER TABLE public.game_users ADD COLUMN IF NOT EXISTS lucky_spin_count INT NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS game_users_auth_user_id_key ON public.game_users(auth_user_id) WHERE auth_user_id IS NOT NULL;

-- Remove legacy browser-managed passwords. Supabase Auth is the sole password authority.
UPDATE public.game_users SET password = NULL;

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.game_users
    WHERE auth_user_id = (SELECT auth.uid()) AND lower(coalesce(role, 'student')) = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION private.current_username()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT username FROM public.game_users WHERE auth_user_id = (SELECT auth.uid()) LIMIT 1;
$$;

REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.current_username() FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION private.current_username() TO authenticated;

-- Remove every old permissive policy on the game tables.
DO $$
DECLARE policy_row RECORD;
BEGIN
  FOR policy_row IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN (
      'game_users', 'game_questions', 'game_exams', 'game_settings', 'game_quests',
      'user_quests', 'candy_requests', 'user_pets', 'pet_inventory', 'user_question_history'
    )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_row.policyname, policy_row.tablename);
  END LOOP;
END $$;

ALTER TABLE public.game_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candy_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_question_history ENABLE ROW LEVEL SECURITY;

-- No anonymous browser may access data after this point.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Profiles: own profile or teacher. A new registration can only create its own student profile.
CREATE POLICY "profiles_select_own_or_teacher" ON public.game_users FOR SELECT TO authenticated
  USING (auth_user_id = (SELECT auth.uid()) OR (SELECT private.is_admin()));
CREATE POLICY "profiles_insert_own_student" ON public.game_users FOR INSERT TO authenticated
  WITH CHECK (auth_user_id = (SELECT auth.uid()) AND lower(coalesce(role, 'student')) = 'student');
CREATE POLICY "profiles_update_own_or_teacher" ON public.game_users FOR UPDATE TO authenticated
  USING (auth_user_id = (SELECT auth.uid()) OR (SELECT private.is_admin()))
  WITH CHECK (auth_user_id = (SELECT auth.uid()) OR (SELECT private.is_admin()));
CREATE POLICY "profiles_delete_teacher" ON public.game_users FOR DELETE TO authenticated
  USING ((SELECT private.is_admin()));

-- Learning content is readable only after login; teacher alone may modify it.
CREATE POLICY "questions_read_signed_in" ON public.game_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "questions_write_teacher" ON public.game_questions FOR ALL TO authenticated
  USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "exams_read_signed_in" ON public.game_exams FOR SELECT TO authenticated USING (true);
CREATE POLICY "exams_write_teacher" ON public.game_exams FOR ALL TO authenticated
  USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "settings_read_signed_in" ON public.game_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "settings_write_teacher" ON public.game_settings FOR ALL TO authenticated
  USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "quests_read_signed_in" ON public.game_quests FOR SELECT TO authenticated USING (true);
CREATE POLICY "quests_write_teacher" ON public.game_quests FOR ALL TO authenticated
  USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "inventory_read_signed_in" ON public.pet_inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "inventory_write_teacher" ON public.pet_inventory FOR ALL TO authenticated
  USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));

-- Personal learning records are isolated by the authenticated account; teacher may review all.
CREATE POLICY "seen_questions_own_or_teacher" ON public.user_question_history FOR ALL TO authenticated
  USING (user_username = (SELECT private.current_username()) OR (SELECT private.is_admin()))
  WITH CHECK (user_username = (SELECT private.current_username()) OR (SELECT private.is_admin()));
CREATE POLICY "quests_progress_own_or_teacher" ON public.user_quests FOR ALL TO authenticated
  USING (user_username = (SELECT private.current_username()) OR (SELECT private.is_admin()))
  WITH CHECK (user_username = (SELECT private.current_username()) OR (SELECT private.is_admin()));
CREATE POLICY "candy_requests_own_or_teacher" ON public.candy_requests FOR ALL TO authenticated
  USING (user_username = (SELECT private.current_username()) OR (SELECT private.is_admin()))
  WITH CHECK (user_username = (SELECT private.current_username()) OR (SELECT private.is_admin()));
CREATE POLICY "pets_own_or_teacher" ON public.user_pets FOR ALL TO authenticated
  USING (user_username = (SELECT private.current_username()) OR (SELECT private.is_admin()))
  WITH CHECK (user_username = (SELECT private.current_username()) OR (SELECT private.is_admin()));

-- Bootstrap exactly one teacher identity. Replace the parameter with the Auth UUID before execution.
-- UPDATE public.game_users SET auth_user_id = :admin_auth_user_id WHERE username = 'admin';
