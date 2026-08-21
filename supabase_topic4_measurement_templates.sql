-- Run this manually in the intended Supabase project's SQL Editor after the
-- question_templates table already exists. This file is not executed by the app.
INSERT INTO public.question_templates (name, classlevel, subject, semester, topic, question_type, generator_key, prompt_template, config)
SELECT seed.name, 'Lớp 4', 'Toán', 'Học kỳ 1', '4. Một số đơn vị đo Đại lượng', seed.question_type, seed.generator_key, seed.prompt_template, '{}'::jsonb
FROM (VALUES
  ('Đổi đơn vị khối lượng', 'Điền khuyết', 'measurement.mass_unit_convert', 'Điền số thích hợp.'),
  ('Đổi đơn vị diện tích', 'Điền khuyết', 'measurement.area_unit_convert', 'Điền số thích hợp.'),
  ('Đổi đơn vị thời gian', 'Điền khuyết', 'measurement.time_unit_convert', 'Điền số thích hợp.'),
  ('Chọn đơn vị đo phù hợp', 'Trắc nghiệm', 'measurement.choose_appropriate_unit', 'Chọn đơn vị đo thích hợp nhất.'),
  ('So sánh đại lượng cùng loại', 'Kéo thả', 'measurement.compare_units', 'Điền dấu thích hợp.'),
  ('Nối số đo tương đương', 'Đối chiếu trùng khớp', 'measurement.match_equivalences', 'Nối mỗi số đo với giá trị tương đương.'),
  ('Đúng/Sai về đơn vị đo', 'Đúng/Sai', 'measurement.unit_true_false', 'Chọn Đúng hoặc Sai cho mỗi nhận định.'),
  ('Xác định thế kỉ', 'Trắc nghiệm', 'measurement.century_identification', 'Mỗi năm sau thuộc thế kỉ nào?'),
  ('Bài toán thực tế đơn vị đo', 'Điền khuyết', 'measurement.word_problem_units', 'Điền đáp số thích hợp.')
) AS seed(name, question_type, generator_key, prompt_template)
WHERE NOT EXISTS (
  SELECT 1 FROM public.question_templates existing
  WHERE existing.classlevel = 'Lớp 4' AND existing.subject = 'Toán'
    AND existing.topic = '4. Một số đơn vị đo Đại lượng' AND existing.generator_key = seed.generator_key
);
