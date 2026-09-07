-- Optional student gender for the registration profile and teacher roster.
-- Existing accounts remain valid and keep a null value until edited.
ALTER TABLE public.game_users
  ADD COLUMN IF NOT EXISTS gender text;

ALTER TABLE public.game_users
  DROP CONSTRAINT IF EXISTS game_users_gender_check;

ALTER TABLE public.game_users
  ADD CONSTRAINT game_users_gender_check
  CHECK (gender IS NULL OR gender IN ('male', 'female', 'other'));

COMMENT ON COLUMN public.game_users.gender IS
  'Giới tính học sinh tự chọn khi đăng ký: male, female, other hoặc null';
