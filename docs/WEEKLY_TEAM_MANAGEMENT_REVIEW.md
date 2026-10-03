# Quản lý Tổ/Nhóm trong tuần

Yêu cầu: số lượng Tổ/Nhóm, tự chia ngẫu nhiên cân bằng, Admin chọn học sinh,
sửa/xóa từng Tổ/Nhóm. Người dùng xác nhận “tự chọn” là hệ thống chia ngẫu nhiên.

Nút Phân Tổ/Nhóm mở bản xem trước theo số lượng 1 đến sĩ số tuần. Tự chia
dùng Fisher–Yates và phân lần lượt nên chênh lệch sĩ số tối đa một. Chế độ
Admin cho chọn bằng dropdown từng học sinh. Tên và bảng số lượng cập nhật
trước khi lưu; danh sách của cùng loại trong tuần được thay sau khi Lưu.
Nút thêm từng Tổ/Nhóm vẫn có; sửa giữ ID và cập nhật tên/thành viên.

Xóa cần xác nhận trong giao diện. Học sinh chưa phân được gom vào danh sách
Chưa phân tổ/nhóm của tuần. Tên này dành riêng cho placeholder, không dùng
cho Tổ/Nhóm mới; sửa placeholder thành tên khác biến nó thành Tổ/Nhóm thật.
Mã placeholder mới có hậu tố tránh trùng mã đã dùng, ổn định khi retry.

Dùng RPC setWeekTeams hiện có: không thêm schema/dependency, không chạy SQL
hay sửa dữ liệu thật khi phát triển. RPC/version/Admin vẫn kiểm tra ở biên
lưu. Điểm cá nhân, roster, các tuần khác và loại Tổ/Nhóm còn lại được giữ.
Async chỉ cập nhật UI khi còn đúng tuần/form; lỗi giữ form và trạng thái
disabled trước lưu; thao tác lặp bị khóa trong lúc lưu.

Form phân hàng loạt vừa canvas; chỉ preview bên trong được cuộn. Có label,
legend, focus ban đầu và Tab qua tên. Playwright mock Supabase kiểm tra
1280×720, 1440×900, 1024×768 và ảnh light mode 31 học sinh. Không có DevTools
MCP trong môi trường, dùng browser Playwright theo checklist repo.

## Spec review

Finding trùng ID khi đổi tên placeholder rồi bỏ thành viên đã được sửa;
có ca hồi quy qua UI. Review lại không còn finding bắt buộc.

## Standards review

Finding mất focus khi đổi tên và phân loại bằng tên tự do đã được sửa:
đổi nhãn option bằng textContent, giữ input; xác thực tên dành riêng.
Review lại không còn finding bắt buộc. Code giới hạn ở module tuần, không
refactor main.js. Dữ liệu tên/username được escape trước khi render.

Kiểm thử cuối: toàn bộ 59 tệp Node và 302 ca Chromium đạt. Các ca mới kiểm
tra sửa/xóa/hủy xóa, đổi tên placeholder rồi bỏ thành viên, số lượng 4 với
9 học sinh (3/2/2/2), phân thủ công, giữ điểm/loại còn lại, tên dành riêng,
Tab qua tên, lỗi lưu/retry và canvas 31 học sinh tại ba viewport.
