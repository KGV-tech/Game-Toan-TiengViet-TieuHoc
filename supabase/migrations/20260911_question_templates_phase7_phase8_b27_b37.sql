-- Phase 7–8: seed focused B27–B37 blueprints for the Grade 4 HK1 roadmap.
-- Idempotent and additive; existing active curriculum rows remain untouched.

BEGIN;

WITH phase7_phase8_seed (name, classlevel, subject, semester, topic, lesson,
                         question_type, generator_key, prompt_template, config) AS (
    VALUES
        (
            'Bài 27 · Nhận biết hai đường thẳng vuông góc',
            'Lớp 4', 'Toán', 'Học kỳ 1', '6. Đường thẳng vuông góc. Đường thẳng song song',
            'g4-math-hk1-b27', 'Trắc nghiệm', 'g4-m-perpendicular-identify',
            '{question}', '{}'::jsonb
        ),
        (
            'Bài 28 · Thực hành đường thẳng vuông góc',
            'Lớp 4', 'Toán', 'Học kỳ 1', '6. Đường thẳng vuông góc. Đường thẳng song song',
            'g4-math-hk1-b28', 'Trắc nghiệm', 'g4-m-perpendicular-grid-practice',
            '{question}', '{}'::jsonb
        ),
        (
            'Bài 29 · Nhận biết hai đường thẳng song song',
            'Lớp 4', 'Toán', 'Học kỳ 1', '6. Đường thẳng vuông góc. Đường thẳng song song',
            'g4-math-hk1-b29', 'Trắc nghiệm', 'g4-m-parallel-identify',
            '{question}', '{}'::jsonb
        ),
        (
            'Bài 30 · Thực hành đường thẳng song song',
            'Lớp 4', 'Toán', 'Học kỳ 1', '6. Đường thẳng vuông góc. Đường thẳng song song',
            'g4-math-hk1-b30', 'Trắc nghiệm', 'g4-m-parallel-grid-practice',
            '{question}', '{}'::jsonb
        ),
        (
            'Bài 31 · Nhận biết hình bình hành và hình thoi',
            'Lớp 4', 'Toán', 'Học kỳ 1', '6. Đường thẳng vuông góc. Đường thẳng song song',
            'g4-math-hk1-b31', 'Trắc nghiệm', 'g4-m-quad-classify',
            '{question}', '{"allowedShapes":["parallelogram","rhombus","rectangle","trapezoid"]}'::jsonb
        ),
        (
            'Bài 32 · Ôn tập hình học',
            'Lớp 4', 'Toán', 'Học kỳ 1', '6. Đường thẳng vuông góc. Đường thẳng song song',
            'g4-math-hk1-b32', 'Trắc nghiệm', 'geometry.hk1_review_b27_b31',
            '{question}', '{"skills":["b27","b28","b29","b31"]}'::jsonb
        ),
        (
            'Bài 33 · Ôn tập các số đến lớp triệu',
            'Lớp 4', 'Toán', 'Học kỳ 1', '7. Ôn tập Học kì 1',
            'g4-math-hk1-b33', 'Trắc nghiệm', 'number.hk1_review_b33_numbers',
            '{question}', '{"skills":["b10","b11","b12","b13"]}'::jsonb
        ),
        (
            'Bài 34 · Ôn tập phép cộng, phép trừ',
            'Lớp 4', 'Toán', 'Học kỳ 1', '7. Ôn tập Học kì 1',
            'g4-math-hk1-b34', 'Trắc nghiệm', 'number.hk1_review_b34_add_sub',
            '{question}', '{"skills":["b22","b23","b24","b25"]}'::jsonb
        ),
        (
            'Bài 35 · Ôn tập hình học',
            'Lớp 4', 'Toán', 'Học kỳ 1', '7. Ôn tập Học kì 1',
            'g4-math-hk1-b35', 'Trắc nghiệm', 'geometry.hk1_review_b35',
            '{question}', '{"skills":["b27","b28","b29","b30"]}'::jsonb
        ),
        (
            'Bài 36 · Ôn tập đo lường',
            'Lớp 4', 'Toán', 'Học kỳ 1', '7. Ôn tập Học kì 1',
            'g4-math-hk1-b36', 'Trắc nghiệm', 'measurement.hk1_review_b36',
            '{question}', '{"skills":["b17","b18","b19","b20"]}'::jsonb
        ),
        (
            'Bài 37 · Ôn tập chung Học kỳ 1',
            'Lớp 4', 'Toán', 'Học kỳ 1', '7. Ôn tập Học kì 1',
            'g4-math-hk1-b37', 'Trắc nghiệm', 'number.hk1_review_b37_full',
            '{question}', '{"groups":["numbers","addSub","geometry","measurement"]}'::jsonb
        )
)
INSERT INTO public.question_templates (
    name, classlevel, subject, semester, topic, lesson, question_type,
    generator_key, prompt_template, config, is_active
)
SELECT seed.name, seed.classlevel, seed.subject, seed.semester, seed.topic,
       seed.lesson, seed.question_type, seed.generator_key,
       seed.prompt_template, seed.config, TRUE
FROM phase7_phase8_seed AS seed
WHERE NOT EXISTS (
    SELECT 1
    FROM public.question_templates AS existing
    WHERE existing.name = seed.name
      AND existing.classlevel = seed.classlevel
      AND existing.subject = seed.subject
      AND existing.semester = seed.semester
      AND existing.topic = seed.topic
      AND existing.lesson = seed.lesson
      AND existing.generator_key = seed.generator_key
      AND existing.is_active = TRUE
);

COMMIT;

-- Post-run audit: every B27–B37 blueprint must carry one canonical lesson.
SELECT lesson, count(*) AS active_count
FROM public.question_templates
WHERE is_active = TRUE
  AND classlevel = 'Lớp 4'
  AND subject = 'Toán'
  AND semester = 'Học kỳ 1'
  AND lesson IN (
      'g4-math-hk1-b27', 'g4-math-hk1-b28', 'g4-math-hk1-b29',
      'g4-math-hk1-b30', 'g4-math-hk1-b31', 'g4-math-hk1-b32',
      'g4-math-hk1-b33', 'g4-math-hk1-b34', 'g4-math-hk1-b35',
      'g4-math-hk1-b36', 'g4-math-hk1-b37'
  )
GROUP BY lesson
ORDER BY lesson;
