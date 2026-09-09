# Hệ thống Template câu hỏi — Toán lớp 4

> Trạng thái: **Phase 2 đã triển khai trong repo / chờ preview và apply migration**
> Cập nhật: 09/09/2026
> Phạm vi tài liệu: kiến trúc, dữ liệu, generator, Supabase, lộ trình nội dung và kế hoạch thay mới toàn bộ Template.

## 1. Mục đích và cổng duyệt

Template là một phần lõi của game: nó vừa cung cấp câu hỏi cho học sinh, vừa là nguồn để Admin tự động dựng Đề Kiểm tra. Vì vậy việc thay Template phải được làm theo từng lát nhỏ, có dữ liệu kiểm chứng và có thể quay lại bản cũ.

Tài liệu này là hồ sơ thiết kế trước khi triển khai. Trong lượt tạo tài liệu này:

- Đã lập kiến trúc và lộ trình đề xuất.
- Không xoá hoặc sửa hàng loạt Template cũ trong Supabase.
- Phase 2 đã thêm các generator mới cho B03, B04 và blueprint review B06 trong repo; migration seed vẫn chờ người dùng apply.
- Migration thêm trường `lesson` đã có trong repo từ công việc trước, nhưng chưa được apply vào Supabase production.
- Không tạo B05: family bài toán ba bước vẫn bị hoãn theo yêu cầu người dùng.

Nguyên tắc duyệt:

```text
Đặc tả → Kiểm kê → Pha nội dung nhỏ → Test/preview → Người dùng duyệt
       → Pha tiếp theo → Migration dữ liệu đã duyệt → Bàn giao
```

## 2. Nguồn nội dung và thứ tự ưu tiên

### 2.1. Nguồn được dùng

| Ưu tiên | Nguồn | Vai trò |
| --- | --- | --- |
| 1 | SGK Toán 4 Tập 1: `D:\LỆ HOA\SGK SGV 2026 Full\LOP 04\Sách giáo khoa\SGK - Toán 4 - Tập 1.pdf` | Xác định thứ tự Bài học, khái niệm bắt buộc, phạm vi kiến thức và cách diễn đạt chính. |
| 2 | Vở bài tập Toán 4 Tập 1: `D:\LỆ HOA\SGK tạm\Vo-bai-tap-Toan-4-Tap-1-111-trang.pdf` | Tham khảo dạng bài, nhịp độ luyện tập, ngữ cảnh và dạng tương tác phù hợp để biến thành câu hỏi game. |
| 3 | `src/modules/constants.js` | Nguồn mã định danh ổn định của Chủ đề/Bài học mà code đang dùng. |
| 4 | `docs/TEMPLATE_GENERATOR_SPEC.md` | Hợp đồng runtime hiện tại: 4 ý, chấm điểm, config, chống lặp, registry và test. |
| 5 | Bản ghi `question_templates` trong Supabase | Metadata có thể chỉnh bởi Admin; không được xem là nguồn chân lý của chương trình học. |

Hai PDF được gửi ở dạng scan nên không thể dùng trích xuất text tự động làm nguồn duy nhất. Khi tạo Template, nội dung phải được đối chiếu trực quan với SGK/VBT và có người duyệt preview.

Tập tài liệu hiện có cung cấp đầy đủ căn cứ cho HK1. Danh mục HK2 đã có trong `constants.js`, nhưng chưa có SGK/VBT Tập 2 trong lượt này; không nên tạo hàng loạt Template HK2 mới chỉ bằng cách đoán theo tên bài.

### 2.2. Quy tắc nội dung

1. `Bài học` là phạm vi nhỏ nhất để một Template hoạt động. Template hoạt động phải gắn đúng **một** `lesson`.
2. `Luyện tập chung` vẫn là một Bài học hợp lệ. Nó có thể trộn các kỹ năng đã học trong đúng cụm trước đó, nhưng phải mang `lesson` của chính bài luyện tập chung.
3. Không dùng một Template “toàn Chủ đề” để đại diện cho nhiều bài nếu generator có thể tách được.
4. Không đưa kiến thức của bài sau vào bài trước chỉ vì cùng một Chủ đề.
5. Bài toán có lời văn phải giới hạn phép tính, đơn vị và số liệu theo Bài học; không chỉ đổi câu chữ của một generator tổng quát.
6. Dạng tương tác nhiều màu là lớp trình bày; đáp án và phạm vi kiến thức vẫn phải tuân theo SGK.

## 3. Mô hình khái niệm

Có ba lớp thường bị gọi chung là “template”; phải phân biệt chúng:

| Lớp | Ví dụ | Trách nhiệm |
| --- | --- | --- |
| Generator | `number.digit_at_place` | Code sinh dữ liệu ngẫu nhiên, câu hỏi, đáp án, giải thích và metadata render. |
| Template record | “Nhận biết chữ số theo hàng — Bài 11” | Một cấu hình cụ thể lưu ở Supabase: Bài học, loại câu, prompt và `config`. |
| Đề/Câu hỏi | Bản câu hỏi đã sinh | Dữ liệu nội dung dùng để học sinh làm hoặc Admin chỉnh trước khi lưu Đề. |

Một generator có thể được tái sử dụng cho nhiều Bài học nếu config và phạm vi số phù hợp, nhưng mỗi record Template phải khai báo Bài học cụ thể. Nếu semantics khác nhau đáng kể, tạo generator/family mới thay vì kéo một config tổng quát quá xa.

## 4. Mô hình dữ liệu hiện tại và mục tiêu

### 4.1. Bản ghi `question_templates`

Schema hiện tại trong `supabase_question_templates.sql` gồm các trường chính:

```text
id              UUID             khoá bản ghi Supabase
name            TEXT             tên hiển thị trong Kho Template
classlevel      TEXT             ví dụ “Lớp 4”
subject         TEXT             “Toán” hoặc “Tiếng Việt”
semester        TEXT             “Học kỳ 1” hoặc “Học kỳ 2”
topic           TEXT             Chủ đề hiển thị, ví dụ “3. Số có nhiều chữ số”
lesson         TEXT nullable     mã Bài học chuẩn, ví dụ g4-math-hk1-b11
question_type   TEXT             loại renderer/chấm điểm
generator_key   TEXT             mã phải có trong registry
prompt_template TEXT             câu dẫn có biến được cho phép
config          JSONB            tham số generator
is_active       BOOLEAN          bật/tắt record
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

`lesson` là trường chuẩn mới ở cấp bản ghi. Trong thời gian tương thích dữ liệu cũ, `config.lesson` vẫn được đọc như fallback; khi lưu từ Admin, `lesson` cấp cao nhất là giá trị chuẩn và `config.lesson` chỉ được giữ để không làm hỏng dữ liệu cũ.

Định dạng `lesson` phải là ID trong `lessonCatalog`, không phải nhãn tự do:

```text
g4-math-hk1-b01
g4-math-hk1-b02
...
g4-math-hk2-b73
```

Mã này được đổi sang nhãn và trang sách ở frontend bằng `app.curriculum`. Không lưu “Bài 1” hoặc tên viết tay làm định danh chính.

### 4.2. Trạng thái chuyển tiếp hiện tại

- `src/modules/curriculum.js` đã hỗ trợ đọc `template.lesson`, fallback `template.config.lesson`, rồi mới suy luận một số generator cũ bằng `templateLessonRules`.
- `src/main.js` đã ghi `lesson` cấp cao nhất khi Admin lưu Template và giữ metadata legacy trong `config`.
- `supabase/migrations/20260909_question_templates_lesson.sql` thêm cột/index và sao chép các `config.lesson` rõ ràng.
- Migration không thay RLS, quyền hoặc API key; chưa được thực thi trên remote.
- Generator cũ không có metadata Bài học vẫn có thể hiển thị nhờ suy luận tạm thời. Đây không phải trạng thái đích.

### 4.3. Trạng thái đích

Mọi Template `is_active = true` phải thỏa:

```text
classlevel = Lớp 4
subject    = Toán
semester   khớp lesson
topic      = topic của lesson
lesson     = đúng một lesson ID
generator  = có trong registry
config     = hợp lệ với generator
```

Template cũ quá rộng không bị xoá ngay. Sau khi có bản thay thế và kiểm tra các nơi đang dùng, record cũ được chuyển `is_active = false` để bảo toàn lịch sử và khả năng rollback. Xoá vật lý chỉ là quyết định riêng, không nằm trong migration mặc định.

## 5. Luồng chạy end-to-end

```text
SGK/VBT
  ↓ kiểm chứng phạm vi
lessonCatalog (constants.js)
  ↓ chọn mã Bài học
Template record trong Supabase
  ↓ lọc class/subject/semester/topic/lesson
generator registry (math/index.js)
  ↓ generator_key + config + random
generated question
  ├─ q / ans / explanation
  ├─ templateVariables / metadata render
  └─ partAnswerCounts
  ↓
Admin Soạn Đề: preview → chỉnh → lưu Đề
  ↓
Học sinh: renderer → nhập đáp án → chấm điểm
```

### 5.1. Khi Admin chọn Bài học

1. Chọn lớp, môn, kỳ.
2. UI chỉ hiển thị Chủ đề thuộc kỳ đó.
3. Chọn Chủ đề thì hiện danh sách Bài học con.
4. Chọn Bài học thì lọc Template và Câu hỏi đúng Bài học đó.
5. Card Template phải hiển thị rõ: tên, loại tương tác, số biến, phạm vi kiến thức, trạng thái và nút preview.
6. Khi tạo Đề tự động, bộ lọc Bài học được truyền vào pool; không lấy câu của Bài học khác chỉ vì cùng Chủ đề.

### 5.2. Khi học sinh làm bài

Giao diện học sinh hiện tại vẫn giữ luật gameplay theo Chủ đề. Bài học là metadata authoring/filtering, không tự động biến thành một màn hình học sinh mới nếu chưa có yêu cầu riêng.

## 6. Hợp đồng generator

Registry hiện tại ở `src/question-templates/grade-4/math/index.js` gọi generator theo dạng:

```js
generateQuestion(templateId, config = {}, random = Math.random)
```

Generator hợp lệ phải trả về tối thiểu:

```js
{
  type: 'Trắc nghiệm',
  q: '...',
  ans: '...',
  explanation: '...',
  templateVariables: { question: '...' },
  partAnswerCounts: [1, 1, 1, 1]
}
```

Quy tắc bắt buộc:

- Mặc định tạo đúng 4 ý a–d, mỗi ý 0,25 điểm; nếu có ngoại lệ phải khai báo `partAnswerCounts` và được duyệt riêng.
- `ans` phải cùng thứ tự với renderer và `partAnswerCounts`.
- Dữ liệu ngẫu nhiên phải nằm trong phạm vi config, không tạo đáp án vô nghiệm, không trùng nội dung trong cùng một lần sinh.
- Mỗi lần gọi với random/seed hợp lệ phải tái lập được trong test.
- Giải thích phải khớp đáp án thực tế, không chỉ là câu placeholder.
- HTML trong `q` phải là fragment an toàn do code kiểm soát; text người dùng ở prompt/metadata phải được sanitize khi render.
- Không phụ thuộc DOM, Supabase hoặc `window` trong generator; generator phải chạy được bằng Node contract test.
- Config thiếu hoặc sai phải trả lỗi rõ ràng ở validation, không âm thầm rơi về một phạm vi rộng hơn.

### 6.1. Các renderer cần được coi là hợp đồng

| Loại | Dạng mong đợi | Kiểm thử tối thiểu |
| --- | --- | --- |
| Trắc nghiệm | 4 lựa chọn, một đáp án đúng | Không trùng lựa chọn, đáp án tồn tại. |
| Điền khuyết | 4 ô/ý, đáp án theo thứ tự | Không có ô không chấm được, không nhầm đơn vị. |
| Đúng/Sai | 4 nhận định độc lập | `ans` có đúng 4 giá trị, giải thích từng nhận định. |
| So sánh | 4 dòng với `<`, `>`, `=` | Tính lại hai vế, không so sánh chuỗi. |
| Đối chiếu | 4 cặp đúng và distractor theo contract | Không có hai cặp cùng nhãn gây mơ hồ. |
| Kéo thả/đồ họa | Hình + vùng tương tác | Keyboard fallback, focus, đáp án không phụ thuộc pixel. |
| Bài toán | Dữ kiện → phép tính → kết quả | Số liệu nằm trong phạm vi bài và lời giải có bước. |

Các quy tắc chi tiết 4 ý, matching, chuỗi, đơn vị đo và chấm điểm vẫn kế thừa `docs/TEMPLATE_GENERATOR_SPEC.md`; khi có khác biệt, phải cập nhật spec trước khi thay generator.

## 7. Quy ước cấu hình và version

### 7.1. Config

`config` chỉ chứa tham số nghiệp vụ của generator, ví dụ:

```json
{
  "minimum": 10000,
  "maximum": 99999,
  "allowedPlaces": ["hundreds", "thousands"],
  "difficulty": "core",
  "seed": null
}
```

Không nhúng nhãn Bài học tự do vào config mới; dùng `lesson` cấp record. Những config cũ có `lesson` chỉ tồn tại để backward compatibility và sẽ được làm sạch sau migration có kiểm chứng.

Mỗi generator/family mới cần manifest mô tả:

```text
generator_key
question_type
lesson_scope
config schema + default
prompt variables
answer shape
preview variant
known limitations
```

### 7.2. Identity và phiên bản

Hiện tại DB có UUID `id` và `generator_key`, chưa có `template_code`/`version` riêng. Giai đoạn đầu sẽ dùng manifest trong code + bộ khóa tự nhiên `lesson + generator_key + name` để kiểm kê. Việc thêm `template_code`, `generator_version` hoặc unique constraint là một quyết định schema riêng, chỉ làm sau khi kiểm tra dữ liệu thật và được duyệt.

Generator có thay đổi semantics phải tạo key mới hoặc version rõ ràng; không thay đổi âm thầm generator cũ vì nó có thể đang phục vụ gameplay và các Đề đã lưu.

## 8. Kiểm kê hiện trạng và các điểm cần xây lại

Registry hiện có **40 ID, bao gồm alias**, tập trung trong các nhóm:

- Số và giá trị hàng: chữ số theo hàng, lập số, dạng khai triển, số liền trước/sau, dãy số, so sánh, đọc số, Đúng/Sai.
- Bốn phép tính và các dạng điền/so sánh/biểu thức.
- Đơn vị khối lượng, diện tích, thời gian, thế kỉ, đối chiếu và bài toán đơn vị.
- Cộng/trừ nhiều chữ số, tính chất, tổng-hiệu và bài toán.
- Góc: đếm góc, kéo thả phân loại, đồng hồ, hình có tám góc.

Các lỗ hổng hoặc mapping đang quá rộng cần xử lý trong rebuild:

| Khu vực | Hiện trạng | Hướng xử lý |
| --- | --- | --- |
| Bài 1–2 | Một số generator số và bốn phép tính đang dùng chung Chủ đề hoặc suy luận bằng key. | Tách record theo Bài 1/Bài 2, giới hạn phạm vi số/phép tính và đổi tên rõ. |
| Bài 3 | Đã có family riêng trong Phase 2: phân loại, đếm, dãy và lập số. | Tiếp tục preview/seed; kiểm tra thêm khi có dữ liệu Admin thật. |
| Bài 4 | Đã có generator thay giá trị và chọn giá trị biểu thức chứa chữ. | Tiếp tục preview/seed; không mở rộng sang semantics ngoài SGK. |
| Bài 5 | Chưa triển khai theo yêu cầu người dùng. | Tạm hoãn generator bài toán ba bước, không seed hoặc gắn vào review. |
| Bài 6 | Đã có blueprint review B01–B04 trong Phase 2. | Giữ đúng bốn kỹ năng đã học, không trộn nội dung B05. |
| Bài 7 | Các generator góc hiện tại chủ yếu bị suy luận về Bài 8. | Bổ sung đo góc/đơn vị độ và tách Bài 7 khỏi Bài 8. |
| Bài 9 | Chưa có review góc riêng. | Tạo pool review Bài 9. |
| Bài 10, 12, 13 | Thiếu số sáu chữ số/1 000 000, lớp triệu, làm tròn trăm nghìn. | Thêm generator đúng từng kỹ năng. |
| Bài 14–16 | Có generator phù hợp nhưng một số record đang rộng hoặc tên chưa nói rõ Bài học. | Tạo record hẹp theo so sánh, dạng số, dãy và review. |
| Bài 17–21 | Có phần đổi đơn vị nhưng thiếu thực hành/trải nghiệm và review được phân định rõ. | Tách khối lượng, diện tích, thời gian/thế kỉ, thực hành, review. |
| Bài 22–26 | Nhiều generator cộng/trừ tổng quát đang dồn vào Bài 26. | Tách cộng, trừ, tính chất, tổng-hiệu và luyện tập chung. |
| Bài 27–32 | Chưa có generator cho vuông góc, song song, hình bình hành/hình thoi. | Xây family hình học có SVG/keyboard fallback và bài thực hành. |
| Bài 33–37 | Chưa có bộ ôn tập HK1 theo mảng kiến thức. | Tạo các pool review có trọng số và nhãn kỹ năng. |
| HK2 | `templateLessonRules` hiện chưa có mapping HK2; tài liệu Tập 2 chưa được cung cấp trong lượt này. | Kiểm kê riêng, chỉ tạo sau khi đối chiếu SGK/VBT Tập 2. |

## 9. Ma trận phủ nội dung HK1 đề xuất

Đây là **family đề xuất**, chưa phải lệnh tạo dữ liệu. Mỗi dòng sau này có thể có nhiều Template record theo mức độ/config, nhưng phải cùng một Bài học.

### Giai đoạn nội dung A — Ôn tập và bổ sung

| Lesson | Family đề xuất |
| --- | --- |
| B01 `g4-math-hk1-b01` | Xác định chữ số/hàng; đọc–viết số đến 100 000; dạng khai triển; số liền trước/sau; so sánh cơ bản. |
| B02 `g4-math-hk1-b02` | Cộng/trừ trong 100 000; nhân/chia trong phạm vi đã học; biểu thức nhiều bước; bài toán thực tế; Đúng/Sai phép tính. |
| B03 `g4-math-hk1-b03` | Phân loại chẵn/lẻ; đếm số chẵn/lẻ trong đoạn; dãy chẵn/lẻ; lập số chẵn/lẻ từ thẻ số. |
| B04 `g4-math-hk1-b04` | Thay giá trị vào biểu thức chứa chữ; tính giá trị; chọn biểu thức đúng; so sánh giá trị đơn giản. |
| B05 `g4-math-hk1-b05` | Tạm hoãn theo duyệt của người dùng; chưa tạo generator/record. |
| B06 `g4-math-hk1-b06` | Review có nhãn kỹ năng của B01–B04; không sinh nội dung vượt quá cụm này. |

### Giai đoạn nội dung B — Góc và đơn vị đo góc

| Lesson | Family đề xuất |
| --- | --- |
| B07 `g4-math-hk1-b07` | Đọc số đo góc bằng thước đo góc; nhận biết đơn vị độ; chọn/đối chiếu số đo. |
| B08 `g4-math-hk1-b08` | Phân loại góc nhọn, vuông, tù, bẹt; phân loại trên đồng hồ; kéo thả nhãn góc. |
| B09 `g4-math-hk1-b09` | Review B07–B08 theo hình, số đo và phân loại. |

### Giai đoạn nội dung C — Số có nhiều chữ số

| Lesson | Family đề xuất |
| --- | --- |
| B10 `g4-math-hk1-b10` | Lập/đọc số sáu chữ số; số 1 000 000; giá trị chữ số. |
| B11 `g4-math-hk1-b11` | Hàng và lớp; xác định chữ số theo hàng/lớp; dạng khai triển theo lớp. |
| B12 `g4-math-hk1-b12` | Đọc, viết, phân tích số trong phạm vi lớp triệu; số 0 ở giữa các lớp. |
| B13 `g4-math-hk1-b13` | Làm tròn đến hàng trăm nghìn; chọn số gần nhất; Đúng/Sai quy tắc làm tròn. |
| B14 `g4-math-hk1-b14` | So sánh số nhiều chữ số; lập số lớn/nhỏ; so sánh dạng số và dạng khai triển. |
| B15 `g4-math-hk1-b15` | Số tự nhiên; số liền trước/sau; dãy tăng/giảm đều; điền số còn thiếu. |
| B16 `g4-math-hk1-b16` | Review B10–B15, mỗi câu ghi rõ kỹ năng để sinh đề có cân đối. |

### Giai đoạn nội dung D — Một số đơn vị đo đại lượng

| Lesson | Family đề xuất |
| --- | --- |
| B17 `g4-math-hk1-b17` | Đổi và so sánh yến, tạ, tấn; chọn đơn vị phù hợp; bài toán khối lượng. |
| B18 `g4-math-hk1-b18` | Đổi dm², m², mm²; so sánh diện tích; hình lưới/ô vuông nếu renderer hỗ trợ. |
| B19 `g4-math-hk1-b19` | Giây; mốc thời gian; thế kỉ; xác định thế kỉ của năm; đổi/so sánh phù hợp. |
| B20 `g4-math-hk1-b20` | Chọn đơn vị trong ngữ cảnh thực tế; ước lượng; đọc bảng/phiếu đo; ưu tiên tương tác. |
| B21 `g4-math-hk1-b21` | Review khối lượng, diện tích, thời gian và thế kỉ; không lấy dữ kiện vượt chương. |

### Giai đoạn nội dung E — Phép cộng và phép trừ

| Lesson | Family đề xuất |
| --- | --- |
| B22 `g4-math-hk1-b22` | Đặt tính và cộng số nhiều chữ số; tìm thành phần chưa biết trong phép cộng; kiểm tra bằng ước lượng. |
| B23 `g4-math-hk1-b23` | Đặt tính và trừ số nhiều chữ số; tìm số bị trừ/số trừ; kiểm tra kết quả. |
| B24 `g4-math-hk1-b24` | Tính chất giao hoán/kết hợp của phép cộng; điền, ghép, Đúng/Sai và nhóm biểu thức tương đương. |
| B25 `g4-math-hk1-b25` | Tìm hai số biết tổng và hiệu; dạng trực tiếp và bài toán ngữ cảnh. |
| B26 `g4-math-hk1-b26` | Review B22–B25 theo kỹ năng, không để generator cộng/trừ tổng quát đại diện cho toàn Chủ đề. |

### Giai đoạn nội dung F — Hình học

| Lesson | Family đề xuất |
| --- | --- |
| B27 `g4-math-hk1-b27` | Nhận biết hai đường thẳng vuông góc; xác định góc vuông; chọn hình đúng. |
| B28 `g4-math-hk1-b28` | Thực hành tìm/vẽ/ghép đường vuông góc trên lưới hoặc SVG; có thao tác bàn phím thay cho kéo thả. |
| B29 `g4-math-hk1-b29` | Nhận biết hai đường thẳng song song; chọn cặp đúng; loại nhiễu gần song song. |
| B30 `g4-math-hk1-b30` | Thực hành kẻ/nối đường song song; kiểm tra theo hình học, không theo vị trí pixel. |
| B31 `g4-math-hk1-b31` | Nhận biết tính chất hình bình hành/hình thoi; cạnh/góc/đường chéo; phân loại hình. |
| B32 `g4-math-hk1-b32` | Review vuông góc, song song, hình bình hành, hình thoi. |

### Giai đoạn nội dung G — Ôn tập Học kỳ 1

| Lesson | Family đề xuất |
| --- | --- |
| B33 `g4-math-hk1-b33` | Ôn số đến lớp triệu: đọc, viết, hàng/lớp, so sánh, làm tròn, dãy số. |
| B34 `g4-math-hk1-b34` | Ôn cộng/trừ: đặt tính, tính chất, tổng-hiệu, biểu thức và bài toán. |
| B35 `g4-math-hk1-b35` | Ôn hình học: góc, vuông góc, song song, hình bình hành/hình thoi. |
| B36 `g4-math-hk1-b36` | Ôn đo lường: khối lượng, diện tích, giây, thế kỉ và chọn đơn vị. |
| B37 `g4-math-hk1-b37` | Review toàn HK1 có blueprint tỷ trọng; mỗi câu vẫn có `skillTag` để truy vết. |

### HK2

Danh mục B38–B73 đã tồn tại trong `constants.js` để điều hướng và lọc. Việc lập family chi tiết HK2 sẽ là checkpoint sau khi có SGK/VBT Tập 2 hoặc người dùng xác nhận nguồn nội dung tương đương. Không dùng bảng HK1 để suy diễn cơ học cho HK2.

## 10. Tách Template cũ và tạo Template mới

### 10.1. Quy tắc phân loại record cũ

Mỗi record hiện có được đưa vào một trong bốn nhóm:

1. **Giữ nguyên và gắn lesson**: nội dung đã chỉ rõ đúng một Bài học, chỉ thiếu metadata.
2. **Giữ generator, tạo record mới hẹp**: code sinh câu dùng được, nhưng record cũ quá rộng hoặc tên/topic không rõ.
3. **Cần sửa generator**: dạng bài gần đúng nhưng đáp án, phạm vi hoặc interaction chưa sát SGK/VBT.
4. **Đưa vào archive**: nội dung lặp, sai chương, không đủ contract hoặc không còn phù hợp; chuyển `is_active=false` sau khi có thay thế.

Không sửa hàng loạt theo tên generator mà chưa xem `config`, `prompt_template`, topic, semester và output thực tế.

### 10.2. Tên Template

Tên hiển thị nên nói đủ phạm vi, ví dụ:

```text
[Bài 11] Nhận biết chữ số theo hàng — Trắc nghiệm
[Bài 13] Làm tròn đến hàng trăm nghìn — Đúng/Sai
[Bài 25] Tìm hai số biết tổng và hiệu — Bài toán
```

Không dùng tên “Bộ số nâng cao” hoặc “Bài tổng hợp” nếu không có Bài học và skill tag cụ thể.

### 10.3. Review Template

Template của các bài “Luyện tập chung”/“Ôn tập” được phép có nhiều skill, nhưng phải:

- khai báo lesson review cụ thể;
- có blueprint tỷ trọng hoặc danh sách skill cho phép;
- không chọn ngẫu nhiên sang topic/Bài học chưa học;
- hiển thị skill trong preview để Admin biết đề đang bao phủ gì;
- test tối thiểu nhiều seed để không rơi toàn bộ vào một dạng.

## 11. Gắn code

### 11.1. Thêm generator/family

Quy trình chuẩn:

1. Viết contract test cho output, seed, đáp án, 4 ý và lỗi config.
2. Tạo file generator ở `src/question-templates/grade-4/math/` hoặc mở rộng module có cùng family khi semantics thực sự giống nhau.
3. Đăng ký key trong `src/question-templates/grade-4/math/index.js` cho cả Node và browser.
4. Nếu `index.html` dùng script cổ điển, thêm script đúng thứ tự trước registry.
5. Thêm preset/guide/variables/preview vào `templatePresets` trong `src/main.js`.
6. Thêm whitelist theo topic khi generator có phạm vi đặc biệt; không dựa riêng vào tên.
7. Thêm `lesson` vào seed/manifest Template.
8. Test render preview, save/load và pool tạo Đề tự động.

### 11.2. Không để generator làm thay việc của UI

- Generator chỉ sinh dữ liệu và metadata.
- UI quản lý filter, card, form, preview, trạng thái empty/error/focus.
- Supabase lưu record và quyền; không để generator tự gọi Supabase.
- Renderer/chấm điểm dùng hợp đồng hiện tại; thay đổi contract phải cập nhật test và spec.

### 11.3. Backward compatibility

Khi đọc:

```js
const lessonId = app.curriculum.getTemplateLesson(template);
```

Khi ghi mới:

```js
{
  ...template,
  lesson: canonicalLessonId,
  config: {
    ...config,
    lesson: canonicalLessonId // chỉ giữ tạm cho dữ liệu cũ
  }
}
```

Sau khi toàn bộ record active đã có `lesson`, fallback suy luận có thể chuyển sang cảnh báo kiểm kê; chưa xoá ngay để tránh làm hỏng dữ liệu cũ.

## 12. Supabase và vòng đời dữ liệu

### 12.1. Migration

Migration đã chuẩn bị:

```text
supabase/migrations/20260909_question_templates_lesson.sql
```

Nó chỉ:

- thêm `lesson` nếu chưa có;
- tạo index lọc theo lesson;
- sao chép `config.lesson` rõ ràng lên cột mới;
- không thay RLS/quyền.

Trước khi apply cần có xác nhận đúng project và quyền Admin. Repo hiện không có Supabase CLI/authenticated production session; lần kiểm tra unauthenticated trước đó không đủ quyền đọc dữ liệu. Vì vậy Phase 1 cần một trong hai đầu vào:

- người dùng chạy migration trong đúng project rồi gửi kết quả/schema;
- hoặc một phiên Admin đã đăng nhập để ứng dụng kiểm tra bằng query được phép.

Không đưa access token, service key hoặc cookie vào repo/chat.

### 12.2. Seed và migration record

Seed Template mới phải có:

- `lesson` canonical;
- `topic`, `semester` khớp catalog;
- `generator_key` đã có trong registry;
- config đã qua validator;
- `is_active=true` chỉ sau khi preview/test đạt;
- câu lệnh idempotent, không nhân bản khi chạy lại.

Khuyến nghị dùng manifest/seed có mã tự nhiên để kiểm tra `NOT EXISTS`; tránh một SQL khổng lồ vừa đổi schema vừa xoá dữ liệu. Mỗi phase nội dung có seed riêng để rollback bằng cách tắt record của phase đó.

### 12.3. RLS và quyền

Giữ nguyên mô hình hiện có:

- người dùng đã đăng nhập được đọc Template theo chính sách hiện tại;
- chỉ Admin được ghi/xoá theo `private.is_admin()`;
- không mở quyền `anon`;
- không đưa answer key vào một API công khai mới;
- migration Template không tự động thay RLS.

### 12.4. Rollback

Rollback ưu tiên:

1. tắt `is_active` các record mới;
2. bật lại record cũ đã archive;
3. giữ nguyên các Đề/Câu hỏi đã lưu;
4. chỉ khôi phục schema nếu migration schema có lỗi và đã đánh giá ảnh hưởng.

Không dùng `DELETE` hàng loạt trong seed rebuild.

## 13. Kiểm thử và cổng chất lượng

### 13.1. Contract/unit

Mỗi generator mới phải kiểm:

- key tồn tại trong registry;
- config mặc định và config biên;
- đúng số ý và `partAnswerCounts`;
- đáp án hợp lệ, giải thích đúng;
- nhiều seed không trùng nội dung;
- bài toán có lời văn tính lại được;
- số liệu không vượt Bài học;
- output không chứa lỗi HTML/placeholder.

### 13.2. Contract dữ liệu

Kiểm:

- mọi lesson ID tồn tại trong catalog;
- lesson thuộc đúng semester/topic/class/subject;
- active record có generator tồn tại;
- prompt chỉ dùng biến đã khai báo;
- không có record trùng khóa tự nhiên trong manifest;
- record archive không xuất hiện trong pool gameplay.

### 13.3. Browser/visual

Ở mỗi phase có ít nhất:

- preview một Template ở 1280×720 và 1440×900;
- tablet ngang 1024×768;
- lọc Chủ đề → Bài học → Template;
- empty state khi Bài học chưa có Template;
- error state khi config lỗi;
- keyboard focus qua card, select, input, preview và save;
- `prefers-reduced-motion` không làm mất thông tin;
- không có lỗi console/runtime.

### 13.4. Regression

Chạy theo thứ tự:

```powershell
# Contract Node
$tests = Get-ChildItem -File -Filter 'test_*.cjs'
foreach ($test in $tests) {
  node $test.Name
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

# Contract + Playwright
npm test
```

Chỉ kết luận production-ready sau khi test local xanh và migration/seed đã được apply, kiểm tra với tài khoản Admin thật ở đúng project.

## 14. Lộ trình triển khai đề xuất

Mỗi phase dưới đây có một checkpoint. Người dùng duyệt phase nào thì mới chạy phase đó; không mặc định triển khai xuyên suốt tất cả phase.

### Phase 0 — Hồ sơ kiến trúc và kiểm kê (đang thực hiện / tài liệu này)

Phạm vi:

- tạo `docs/templates/`;
- tạo tài liệu hệ thống này;
- ghi lại contract, catalog, mapping hiện tại, gaps và quy tắc archive;
- đề xuất family Template theo HK1;
- không ghi dữ liệu Supabase.

Tiêu chí đạt: tài liệu có thể dùng làm checklist cho generator, seed, UI và test; người dùng chọn được phase tiếp theo.

**Checkpoint duyệt:** duyệt toàn bộ hướng kiến trúc và thứ tự phase.

### Phase 1 — Nền dữ liệu và manifest

Phụ thuộc: duyệt Phase 0; có quyền/schema đúng project.

Kết quả kiểm kê CSV và mapping đã duyệt cho nhóm gắn trực tiếp: [`PHASE_1_TEMPLATE_MAPPING.md`](./PHASE_1_TEMPLATE_MAPPING.md). SQL migration chỉ là gói triển khai để người dùng tự chạy trong đúng project Supabase; repo không tự nhận đã cập nhật production.

Thực hiện:

1. Kiểm kê toàn bộ record `question_templates` hiện có bằng phiên Admin/export được phép.
2. Đối chiếu từng record với `lessonCatalog`, phân loại giữ/gắn lesson/tách/sửa/archive.
3. Apply migration `lesson` trong đúng project sau khi người dùng xác nhận.
4. Tạo manifest kiểm kê/validator trong repo, không tạo record nội dung mới.
5. Bổ sung contract test cho lesson/topic/semester/generator.

Kết quả: 28 record **GẮN** đã có manifest/migration; 18 record cần harden/tách/thay vẫn chờ phase nội dung tương ứng.

### Phase 2 — Rebuild Bài 1–6

Phụ thuộc: Phase 1 và duyệt family nội dung A.

Đã triển khai trong repo:

- thêm bốn generator số chẵn/lẻ B03;
- thêm hai generator biểu thức chứa chữ B04;
- tạo review B06 cố định B01–B04;
- nối bảy lựa chọn/preset/preview vào Admin editor;
- tạo migration seed idempotent, không chứa B05;
- kiểm thử contract nhiều seed và browser editor ở desktop.

Checkpoint còn lại: duyệt card/preview và dữ liệu mẫu, sau đó người dùng apply migration vào đúng project trước khi archive/tách record cũ B01/B02.

### Phase 3 — Rebuild Bài 7–9

Phụ thuộc: Phase 1 và duyệt family nội dung B.

Thực hiện:

- bổ sung đo góc/đơn vị độ cho B07;
- tách phân loại góc cho B08;
- tạo review góc B09;
- kiểm tra SVG, keyboard fallback, drag/focus và reduced motion.

### Phase 4 — Rebuild Bài 10–16

Phụ thuộc: Phase 1 và duyệt family nội dung C.

Thực hiện:

- bổ sung số sáu chữ số/1 000 000, lớp triệu, làm tròn;
- tách so sánh, dãy số và review;
- bỏ mapping heuristic khi record đã có lesson rõ.

### Phase 5 — Rebuild Bài 17–21

Phụ thuộc: Phase 1 và duyệt family nội dung D.

Thực hiện:

- tách khối lượng, diện tích, thời gian/thế kỉ;
- thêm thực hành lựa chọn đơn vị;
- tạo review đo lường có nhãn kỹ năng;
- rà lại bài toán lời văn và đơn vị.

### Phase 6 — Rebuild Bài 22–26

Phụ thuộc: Phase 1 và duyệt family nội dung E.

Thực hiện:

- tách cộng, trừ, tính chất, tổng-hiệu;
- không dùng các generator cộng/trừ tổng quát làm đại diện cho B26 nếu không có blueprint;
- tạo review B26.

### Phase 7 — Rebuild Bài 27–32

Phụ thuộc: Phase 1 và duyệt family nội dung F.

Thực hiện:

- xây generator hình học vuông góc/song song;
- thêm bài thực hành trên lưới/SVG;
- thêm hình bình hành/hình thoi;
- tạo review B32;
- test hình học bằng dữ liệu hình học, không snapshot pixel đơn thuần.

### Phase 8 — Rebuild Bài 33–37

Phụ thuộc: các phase HK1 trước đã ổn định.

Thực hiện:

- tạo blueprint ôn số, cộng/trừ, hình học, đo lường;
- tạo review toàn HK1;
- kiểm tra tỷ trọng kỹ năng và khả năng sinh Đề.

### Phase 9 — HK2 sau khi có nguồn xác minh

Phụ thuộc: SGK/VBT Tập 2 hoặc nguồn đã được người dùng xác nhận.

Thực hiện:

- đọc/đối chiếu từng bài B38–B73;
- lập family và mapping như HK1;
- không copy template HK1 theo tên tương tự;
- triển khai theo các lát nhỏ, có checkpoint riêng.

### Phase 10 — Seed, archive và bàn giao

Phụ thuộc: các phase nội dung được duyệt.

Thực hiện:

1. Seed record mới idempotent.
2. Chuyển record cũ quá rộng sang `is_active=false` sau khi kiểm tra dependency.
3. Chạy test đầy đủ và browser visual review.
4. Tự review diff, kiểm tra migration không đổi RLS/quyền ngoài phạm vi.
5. Commit nhánh riêng; chỉ push/merge `main` khi người dùng yêu cầu và các checkpoint bắt buộc đã đạt.

## 15. Các quyết định cần người dùng duyệt

Đề xuất mặc định:

1. **Mỗi Template active gắn đúng một Bài học.** Template review được nhiều skill nhưng chỉ thuộc lesson review tương ứng.
2. **Giữ contract 4 ý**, mỗi ý 0,25 điểm; ngoại lệ phải có lý do và test riêng.
3. **Archive bằng `is_active=false`**, không xoá vật lý trong đợt rebuild đầu.
4. **Dùng generator cũ khi semantics còn đúng**, nhưng tạo record mới hẹp; chỉ viết generator mới khi dạng bài hoặc interaction khác bản chất.
5. **Ưu tiên hoàn tất HK1 trước**, vì hiện đã có SGK/VBT Tập 1 để kiểm chứng; HK2 chờ nguồn Tập 2.
6. **Làm Phase 1 trước Phase 2**, để không tạo thêm Template khi chưa biết chính xác record cũ nào cần giữ/tách/archive. Phase 1 mapping trực tiếp đã được duyệt; Phase 2 đã triển khai B03/B04/B06, còn B05 vẫn tạm hoãn.

## 16. Checklist bàn giao cuối cùng

- [ ] Có mapping 100% Template active → một lesson hợp lệ.
- [ ] Không còn record active “không gắn bài học” trừ ngoại lệ được duyệt bằng văn bản.
- [ ] Mọi generator được registry và test.
- [ ] Prompt/config/answer/explanation nhất quán.
- [ ] Template broad được tách hoặc archive có thể rollback.
- [ ] Câu hỏi bám SGK; VBT chỉ dùng để tham khảo dạng luyện tập, không thay thế mục tiêu SGK.
- [ ] Admin lọc được Chủ đề → Bài học → Template → Preview.
- [ ] Học sinh không bị đổi luồng gameplay ngoài phạm vi đã duyệt.
- [ ] RLS/quyền/API key không bị nới ngoài yêu cầu.
- [ ] Migration/seed idempotent, có log và có kế hoạch rollback.
- [ ] Contract Node, Playwright và visual/accessibility review đều đạt.
- [ ] Người dùng duyệt trước push/merge main.
