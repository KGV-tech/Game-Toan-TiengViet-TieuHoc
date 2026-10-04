# Light mode xuyên các trạm — 04/10/2026

## Yêu cầu và phạm vi

Rà toàn bộ light mode để nền, chữ và trạng thái tương tác đồng nhất từ chọn bài
đến làm bài/kết quả, cùng các trạm và giao diện giáo viên. Ưu tiên laptop
1280×720, 1440×900 và tablet ngang 1024×768.

Các lỗi tái hiện: Kho Báu của giáo viên bị ép dùng dark mode; Hướng dẫn, nhiệm vụ,
cửa hàng, chọn bài, làm đề và kết quả có lớp nền tối cố định; lộ trình học có chữ
tối trên rail tối và chữ trắng trên nền sáng; summary Công cụ Excel, hàng Bài học
được chọn và các thẻ câu hỏi con của Soạn đề thiếu màu nền light mode.

## Cách sửa

- Bỏ nhánh CSS ép Kho Báu Admin luôn tối; Kho Báu dùng context `student` cho cả
  học sinh và giáo viên xem thành tích/lịch sử/hồ sơ, còn workspace quản trị giữ
  context `admin` và theme quản trị riêng.
- Thêm lớp `station-light-theme.css` cuối chuỗi stylesheet. Chỉ áp dụng trên màn
  hình khi theme là light; dùng nền xanh pastel, chữ xanh đậm, màu vàng/đỏ/xanh
  đậm cho trạng thái. Không đổi bố cục hay cơ chế game.
- Tạo màu sáng cho từng surface con có nền cố định, gồm cả hồ sơ học sinh,
  hộp chọn kiểu in và hộp tiếp tục bài làm. Sprite/nền bản đồ và hình máy thú cưng,
  vòng quay giữ nguyên artwork.
- Không thay đổi logic chọn ngẫu nhiên, quyền, dữ liệu, Supabase hoặc CSS in đề.

## Kiểm chứng

Playwright offline chụp chuỗi màn hình lõi và các modal trên ba viewport. Bổ sung
assertion nền sáng ở các surface từng bị tối, màu chữ tối có tương phản tối thiểu
4.5:1 cho các chữ được chọn kiểm tra trên màu nền tham chiếu của thẻ sáng,
không tràn ngang document, chuyển lại
dark mode và không phát sinh console error hay request Supabase thật.

Trước sửa: test 1440×900 thất bại ở nền chọn bài. Sau sửa: test chuyên biệt đạt
trên cả ba viewport; đã kiểm tra ảnh các trạm, kết quả và form biên soạn bên trong.
Kiểm tra tương phản là regression cho các chữ đã chọn, không phải chứng nhận
WCAG toàn giao diện. Review đặc tả và standards đã xử lý các finding về bảng
thưởng Hướng dẫn, form cấu hình câu con và trạng thái chọn trên bảng thành tích.

Quality gate cuối: `npm test` đạt toàn bộ 59 tệp kiểm thử Node và 319 kiểm thử
Chromium (4,4 phút). `git diff --check` đạt. Không gọi Supabase thật trong audit.
