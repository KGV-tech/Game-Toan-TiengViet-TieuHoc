-- Phase 1: gắn Bài học cho các Template hiện có đã được duyệt.
-- Chỉ cập nhật lesson trên record đang có; không seed, xoá, archive hay đổi generator/config.
-- Các record cần harden/tách/thay và family bài toán lời văn được giữ nguyên để review sau.

BEGIN;

ALTER TABLE public.question_templates
    ADD COLUMN IF NOT EXISTS lesson TEXT;

CREATE INDEX IF NOT EXISTS question_templates_lesson_idx
    ON public.question_templates (classlevel, subject, semester, topic, lesson)
    WHERE is_active;

WITH phase1_mapping (id, lesson) AS (
    VALUES
        ('981d1ac3-06f5-438e-8b7a-3410cc63d469'::uuid, 'g4-math-hk1-b02'),
        ('2e12c19b-efc3-4ab8-ae6e-7d5ad120a4bb'::uuid, 'g4-math-hk1-b02'),
        ('2f653ca5-893c-4cdb-9efe-f0995f450fed'::uuid, 'g4-math-hk1-b02'),
        ('5fa3511a-2cb6-4f96-a7ea-7d2173edafe7'::uuid, 'g4-math-hk1-b01'),
        ('675644ba-d1ae-40c8-ad36-42a7bf1e9b51'::uuid, 'g4-math-hk1-b01'),
        ('a7b8d959-c1c9-4a1a-9bc3-b32cd1b61768'::uuid, 'g4-math-hk1-b01'),
        ('c5d1d03c-d539-433d-97b6-fee5074722aa'::uuid, 'g4-math-hk1-b01'),
        ('2a9f2d2b-eea0-44bd-a8e4-c34819bd58c5'::uuid, 'g4-math-hk1-b01'),
        ('5eebc531-e3c0-4b6e-97e5-0c983d2a9f75'::uuid, 'g4-math-hk1-b02'),
        ('c2d25199-ddd2-4e0e-84fe-f5d856d71633'::uuid, 'g4-math-hk1-b01'),
        ('0cb830c2-3de6-4805-a2e6-19bcd9f1b744'::uuid, 'g4-math-hk1-b01'),
        ('93fb31c9-2ef5-421e-a875-8aae79142e4e'::uuid, 'g4-math-hk1-b01'),
        ('992f7665-69bd-483e-a993-129e9b26e6da'::uuid, 'g4-math-hk1-b08'),
        ('1345aec4-4ad7-47a9-b918-39f8041375cc'::uuid, 'g4-math-hk1-b08'),
        ('e9e4f81c-f720-4896-b3f3-eb904dc24397'::uuid, 'g4-math-hk1-b08'),
        ('73ec2ba0-1c79-4ba1-b09d-7f31d038f483'::uuid, 'g4-math-hk1-b08'),
        ('0a40ee0c-0533-4096-bedd-bdfdba450d31'::uuid, 'g4-math-hk1-b15'),
        ('e58c943b-0262-4244-b87f-2cc9ff29213b'::uuid, 'g4-math-hk1-b21'),
        ('b01bea2a-f00d-427a-887a-95ae0cc3e7ba'::uuid, 'g4-math-hk1-b18'),
        ('c57e591c-f22d-485f-b7a3-696f987527cd'::uuid, 'g4-math-hk1-b17'),
        ('a393807c-04d0-4660-b613-8faa6159e5ac'::uuid, 'g4-math-hk1-b21'),
        ('cf3883b2-84a1-4f92-80ac-770986c03ba6'::uuid, 'g4-math-hk1-b21'),
        ('7ed9036c-0cb2-4996-bad7-3329fa96de4b'::uuid, 'g4-math-hk1-b21'),
        ('33b98f95-d635-4be8-9d31-9553ece2302c'::uuid, 'g4-math-hk1-b19'),
        ('f3c1e507-ea8c-40a0-9b71-2657155e0996'::uuid, 'g4-math-hk1-b24'),
        ('0f50b5cd-9cdf-4cb3-932d-6be5c0e4ae78'::uuid, 'g4-math-hk1-b25'),
        ('dd1fcecf-bd83-41f0-8e24-ede5167d1542'::uuid, 'g4-math-hk1-b25'),
        ('8fc628b5-ee24-4db2-928d-a6b536495362'::uuid, 'g4-math-hk1-b26')
)
UPDATE public.question_templates AS qt
SET lesson = mapping.lesson
FROM phase1_mapping AS mapping
WHERE qt.id = mapping.id
  AND qt.is_active = TRUE
  AND qt.classlevel = 'Lớp 4'
  AND qt.subject = 'Toán'
  AND qt.semester = 'Học kỳ 1';

COMMIT;

-- Audit sau khi chạy: phải trả về 28 dòng, mỗi dòng có lesson khác NULL.
SELECT id, name, classlevel, subject, semester, topic, lesson
FROM public.question_templates
WHERE id IN (
    '981d1ac3-06f5-438e-8b7a-3410cc63d469'::uuid,
    '2e12c19b-efc3-4ab8-ae6e-7d5ad120a4bb'::uuid,
    '2f653ca5-893c-4cdb-9efe-f0995f450fed'::uuid,
    '5fa3511a-2cb6-4f96-a7ea-7d2173edafe7'::uuid,
    '675644ba-d1ae-40c8-ad36-42a7bf1e9b51'::uuid,
    'a7b8d959-c1c9-4a1a-9bc3-b32cd1b61768'::uuid,
    'c5d1d03c-d539-433d-97b6-fee5074722aa'::uuid,
    '2a9f2d2b-eea0-44bd-a8e4-c34819bd58c5'::uuid,
    '5eebc531-e3c0-4b6e-97e5-0c983d2a9f75'::uuid,
    'c2d25199-ddd2-4e0e-84fe-f5d856d71633'::uuid,
    '0cb830c2-3de6-4805-a2e6-19bcd9f1b744'::uuid,
    '93fb31c9-2ef5-421e-a875-8aae79142e4e'::uuid,
    '992f7665-69bd-483e-a993-129e9b26e6da'::uuid,
    '1345aec4-4ad7-47a9-b918-39f8041375cc'::uuid,
    'e9e4f81c-f720-4896-b3f3-eb904dc24397'::uuid,
    '73ec2ba0-1c79-4ba1-b09d-7f31d038f483'::uuid,
    '0a40ee0c-0533-4096-bedd-bdfdba450d31'::uuid,
    'e58c943b-0262-4244-b87f-2cc9ff29213b'::uuid,
    'b01bea2a-f00d-427a-887a-95ae0cc3e7ba'::uuid,
    'c57e591c-f22d-485f-b7a3-696f987527cd'::uuid,
    'a393807c-04d0-4660-b613-8faa6159e5ac'::uuid,
    'cf3883b2-84a1-4f92-80ac-770986c03ba6'::uuid,
    '7ed9036c-0cb2-4996-bad7-3329fa96de4b'::uuid,
    '33b98f95-d635-4be8-9d31-9553ece2302c'::uuid,
    'f3c1e507-ea8c-40a0-9b71-2657155e0996'::uuid,
    '0f50b5cd-9cdf-4cb3-932d-6be5c0e4ae78'::uuid,
    'dd1fcecf-bd83-41f0-8e24-ede5167d1542'::uuid,
    '8fc628b5-ee24-4db2-928d-a6b536495362'::uuid
)
ORDER BY topic, name, id;
