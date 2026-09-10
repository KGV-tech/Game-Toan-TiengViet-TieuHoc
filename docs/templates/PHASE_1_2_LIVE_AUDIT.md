# Audit live Phase 1 và Phase 2 — Template Toán 4

> Ngày xác minh: **10/09/2026**
> Project: `bjgbbrufnryrtimtzvhn`
> Phạm vi: `public.question_templates`; migration remediation đã được chạy trong SQL Editor sau khi kiểm tra dependency.

> Mốc trước remediation: 53 active, 17 active chưa có `lesson`. Mốc sau remediation được ghi dưới đây.

## Kết quả sau remediation HARDEN/TÁCH/THAY

| Kiểm tra | Kết quả |
| --- | ---: |
| Template active hiện có | 57 |
| Mapping Phase 1 thuộc nhóm lesson đã duyệt | 28 |
| Template Phase 2 tìm thấy | 7 |
| Template Phase 2 đang active | 7 |
| Record/ tên thuộc Bài 5 | 0 |
| Template active chưa có `lesson` | 0 |
| Foreign key trực tiếp trỏ vào `question_templates` | 0 |
| Variant B22 active | 5 |
| Variant B23 active | 5 |
| Record Topic 5 cũ còn active | 0 |
| Template mật khẩu két sắt còn active | 0 |

### Phase 1

Migration `20260909_question_templates_lesson.sql` và
`20260909_question_templates_phase1_lesson_mapping.sql` đã có hiệu lực trong
project: nhóm 28 record được duyệt đã có `lesson` cấp cao nhất theo manifest.

Migration `20260910_question_templates_harden_split_replace.sql` đã xử lý 17
record còn lại theo mapping đã duyệt: HARDEN B11/B12/B14/B15/B16/B19, archive
mềm challenge mật khẩu két sắt, và seed 10 variant B22/B23 trước khi archive
5 record Topic 5 trộn cộng/trừ. Kết quả live xác nhận không còn active template
thiếu `lesson`.

### Phase 2

Migration `20260909_question_templates_phase2_b03_b04_b06.sql` đã được seed
idempotent. Bảy generator hiện diện và active:

- B03: `number.even_odd_classify`, `number.even_odd_count`,
  `number.even_odd_sequence`, `number.even_odd_form`;
- B04: `number.variable_expression_value`,
  `number.variable_expression_choice`;
- B06: `number.hk1_review_b01_b04`.

B05 không được tạo, không được gắn vào review và vẫn giữ đúng quyết định tạm
hoãn.

## Quyết định cleanup

- Đã cleanup trạng thái bàn giao Phase 1/2 trong repo và checklist.
- Không xoá vật lý record cũ.
- Các record thay thế chỉ được archive sau khi seed variant mới và dependency
  check trả về 0 bản ghi tham chiếu trực tiếp.
- Archive đều là `is_active=false`; không có `DELETE`, không đổi RLS/quyền.
- B05 vẫn chưa tạo, chưa gắn và chưa đưa vào review.

## Truy vấn đối soát tối thiểu

Các truy vấn đã dùng chỉ đọc metadata, không đọc answer key:

```sql
SELECT COUNT(*) FILTER (WHERE is_active) AS active_total,
       COUNT(*) FILTER (
         WHERE is_active AND NULLIF(BTRIM(lesson), '') IS NULL
       ) AS active_without_lesson
FROM public.question_templates;

SELECT generator_key, lesson
FROM public.question_templates
WHERE generator_key IN (
  'number.even_odd_classify',
  'number.even_odd_count',
  'number.even_odd_sequence',
  'number.even_odd_form',
  'number.variable_expression_value',
  'number.variable_expression_choice',
  'number.hk1_review_b01_b04'
)
ORDER BY generator_key;
```

Truy vấn đối soát remediation:

```sql
SELECT
  count(*) FILTER (WHERE is_active) AS active_total,
  count(*) FILTER (WHERE is_active AND lesson IS NULL) AS active_missing_lesson,
  count(*) FILTER (WHERE is_active AND lesson = 'g4-math-hk1-b05') AS active_b05,
  count(*) FILTER (WHERE is_active AND name LIKE 'Bài 22 ·%') AS active_b22_variants,
  count(*) FILTER (WHERE is_active AND name LIKE 'Bài 23 ·%') AS active_b23_variants
FROM public.question_templates;
```

## Addendum sau remediation ngày 10/09/2026

Snapshot đầu file là mốc trước khi xử lý nhóm HARDEN/TÁCH/THAY. Migration
`20260910_question_templates_harden_split_replace.sql` đã chạy thành công trong
project và trả về:

| Kiểm tra | Kết quả |
| --- | ---: |
| Active template toàn bảng | 57 |
| Active template thiếu `lesson` | 0 |
| Active B05 | 0 |
| Active B22 / phép cộng | 5 |
| Active B23 / phép trừ | 5 |
| Topic 5 cũ còn active | 0 |
| Challenge mật khẩu két sắt còn active | 0 |

Dependency check trước archive trả về 0 bản ghi trực tiếp tại `game_exams`,
`game_questions`, `team_competition_answers` và `team_competition_questions`.
Các record cũ được archive mềm, không `DELETE`; B05 vẫn chưa tạo theo duyệt.
