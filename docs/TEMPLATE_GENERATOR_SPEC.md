# Chuẩn chính thức tạo Template câu hỏi

> Hiệu lực từ 2026-08-23. Đây là tài liệu chuẩn phải đọc trước khi tạo hoặc nâng cấp template. Nếu mã nguồn cũ khác tài liệu này, tài liệu là yêu cầu đích; phải bổ sung code, validation và kiểm thử trước khi coi template mới là hoàn tất.

## 1. Phạm vi và nguyên tắc

- Áp dụng cho mọi template mới của game, trước mắt là Toán lớp 4; thiết kế phải tái sử dụng được cho lớp/chủ đề khác qua `config`.
- Mỗi template sinh đúng 4 ý `a–d` (hoặc `A–D`), mỗi ý đúng 0,25 điểm, tổng 1 điểm.
- Không dùng danh sách câu/số liệu cố định rồi chỉ đảo thứ tự, trừ khi chuẩn môn học buộc phải dùng tập hữu hạn. Mỗi lượt phải sinh biến thể mới, đúng kiến thức và đúng đáp án.
- Laptop/desktop và tablet ngang là thiết bị ưu tiên. Nội dung, nút kiểm tra và tất cả ý phải thao tác được; ô trả lời phải bám với mệnh đề còn thiếu.
- Không tạo/chỉnh dữ liệu Supabase, schema hoặc quyền truy cập nếu chưa có xác nhận riêng.

## 2. Hợp đồng dữ liệu của một generator

Generator được đăng ký trong `src/question-templates/grade-4/math/index.js` và phải trả về:

| Trường | Quy định |
| --- | --- |
| `classlevel`, `subject`, `semester`, `topic` | Khớp chính xác một chủ đề hợp lệ. |
| `type` | `Trắc nghiệm`, `Điền khuyết`, `Đúng/Sai`, `So sánh`, `Chuỗi Quy luật`, `Kéo thả` hoặc `Đối chiếu trùng khớp`. |
| `templateId` | Khóa generator duy nhất, đã đăng ký. |
| `q` | Câu dẫn/nội dung; dùng `<br>` khi cần xuống hàng, `___` cho ô điền của renderer chung. |
| `ans` | Đáp án đúng theo thứ tự hiển thị, ngăn cách bằng `, `. |
| `explanation` | Lời giải ngắn, đúng với dữ liệu/hình vừa sinh. |
| `templateVariables` | Các biến hợp lệ để dùng trong `prompt_template`, gồm tối thiểu `{question}` với template nhiều phần. |
| `partAnswerCounts` | Mặc định `[1, 1, 1, 1]`; chỉ khác khi mỗi ý có nhiều ô trả lời nhưng vẫn chấm 0,25/ý. |

Không dùng prompt thuần để thay thế cấu trúc động. Nếu template có 4 phần, SVG, nhận định hoặc metadata hiển thị, `prompt_template` phải giữ `{question}`.

## 3. Chuẩn 4 ý và chấm điểm

- `subquestions`, `practiceRows`, `comparisonRows` hoặc `statements` phải có đúng 4 phần.
- Trắc nghiệm: mỗi ý có đúng 4 phương án, 1 đáp án đúng và 3 nhiễu hợp lý, không trùng phương án.
- Điền khuyết: một ô/ý, trừ ngoại lệ đã công bố. Ô phải đặt ngay sau/bên trong phần còn thiếu của ý đó.
- Đúng/Sai: 4 nhận định tự đủ dữ kiện, tiêu đề duy nhất là **`Chọn Đúng/Sai?`**; không lặp hướng dẫn chung.
- So sánh/kéo thả: 4 ý; mỗi ý một vị trí đáp án; dữ kiện ở hai vế phải hợp lệ.
- Đối chiếu: đúng 4 cặp đáp án và đúng 1 phương án nhiễu trên một trong hai cột. Hình dạng bắt buộc là 5:4 hoặc 4:5.
- Ngoại lệ số liền trước–sau: mỗi ý có hai ô, nhưng phải đúng cả cặp mới được 0,25 điểm (`partAnswerCounts: [2,2,2,2]`).
- Ngoại lệ chuỗi quy luật: một ý có 2–3 ô trống và cả dãy là một ý 0,25 điểm.

## 4. Chuẩn sinh dữ liệu và chống lặp

- Nhận `config` và `random`; mọi biến thể phải sinh được lại bằng random xác định trong test.
- Tất cả số liệu, tình huống, phương án nhiễu, hình và thứ tự phải đúng về mặt toán học trước khi hiển thị.
- Không sinh kết quả âm, chia không hết, số vượt phạm vi, đáp án mơ hồ hoặc phương án trùng nhau.
- Có giới hạn số lần thử; nếu config không thể sinh câu hợp lệ thì throw lỗi rõ ràng, không vòng lặp vô hạn.
- Trong một lượt 10 câu, khóa nội dung bao gồm câu dẫn, đáp án và dữ liệu 4 phần; không được xuất hiện nguyên câu giống hệt.
- Khi ngân hàng ít template, được quay vòng **generator** nhưng phải sinh biến thể khác; không lấy lại dữ liệu y hệt.
- Số tự nhiên dùng khoảng trắng không ngắt theo hàng nghìn. Năm luôn hiển thị liền (`1900`, `2026`) bằng đánh dấu dữ liệu năm, không dùng định dạng số tự nhiên.

## 5. Config bắt buộc và validation UI

Mọi phạm vi, loại số, bước nhảy, loại đơn vị, tình huống hoặc độ khó có thể thay đổi phải nằm trong `config`, có điều khiển ở Kho Template và validation tương ứng trong UI.

Validation phải chặn ngay khi lưu nếu:

- min/max không là số nguyên hợp lệ hoặc min ≥ max;
- không còn đủ dữ liệu để tạo 4 ý khác nhau;
- phép chia không thể cho thương nguyên hoặc phép nhân vượt phạm vi;
- loại tương tác thiếu phương án/cặp/ô trả lời theo chuẩn ở mục 3;
- `prompt_template` chứa biến không được khai báo;
- config vi phạm chuẩn riêng của generator.

## 6. Chuẩn riêng: Chuỗi quy luật

Mỗi lượt có 4 dãy độc lập `a–d`.

| Đại lượng của số hạng | Quy luật bước nhảy được phép |
| --- | --- |
| 1–2 chữ số | `+5` đến `+9`. |
| 3–4 chữ số | `+1` đến `+9`, hoặc `+10` đến `+90`, `+100` đến `+900`, `+1000` đến `+9000`. |
| Từ 5 chữ số đến dưới 10 000 000 | Chỉ tăng/giảm theo bội số 1 000; không tăng/giảm lẻ theo đơn vị, chục, trăm. |

Ràng buộc bổ sung:

- Mỗi dãy có 5–7 số hạng.
- Có 2–3 ô trống ở vị trí ngẫu nhiên, không đặt ở đầu/cuối; còn ít nhất 2 số đã biết.
- Cho phép dãy giảm nếu bước nhảy phù hợp và cả dãy vẫn nằm trong min–max.
- UI phải tự kiểm tra `allowedSteps` theo số chữ số/phạm vi đã chọn; không chỉ hiển thị hướng dẫn.
- Đáp án giữ thứ tự dãy rồi thứ tự ô trống trong dãy; mỗi dãy là một ý 0,25 điểm.

## 7. Chuẩn riêng: Đối chiếu trùng khớp

- Áp dụng cho **mọi** template đối chiếu hiện tại và sau này.
- Có 4 cặp đúng, một cột 5 mục và cột kia 4 mục.
- Mục nhiễu phải cùng loại dữ liệu, có vẻ hợp lý nhưng không ghép đúng với bất kỳ mục nào ở cột còn lại.
- `ans` chỉ chứa 4 cặp đúng theo cú pháp `trái:phải`; nhiễu không có đáp án.
- Test phải xác nhận số cặp đúng là 4, chênh lệch hai cột đúng 1 và nhiễu không có cặp tương đương.

## 8. Chuẩn riêng: Đơn vị đo và bài toán có lời văn

Toàn bộ template `measurement.*` phải mở config trong Kho Template; tối thiểu cho phép chọn:

- nhóm đại lượng/đơn vị được dùng (khối lượng, diện tích, thời gian, thế kỉ);
- khoảng số, số chữ số hoặc mức độ;
- dạng đổi đơn vị/so sánh/tình huống;
- số lượng hoặc tập tình huống có thể sinh, nếu phù hợp loại bài.

Các yêu cầu sinh:

- Sinh số liệu mới hoàn toàn ở mỗi lượt, không chỉ đảo 4 câu mẫu.
- Bài toán lời văn phải sinh cả số liệu và ngữ cảnh mới, nhưng giữ đúng đơn vị, kết quả, logic thực tế và độ khó lớp học.
- Đáp án phải được tính từ dữ liệu sinh, không gắn thủ công với câu mẫu.
- Năm thuộc thế kỉ phải sinh ngẫu nhiên trong khoảng thế kỉ đã chọn và không có khoảng trắng hàng nghìn.
- Không dùng dạng “đơn vị đo thích hợp nhất/thường dùng” nếu có từ hai đơn vị cùng loại đều có thể đo đại lượng đó. Template `measurement.choose_appropriate_unit` đã bị loại bỏ theo quy tắc này.

## 9. Quy luật hiện có theo nhóm template

| Nhóm | Quy luật cần giữ khi phát triển |
| --- | --- |
| Nhận biết chữ số theo hàng | Chọn hàng từ đơn vị đến trăm tỷ và chữ số 0–9 theo config; mỗi ý 1 đúng/3 nhiễu. |
| Số bé nhất/lớn nhất | 4 nhóm độc lập; mỗi nhóm 4 số khác nhau. |
| Lập số/tổng phân tích | Số phải có ít nhất 2 thành phần giá trị hàng khác 0. |
| Số liền trước–sau | Số trung tâm không được nằm ở biên min/max. |
| Bốn phép tính điền số | Có thể chọn phép/bố cục/vị trí ô trống; vị trí thứ tư chỉ dùng với hai biểu thức; chia hết. |
| Bốn phép tính tính biểu thức | Mỗi lượt dùng đủ cộng, trừ, nhân, chia; có nhiều bước và ngoặc khi cần. |
| Bốn phép tính so sánh | Mỗi lượt luôn có `>`, `<`, `=` và một dấu lặp ngẫu nhiên. |
| Đọc số | Số 0–999 999 999, đọc đúng quy tắc “linh, mốt, tư, lăm”; đối chiếu tuân chuẩn 5:4/4:5. |
| Đúng/Sai hàng/lớp | Số có chữ số không lặp; 2 đúng/2 sai; mỗi nhận định nêu số đang xét. |
| Mật khẩu két sắt | 4 ý, mỗi ý 4 mã và 2 điều kiện; duy nhất 1 mã thỏa đồng thời; giữ số 0 đầu mã. |
| Góc | 4 ý về nhọn/vuông/tù/bẹt; SVG phải được sinh/kiểm thử cùng đáp án. |

## 10. Tích hợp Kho Template và Supabase

Khi thêm template mới, bắt buộc cập nhật đồng thời:

1. Generator và registry.
2. Whitelist template theo chủ đề để game không lấy lẫn chủ đề.
3. Preset: tên, loại câu, prompt mặc định, hướng dẫn, biến cho phép, preview.
4. Renderer riêng nếu cấu trúc dữ liệu không thuộc loại chung.
5. Seed SQL cho `question_templates`, dùng `{question}` cho template nhiều phần.
6. Preview giao diện thực tế trong Kho Template.

Không chạy SQL migration vào Supabase nếu chưa được xác nhận. Với bản ghi cũ có prompt ghi đè cấu trúc động, phải có migration sửa dữ liệu và lớp bảo vệ ở client nếu cần.

## 11. Kiểm thử bắt buộc

1. **Node**: nhiều seed/random; kiểm tra metadata, 4 ý, đáp án, tính toán, phương án/cặp nhiễu và ràng buộc chuyên biệt.
2. **UI validation**: config sai bị chặn bằng thông báo rõ ràng trước khi lưu.
3. **Playwright**: render thật ở laptop và tablet ngang; không cắt nội dung; ô/nút đúng số lượng và chấm đúng 0,25/ý.
4. **Lượt 10 câu**: không lẫn chủ đề; không lặp nguyên câu; biến thể vẫn tạo đủ 10 câu khi template ít.
5. **Hồi quy**: chạy `npm test` trước commit; cập nhật contract test, test generator và test e2e cho hành vi mới.

## 12. Checklist triển khai template mới

- [ ] Có mục tiêu kiến thức, chủ đề, lớp/học kỳ và loại tương tác rõ ràng.
- [ ] Sinh đúng 4 ý và mô hình chấm 0,25/ý.
- [ ] Config hóa mọi biến có thể tái dùng; thêm validation UI.
- [ ] Sinh số liệu/tình huống mới, đáp án được tính từ dữ liệu sinh.
- [ ] Có phương án nhiễu/cặp nhiễu theo chuẩn loại câu.
- [ ] Có lời giải đúng với từng biến thể.
- [ ] Đăng ký generator, preset, preview, whitelist chủ đề và seed SQL.
- [ ] Có test Node, UI validation, Playwright và lượt 10 câu.
- [ ] Chạy `npm test`, review diff, sau đó commit/push nhánh riêng.

## 13. Tồn đọng triển khai cần làm

Các quyết định mới ở mục 5, 6, 7 và 8 là chuẩn bắt buộc nhưng một số generator cũ chưa đáp ứng đầy đủ. Khi nâng cấp, ưu tiên:

1. Validation UI phân tầng bước nhảy của `number.natural_sequence`.
2. Config và generator biến thể thật cho toàn bộ `measurement.*`, đặc biệt bài toán lời văn.
3. Chuẩn 5:4/4:5 và một mục nhiễu cho mọi generator đối chiếu cũ/mới.
4. Kiểm thử hồi quy cho các chuẩn mới trên.
