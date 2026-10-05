# Gỡ đường vào Thi đua tuần không xác thực

Yêu cầu người dùng ngày 05/10/2026: không hiển thị bộ chọn giáo viên và nút Thi đua tuần ở màn login; không cho bản lưu trên máy mở quyền giáo viên.

## Nguyên nhân và thay đổi

`weekly-offline-ui.js` đọc registry tài khoản cục bộ, thêm hai control vào login rồi `resume()` tự gán `currentUser.role = admin`. Việc giới hạn workspace không thay thế đăng nhập: người dùng máy vẫn mở được dữ liệu thi đua cục bộ của giáo viên.

Đã bỏ `resume()`, `initEntry()`, ghi registry tài khoản và các ngoại lệ `weeklyOfflineEntry` ở bootstrap, realtime, quản trị và outbox. Không chỉ dùng CSS để giấu control. Chuẩn bị Offline cần phiên Admin đang đăng nhập, `auth.getUser()` khớp `auth_user_id` và phiên không đổi qua các bước bất đồng bộ. Các kiểm tra owner/Admin và xác thực đồng bộ của repository được giữ.

Offline tiếp tục dùng trong phiên giáo viên đã đăng nhập. Tải lại khi không có mạng không tự mở quyền từ cache; cần đăng nhập hợp lệ để mở quản trị. Dữ liệu tuần và thao tác chờ đồng bộ trong localStorage được giữ. Không thay schema/RLS, API key hoặc dữ liệu Supabase.

Cache shell nâng lên v2; worker mới xóa đúng cache tài nguyên tĩnh v1 có giao diện/logic cũ, không xóa dữ liệu tuần. App kiểm tra cập nhật worker hiện có; URL module/main đổi phiên bản. Thiết bị đang giữ bản cũ hoàn toàn offline cần kết nối mạng và tải lại để nhận bản sửa.

## Kiểm chứng

- Test đỏ trước sửa tái hiện control xuất hiện từ bản lưu cũ ở 1280×720, 1440×900, 1024×768.
- Sáu test browser liên quan đạt: login không có control; bản lưu không tự cấp role; chuẩn bị Offline bị từ chối khi chưa đăng nhập hoặc Auth khác tài khoản; cache shell v1 bị loại bỏ; phiên giáo viên hợp lệ vẫn ghi điểm offline và đồng bộ; tải lại giữ dữ liệu nhưng về login.
- Các hợp đồng Node đạt, gồm `test_weekly_offline.cjs`, `test_step5_performance_contract.cjs`.
- Cổng đầy đủ `npm test` đạt: toàn bộ hợp đồng Node và 353 kiểm thử Chromium (5,3 phút).
- Review độc lập Spec/security và Standards so với `0dff18b`: không có finding P1/P2 bắt buộc. Kiểm thử không gọi Supabase thật.

Các kiểm tra frontend không thay thế quyền máy chủ; cổng RPC và Supabase Auth hiện có tiếp tục quyết định quyền đồng bộ. Không tuyên bố đã kiểm toán RLS production trong task này.
