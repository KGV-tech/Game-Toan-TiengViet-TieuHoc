# Phase 3 — Góc và đơn vị đo góc (Bài 7–9)

## Mục tiêu

Phase 3 bổ sung phần còn thiếu của lộ trình Toán 4 Tập 1 cho Chủ đề 2:

- B07 — `g4-math-hk1-b07`: đọc số đo góc trên thước đo góc và dùng đơn vị độ;
- B08 — `g4-math-hk1-b08`: giữ và chuẩn hóa các family phân loại góc đã có;
- B09 — `g4-math-hk1-b09`: ôn tập một dạng góc thống nhất trong mỗi lượt sinh.

Mỗi generator mới sinh bốn câu con. Điểm mặc định là `0,25` cho mỗi câu con;
editor vẫn cho phép chọn 1, 2 hoặc 4 câu con để tổng điểm một template luôn
chia đều.

## Quyết định thiết kế

### Một helper SVG dùng chung

`src/question-templates/grade-4/math/angle-shared.js` là nguồn dùng chung cho
pool số đo, phân loại góc, phương án nhiễu và SVG. Hình được tạo bằng code để:

- không thêm asset bitmap hoặc dependency mới;
- cùng một question có thể hiển thị trong Preview, lúc học sinh làm bài và
  bản in;
- SVG có `role="img"` và nhãn mô tả, không đưa đáp án vào `aria-label`;
- các giá trị cấu hình được kiểm tra ở biên trước khi đưa vào SVG.

### B07 — Đọc số đo góc

Generator `g4-m-angle-measure-read` tạo bốn subquestion dạng `Trắc nghiệm`.
Mỗi subquestion có:

```text
mode: "measure"
degrees: số nguyên bội 5, từ 10 đến 170
visual: SVG thước đo góc
options: 4 chuỗi có ký hiệu °
answer: phương án đúng
```

Mặc định pool là các số đo phù hợp với hình vẽ. Admin có thể giới hạn pool
trong editor bằng ô “Số đo góc được phép”, ví dụ `30, 45, 60, 90`. Cấu hình
không hợp lệ bị từ chối; pool chỉ có một hoặc hai giá trị vẫn được dùng bằng
cách cho phép lặp để luôn đủ bốn câu con.

### B08 — Phân loại góc

Bốn generator cũ được giữ nguyên và đã được mapping về B08:

- `g4-m-angle-count-in-polygon`;
- `g4-m-angle-drag-classify`;
- `g4-m-angle-clock-classify`;
- `g4-m-angle-count-eight-angles`.

Phase 3 không tạo bản ghi trùng cho B08 trong migration vì các template này
đã tồn tại và đã có lesson trong Phase 1.

### B09 — Ôn tập góc

Generator `g4-m-angle-review` nhận `config.modes` (hoặc `config.mode`) như một
pool lựa chọn. Mỗi lượt sinh chọn đúng một mode và lặp mode đó cho cả bốn ý:

```text
mode: measure → cả a, b, c, d đọc số đo góc
mode: classify → cả a, b, c, d phân loại góc
```

Các phương án phân loại luôn chứa đủ bốn nhãn: góc nhọn, vuông, tù, bẹt. Cấu
hình cũ có cả hai mode vẫn tương thích, nhưng không còn được hiểu là trộn
`measure` và `classify` trong một câu.

## Tích hợp code

| Phần | File | Vai trò |
| --- | --- | --- |
| SVG và luật chung | `src/question-templates/grade-4/math/angle-shared.js` | Pool, validate, option, renderer |
| B07 | `src/question-templates/grade-4/math/angle-measure.js` | Sinh 4 câu đọc số đo |
| B09 | `src/question-templates/grade-4/math/angle-review.js` | Chọn một mode rồi sinh 4 ý cùng mode |
| Registry | `src/question-templates/grade-4/math/index.js` | Node/browser generator IDs |
| Browser loading | `index.html` | Nạp helper trước generator |
| Catalog | `src/modules/curriculum.js` | Resolve generator → lesson |
| Admin | `src/main.js` | Option, preset, Preview, cấu hình degree pool |
| Visual UI | `src/style.css` | SVG card, compact desktop/tablet, focus/reduced motion |

`renderQuestion()` chỉ chấp nhận `subquestion.visual` bắt đầu bằng thẻ
`<svg>` trước khi đưa vào DOM. Đây là rào chắn cho dữ liệu generated SVG; các
trường ảnh cũ của két sắt vẫn đi qua nhánh riêng.

## Supabase seed

Migration chuẩn bị trong repo:

`supabase/migrations/20260910_question_templates_phase3_b07_b09.sql`

Migration chỉ insert hai record khi chưa tồn tại:

- `Bài 7 · Đọc số đo góc trên thước đo` → `g4-math-hk1-b07`;
- `Bài 9 · Ôn tập góc` → `g4-math-hk1-b09`.

Migration chạy trong transaction, có `NOT EXISTS`, không `DELETE`, không thay
đổi RLS/quyền và không tạo B05. File mới chỉ được apply vào project Supabase
live sau khi có xác nhận riêng của người dùng.

## Kiểm thử và quality gate

- `node test_phase3_grade4_templates.cjs`: 24 seed cho B07 và 24 seed cho B09,
  gồm kiểm tra answer/options, metadata, mode, bounds và SVG accessibility;
- `node test_phase3_ui_contract.cjs`: registry, script loading, lesson mapping
  và migration safety;
- `tests/e2e/phase3-angle-templates.spec.cjs`: Preview và gameplay B07 ở
  `1440×900`, Preview B09 ở `1024×768`, keyboard focus và reduced motion.

Phase 3 vẫn là branch/repo work cho tới khi seed live được duyệt; không dùng
generator mới cho học sinh trước khi hai record seed đã có trong dữ liệu thật
hoặc có fallback template tương ứng.
