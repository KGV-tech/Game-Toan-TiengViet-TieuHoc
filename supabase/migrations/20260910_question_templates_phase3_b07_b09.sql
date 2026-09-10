-- Phase 3: add the approved B07 angle-measure and B09 angle-review blueprints.
-- B08 classification templates already exist and are mapped to B08 in Phase 1.
-- This migration is idempotent, never deletes legacy rows, and does not seed B05.

BEGIN;

WITH phase3_seed (name, classlevel, subject, semester, topic, lesson, question_type, generator_key, prompt_template, config) AS (
    VALUES
        (
            'Bài 7 · Đọc số đo góc trên thước đo',
            'Lớp 4', 'Toán', 'Học kỳ 1', '2. Góc và đơn vị đo góc', 'g4-math-hk1-b07',
            'Trắc nghiệm', 'g4-m-angle-measure-read', '{question}',
            '{}'::jsonb
        ),
        (
            'Bài 9 · Ôn tập góc',
            'Lớp 4', 'Toán', 'Học kỳ 1', '2. Góc và đơn vị đo góc', 'g4-math-hk1-b09',
            'Trắc nghiệm', 'g4-m-angle-review', '{question}',
            '{}'::jsonb
        )
)
INSERT INTO public.question_templates (
    name, classlevel, subject, semester, topic, lesson, question_type,
    generator_key, prompt_template, config, is_active
)
SELECT seed.name, seed.classlevel, seed.subject, seed.semester, seed.topic, seed.lesson,
       seed.question_type, seed.generator_key, seed.prompt_template, seed.config, true
FROM phase3_seed AS seed
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

COMMIT;
