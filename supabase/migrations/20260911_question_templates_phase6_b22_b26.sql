-- Phase 6: Bài 22–26 — phép cộng, phép trừ và ôn tập chung.
--
-- The seed is intentionally additive and idempotent. Existing active
-- templates with the same curriculum identity are preserved; archived rows
-- do not prevent a current active blueprint from being restored.

BEGIN;

WITH phase6_seed (name, classlevel, subject, semester, topic, lesson,
                  question_type, generator_key, prompt_template, config) AS (
    VALUES
        (
            'Bài 22 · Bài toán thực tế: phép cộng',
            'Lớp 4', 'Toán', 'Học kỳ 1', '5. Phép cộng và phép trừ',
            'g4-math-hk1-b22', 'Điền khuyết', 'g4-m-add-sub-word-problem',
            '{question}', '{"operation":"+"}'::jsonb
        ),
        (
            'Bài 23 · Bài toán thực tế: phép trừ',
            'Lớp 4', 'Toán', 'Học kỳ 1', '5. Phép cộng và phép trừ',
            'g4-math-hk1-b23', 'Điền khuyết', 'g4-m-add-sub-word-problem',
            '{question}', '{"operation":"-"}'::jsonb
        ),
        (
            'Bài 22 · Đặt tính cộng số nhiều chữ số',
            'Lớp 4', 'Toán', 'Học kỳ 1', '5. Phép cộng và phép trừ',
            'g4-math-hk1-b22', 'Điền khuyết', 'g4-m-add-sub-multi-digit',
            '{question}', '{"minimumDigits":5,"maximumDigits":6,"operation":"+"}'::jsonb
        ),
        (
            'Bài 23 · Đặt tính trừ số nhiều chữ số',
            'Lớp 4', 'Toán', 'Học kỳ 1', '5. Phép cộng và phép trừ',
            'g4-math-hk1-b23', 'Điền khuyết', 'g4-m-add-sub-multi-digit',
            '{question}', '{"minimumDigits":5,"maximumDigits":6,"operation":"-"}'::jsonb
        ),
        (
            'Bài 22 · Đúng/Sai về phép cộng',
            'Lớp 4', 'Toán', 'Học kỳ 1', '5. Phép cộng và phép trừ',
            'g4-math-hk1-b22', 'Đúng/Sai', 'g4-m-add-sub-true-false',
            'Chọn Đúng/Sai?', '{"operation":"+"}'::jsonb
        ),
        (
            'Bài 23 · Đúng/Sai về phép trừ',
            'Lớp 4', 'Toán', 'Học kỳ 1', '5. Phép cộng và phép trừ',
            'g4-math-hk1-b23', 'Đúng/Sai', 'g4-m-add-sub-true-false',
            'Chọn Đúng/Sai?', '{"operation":"-"}'::jsonb
        ),
        (
            'Bài 22 · Tìm chữ số còn thiếu trong phép cộng',
            'Lớp 4', 'Toán', 'Học kỳ 1', '5. Phép cộng và phép trừ',
            'g4-math-hk1-b22', 'Điền khuyết', 'g4-m-add-sub-missing-digit',
            '{question}', '{"minimumDigits":5,"maximumDigits":6,"operation":"+"}'::jsonb
        ),
        (
            'Bài 23 · Tìm chữ số còn thiếu trong phép trừ',
            'Lớp 4', 'Toán', 'Học kỳ 1', '5. Phép cộng và phép trừ',
            'g4-math-hk1-b23', 'Điền khuyết', 'g4-m-add-sub-missing-digit',
            '{question}', '{"minimumDigits":5,"maximumDigits":6,"operation":"-"}'::jsonb
        ),
        (
            'Bài 22 · Tìm thành phần chưa biết của phép cộng',
            'Lớp 4', 'Toán', 'Học kỳ 1', '5. Phép cộng và phép trừ',
            'g4-math-hk1-b22', 'Điền khuyết', 'g4-m-add-sub-missing-term',
            '{question}', '{"minimumDigits":5,"maximumDigits":6,"operation":"+"}'::jsonb
        ),
        (
            'Bài 23 · Tìm thành phần chưa biết của phép trừ',
            'Lớp 4', 'Toán', 'Học kỳ 1', '5. Phép cộng và phép trừ',
            'g4-math-hk1-b23', 'Điền khuyết', 'g4-m-add-sub-missing-term',
            '{question}', '{"minimumDigits":5,"maximumDigits":6,"operation":"-"}'::jsonb
        ),
        (
            'Bài 24 · Tính chất của phép cộng',
            'Lớp 4', 'Toán', 'Học kỳ 1', '5. Phép cộng và phép trừ',
            'g4-math-hk1-b24', 'Điền khuyết', 'g4-m-addition-property-fill',
            '{question}', '{"properties":["commutative","associative"]}'::jsonb
        ),
        (
            'Bài 25 · Tìm hai số biết tổng và hiệu',
            'Lớp 4', 'Toán', 'Học kỳ 1', '5. Phép cộng và phép trừ',
            'g4-math-hk1-b25', 'Điền khuyết', 'g4-m-sum-difference-direct',
            '{question}', '{}'::jsonb
        ),
        (
            'Bài 25 · Tìm hai số qua bài toán thực tế',
            'Lớp 4', 'Toán', 'Học kỳ 1', '5. Phép cộng và phép trừ',
            'g4-math-hk1-b25', 'Điền khuyết', 'g4-m-sum-difference-context',
            '{question}', '{}'::jsonb
        ),
        (
            'Bài 26 · Ôn tập cộng và trừ',
            'Lớp 4', 'Toán', 'Học kỳ 1', '5. Phép cộng và phép trừ',
            'g4-math-hk1-b26', 'Trắc nghiệm', 'number.hk1_review_b22_b25',
            '{question}', '{"skills":["b22","b23","b24","b25"]}'::jsonb
        )
)
INSERT INTO public.question_templates (
    name, classlevel, subject, semester, topic, lesson, question_type,
    generator_key, prompt_template, config, is_active
)
SELECT seed.name, seed.classlevel, seed.subject, seed.semester, seed.topic,
       seed.lesson, seed.question_type, seed.generator_key,
       seed.prompt_template, seed.config, TRUE
FROM phase6_seed AS seed
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

-- Post-run audit: every Phase 6 blueprint must carry one canonical lesson.
SELECT lesson, count(*) AS active_count
FROM public.question_templates
WHERE is_active = TRUE
  AND classlevel = 'Lớp 4'
  AND subject = 'Toán'
  AND semester = 'Học kỳ 1'
  AND topic = '5. Phép cộng và phép trừ'
  AND lesson IN (
      'g4-math-hk1-b22', 'g4-math-hk1-b23', 'g4-math-hk1-b24',
      'g4-math-hk1-b25', 'g4-math-hk1-b26'
  )
GROUP BY lesson
ORDER BY lesson;
