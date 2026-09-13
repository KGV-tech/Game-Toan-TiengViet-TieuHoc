-- Set the Grade 4 Math HK1 Lesson 1 number-to-words matching template to
-- its intended default: four- and five-digit numbers. Admins may still edit it.

UPDATE public.question_templates
SET config = COALESCE(config, '{}'::jsonb) || jsonb_build_object(
    'digits', jsonb_build_array(4, 5),
    'digitWeights', NULL
)
WHERE generator_key = 'number.match_number_words'
  AND classlevel = 'Lớp 4'
  AND subject = 'Toán'
  AND semester = 'Học kỳ 1'
  AND topic = '1. Ôn tập và bổ sung'
  AND lesson = 'g4-math-hk1-b01';
