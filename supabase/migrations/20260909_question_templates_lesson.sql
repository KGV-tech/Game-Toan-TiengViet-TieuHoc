-- Add the normalized lesson id used by the Admin Soạn Đề workspace.
-- This is additive: existing config, RLS policies, permissions and template
-- content remain unchanged.

ALTER TABLE public.question_templates
    ADD COLUMN IF NOT EXISTS lesson TEXT;

CREATE INDEX IF NOT EXISTS question_templates_lesson_idx
    ON public.question_templates (classlevel, subject, semester, topic, lesson)
    WHERE is_active;

-- Preserve lesson metadata that was already stored inside config JSON.
-- Templates without explicit metadata remain available through the frontend's
-- backwards-compatible inference until their lesson mapping is approved.
UPDATE public.question_templates
SET lesson = NULLIF(BTRIM(config ->> 'lesson'), '')
WHERE (lesson IS NULL OR BTRIM(lesson) = '')
  AND jsonb_typeof(config) = 'object'
  AND NULLIF(BTRIM(config ->> 'lesson'), '') IS NOT NULL;
