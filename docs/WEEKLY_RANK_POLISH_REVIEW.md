# Thu gọn sidebar và huy hiệu tuần thi đua

Yêu cầu: bỏ Tạo tuần mới/Tải lại ở khung trái, giữ tạo tuần tại tab Thi đua
bên phải; thay biểu tượng ba hạng đầu cho học sinh tiểu học.

Thay đổi: xóa markup và handler của hai nút trùng. Ba hạng đầu dùng ngôi sao
cười vàng/bạc/đồng, có số hạng và tên truy cập; giữ kích thước huy hiệu hiện có.
Không thay điểm, phép xếp hạng, dữ liệu hoặc Supabase. Không thêm dependency.

Review Standards và Spec độc lập: không có finding bắt buộc. Self-review xác nhận
escaping tên vẫn giữ nguyên, handler tạo tuần bên phải còn hoạt động, CSS chỉ nằm
trong khu vực tuần. Không có refactor cần thiết.

Kiểm tra runtime dùng Playwright (không chạy DevTools MCP): light/dark và sidebar
tại 1280×720, 1440×900, 1024×768; kiểm tra tạo tuần, tải dữ liệu khi form đang mở,
cập nhật khi random đang chạy. Browser chỉ dùng dữ liệu giả, không gọi Supabase thật.

Toàn bộ 59 tệp kiểm thử Node và 288 ca Chromium đạt.
Các hiệu ứng random mới là bản xem thử trong hội thoại, chờ lựa chọn của người dùng;
không nằm trong thay đổi game này.
