-- Optional class section filter for a team competition (for example, 4/4).
-- A blank value continues to mean every approved student in the selected grade.
ALTER TABLE public.team_competitions
  ADD COLUMN IF NOT EXISTS class_name text;

COMMENT ON COLUMN public.team_competitions.class_name IS
  'Lớp con được chọn cho trận thi đua; null nghĩa là toàn bộ cấp lớp';
