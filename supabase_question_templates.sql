-- Run after supabase_auth_security.sql so private.is_admin() is available.
CREATE TABLE IF NOT EXISTS public.question_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 120),
    classlevel TEXT NOT NULL CHECK (classlevel ~ '^Lớp [1-5]$'),
    subject TEXT NOT NULL CHECK (subject IN ('Toán', 'Tiếng Việt')),
    semester TEXT NOT NULL CHECK (semester IN ('Học kỳ 1', 'Học kỳ 2')),
    topic TEXT NOT NULL,
    question_type TEXT NOT NULL DEFAULT 'Trắc nghiệm',
    generator_key TEXT NOT NULL CHECK (char_length(trim(generator_key)) BETWEEN 1 AND 120),
    prompt_template TEXT NOT NULL CHECK (char_length(trim(prompt_template)) BETWEEN 1 AND 500),
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS question_templates_catalog_idx
    ON public.question_templates (classlevel, subject, semester, topic, question_type);
CREATE INDEX IF NOT EXISTS question_templates_generator_idx
    ON public.question_templates (generator_key) WHERE is_active;

ALTER TABLE public.question_templates ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.question_templates FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_templates TO authenticated;

DROP POLICY IF EXISTS templates_read_signed_in ON public.question_templates;
DROP POLICY IF EXISTS templates_write_teacher ON public.question_templates;
CREATE POLICY templates_read_signed_in ON public.question_templates
    FOR SELECT TO authenticated USING (true);
CREATE POLICY templates_write_teacher ON public.question_templates
    FOR ALL TO authenticated
    USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));

-- Upgrade the legacy matching template, if it was created before this generator existed.
UPDATE public.question_templates
SET question_type = 'Đối chiếu trùng khớp',
    generator_key = 'number.match_number_words',
    prompt_template = 'Hãy nối mỗi số với cách đọc đúng.',
    config = '{"shapes":["5:4","4:5"],"digits":[7,8,9],"digitStrategy":"balanced","digitWeights":null,"prefixWords":0,"seed":null}'::jsonb
WHERE name = 'Đối chiếu số với cách đọc'
  AND classlevel = 'Lớp 4'
  AND subject = 'Toán';

INSERT INTO public.question_templates (
    name, classlevel, subject, semester, topic, question_type, generator_key, prompt_template, config
)
SELECT
    'Đối chiếu số với cách đọc', 'Lớp 4', 'Toán', 'Học kỳ 1', '1. Số tự nhiên',
    'Đối chiếu trùng khớp', 'number.match_number_words',
    'Hãy nối mỗi số với cách đọc đúng.',
    '{"shapes":["5:4","4:5"],"digits":[7,8,9],"digitStrategy":"balanced","digitWeights":null,"prefixWords":0,"seed":null}'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM public.question_templates
    WHERE generator_key = 'number.match_number_words'
      AND classlevel = 'Lớp 4' AND subject = 'Toán'
);

INSERT INTO public.question_templates (
    name, classlevel, subject, semester, topic, question_type, generator_key, prompt_template, config
)
SELECT
    'Nhận biết chữ số theo hàng', 'Lớp 4', 'Toán', 'Học kỳ 1', '3. Số có nhiều chữ số',
    'Trắc nghiệm', 'number.digit_at_place',
    'Số nào dưới đây có chữ số hàng {place} là {digit}?',
    '{"minimum":10000,"maximum":100000,"allowedPlaces":["tens","hundreds","thousands","tenThousands"],"allowedDigits":[1,2,3,4,5,6,7,8,9]}'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM public.question_templates WHERE generator_key = 'number.digit_at_place'
      AND classlevel = 'Lớp 4' AND subject = 'Toán' AND topic = '3. Số có nhiều chữ số'
);

INSERT INTO public.question_templates (
    name, classlevel, subject, semester, topic, question_type, generator_key, prompt_template, config
)
SELECT
    'Mật khẩu két sắt theo hàng', 'Lớp 4', 'Toán', 'Học kỳ 1', '3. Số có nhiều chữ số',
    'Trắc nghiệm', 'number.safe_password_by_place_value',
    'Số nào dưới đây là mật khẩu mở khóa két sắt?<br>Biết rằng {condition1} và {condition2}.',
    '{"minimum":0,"maximum":999999999,"minimumCodeLength":9,"maximumCodeLength":9,"condition1Scope":"random","condition1Classes":["millionsClass"],"condition1Places":["millions"],"condition1Digits":[0],"condition2Places":["hundredThousands"],"condition2Digits":[3]}'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM public.question_templates WHERE generator_key = 'number.safe_password_by_place_value'
      AND classlevel = 'Lớp 4' AND subject = 'Toán' AND topic = '3. Số có nhiều chữ số'
);

INSERT INTO public.question_templates (
    name, classlevel, subject, semester, topic, question_type, generator_key, prompt_template, config
)
SELECT
    'Tìm số bé nhất trong bốn số', 'Lớp 4', 'Toán', 'Học kỳ 1', '3. Số có nhiều chữ số',
    'Trắc nghiệm', 'number.smallest_of_four',
    'Hãy tìm số bé nhất trong các số sau.',
    '{"minimum":10000,"maximum":100000}'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM public.question_templates WHERE generator_key = 'number.smallest_of_four'
      AND classlevel = 'Lớp 4' AND subject = 'Toán' AND topic = '3. Số có nhiều chữ số'
);

INSERT INTO public.question_templates (
    name, classlevel, subject, semester, topic, question_type, generator_key, prompt_template, config
)
SELECT
    'Tìm số lớn nhất trong bốn số', 'Lớp 4', 'Toán', 'Học kỳ 1', '3. Số có nhiều chữ số',
    'Trắc nghiệm', 'number.largest_of_four',
    'Hãy tìm số lớn nhất trong các số sau.',
    '{"minimum":10000,"maximum":100000}'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM public.question_templates WHERE generator_key = 'number.largest_of_four'
      AND classlevel = 'Lớp 4' AND subject = 'Toán' AND topic = '3. Số có nhiều chữ số'
);

INSERT INTO public.question_templates (
    name, classlevel, subject, semester, topic, question_type, generator_key, prompt_template, config
)
SELECT
    'Lập số từ các hàng', 'Lớp 4', 'Toán', 'Học kỳ 1', '3. Số có nhiều chữ số',
    'Điền khuyết', 'number.compose_from_places',
    '{question}',
    '{"minimum":10000,"maximum":100000}'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM public.question_templates WHERE generator_key = 'number.compose_from_places'
      AND classlevel = 'Lớp 4' AND subject = 'Toán' AND topic = '3. Số có nhiều chữ số'
);

INSERT INTO public.question_templates (
    name, classlevel, subject, semester, topic, question_type, generator_key, prompt_template, config
)
SELECT
    'Điền thành phần còn thiếu khi phân tích số', 'Lớp 4', 'Toán', 'Học kỳ 1', '3. Số có nhiều chữ số',
    'Điền khuyết', 'number.missing_expanded_addend',
    '{question}',
    '{"minimum":10000,"maximum":100000}'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM public.question_templates WHERE generator_key = 'number.missing_expanded_addend'
      AND classlevel = 'Lớp 4' AND subject = 'Toán' AND topic = '3. Số có nhiều chữ số'
);

INSERT INTO public.question_templates (
    name, classlevel, subject, semester, topic, question_type, generator_key, prompt_template, config
)
SELECT
    'Số liền trước và số liền sau', 'Lớp 4', 'Toán', 'Học kỳ 1', '3. Số có nhiều chữ số',
    'Điền khuyết', 'number.neighbor_numbers',
    '{question}',
    '{"minimum":10000,"maximum":100000}'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM public.question_templates WHERE generator_key = 'number.neighbor_numbers'
      AND classlevel = 'Lớp 4' AND subject = 'Toán' AND topic = '3. Số có nhiều chữ số'
);

INSERT INTO public.question_templates (
    name, classlevel, subject, semester, topic, question_type, generator_key, prompt_template, config
)
SELECT
    'Dãy số theo quy luật', 'Lớp 4', 'Toán', 'Học kỳ 1', '3. Số có nhiều chữ số',
    'Chuỗi Quy luật', 'number.natural_sequence',
    '{question}',
    '{"minimum":10000,"maximum":9999999,"allowedSteps":[1000,2000,3000,4000,5000,6000,7000,8000,9000,-1000,-2000,-3000,-4000,-5000,-6000,-7000,-8000,-9000],"sequenceLengthMin":5,"sequenceLengthMax":7,"blankCountMin":2,"blankCountMax":3}'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM public.question_templates WHERE generator_key = 'number.natural_sequence'
      AND classlevel = 'Lớp 4' AND subject = 'Toán' AND topic = '3. Số có nhiều chữ số'
);

INSERT INTO public.question_templates (
    name, classlevel, subject, semester, topic, question_type, generator_key, prompt_template, config
)
SELECT
    'So sánh số với dạng tổng', 'Lớp 4', 'Toán', 'Học kỳ 1', '3. Số có nhiều chữ số',
    'So sánh', 'number.compare_number_forms',
    '{question}',
    '{"minimum":10000,"maximum":100000}'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM public.question_templates WHERE generator_key = 'number.compare_number_forms'
      AND classlevel = 'Lớp 4' AND subject = 'Toán' AND topic = '3. Số có nhiều chữ số'
);

INSERT INTO public.question_templates (
    name, classlevel, subject, semester, topic, question_type, generator_key, prompt_template, config
)
SELECT
    'Bốn phép tính điền khuyết', 'Lớp 4', 'Toán', 'Học kỳ 1', '3. Số có nhiều chữ số',
    'Điền khuyết', 'number.four_arithmetic_blanks',
    'Hãy điền số thích hợp vào chỗ trống:<br>{exercises}',
    '{"minimum":10,"maximum":999999999,"minimumDigits":2,"maximumDigits":9,"operations":["+","-","*","/"],"layouts":["expressionLeft","expressionRight","twoExpressions"],"blankPositions":["first","second","third","fourth"]}'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM public.question_templates WHERE generator_key = 'number.four_arithmetic_blanks'
      AND classlevel = 'Lớp 4' AND subject = 'Toán' AND topic = '3. Số có nhiều chữ số'
);

INSERT INTO public.question_templates (
    name, classlevel, subject, semester, topic, question_type, generator_key, prompt_template, config
)
SELECT
    'So sánh bốn phép tính kéo thả', 'Lớp 4', 'Toán', 'Học kỳ 1', '3. Số có nhiều chữ số',
    'Kéo thả', 'number.four_arithmetic_comparisons',
    'Điền dấu thích hợp:<br>{exercises}',
    '{"minimum":10,"maximum":999999999,"minimumDigits":2,"maximumDigits":9,"operations":["+","-","*","/"],"layouts":["expressionLeft","expressionRight","twoExpressions"]}'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM public.question_templates WHERE generator_key = 'number.four_arithmetic_comparisons'
      AND classlevel = 'Lớp 4' AND subject = 'Toán' AND topic = '3. Số có nhiều chữ số'
);

INSERT INTO public.question_templates (
    name, classlevel, subject, semester, topic, question_type, generator_key, prompt_template, config
)
SELECT
    'Đúng/Sai về lớp của chữ số', 'Lớp 4', 'Toán', 'Học kỳ 1', '3. Số có nhiều chữ số',
    'Đúng/Sai', 'number.place_value_true_false',
    'Số {number}',
    '{"minimum":10000000,"maximum":99999999}'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM public.question_templates WHERE generator_key = 'number.place_value_true_false'
      AND classlevel = 'Lớp 4' AND subject = 'Toán' AND topic = '3. Số có nhiều chữ số'
);

-- Grade 4 Math, Topic 1: COPY the ten reusable templates for revision through 100 000.
-- The originals stay in their current topic (for example, Topic 3). Never move them.
-- If this script is re-run after an earlier accidental move, recreate the missing source row first.
INSERT INTO public.question_templates (
    name, classlevel, subject, semester, topic, question_type, generator_key, prompt_template, config, is_active
)
SELECT
    name, classlevel, subject, semester, '3. Số có nhiều chữ số', question_type, generator_key, prompt_template,
    CASE generator_key
        WHEN 'number.digit_at_place' THEN '{"minimum":10000,"maximum":100000,"allowedPlaces":["tens","hundreds","thousands","tenThousands"],"allowedDigits":[1,2,3,4,5,6,7,8,9]}'::jsonb
        WHEN 'number.smallest_of_four' THEN '{"minimum":10000,"maximum":100000}'::jsonb
        WHEN 'number.largest_of_four' THEN '{"minimum":10000,"maximum":100000}'::jsonb
        WHEN 'number.compose_from_places' THEN '{"minimum":10000,"maximum":100000}'::jsonb
        WHEN 'number.missing_expanded_addend' THEN '{"minimum":10000,"maximum":100000}'::jsonb
        WHEN 'number.neighbor_numbers' THEN '{"minimum":10000,"maximum":100000}'::jsonb
        WHEN 'number.compare_number_forms' THEN '{"minimum":10000,"maximum":100000}'::jsonb
        WHEN 'number.match_number_words' THEN '{"shapes":["5:4","4:5"],"digits":[7,8,9],"digitStrategy":"balanced","digitWeights":null,"prefixWords":0,"seed":null}'::jsonb
        WHEN 'number.four_arithmetic_blanks' THEN '{"minimum":10,"maximum":999999999,"minimumDigits":2,"maximumDigits":9,"operations":["+","-","*","/"],"layouts":["expressionLeft","expressionRight","twoExpressions"],"blankPositions":["first","second","third","fourth"]}'::jsonb
        WHEN 'number.four_arithmetic_comparisons' THEN '{"minimum":10,"maximum":999999999,"minimumDigits":2,"maximumDigits":9,"operations":["+","-","*","/"],"layouts":["expressionLeft","expressionRight","twoExpressions"]}'::jsonb
        ELSE config
    END,
    is_active
FROM public.question_templates AS moved
WHERE moved.classlevel = 'Lớp 4'
  AND moved.subject = 'Toán'
  AND moved.topic = '1. Ôn tập và bổ sung'
  AND moved.generator_key IN (
      'number.digit_at_place', 'number.smallest_of_four', 'number.largest_of_four',
      'number.compose_from_places', 'number.missing_expanded_addend', 'number.neighbor_numbers',
      'number.compare_number_forms', 'number.match_number_words',
      'number.four_arithmetic_blanks', 'number.four_arithmetic_comparisons'
  )
  AND NOT EXISTS (
      SELECT 1 FROM public.question_templates AS source
      WHERE source.classlevel = moved.classlevel
        AND source.subject = moved.subject
        AND source.generator_key = moved.generator_key
        AND source.topic IN ('1. Số tự nhiên', '3. Số có nhiều chữ số')
  );

INSERT INTO public.question_templates (
    name, classlevel, subject, semester, topic, question_type, generator_key, prompt_template, config, is_active
)
SELECT
    name, classlevel, subject, semester, '1. Ôn tập và bổ sung', question_type, generator_key, prompt_template,
    CASE generator_key
        WHEN 'number.digit_at_place' THEN '{"minimum":10,"maximum":99999,"minimumDigits":2,"maximumDigits":5,"allowedPlaces":["ones","tens","hundreds","thousands","tenThousands"],"allowedDigits":[0,1,2,3,4,5,6,7,8,9]}'::jsonb
        WHEN 'number.smallest_of_four' THEN '{"minimum":10,"maximum":99999,"minimumDigits":2,"maximumDigits":5}'::jsonb
        WHEN 'number.largest_of_four' THEN '{"minimum":10,"maximum":99999,"minimumDigits":2,"maximumDigits":5}'::jsonb
        WHEN 'number.compose_from_places' THEN '{"minimum":10,"maximum":99999,"minimumDigits":2,"maximumDigits":5}'::jsonb
        WHEN 'number.missing_expanded_addend' THEN '{"minimum":10,"maximum":99999,"minimumDigits":2,"maximumDigits":5}'::jsonb
        WHEN 'number.neighbor_numbers' THEN '{"minimum":10,"maximum":99999,"minimumDigits":2,"maximumDigits":5}'::jsonb
        WHEN 'number.compare_number_forms' THEN '{"minimum":10,"maximum":99999,"minimumDigits":2,"maximumDigits":5}'::jsonb
        WHEN 'number.match_number_words' THEN '{"shapes":["5:4","4:5"],"digits":[2,3,4,5],"digitStrategy":"balanced","digitWeights":null,"prefixWords":0,"seed":null}'::jsonb
        WHEN 'number.four_arithmetic_blanks' THEN '{"minimum":10,"maximum":99999,"minimumDigits":2,"maximumDigits":5,"operations":["+","-","*","/"],"layouts":["expressionLeft","expressionRight","twoExpressions"],"blankPositions":["first","second","third","fourth"]}'::jsonb
        WHEN 'number.four_arithmetic_comparisons' THEN '{"minimum":10,"maximum":99999,"minimumDigits":2,"maximumDigits":5,"operations":["+","-","*","/"],"layouts":["expressionLeft","expressionRight","twoExpressions"]}'::jsonb
        ELSE config
    END,
    is_active
FROM public.question_templates AS source
WHERE source.classlevel = 'Lớp 4'
  AND source.subject = 'Toán'
  AND source.generator_key IN (
      'number.digit_at_place', 'number.smallest_of_four', 'number.largest_of_four',
      'number.compose_from_places', 'number.missing_expanded_addend', 'number.neighbor_numbers',
      'number.compare_number_forms', 'number.match_number_words',
      'number.four_arithmetic_blanks', 'number.four_arithmetic_comparisons'
  )
  AND source.topic IN ('1. Số tự nhiên', '3. Số có nhiều chữ số')
  AND NOT EXISTS (
      SELECT 1 FROM public.question_templates AS target
      WHERE target.classlevel = source.classlevel
        AND target.subject = source.subject
        AND target.generator_key = source.generator_key
        AND target.topic = '1. Ôn tập và bổ sung'
  );

INSERT INTO public.question_templates (
    name, classlevel, subject, semester, topic, question_type, generator_key, prompt_template, config
)
SELECT
    'Bốn phép tính: điền số còn thiếu', 'Lớp 4', 'Toán', 'Học kỳ 1', '1. Ôn tập và bổ sung',
    'Điền khuyết', 'number.four_operations_fill_blanks',
    '{question}',
    '{"minimum":10,"maximum":99999,"minimumDigits":2,"maximumDigits":5,"operations":["+","-","*","/"]}'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM public.question_templates
    WHERE generator_key = 'number.four_operations_fill_blanks'
      AND classlevel = 'Lớp 4' AND subject = 'Toán' AND topic = '1. Ôn tập và bổ sung'
);

INSERT INTO public.question_templates (
    name, classlevel, subject, semester, topic, question_type, generator_key, prompt_template, config
)
SELECT
    'Bốn phép tính: tính giá trị biểu thức', 'Lớp 4', 'Toán', 'Học kỳ 1', '1. Ôn tập và bổ sung',
    'Điền khuyết', 'number.four_operations_expressions',
    '{question}',
    '{"minimum":10,"maximum":99999,"minimumDigits":2,"maximumDigits":5,"operations":["+","-","*","/"]}'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM public.question_templates
    WHERE generator_key = 'number.four_operations_expressions'
      AND classlevel = 'Lớp 4' AND subject = 'Toán' AND topic = '1. Ôn tập và bổ sung'
);

-- Grade 4 Math, Topic 2: Góc và đơn vị đo góc.
-- These generators own their geometry, so their configuration intentionally remains empty.
INSERT INTO public.question_templates (
    name, classlevel, subject, semester, topic, question_type, generator_key, prompt_template, config
)
SELECT
    'Đếm các loại góc trong hình', 'Lớp 4', 'Toán', 'Học kỳ 1', '2. Góc và đơn vị đo góc',
    'Điền khuyết', 'g4-m-angle-count-in-polygon', '{question}', '{}'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM public.question_templates
    WHERE generator_key = 'g4-m-angle-count-in-polygon'
      AND classlevel = 'Lớp 4' AND subject = 'Toán' AND topic = '2. Góc và đơn vị đo góc'
);

INSERT INTO public.question_templates (
    name, classlevel, subject, semester, topic, question_type, generator_key, prompt_template, config
)
SELECT
    'Kéo thả phân loại góc', 'Lớp 4', 'Toán', 'Học kỳ 1', '2. Góc và đơn vị đo góc',
    'Kéo thả', 'g4-m-angle-drag-classify', '{question}', '{}'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM public.question_templates
    WHERE generator_key = 'g4-m-angle-drag-classify'
      AND classlevel = 'Lớp 4' AND subject = 'Toán' AND topic = '2. Góc và đơn vị đo góc'
);

INSERT INTO public.question_templates (
    name, classlevel, subject, semester, topic, question_type, generator_key, prompt_template, config
)
SELECT
    'Kéo thả phân loại góc qua đồng hồ', 'Lớp 4', 'Toán', 'Học kỳ 1', '2. Góc và đơn vị đo góc',
    'Kéo thả', 'g4-m-angle-clock-classify', '{question}', '{}'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM public.question_templates
    WHERE generator_key = 'g4-m-angle-clock-classify'
      AND classlevel = 'Lớp 4' AND subject = 'Toán' AND topic = '2. Góc và đơn vị đo góc'
);

INSERT INTO public.question_templates (
    name, classlevel, subject, semester, topic, question_type, generator_key, prompt_template, config
)
SELECT
    'Đếm 8 góc theo loại', 'Lớp 4', 'Toán', 'Học kỳ 1', '2. Góc và đơn vị đo góc',
    'Điền khuyết', 'g4-m-angle-count-eight-angles', '{question}', '{}'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM public.question_templates
    WHERE generator_key = 'g4-m-angle-count-eight-angles'
      AND classlevel = 'Lớp 4' AND subject = 'Toán' AND topic = '2. Góc và đơn vị đo góc'
);
