-- Store the class section beneath the numeric grade (for example, 4/4).
-- Keep this additive so existing profiles and grade-based filters continue to work.
ALTER TABLE public.game_users
  ADD COLUMN IF NOT EXISTS class_name text;

COMMENT ON COLUMN public.game_users.class_name IS
  'Tên lớp con dưới cấp lớp, ví dụ 4/4';
