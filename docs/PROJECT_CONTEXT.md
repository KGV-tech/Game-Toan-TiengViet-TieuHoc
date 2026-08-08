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

## Dữ liệu và bảo mật

- Ứng dụng dùng Supabase từ trình duyệt.
- `supabase_auth_security.sql` là migration bảo mật/RLS cho kiến trúc dùng Supabase Auth. Chỉ chạy khi người phụ trách xác nhận đúng dự án đích và frontend tương ứng đã sẵn sàng.
- `supabase_rls.sql` đã ngưng dùng; không chứa migration để thực thi.
- Không gửi secrets, thông tin học sinh, token, mật khẩu hoặc dữ liệu Supabase thật cho Kimi.

## Trạng thái kiểm thử

- Hiện có kiểm thử Node.js (`test_*.cjs`) cho bảo mật, giao diện, câu hỏi, đề thi, học sinh và dữ liệu thú cưng.
- Chưa có Playwright được cấu hình trong repo. Vì vậy không được kết luận một thay đổi đã kiểm thử trên trình duyệt nếu chưa thực sự chạy Playwright hoặc kiểm tra thủ công.

## Gói ngữ cảnh cho một yêu cầu

Khi giao việc cho Codex hoặc Kimi, luôn kèm:

1. Mục tiêu và hành vi mong muốn.
2. Link commit hoặc nhánh chính xác.
3. Các tệp liên quan và kết quả kiểm thử gần nhất.
4. Ràng buộc: không thay đổi Supabase, không xóa dữ liệu, không refactor ngoài phạm vi.

Với Kimi web, dùng URL commit cố định thay vì chỉ đưa tên nhánh để tránh đọc cache cũ.
