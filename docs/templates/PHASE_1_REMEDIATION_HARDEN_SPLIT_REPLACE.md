# Phase 1 remediation — HARDEN / TÁCH / THAY

> Trạng thái: đã triển khai và audit live ngày 10/09/2026.
> Migration: `supabase/migrations/20260910_question_templates_harden_split_replace.sql`.
> Project Supabase: `bjgbbrufnryrtimtzvhn`.

## Mục tiêu

Xử lý 17 template active còn thiếu `lesson` mà không gán metadata suy đoán:

- HARDEN các template có kỹ năng rõ nhưng config còn rộng.
- TÁCH các template trộn nhiều Bài học hoặc trộn phép cộng/trừ.
- THAY/loại khỏi pool học thuật các template không bám nội dung SGK.
- Giữ khả năng rollback bằng `is_active = false`; không xoá vật lý.
- Không tạo hoặc gán B05 theo quyết định đã duyệt.

## Mapping đã thực thi

| Nhóm | Kết quả | Phạm vi |
| --- | --- | --- |
| HARDEN B11 | Gắn `g4-math-hk1-b11` | 3 template số có nhiều chữ số, giới hạn 100 000–999 999; chữ số theo hàng mở tới trăm nghìn. |
| HARDEN B12 | Gắn `g4-math-hk1-b12` | Đối chiếu số với cách đọc, giữ dải 7–9 chữ số và thêm scope B12. |
| HARDEN B14 | Gắn `g4-math-hk1-b14` | Bé nhất, lớn nhất, so sánh dạng tổng; giới hạn 100 000–999 999 999. |
| HARDEN B15 | Gắn `g4-math-hk1-b15` | Dãy số tự nhiên; giới hạn 0–999 999. |
| HARDEN B16 | Gắn `g4-math-hk1-b16` | Hai template bốn phép tính giữ ở dạng review, có `reviewLessons` B10–B15 và dải 6–9 chữ số. |
| HARDEN B19 | Gắn `g4-math-hk1-b19` | Đổi đơn vị thời gian chỉ còn dạng đổi phút/giây đã xác minh. |
| THAY / archive | `is_active = false` | Mật khẩu két sắt không nằm trong pool học thuật; giữ record để có thể phục hồi cho mini-game. |
| TÁCH B22/B23 | 10 seed active mới | Mỗi family Topic 5 có biến thể phép cộng B22 và phép trừ B23; 5 record trộn cũ được archive mềm. |

## Quyết định nội dung

- `Bài 5 — Giải bài toán có ba bước tính` (`g4-math-hk1-b05`) không tạo, không gắn và không đưa vào review.
- Các template Topic 5 cũ được giữ lại trong database nhưng inactive sau khi variant thay thế đã tồn tại.
- `config.operation` dùng `+` hoặc `-`; generator Topic 5 chuẩn hoá dấu trừ Unicode `−` về `-` khi lọc ngữ cảnh.
- Editor Admin có selector phép tính để khi sửa/lưu template không làm mất scope B22/B23.

## Kết quả audit live

| Kiểm tra | Kết quả |
| --- | ---: |
| Active template toàn bảng | 57 |
| Active template thiếu `lesson` | 0 |
| Active record B05 | 0 |
| Active variant B22 | 5 |
| Active variant B23 | 5 |
| Active template mật khẩu két sắt | 0 |
| Record Topic 5 cũ còn active | 0 |
| Record Topic 5 cũ đã archive mềm | 5 |

Các truy vấn đối soát đã trả về nhóm B22 `operation = +`, 5 record và nhóm B23 `operation = -`, 5 record.

## Rollback an toàn

Không chạy rollback theo tên nếu chưa kiểm tra ID. Khi cần khôi phục:

1. Đọc các ID seed B22/B23 và trạng thái cũ bằng truy vấn chi tiết.
2. Archive đúng các ID seed mới bằng `is_active = false`.
3. Reactivate đúng 5 UUID Topic 5 cũ và/hoặc UUID mật khẩu két sắt nếu đó là quyết định được duyệt.
4. Chạy lại audit `active_missing_lesson` và kiểm tra dependency trước khi bật lại.

Migration không dùng `DELETE`, không đổi RLS/quyền và không động vào dữ liệu đề/câu hỏi đang tham chiếu. Kiểm tra dependency trước migration cho thấy các bảng `game_exams`, `game_questions`, `team_competition_answers` và `team_competition_questions` không có bản ghi trực tiếp tham chiếu template.

## Kiểm thử repo

- `node test_hardened_generator_contract.cjs`
- `node test_template_remediation_contract.cjs`
- `node test_topic5_question_templates.cjs`
- `node --check src/main.js`

Các bước test đầy đủ Node/Playwright vẫn là quality gate trước commit/push theo `docs/AI_WORKFLOW.md`.
