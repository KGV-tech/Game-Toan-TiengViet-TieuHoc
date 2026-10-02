# Luồng Thi đua tuần và bố cục gọn

Nền thay đổi `e3cd5ec`, yêu cầu 02/10/2026.

- Icon ba thẻ chọn dùng đúng màu tím/xanh/vàng. Toàn bộ thẻ là nút, bỏ chữ Mở quản lý.
- Khung quản lý tận dụng viewport, padding ngoài 10px; sidebar không cuộn trên laptop/tablet ngang, thống kê nhóm xếp 2×2.
- Trạng thái thành công ghi Đã đồng bộ dữ liệu.
- Cộng điểm: chỉ hiện tên và điểm trên thẻ; chọn học sinh mở bảng điểm giữa khung phải với Cộng 1 điểm và Hủy, khôi phục focus khi trở lại. Trừ điểm và điểm danh nằm trong mục Điều chỉnh mở rộng, không chiếm thẻ danh sách.
- Ngẫu nhiên: Normal/Instant, danh sách ứng viên tên/điểm, chọn tất cả học sinh, tổ/nhóm hoặc thành viên của tổ/nhóm; kết quả hiện điểm và có thể chọn cộng điểm. Bốc thăm tự nó không đổi điểm.
- Thi đua: tạo/chọn tuần, ngày bắt đầu/kết thúc, thi đua theo Tổ hoặc Nhóm của tuần; tổng điểm và xếp hạng lấy từ điểm thành viên của đúng trận.

Tham chiếu đã đọc bằng trình duyệt: https://classroom-2cw6zo0ty-hrn-bks-projects.vercel.app/ (Cộng điểm → chọn học sinh → bảng +1/Hủy; Random → normal/instant và chọn theo học sinh/tổ/nhóm; Thi đua → tạo tuần/ngày/loại). Không tạo dữ liệu hay cộng điểm trên web tham chiếu. Tổ/Nhóm áp dụng theo loại trận đã chọn trong game.

Giữ repository và API đã có: roster game chỉ làm nguồn danh sách khi tạo tuần; điểm, phân đội và vắng mặt là snapshot riêng của tuần. Không đổi điểm game, Sao, nhiệm vụ hoặc trận thi đua nhóm. Không đổi schema/RLS hay triển khai Supabase.

Kiểm tra bằng dữ liệu minh họa ngoại tuyến, bao gồm từng trận độc lập, lọc không có kết quả, keyboard/focus, random và sidebar không tràn tại 1280×720, 1440×900, 1024×768.

Review Spec: không còn lỗi bắt buộc. Review Standards: đã sửa mất focus/đóng mục Điều chỉnh khi điểm danh; có test cho cả lỗi đồng bộ và retry thành công. Gợi ý không chặn về logic ứng viên/random được giữ trong phạm vi hiện tại: preview hiển thị tập ứng viên, bước bốc chọn thành viên có thêm bước chọn tổ/nhóm trước.

59 contract Node đạt; lượt browser đầy đủ 262 bài đạt trước khi bổ sung test hồi quy điểm danh. Ảnh dùng dữ liệu giả lưu tại `test-results/ui-review/compact-*.png`, `weekly-point-panel.png`, `weekly-random-selection.png`.

Sau sửa review, 8 kiểm thử `weekly-classroom-interactions.spec.cjs` đạt, gồm test điểm danh mới cho lỗi/retry/focus. Tổng cộng 263 bài browser riêng biệt đã được kiểm tra trong lượt đầy đủ và lượt hồi quy.
