# Danh sách đầy đủ và vòng chọn ngầm

Phạm vi: weekly-workspace.js/css, admin-theme.css và kiểm thử polish.
Tiêu đề kết quả: “Bạn may mắn được chọn”. Sao băng light đỏ, dark vàng,
kể cả icon kết quả. Vòng chọn vẫn 6 giây.

Danh sách hiển thị đầy đủ ứng viên có mặt trong phạm vi đang chọn; pool
kết quả loại ID đã chọn khi bật Không lặp. Animation dùng pool hiển thị,
nhưng dừng tại kết quả từ pool hợp lệ. Không đánh dấu winner trên danh sách
sau lượt; giữ thứ tự và màu. Đặt lại vòng xóa ID nhớ. Chế độ đội/thành viên
vẫn dùng phạm vi đội và loại học sinh vắng. Hết ứng viên thì status bên trái
thông báo cần đặt lại vòng.

Laurel top 3 có ánh sáng nhẹ; reduced-motion giữ ánh sáng tĩnh. Light summary
dùng chữ tối; toolbar chọn tuần bỏ nền vàng. Không đổi Supabase, dependency,
dữ liệu điểm hoặc quyền admin.

## Standards

Review độc lập không có lỗi bắt buộc. Đã xóa CSS is-selected không còn dùng.

## Spec

Review phát hiện thông báo hết vòng bị ẩn và specificity màu star kết quả;
đã sửa status hiển thị và selector light, thêm assertion hồi quy.

Ca mới tái hiện lỗi trước sửa; kiểm tra ba lượt khác nhau, full roster
trong/sau animation, reset, status, màu dark/light, glow và reduced-motion.
Dùng Playwright mock Supabase; DevTools MCP chưa khả dụng. Viewport laptop/
tablet 1280×720, 1440×900, 1024×768 theo suite hiện có.

Kiểm thử cuối: 59 tệp Node và 296 ca Chromium đạt. Hai ca hồi quy chạy lại
sau assertion màu sao ở màn hình kết quả cũng đạt. Ảnh light ranking xác
nhận chữ rõ, nền pastel, toolbar đồng nhất và laurel có ánh sáng.
Review Spec kiểm tra lại không còn finding; Standards không có lỗi bắt buộc.
