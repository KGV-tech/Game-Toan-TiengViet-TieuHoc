-- Run this manually in the intended Supabase project's SQL Editor after the
-- question_templates table already exists. This file is not executed by the app.
INSERT INTO public.question_templates (name, classlevel, subject, semester, topic, question_type, generator_key, prompt_template, config)
SELECT seed.name, 'Lớp 4', 'Toán', 'Học kỳ 1', '4. Một số đơn vị đo Đại lượng', seed.question_type, seed.generator_key, seed.prompt_template, '{}'::jsonb
FROM (VALUES
  ('Đổi đơn vị khối lượng', 'Điền khuyết', 'measurement.mass_unit_convert', '{question}'),
  ('Đổi đơn vị diện tích', 'Điền khuyết', 'measurement.area_unit_convert', '{question}'),
  ('Đổi đơn vị thời gian', 'Điền khuyết', 'measurement.time_unit_convert', '{question}'),
  ('So sánh đại lượng cùng loại', 'Kéo thả', 'measurement.compare_units', '{question}'),
  ('Nối số đo tương đương', 'Đối chiếu trùng khớp', 'measurement.match_equivalences', '{question}'),
  ('Đúng/Sai về đơn vị đo', 'Đúng/Sai', 'measurement.unit_true_false', '{question}'),
  ('Xác định thế kỉ', 'Trắc nghiệm', 'measurement.century_identification', '{question}'),
  ('Bài toán thực tế đơn vị đo', 'Điền khuyết', 'measurement.word_problem_units', '{question}')
) AS seed(name, question_type, generator_key, prompt_template)
WHERE NOT EXISTS (
  SELECT 1 FROM public.question_templates existing
  WHERE existing.classlevel = 'Lớp 4' AND existing.subject = 'Toán'
    AND existing.topic = '4. Một số đơn vị đo Đại lượng' AND existing.generator_key = seed.generator_key
);

-- Repair templates added before their generated question body was preserved.
UPDATE public.question_templates
SET prompt_template = '{question}'
WHERE classlevel = 'Lớp 4' AND subject = 'Toán'
  AND topic = '4. Một số đơn vị đo Đại lượng'
  AND generator_key IN (
    'measurement.mass_unit_convert', 'measurement.area_unit_convert', 'measurement.time_unit_convert',
    'measurement.compare_units', 'measurement.match_equivalences',
    'measurement.unit_true_false', 'measurement.century_identification', 'measurement.word_problem_units'
  );

-- Remove the retired unit-choice template: its “most appropriate” wording can have more than one valid mathematical unit.
DELETE FROM public.question_templates
WHERE classlevel = 'Lớp 4' AND subject = 'Toán'
  AND topic = '4. Một số đơn vị đo Đại lượng'
  AND generator_key = 'measurement.choose_appropriate_unit';
