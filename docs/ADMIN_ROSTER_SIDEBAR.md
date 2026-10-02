# Quản lý học sinh và thi đua — 02/10/2026

## Phạm vi đã duyệt

- Khung trái theo Soạn đề: tiêu đề/icon, Quay về; Danh sách học sinh → Tổ → Nhóm → Chờ phê duyệt; bộ lọc hiện tại và Tổ/Nhóm tùy chọn.
- Khung phải giữ hồ sơ hiện có, bốn cột trên laptop/tablet; nút thêm đổi theo tab và ẩn ở Chờ phê duyệt.
- Bỏ hero “Dữ liệu lớp học…Roster” và hero giải thích “Nhiệm vụ & thi đua…Admin only”.
- Nút map học sinh có gradient hồng, viền LED hồng; tắt chuyển động khi giảm hiệu ứng.
- Các tab nhiệm vụ nằm cạnh tiêu đề: Nhiệm vụ Cá nhân, Thi đua Nhóm, Thi đua tuần. Thi đua tuần chỉ hiển thị “Sắp cập nhật giao diện”.

## Quyết định lưu bản nháp

Người dùng chọn tạo và phân thành viên dạng bản nháp trên trình duyệt, chưa đồng bộ Supabase. Module `src/modules/student-roster-drafts.js` bổ sung các thao tác tạo/sửa/xóa và lọc theo thành viên. Bản nháp lưu ở localStorage của origin hiện tại, khóa `student-roster-drafts:v1:<Admin id hoặc username>`. Không ghi vào `app.data.users`, không gọi Supabase hay nối bản nháp vào nhóm của trận thi đua.

Mỗi bản nháp gồm id, loại (`sections` là Tổ, `groups` là Nhóm), tên và danh sách username. Chỉ chọn học sinh đã duyệt từ roster hiện có. Mỗi học sinh thuộc tối đa một tổ và một nhóm; tên không trùng trong cùng loại. Cho phép tạo tổ/nhóm trống để bổ sung thành viên sau. Học sinh đã xóa hoặc chờ duyệt không được hiển thị trong danh sách thành viên.

Bản nháp được mở lại trên cùng trình duyệt/origin/tài khoản Admin; không đồng bộ giữa máy hay giữa tài khoản. Xóa dữ liệu trình duyệt sẽ mất bản nháp. Tách khóa theo Admin giúp tránh dùng nhầm bản nháp trong UI, không phải cơ chế bảo mật thay thế Supabase RLS. Nội dung nhập được mã hóa khi render, thao tác kiểm tra Admin; lỗi đọc/lưu trình duyệt hiển thị rõ và không giả báo lưu thành công.

## Thiết kế và xác minh

Giữ ngôn ngữ Soạn đề: nền navy `#071827`, panel `#092637`, chữ `#f4fbff`, phụ đề `#8eb8d0`; điểm nhấn học sinh hồng `#ec4899/#f9a8d4`, thi đua amber. Dùng font game hiện có, không thêm dependency. Khung lớn cố định trong viewport; chỉ rail bộ lọc và danh sách/form bên phải có cuộn nội bộ.

Kiểm thử Playwright dùng dữ liệu minh họa tại 1280×720, 1440×900, 1024×768: bố cục, bốn cột, tab/nút thêm, bộ lọc, lưu/mở lại bản nháp, tách Admin, không ghi roster/Supabase; chuyển ba tab thi đua; keyboard và giảm chuyển động. Không có DevTools MCP trong môi trường nên dùng Playwright theo checklist repo. Chạy các spec liên quan rồi toàn bộ `npm test` trước bàn giao.
