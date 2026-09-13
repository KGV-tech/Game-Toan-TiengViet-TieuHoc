-- Repair and extend the Grade 4 Math HK1 Lesson 1 template set.
-- This data-only migration changes question-template records; it does not
-- alter the Supabase schema, policies, keys, or permissions.

-- Temp 4: the generator already owns the complete question heading. Keeping
-- another heading around {question} creates the visible duplicated prompt.
UPDATE public.question_templates
SET prompt_template = '{question}'
WHERE id = '5fa3511a-2cb6-4f96-a7ea-7d2173edafe7'::uuid
  AND lesson = 'g4-math-hk1-b01'
  AND generator_key = 'number.missing_expanded_addend';

-- Temp 7 and 8 become one active template. Preserve the old records for
-- history, but keep them out of the selectable template pool.
UPDATE public.question_templates
SET is_active = false
WHERE id IN (
    '0cb830c2-3de6-4805-a2e6-19bcd9f1b744'::uuid,
    '93fb31c9-2ef5-421e-a875-8aae79142e4e'::uuid
)
  AND lesson = 'g4-math-hk1-b01';

-- Temp 8: restore the textbook-compatible fill-in sequence and make the
-- structured type authoritative if an earlier record saved it as fill-in.
UPDATE public.question_templates
SET question_type = 'Chuỗi Quy luật',
    prompt_template = '{question}',
    config = COALESCE(config, '{}'::jsonb) || '{"minimum":10,"maximum":99999,"allowedSteps":[1,10,100,1000,10000,-1,-10,-100,-1000,-10000],"sequenceLengthMin":6,"sequenceLengthMax":6,"blankCountMin":1,"blankCountMax":3}'::jsonb
WHERE lesson = 'g4-math-hk1-b01'
  AND generator_key = 'number.natural_sequence';

-- Temp 10: use the existing and tested Đúng/Sai generator with four- or
-- five-digit numbers. Bài 1 always contains four fixed forms: hàng,
-- số-số, số-biểu thức and biểu thức-biểu thức; it does not use lớp.
UPDATE public.question_templates
SET question_type = 'Đúng/Sai',
    prompt_template = 'Chọn Đúng/Sai?',
    config = COALESCE(config, '{}'::jsonb) || '{"minimum":1001,"maximum":99999,"statementKinds":["place","comparison"],"statementLayout":"b01-four-types"}'::jsonb
WHERE lesson = 'g4-math-hk1-b01'
  AND generator_key = 'number.place_value_true_false';

INSERT INTO public.question_templates (
    name, classlevel, subject, semester, topic, lesson,
    question_type, generator_key, prompt_template, config, is_active
)
SELECT
    'Tìm số bé nhất và số lớn nhất trong các nhóm bốn số',
    'Lớp 4', 'Toán', 'Học kỳ 1', '1. Ôn tập và bổ sung', 'g4-math-hk1-b01',
    'Trắc nghiệm', 'number.min_max_of_four', '{question}',
    '{"minimum":10,"maximum":99999}'::jsonb, true
WHERE NOT EXISTS (
    SELECT 1 FROM public.question_templates
    WHERE lesson = 'g4-math-hk1-b01'
      AND generator_key = 'number.min_max_of_four'
);

INSERT INTO public.question_templates (
    name, classlevel, subject, semester, topic, lesson,
    question_type, generator_key, prompt_template, config, is_active
)
SELECT
    'Dãy số theo quy luật · Bài 1',
    'Lớp 4', 'Toán', 'Học kỳ 1', '1. Ôn tập và bổ sung', 'g4-math-hk1-b01',
    'Chuỗi Quy luật', 'number.natural_sequence', '{question}',
    '{"minimum":10,"maximum":99999,"allowedSteps":[1,10,100,1000,10000,-1,-10,-100,-1000,-10000],"sequenceLengthMin":6,"sequenceLengthMax":6,"blankCountMin":1,"blankCountMax":3}'::jsonb, true
WHERE NOT EXISTS (
    SELECT 1 FROM public.question_templates
    WHERE lesson = 'g4-math-hk1-b01'
      AND generator_key = 'number.natural_sequence'
);

INSERT INTO public.question_templates (
    name, classlevel, subject, semester, topic, lesson,
    question_type, generator_key, prompt_template, config, is_active
)
SELECT
    'Làm tròn số đến hàng chục, trăm, nghìn, chục nghìn',
    'Lớp 4', 'Toán', 'Học kỳ 1', '1. Ôn tập và bổ sung', 'g4-math-hk1-b01',
    'Trắc nghiệm', 'number.round_number', '{question}',
    '{"minimum":10,"maximum":99999,"allowedPlaces":["tens","hundreds","thousands","tenThousands"]}'::jsonb, true
WHERE NOT EXISTS (
    SELECT 1 FROM public.question_templates
    WHERE lesson = 'g4-math-hk1-b01'
      AND generator_key = 'number.round_number'
);

INSERT INTO public.question_templates (
    name, classlevel, subject, semester, topic, lesson,
    question_type, generator_key, prompt_template, config, is_active
)
SELECT
    'Đúng/Sai: hàng và ba kiểu so sánh · Bài 1',
    'Lớp 4', 'Toán', 'Học kỳ 1', '1. Ôn tập và bổ sung', 'g4-math-hk1-b01',
    'Đúng/Sai', 'number.place_value_true_false', 'Chọn Đúng/Sai?',
    '{"minimum":1001,"maximum":99999,"statementKinds":["place","comparison"],"statementLayout":"b01-four-types"}'::jsonb, true
WHERE NOT EXISTS (
    SELECT 1 FROM public.question_templates
    WHERE lesson = 'g4-math-hk1-b01'
      AND generator_key = 'number.place_value_true_false'
);
