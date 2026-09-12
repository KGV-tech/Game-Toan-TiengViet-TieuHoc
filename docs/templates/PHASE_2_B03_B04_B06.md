# Phase 2 — Bài 3, Bài 4 và ôn tập Bài 6

> Trạng thái: **Đã triển khai, seed và audit live trong đúng Supabase project**.
> Cập nhật: 10/09/2026

## Phạm vi đã duyệt

Phase 2 tiếp tục sau mapping trực tiếp Phase 1. Phạm vi nội dung gồm:

- Bài 3 — Số chẵn, số lẻ.
- Bài 4 — Biểu thức chứa chữ.
- Bài 6 — Luyện tập chung, chỉ ôn các kỹ năng Bài 1–4.
- Bài 5 — Giải bài toán có ba bước tính: **tạm hoãn**, không tạo generator, không seed record và không gắn vào review.

Mỗi record mới đều gắn đúng một `lesson` cấp cao nhất. `config.lesson` chỉ được dùng như fallback tương thích ở tầng cũ; migration Phase 2 không ghi trường này.

## Generator và record seed

| Lesson | Generator key | Loại | Nội dung |
| --- | --- | --- | --- |
| `g4-math-hk1-b03` | `number.even_odd_classify` | Trắc nghiệm | Nhận biết số chẵn/lẻ theo chữ số tận cùng |
| `g4-math-hk1-b03` | `number.even_odd_count` | Trắc nghiệm | Đếm số chẵn/lẻ trong dãy không lặp |
| `g4-math-hk1-b03` | `number.even_odd_sequence` | Trắc nghiệm | Tìm số tiếp theo trong dãy có bước nhảy chẵn |
| `g4-math-hk1-b03` | `number.even_odd_form` | Trắc nghiệm | Lập số từ các thẻ số rồi nhận biết chẵn/lẻ |
| `g4-math-hk1-b04` | `number.variable_expression_value` | Điền khuyết | Thay `a` vào bốn biểu thức và điền giá trị |
| `g4-math-hk1-b04` | `number.variable_expression_choice` | Trắc nghiệm | Chọn giá trị đúng của biểu thức chứa chữ |
| `g4-math-hk1-b06` | `number.hk1_review_b01_b04` | Trắc nghiệm | Chọn một skill trong phạm vi B01–B04 rồi dùng thống nhất cho bốn ý |

Tất cả generator mới:

- trả đúng bốn ý, `partAnswerCounts: [1, 1, 1, 1]`;
- tạo phương án không trùng và đáp án luôn nằm trong phương án;
- trả giải thích theo dữ liệu vừa sinh;
- chạy độc lập với DOM, Supabase và `window`;
- đặt metadata mặc định là `Lớp 4 / Toán / Học kỳ 1 / 1. Ôn tập và bổ sung`.

## Quy tắc cấu hình chính

### Bài 3

- Phạm vi mặc định: `0–9 999`.
- Dãy đếm mặc định có `6–8` phần tử, không lặp.
- Bước dãy chỉ là số nguyên dương chẵn, mặc định `2, 4, 6`.
- Lập số dùng `3` hoặc `4` thẻ chữ số khác nhau; bộ thẻ có cả chữ số chẵn và lẻ.

### Bài 4

- `a` mặc định trong `10–99`.
- Hằng số mặc định trong `2–9`.
- Phép cộng, trừ, nhân và chia hết có thể chọn trong editor.
- Phép trừ không tạo kết quả âm; phép chia luôn tạo thương nguyên.

### Bài 6

`config.skills` là một pool các skill được phép (`b01`–`b04`). Mỗi lượt sinh
chọn một skill trong pool rồi dùng thống nhất cho cả bốn ý a–d; không trộn bốn
loại bài vào cùng một câu. Cấu hình cũ chứa đủ bốn mã vẫn tương thích, nhưng
không còn được hiểu là thứ tự bốn ý. Giá trị rỗng hoặc ngoài allowlist bị từ
chối. Vì Bài 5 đang hoãn nên review không có nhánh fallback sang Bài 5.

## Tích hợp Admin Soạn Đề

`src/main.js` đã có:

- lựa chọn bảy generator Phase 2 trong Kho Template;
- preview live cho từng dạng;
- hướng dẫn biến `{question}` và `{skills}`;
- panel cấu hình riêng cho Bài 3/Bài 4;
- lưu `lesson` cấp cao nhất và không rơi về config số tổng quát;
- kiểm tra phạm vi, phép tính, bước dãy, dạng chẵn/lẻ trước khi lưu.

Các script generator được nạp trước registry trong `index.html`; registry Node và browser dùng cùng contract.

## Supabase migration

File triển khai:

```text
supabase/migrations/20260909_question_templates_phase2_b03_b04_b06.sql
```

Migration dùng `WHERE NOT EXISTS` trên khóa tự nhiên gồm tên, metadata lesson và generator nên có thể chạy lại. Migration chỉ `INSERT` bảy record mới; không update/delete record cũ, không thay RLS/quyền và không chứa mã Bài 5.

Chạy file trong SQL Editor của đúng project Supabase sau khi kiểm tra preview. Repo này không tự nhận migration remote đã được apply.

## Kiểm thử đã có

- `test_phase2_grade4_templates.cjs`: registry, metadata, đáp án, phương án, config lỗi, 50 seed và migration.
- `test_phase2_ui_contract.cjs`: script load, preset, editor config và rào chắn Bài 5.
- `tests/e2e/phase2-templates.spec.cjs`: Admin editor ở 1440×900, lesson, preview và đổi Bài 3 → Bài 4.

Checkpoint Phase 2 đã đạt: preview/contract trong repo đạt và audit live xác nhận
đủ bảy record active với đúng `lesson`. B05 vẫn có 0 record. Các record cũ
deferred vẫn chưa archive/tách tự động; chỉ xử lý cùng variant thay thế và
dependency check của phase tương ứng.
