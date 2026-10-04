# Thi đua tuần Offline

## Phạm vi

Offline lưu các tuần, điểm, điểm danh, tổ/nhóm của tuần và danh sách học sinh
tối thiểu theo tài khoản trên cùng trình duyệt, cùng địa chỉ website. Có nút
Offline để chuẩn bị và nút Đồng bộ để gửi hàng chờ khi có mạng. Không tự gửi khi
mạng trở lại; không thay đổi điểm, sao, bài làm hoặc nhiệm vụ của game chính.

Giao diện mở lại được qua Service Worker sau khi chuẩn bị thành công. Chế độ
mở bản lưu chỉ cho Thi đua tuần; không xác thực thay cho Supabase và không cấp
quyền máy chủ. Đồng bộ yêu cầu `auth.getUser()` trả đúng ID tài khoản đã lưu,
các RPC hiện có tiếp tục kiểm tra Admin/RLS. ID hồ sơ dùng cho bản lưu, Auth UID
được lưu riêng để kiểm tra phiên đăng nhập; hai ID không cần bằng nhau. Mở bản
lưu cục bộ luôn giữ chế độ ghi hàng chờ, kể cả sau đồng bộ; muốn dùng Online
trực tiếp phải quay về và đăng nhập thật. Không có migration/dependency mới.

## Lưu và đồng bộ

- Snapshot và hàng chờ nằm trong cùng một bản ghi localStorage, chỉ cập nhật
  giao diện sau khi ghi thành công. Không lưu token, mật khẩu, lịch sử học tập.
- Điểm dùng event ID cố định. Tạo tuần dùng ID cố định và payload cố định khi
  gửi lại. Server đã có RPC chống xử lý lặp cho hai thao tác này.
- Tổ/nhóm, điểm danh và xóa dùng phiên bản tuần. Xung đột dừng đồng bộ và giữ
  các thao tác còn lại, không ghi đè. Nếu mất phản hồi sửa tổ/điểm danh, chỉ xác
  nhận lại khi phiên bản tiếp theo và nội dung máy chủ trùng hoàn toàn.
- Mỗi phản hồi thành công được ghi nhận trước khi gửi thao tác kế tiếp. Revision
  cục bộ và Web Locks ngăn cửa sổ cũ ghi đè dữ liệu cửa sổ khác. Trong lúc đồng
  bộ khóa sửa; trình duyệt thiếu Web Locks không được bật Offline.
- Tài nguyên tĩnh được lưu bằng Cache API; không cache Supabase/API/CDN hay
  phản hồi xác thực. Tải online ưu tiên mạng, chỉ dùng bản tĩnh khi mất kết nối.

## Cách dùng

1. Khi có mạng, đăng nhập giáo viên và mở Thi đua tuần. Bấm **Offline**, chờ
   nút chuyển thành **Offline ✓** trước khi ngắt mạng.
2. Ghi điểm, điểm danh, tạo/xóa tuần và sửa tổ/nhóm như bình thường. Trạng thái
   ghi số thao tác chưa đồng bộ. Không tự gửi chỉ vì kết nối trở lại.
3. Nếu đã đóng trang, mở lại đúng website và chọn tài khoản ở nút **Mở Thi đua
   tuần Offline** dưới form đăng nhập.
4. Khi có mạng, bấm **Đồng bộ**. Phiên đăng nhập đúng tài khoản còn hiệu lực sẽ
   được xác minh; nếu hết phiên, chọn **Đăng nhập Online**, đăng nhập đúng giáo
   viên rồi mở Thi đua tuần để đồng bộ. Hàng chờ vẫn giữ qua bước đăng nhập.
5. Xung đột cần kiểm tra riêng, không bấm ghi đè; dùng **Sao lưu** để giữ bản
   JSON chứa snapshot và các thao tác chưa gửi.

## Lưu ý về thiết bị

Chuẩn bị trước khi mất mạng trên thiết bị riêng của giáo viên. Dữ liệu chỉ có
trên trình duyệt đã chuẩn bị; đổi domain/profile hoặc xóa dữ liệu website sẽ
không còn bản Offline. Có chức năng xuất bản sao JSON để giữ các thao tác chưa
đồng bộ. Các lỗi storage phải báo rõ, không hiển thị thành công giả.

## Kiểm chứng

Đã đạt toàn bộ 60 bộ kiểm thử Node và 332 kiểm thử Playwright Chromium.
Các ca Offline kiểm tra mất mạng/mở lại trang, hàng chờ bền vững, gửi lại sau
mất phản hồi, đúng tài khoản, xung đột phiên bản và bố cục laptop/tablet ngang.
Kiểm thử dùng Supabase giả lập, không ghi dữ liệu vào dự án thật. Self-review
và hai lượt review Standards/Spec không còn lỗi bắt buộc; npm audit báo 0 lỗi.

Nguồn: [Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers),
[Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache/addAll).
