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
