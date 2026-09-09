# Bối cảnh dự án

## Mục tiêu

Đây là game web hỗ trợ học Toán và Tiếng Việt tiểu học. Người dùng chính là học sinh; giáo viên/quản trị viên quản lý học sinh, câu hỏi, đề thi và nhiệm vụ.

## Bản đồ mã nguồn

| Khu vực | Vai trò |
| --- | --- |
| `index.html` | Điểm vào ứng dụng và thứ tự tải script. |
| `src/main.js` | Logic game, đăng nhập, dữ liệu, quản trị và hiển thị chính. Tệp lớn; chỉ sửa phần liên quan. |
| `src/style.css`, `src/login-layout.css`, `src/map-layout.css` | Giao diện. |
| `src/question-templates/grade-4/` | Template sinh câu hỏi lớp 4. |
| `supabase/functions/admin-users/index.ts` | Edge Function cho thao tác quản trị người dùng. |
| `test_*.cjs` | Kiểm thử hợp đồng Node.js. |

### Hồ sơ học sinh và đăng nhập

- `game_users.classlevel` tiếp tục lưu cấp lớp dạng số (`1`–`5`) để các bộ lọc nội dung hiện có không thay đổi.
- `game_users.class_name` là lớp con do giáo viên đặt (ví dụ `4/4`); trường này có thể để trống với hồ sơ cũ.
- Học sinh chỉ nhập username ngắn (ví dụ `quanganh`). Ứng dụng tự ánh xạ username sang email nội bộ dạng `username@game.local` cho Supabase Auth; email kỹ thuật này không được hiển thị như thông tin đăng nhập cho học sinh.

## Dữ liệu và bảo mật

- Ứng dụng dùng Supabase từ trình duyệt.
- `supabase_auth_security.sql` là migration bảo mật/RLS cho kiến trúc dùng Supabase Auth. Chỉ chạy khi người phụ trách xác nhận đúng dự án đích và frontend tương ứng đã sẵn sàng.
- `supabase_rls.sql` đã ngưng dùng; không chứa migration để thực thi.
- `supabase_admin_demo_profile.sql` chỉ cấp cấu hình thử giao diện cho các tài khoản đã là Admin: avatar giáo viên nữ và ít nhất 1.000 kẹo. Chạy một lần trong Supabase SQL Editor của đúng dự án; tệp không tạo tài khoản và không thay đổi dữ liệu học sinh.
- Không gửi secrets, thông tin học sinh, token, mật khẩu hoặc dữ liệu Supabase thật cho Kimi.

## Trạng thái kiểm thử

- Hiện có kiểm thử Node.js (`test_*.cjs`) cho bảo mật, giao diện, câu hỏi, đề thi, học sinh và dữ liệu thú cưng.
- Playwright đã được cấu hình với Chromium headless, một server tĩnh cục bộ và test đầu tiên cho màn hình đăng nhập. Chạy `npm run test:browser` hoặc `npm test` để chạy nó.
- Test browser hiện không gọi Supabase thật; các luồng cần dữ liệu/tài khoản phải dùng dữ liệu thử nghiệm được phê duyệt riêng.

## Ưu tiên thiết bị

- Laptop/desktop và tablet ngang là nền tảng UI/UX chính.
- Điện thoại không phải nền tảng gameplay mục tiêu; điện thoại dọc chủ động hiện hướng dẫn xoay ngang.
- Không xếp đề xuất chỉ tối ưu điện thoại thành lỗi bắt buộc, trừ khi ảnh hưởng laptop/tablet, an toàn, khả năng truy cập hoặc làm ứng dụng vỡ nghiêm trọng.
- Xem quy định và kích thước kiểm thử cụ thể tại `docs/UX_DEVICE_POLICY.md`.

## Quy trình review hiện hành

Theo yêu cầu người dùng ngày 09/09/2026, Kimi review mặc định tắt cho mọi công việc tiếp theo; chỉ thực hiện trong phạm vi người dùng yêu cầu rõ ràng. Codex tự review và chạy kiểm thử phù hợp trước khi bàn giao. Quy trình và điều kiện merge được quy định tại `docs/AI_WORKFLOW.md`; không chờ kết quả Kimi khi người dùng chưa yêu cầu review.

## Gói ngữ cảnh cho một yêu cầu

Khi giao việc cho Codex, hoặc cho Kimi khi người dùng yêu cầu review, luôn kèm:

1. Mục tiêu và hành vi mong muốn.
2. Link commit hoặc nhánh chính xác.
3. Các tệp liên quan và kết quả kiểm thử gần nhất.
4. Ràng buộc: không thay đổi Supabase, không xóa dữ liệu, không refactor ngoài phạm vi.

Nếu người dùng yêu cầu dùng Kimi web, cung cấp URL commit cố định thay vì chỉ đưa tên nhánh để tránh đọc cache cũ.
