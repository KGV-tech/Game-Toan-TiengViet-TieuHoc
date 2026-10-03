# Năm cột và light mode quản lý thi đua

Yêu cầu: hoàn thiện nền/tiêu đề light mode trong quản lý thi đua; thu ngang
thẻ Chọn ngẫu nhiên thành 5 cột, đủ 31 học sinh và nút; đặt lại vòng cạnh
không lặp ở trên; bỏ khung lớn bên dưới, chỉ giữ nút chọn.

Lớp station-shell::before được đổi sang xanh pastel khi admin chọn light mode;
header/back có màu chữ tối phù hợp. CSS giới hạn theo workspace quản lý thi đua.
Danh sách chia 5 cột cả laptop và tablet, chiều cao hàng theo phần còn lại của
khung. Khu chọn chế độ/điều khiển thu gọn. Footer không nền/viền/icon/tiêu đề lớn.
Reset ở khu tùy chọn; khi trình chiếu fullscreen dùng Escape để hủy. Dialog
nhận focus vì nút chọn bị khóa trong lượt. Star ở sân khấu; sau lượt có dialog
kết quả lớn, thẻ nhỏ bên dưới chỉ dùng viền chọn để không che tên.

Thời lượng 6 giây, logic ngẫu nhiên, điểm, dialog kết quả và dữ liệu Supabase
giữ nguyên. Playwright dữ liệu giả kiểm tra 31 tên dài/5 cột/bounds, reset,
footer không viền, canvas light pastel/header, focus, reset/Escape, refresh,
reduced motion và cộng điểm. Kích thước 1280×720, 1440×900, 1024×768.
Không dùng DevTools MCP vì chưa khả dụng.

Review Spec/Standards phát hiện tên dài bị cắt dù grid vừa khung. Đã giảm
padding/gap và cỡ số điểm, bỏ bộ chọn đội bị vô hiệu hóa; thêm kiểm tra từng
child nằm trọn trong ô. Ảnh laptop/tablet xác nhận đủ tên và điểm. Hai review
kiểm tra lại: không còn finding bắt buộc.

Kiểm thử đầy đủ: 59 tệp Node và 294 ca Chromium đạt. Sau sửa containment,
3 ca viewport và toàn bộ 14 ca polish đạt.
