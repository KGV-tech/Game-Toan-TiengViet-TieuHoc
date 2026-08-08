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
    'Số nào dưới đây là mật khẩu mở khóa két sắt?<br>Biết rằng mật khẩu có {codeLength} chữ số, {condition1} và {condition2}.',
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
    'Đúng/Sai về lớp của chữ số', 'Lớp 4', 'Toán', 'Học kỳ 1', '3. Số có nhiều chữ số',
    'Đúng/Sai', 'number.place_value_true_false',
    'Số {number}',
    '{"minimum":10000000,"maximum":99999999}'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM public.question_templates WHERE generator_key = 'number.place_value_true_false'
      AND classlevel = 'Lớp 4' AND subject = 'Toán' AND topic = '3. Số có nhiều chữ số'
);
