# Thi đua tuần theo lớp

Lớp phụ trách được chọn đầu tiên và ghi nhớ riêng theo Admin trên trình duyệt.
Danh sách tuần, học sinh, Tổ, Nhóm, random và bảng xếp hạng chỉ dùng lớp đó.
Học sinh/Tổ/Nhóm mở nội dung ở khung phải; bên dưới là ba chức năng Cộng điểm,
Chọn ngẫu nhiên, Thi đua. Sidebar vừa laptop/tablet ngang, nội dung dài cuộn trong
khung con bên phải. Cả dark và light giữ gradient nhận diện của game.

Tổ của tuần theo Tổ dùng snapshot thành viên khi tạo tuần. Với tuần theo Nhóm,
tab Tổ đọc Tổ của lớp; tab Nhóm đọc nhóm riêng được phân trong form tạo tuần.
Các điểm đều đọc từ scores của tuần đang chọn; không cập nhật điểm, Sao hay trận
thi đua nhóm của game. Chưa tạo tuần vẫn xem roster và random học sinh trong lớp,
nhưng chưa cộng điểm. Tuần mới có bảng điểm 0 và giữ lịch sử tuần cũ.

Random gồm tất cả học sinh, Tổ, Tổ → học sinh, Nhóm, Nhóm → học sinh.
Luôn có delay 1,2/2/3 giây; reduced-motion chỉ tắt animation, không bỏ delay.
Chọn theo tổ/nhóm rồi học sinh chọn đều tổ/nhóm đủ điều kiện trước, sau đó chọn
đều thành viên; học sinh vắng và kết quả đã chọn trong vòng bị loại. Đổi lớp,
tuần, chức năng hoặc chế độ hủy kết quả animation cũ.

Thi đua gồm quản lý tuần, form tạo tuần theo Tổ/Nhóm và bảng xếp hạng Cá nhân/Tổ/
Nhóm. Xóa tuần cần xác nhận tên tuần; RPC kiểm tra Admin và version, khóa tuần,
xóa event điểm của đúng tuần rồi xóa tuần trong một transaction. Lỗi máy chủ
không xóa bản trong cache. Migration 20261002_classroom_delete_week.sql cần được
duyệt riêng trước triển khai; không gọi RPC mới vào Supabase thật trong test.

Ngày 03/10/2026: người phụ trách đã duyệt và migration xóa tuần được áp dụng vào
bjgbbrufnryrtimtzvhn. Kiểm tra catalog xác nhận SECURITY DEFINER, search_path rỗng,
chặn anon và cho authenticated gọi hàm (hàm vẫn kiểm tra Admin). Không xóa tuần
hay điểm thật để thử nghiệm.

Khung Quản lý học sinh dùng cùng khoảng mép 99vw/98vh, padding 10px và gap 10px
với quản lý thi đua. Rail bố trí bộ lọc hai cột, tìm kiếm nguyên hàng; các lựa
chọn tất cả dùng nhãn ngắn vì tên bộ lọc đã có ở phía trên. Nút theme 40×40 chỉ
icon nhưng giữ aria-label/title. Mọi nền Admin light dùng xanh pastel; gradient
màu riêng của từng loại thẻ vẫn được giữ.
