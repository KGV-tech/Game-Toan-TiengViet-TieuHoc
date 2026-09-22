-- Bài 5 — Giải bài toán có ba bước tính.
--
-- Seed additive/idempotent cho 14 blueprint (7 dạng × 2 tương tác).
-- Không thay đổi RLS, quyền hoặc schema. Chỉ chạy trong đúng project Supabase
-- sau khi đã kiểm tra schema question_templates và bản preview local.

BEGIN;

WITH b05_seed (name, classlevel, subject, semester, topic, lesson,
               question_type, generator_key, prompt_template, config) AS (
    VALUES
        ('Bài 5 · Quan hệ hơn/kém rồi tính tổng — Trắc nghiệm', 'Lớp 4', 'Toán', 'Học kỳ 1', '1. Ôn tập và bổ sung', 'g4-math-hk1-b05', 'Trắc nghiệm', 'word.three_steps_relation_total_mcq', '{question}', '{"difficulty":"core"}'::jsonb),
        ('Bài 5 · Quan hệ hơn/kém rồi tính tổng — Điền khuyết', 'Lớp 4', 'Toán', 'Học kỳ 1', '1. Ôn tập và bổ sung', 'g4-math-hk1-b05', 'Điền khuyết', 'word.three_steps_relation_total_fill', '{question}', '{"difficulty":"core"}'::jsonb),
        ('Bài 5 · Mua hàng và tính tổng — Trắc nghiệm', 'Lớp 4', 'Toán', 'Học kỳ 1', '1. Ôn tập và bổ sung', 'g4-math-hk1-b05', 'Trắc nghiệm', 'word.three_steps_purchase_total_mcq', '{question}', '{"difficulty":"core"}'::jsonb),
        ('Bài 5 · Mua hàng và tính tổng — Điền khuyết', 'Lớp 4', 'Toán', 'Học kỳ 1', '1. Ôn tập và bổ sung', 'g4-math-hk1-b05', 'Điền khuyết', 'word.three_steps_purchase_total_fill', '{question}', '{"difficulty":"core"}'::jsonb),
        ('Bài 5 · Chia nhóm rồi so sánh — Trắc nghiệm', 'Lớp 4', 'Toán', 'Học kỳ 1', '1. Ôn tập và bổ sung', 'g4-math-hk1-b05', 'Trắc nghiệm', 'word.three_steps_divide_compare_mcq', '{question}', '{"difficulty":"core"}'::jsonb),
        ('Bài 5 · Chia nhóm rồi so sánh — Điền khuyết', 'Lớp 4', 'Toán', 'Học kỳ 1', '1. Ôn tập và bổ sung', 'g4-math-hk1-b05', 'Điền khuyết', 'word.three_steps_divide_compare_fill', '{question}', '{"difficulty":"core"}'::jsonb),
        ('Bài 5 · Tìm phần còn lại — Trắc nghiệm', 'Lớp 4', 'Toán', 'Học kỳ 1', '1. Ôn tập và bổ sung', 'g4-math-hk1-b05', 'Trắc nghiệm', 'word.three_steps_remaining_mcq', '{question}', '{"difficulty":"core"}'::jsonb),
        ('Bài 5 · Tìm phần còn lại — Điền khuyết', 'Lớp 4', 'Toán', 'Học kỳ 1', '1. Ôn tập và bổ sung', 'g4-math-hk1-b05', 'Điền khuyết', 'word.three_steps_remaining_fill', '{question}', '{"difficulty":"core"}'::jsonb),
        ('Bài 5 · Quan hệ gấp lên/chia ra rồi tính tổng — Trắc nghiệm', 'Lớp 4', 'Toán', 'Học kỳ 1', '1. Ôn tập và bổ sung', 'g4-math-hk1-b05', 'Trắc nghiệm', 'word.three_steps_ratio_total_mcq', '{question}', '{"difficulty":"core"}'::jsonb),
        ('Bài 5 · Quan hệ gấp lên/chia ra rồi tính tổng — Điền khuyết', 'Lớp 4', 'Toán', 'Học kỳ 1', '1. Ôn tập và bổ sung', 'g4-math-hk1-b05', 'Điền khuyết', 'word.three_steps_ratio_total_fill', '{question}', '{"difficulty":"core"}'::jsonb),
        ('Bài 5 · Suy luận số con vật từ tổng số chân — Trắc nghiệm', 'Lớp 4', 'Toán', 'Học kỳ 1', '1. Ôn tập và bổ sung', 'g4-math-hk1-b05', 'Trắc nghiệm', 'word.three_steps_legs_constraint_mcq', '{question}', '{"difficulty":"core"}'::jsonb),
        ('Bài 5 · Suy luận số con vật từ tổng số chân — Điền khuyết', 'Lớp 4', 'Toán', 'Học kỳ 1', '1. Ôn tập và bổ sung', 'g4-math-hk1-b05', 'Điền khuyết', 'word.three_steps_legs_constraint_fill', '{question}', '{"difficulty":"core"}'::jsonb),
        ('Bài 5 · Hơn/kém rồi gấp lên và tính tổng — Trắc nghiệm', 'Lớp 4', 'Toán', 'Học kỳ 1', '1. Ôn tập và bổ sung', 'g4-math-hk1-b05', 'Trắc nghiệm', 'word.three_steps_animal_total_mcq', '{question}', '{"difficulty":"core"}'::jsonb),
        ('Bài 5 · Hơn/kém rồi gấp lên và tính tổng — Điền khuyết', 'Lớp 4', 'Toán', 'Học kỳ 1', '1. Ôn tập và bổ sung', 'g4-math-hk1-b05', 'Điền khuyết', 'word.three_steps_animal_total_fill', '{question}', '{"difficulty":"core"}'::jsonb)
)
INSERT INTO public.question_templates (
    name, classlevel, subject, semester, topic, lesson,
    question_type, generator_key, prompt_template, config, is_active
)
SELECT seed.name, seed.classlevel, seed.subject, seed.semester, seed.topic,
       seed.lesson, seed.question_type, seed.generator_key,
       seed.prompt_template, seed.config, TRUE
FROM b05_seed AS seed
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

-- Audit sau khi chạy: phải có đủ 14 blueprint active cho Bài 5.
SELECT lesson, count(*) AS active_count
FROM public.question_templates
WHERE is_active = TRUE
  AND classlevel = 'Lớp 4'
  AND subject = 'Toán'
  AND semester = 'Học kỳ 1'
  AND topic = '1. Ôn tập và bổ sung'
  AND lesson = 'g4-math-hk1-b05'
GROUP BY lesson;
