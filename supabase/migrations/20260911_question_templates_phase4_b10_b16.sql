-- Phase 4: seed focused B10–B16 blueprints.
-- Idempotent, soft-rollback friendly, and deliberately does not change RLS or delete legacy rows.

BEGIN;

WITH phase4_seed (name, classlevel, subject, semester, topic, lesson, question_type, generator_key, prompt_template, config) AS (
    VALUES
        (
            'Bài 10 · Lập và đọc số sáu chữ số',
            'Lớp 4', 'Toán', 'Học kỳ 1', '3. Số có nhiều chữ số', 'g4-math-hk1-b10',
            'Trắc nghiệm', 'number.six_digit_numbers', '{question}',
            '{"minimum":100000,"maximum":999999,"modes":["compose","read","million","digit"]}'::jsonb
        ),
        (
            'Bài 11 · Nhận biết hàng và lớp',
            'Lớp 4', 'Toán', 'Học kỳ 1', '3. Số có nhiều chữ số', 'g4-math-hk1-b11',
            'Trắc nghiệm', 'number.digit_at_place', '{question}',
            '{"minimum":100000,"maximum":999999,"minimumDigits":6,"maximumDigits":6,"allowedPlaces":["hundredThousands","tenThousands","thousands","hundreds","tens","ones"],"allowedDigits":[1,2,3,4,5,6,7,8,9]}'::jsonb
        ),
        (
            'Bài 12 · Các số trong phạm vi lớp triệu',
            'Lớp 4', 'Toán', 'Học kỳ 1', '3. Số có nhiều chữ số', 'g4-math-hk1-b12',
            'Trắc nghiệm', 'number.million_class', '{question}',
            '{"minimum":1000000,"maximum":999999999,"modes":["read","write","digit","expanded"],"includeZeroGroups":true}'::jsonb
        ),
        (
            'Bài 13 · Làm tròn đến hàng trăm nghìn',
            'Lớp 4', 'Toán', 'Học kỳ 1', '3. Số có nhiều chữ số', 'g4-math-hk1-b13',
            'Trắc nghiệm', 'number.round_hundred_thousands', '{question}',
            '{"minimum":100000,"maximum":999999999,"modes":["round","round","round","rule"]}'::jsonb
        ),
        (
            'Bài 14 · So sánh số nhiều chữ số',
            'Lớp 4', 'Toán', 'Học kỳ 1', '3. Số có nhiều chữ số', 'g4-math-hk1-b14',
            'So sánh', 'number.compare_number_forms', '{question}',
            '{"minimum":100000,"maximum":999999999}'::jsonb
        ),
        (
            'Bài 15 · Dãy số tự nhiên',
            'Lớp 4', 'Toán', 'Học kỳ 1', '3. Số có nhiều chữ số', 'g4-math-hk1-b15',
            'Chuỗi Quy luật', 'number.natural_sequence', '{question}',
            '{"minimum":0,"maximum":999999,"allowedSteps":[1,2,5,10,100,1000,10000],"sequenceLengthMin":5,"sequenceLengthMax":7,"blankCountMin":2,"blankCountMax":3}'::jsonb
        ),
        (
            'Bài 16 · Ôn tập số nhiều chữ số · Nền tảng',
            'Lớp 4', 'Toán', 'Học kỳ 1', '3. Số có nhiều chữ số', 'g4-math-hk1-b16',
            'Trắc nghiệm', 'number.hk1_review_b10_b15', '{question}',
            '{"skills":["b10","b11","b12","b13"]}'::jsonb
        ),
        (
            'Bài 16 · Ôn tập số nhiều chữ số · So sánh và dãy số',
            'Lớp 4', 'Toán', 'Học kỳ 1', '3. Số có nhiều chữ số', 'g4-math-hk1-b16',
            'Trắc nghiệm', 'number.hk1_review_b10_b15', '{question}',
            '{"skills":["b14","b15","b10","b13"]}'::jsonb
        )
)
INSERT INTO public.question_templates (
    name, classlevel, subject, semester, topic, lesson, question_type,
    generator_key, prompt_template, config, is_active
)
SELECT seed.name, seed.classlevel, seed.subject, seed.semester, seed.topic, seed.lesson,
       seed.question_type, seed.generator_key, seed.prompt_template, seed.config, true
FROM phase4_seed AS seed
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
