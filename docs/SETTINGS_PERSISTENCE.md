# Xác nhận lưu mốc học và cài đặt

Admin lưu mốc và chính sách đủ điểm qua app.data.saveSettings tới bảng game_settings,
hàng id=1, thuộc dự án bjgbbrufnryrtimtzvhn. Không dùng upsert hay tự tạo hàng mới.

Trước bản sửa, UPDATE không trả error được coi là thành công, kể cả UPDATE không
ảnh hưởng hàng nào hoặc SDK chưa tải và chỉ lưu localStorage. Điều này có thể
làm Admin thấy mốc mới nhưng reload/học sinh vẫn nhận mốc cũ từ máy chủ.

Bản sửa chụp snapshot, UPDATE với select('id,data').single(), kiểm tra hàng trả về,
rồi SELECT lại cùng id=1. Cả hai phải đúng snapshot mới cache và báo thành công.
So sánh JSON theo giá trị, không phụ thuộc thứ tự khóa JSONB. Mạng lỗi, SDK thiếu,
không có hàng, bị từ chối quyền hoặc dữ liệu đọc lại khác đều trả lỗi; UI không báo
đã lưu và khôi phục giá trị trước thao tác. Cache lỗi không được coi là lưu lên server.

Thông báo PGRST116/42501 hướng dẫn kiểm tra quyền ghi hoặc đăng nhập lại. Không tự
nới RLS, chèn dữ liệu hay đổi schema. Nếu xác nhận thất bại sau UPDATE, phép ghi
có thể đã xảy ra; tải lại cài đặt để xác định trạng thái trước khi thử lại.

Kiểm thử dùng Supabase giả lập, không ghi production. Test regression tái hiện
UPDATE không ảnh hưởng hàng nào nhưng trước đây vẫn báo đã lưu; ca thành công
kiểm tra cả UPDATE lẫn SELECT, cùng chính sách điểm, lỗi mạng và JSONB đổi thứ tự.
Các test UI cũ được cấp fixture server, không còn giả định lưu offline thành công.

Chưa kiểm chứng phiên Auth Admin đang mở trên production. Lỗi xác nhận phía client
đã tái hiện, nhưng chưa kết luận nguyên nhân riêng của lần Admin lưu bài 9 là RLS,
phiên đăng nhập, hàng thiếu hay một thao tác khác ghi đè. SQL đọc-only kèm theo
có thể kiểm tra mốc hiện tại và các quyền mà không thay đổi dữ liệu.
Đường đăng nhập cũng lọc đúng id=1, thay vì lấy hàng đầu tùy thứ tự. Realtime
chỉ nhận id=1. Truy vấn settings ID dùng EQ: helper trước đó dùng ILIKE cho
mọi filter, không hợp với ID dạng số và có thể khiến refresh không nhận dữ liệu.
Test SDK boundary đăng nhập/realtime/refresh giữ hàng id=1 dù có hàng id=2 cũ.
