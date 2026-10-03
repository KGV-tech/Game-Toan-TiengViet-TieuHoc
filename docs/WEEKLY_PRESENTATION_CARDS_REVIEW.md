# Danh sách trình chiếu Sao băng

## Yêu cầu

Thay các viên dài bằng thẻ chữ nhật bo góc, giữ gradient phân biệt học sinh,
bỏ đường tròn trang trí trông như vết nứt. Danh sách 31 học sinh phải vừa
một màn hình trước, trong và sau lượt chọn; Sao băng vẫn chạy cố định 6 giây.

## Triển khai và kiểm tra

Chỉ sửa module/CSS Thi đua tuần và kiểm thử liên quan. Grid chia 5 cột laptop,
4 cột tablet, phân bổ chiều cao còn lại cho các hàng. Thu gọn bộ điều khiển;
trong lượt chọn ẩn bộ chọn chế độ, dùng vùng kết quả nhỏ để tăng kích thước thẻ.
Tên được xuống dòng, không cắt bằng ellipsis; điểm có nhãn riêng. Bỏ pseudo-element
trang trí ở thẻ học sinh, chế độ và kết quả. Đặt lại tọa độ ngôi sao sau khi chuyển
khung điều khiển sang sidebar để vị trí cuối đúng ô được chọn.

Kiểm thử hồi quy đã đỏ với giao diện cũ. Kiểm tra DOM, screenshot và chiều cao
31 học sinh với tên dài tại 1280×720, 1440×900, 1024×768, cả trước/trong/sau
lượt chọn và vị trí ngôi sao cuối. Dùng Playwright dữ liệu giả; DevTools MCP
không khả dụng. Không thay dữ liệu Supabase, schema, dependency hay thời lượng.

Self-review Standards: phạm vi nhỏ, escaping tên giữ nguyên, không đổi logic
chọn/điểm; đã loại một dòng đặt tọa độ bị trùng. Self-review Spec: thẻ bo góc,
không còn đường trang trí, danh sách vừa khung và ngôi sao dừng đúng ô.
Hai agent review độc lập không chạy được do giới hạn dịch vụ; không coi là đã
nhận review độc lập. Codex đã tự kiểm tra diff và ảnh thực tế.

`npm test`: toàn bộ 59 tệp Node và 293 ca Chromium đạt. Kiểm tra bổ sung
light mode dùng cùng các kích thước và danh sách 31 học sinh.
