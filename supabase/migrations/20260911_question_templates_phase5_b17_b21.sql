-- Phase 5: seed focused B17–B21 measurement blueprints.
-- Idempotent and rollback-friendly through is_active; this migration does not
-- alter RLS, permissions, existing data, or the question_templates schema.

BEGIN;

WITH phase5_seed (name, classlevel, subject, semester, topic, lesson, question_type, generator_key, prompt_template, config) AS (
    VALUES
        (
            'Bài 17 · Đổi đơn vị khối lượng',
            'Lớp 4', 'Toán', 'Học kỳ 1', '4. Một số đơn vị đo Đại lượng', 'g4-math-hk1-b17',
            'Điền khuyết', 'measurement.mass_unit_convert', '{question}',
            '{"allowedKinds":["yenToKg","taToKg","tonToKg","yenAndKgToKg","tonAndYenToKg"]}'::jsonb
        ),
        (
            'Bài 18 · Đổi đơn vị diện tích',
            'Lớp 4', 'Toán', 'Học kỳ 1', '4. Một số đơn vị đo Đại lượng', 'g4-math-hk1-b18',
            'Điền khuyết', 'measurement.area_unit_convert', '{question}',
            '{"allowedKinds":["m2ToDm2","dm2ToCm2","dm2ToMm2","cm2ToDm2"]}'::jsonb
        ),
        (
            'Bài 19 · Đổi đơn vị thời gian',
            'Lớp 4', 'Toán', 'Học kỳ 1', '4. Một số đơn vị đo Đại lượng', 'g4-math-hk1-b19',
            'Điền khuyết', 'measurement.time_unit_convert', '{question}',
            '{"allowedKinds":["minuteToSeconds","minutesAndSecondsToSeconds"]}'::jsonb
        ),
        (
            'Bài 19 · Xác định thế kỉ',
            'Lớp 4', 'Toán', 'Học kỳ 1', '4. Một số đơn vị đo Đại lượng', 'g4-math-hk1-b19',
            'Trắc nghiệm', 'measurement.century_identification', '{question}',
            '{"centuryStart":18,"centuryEnd":21}'::jsonb
        ),
        (
            'Bài 20 · Thực hành đọc phiếu đo',
            'Lớp 4', 'Toán', 'Học kỳ 1', '4. Một số đơn vị đo Đại lượng', 'g4-math-hk1-b20',
            'Trắc nghiệm', 'measurement.practice_cards', '{question}',
            '{"allowedKinds":["mass","area","time","century"]}'::jsonb
        ),
        (
            'Bài 21 · Ôn tập đo lường Bài 17–20',
            'Lớp 4', 'Toán', 'Học kỳ 1', '4. Một số đơn vị đo Đại lượng', 'g4-math-hk1-b21',
            'Trắc nghiệm', 'measurement.hk1_review_b17_b20', '{question}',
            '{"skills":["b17","b18","b19","b20"]}'::jsonb
        ),
        (
            'Bài 21 · Bài toán và đơn vị đo',
            'Lớp 4', 'Toán', 'Học kỳ 1', '4. Một số đơn vị đo Đại lượng', 'g4-math-hk1-b21',
            'Điền khuyết', 'measurement.word_problem_units', '{question}',
            '{"scenarioKinds":["mass","area","time"]}'::jsonb
        )
)
INSERT INTO public.question_templates (
    name, classlevel, subject, semester, topic, lesson, question_type,
    generator_key, prompt_template, config, is_active
)
SELECT seed.name, seed.classlevel, seed.subject, seed.semester, seed.topic, seed.lesson,
       seed.question_type, seed.generator_key, seed.prompt_template, seed.config, true
FROM phase5_seed AS seed
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
