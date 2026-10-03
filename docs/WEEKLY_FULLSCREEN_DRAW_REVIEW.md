# Trình chiếu Sao băng và kết quả toàn màn hình

Người dùng yêu cầu bỏ đường cắt ô cả ở Cộng điểm, tăng ô Chọn ngẫu nhiên
theo ô Cộng điểm, đặt nút chọn dưới danh sách và phóng lớn kết quả toàn màn hình.

Thẻ khi duyệt giữ chiều cao tối thiểu 90px, tên/điểm rõ, gradient nhưng không
còn pseudo-element vòng tròn. Khi bấm nút cuối danh sách, native dialog mở sân
khấu toàn màn hình: toàn bộ 31 ô và nút cuối hiện cùng lúc, thẻ co theo chiều cao
viewport. Thời lượng vẫn 6 giây. Kết thúc mở dialog tên/điểm lớn và nút cộng điểm
hoặc quay về danh sách; có hiệu ứng phóng lớn, tắt khi reduced motion.

Dialog đăng ký với modal manager hiện có để focus/Tab/Escape không đóng nhầm
giao diện cha. Hủy lượt không ghi kết quả; refresh giữa lượt khôi phục sân khấu.
Review Standards phát hiện refresh sau khi chọn làm mất màn hình kết quả: đã
giữ trạng thái dialog mở qua refresh, và kiểm tra cùng kết quả vẫn hiện.

Review Spec kiểm tra diff và ảnh laptop/tablet: không có finding bắt buộc.
Không thay dependency, Supabase, dữ liệu, quyền hay logic điểm/chọn ngẫu nhiên.
Playwright dùng dữ liệu giả; không chạy DevTools MCP vì chưa khả dụng.
Kiểm tra 1280×720, 1440×900, 1024×768: 31 ô vừa sân khấu; ô duyệt ≥90px;
nút sau danh sách; dialog kết quả rộng/cao đúng viewport; Escape/đóng trả focus;
light/dark, reduced motion, cộng điểm từ kết quả và refresh.

Kết quả: `npm test` đạt 59 tệp Node và 293 ca Chromium; kiểm tra bổ sung
3 kích thước dark/light đạt sau khi tăng tương phản nút đóng ở light mode.
Review Standards kiểm tra lại lifecycle sau sửa: không còn finding bắt buộc.
