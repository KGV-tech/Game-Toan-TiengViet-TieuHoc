# Hoàn thành Bảng — Bài 10 Toán 4

Template `number.complete_place_table` có 4 dòng và một dòng tiêu đề. Mỗi dòng cho sẵn ngẫu nhiên một nhóm Viết số, Đọc số hoặc chữ số theo hàng; hai nhóm còn lại là ô nhập. Bảng luôn có đủ ba dạng cho sẵn trong một lượt. Các dòng dùng số khác nhau.

Mặc định `placeColumns: 6`, đến hàng trăm nghìn. Có thể chỉnh 4–9 trong trình soạn: 4 đến hàng nghìn, 7 đến hàng triệu, 9 đến hàng trăm triệu. Các hàng được xếp từ cao xuống thấp; các hàng cao vượt quá độ dài số được để trống và không cần nhập 0. Chữ số 0 bên trong số vẫn phải nhập đúng. Số đọc được sinh bằng bộ đọc số dùng chung; chấp nhận linh/lẻ và bốn/tư ở cách đọc tương đương.

Chấm theo dòng: mỗi dòng có cả hai nhóm còn thiếu đúng hoàn toàn được 0,25 điểm. Một ô sai làm dòng đó không có điểm; dòng khác vẫn được chấm độc lập. Thanh tiến độ đếm 4 dòng đã điền đủ, gồm cả ô đọc số. Cấu hình, xem trước, luyện tập, làm đề, lịch sử, bản in và khôi phục bản nháp dùng chung renderer/scorer của module bảng.

Bảng dùng khung ô nối liền, cột đọc số rộng, hàng tiêu đề rõ và vùng nhập có focus bàn phím. Kiểm tra ở 1280×720, 1440×900, 1024×768. CSS bảng được đưa vào cả cửa sổ in riêng.

Mẫu mặc định cục bộ được bổ sung vào Bài 10, Chủ đề 3, Toán lớp 4. Có thể mở từ Kho Template để chỉnh và lưu bằng luồng hiện có. Không thực hiện ghi Supabase tự động cho yêu cầu này.

Review độc lập: Standards và Spec không còn finding đã xác nhận sau khi sửa sự kiện nhập khi chuyển câu, tiến độ và stylesheet bản in. Playwright dùng thay DevTools MCP (không có trong phiên).

Cổng cuối: 72 bộ Node đạt; Chromium 501 passed, 3 skipped (QA tùy chọn), 0 failed. 18 kiểm thử tập trung bảng/khởi động đạt, gồm hàng cao để trống và chữ số 0 bên trong số.
