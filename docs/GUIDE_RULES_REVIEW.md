# Cập nhật Hướng dẫn theo cơ chế hiện tại — 06/10/2026

Phạm vi: nội dung bảng Hướng dẫn trong `index.html`, tiêu đề/lời mở đầu theo vai trò trong `app.showGuide()`. Không đổi cơ chế chơi, quyền truy cập hoặc dữ liệu máy chủ.

## Nguồn đối chiếu

- `src/modules/learning-path.js` và `docs/PRACTICE_COMPLETION_AND_PASS_POLICY.md`: 10 câu/lượt, điểm qua bài riêng mỗi môn, mặc định 8; mốc giáo viên; thống kê hôm nay và thời gian.
- `src/main.js`: chọn bài/chủ đề, chấm và lời giải, bản nháp, thư viện template/soạn đề, nhiệm vụ, trưởng nhóm, kỹ năng thú cưng và vòng quay.
- `src/modules/daily.js`: 5 năng lượng/ngày, thưởng lượt đầu ngày, chuỗi 5 ngày liên tiếp (không giới hạn thứ Hai–thứ Sáu), quà ngày.
- `docs/CLASSROOM_WEEKLY_MANAGEMENT.md` và `docs/TEAM_COMPETITION_SPEC.md`, đối chiếu giao diện trong `src/main.js`: phân biệt điểm thi đua tuần với trận làm bài theo nhóm.

## Nội dung theo vai trò

Học sinh đọc từ đăng nhập, bản đồ, chọn bài đến trả lời, xem kết quả, qua bài, thống kê và các trạm. Nêu rõ số lượt hoàn thành khác số bài đạt điều kiện; điểm các lượt không cộng dồn; thời gian chỉ cộng trong lúc làm các lượt hoàn chỉnh. Giữ thông tin thú cưng, Sao và danh hiệu, sửa nội dung đã cũ.

Admin đọc cùng quy tắc của học sinh để giải thích cho lớp, cộng phần quản lý riêng: duyệt/hồ sơ/Tổ, template và đề, mốc học, checkbox và điểm từng môn, thời gian, test bài, nhiệm vụ và hai loại thi đua. Tiêu đề/lời mở đầu đổi theo vai trò; mục Admin và liên kết mục lục ẩn với học sinh.

## Kiểm chứng

Kiểm thử mục lục trỏ đúng phần đang hiển thị, focus, Escape, chuyển học sinh → Admin → học sinh, khung không tràn và nội dung chỉ cuộn trong panel con ở 1280×720, 1440×900 và 1024×768. Kiểm thử không gọi Supabase thật. Review yêu cầu và tiêu chuẩn không có lỗi bắt buộc.

Toàn bộ hợp đồng Node và 367 kiểm thử trình duyệt đạt. Sau khi rút gọn tiêu đề Admin để tránh nút đóng, chạy lại toàn bộ hợp đồng Node và 5 kiểm thử hướng dẫn; đều đạt. Ảnh tablet xác nhận phần Admin đọc được trong khung nội dung cuộn riêng.
