-- HK1 semantic review alignment.
-- This migration is additive/idempotent and is not executed automatically by Codex.
-- It only updates Grade 4 HK1 template metadata/configuration; HK2 is untouched.

BEGIN;

UPDATE public.question_templates
SET lesson = 'g4-math-hk1-b12',
    name = CASE
        WHEN name ILIKE '%Bài 11%' THEN replace(name, 'Bài 11', 'Bài 12')
        ELSE name
    END,
    updated_at = timezone('utc'::text, now())
WHERE is_active = TRUE
  AND classlevel = 'Lớp 4'
  AND subject = 'Toán'
  AND semester = 'Học kỳ 1'
  AND generator_key = 'number.safe_password_by_place_value';

UPDATE public.question_templates
SET config = COALESCE(config, '{}'::jsonb) || '{"skills":["b01","b02","b03","b04","b05"],"reviewMode":"mixed"}'::jsonb,
    updated_at = timezone('utc'::text, now())
WHERE is_active = TRUE AND classlevel = 'Lớp 4' AND subject = 'Toán' AND semester = 'Học kỳ 1'
  AND generator_key = 'number.hk1_review_b01_b04';

UPDATE public.question_templates
SET config = COALESCE(config, '{}'::jsonb) || '{"skills":["b10","b11","b12","b13","b14","b15"],"reviewMode":"mixed"}'::jsonb,
    updated_at = timezone('utc'::text, now())
WHERE is_active = TRUE AND classlevel = 'Lớp 4' AND subject = 'Toán' AND semester = 'Học kỳ 1'
  AND generator_key = 'number.hk1_review_b10_b15';

UPDATE public.question_templates
SET config = COALESCE(config, '{}'::jsonb) || '{"skills":["b17","b18","b19","b20"],"reviewMode":"mixed"}'::jsonb,
    updated_at = timezone('utc'::text, now())
WHERE is_active = TRUE AND classlevel = 'Lớp 4' AND subject = 'Toán' AND semester = 'Học kỳ 1'
  AND generator_key = 'measurement.hk1_review_b17_b20';

UPDATE public.question_templates
SET config = COALESCE(config, '{}'::jsonb) || '{"skills":["b22","b23","b24","b25"],"reviewMode":"mixed"}'::jsonb,
    updated_at = timezone('utc'::text, now())
WHERE is_active = TRUE AND classlevel = 'Lớp 4' AND subject = 'Toán' AND semester = 'Học kỳ 1'
  AND generator_key = 'number.hk1_review_b22_b25';

UPDATE public.question_templates
SET config = COALESCE(config, '{}'::jsonb) || '{"skills":["b27","b28","b29","b30","b31"],"reviewMode":"mixed"}'::jsonb,
    updated_at = timezone('utc'::text, now())
WHERE is_active = TRUE AND classlevel = 'Lớp 4' AND subject = 'Toán' AND semester = 'Học kỳ 1'
  AND generator_key = 'geometry.hk1_review_b27_b31';

UPDATE public.question_templates
SET config = COALESCE(config, '{}'::jsonb) || '{"skills":["b10","b11","b12","b13","b14","b15"],"reviewMode":"mixed"}'::jsonb,
    updated_at = timezone('utc'::text, now())
WHERE is_active = TRUE AND classlevel = 'Lớp 4' AND subject = 'Toán' AND semester = 'Học kỳ 1'
  AND generator_key = 'number.hk1_review_b33_numbers';

UPDATE public.question_templates
SET config = COALESCE(config, '{}'::jsonb) || '{"skills":["b22","b23","b24","b25"],"reviewMode":"mixed"}'::jsonb,
    updated_at = timezone('utc'::text, now())
WHERE is_active = TRUE AND classlevel = 'Lớp 4' AND subject = 'Toán' AND semester = 'Học kỳ 1'
  AND generator_key = 'number.hk1_review_b34_add_sub';

UPDATE public.question_templates
SET config = COALESCE(config, '{}'::jsonb) || '{"skills":["b07","b08","b09","b27","b28","b29","b30","b31"],"reviewMode":"mixed"}'::jsonb,
    updated_at = timezone('utc'::text, now())
WHERE is_active = TRUE AND classlevel = 'Lớp 4' AND subject = 'Toán' AND semester = 'Học kỳ 1'
  AND generator_key = 'geometry.hk1_review_b35';

UPDATE public.question_templates
SET config = COALESCE(config, '{}'::jsonb) || '{"skills":["b17","b18","b19","b20"],"reviewMode":"mixed"}'::jsonb,
    updated_at = timezone('utc'::text, now())
WHERE is_active = TRUE AND classlevel = 'Lớp 4' AND subject = 'Toán' AND semester = 'Học kỳ 1'
  AND generator_key = 'measurement.hk1_review_b36';

UPDATE public.question_templates
SET config = COALESCE(config, '{}'::jsonb) || '{"groups":["numbers","addSub","multiplicationDivision","geometry","measurement","statistics","probability","wordProblem"],"reviewMode":"mixed"}'::jsonb,
    updated_at = timezone('utc'::text, now())
WHERE is_active = TRUE AND classlevel = 'Lớp 4' AND subject = 'Toán' AND semester = 'Học kỳ 1'
  AND generator_key = 'number.hk1_review_b37_full';

COMMIT;

-- Post-run audit: safe-password belongs to B12 and every HK1 review is mixed.
SELECT generator_key, lesson, config->>'reviewMode' AS review_mode
FROM public.question_templates
WHERE is_active = TRUE
  AND classlevel = 'Lớp 4'
  AND subject = 'Toán'
  AND semester = 'Học kỳ 1'
  AND (generator_key = 'number.safe_password_by_place_value' OR generator_key LIKE '%hk1_review%')
ORDER BY generator_key, lesson;
