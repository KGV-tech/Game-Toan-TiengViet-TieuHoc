-- Read-only diagnosis: no migration, no UPDATE, no secrets/student data.
SELECT id, data->'lessonReleaseByClass' AS lesson_release,
       data->'practicePass' AS practice_pass
FROM public.game_settings WHERE id = 1;

SELECT policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'game_settings';

SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'game_settings'
  AND grantee IN ('authenticated', 'anon');

SELECT count(*) AS admin_profiles,
       count(auth_user_id) AS admins_linked_to_auth
FROM public.game_users WHERE lower(coalesce(role, 'student')) = 'admin';