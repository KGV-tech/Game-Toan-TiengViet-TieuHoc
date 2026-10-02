# Đề xuất mở rộng Quản lý học sinh

Ngày khảo sát: 02/10/2026. Trạng thái: **đề xuất để duyệt**, chưa triển khai các chức năng mới hoặc thay đổi Supabase.

Nguồn: [Classroom Manager](https://classroom-2cw6zo0ty-hrn-bks-projects.vercel.app/).
Đã đọc cả năm mục điều hướng, các tab Học sinh/Tổ/Nhóm, chế độ sửa tên,
màn chọn học sinh để cộng điểm và biểu mẫu tạo tuần. Không lưu biểu mẫu,
cộng điểm, tạo tuần, đánh dấu nghỉ hoặc nhập/xóa dữ liệu trên website tham chiếu.
Các trạng thái sau thao tác ghi và bảng xếp hạng của tuần đã có dữ liệu chưa được
kiểm chứng vì trang hiện chưa có tổ, nhóm hoặc tuần thi đua. Không sao chép danh
sách hay thông tin học sinh của website vào game hoặc tài liệu này.

## Thay đổi thực hiện trong đợt này

- Hai nút Admin trên map, theo thứ tự: thông tin Admin → Quản lý học sinh → Quản lý Nhiệm vụ.
- Quản lý học sinh mở workspace hồ sơ hiện tại; giữ danh sách, bộ lọc, phê duyệt,
  thêm/sửa tài khoản, avatar và những thao tác quản trị hiện có.
- Quản lý Nhiệm vụ mở workspace cá nhân/nhóm hiện tại.
- Trạm Cài đặt chỉ mở Điều chỉnh. Hai màn quản lý không còn nằm trong tab Cài đặt.
- Học sinh không thấy nút quản lý; hàm mở và chuyển màn quản trị kiểm tra vai trò.
- Không đổi dữ liệu, schema, RLS, khóa API hoặc dependency.

## Đối chiếu chức năng

| Trang tham chiếu có | Cách áp dụng hợp lý vào game | Ưu tiên |
| --- | --- | --- |
| Thêm/sửa/xóa học sinh; xóa nhiều | Dùng hồ sơ game làm nguồn duy nhất; giữ luồng tài khoản hiện tại. Thao tác hàng loạt cần xem trước và xác nhận, ưu tiên chuyển tổ thay vì xóa tài khoản hàng loạt | Giữ hiện tại |
| Tổ | Tổ cố định thuộc một lớp, dùng cho quản lý lớp và thống kê; mỗi học sinh thuộc tối đa một tổ trong lớp | Giai đoạn 2 |
| Nhóm | Nhóm linh hoạt phục vụ hoạt động; chọn thành viên từ danh sách game và liên kết nhóm vào nhiệm vụ có sẵn | Giai đoạn 2 |
| Nghỉ học | Đánh dấu vắng theo ngày/buổi, loại khỏi bốc thăm trong buổi. Không đồng nhất nghỉ học với chờ duyệt hoặc khóa tài khoản | Giai đoạn 1 (trong buổi), 2 (lưu lịch sử) |
| Cộng 1 điểm cho một học sinh, có tìm kiếm | Điểm thi đua riêng, có lý do và lịch sử, có thao tác hoàn tác; không sửa trực tiếp tổng điểm học tập hoặc Sao | Giai đoạn 3 |
| Chọn ngẫu nhiên: cả lớp, tổ, nhóm, thành viên của tổ/nhóm | Lọc theo lớp hiện tại, chỉ chọn học sinh đã duyệt và có mặt; tùy chọn không lặp trong vòng, đặt lại vòng khi cần | Giai đoạn 1/2 |
| Normal có chuyển động và Instant | Mặc định kết quả nhanh; hiệu ứng tùy chọn, có kết quả bằng chữ và hỗ trợ giảm chuyển động | Giai đoạn 1 |
| Tuần thi đua: tên, ngày đầu/cuối, theo tổ hoặc nhóm; nút tạo tuần/reset điểm | Mỗi tuần là một kỳ riêng; kết thúc tuần đóng sổ và giữ lịch sử, tuần mới bắt đầu từ 0. Không reset điểm game | Giai đoạn 3 |
| Xuất/nhập toàn bộ JSON; nhập thay toàn bộ dữ liệu | Ưu tiên xuất báo cáo CSV/JSON theo lớp, bỏ thông tin đăng nhập. Nếu cần nhập, xem trước và ghép theo ID game, không thay toàn bộ danh sách | Giai đoạn 4 |
| Chế độ sáng/tối | Dùng hệ thống theme có sẵn trong game | Không cần hệ thống mới |

## Bố cục đề nghị

Trong **Quản lý học sinh**, bổ sung lần lượt các mục con:

1. **Hồ sơ**: danh sách/chờ duyệt/thêm học sinh hiện tại.
2. **Tổ & nhóm**: quản lý thành viên theo lớp.
3. **Hoạt động lớp**: có mặt/vắng trong buổi và chọn ngẫu nhiên.
4. **Điểm thi đua**: cộng điểm, lịch sử và bảng xếp hạng tuần.

Quản lý Nhiệm vụ tiếp tục chịu trách nhiệm giao bài và thi đua học tập của game.
Tổ/nhóm lớp là nguồn thành viên có thể chọn khi giao nhiệm vụ; không tạo thêm một
hệ thống giao bài song song. Bảng điểm hành vi trong lớp được phân biệt rõ với
kết quả nhiệm vụ học tập.

Màn hình giữ khung vừa viewport laptop/tablet ngang. Chỉ danh sách hoặc lịch sử
là khung con cuộn; bộ lọc lớp, trạng thái và các nút thao tác luôn dễ tiếp cận.

## Các lát triển khai để duyệt

### Giai đoạn 1 — chọn ngẫu nhiên từ danh sách game

Làm trước vì không cần ghi dữ liệu: dùng danh sách hồ sơ đã tải và bộ lọc lớp của
game; không gọi website tham chiếu. Có thể chọn học sinh vắng **trong buổi hiện
tại**, không lưu vào hồ sơ. Nhãn phải nói rõ trạng thái này mất khi tải lại trang.
Vòng chọn lưu trong bộ nhớ, tránh chọn lặp và đặt lại khi đổi lớp.

Tiêu chí: không chọn Admin/chờ duyệt/người ngoài lớp; xử lý danh sách rỗng, tất
cả đều vắng và hết vòng; hỗ trợ bàn phím, kết quả dễ đọc trên màn chiếu; không có
request ghi Supabase. Không tự thêm phần thưởng khi bốc thăm.

### Giai đoạn 2 — tổ/nhóm và điểm danh có lưu

Trước khi viết migration, khảo sát mô hình thành viên của nhiệm vụ nhóm hiện tại
để quyết định phần nào dùng lại. Định danh thành viên bằng ID hồ sơ game, không
bằng họ tên hoặc thứ tự thẻ. Tổ thuộc lớp và thành viên không được trỏ sang lớp
khác. Điểm danh lưu theo ngày/buổi, không sửa `approved`.

Đề xuất lưu tập trung trong Supabase để dùng nhiều thiết bị. Cần duyệt schema,
phạm vi Admin được quản lý và RLS trên dự án đích trước khi triển khai. Không
dùng localStorage làm nguồn chính cho dữ liệu lớp cần đồng bộ.

Tiêu chí: giữ nguyên ID và danh sách học sinh; kiểm tra quyền trên máy chủ;
chuyển lớp/thành viên có quy tắc rõ; lưu thất bại có thông báo và không hiện thành
công giả; học sinh không tự sửa tổ, điểm danh hoặc danh sách thành viên.

### Giai đoạn 3 — sổ điểm thi đua và tuần

Mỗi lần cộng/điều chỉnh điểm là một sự kiện có học sinh, kỳ, số điểm, lý do, người
thực hiện và thời gian. Hoàn tác bằng sự kiện bù, giữ dấu vết. Máy chủ xử lý cập
nhật đồng thời và chống ghi trùng khi bấm nhiều lần. Tổng điểm tuần tính từ sổ
điểm; lịch sử tuần giữ nguyên khi bắt đầu tuần mới.

Cần duyệt cách xếp hạng tổ/nhóm: tổng điểm dễ hiểu nhưng ưu ái nhóm đông; có thể
hiển thị thêm trung bình trên thành viên. Chốt quy tắc học sinh chuyển nhóm giữa
tuần và múi giờ Asia/Saigon trước khi triển khai. Không kết nối điểm này vào Sao
hoặc phần thưởng game khi chưa có quyết định riêng.

### Giai đoạn 4 — báo cáo và nhập có xem trước

Xuất theo lớp/kỳ với trường tối thiểu, không xuất mật khẩu, token hoặc thông tin
Auth. CSV phải xử lý giá trị có thể bị phần mềm bảng tính hiểu thành công thức.
Nhập chỉ cập nhật trường được cho phép sau khi đối chiếu ID; báo dòng lỗi, bản
ghi trùng và tác động trước khi xác nhận. Không áp dụng cơ chế thay toàn bộ dữ
liệu của trang tham chiếu cho danh sách tài khoản game.

## Khuyến nghị duyệt

Duyệt **Giai đoạn 1** trước: chọn ngẫu nhiên theo lớp, không lặp, loại học sinh
vắng trong buổi. Sau khi thử trong giờ học, chốt tổ/nhóm và chính sách điểm thi
đua rồi mới duyệt Giai đoạn 2–3. Giai đoạn 4 ưu tiên báo cáo xuất trước, nhập sau.
Mọi triển khai Supabase/production cần xác nhận riêng đúng dự án theo quy tắc repo.
