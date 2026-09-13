-- Khôi phục quy cách đã chốt cho các template dãy số điền khuyết lớp 4:
-- mỗi dãy có đúng 6 số và có từ 1 đến 3 ô trống.
-- Migration chỉ cập nhật loại câu hỏi và cấu hình của đúng hai generator này, không đổi schema hay RLS.

UPDATE public.question_templates
SET config = COALESCE(config, '{}'::jsonb) || jsonb_build_object(
    'sequenceLengthMin', 6,
    'sequenceLengthMax', 6,
    'blankCountMin', 1,
    'blankCountMax', 3
)
WHERE generator_key = 'number.natural_sequence'
  AND classlevel = 'Lớp 4'
  AND subject = 'Toán';

UPDATE public.question_templates
SET question_type = 'Chuỗi Quy luật',
    config = COALESCE(config, '{}'::jsonb) || jsonb_build_object(
        'blankCountMin', 1,
        'blankCountMax', 3
    )
WHERE generator_key = 'number.even_odd_sequence'
  AND classlevel = 'Lớp 4'
  AND subject = 'Toán';
