# Quản lý Tổ và Thi đua tuần

## Phạm vi ngày 02/10/2026

- Giữ roster hiện tại của game, không nhập roster từ trang tham chiếu.
- Bỏ Nhóm khỏi quản lý học sinh; chỉ Danh sách học sinh, Tổ, Chờ phê duyệt.
- Bộ lọc tìm kiếm/cấp lớp/lớp/giới tính/Tổ áp dụng cho cả roster, thẻ Tổ và form thành viên. Đổi cấp lớp xóa lựa chọn lớp/Tổ cũ; đổi lớp lập tổ xóa thành viên đã chọn để tránh ghép khác lớp.
- Form Tổ có chọn lớp, 4 cột thành viên trên laptop và 3 trên tablet, giữ lựa chọn khi tìm kiếm. Thẻ Tổ dùng gradient và viền theo sáu palette của Soạn đề; nút Lưu/Hủy/Sửa/Xóa cùng style mới.
- Thi đua tuần: Cộng điểm (+1/−1, tìm kiếm, vắng mặt), Chọn ngẫu nhiên (cá nhân/Tổ hoặc Nhóm/thành viên, Instant hoặc animation, không lặp), Thi đua (xếp hạng đội và cá nhân).
- Mỗi trận tuần chụp roster, đội và tên thành viên lúc tạo; điểm khởi đầu 0. Nhóm trong trận tuần chỉ thuộc trận đó. Điểm tuần không ghi vào điểm game, Sao, nhiệm vụ cá nhân hay team_competitions.

## Lưu dữ liệu và trust boundary

`classroom-repository.js` chỉ gọi 5 RPC cho các bảng classroom_* mới. Server xác nhận quyền admin bằng private.is_admin(); quyền giao diện không thay thế kiểm tra máy chủ. Học sinh và anonymous không đọc hoặc ghi được dữ liệu này. Authenticated admin chỉ SELECT trực tiếp; mọi ghi đi qua RPC SECURITY DEFINER với search_path rỗng.

Tổ kiểm tra học sinh đã duyệt, đúng lớp, tên duy nhất trong lớp và không trùng thành viên. Khóa transaction ngăn tạo Tổ đồng thời trùng thành viên; version ngăn ghi đè chỉnh sửa ở thiết bị khác.

Mỗi form dùng một UUID trong suốt lần soạn. Máy chủ nhận lại đúng UUID và nội dung đã tạo sẽ trả bản ghi hiện có, tránh tạo trùng khi phản hồi bị mất. Trận ngoại tuyến được giữ riêng khi kết nối lại; nút “Lưu trận lên máy chủ” nhập rõ ràng snapshot và điểm riêng của trận, không tự upload hay reset điểm. Các tuần mới vẫn bắt đầu từ 0.

Bản ghi đã đồng bộ chỉ được sửa khi có kết nối máy chủ. Cache được xem để tham khảo khi thiếu SDK; không nhận chỉnh sửa ngoại tuyến rồi ghi đè bằng server lúc kết nối lại.

Điểm khóa bản ghi tuần và ghi event UUID trong cùng transaction. Gửi lại cùng event không cộng lần hai. Các lượt điểm chỉ tham chiếu roster đã chụp của đúng tuần. Vắng mặt chỉ ảnh hưởng bốc thăm. Xóa/sửa Tổ không sửa đội của tuần cũ.

Khi có SDK/kết nối Supabase, chỉ đóng form sau xác nhận server. Lỗi migration/kết nối/quyền vẫn giữ nội dung form và không giả báo đã lưu. Khi không có SDK (offline fixture), có trạng thái rõ “chỉ lưu trên máy”. Bản nháp Tổ cũ được giữ và mở lại để chọn lớp rồi Lưu tổ; không tự đẩy dữ liệu cũ lên server.

## Migration cần duyệt riêng

Tệp: `supabase/migrations/20261002_classroom_sections_weekly.sql`.

Project frontend hiện cấu hình: **bjgbbrufnryrtimtzvhn**. Người phụ trách đã duyệt và migration đã chạy thành công trong SQL Editor đúng project ngày 02/10/2026 (“Success. No rows returned”). Không chạy supabase_rls.sql, không chạy lại auth migration, không seed hay thay đổi game_users.

Migration transaction tạo 3 bảng classroom_sections/classroom_weeks/classroom_point_events, SELECT policies và 5 RPC. Phụ thuộc private.is_admin() và game_users.class_name đã tồn tại. Có thể chạy lại DDL; không xóa dữ liệu hiện có. Khi rollout, kiểm tra admin tạo Tổ → tải lại ở thiết bị khác; học sinh bị từ chối; 2 tuần không chia sẻ điểm; gửi lại event không cộng trùng.

Kiểm tra metadata sau triển khai: 3 bảng, RLS đều bật, anon không có quyền đọc/ghi bảng, authenticated không có quyền ghi trực tiếp, 5 RPC đều SECURITY DEFINER và search_path rỗng. Không tạo dữ liệu thử trên production; hành vi lưu/điểm/retry được kiểm thử bằng fixtures. Bằng chứng cục bộ: tmp/classroom-supabase-migration.png và tmp/classroom-supabase-verified.png.

Rollback frontend: quay lại commit trước; giữ bảng để không mất lịch sử. Không DROP bảng để rollback.

Trang tham chiếu chức năng: https://classroom-2cw6zo0ty-hrn-bks-projects.vercel.app/.

## Bằng chứng kiểm thử và review

59 Node contracts và toàn bộ 250 Chromium tests qua. Kiểm tra visual ở 1280×720, 1440×900 và 1024×768 xác nhận lưới thành viên 4/3 cột, gradient, focus, không tràn khung lớn. Review Standards/Spec đã sửa các lỗi lớp form xung đột bộ lọc, tải chậm làm mất form, retry tạo trùng và mất dữ liệu ngoại tuyến khi kết nối lại. DevTools MCP chưa có; dùng Playwright theo fallback của repo.

Lần chạy 9 workers có một bài chụp ảnh space-launch đọc CSS quá sớm; chạy riêng bài đó qua và toàn suite chạy lại với 4 workers qua. Không thay đổi test hoặc code thi đua nhóm ngoài phạm vi để xử lý lần lỗi này.
