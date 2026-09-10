-- Phase 1 remainder: harden, split and replace the 17 active templates that
-- were intentionally left without lesson metadata.
--
-- The migration is idempotent and reversible:
-- * existing records are updated in place only when they have the audited UUID;
-- * broad/mixed records are archived with is_active = false, never deleted;
-- * operation-specific replacements use NOT EXISTS before inserting;
-- * B05 is intentionally not created or assigned.

BEGIN;

ALTER TABLE public.question_templates
    ADD COLUMN IF NOT EXISTS lesson TEXT;

CREATE INDEX IF NOT EXISTS question_templates_lesson_idx
    ON public.question_templates (classlevel, subject, semester, topic, lesson)
    WHERE is_active;

-- B11 — Hàng và lớp: restrict the three existing number-place templates to
-- six-digit values, the range evidenced by the textbook chapter.
UPDATE public.question_templates
SET lesson = 'g4-math-hk1-b11',
    config = COALESCE(config, '{}'::jsonb) || '{"minimum":100000,"maximum":999999}'::jsonb
WHERE id IN (
    '008efb59-f1e9-4fbf-bb2a-5eb3e6f4cc5e'::uuid,
    '5617107c-9fa0-4ed0-86e2-6d9206732926'::uuid
)
  AND is_active = TRUE;

UPDATE public.question_templates
SET lesson = 'g4-math-hk1-b11',
    config = COALESCE(config, '{}'::jsonb) || '{"minimum":100000,"maximum":999999,"allowedPlaces":["ones","tens","hundreds","thousands","tenThousands","hundredThousands"]}'::jsonb
WHERE id = '602aa6d9-1a22-42a8-a3c3-fc0b55e30326'::uuid
  AND is_active = TRUE;

-- B12 — Các số trong phạm vi lớp triệu: the existing 7–9 digit matching
-- configuration already targets this chapter; its generator metadata now
-- reports the same canonical topic as the database record.
UPDATE public.question_templates
SET lesson = 'g4-math-hk1-b12',
    config = COALESCE(config, '{}'::jsonb) || '{"curriculumScope":"B12"}'::jsonb
WHERE id = '7fd969fd-ddb1-4926-a5f9-94cc45e4f754'::uuid
  AND is_active = TRUE;

-- B14 — So sánh các số có nhiều chữ số: six through nine digits.
UPDATE public.question_templates
SET lesson = 'g4-math-hk1-b14',
    config = COALESCE(config, '{}'::jsonb) || '{"minimum":100000,"maximum":999999999}'::jsonb
WHERE id IN (
    '27345061-c036-42b3-9693-3196623dc95b'::uuid,
    '475cb396-a04e-40a5-9221-632612ec558b'::uuid,
    'd8203d07-f645-479e-8d20-0930ca087550'::uuid
)
  AND is_active = TRUE;

-- B15 — Làm quen với dãy số tự nhiên: keep the generator below the next
-- lớp triệu chapter while allowing zero, a natural number taught in the book.
UPDATE public.question_templates
SET lesson = 'g4-math-hk1-b15',
    config = COALESCE(config, '{}'::jsonb) || '{"minimum":0,"maximum":999999}'::jsonb
WHERE id = 'e30cc858-22e8-42fe-b63d-5118d07ade0c'::uuid
  AND is_active = TRUE;

-- B16 — Luyện tập chung: these two arithmetic templates are retained as
-- review blueprints, with an explicit skill scope and no mixed legacy range.
UPDATE public.question_templates
SET lesson = 'g4-math-hk1-b16',
    config = (COALESCE(config, '{}'::jsonb) - 'minimum' - 'maximum') || '{"minimumDigits":6,"maximumDigits":9,"scope":"review","reviewLessons":["g4-math-hk1-b10","g4-math-hk1-b11","g4-math-hk1-b12","g4-math-hk1-b13","g4-math-hk1-b14","g4-math-hk1-b15"]}'::jsonb
WHERE id IN (
    '3df20abd-182a-42be-975d-6a33bf451515'::uuid,
    '5406d38e-85a8-415f-ad7c-c028aab968fa'::uuid
)
  AND is_active = TRUE;

-- B19 — Giây, thế kỉ: keep the time-conversion template on the seconds
-- forms taught in the chapter; century identification remains a separate
-- already-mapped template.
UPDATE public.question_templates
SET lesson = 'g4-math-hk1-b19',
    config = COALESCE(config, '{}'::jsonb) || '{"allowedKinds":["minuteToSeconds","minutesAndSecondsToSeconds"]}'::jsonb
WHERE id = '2beec1a2-63fa-4caa-8c37-79b466490b35'::uuid
  AND is_active = TRUE;

-- This safe/password challenge is not an academic SGK template. Keep it for
-- possible future mini-game use, but remove it from the active authoring pool.
UPDATE public.question_templates
SET is_active = FALSE,
    updated_at = timezone('utc'::text, now())
WHERE id = 'a5f9b495-42b6-4d92-84b7-e66b347f7471'::uuid
  AND is_active = TRUE;

-- Topic 5 records mix addition and subtraction. Seed narrow B22/B23
-- variants first, then archive the five broad records below.
WITH split_seed (name, classlevel, subject, semester, topic, lesson, question_type, generator_key, prompt_template, config) AS (
    VALUES
        (
            'Bài 22 · Bài toán thực tế: phép cộng',
            'Lớp 4', 'Toán', 'Học kỳ 1', '5. Phép cộng và phép trừ', 'g4-math-hk1-b22',
            'Điền khuyết', 'g4-m-add-sub-word-problem', '{question}',
            '{"operation":"+"}'::jsonb
        ),
        (
            'Bài 23 · Bài toán thực tế: phép trừ',
            'Lớp 4', 'Toán', 'Học kỳ 1', '5. Phép cộng và phép trừ', 'g4-math-hk1-b23',
            'Điền khuyết', 'g4-m-add-sub-word-problem', '{question}',
            '{"operation":"-"}'::jsonb
        ),
        (
            'Bài 22 · Đặt tính cộng số nhiều chữ số',
            'Lớp 4', 'Toán', 'Học kỳ 1', '5. Phép cộng và phép trừ', 'g4-math-hk1-b22',
            'Điền khuyết', 'g4-m-add-sub-multi-digit', '{question}',
            '{"minimumDigits":5,"maximumDigits":6,"operation":"+"}'::jsonb
        ),
        (
            'Bài 23 · Đặt tính trừ số nhiều chữ số',
            'Lớp 4', 'Toán', 'Học kỳ 1', '5. Phép cộng và phép trừ', 'g4-math-hk1-b23',
            'Điền khuyết', 'g4-m-add-sub-multi-digit', '{question}',
            '{"minimumDigits":5,"maximumDigits":6,"operation":"-"}'::jsonb
        ),
        (
            'Bài 22 · Đúng/Sai về phép cộng',
            'Lớp 4', 'Toán', 'Học kỳ 1', '5. Phép cộng và phép trừ', 'g4-math-hk1-b22',
            'Đúng/Sai', 'g4-m-add-sub-true-false', 'Chọn Đúng/Sai?',
            '{"operation":"+"}'::jsonb
        ),
        (
            'Bài 23 · Đúng/Sai về phép trừ',
            'Lớp 4', 'Toán', 'Học kỳ 1', '5. Phép cộng và phép trừ', 'g4-math-hk1-b23',
            'Đúng/Sai', 'g4-m-add-sub-true-false', 'Chọn Đúng/Sai?',
            '{"operation":"-"}'::jsonb
        ),
        (
            'Bài 22 · Tìm chữ số còn thiếu trong phép cộng',
            'Lớp 4', 'Toán', 'Học kỳ 1', '5. Phép cộng và phép trừ', 'g4-math-hk1-b22',
            'Điền khuyết', 'g4-m-add-sub-missing-digit', '{question}',
            '{"minimumDigits":5,"maximumDigits":6,"operation":"+"}'::jsonb
        ),
        (
            'Bài 23 · Tìm chữ số còn thiếu trong phép trừ',
            'Lớp 4', 'Toán', 'Học kỳ 1', '5. Phép cộng và phép trừ', 'g4-math-hk1-b23',
            'Điền khuyết', 'g4-m-add-sub-missing-digit', '{question}',
            '{"minimumDigits":5,"maximumDigits":6,"operation":"-"}'::jsonb
        ),
        (
            'Bài 22 · Tìm thành phần chưa biết của phép cộng',
            'Lớp 4', 'Toán', 'Học kỳ 1', '5. Phép cộng và phép trừ', 'g4-math-hk1-b22',
            'Điền khuyết', 'g4-m-add-sub-missing-term', '{question}',
            '{"minimumDigits":5,"maximumDigits":6,"operation":"+"}'::jsonb
        ),
        (
            'Bài 23 · Tìm thành phần chưa biết của phép trừ',
            'Lớp 4', 'Toán', 'Học kỳ 1', '5. Phép cộng và phép trừ', 'g4-math-hk1-b23',
            'Điền khuyết', 'g4-m-add-sub-missing-term', '{question}',
            '{"minimumDigits":5,"maximumDigits":6,"operation":"-"}'::jsonb
        )
)
INSERT INTO public.question_templates (
    name, classlevel, subject, semester, topic, lesson, question_type,
    generator_key, prompt_template, config, is_active
)
SELECT seed.name, seed.classlevel, seed.subject, seed.semester, seed.topic, seed.lesson,
       seed.question_type, seed.generator_key, seed.prompt_template, seed.config, TRUE
FROM split_seed AS seed
WHERE NOT EXISTS (
    SELECT 1
    FROM public.question_templates AS existing
    WHERE existing.name = seed.name
      AND existing.classlevel = seed.classlevel
      AND existing.subject = seed.subject
      AND existing.semester = seed.semester
      AND existing.lesson = seed.lesson
      AND existing.generator_key = seed.generator_key
);

UPDATE public.question_templates
SET is_active = FALSE,
    updated_at = timezone('utc'::text, now())
WHERE id IN (
    '5a30dfbf-7cc9-4c35-9fc8-5bb64b7cd742'::uuid,
    'c9de8f63-cdab-422a-a52e-7af1001f8ab5'::uuid,
    '188eda5d-8495-4a34-87dc-62eb3544baaa'::uuid,
    '98ef2899-fc44-41ef-a600-79fff0379d21'::uuid,
    '0a62edfa-5d1a-48ef-8496-9715d6b289a0'::uuid
)
  AND is_active = TRUE;

COMMIT;

-- Post-run audit: this should return zero active templates without lesson.
SELECT count(*) AS active_templates_without_lesson
FROM public.question_templates
WHERE is_active = TRUE
  AND lesson IS NULL;

-- Expected outcome for this migration: 57 active templates, 0 B05 records,
-- 11 original records mapped/hardened, 1 academic challenge archived,
-- 5 broad Topic 5 records archived, and 10 narrow B22/B23 replacements active.
SELECT lesson, count(*) AS active_count
FROM public.question_templates
WHERE is_active = TRUE
  AND classlevel = 'Lớp 4'
  AND subject = 'Toán'
  AND semester = 'Học kỳ 1'
GROUP BY lesson
ORDER BY lesson;
