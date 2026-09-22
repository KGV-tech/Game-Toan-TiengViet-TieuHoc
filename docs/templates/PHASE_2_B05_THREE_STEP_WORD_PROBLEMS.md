# Phase 2 bổ sung — Bài 5: Giải bài toán có ba bước tính

Trạng thái: generator, trình soạn Admin và seed migration đã hoàn tất; seed đã được áp dụng vào project Supabase `bjgbbrufnryrtimtzvhn` ngày 22/09/2026 và audit trả về 14 record active.

## Phạm vi

Bài 5 (`g4-math-hk1-b05`, chủ đề `1. Ôn tập và bổ sung`) có 7 dạng toán, mỗi dạng gồm hai tương tác:

- `word.three_steps_relation_total` — quan hệ hơn/kém rồi tính tổng.
- `word.three_steps_purchase_total` — mua hàng và tính tổng.
- `word.three_steps_divide_compare` — chia nhóm rồi so sánh.
- `word.three_steps_remaining` — thực hiện nhiều lần rồi tìm phần còn lại.
- `word.three_steps_ratio_total` — quan hệ gấp lên/chia ra rồi tính tổng.
- `word.three_steps_legs_constraint` — suy luận số con vật từ tổng số chân.
- `word.three_steps_animal_total` — hơn/kém rồi gấp lên và tính tổng.

Mỗi dạng đăng ký hậu tố `_mcq` và `_fill`, tổng cộng 14 generator key/blueprint. Mỗi lượt sinh một bài toán duy nhất, một đáp án cuối cùng (`partAnswerCounts: [1]`) và lời giải có đủ ba bước. Trắc nghiệm có bốn lựa chọn; điền khuyết có một ô trả lời.

## Tệp triển khai

- Generator: `src/question-templates/grade-4/math/three-step-word-problems.js`
- Registry/browser bundle: `src/question-templates/grade-4/math/index.js`, `index.html`
- Admin editor: `src/main.js`
- Seed idempotent: `supabase/migrations/20260922_question_templates_b05_three_step.sql`
- Contract: `test_b05_three_step_templates.cjs`
- Browser contract: `tests/e2e/b05-templates.spec.cjs`

## Dữ liệu Supabase

Migration chỉ chèn record khi chưa có record active cùng `name`, `lesson` và `generator_key`; không xóa record, không đổi RLS/quyền. Sau khi chạy, truy vấn audit trả về:

```text
lesson             active_count
g4-math-hk1-b05    14
```
