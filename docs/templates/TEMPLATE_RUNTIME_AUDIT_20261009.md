# Rà soát lỗi template ngày 09/10/2026

## Phạm vi

- 79 generator Toán lớp 4 (không đếm lại alias), cấu hình mặc định.
- 274 cấu hình Tiếng Việt theo bài học; tổng 353 cấu hình, mỗi cấu hình sinh 40 mẫu.
- 37 bài Toán và 32 bài Tiếng Việt HK1: chạy luồng học sinh với template đúng bài, xác nhận 10 câu hợp lệ khác nhau.
- Các template trắc nghiệm có hình: kiểm tra nút chọn không bị cắt ở 1280×720, 1440×900 và 1024×768, với năm mẫu mỗi generator.
- Không đọc hoặc sửa cấu hình tùy chỉnh đang lưu trên Supabase; kiểm thử dùng dữ liệu cục bộ.

## Lỗi đã sửa

1. Khóa chống trùng bỏ dữ kiện hình góc và cặp nối, hoặc nhóm số chỉ xuất hiện trong phương án. Thêm dữ kiện có ý nghĩa vào khóa: góc, giờ đồng hồ, hình đa giác, cặp nối và tập số cần so sánh. Thứ tự thẻ nối không tạo câu mới.
2. B07 chỉ đọc số đo và thiếu số tại tia đỏ. Bổ sung đọc, so sánh với 90°, đơn vị độ, cách viết số đo; sửa cung thước nằm cùng phía với tia góc và ghi số đo chính xác tại tia đỏ.
3. Quy tắc CSS khung học sinh xếp hình trên đáp án, làm tràn hàng. Bố trí hình trái, câu hỏi và đáp án phải; bỏ nhãn bài học lặp ở câu con có hình để giữ chỗ cho nội dung thao tác. Áp dụng chung cho B07/B09 và hình học.
4. Nối đơn vị đo chỉ có ba bộ số cố định. Sinh hệ số nhân cho từng cặp, giữ phép đổi đúng và một phương án nhiễu không trùng giá trị.
5. Thực hành đo lường đôi khi sinh hai dữ kiện giống nhau. Chọn lại dữ kiện trùng với giới hạn số lần thử rõ ràng.
6. Ôn tập B36 có đáp án thập phân chứa dấu phẩy làm sai số lượng ý; một số đáp án còn không có trong phương án. Đổi sang lượng gam là bội 1 000, đáp án ki-lô-gam nguyên và tạo phương án chứa đáp án đúng, phù hợp luyện tập HK1 lớp 4.
7. Nhận biết tứ giác luôn dùng cùng hình. Thêm biến thể xoay hình thật; lưu góc xoay tương ứng trong dữ kiện.

## Kiểm thử hồi quy

- `tests/e2e/template-capacity-audit.spec.cjs`: rà soát sinh câu, sức chứa từng bài và nút chọn trong khung có hình.
- `tests/e2e/phase3-angle-templates.spec.cjs`: tái hiện lỗi B08, thao tác B07 và chấm điểm bốn ý.
- `test_matching_measurement_variants.cjs`: 300 biến thể, đổi độc lập về đơn vị chuẩn để kiểm tra phép đổi, thẻ trùng và phương án nhiễu.
- `test_phase3_grade4_templates.cjs`: bốn dạng B07, cấu hình số đo và nhãn số đo.

Dạng đếm góc trong đa giác có năm hình hữu hạn; Tiếng Việt có các kỹ năng hữu hạn theo nội dung đã kiểm chứng. Không coi việc đảo thẻ là thêm nội dung: kiểm tra đủ 10 câu ở cấp bài học phối hợp các dạng thay vì bắt mỗi dạng hữu hạn có 10 câu riêng.

## Kết quả cổng cuối

70 bộ kiểm thử Node đạt; Playwright Chromium: 483 đạt, 3 QA tùy chọn bỏ qua, không có lỗi. Review theo yêu cầu và chuẩn repo không có finding còn mở.
