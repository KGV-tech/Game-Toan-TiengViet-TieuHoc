-- Phase 2: add the approved B03, B04 and B06 authoring blueprints.
-- B05 is intentionally deferred and is not created or assigned here.
-- This migration is idempotent and does not change RLS, permissions or legacy rows.

BEGIN;

WITH phase2_seed (name, classlevel, subject, semester, topic, lesson, question_type, generator_key, prompt_template, config) AS (
    VALUES
        (
            'Bài 3 · Nhận biết số chẵn, số lẻ',
            'Lớp 4', 'Toán', 'Học kỳ 1', '1. Ôn tập và bổ sung', 'g4-math-hk1-b03',
            'Trắc nghiệm', 'number.even_odd_classify', '{question}',
            '{"minimum":0,"maximum":9999,"parities":["even","odd"]}'::jsonb
        ),
        (
            'Bài 3 · Đếm số chẵn, số lẻ trong dãy',
            'Lớp 4', 'Toán', 'Học kỳ 1', '1. Ôn tập và bổ sung', 'g4-math-hk1-b03',
            'Trắc nghiệm', 'number.even_odd_count', '{question}',
            '{"minimum":0,"maximum":9999,"listLengthMin":6,"listLengthMax":8,"parities":["even","odd"]}'::jsonb
        ),
        (
            'Bài 3 · Dãy số chẵn, số lẻ',
            'Lớp 4', 'Toán', 'Học kỳ 1', '1. Ôn tập và bổ sung', 'g4-math-hk1-b03',
            'Trắc nghiệm', 'number.even_odd_sequence', '{question}',
            '{"minimum":0,"maximum":9999,"sequenceSteps":[2,4,6],"parities":["even","odd"]}'::jsonb
        ),
        (
            'Bài 3 · Lập số chẵn, số lẻ từ thẻ số',
            'Lớp 4', 'Toán', 'Học kỳ 1', '1. Ôn tập và bổ sung', 'g4-math-hk1-b03',
            'Trắc nghiệm', 'number.even_odd_form', '{question}',
            '{"digitCount":4,"parities":["even","odd"]}'::jsonb
        ),
        (
            'Bài 4 · Tính giá trị biểu thức chứa chữ',
            'Lớp 4', 'Toán', 'Học kỳ 1', '1. Ôn tập và bổ sung', 'g4-math-hk1-b04',
            'Điền khuyết', 'number.variable_expression_value', '{question}',
            '{"variableMinimum":10,"variableMaximum":99,"constantMinimum":2,"constantMaximum":9,"operations":["add","subtract","multiply","divide"]}'::jsonb
        ),
        (
            'Bài 4 · Chọn giá trị đúng của biểu thức chứa chữ',
            'Lớp 4', 'Toán', 'Học kỳ 1', '1. Ôn tập và bổ sung', 'g4-math-hk1-b04',
            'Trắc nghiệm', 'number.variable_expression_choice', '{question}',
            '{"variableMinimum":10,"variableMaximum":99,"constantMinimum":2,"constantMaximum":9,"operations":["add","subtract","multiply","divide"]}'::jsonb
        ),
        (
            'Bài 6 · Ôn tập chung Bài 1–4',
            'Lớp 4', 'Toán', 'Học kỳ 1', '1. Ôn tập và bổ sung', 'g4-math-hk1-b06',
            'Trắc nghiệm', 'number.hk1_review_b01_b04', '{question}',
            '{"skills":["b01","b02","b03","b04"]}'::jsonb
        )
)
INSERT INTO public.question_templates (
    name, classlevel, subject, semester, topic, lesson, question_type,
    generator_key, prompt_template, config, is_active
)
SELECT seed.name, seed.classlevel, seed.subject, seed.semester, seed.topic, seed.lesson,
       seed.question_type, seed.generator_key, seed.prompt_template, seed.config, true
FROM phase2_seed AS seed
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
